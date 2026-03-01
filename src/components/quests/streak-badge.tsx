"use client";

import { Flame } from "lucide-react";
import { getQuestState } from "@/lib/quests";
import { useMounted } from "@/hooks/use-mounted";

export function StreakBadge() {
  const mounted = useMounted();
  const state = mounted ? getQuestState() : { totalQuestsCompleted: 0, totalXp: 0, currentStreak: 0, maxStreak: 0, datesWithCompletion: [] };

  return (
    <div className="rounded-xl border-2 border-orange-600/40 bg-gradient-to-br from-orange-900/40 to-orange-950/50 p-4">
      <div className="flex items-center gap-2">
        <Flame size={20} className="text-orange-400" />
        <span className="text-sm font-bold text-orange-200">연속 완료</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-orange-400">
        {state.currentStreak}
        <span className="ml-1 text-sm font-normal text-orange-500/80">일</span>
      </p>
      <p className="mt-1 text-[10px] text-orange-600/80">
        최고 기록: {state.maxStreak}일
      </p>
    </div>
  );
}
