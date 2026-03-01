"use client";

import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTepsListening } from "@/components/teps-listening/use-teps-listening";
import { ProblemSelector } from "@/components/teps-listening/problem-selector";
import { ReviewPanel } from "@/components/teps-listening/review-panel";
import { TestModePanel } from "@/components/teps-listening/test-mode-panel";
import { MemoPanel } from "@/components/teps-listening/memo-panel";

const SETS = [1, 2, 3, 4, 5, 6];

export default function TepsListeningPage() {
  const {
    problems,
    loading,
    currentSet,
    setCurrentSet,
    mode,
    setMode,
    currentProblemIndex,
    loadProblem,
    answeredIds,
    markAnswered,
    testAnswers,
    setTestAnswer,
    testSubmitted,
    testScore,
    submitTest,
    resetTest,
    memo,
    setMemo,
  } = useTepsListening();

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                <Headphones size={15} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[var(--foreground)]">TEPS 리스닝</h1>
                <p className="text-[11px] text-[var(--muted)]">듣기 연습 및 받아쓰기</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Set selector */}
              <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1">
                {SETS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setCurrentSet(s)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      currentSet === s
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                    )}
                  >
                    Set {s}
                  </button>
                ))}
              </div>

              {/* Mode toggle */}
              <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1">
                {(["review", "test"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
                      mode === m
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                    )}
                  >
                    {m === "review" ? "리뷰" : "테스트"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            <span className="text-sm">데이터 로딩 중...</span>
          </div>
        ) : problems.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            <span className="text-sm">문제를 찾을 수 없습니다.</span>
          </div>
        ) : mode === "review" ? (
          <>
            {/* Problem selector */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
              <p className="text-xs font-semibold text-[var(--muted)] mb-3 uppercase tracking-wide">
                문제 선택 — {answeredIds.size}/{problems.length} 완료
              </p>
              <ProblemSelector
                problems={problems}
                currentIndex={currentProblemIndex}
                answeredIds={answeredIds}
                onSelect={loadProblem}
              />
            </div>

            {/* Review panel — key resets component (including refs) on problem change */}
            {currentProblem && (
              <ReviewPanel
                key={`${currentSet}-${currentProblemIndex}`}
                problem={currentProblem}
                problemIndex={currentProblemIndex}
                onAnswered={() => markAnswered(currentProblem.id)}
              />
            )}
          </>
        ) : (
          <TestModePanel
            problems={problems}
            currentSet={currentSet}
            testAnswers={testAnswers}
            onAnswerChange={setTestAnswer}
            testSubmitted={testSubmitted}
            testScore={testScore}
            onSubmit={submitTest}
            onReset={resetTest}
          />
        )}
      </div>

      {/* Memo panel */}
      <div className="w-64 shrink-0 hidden lg:block">
        <MemoPanel value={memo} onChange={setMemo} />
      </div>
    </div>
  );
}
