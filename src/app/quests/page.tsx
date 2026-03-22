"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, addDays, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Swords } from "lucide-react";
import {
  getQuestsByDate,
  addQuest,
  toggleQuest,
  deleteQuest,
  getStats,
  RARITY_CONFIG,
  type Quest,
  type QuestInput,
} from "@/lib/quests";
import { getRoutineQuestsForDate, toggleRoutineCompletion, removeRoutine, seedRoutines, getAllRoutines } from "@/lib/routines";
import {
  pullFromSupabase,
  upsertQuestToSupabase,
  deleteQuestFromSupabase,
  upsertStatsToSupabase,
  syncRoutinesToSupabase,
  deleteRoutineFromSupabase,
  upsertRoutineCompletionToSupabase,
} from "@/lib/quest-sync";
import { QuestCard } from "@/components/quests/quest-card";
import { AddQuestModal } from "@/components/quests/add-quest-modal";
import { DailyStats } from "@/components/quests/daily-stats";
import { LevelBadge } from "@/components/quests/level-badge";
import { StreakBadge } from "@/components/quests/streak-badge";
import { AchievementBadges } from "@/components/quests/achievement-badges";
import { XpToast } from "@/components/quests/xp-toast";
import { RoutineManagerModal } from "@/components/quests/routine-manager-modal";
import { AiChatTab } from "@/components/quests/ai-chat-tab";
import type { AiQuestItem } from "@/lib/ai-quest-schema";

export default function QuestsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quests, setQuests] = useState<(Quest & { isRoutine?: boolean })[]>([]);
  const [activeTab, setActiveTab] = useState<"quests" | "ai">("quests");
  const [modalOpen, setModalOpen] = useState(false);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const [xpToast, setXpToast] = useState<{ show: boolean; xp: number }>({
    show: false,
    xp: 0,
  });

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  useEffect(() => {
    // Supabase에서 먼저 pull → localStorage 채움 → 루틴 시딩 → 렌더
    pullFromSupabase().then(() => {
      seedRoutines([
        { title: "TEPS 리스닝 1세트 풀기", rarity: "rare" },
        { title: "TEPS 단어 20개 외우기", rarity: "normal" },
      ]);
      syncRoutinesToSupabase(getAllRoutines());
      setSyncKey((k) => k + 1);
      setSelectedDate(new Date());
    });
  }, []);

  const refreshQuests = () => {
    if (!dateStr) return;
    const routineQuests = getRoutineQuestsForDate(dateStr);
    const customQuests = getQuestsByDate(dateStr);
    const all = [...routineQuests, ...customQuests];
    all.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    setQuests(all);
  };

  useEffect(() => {
    if (dateStr) refreshQuests();
  }, [dateStr]);

  const handleAddQuest = (data: {
    title: string;
    description?: string;
    rarity: QuestInput["rarity"];
    xp: number;
  }) => {
    const quest = addQuest({
      ...data,
      date: dateStr,
    });
    setQuests((prev) => {
      const next = [...prev, quest];
      next.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      return next;
    });
    upsertQuestToSupabase(quest);
    upsertStatsToSupabase(getStats());
  };

  const handleToggle = (id: string) => {
    if (id.startsWith("routine-")) {
      const routineId = id.slice(8);
      const quest = quests.find((q) => q.id === id);
      const wasCompleted = quest?.completed ?? false;
      const nowCompleted = toggleRoutineCompletion(routineId, dateStr);
      refreshQuests();
      if (nowCompleted && !wasCompleted && quest) handleComplete(quest.xp);
      upsertRoutineCompletionToSupabase(routineId, dateStr, nowCompleted);
      upsertStatsToSupabase(getStats());
    } else {
      const updated = toggleQuest(id);
      if (updated) {
        setQuests((prev) => {
          const next = prev.map((q) => (q.id === id ? { ...updated } : q));
          next.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
          return next;
        });
        if (updated.completed) handleComplete(updated.xp);
        upsertQuestToSupabase(updated);
        upsertStatsToSupabase(getStats());
      }
    }
  };

  const handleAddAiQuest = (item: AiQuestItem) => {
    const config = RARITY_CONFIG[item.rarity];
    handleAddQuest({
      title: item.title,
      rarity: item.rarity,
      xp: config.xp,
    });
  };

  const handleComplete = (xp: number) => {
    setXpToast({ show: true, xp });
    setTimeout(() => setXpToast((t) => ({ ...t, show: false })), 2000);
  };

  const handleDelete = (id: string) => {
    if (id.startsWith("routine-")) {
      const routineId = id.slice(8);
      removeRoutine(routineId);
      refreshQuests();
      deleteRoutineFromSupabase(routineId);
      upsertStatsToSupabase(getStats());
    } else {
      deleteQuest(id);
      setQuests((prev) => prev.filter((q) => q.id !== id));
      deleteQuestFromSupabase(id);
      upsertStatsToSupabase(getStats());
    }
  };

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-6 md:mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 md:px-8 pb-6 md:pb-8 pt-5 md:pt-8 shadow-sm">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
              <Swords size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                일일 퀘스트
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                매일 미션을 완료하고 레벨업하세요
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRoutineModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <span className="text-lg">🔄</span>
              매일 루틴
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <Plus size={20} />
              퀘스트 추가
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* 날짜 선택 */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <button
          onClick={() => setSelectedDate((d) => subDays(d ?? new Date(), 1))}
          className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-[var(--foreground)]" suppressHydrationWarning>
            {selectedDate ? format(selectedDate, "yyyy년 M월 d일 (EEE)", { locale: ko }) : "—"}
          </h2>
          {selectedDate && isToday(selectedDate) && (
            <span className="mt-1 inline-block rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
              오늘
            </span>
          )}
        </div>
        <button
          onClick={() => setSelectedDate((d) => addDays(d ?? new Date(), 1))}
          className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* 사이드 패널: 레벨, 스트릭, 업적 */}
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
          <LevelBadge key={`level-${syncKey}`} />
          <StreakBadge key={`streak-${syncKey}`} />
          <AchievementBadges key={`achievements-${syncKey}`} />
        </div>

        {/* 메인: 탭 (퀘스트 | AI 채팅) */}
        <div className="flex-1">
          {/* 탭 바 */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setActiveTab("quests")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "quests"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80"
              }`}
            >
              퀘스트
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "ai"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80"
              }`}
            >
              AI 채팅
            </button>
          </div>

          {activeTab === "ai" ? (
            <AiChatTab
              dateStr={dateStr}
              quests={quests.map((q) => ({
                title: q.title,
                completed: q.completed,
                isRoutine: q.isRoutine,
              }))}
              onAddQuest={handleAddAiQuest}
              disabled={!dateStr}
            />
          ) : (
            <>
              <DailyStats
            date={dateStr}
            quests={quests.map((q) => ({ completed: q.completed, xp: q.xp }))}
          />

          <div className="mt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
              퀘스트 목록
            </h3>

            {quests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-12 text-center"
              >
                <Swords size={48} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)]">이날 퀘스트가 없어요</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]/80">
                  &quot;매일 루틴&quot;으로 반복 퀘스트를 설정하거나, 퀘스트를 추가해보세요
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setRoutineModalOpen(true)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                  >
                    매일 루틴 설정
                  </button>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                  >
                    퀘스트 추가하기
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {quests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onComplete={handleComplete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      <AddQuestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddQuest}
        date={dateStr}
      />

      <RoutineManagerModal
        isOpen={routineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
        onRoutinesChange={refreshQuests}
      />

      <XpToast xp={xpToast.xp} show={xpToast.show} />
    </div>
  );
}
