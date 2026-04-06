import { supabase } from "./supabase";
import type { Quest } from "./quests";
import type { Routine } from "./routines";

const QUESTS_KEY = "personal-site-quests";
const STATS_KEY = "personal-site-quest-stats";
const ROUTINES_KEY = "personal-site-routines";
const ROUTINE_COMPLETIONS_KEY = "personal-site-routine-completions";
const STUDY_STATUS_KEY = "study-status";
const SHARED_BOARD_KEY = "shared-board";

export type StudyStatus = {
  active: boolean;
  started_at: string | null;
  today_minutes: number;
  sessions_today: number;
  date: string;
};

export type BoardItem = { id: string; text: string; done: boolean };
export type SharedBoard = { date: string; items: BoardItem[] };

export type Challenge = {
  id: string;
  toUserId: string;
  title: string;
  rarity: "normal" | "rare" | "epic" | "legendary";
  xp: number;
  ts: string;
};

export type Comment = { userId: string; text: string; ts: string };

type Stats = {
  totalXp: number;
  datesWithCompletion: string[];
  totalCompletions?: number;
};

async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

async function pushKey(key: string, value: unknown) {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) { console.warn("[sync] pushKey: no userId, skipping", key); return; }
  const { error } = await supabase.from("user_store").upsert(
    { user_id: userId, key, value, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
  if (error) console.error("[sync] pushKey failed:", key, error.message, error.details);
}

// 서버 → localStorage (페이지 로드 시)
export async function pullFromSupabase(): Promise<void> {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data } = await supabase
    .from("user_store")
    .select("key, value")
    .eq("user_id", userId);

  if (!data) return;
  for (const row of data) {
    if (row.value === null || row.value === undefined) continue;
    // 빈 배열/객체로 기존 로컬 데이터 덮어쓰기 방지
    const isEmpty =
      (Array.isArray(row.value) && row.value.length === 0) ||
      (typeof row.value === "object" && !Array.isArray(row.value) && Object.keys(row.value).length === 0);
    const localRaw = localStorage.getItem(row.key);
    if (isEmpty && localRaw) continue; // 로컬에 데이터 있으면 빈 Supabase 데이터로 덮어쓰지 않음
    localStorage.setItem(row.key, JSON.stringify(row.value));
  }
}

export async function upsertQuestToSupabase(_quest: Quest): Promise<void> {
  try {
    const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) ?? "[]");
    await pushKey(QUESTS_KEY, quests);
  } catch {}
}

export async function deleteQuestFromSupabase(_id: string): Promise<void> {
  try {
    const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) ?? "[]");
    await pushKey(QUESTS_KEY, quests);
  } catch {}
}

export async function upsertStatsToSupabase(_stats: Stats): Promise<void> {
  try {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}");
    await pushKey(STATS_KEY, stats);
  } catch {}
}

export async function syncRoutinesToSupabase(_routines: Routine[]): Promise<void> {
  try {
    const routines = JSON.parse(localStorage.getItem(ROUTINES_KEY) ?? "[]");
    await pushKey(ROUTINES_KEY, routines);
  } catch {}
}

export async function deleteRoutineFromSupabase(_id: string): Promise<void> {
  try {
    const routines = JSON.parse(localStorage.getItem(ROUTINES_KEY) ?? "[]");
    const completions = JSON.parse(localStorage.getItem(ROUTINE_COMPLETIONS_KEY) ?? "{}");
    await Promise.all([
      pushKey(ROUTINES_KEY, routines),
      pushKey(ROUTINE_COMPLETIONS_KEY, completions),
    ]);
  } catch {}
}

export function loadStudyStatus(): StudyStatus {
  if (typeof window === "undefined") return { active: false, started_at: null, today_minutes: 0, sessions_today: 0, date: "" };
  try {
    const data = localStorage.getItem(STUDY_STATUS_KEY);
    return data ? JSON.parse(data) : { active: false, started_at: null, today_minutes: 0, sessions_today: 0, date: "" };
  } catch {
    return { active: false, started_at: null, today_minutes: 0, sessions_today: 0, date: "" };
  }
}

export async function syncStudyStatusToSupabase(status: StudyStatus): Promise<void> {
  try {
    localStorage.setItem(STUDY_STATUS_KEY, JSON.stringify(status));
    await pushKey(STUDY_STATUS_KEY, status);
  } catch {}
}

export function loadSharedBoard(date: string): SharedBoard {
  if (typeof window === "undefined") return { date, items: [] };
  try {
    const data = localStorage.getItem(`${SHARED_BOARD_KEY}-${date}`);
    return data ? JSON.parse(data) : { date, items: [] };
  } catch {
    return { date, items: [] };
  }
}

export async function syncSharedBoardToSupabase(date: string, board: SharedBoard): Promise<void> {
  try {
    localStorage.setItem(`${SHARED_BOARD_KEY}-${date}`, JSON.stringify(board));
    await pushKey(`${SHARED_BOARD_KEY}-${date}`, board);
  } catch {}
}

const CHALLENGES_KEY = "quest-challenges-out";
const DISMISSED_KEY = "quest-challenges-dismissed";
const COMMENTS_KEY_PREFIX = "item-comments-";

export function loadMyChallenges(): Challenge[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CHALLENGES_KEY) ?? "[]"); } catch { return []; }
}

export async function sendChallengeToUser(challenge: Challenge): Promise<void> {
  const all = loadMyChallenges();
  all.push(challenge);
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(all));
  await pushKey(CHALLENGES_KEY, all);
}

export function loadDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"); } catch { return []; }
}

export async function dismissChallenge(challengeId: string): Promise<void> {
  const dismissed = loadDismissed();
  if (!dismissed.includes(challengeId)) {
    dismissed.push(challengeId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    await pushKey(DISMISSED_KEY, dismissed);
  }
}

export function loadMyItemComments(date: string): Record<string, Comment[]> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(`${COMMENTS_KEY_PREFIX}${date}`) ?? "{}"); } catch { return {}; }
}

export async function addItemComment(date: string, itemId: string, comment: Comment): Promise<void> {
  const all = loadMyItemComments(date);
  if (!all[itemId]) all[itemId] = [];
  all[itemId].push(comment);
  localStorage.setItem(`${COMMENTS_KEY_PREFIX}${date}`, JSON.stringify(all));
  await pushKey(`${COMMENTS_KEY_PREFIX}${date}`, all);
}

export async function upsertRoutineCompletionToSupabase(
  _routineId: string,
  _date: string,
  _completed: boolean
): Promise<void> {
  try {
    const completions = JSON.parse(localStorage.getItem(ROUTINE_COMPLETIONS_KEY) ?? "{}");
    await pushKey(ROUTINE_COMPLETIONS_KEY, completions);
  } catch {}
}
