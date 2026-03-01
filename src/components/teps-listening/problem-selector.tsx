"use client";

import { cn } from "@/lib/utils";
import { NormalizedProblem } from "./types";

interface ProblemSelectorProps {
  problems: NormalizedProblem[];
  currentIndex: number;
  answeredIds: Set<number>;
  onSelect: (index: number) => void;
}

export function ProblemSelector({ problems, currentIndex, answeredIds, onSelect }: ProblemSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {problems.map((p, i) => {
        const label =
          p.questions.length > 1
            ? `${p.questions[0].num}~${p.questions[p.questions.length - 1].num}`
            : String(p.questions[0].num);
        const isActive = i === currentIndex;
        const isAnswered = answeredIds.has(p.id);

        return (
          <button
            key={p.id}
            onClick={() => onSelect(i)}
            className={cn(
              "min-w-[2.5rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors border",
              isActive
                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                : isAnswered
                ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
