"use client";

import { useState, useEffect, useCallback } from "react";
import { NormalizedProblem, RawProblem, Mode } from "./types";

function normalizeProblems(data: RawProblem[]): NormalizedProblem[] {
  return data.map((p) => {
    if ("questions" in p && p.questions) {
      return {
        id: p.id,
        audio: p.audio,
        script: p.script || "",
        questions: p.questions,
      };
    }
    const single = p as import("./types").RawSingleProblem;
    return {
      id: single.id,
      audio: single.audio,
      script: single.script || "",
      questions: [
        {
          num: single.id,
          question: single.question,
          options: single.options || ["A", "B", "C", "D"],
          optionTexts: single.optionTexts || ["보기 A", "보기 B", "보기 C", "보기 D"],
          correctAnswer: single.correctAnswer || "",
          script: single.script || "",
        },
      ],
    };
  });
}

export function flattenTo40Questions(problems: NormalizedProblem[]) {
  const flat: { num: number; correctAnswer: string }[] = [];
  problems.forEach((p) => {
    p.questions.forEach((q) => {
      flat.push({ num: q.num, correctAnswer: q.correctAnswer || "" });
    });
  });
  return flat.sort((a, b) => a.num - b.num);
}

export function resolveAudioPath(rawPath: string): string {
  return `/teps-listening/${rawPath}`;
}

export function getTestAudioPath(setNum: number): string {
  if (setNum === 1) return "/teps-listening/audio/teps_actual6_part1/1_g.mp3";
  return `/teps-listening/audio/teps_actual6/set${setNum}/${setNum}_g.mp3`;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function useTepsListening() {
  const [allData, setAllData] = useState<Record<string, NormalizedProblem[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSetState] = useState(1);
  const [mode, setModeState] = useState<Mode>("review");
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<number>>(new Set());
  const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number | null>(null);
  const [memo, setMemoState] = useState("");
  const [mounted, setMounted] = useState(false);

  // Load data
  useEffect(() => {
    fetch("/teps-listening/data.json")
      .then((r) => (r.ok ? r.json() : Promise.reject("fetch failed")))
      .then((raw: Record<string, RawProblem[]>) => {
        const normalized: Record<string, NormalizedProblem[]> = {};
        for (const key of Object.keys(raw)) {
          normalized[key] = normalizeProblems(Array.isArray(raw[key]) ? raw[key] : []);
        }
        setAllData(normalized);
        setLoading(false);
      })
      .catch(() => {
        setAllData({});
        setLoading(false);
      });
  }, []);

  // Restore from localStorage after mount
  useEffect(() => {
    setMounted(true);
    const savedMemo = safeGet("teps-listening:memo") || "";
    setMemoState(savedMemo);

    const savedSet = parseInt(safeGet("teps-listening:last-set") || "1", 10);
    if (savedSet >= 1 && savedSet <= 6) setCurrentSetState(savedSet);
  }, []);

  // Restore answered IDs when set changes (after mount)
  useEffect(() => {
    if (!mounted) return;
    const saved = safeGet(`teps-listening:answered-ids:${currentSet}`);
    if (saved) {
      try {
        setAnsweredIds(new Set(JSON.parse(saved) as number[]));
      } catch {
        setAnsweredIds(new Set());
      }
    } else {
      setAnsweredIds(new Set());
    }
    // Restore problem index
    const savedIdx = parseInt(safeGet(`teps-listening:last-problem-index:${currentSet}`) || "0", 10);
    setCurrentProblemIndex(isNaN(savedIdx) ? 0 : savedIdx);
    // Restore test answers
    const savedAnswers = safeGet(`teps-listening:test-answers:${currentSet}`);
    if (savedAnswers) {
      try {
        setTestAnswers(JSON.parse(savedAnswers));
      } catch {
        setTestAnswers({});
      }
    } else {
      setTestAnswers({});
    }
    setTestSubmitted(false);
    setTestScore(null);
  }, [currentSet, mounted]);

  const problems: NormalizedProblem[] = allData[String(currentSet)] || [];

  const setCurrentSet = useCallback((n: number) => {
    setCurrentSetState(n);
    safeSet("teps-listening:last-set", String(n));
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
  }, []);

  const loadProblem = useCallback((index: number) => {
    setCurrentProblemIndex(index);
    if (mounted) {
      safeSet(`teps-listening:last-problem-index:${currentSet}`, String(index));
    }
  }, [currentSet, mounted]);

  const markAnswered = useCallback((id: number) => {
    setAnsweredIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      safeSet(`teps-listening:answered-ids:${currentSet}`, JSON.stringify([...next]));
      return next;
    });
  }, [currentSet]);

  const setTestAnswer = useCallback((num: number, ans: string) => {
    setTestAnswers((prev) => {
      const next = { ...prev, [num]: ans };
      safeSet(`teps-listening:test-answers:${currentSet}`, JSON.stringify(next));
      return next;
    });
  }, [currentSet]);

  const submitTest = useCallback(() => {
    const flat = flattenTo40Questions(problems);
    const correct = flat.filter((q) => testAnswers[q.num] === q.correctAnswer && q.correctAnswer).length;
    setTestScore(correct);
    setTestSubmitted(true);
  }, [problems, testAnswers]);

  const resetTest = useCallback(() => {
    setTestAnswers({});
    setTestSubmitted(false);
    setTestScore(null);
    safeSet(`teps-listening:test-answers:${currentSet}`, JSON.stringify({}));
  }, [currentSet]);

  const setMemo = useCallback((v: string) => {
    setMemoState(v);
    safeSet("teps-listening:memo", v);
  }, []);

  return {
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
  };
}
