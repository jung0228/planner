"use client";

import { cn } from "@/lib/utils";
import { NormalizedProblem } from "./types";
import { AudioPlayer } from "./audio-player";
import { flattenTo40Questions, getTestAudioPath } from "./use-teps-listening";

interface TestModePanelProps {
  problems: NormalizedProblem[];
  currentSet: number;
  testAnswers: Record<number, string>;
  onAnswerChange: (num: number, ans: string) => void;
  testSubmitted: boolean;
  testScore: number | null;
  onSubmit: () => void;
  onReset: () => void;
}

const OPTIONS = ["A", "B", "C", "D"] as const;

export function TestModePanel({
  problems,
  currentSet,
  testAnswers,
  onAnswerChange,
  testSubmitted,
  testScore,
  onSubmit,
  onReset,
}: TestModePanelProps) {
  const questions40 = flattenTo40Questions(problems);
  const testAudioSrc = getTestAudioPath(currentSet);

  const answeredCount = Object.keys(testAnswers).length;
  const hasAnswerData = questions40.some((q) => q.correctAnswer);

  return (
    <div className="space-y-4">
      {/* Combined audio */}
      <AudioPlayer key={`test-${currentSet}`} src={testAudioSrc} />

      {/* Result */}
      {testSubmitted && testScore !== null && (
        <div className={cn(
          "rounded-xl border px-5 py-4",
          hasAnswerData
            ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
            : "border-amber-500/30 bg-amber-500/5"
        )}>
          {hasAnswerData ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-[var(--foreground)]">
                  {testScore} / 40 정답
                </p>
                <p className="text-sm text-[var(--muted)]">
                  제출한 문제: {answeredCount} / 40
                </p>
              </div>
              <div className="text-3xl font-bold text-[var(--accent)]">
                {Math.round((testScore / 40) * 100)}%
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              data.json에 정답을 채워주세요.
            </p>
          )}
        </div>
      )}

      {/* Question grid */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="space-y-1">
          {questions40.map((q) => {
            const selected = testAnswers[q.num];
            const isWrong = testSubmitted && selected && q.correctAnswer && selected !== q.correctAnswer;
            const isUnanswered = testSubmitted && !selected && q.correctAnswer;

            return (
              <div
                key={q.num}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isWrong ? "bg-rose-500/10" : isUnanswered ? "bg-amber-500/5" : ""
                )}
              >
                <span className="w-6 text-right text-xs font-semibold text-[var(--muted)] shrink-0">
                  {q.num}
                </span>
                <div className="flex gap-1.5">
                  {OPTIONS.map((opt) => {
                    const isSelected = selected === opt;
                    const isThisCorrect = testSubmitted && opt === q.correctAnswer && q.correctAnswer;
                    const isThisWrong = testSubmitted && isSelected && isWrong;

                    return (
                      <button
                        key={opt}
                        disabled={testSubmitted}
                        onClick={() => onAnswerChange(q.num, opt)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold transition-colors border",
                          isThisCorrect
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : isThisWrong
                            ? "bg-rose-500 border-rose-500 text-white"
                            : isSelected
                            ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                            : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {isWrong && q.correctAnswer && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    → {q.correctAnswer}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit / Reset */}
      <div className="flex gap-2">
        {!testSubmitted ? (
          <button
            onClick={onSubmit}
            className="flex-1 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            채점하기 ({answeredCount}/40 선택)
          </button>
        ) : (
          <button
            onClick={onReset}
            className="flex-1 rounded-xl border border-[var(--border)] py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
          >
            다시 풀기
          </button>
        )}
      </div>
    </div>
  );
}
