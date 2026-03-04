"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, Trophy, XCircle, HelpCircle, Volume2, Music2 } from "lucide-react";
import { BeatPlayer } from "@/components/vocab/beat-player";
import {
  getQuizSession,
  generateQuestion,
  recordCorrect,
  recordWrong,
  getPersistentWrongIds,
  type QuizQuestion,
} from "@/lib/teps-quiz";
import { TEPS_VOCAB } from "@/lib/teps-vocab";
import { getQuestsByDate, toggleQuest } from "@/lib/quests";
import { XpToast } from "@/components/quests/xp-toast";
import { cn } from "@/lib/utils";

const TODAY = new Date().toISOString().slice(0, 10);
const GOAL = 20;

type AnswerState = "idle" | "correct" | "wrong" | "skip";
type Tab = "quiz" | "wrong" | "song";

export default function VocabPage() {
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [persistentWrongIds, setPersistentWrongIds] = useState<number[]>([]);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [questDone, setQuestDone] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [tab, setTab] = useState<Tab>("quiz");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const session = getQuizSession(TODAY);
    setCorrectCount(session.correctCount);
    setAnsweredIds(session.answeredIds);
    setWrongIds(session.wrongIds);
    setPersistentWrongIds(getPersistentWrongIds());
    if (session.correctCount >= GOAL) setQuestDone(true);
  }, []);

  const speak = useCallback((word: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const loadNextQuestion = useCallback((ids: number[]) => {
    const q = generateQuestion(ids);
    setQuestion(q);
    setCardKey((k) => k + 1);
    setAnswerState("idle");
    setSelectedIndex(null);
    if (q) {
      setTimeout(() => speak(q.word.word), 300);
    }
  }, [speak]);

  useEffect(() => {
    if (!questDone) loadNextQuestion(answeredIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (choiceIndex: number) => {
    if (answerState !== "idle" || !question) return;

    if (choiceIndex === question.correctIndex) {
      setAnswerState("correct");
      setSelectedIndex(choiceIndex);

      const reached20 = recordCorrect(TODAY, question.word.id);
      const newCount = correctCount + 1;
      const newIds = [...answeredIds, question.word.id];
      setCorrectCount(newCount);
      setAnsweredIds(newIds);
      setPersistentWrongIds(prev => prev.filter(id => id !== question.word.id));

      if (reached20 && !questDone) {
        setQuestDone(true);
        setShowXp(true);
        setTimeout(() => setShowXp(false), 3000);
        const quests = getQuestsByDate(TODAY);
        const tepsQuest = quests.find(
          (q) => q.title === "TEPS 단어 암기 1시간" && !q.completed
        );
        if (tepsQuest) toggleQuest(tepsQuest.id);
      }

      setTimeout(() => {
        if (!reached20) loadNextQuestion(newIds);
      }, 900);
    } else {
      setAnswerState("wrong");
      setSelectedIndex(choiceIndex);
      recordWrong(TODAY, question.word.id);
      if (!wrongIds.includes(question.word.id)) {
        setWrongIds((prev) => [...prev, question.word.id]);
      }
      setPersistentWrongIds(prev => prev.includes(question.word.id) ? prev : [...prev, question.word.id]);
      setTimeout(() => {
        setAnswerState("idle");
        setSelectedIndex(null);
      }, 900);
    }
  };

  const handleSkip = () => {
    if (answerState !== "idle" || !question) return;
    setAnswerState("skip");
    setSelectedIndex(null);
    recordWrong(TODAY, question.word.id);
    if (!wrongIds.includes(question.word.id)) {
      setWrongIds((prev) => [...prev, question.word.id]);
    }
    setPersistentWrongIds(prev => prev.includes(question.word.id) ? prev : [...prev, question.word.id]);
    setTimeout(() => loadNextQuestion(answeredIds), 1200);
  };

  const getButtonStyle = (index: number): string => {
    if (answerState === "idle") {
      return "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10";
    }
    if (index === question?.correctIndex) {
      return "border-emerald-500 bg-emerald-500/20 text-emerald-400";
    }
    if (index === selectedIndex && answerState === "wrong") {
      return "border-red-500 bg-red-500/20 text-red-400";
    }
    return "border-[var(--border)] text-[var(--muted)] opacity-40";
  };


  const progressPct = Math.min((correctCount / GOAL) * 100, 100);
  const wrongWords = TEPS_VOCAB.filter((w) => persistentWrongIds.includes(w.id));

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex w-full max-w-xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">TEPS 단어</h1>
            <p className="text-xs text-[var(--muted)]">영→한 4지선다 퀴즈</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Wrong badge */}
          {persistentWrongIds.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5">
              <XCircle size={13} className="text-red-400" />
              <span className="text-sm font-bold text-red-400">{persistentWrongIds.length}</span>
            </div>
          )}
          {/* Correct badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5">
            <span className="text-sm font-bold text-[var(--accent)]">{correctCount}</span>
            <span className="text-sm text-[var(--muted)]">/ {GOAL}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 w-full max-w-xl overflow-hidden rounded-full bg-[var(--border)]">
        <motion.div
          className="h-full rounded-full bg-[var(--accent)]"
          animate={{ width: `${progressPct}%` }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-full max-w-xl gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
        <button
          onClick={() => setTab("quiz")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
            tab === "quiz" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          퀴즈
        </button>
        <button
          onClick={() => setTab("wrong")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
            tab === "wrong" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          오답 복습
          {wrongWords.length > 0 && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-bold", tab === "wrong" ? "bg-white/20 text-white" : "bg-red-500/20 text-red-400")}>
              {wrongWords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("song")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
            tab === "song" ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          <Music2 size={14} />
          랩 만들기
        </button>
      </div>

      {/* ── QUIZ TAB ── */}
      {tab === "quiz" && (
        <>
          {questDone ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-10 text-center"
            >
              <Trophy size={48} className="text-amber-400" />
              <h2 className="text-2xl font-bold text-amber-300">오늘 단어 완료!</h2>
              <p className="text-[var(--muted)]">
                {GOAL}개의 단어를 모두 맞혔습니다.
                <br />
                &quot;TEPS 단어 암기 1시간&quot; 퀘스트가 자동 완료되었습니다.
              </p>
              {wrongWords.length > 0 && (
                <button
                  onClick={() => setTab("wrong")}
                  className="mt-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
                >
                  오답 {wrongWords.length}개 복습하기 →
                </button>
              )}
              <p className="text-sm text-[var(--muted)]">내일 다시 도전할 수 있습니다.</p>
            </motion.div>
          ) : question ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={cardKey}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="w-full max-w-xl"
              >
                {/* Word card */}
                <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-8 py-7 text-center shadow-sm">
                  <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
                    영어 단어
                  </p>
                  <div className="mb-4 flex items-center justify-center gap-3">
                    <h2 className="text-4xl font-bold tracking-tight">
                      {question.word.word}
                    </h2>
                    <button
                      onClick={() => speak(question.word.word)}
                      title="발음 듣기"
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all",
                        isSpeaking
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      )}
                    >
                      <Volume2 size={16} className={isSpeaking ? "animate-pulse" : ""} />
                    </button>
                  </div>
                  {/* Example sentence */}
                  <p className="mx-auto max-w-sm text-sm italic text-[var(--muted)]">
                    &ldquo;{question.word.example}&rdquo;
                  </p>
                </div>

                {/* Choices */}
                <div className="grid grid-cols-2 gap-3">
                  {question.choices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={answerState !== "idle"}
                      className={cn(
                        "relative flex min-h-[72px] items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                        getButtonStyle(i)
                      )}
                    >
                      <span className="absolute left-3 top-3 text-xs font-bold text-[var(--muted)]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-center leading-snug">{choice}</span>
                      {answerState !== "idle" && i === question.correctIndex && (
                        <CheckCircle2
                          size={16}
                          className="absolute right-3 top-3 text-emerald-400"
                        />
                      )}
                      {answerState === "wrong" && i === selectedIndex && (
                        <XCircle
                          size={16}
                          className="absolute right-3 top-3 text-red-400"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Skip button */}
                <button
                  onClick={handleSkip}
                  disabled={answerState !== "idle"}
                  className={cn(
                    "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--muted)] transition-colors",
                    answerState === "idle"
                      ? "hover:border-[var(--muted)] hover:text-[var(--foreground)]"
                      : "cursor-not-allowed opacity-30"
                  )}
                >
                  <HelpCircle size={15} />
                  모르겠어요
                </button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-[var(--muted)]">단어를 불러오는 중...</p>
          )}
        </>
      )}

      {/* ── WRONG TAB ── */}
      {tab === "wrong" && (
        <div className="w-full max-w-xl">
          {wrongWords.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
              <CheckCircle2 size={40} className="text-emerald-500/50" />
              <p className="font-medium">오답이 없습니다!</p>
              <p className="text-sm">퀴즈를 풀면 틀린 단어가 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="mb-4 text-sm text-[var(--muted)]">
                누적 오답 단어 <span className="font-bold text-red-400">{wrongWords.length}개</span> — 맞히면 자동으로 목록에서 제거됩니다.
              </p>
              {wrongWords.map((w) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{w.word}</span>
                      <button
                        onClick={() => speak(w.word)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                    <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                      오답
                    </span>
                  </div>
                  <p className="mb-2 font-medium text-[var(--accent)]">{w.meaning}</p>
                  <p className="text-sm italic text-[var(--muted)]">&ldquo;{w.example}&rdquo;</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SONG TAB ── */}
      {tab === "song" && (
        <div className="w-full max-w-xl space-y-4">
          {wrongWords.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-[var(--muted)]">
              <Music2 size={36} className="opacity-30" />
              <p className="font-medium">오답 단어가 없어요</p>
              <p className="text-sm">퀴즈를 풀고 틀린 단어를 모아봐!</p>
            </div>
          ) : (
            <>
              {/* 단어 목록 */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)] overflow-hidden">
                {wrongWords.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-5 text-xs text-[var(--muted)] shrink-0">{i + 1}</span>
                    <span className="font-bold text-[var(--foreground)] w-36 shrink-0">{w.word}</span>
                    <span className="text-sm text-[var(--muted)]">—</span>
                    <span className="text-sm text-[var(--accent)]">{w.meaning}</span>
                  </div>
                ))}
              </div>

              {/* 비트 플레이어 */}
              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  비트 재생하면 영어 → 한국어 순으로 읽어줘
                </p>
                <BeatPlayer words={wrongWords.map((w) => ({ word: w.word, meaning: w.meaning }))} />
              </div>
            </>
          )}
        </div>
      )}

      <XpToast xp={100} show={showXp} />
    </div>
  );
}
