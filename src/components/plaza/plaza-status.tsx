"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { getQuestState, getLevel, getTitle } from "@/lib/quests";
import { useMounted } from "@/hooks/use-mounted";

export function PlazaStatus() {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="rounded-xl border-2 border-amber-600/40 bg-gradient-to-br from-amber-900/90 to-amber-950/95 px-4 py-3 shadow-lg">
        <div className="h-4 w-20 animate-pulse rounded bg-amber-700/50" />
      </div>
    );
  }

  const state = getQuestState();
  const { level, xpInLevel, xpToNext } = getLevel(state.totalXp);
  const title = getTitle(level);
  const progress = xpToNext > 0 ? (xpInLevel / (xpInLevel + xpToNext)) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-900/95 via-amber-900/90 to-amber-950/98 px-4 py-3 shadow-lg shadow-amber-900/40 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-amber-200 shadow-inner">
          <Sparkles size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-bold text-amber-100">Lv.{level}</span>
            <span className="text-sm font-medium text-amber-400">
              {title}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 w-28 overflow-hidden rounded-full bg-amber-800/90">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
              />
            </div>
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-500">
              <Zap size={10} />
              {state.totalXp} XP
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
