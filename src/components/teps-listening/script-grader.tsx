"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScriptGradeResult, ScriptGradeStatus } from "./types";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  const words1 = new Set(s1.split(/\s+/).filter(Boolean));
  const words2 = s2.split(/\s+/).filter(Boolean);
  const matchCount = words2.filter((w) => words1.has(w)).length;
  return words2.length > 0 ? Math.round((matchCount / words2.length) * 100) : 0;
}

function gradeScript(userScript: string, correctScript: string): ScriptGradeResult {
  const similarity = getSimilarity(userScript, correctScript);
  let status: ScriptGradeStatus;
  let message: string;
  if (similarity >= 90) {
    status = "perfect";
    message = `✅ 훌륭해요! ${similarity}% 일치합니다.`;
  } else if (similarity >= 70) {
    status = "fair";
    message = `⚠️ ${similarity}% 일치합니다.`;
  } else {
    status = "poor";
    message = `❌ ${similarity}% 일치합니다.`;
  }
  return { status, similarity, message };
}

const statusStyles: Record<ScriptGradeStatus, string> = {
  perfect: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  fair: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  poor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

interface ScriptGraderProps {
  correctScript: string;
}

export function ScriptGrader({ correctScript }: ScriptGraderProps) {
  const [userScript, setUserScript] = useState("");
  const [result, setResult] = useState<ScriptGradeResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleGrade = () => {
    const trimmed = userScript.trim();
    if (!trimmed) {
      alert("스크립트를 입력해주세요.");
      return;
    }
    if (!correctScript) {
      alert("data.json에 script를 입력한 후 채점하세요.");
      return;
    }
    setResult(gradeScript(trimmed, correctScript));
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">스크립트 받아쓰기</p>

      <textarea
        value={userScript}
        onChange={(e) => setUserScript(e.target.value)}
        placeholder="들리는 대로 영어로 입력하세요..."
        rows={5}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      />

      <div className="flex gap-2">
        <button
          onClick={handleGrade}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          스크립트 채점
        </button>
        <button
          onClick={() => setShowAnswer((v) => !v)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        >
          {showAnswer ? "정답 숨기기" : "정답 스크립트 보기"}
        </button>
      </div>

      {result && (
        <div className={cn("rounded-lg px-4 py-2.5 text-sm font-medium", statusStyles[result.status])}>
          {result.message}
        </div>
      )}

      {showAnswer && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <p className="text-xs font-semibold text-[var(--muted)] mb-1.5">정답 스크립트</p>
          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
            {correctScript || "(책에서 확인)"}
          </p>
        </div>
      )}
    </div>
  );
}
