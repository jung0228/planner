"use client";

import { motion } from "framer-motion";
import { Check, Trash2, Sparkles } from "lucide-react";
import type { Quest } from "@/lib/quests";
import { RARITY_CONFIG } from "@/lib/quests";
import { cn } from "@/lib/utils";

type Props = {
  quest: Quest & { isRoutine?: boolean };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onComplete?: (xp: number) => void;
};

export function QuestCard({ quest, onToggle, onDelete, onComplete }: Props) {
  const config = RARITY_CONFIG[quest.rarity];

  const handleToggle = () => {
    const wasCompleted = quest.completed;
    onToggle(quest.id);
    if (!wasCompleted && onComplete) onComplete(quest.xp);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 p-4 transition-all",
        quest.completed && "opacity-70"
      )}
      style={{
        borderColor: config.borderColor,
        backgroundColor: quest.completed ? `${config.borderColor}15` : `${config.borderColor}08`,
      }}
    >
      {/* 장식 모서리 */}
      <div
        className="absolute right-2 top-2 opacity-60"
        style={{ color: config.color }}
      >
        <Sparkles size={16} />
      </div>

      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            quest.completed ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--muted)] hover:border-[var(--accent)]"
          )}
        >
          {quest.completed && <Check size={14} className="text-white" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {quest.isRoutine && (
              <span className="rounded bg-amber-600/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                루틴
              </span>
            )}
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                color: config.color,
                backgroundColor: `${config.borderColor}30`,
              }}
            >
              {config.label}
            </span>
            <span className="text-xs text-[var(--muted)]">+{quest.xp} XP</span>
          </div>
          <h3
            className={cn(
              "font-semibold",
              quest.completed && "line-through text-[var(--muted)]"
            )}
          >
            {quest.title}
          </h3>
          {quest.description && (
            <p className="mt-1 text-sm text-[var(--muted)]">{quest.description}</p>
          )}
        </div>

        <button
          onClick={() => onDelete(quest.id)}
          className="rounded p-2 text-[var(--muted)] opacity-0 transition-opacity hover:bg-red-500/20 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}
