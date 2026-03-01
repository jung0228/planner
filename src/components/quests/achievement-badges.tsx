"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { getQuestState, ACHIEVEMENTS } from "@/lib/quests";
import { useMounted } from "@/hooks/use-mounted";

export function AchievementBadges() {
  const mounted = useMounted();
  const state = mounted ? getQuestState() : { totalQuestsCompleted: 0, totalXp: 0, currentStreak: 0, maxStreak: 0, datesWithCompletion: [] };
  const unlocked = ACHIEVEMENTS.filter((a) => a.condition(state));

  return (
    <div className="rounded-xl border-2 border-amber-700/30 bg-amber-900/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        <span className="text-sm font-bold text-amber-200">업적</span>
        <span className="text-xs text-amber-600/80">
          {unlocked.length}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENTS.map((a) => {
          const done = a.condition(state);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                done
                  ? "bg-amber-600/30 text-amber-200"
                  : "bg-amber-900/30 text-amber-600/60 grayscale"
              }`}
              title={a.description}
            >
              <span>{a.icon}</span>
              <span>{a.name}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
