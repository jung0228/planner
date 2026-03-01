"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MultiQuestion } from "./types";

interface QuestionBlockProps {
  question: MultiQuestion;
  problemIndex: number;
  subIndex: number;
  onAnswered?: () => void;
}

export function QuestionBlock({ question, problemIndex, subIndex, onAnswered }: QuestionBlockProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    if (!selected) {
      alert("답을 선택해주세요.");
      return;
    }
    if (!question.correctAnswer) {
      alert("data.json에 correctAnswer를 입력하세요.");
      return;
    }
    setChecked(true);
    if (selected === question.correctAnswer) {
      onAnswered?.();
    }
  };

  const isCorrect = checked && selected === question.correctAnswer;
  const isWrong = checked && selected !== question.correctAnswer;

  const options = question.options || ["A", "B", "C", "D"];
  const optionTexts = question.optionTexts || options.map((o) => `보기 ${o}`);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-[var(--muted)] mb-1">문제 {question.num}</p>
        <p className="text-sm text-[var(--foreground)]">{question.question || "(책에서 문제 확인)"}</p>
      </div>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isThisCorrect = checked && opt === question.correctAnswer;
          const isThisWrong = checked && opt === selected && selected !== question.correctAnswer;

          return (
            <button
              key={opt}
              type="button"
              disabled={checked}
              onClick={() => setSelected(opt)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors",
                checked
                  ? isThisCorrect
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isThisWrong
                    ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-[var(--border)] text-[var(--muted)] opacity-60"
                  : selected === opt
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  checked && isThisCorrect
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : checked && isThisWrong
                    ? "border-rose-500 bg-rose-500 text-white"
                    : selected === opt && !checked
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--border)]"
                )}
              >
                {opt}
              </span>
              <span>{optionTexts[i] || `보기 ${opt}`}</span>
            </button>
          );
        })}
      </div>

      {!checked && (
        <button
          onClick={handleCheck}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          정답 확인
        </button>
      )}

      {checked && (
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm font-medium",
            isCorrect
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          )}
        >
          {isCorrect ? `✅ 정답!` : `❌ 오답. 정답: ${question.correctAnswer}`}
        </div>
      )}
    </div>
  );
}
