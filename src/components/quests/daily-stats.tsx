"use client";

import { motion } from "framer-motion";
import { Swords, Zap } from "lucide-react";
import { getDailyStats } from "@/lib/quests";

type Props = {
  date: string;
  quests: { completed: boolean; xp: number }[];
};

export function DailyStats({ date, quests }: Props) {
  const total = quests.length;
  const completed = quests.filter((q) => q.completed).length;
  const totalXp = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xp, 0);
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="rounded-xl border-2 border-amber-700/40 bg-gradient-to-br from-amber-900/40 to-amber-950/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-amber-100">
          <Swords size={18} />
          오늘의 전투 기록
        </h3>
        <span className="flex items-center gap-1 rounded bg-amber-700/30 px-2 py-0.5 text-sm font-medium text-amber-300">
          <Zap size={14} />
          {totalXp} XP
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-amber-200/80">
          <span>퀘스트 진행</span>
          <span>
            {completed}/{total} 완료
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-amber-900/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
          />
        </div>
      </div>
    </div>
  );
}
