import { supabase } from "./supabase";
import type { Quest } from "./quests";
import type { Routine } from "./routines";

const QUESTS_KEY = "personal-site-quests";
const STATS_KEY = "personal-site-quest-stats";
const ROUTINES_KEY = "personal-site-routines";
const ROUTINE_COMPLETIONS_KEY = "personal-site-routine-completions";

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
