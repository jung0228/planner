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

async function pushKey(key: string, value: unknown) {
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  } catch {}
}

// 서버 → localStorage (페이지 로드 시)
export async function pullFromSupabase(): Promise<void> {
  try {
    const res = await fetch("/api/store");
    if (!res.ok) return;
    const data = await res.json();

    if (data[QUESTS_KEY]) localStorage.setItem(QUESTS_KEY, JSON.stringify(data[QUESTS_KEY]));
    if (data[STATS_KEY]) localStorage.setItem(STATS_KEY, JSON.stringify(data[STATS_KEY]));
    if (data[ROUTINES_KEY]) localStorage.setItem(ROUTINES_KEY, JSON.stringify(data[ROUTINES_KEY]));
    if (data[ROUTINE_COMPLETIONS_KEY]) localStorage.setItem(ROUTINE_COMPLETIONS_KEY, JSON.stringify(data[ROUTINE_COMPLETIONS_KEY]));
  } catch {}
}

// 퀘스트 변경 시: localStorage 전체를 서버에 저장
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
