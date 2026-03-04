"use client";

import { useState, useEffect, useCallback } from "react";
import { generateId } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Plus,
  MessageSquare,
  BarChart3,
  Send,
  Trash2,
  ScrollText,
} from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import type { ReviewProject, FeedbackItem, ReviewPoint } from "@/lib/review-types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "personal-site-review-projects";
const FEEDBACK_TYPES = [
  { id: "meta", label: "메타리뷰" },
  { id: "ae", label: "AE 코멘트" },
  { id: "other", label: "기타" },
] as const;

function loadProjects(): ReviewProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return (Array.isArray(parsed) ? parsed : []).map((p: ReviewProject) => ({
      ...p,
      reviewPoints: (p.reviewPoints ?? []).map((pt) => ({
        ...pt,
        reviewerIndex: pt.reviewerIndex ?? 0,
      })),
    }));
  } catch {
    return [];
  }
}

function saveProjects(projects: ReviewProject[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // ignore
  }
}

function createEmptyProject(paperId = ""): ReviewProject {
  return {
    id: generateId(),
    paperId: paperId.trim() || `paper-${Date.now()}`,
    incomingReviews: [],
    reviewPoints: [],
    feedbacks: [],
    updatedAt: new Date().toISOString(),
  };
}

type Tab = "reviews" | "analysis" | "response" | "document" | "feedback";

export default function ReviewsPage() {
  const mounted = useMounted();
  const [projects, setProjects] = useState<ReviewProject[]>([]);
  const [current, setCurrent] = useState<ReviewProject | null>(null);
  const [tab, setTab] = useState<Tab>("reviews");
  const [loading, setLoading] = useState(false);
  const [loadingPointId, setLoadingPointId] = useState<string | null>(null);
  const [aiPromptByPointId, setAiPromptByPointId] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [documentFeedback, setDocumentFeedback] = useState("");

  useEffect(() => {
    if (mounted) {
      const loaded = loadProjects();
      setProjects(loaded);
      if (loaded.length > 0 && !current) setCurrent(loaded[0]);
    }
  }, [mounted]);

  const persistCurrent = useCallback((updated: ReviewProject) => {
    const withTime = { ...updated, updatedAt: new Date().toISOString() };
    setProjects((prev) => {
      const next = [
        withTime,
        ...prev.filter((p) => p.id !== updated.id),
      ].slice(0, 30);
      saveProjects(next);
      return next;
    });
    setCurrent(withTime);
  }, []);

  const addProject = () => {
    const p = createEmptyProject();
    setProjects((prev) => {
      const next = [p, ...prev];
      saveProjects(next);
      return next;
    });
    setCurrent(p);
    setTab("reviews");
  };

  const addReview = () => {
    if (!current) return;
    const updated: ReviewProject = {
      ...current,
      incomingReviews: [...current.incomingReviews, ""],
    };
    persistCurrent(updated);
  };

  const updateReview = (idx: number, text: string) => {
    if (!current) return;
    const next = [...current.incomingReviews];
    next[idx] = text;
    const updated = { ...current, incomingReviews: next };
    setCurrent(updated);
    setProjects((prev) => {
      const arr = [
        { ...updated, updatedAt: new Date().toISOString() },
        ...prev.filter((p) => p.id !== current.id),
      ].slice(0, 30);
      saveProjects(arr);
      return arr;
    });
  };

  const removeReview = (idx: number) => {
    if (!current) return;
    persistCurrent({
      ...current,
      incomingReviews: current.incomingReviews.filter((_, i) => i !== idx),
    });
  };


  const handleExtractPoints = async () => {
    if (!current?.incomingReviews.some((r) => r.trim()) || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review-extract-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: current.incomingReviews.filter((r) => r.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      const points: ReviewPoint[] = (data.points ?? []).map(
        (p: { reviewerIndex?: number; label: string; reviewerText: string; section?: string }) => ({
          id: generateId(),
          reviewerIndex: p.reviewerIndex ?? 0,
          label: p.label || "P",
          reviewerText: p.reviewerText || "",
          myRebuttal: "",
          section: p.section,
        })
      );
      persistCurrent({ ...current!, reviewPoints: points });
    } catch (e) {
      setError(e instanceof Error ? e.message : "점 추출 실패");
    } finally {
      setLoading(false);
    }
  };

  const updatePointRebuttal = (pointId: string, myRebuttal: string) => {
    if (!current) return;
    const updated = {
      ...current,
      reviewPoints: current.reviewPoints.map((p) =>
        p.id === pointId ? { ...p, myRebuttal } : p
      ),
    };
    setCurrent(updated);
    setProjects((prev) => {
      const arr = [
        { ...updated, updatedAt: new Date().toISOString() },
        ...prev.filter((p) => p.id !== current.id),
      ].slice(0, 30);
      saveProjects(arr);
      return arr;
    });
  };

  const handleSuggestRebuttal = async (point: ReviewPoint) => {
    if (loading) return;
    setLoadingPointId(point.id);
    setError(null);
    const userPrompt = aiPromptByPointId[point.id]?.trim() ?? "";
    try {
      const res = await fetch("/api/review-suggest-rebuttal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: point.label,
          reviewerText: point.reviewerText,
          userPrompt: userPrompt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      updatePointRebuttal(point.id, data.suggested ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "제안 생성 실패");
    } finally {
      setLoadingPointId(null);
    }
  };

  const handleBuildFinalResponse = () => {
    if (!current) return;
    const byReviewer = new Map<number, ReviewPoint[]>();
    for (const p of current.reviewPoints.filter((x) => x.myRebuttal.trim())) {
      const list = byReviewer.get(p.reviewerIndex) ?? [];
      list.push(p);
      byReviewer.set(p.reviewerIndex, list);
    }
    const sectionOrder = [
      "Summary Of Weaknesses",
      "Comments Suggestions And Typos",
    ];
    const parts: string[] = [];
    for (const ri of [...byReviewer.keys()].sort((a, b) => a - b)) {
      const pts = byReviewer.get(ri)!;
      const bySection = new Map<string, ReviewPoint[]>();
      pts.forEach((p) => {
        const sec =
          p.section ?? (p.label.startsWith("W") ? "Summary Of Weaknesses" : "Comments Suggestions And Typos");
        const list = bySection.get(sec) ?? [];
        list.push(p);
        bySection.set(sec, list);
      });
      parts.push(`## Reviewer ${ri + 1}\n`);
      for (const sec of sectionOrder.filter((s) => bySection.has(s))) {
        parts.push(`### ${sec}\n`);
        for (const p of bySection.get(sec)!) {
          parts.push(
            `**${p.label}**\n\n**Reviewer:**\n${p.reviewerText}\n\n**Response:**\n${p.myRebuttal.trim()}\n\n`
          );
        }
      }
    }
    const markdown = parts.join("---\n\n");
    persistCurrent({ ...current!, myResponse: markdown });
    setTab("document");
  };

  const handleReviseDocument = async () => {
    if (!current?.myResponse?.trim() || !documentFeedback.trim() || loading)
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review-revise-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: current.myResponse,
          feedback: documentFeedback,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      persistCurrent({
        ...current!,
        myResponse: data.revised ?? current!.myResponse,
      });
      setDocumentFeedback("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const handlePolish = async () => {
    if (!current?.myResponse?.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review-polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: current.myResponse, template: "custom" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      persistCurrent({
        ...current!,
        myResponse: data.polished ?? data.message ?? current!.myResponse,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "다듬기 실패");
    } finally {
      setLoading(false);
    }
  };

  const addFeedback = () => {
    if (!current) return;
    const f: FeedbackItem = {
      id: generateId(),
      type: "meta",
      text: "",
      addedAt: new Date().toISOString(),
    };
    persistCurrent({
      ...current,
      feedbacks: [...current.feedbacks, f],
    });
  };

  const updateFeedback = (id: string, updates: Partial<FeedbackItem>) => {
    if (!current) return;
    const updated = {
      ...current,
      feedbacks: current.feedbacks.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    };
    setCurrent(updated);
    setProjects((prev) => {
      const arr = [
        { ...updated, updatedAt: new Date().toISOString() },
        ...prev.filter((p) => p.id !== current.id),
      ].slice(0, 30);
      saveProjects(arr);
      return arr;
    });
  };

  const removeFeedback = (id: string) => {
    if (!current) return;
    persistCurrent({
      ...current,
      feedbacks: current.feedbacks.filter((f) => f.id !== id),
    });
  };

  const handleReviseWithFeedback = async () => {
    if (!current?.myResponse?.trim() || loading) return;
    const hasFeedback = current.feedbacks.some((f) => f.text.trim());
    if (!hasFeedback) {
      setError("피드백을 추가한 뒤에 수정해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review-revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myResponse: current.myResponse,
          feedbacks: current.feedbacks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류 발생");
      persistCurrent({
        ...current!,
        myResponse: data.revised ?? current!.myResponse ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (!current?.myResponse) return;
    try {
      await navigator.clipboard.writeText(current.myResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "reviews", label: "받은 리뷰", icon: MessageSquare },
    { id: "analysis", label: "구조적 분석 (W,C)", icon: BarChart3 },
    { id: "response", label: "내 답변", icon: FileText },
    { id: "document", label: "최종 문서", icon: ScrollText },
    { id: "feedback", label: "메타리뷰/AE", icon: Sparkles },
  ];

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              논문 리뷰
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              받은 리뷰 → W1,Q1 분해 → 점별 답변 → 마크다운 문서 → 피드백으로 수정
            </p>
          </div>
        </div>
        <button
          onClick={addProject}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          <Plus size={18} />
          새 논문
        </button>
      </motion.div>

      <div className="flex gap-4">
        <div className="w-48 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm">
          <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
            논문 목록
          </p>
          {projects.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">논문을 추가해보세요</p>
          ) : (
            <ul className="space-y-1">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setCurrent(p);
                      setTab("reviews");
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      current?.id === p.id
                        ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                        : "text-[var(--foreground)] hover:bg-[var(--muted)]/30"
                    )}
                  >
                    {p.paperId.startsWith("paper-")
                      ? "제목 없음"
                      : p.paperId}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {current ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={current.paperId}
                  onChange={(e) => {
                    const updated = { ...current!, paperId: e.target.value };
                    setCurrent(updated);
                    setProjects((prev) => {
                      const arr = [
                        { ...updated, updatedAt: new Date().toISOString() },
                        ...prev.filter((p) => p.id !== current!.id),
                      ].slice(0, 30);
                      saveProjects(arr);
                      return arr;
                    });
                  }}
                  placeholder="Paper ID / 논문 제목"
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--border)] p-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        tab === t.id
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/20"
                      )}
                    >
                      <t.icon size={16} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {tab === "reviews" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">받은 리뷰 저장</h3>
                    <button
                      onClick={addReview}
                      className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]/30"
                    >
                      <Plus size={14} />
                      리뷰 추가
                    </button>
                  </div>
                  {current.incomingReviews.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 p-8 text-center">
                      <p className="text-sm text-[var(--muted-foreground)]">
                        받은 리뷰를 붙여넣어 저장하세요. 리뷰어별로 추가할 수 있어요.
                      </p>
                      <button
                        onClick={addReview}
                        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                      >
                        첫 리뷰 추가
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {current.incomingReviews.map((text, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-[var(--border)]"
                        >
                          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/10 px-3 py-2">
                            <span className="text-sm font-medium">
                              리뷰어 {i + 1}
                            </span>
                            <button
                              onClick={() => removeReview(i)}
                              className="rounded p-1 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <textarea
                            value={text}
                            onChange={(e) => updateReview(i, e.target.value)}
                            placeholder="리뷰 텍스트 붙여넣기..."
                            rows={6}
                            className="w-full resize-y rounded-b-lg border-0 bg-[var(--background)] px-4 py-3 text-sm focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "analysis" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">
                      W1, Q1... 점별 구분 (구조적 분석)
                    </h3>
                    <button
                      onClick={handleExtractPoints}
                      disabled={
                        !current.incomingReviews.some((r) => r.trim()) ||
                        loading
                      }
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <BarChart3 size={18} />
                      )}
                      점별로 분해하기
                    </button>
                  </div>
                  {current.reviewPoints.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 p-8 text-center">
                      <p className="text-sm text-[var(--muted-foreground)]">
                        &quot;Summary Of Weaknesses:&quot; 와 &quot;Comments Suggestions And Typos:&quot; 섹션만
                        엔터 기준으로 분해해요.
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        리뷰 탭에서 리뷰 저장 후 실행해주세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Array.from(
                        new Set(
                          current.reviewPoints.map((p) => p.reviewerIndex)
                        )
                      )
                        .sort((a, b) => a - b)
                        .map((ri) => {
                          const pts = current.reviewPoints.filter(
                            (p) => p.reviewerIndex === ri
                          );
                          const bySection = new Map<string, typeof pts>();
                          pts.forEach((p) => {
                            const sec =
                              p.section ?? (p.label.startsWith("W") ? "Summary Of Weaknesses" : "Comments Suggestions And Typos");
                            const list = bySection.get(sec) ?? [];
                            list.push(p);
                            bySection.set(sec, list);
                          });
                          const sectionOrder = [
                            "Summary Of Weaknesses",
                            "Comments Suggestions And Typos",
                          ];
                          return (
                            <div
                              key={ri}
                              className="rounded-lg border border-[var(--border)] overflow-hidden"
                            >
                              <div className="bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                                리뷰어 {ri + 1}
                              </div>
                              {sectionOrder
                                .filter((s) => bySection.has(s))
                                .map((sec) => (
                                  <div key={sec}>
                                    <div className="border-t border-[var(--border)] bg-[var(--muted)]/20 px-4 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                                      {sec}
                                    </div>
                                    <div className="divide-y divide-[var(--border)]">
                                      {(bySection.get(sec) ?? []).map((point) => (
                                        <div key={point.id}>
                                          <div className="border-b border-[var(--border)] bg-[var(--muted)]/10 px-4 py-1.5">
                                            <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                                              {point.label}
                                            </span>
                                          </div>
                                          <div className="whitespace-pre-wrap p-4 text-sm">
                                            {point.reviewerText}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "response" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
                >
                  <h3 className="mb-4 font-semibold">
                    각 W1, C1...에 답변하기
                  </h3>
                  {current.reviewPoints.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 p-8 text-center">
                      <p className="text-sm text-[var(--muted-foreground)]">
                        구조적 분석 탭에서 리뷰를 분해한 뒤
                        여기서 각 점에 답변을 작성해주세요.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6">
                        {Array.from(
                          new Set(
                            current.reviewPoints.map((p) => p.reviewerIndex)
                          )
                        )
                          .sort((a, b) => a - b)
                          .map((ri) => {
                            const pts = current.reviewPoints.filter(
                              (p) => p.reviewerIndex === ri
                            );
                            const bySection = new Map<string, typeof pts>();
                            pts.forEach((p) => {
                              const sec =
                                p.section ?? (p.label.startsWith("W") ? "Summary Of Weaknesses" : "Comments Suggestions And Typos");
                              const list = bySection.get(sec) ?? [];
                              list.push(p);
                              bySection.set(sec, list);
                            });
                            const sectionOrder = [
                              "Summary Of Weaknesses",
                              "Comments Suggestions And Typos",
                            ];
                            return (
                              <div
                                key={ri}
                                className="rounded-lg border border-[var(--border)] overflow-hidden"
                              >
                                <div className="bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                                  리뷰어 {ri + 1}
                                </div>
                                {sectionOrder
                                  .filter((s) => bySection.has(s))
                                  .map((sec) => (
                                    <div key={sec}>
                                      <div className="border-t border-[var(--border)] bg-[var(--muted)]/20 px-4 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                                        {sec}
                                      </div>
                                      <div className="divide-y divide-[var(--border)]">
                                        {(bySection.get(sec) ?? []).map((point) => (
                                    <div
                                      key={point.id}
                                      className="rounded-none border-0"
                                    >
                                      <div className="flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--muted)]/10 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="font-mono text-sm font-semibold text-[var(--accent)]">
                                          {point.label}
                                        </span>
                                        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
                                          <input
                                            type="text"
                                            value={aiPromptByPointId[point.id] ?? ""}
                                            onChange={(e) =>
                                              setAiPromptByPointId((prev) => ({
                                                ...prev,
                                                [point.id]: e.target.value,
                                              }))
                                            }
                                            placeholder="추가 지시 (예: 더 짧게, 논문 5페이지 참조)"
                                            className="flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs focus:border-[var(--accent)] focus:outline-none"
                                          />
                                          <button
                                            onClick={() =>
                                              handleSuggestRebuttal(point)
                                            }
                                            disabled={
                                              loadingPointId !== null ||
                                              loadingPointId === point.id
                                            }
                                            className="shrink-0 flex items-center gap-1 rounded-md bg-[var(--accent)]/10 px-2 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                                          >
                                            {loadingPointId === point.id ? (
                                              <Loader2
                                                size={12}
                                                className="animate-spin"
                                              />
                                            ) : (
                                              <Sparkles size={12} />
                                            )}
                                            AI 제안
                                          </button>
                                        </div>
                                      </div>
                                      <div className="rounded-b-lg bg-amber-50/50 p-3 dark:bg-amber-950/20">
                                        <p className="text-xs font-medium text-[var(--muted-foreground)]">
                                          리뷰어
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm">
                                          {point.reviewerText}
                                        </p>
                                      </div>
                                      <div className="border-t border-[var(--border)] p-3">
                                        <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">
                                          내 답변
                                        </p>
                                        <textarea
                                          value={point.myRebuttal}
                                          onChange={(e) =>
                                            updatePointRebuttal(
                                              point.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder="이 지적에 대한 rebuttal 작성..."
                                          rows={4}
                                          className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                        />
                                      </div>
                                        </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            );
                          })}
                      </div>
                      <button
                        onClick={handleBuildFinalResponse}
                        disabled={!current.reviewPoints.some((p) => p.myRebuttal.trim())}
                        className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
                      >
                        마크다운 전체 문서 생성
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {tab === "document" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">최종 Rebuttal 문서</h3>
                    <button
                      onClick={copyResponse}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--muted)]/30"
                    >
                      <Copy size={16} />
                      {copied ? "복사됨!" : "복사"}
                    </button>
                  </div>
                  {current.myResponse ? (
                    <div className="space-y-4">
                      <div className="max-h-[400px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre className="whitespace-pre-wrap font-sans text-sm">
                            {current.myResponse}
                          </pre>
                        </div>
                      </div>
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/10 p-4">
                        <p className="mb-2 text-sm font-medium">
                          수정 피드백 (예: &quot;Q2 부분을 더 구체적으로&quot;)
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={documentFeedback}
                            onChange={(e) =>
                              setDocumentFeedback(e.target.value)
                            }
                            placeholder="어떻게 수정할지 피드백을 입력..."
                            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                          />
                          <button
                            onClick={handleReviseDocument}
                            disabled={
                              !documentFeedback.trim() || loading
                            }
                            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                          >
                            {loading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Send size={18} />
                            )}
                            수정 적용
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          피드백을 주고 수정 적용을 반복하면 문서를 계속
                          다듬을 수 있어요.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 p-8 text-center">
                      <p className="text-sm text-[var(--muted-foreground)]">
                        내 답변 탭에서 각 점에 답변을 작성한 뒤
                        &quot;마크다운 전체 문서 생성&quot;을 실행해주세요.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "feedback" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">
                      메타리뷰 / AE 코멘트 등 피드백
                    </h3>
                    <button
                      onClick={addFeedback}
                      className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]/30"
                    >
                      <Plus size={14} />
                      피드백 추가
                    </button>
                  </div>
                  <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                    메타리뷰나 AE 코멘트를 추가하면, "피드백 반영하여 수정"으로
                    내 답변에 반영할 수 있어요.
                  </p>
                  {current.feedbacks.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-6 text-center">
                      <p className="text-sm text-[var(--muted-foreground)]">
                        아직 피드백이 없어요. 메타리뷰나 AE 코멘트를 추가해보세요.
                      </p>
                      <button
                        onClick={addFeedback}
                        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                      >
                        피드백 추가
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {current.feedbacks.map((f) => (
                        <div
                          key={f.id}
                          className="rounded-lg border border-[var(--border)]"
                        >
                          <div className="flex gap-2 border-b border-[var(--border)] bg-[var(--muted)]/10 p-2">
                            <select
                              value={f.type}
                              onChange={(e) =>
                                updateFeedback(f.id, {
                                  type: e.target
                                    .value as FeedbackItem["type"],
                                })
                              }
                              className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs"
                            >
                              {FEEDBACK_TYPES.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => removeFeedback(f.id)}
                              className="ml-auto rounded p-1 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <textarea
                            value={f.text}
                            onChange={(e) =>
                              updateFeedback(f.id, { text: e.target.value })
                            }
                            placeholder="피드백 내용..."
                            rows={3}
                            className="w-full resize-y rounded-b-lg border-0 bg-[var(--background)] px-4 py-3 text-sm focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      ))}
                      <button
                        onClick={handleReviseWithFeedback}
                        disabled={
                          loading ||
                          !current.myResponse?.trim() ||
                          !current.feedbacks.some((f) => f.text.trim())
                        }
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        피드백 반영하여 수정
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/10 py-16">
              <FileText size={48} className="text-[var(--muted)]" />
              <p className="mt-4 text-[var(--muted-foreground)]">
                논문을 추가하거나 선택해주세요
              </p>
              <button
                onClick={addProject}
                className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                새 논문 추가
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
