import { generateId } from "./utils";

export type QuestRarity = "normal" | "rare" | "epic" | "legendary";

export type Quest = {
  id: string;
  title: string;
  description?: string;
  rarity: QuestRarity;
  completed: boolean;
  date: string;
  xp: number;
  completedAt?: string;
};

export type QuestInput = Omit<Quest, "id" | "completed" | "completedAt">;

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (state: QuestState) => boolean;
};

export type QuestState = {
  totalQuestsCompleted: number;
  totalXp: number;
  currentStreak: number;
  maxStreak: number;
  datesWithCompletion: string[];
};

const QUESTS_KEY = "personal-site-quests";
const STATS_KEY = "personal-site-quest-stats";

function getQuests(): Quest[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(QUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setQuests(quests: Quest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
  } catch {}
}

export function getStats(): { totalXp: number; datesWithCompletion: string[]; totalCompletions?: number } {
  if (typeof window === "undefined") return { totalXp: 0, datesWithCompletion: [] };
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data ? JSON.parse(data) : { totalXp: 0, datesWithCompletion: [] };
  } catch {
    return { totalXp: 0, datesWithCompletion: [] };
  }
}

export function setStats(stats: { totalXp: number; datesWithCompletion: string[]; totalCompletions?: number }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function getQuestsByDate(date: string): Quest[] {
  return getQuests().filter((q) => q.date === date);
}

export function addQuest(input: QuestInput): Quest {
  const quest: Quest = {
    ...input,
    id: generateId(),
    completed: false,
  };
  const quests = getQuests();
  quests.push(quest);
  setQuests(quests);
  return quest;
}

export function toggleQuest(id: string): Quest | null {
  const quests = getQuests();
  const idx = quests.findIndex((q) => q.id === id);
  if (idx === -1) return null;

  const wasCompleted = quests[idx].completed;
  quests[idx].completed = !quests[idx].completed;
  quests[idx].completedAt = quests[idx].completed ? new Date().toISOString() : undefined;

  const stats = getStats();
  if (quests[idx].completed && !wasCompleted) {
    stats.totalXp += quests[idx].xp;
    stats.totalCompletions = (stats.totalCompletions ?? 0) + 1;
    const date = quests[idx].date;
    if (!stats.datesWithCompletion.includes(date)) {
      stats.datesWithCompletion.push(date);
      stats.datesWithCompletion.sort();
    }
  } else if (!quests[idx].completed && wasCompleted) {
    stats.totalXp = Math.max(0, stats.totalXp - quests[idx].xp);
    stats.totalCompletions = Math.max(0, (stats.totalCompletions ?? 0) - 1);
    const date = quests[idx].date;
    const othersOnDate = quests.filter(
      (q) => q.id !== id && q.date === date && q.completed
    );
    if (othersOnDate.length === 0) {
      stats.datesWithCompletion = stats.datesWithCompletion.filter((d) => d !== date);
    }
  }
  setStats(stats);
  setQuests(quests);
  return quests[idx];
}

export function deleteQuest(id: string): boolean {
  const quests = getQuests();
  const quest = quests.find((q) => q.id === id);
  if (quest?.completed) {
    const stats = getStats();
    stats.totalXp = Math.max(0, stats.totalXp - quest.xp);
    stats.totalCompletions = Math.max(0, (stats.totalCompletions ?? 0) - 1);
    const othersOnDate = quests.filter(
      (q) => q.id !== id && q.date === quest.date && q.completed
    );
    if (othersOnDate.length === 0) {
      stats.datesWithCompletion = stats.datesWithCompletion.filter((d) => d !== quest.date);
    }
    setStats(stats);
  }
  setQuests(quests.filter((q) => q.id !== id));
  return true;
}

export function getDailyStats(date: string) {
  const quests = getQuestsByDate(date);
  const completed = quests.filter((q) => q.completed).length;
  const totalXp = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xp, 0);
  return { total: quests.length, completed, totalXp };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getQuestState(): QuestState {
  const quests = getQuests();
  const stats = getStats();
  const completedQuests = quests.filter((q) => q.completed);
  const dateSet = new Set(completedQuests.map((q) => q.date));
  const datesWithCompletion = [...dateSet].sort();

  const today = new Date().toISOString().slice(0, 10);
  let currentStreak = 0;
  let check = new Date(today + "T12:00:00");
  for (let i = 0; i < 365; i++) {
    const d = check.toISOString().slice(0, 10);
    if (dateSet.has(d)) currentStreak++;
    else if (i > 0) break;
    check = addDays(check, -1);
  }

  let maxStreak = 0;
  let streak = 0;
  const sorted = [...datesWithCompletion].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) streak = 1;
    else {
      const prev = new Date(sorted[i - 1] + "T12:00:00");
      const curr = new Date(sorted[i] + "T12:00:00");
      const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else streak = 1;
    }
    maxStreak = Math.max(maxStreak, streak);
  }

  return {
    totalQuestsCompleted: stats.totalCompletions ?? completedQuests.length,
    totalXp: stats.totalXp,
    currentStreak,
    maxStreak,
    datesWithCompletion,
  };
}

export function getLevel(totalXp: number): { level: number; xpInLevel: number; xpToNext: number } {
  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const xpInLevel = totalXp % xpPerLevel;
  const xpToNext = xpPerLevel - xpInLevel;
  return { level, xpInLevel, xpToNext };
}

export const TITLES: [number, string][] = [
  [1, "모험가"],
  [5, "견습 용사"],
  [10, "용사"],
  [25, "고급 용사"],
  [50, "영웅"],
  [100, "전설의 영웅"],
  [200, "신화급 모험가"],
];

export function getTitle(level: number): string {
  let title = "초보 모험가";
  for (const [minLevel, t] of TITLES) {
    if (level >= minLevel) title = t;
  }
  return title;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first",
    name: "첫 발걸음",
    description: "첫 퀘스트 완료",
    icon: "🎯",
    condition: (s) => s.totalQuestsCompleted >= 1,
  },
  {
    id: "ten",
    name: "열심히 하는 사람",
    description: "퀘스트 10개 완료",
    icon: "⭐",
    condition: (s) => s.totalQuestsCompleted >= 10,
  },
  {
    id: "fifty",
    name: "미션 마스터",
    description: "퀘스트 50개 완료",
    icon: "🏆",
    condition: (s) => s.totalQuestsCompleted >= 50,
  },
  {
    id: "streak3",
    name: "꾸준함의 시작",
    description: "3일 연속 완료",
    icon: "🔥",
    condition: (s) => s.maxStreak >= 3,
  },
  {
    id: "streak7",
    name: "일주일 전사",
    description: "7일 연속 완료",
    icon: "💪",
    condition: (s) => s.maxStreak >= 7,
  },
  {
    id: "streak30",
    name: "달인의 길",
    description: "30일 연속 완료",
    icon: "👑",
    condition: (s) => s.maxStreak >= 30,
  },
];

export const RARITY_CONFIG: Record<
  QuestRarity,
  { label: string; color: string; xp: number; borderColor: string }
> = {
  normal: { label: "일반", color: "#94a3b8", xp: 10, borderColor: "#64748b" },
  rare: { label: "희귀", color: "#38bdf8", xp: 25, borderColor: "#0ea5e9" },
  epic: { label: "영웅", color: "#a78bfa", xp: 50, borderColor: "#7c3aed" },
  legendary: { label: "전설", color: "#fbbf24", xp: 100, borderColor: "#f59e0b" },
};

export const QUEST_TEMPLATES = [
  { title: "30분 운동하기", rarity: "normal" as QuestRarity },
  { title: "1시간 공부/독서", rarity: "normal" as QuestRarity },
  { title: "물 8잔 마시기", rarity: "normal" as QuestRarity },
  { title: "메모 정리하기", rarity: "rare" as QuestRarity },
  { title: "새로운 스킬 학습", rarity: "epic" as QuestRarity },
  { title: "중요한 프로젝트 진행", rarity: "legendary" as QuestRarity },
];
