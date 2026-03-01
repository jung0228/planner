"use client";

import { NormalizedProblem } from "./types";
import { AudioPlayer } from "./audio-player";
import { QuestionBlock } from "./question-block";
import { ScriptGrader } from "./script-grader";
import { resolveAudioPath } from "./use-teps-listening";
import { useRef } from "react";

interface ReviewPanelProps {
  problem: NormalizedProblem;
  problemIndex: number;
  onAnswered: () => void;
}

export function ReviewPanel({ problem, problemIndex, onAnswered }: ReviewPanelProps) {
  const answeredCount = useRef(0);

  const handleQuestionAnswered = () => {
    answeredCount.current += 1;
    if (answeredCount.current >= problem.questions.length) {
      onAnswered();
    }
  };

  const correctScript =
    problem.script ||
    (problem.questions.length === 1
      ? problem.questions[0].script
      : problem.questions.map((q) => q.script).join("\n\n"));

  const label =
    problem.questions.length > 1
      ? `문제 ${problem.questions[0].num} ~ ${problem.questions[problem.questions.length - 1].num}`
      : `문제 ${problem.questions[0].num}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--foreground)]">{label}</h2>
      </div>

      {/* Audio player - key on problem.id forces remount when problem changes */}
      <AudioPlayer key={problem.id} src={resolveAudioPath(problem.audio)} />

      {/* Questions */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-6">
        {problem.questions.map((q, subIdx) => (
          <div key={q.num}>
            {subIdx > 0 && <div className="border-t border-[var(--border)] my-4" />}
            <QuestionBlock
              question={q}
              problemIndex={problemIndex}
              subIndex={subIdx}
              onAnswered={handleQuestionAnswered}
            />
          </div>
        ))}
      </div>

      {/* Script grader */}
      <ScriptGrader correctScript={correctScript} />
    </div>
  );
}
