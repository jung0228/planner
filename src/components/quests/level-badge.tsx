"use client";

import { motion } from "framer-motion";
import { getLevel, getTitle, getQuestState } from "@/lib/quests";
import { useMounted } from "@/hooks/use-mounted";

export function LevelBadge() {
  const mounted = useMounted();
  const state = mounted ? getQuestState() : { totalXp: 0, totalQuestsCompleted: 0, currentStreak: 0, maxStreak: 0, datesWithCompletion: [] };
  const { level, xpInLevel, xpToNext } = getLevel(state.totalXp);
  const title = getTitle(level);
  const progress = (xpInLevel / (xpInLevel + xpToNext)) * 100 || 0;

  return (
    <div className="rounded-xl border-2 border-amber-600/50 bg-gradient-to-br from-amber-900/60 to-amber-950/80 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-amber-400/90">Lv.{level}</span>
        <span className="text-xs text-amber-500/80">{title}</span>
      </div>
      <div className="mb-1 h-2 overflow-hidden rounded-full bg-amber-900/80">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
        />
      </div>
      <p className="text-[10px] text-amber-500/70">
        {xpInLevel} / {xpInLevel + xpToNext} XP
      </p>
    </div>
  );
}
