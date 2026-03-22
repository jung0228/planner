"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, SkipForward, Timer, Zap, Target, Check, Settings, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getStats, setStats, getQuestsByDate, toggleQuest, RARITY_CONFIG } from "@/lib/quests";
import { getRoutineQuestsForDate, toggleRoutineCompletion } from "@/lib/routines";
import { upsertQuestToSupabase, upsertRoutineCompletionToSupabase, upsertStatsToSupabase, syncStudyStatusToSupabase, loadStudyStatus, type StudyStatus } from "@/lib/quest-sync";

type Mode = "focus" | "short" | "long";

const DEFAULT_MINUTES: Record<Mode, number> = { focus: 25, short: 5, long: 15 };
const MODE_LABELS: Record<Mode, string> = { focus: "집중", short: "짧은 휴식", long: "긴 휴식" };
const MODE_COLORS: Record<Mode, string> = { focus: "var(--accent)", short: "#10b981", long: "#6366f1" };
const SETTINGS_KEY = "pomodoro-settings";

function loadSettings(): Record<Mode, number> {
  if (typeof window === "undefined") return DEFAULT_MINUTES;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_MINUTES, ...JSON.parse(data) } : DEFAULT_MINUTES;
  } catch {
    return DEFAULT_MINUTES;
  }
}

const SESSIONS_BEFORE_LONG = 4;
const XP_PER_SESSION = 10;
const RECORDS_KEY = "pomodoro-records";

const SHORT_BREAK_SUGGESTIONS = [
  { icon: "💧", title: "물 한 잔 마시기", desc: "수분 보충은 집중력 유지에 필수예요" },
  { icon: "🙆", title: "스트레칭하기", desc: "목, 어깨, 손목을 천천히 풀어주세요" },
  { icon: "👀", title: "먼 곳 바라보기", desc: "창밖 멀리 20초 이상 바라보세요. 눈 피로가 풀려요" },
  { icon: "🚶", title: "자리에서 일어나기", desc: "잠깐 일어나서 서있기만 해도 혈액순환이 돼요" },
  { icon: "😮‍💨", title: "깊게 숨쉬기", desc: "코로 4초 들이쉬고, 입으로 4초 내쉬어요" },
];

const LONG_BREAK_SUGGESTIONS = [
  { icon: "🚶", title: "짧은 산책", desc: "5~10분 걷기. 뇌에 산소가 공급되어 다음 세션이 훨씬 잘 돼요" },
  { icon: "🍎", title: "가벼운 간식", desc: "견과류나 과일 등 가벼운 걸로 에너지 보충하세요" },
  { icon: "🙆", title: "전신 스트레칭", desc: "허리, 다리까지 충분히 늘려주세요" },
  { icon: "🧘", title: "눈 감고 쉬기", desc: "아무 것도 안 하고 그냥 쉬어도 돼요. 뇌가 정리됩니다" },
];

type PomodoroRecord = {
  id: string;
  date: string;
  endTime: string;
  focusMinutes: number;
};

type QuestItem = {
  id: string;
  title: string;
  rarity: string;
  xp: number;
  completed: boolean;
  isRoutine?: boolean;
};

function loadRecords(): PomodoroRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecord(record: PomodoroRecord) {
  const records = loadRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>("focus");
  const [customMinutes, setCustomMinutes] = useState<Record<Mode, number>>(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES.focus * 60);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [records, setRecords] = useState<PomodoroRecord[]>([]);
  const [xpToast, setXpToast] = useState(false);
  const [questCompletedToast, setQuestCompletedToast] = useState<string | null>(null);
  const [breakSuggestion, setBreakSuggestion] = useState<{ icon: string; title: string; desc: string } | null>(null);
  const [todayQuests, setTodayQuests] = useState<QuestItem[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState<Record<Mode, number>>(DEFAULT_MINUTES);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modeMinutes = customMinutes[mode];
  const modeColor = MODE_COLORS[mode];
  const modeLabel = MODE_LABELS[mode];
  const total = modeMinutes * 60;
  const progress = 1 - secondsLeft / total;
  const today = getTodayStr();

  const loadTodayQuests = useCallback(() => {
    const routineQuests = getRoutineQuestsForDate(today);
    const customQuests = getQuestsByDate(today);
    const all: QuestItem[] = [
      ...routineQuests.map((q) => ({ id: q.id, title: q.title, rarity: q.rarity, xp: q.xp, completed: q.completed, isRoutine: true })),
      ...customQuests.map((q) => ({ id: q.id, title: q.title, rarity: q.rarity, xp: q.xp, completed: q.completed, isRoutine: false })),
    ];
    setTodayQuests(all);
    // 선택된 퀘스트가 완료됐으면 선택 해제
    if (selectedQuestId) {
      const selected = all.find((q) => q.id === selectedQuestId);
      if (selected?.completed) setSelectedQuestId(null);
    }
  }, [today, selectedQuestId]);

  useEffect(() => {
    const saved = loadSettings();
    setCustomMinutes(saved);
    setDraftMinutes(saved);
    setSecondsLeft(saved.focus * 60);
    setRecords(loadRecords());
    loadTodayQuests();
  }, []);

  const todayRecords = records.filter((r) => r.date === today);
  const todaySessions = todayRecords.length;
  const todayFocusMin = todayRecords.reduce((sum, r) => sum + r.focusMinutes, 0);

  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayRecords = records.filter((r) => r.date === dateStr);
    return {
      dateStr,
      label: i === 0 ? "오늘" : format(d, "M/d (EEE)", { locale: ko }),
      sessions: dayRecords.length,
      focusMin: dayRecords.reduce((sum, r) => sum + r.focusMinutes, 0),
    };
  }).reverse();

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const getOrInitStudyStatus = useCallback((): StudyStatus => {
    const saved = loadStudyStatus();
    const todayStr = getTodayStr();
    if (saved.date !== todayStr) {
      return { active: false, started_at: null, today_minutes: 0, sessions_today: 0, date: todayStr };
    }
    return saved;
  }, []);

  const completeSelectedQuest = useCallback((questId: string, quests: QuestItem[]) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;

    if (quest.isRoutine) {
      const routineId = questId.slice(8); // "routine-" prefix 제거
      toggleRoutineCompletion(routineId, today);
      upsertRoutineCompletionToSupabase(routineId, today, true);
    } else {
      const updated = toggleQuest(questId);
      if (updated) upsertQuestToSupabase(updated);
    }
    upsertStatsToSupabase(getStats());
    setQuestCompletedToast(quest.title);
    setTimeout(() => setQuestCompletedToast(null), 3000);
    setSelectedQuestId(null);
    loadTodayQuests();
  }, [today, loadTodayQuests]);

  const handleComplete = useCallback(() => {
    stop();
    if (mode === "focus") {
      const next = sessionCount + 1;
      setSessionCount(next);

      // 세션 기록 저장
      const record: PomodoroRecord = {
        id: `${Date.now()}`,
        date: today,
        endTime: new Date().toISOString(),
        focusMinutes: modeMinutes,
      };
      saveRecord(record);
      setRecords(loadRecords());

      // 공부 상태 동기화
      const prevStatus = getOrInitStudyStatus();
      const updatedStatus: StudyStatus = {
        active: false,
        started_at: null,
        today_minutes: prevStatus.today_minutes + modeMinutes,
        sessions_today: prevStatus.sessions_today + 1,
        date: today,
      };
      syncStudyStatusToSupabase(updatedStatus);

      // XP 추가
      const stats = getStats();
      stats.totalXp = (stats.totalXp ?? 0) + XP_PER_SESSION;
      if (!stats.datesWithCompletion.includes(today)) {
        stats.datesWithCompletion.push(today);
        stats.datesWithCompletion.sort();
      }
      setStats(stats);
      setXpToast(true);
      setTimeout(() => setXpToast(false), 2000);

      // 선택된 퀘스트 완료 처리
      if (selectedQuestId) {
        completeSelectedQuest(selectedQuestId, todayQuests);
      }

      const nextMode: Mode = next % SESSIONS_BEFORE_LONG === 0 ? "long" : "short";
      setMode(nextMode);
      setSecondsLeft(customMinutes[nextMode] * 60);
      const suggestions = nextMode === "long" ? LONG_BREAK_SUGGESTIONS : SHORT_BREAK_SUGGESTIONS;
      setBreakSuggestion(suggestions[next % suggestions.length]);
    } else {
      setMode("focus");
      setSecondsLeft(customMinutes.focus * 60);
      setBreakSuggestion(null);
    }
  }, [mode, sessionCount, modeMinutes, stop, today, selectedQuestId, todayQuests, completeSelectedQuest, customMinutes, getOrInitStudyStatus]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, handleComplete]);

  const handleModeChange = (m: Mode) => {
    stop();
    setMode(m);
    setSecondsLeft(customMinutes[m] * 60);
  };

  const handleReset = () => {
    stop();
    setSecondsLeft(total);
  };

  const handleSaveSettings = () => {
    const clamped: Record<Mode, number> = {
      focus: Math.max(1, Math.min(120, draftMinutes.focus)),
      short: Math.max(1, Math.min(60, draftMinutes.short)),
      long: Math.max(1, Math.min(60, draftMinutes.long)),
    };
    setCustomMinutes(clamped);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(clamped));
    stop();
    setSecondsLeft(clamped[mode] * 60);
    setSettingsOpen(false);
  };

  const handleSkip = () => {
    stop();
    handleComplete();
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const incompleteQuests = todayQuests.filter((q) => !q.completed);
  const selectedQuest = todayQuests.find((q) => q.id === selectedQuestId);

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8 mb-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 md:px-8 pb-6 md:pb-8 pt-5 md:pt-8 shadow-sm">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <Timer size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">뽀모도로</h1>
            <p className="text-sm text-[var(--muted-foreground)]">집중과 휴식을 반복하며 효율을 높이세요</p>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 타이머 영역 */}
        <div className="flex-1 flex flex-col items-center gap-6">
          {/* 모드 탭 + 설정 버튼 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-sm">
              {(["focus", "short", "long"] as Mode[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleModeChange(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    mode === key ? "bg-[var(--accent)] text-white shadow" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  {MODE_LABELS[key]} ({customMinutes[key]}분)
                </button>
              ))}
            </div>
            <button
              onClick={() => { setDraftMinutes(customMinutes); setSettingsOpen(true); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm hover:bg-[var(--muted)]"
              title="시간 설정"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* 시간 설정 패널 */}
          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--foreground)]">시간 설정 (분)</span>
                  <button onClick={() => setSettingsOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(["focus", "short", "long"] as Mode[]).map((key) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs text-[var(--muted-foreground)]">{MODE_LABELS[key]}</label>
                      <input
                        type="number"
                        min={1}
                        max={key === "focus" ? 120 : 60}
                        value={draftMinutes[key]}
                        onChange={(e) => setDraftMinutes((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-sm font-bold text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="w-full rounded-xl bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                >
                  저장
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 선택된 퀘스트 표시 */}
          <AnimatePresence>
            {selectedQuest && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent)]"
              >
                <Target size={16} />
                <span>{selectedQuest.title}</span>
                <button onClick={() => setSelectedQuestId(null)} className="ml-1 opacity-60 hover:opacity-100 text-xs">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 휴식 추천 */}
          <AnimatePresence>
            {breakSuggestion && mode !== "focus" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center"
              >
                <div className="text-3xl mb-2">{breakSuggestion.icon}</div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{breakSuggestion.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{breakSuggestion.desc}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 원형 타이머 */}
          <motion.div key={mode} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative flex items-center justify-center">
            <svg width={290} height={290} className="-rotate-90">
              <circle cx={145} cy={145} r={radius} fill="none" stroke="var(--border)" strokeWidth={12} />
              <circle
                cx={145} cy={145} r={radius} fill="none"
                stroke={modeColor} strokeWidth={12} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center gap-1">
              <span className="text-6xl font-bold tabular-nums text-[var(--foreground)]" suppressHydrationWarning>
                {formatTime(secondsLeft)}
              </span>
              <span className="text-sm font-medium text-[var(--muted-foreground)]">{modeLabel}</span>
            </div>
          </motion.div>

          {/* 토스트 */}
          <div className="h-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {questCompletedToast ? (
                <motion.div
                  key="quest"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg"
                >
                  <Check size={16} />
                  퀘스트 완료! &quot;{questCompletedToast}&quot;
                </motion.div>
              ) : xpToast ? (
                <motion.div
                  key="xp"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white shadow-lg"
                >
                  <Zap size={16} />
                  +{XP_PER_SESSION} XP 획득!
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleReset}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:bg-[var(--muted)]">
              <RotateCcw size={20} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => {
              const next = !running;
              setRunning(next);
              if (mode === "focus") {
                const status = getOrInitStudyStatus();
                syncStudyStatusToSupabase({ ...status, active: next, started_at: next ? new Date().toISOString() : null });
              }
            }}
              className="flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: modeColor }}>
              {running ? <Pause size={32} /> : <Play size={32} className="translate-x-0.5" />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSkip}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:bg-[var(--muted)]">
              <SkipForward size={20} />
            </motion.button>
          </div>

          {/* 세션 도트 */}
          <div className="flex gap-2">
            {Array.from({ length: SESSIONS_BEFORE_LONG }).map((_, i) => {
              const filled = i < (sessionCount % SESSIONS_BEFORE_LONG);
              return (
                <div key={i} className="h-3 w-3 rounded-full transition-all"
                  style={{ backgroundColor: filled ? modeColor : "var(--border)", transform: filled ? "scale(1.2)" : "scale(1)" }} />
              );
            })}
          </div>

          {/* 오늘 통계 */}
          <div className="flex gap-4 w-full max-w-sm">
            <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-[var(--foreground)]">{todaySessions}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">오늘 세션</p>
            </div>
            <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-[var(--foreground)]">{todayFocusMin}분</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">오늘 집중</p>
            </div>
            <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-[var(--foreground)]">{todaySessions * XP_PER_SESSION}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">오늘 XP</p>
            </div>
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* 퀘스트 선택 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[var(--foreground)] mb-1">목표 퀘스트</h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">세션 완료 시 자동으로 체크됩니다</p>
            {incompleteQuests.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-3">오늘 퀘스트가 없어요</p>
            ) : (
              <div className="space-y-2">
                {incompleteQuests.map((quest) => {
                  const rarityColor = RARITY_CONFIG[quest.rarity as keyof typeof RARITY_CONFIG]?.color ?? "#94a3b8";
                  const isSelected = selectedQuestId === quest.id;
                  return (
                    <button
                      key={quest.id}
                      onClick={() => setSelectedQuestId(isSelected ? null : quest.id)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-[var(--border)] hover:bg-[var(--muted)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: rarityColor }} />
                        <span className={`flex-1 font-medium ${isSelected ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                          {quest.title}
                        </span>
                        {isSelected && <Target size={14} className="text-[var(--accent)] shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 최근 7일 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[var(--foreground)] mb-4">최근 7일</h2>
            <div className="space-y-3">
              {recentDays.map((day) => {
                const maxMin = Math.max(...recentDays.map((d) => d.focusMin), 1);
                const barWidth = day.focusMin > 0 ? Math.max(8, (day.focusMin / maxMin) * 100) : 0;
                return (
                  <div key={day.dateStr}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={day.dateStr === today ? "font-bold text-[var(--accent)]" : "text-[var(--muted-foreground)]"}>
                        {day.label}
                      </span>
                      <span className="text-[var(--foreground)] font-medium">
                        {day.focusMin > 0 ? `${day.sessions}세션 · ${day.focusMin}분` : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: "var(--accent)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 오늘 세션 로그 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-base font-bold text-[var(--foreground)] mb-4">오늘 기록</h2>
            {todayRecords.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">아직 완료한 세션이 없어요</p>
            ) : (
              <div className="space-y-2">
                {[...todayRecords].reverse().map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent)] font-bold">#{todayRecords.length - i}</span>
                      <span className="text-[var(--foreground)]">{r.focusMinutes}분 집중</span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{format(new Date(r.endTime), "HH:mm")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
