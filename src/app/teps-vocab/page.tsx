"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Trophy, RotateCcw, List, Pencil, CalendarDays,
} from "lucide-react";
import { questions as allQuestions } from "./data";
import type { Question } from "./data";
import { recordCorrect, recordWrong } from "@/lib/teps-quiz";
import { getWrongQIds, addWrongQ, removeWrongQ, initTepsVocabProgress } from "@/lib/teps-vocab-progress";

type Answer = "a" | "b" | "c" | "d" | null;

const DAILY_COUNT = 30;

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDisplayDate() {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed & 0x7fffffff;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getDailyQuestions(seed: number): Question[] {
  return seededShuffle(allQuestions, seed)
    .slice(0, DAILY_COUNT)
    .sort((a, b) => a.part.localeCompare(b.part));
}

const todayStr = getTodayStr();
const STORAGE_KEY = `teps-vocab-daily-${todayStr}`;
const questions = getDailyQuestions(parseInt(todayStr.replace(/-/g, ""), 10));

function loadProgress() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProgress(data: object) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [STORAGE_KEY]: data }),
    }).catch(() => {});
  } catch {}
}

export default function TepsVocabPage() {
  const saved = loadProgress();

  const [currentIndex, setCurrentIndex] = useState<number>(saved?.currentIndex ?? 0);
  const [answers, setAnswers] = useState<Answer[]>(
    saved?.answers ?? new Array(questions.length).fill(null)
  );
  const [checkedList, setCheckedList] = useState<boolean[]>(
    saved?.checkedList ?? new Array(questions.length).fill(false)
  );
  const [showResult, setShowResult] = useState<boolean>(saved?.showResult ?? false);
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState<Answer>(
    saved?.answers?.[saved?.currentIndex ?? 0] ?? null
  );
  const [checked, setChecked] = useState<boolean>(
    saved?.checkedList?.[saved?.currentIndex ?? 0] ?? false
  );

  // 오답 복습 관련 state
  const [wrongQIds, setWrongQIds] = useState<number[]>([]);
  const [showWrongReview, setShowWrongReview] = useState(false);
  const [reviewSnapshot, setReviewSnapshot] = useState<Question[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewSelected, setReviewSelected] = useState<Answer>(null);
  const [reviewChecked, setReviewChecked] = useState(false);
  const [reviewClearedIds, setReviewClearedIds] = useState<number[]>([]);

  useEffect(() => {
    async function init() {
      await initTepsVocabProgress(); // 서버에서 wrongQIds pull
      setWrongQIds(getWrongQIds());

      // 서버에 오늘 진행 기록이 있으면 복구
      if (!loadProgress()) {
        try {
          const res = await fetch("/api/store");
          if (res.ok) {
            const data = await res.json();
            const serverProgress = data[STORAGE_KEY];
            if (serverProgress) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(serverProgress));
              setCurrentIndex(serverProgress.currentIndex ?? 0);
              setAnswers(serverProgress.answers ?? new Array(questions.length).fill(null));
              setCheckedList(serverProgress.checkedList ?? new Array(questions.length).fill(false));
              setShowResult(serverProgress.showResult ?? false);
              setSelected(serverProgress.answers?.[serverProgress.currentIndex ?? 0] ?? null);
              setChecked(serverProgress.checkedList?.[serverProgress.currentIndex ?? 0] ?? false);
            }
          }
        } catch {}
      }
    }
    init();
  }, []);

  useEffect(() => {
    saveProgress({ currentIndex, answers, checkedList, showResult });
  }, [currentIndex, answers, checkedList, showResult]);

  const q = questions[currentIndex];
  const total = questions.length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const correctCount = answers.filter((a, i) => a === questions[i].answer).length;

  const handleSelect = (opt: "a" | "b" | "c" | "d") => {
    if (checked) return;
    setSelected(opt);
  };

  const handleCheck = () => {
    if (!selected) return;
    setChecked(true);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selected;
    setAnswers(newAnswers);
    const newChecked = [...checkedList];
    newChecked[currentIndex] = true;
    setCheckedList(newChecked);
    // vocabId 연동: TEPS 단어 세션에도 정답/오답 반영
    if (q.vocabId) {
      if (selected === q.answer) recordCorrect(todayStr, q.vocabId);
      else recordWrong(todayStr, q.vocabId);
    }
    // 오답 영구 추적
    if (selected === q.answer) {
      removeWrongQ(q.id);
      setWrongQIds(prev => prev.filter(id => id !== q.id));
    } else {
      addWrongQ(q.id);
      setWrongQIds(prev => prev.includes(q.id) ? prev : [...prev, q.id]);
    }
  };

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setSelected(answers[index]);
    setChecked(checkedList[index]);
    setShowList(false);
  };

  const handleNext = () => {
    if (currentIndex < total - 1) goTo(currentIndex + 1);
    else setShowResult(true);
  };

  const handlePrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const enterReview = () => {
    const wrongQs = allQuestions.filter(q => wrongQIds.includes(q.id));
    setReviewSnapshot(wrongQs);
    setReviewIndex(0);
    setReviewSelected(null);
    setReviewChecked(false);
    setReviewClearedIds([]);
    setShowWrongReview(true);
  };

  const handleReviewSelect = (opt: "a" | "b" | "c" | "d") => {
    if (reviewChecked) return;
    setReviewSelected(opt);
  };

  const handleReviewCheck = () => {
    if (!reviewSelected) return;
    setReviewChecked(true);
    const rq = reviewSnapshot[reviewIndex];
    if (reviewSelected === rq.answer) {
      removeWrongQ(rq.id);
      setWrongQIds(prev => prev.filter(id => id !== rq.id));
      setReviewClearedIds(prev => [...prev, rq.id]);
    }
  };

  const handleReviewNext = () => {
    if (reviewIndex < reviewSnapshot.length - 1) {
      setReviewIndex(prev => prev + 1);
      setReviewSelected(null);
      setReviewChecked(false);
    } else {
      setShowWrongReview(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [STORAGE_KEY]: null }),
    }).catch(() => {});
    setCurrentIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers(new Array(questions.length).fill(null));
    setCheckedList(new Array(questions.length).fill(false));
    setShowResult(false);
    setShowList(false);
  };

  const scorePercent = Math.round((correctCount / total) * 100);
  const grade =
    scorePercent >= 90 ? { label: "A+", color: "text-emerald-500" }
    : scorePercent >= 80 ? { label: "A", color: "text-green-500" }
    : scorePercent >= 70 ? { label: "B", color: "text-blue-500" }
    : scorePercent >= 60 ? { label: "C", color: "text-amber-500" }
    : { label: "D", color: "text-rose-500" };

  if (showResult) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm"
        >
          <Trophy size={56} className="mx-auto mb-4 text-amber-400" />
          <h1 className="text-3xl font-bold text-[var(--foreground)]">오늘의 결과</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{getDisplayDate()} · TEPS 어휘</p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className={`text-7xl font-bold ${grade.color}`}>{grade.label}</div>
            <div className="text-4xl font-semibold text-[var(--foreground)]">{correctCount} / {total}</div>
            <div className="text-xl text-[var(--muted-foreground)]">정답률 {scorePercent}%</div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="font-bold text-emerald-500">{correctCount}</div>
              <div className="text-[var(--muted-foreground)]">정답</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="font-bold text-rose-500">{answeredCount - correctCount}</div>
              <div className="text-[var(--muted-foreground)]">오답</div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4">
              <div className="font-bold text-[var(--muted-foreground)]">{total - answeredCount}</div>
              <div className="text-[var(--muted-foreground)]">미응답</div>
            </div>
          </div>

          <p className="mt-6 text-xs text-[var(--muted-foreground)]">
            내일 새로운 30문제가 준비됩니다 ✨
          </p>

          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <RotateCcw size={18} />
              다시 풀기
            </button>
            <button
              onClick={() => { setShowResult(false); setShowList(true); }}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
            >
              <List size={18} />
              문제 목록
            </button>
          </div>
        </motion.div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">문제별 결과</h2>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
            {questions.map((_, i) => {
              const userAns = answers[i];
              const correct = userAns === questions[i].answer;
              return (
                <button
                  key={i}
                  onClick={() => { setShowResult(false); goTo(i); }}
                  className={`rounded-lg border p-2 text-xs font-medium transition-colors ${
                    userAns === null
                      ? "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]"
                      : correct
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (showWrongReview) {
    const rq = reviewSnapshot[reviewIndex];
    const isDone = reviewIndex >= reviewSnapshot.length;

    if (!rq || isDone) {
      return (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowWrongReview(false)} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-[var(--foreground)]">오답 복습 완료</h1>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-amber-400" />
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {reviewClearedIds.length > 0
                ? `${reviewClearedIds.length}개 문제를 맞혀서 오답 목록에서 제거했어요!`
                : "이번 복습에서 맞힌 문제가 없어요. 다시 도전해봐요!"}
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">남은 오답: {wrongQIds.length}개</p>
            <button
              onClick={() => setShowWrongReview(false)}
              className="mt-6 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              돌아가기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {/* 헤더 */}
        <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-0 overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5 px-4 md:px-8 pb-5 md:pb-6 pt-5 md:pt-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowWrongReview(false)} className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">오답 복습</h1>
                <p className="text-xs text-[var(--muted-foreground)]">맞히면 오답 목록에서 자동 제거됩니다</p>
              </div>
            </div>
            <span className="text-sm font-medium text-red-400">{reviewIndex + 1} / {reviewSnapshot.length}</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-300"
              style={{ width: `${((reviewIndex) / reviewSnapshot.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 문제 카드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={reviewIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
                Part {rq.part}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">{rq.partLabel}</span>
              {reviewClearedIds.includes(rq.id) && (
                <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">✓ 제거됨</span>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <p className="whitespace-pre-line text-sm leading-7 text-[var(--foreground)]">{rq.passage}</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="mb-4 font-semibold text-[var(--foreground)]">{rq.question}</p>
              <div className="space-y-2">
                {rq.options.map((opt) => {
                  const isSelected = reviewSelected === opt.label;
                  const isCorrect = opt.label === rq.answer;
                  const isWrong = reviewChecked && isSelected && !isCorrect;
                  const showCorrect = reviewChecked && isCorrect;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleReviewSelect(opt.label)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                        showCorrect ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                        : isWrong ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30"
                        : isSelected ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
                      } ${reviewChecked ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        showCorrect ? "bg-emerald-500 text-white"
                        : isWrong ? "bg-rose-500 text-white"
                        : isSelected ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      }`}>
                        {opt.label}
                      </span>
                      <span className={showCorrect ? "font-medium text-emerald-700 dark:text-emerald-400" : isWrong ? "font-medium text-rose-700 dark:text-rose-400" : "text-[var(--foreground)]"}>
                        {opt.text}
                      </span>
                      {showCorrect && <CheckCircle size={18} className="ml-auto shrink-0 text-emerald-500" />}
                      {isWrong && <XCircle size={18} className="ml-auto shrink-0 text-rose-500" />}
                    </button>
                  );
                })}
              </div>

              {reviewChecked && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-xl p-4 text-sm ${
                    reviewSelected === rq.answer
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}
                >
                  <p className="font-medium">
                    {reviewSelected === rq.answer ? "✓ 정답! 오답 목록에서 제거됩니다." : `✗ 오답. 정답은 (${rq.answer})입니다.`}
                  </p>
                  {reviewSelected !== rq.answer && rq.explanation && (
                    <p className="mt-2 text-xs leading-relaxed opacity-90">{rq.explanation}</p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3 pb-6 pt-2">
          <div className="flex-1" />
          {!reviewChecked ? (
            <button
              onClick={handleReviewCheck}
              disabled={!reviewSelected}
              className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)]"
            >
              확인하기
            </button>
          ) : (
            <button
              onClick={handleReviewNext}
              className="flex items-center gap-1 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              {reviewIndex === reviewSnapshot.length - 1 ? "복습 완료" : "다음"}
              {reviewIndex < reviewSnapshot.length - 1 && <ChevronRight size={18} />}
              {reviewIndex === reviewSnapshot.length - 1 && <Trophy size={16} />}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (showList) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowList(false)}
            className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-[var(--foreground)]">문제 목록</h1>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {questions.map((question, i) => {
            const userAns = answers[i];
            const isChecked = checkedList[i];
            const correct = userAns === question.answer;
            return (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:scale-[1.01] ${
                  isChecked
                    ? correct
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-rose-300 bg-rose-50 dark:bg-rose-900/20"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-bold text-[var(--foreground)]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">
                    Part {question.part} — {question.partLabel}
                  </span>
                  <p className="mt-0.5 truncate text-sm text-[var(--foreground)]">
                    {question.passage.split("\n")[0]}
                  </p>
                </div>
                {isChecked && (
                  correct
                    ? <CheckCircle size={20} className="shrink-0 text-emerald-500" />
                    : <XCircle size={20} className="shrink-0 text-rose-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* 헤더 */}
      <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 md:px-8 pb-5 md:pb-6 pt-5 md:pt-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
              <Pencil size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">오늘의 TEPS 어휘</h1>
              <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <CalendarDays size={11} />
                {getDisplayDate()} · {DAILY_COUNT}문제
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wrongQIds.length > 0 && (
              <button
                onClick={enterReview}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                title="오답 복습"
              >
                <XCircle size={15} />
                {wrongQIds.length}
              </button>
            )}
            <button
              onClick={() => setShowList(true)}
              className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
              title="문제 목록"
            >
              <List size={18} />
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-[var(--border)] p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
              title="처음부터"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>{currentIndex + 1} / {total}</span>
            <span>{answeredCount}개 답변 완료</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* 문제 카드 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--accent)]/20 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              Part {q.part}
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">{q.partLabel}</span>
            <span className="ml-auto text-sm font-medium text-[var(--muted-foreground)]">
              {currentIndex + 1}번
            </span>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <p className="whitespace-pre-line text-sm leading-7 text-[var(--foreground)]">
              {q.passage}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <p className="mb-4 font-semibold text-[var(--foreground)]">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = selected === opt.label;
                const isCorrect = opt.label === q.answer;
                const isWrong = checked && isSelected && !isCorrect;
                const showCorrect = checked && isCorrect;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(opt.label)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${
                      showCorrect ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                      : isWrong ? "border-rose-400 bg-rose-50 dark:bg-rose-900/30"
                      : isSelected ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
                    } ${checked ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      showCorrect ? "bg-emerald-500 text-white"
                      : isWrong ? "bg-rose-500 text-white"
                      : isSelected ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    }`}>
                      {opt.label}
                    </span>
                    <span className={
                      showCorrect ? "font-medium text-emerald-700 dark:text-emerald-400"
                      : isWrong ? "font-medium text-rose-700 dark:text-rose-400"
                      : "text-[var(--foreground)]"
                    }>
                      {opt.text}
                    </span>
                    {showCorrect && <CheckCircle size={18} className="ml-auto shrink-0 text-emerald-500" />}
                    {isWrong && <XCircle size={18} className="ml-auto shrink-0 text-rose-500" />}
                  </button>
                );
              })}
            </div>

            {checked && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-xl p-4 text-sm ${
                  selected === q.answer
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                }`}
              >
                <p className="font-medium">
                  {selected === q.answer ? "✓ 정답입니다!" : `✗ 오답입니다. 정답은 (${q.answer})입니다.`}
                </p>
                {selected !== q.answer && q.explanation && (
                  <p className="mt-2 text-xs leading-relaxed opacity-90">{q.explanation}</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2 pb-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          이전
        </button>
        <div className="flex-1" />
        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={!selected}
            className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            확인하기
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            {currentIndex === total - 1 ? "결과 보기" : "다음"}
            {currentIndex < total - 1 && <ChevronRight size={18} />}
            {currentIndex === total - 1 && <Trophy size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
