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

type Stats = {
  totalXp: number;
  datesWithCompletion: string[];
  totalCompletions?: number;
};

async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function pushKey(key: string, value: unknown) {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) return;
  await supabase.from("user_store").upsert(
    { user_id: userId, key, value, updated_at: new Date().toISOString() },
    { onConflict: "user_id,key" }
  );
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
    if (row.value !== null && row.value !== undefined) {
      localStorage.setItem(row.key, JSON.stringify(row.value));
    }
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
