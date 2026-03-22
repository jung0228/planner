import type { QuestRarity } from "./quests";
import { RARITY_CONFIG } from "./quests";
import { getStats, setStats } from "./quests";
import { generateId } from "./utils";

export type Routine = {
  id: string;
  title: string;
  description?: string;
  rarity: QuestRarity;
  order: number;
};

const ROUTINES_KEY = "personal-site-routines";
const ROUTINE_COMPLETIONS_KEY = "personal-site-routine-completions";

function getRoutines(): Routine[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ROUTINES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setRoutines(routines: Routine[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch {}
}

function getCompletions(): Record<string, Record<string, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(ROUTINE_COMPLETIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setCompletions(c: Record<string, Record<string, boolean>>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROUTINE_COMPLETIONS_KEY, JSON.stringify(c));
  } catch {}
}

export function getAllRoutines(): Routine[] {
  return getRoutines().sort((a, b) => a.order - b.order);
}

export function addRoutine(input: Omit<Routine, "id" | "order">): Routine {
  const routines = getRoutines();
  const maxOrder = routines.length > 0 ? Math.max(...routines.map((r) => r.order)) : 0;
  const routine: Routine = {
    ...input,
    id: generateId(),
    order: maxOrder + 1,
  };
  routines.push(routine);
  setRoutines(routines);
  return routine;
}

export function removeRoutine(id: string): void {
  const routines = getRoutines();
  const routine = routines.find((r) => r.id === id);
  const completions = getCompletions();
  const stats = getStats();

  if (routine) {
    const config = RARITY_CONFIG[routine.rarity];
    for (const date of Object.keys(completions)) {
      if (completions[date][id]) {
        stats.totalXp = Math.max(0, stats.totalXp - config.xp);
        stats.totalCompletions = Math.max(0, (stats.totalCompletions ?? 0) - 1);
        const anyLeft = Object.entries(completions[date]).some(
          ([rid, v]) => rid !== id && v
        );
        if (!anyLeft) {
          stats.datesWithCompletion = stats.datesWithCompletion.filter((d) => d !== date);
        }
      }
      delete completions[date][id];
    }
    setStats(stats);
  }

  setRoutines(routines.filter((r) => r.id !== id));
  setCompletions(completions);
}

export function isRoutineCompleted(routineId: string, date: string): boolean {
  return getCompletions()[date]?.[routineId] ?? false;
}

export function getRoutineQuestsForDate(date: string): Array<{
  id: string;
  title: string;
  description?: string;
  rarity: QuestRarity;
  completed: boolean;
  date: string;
  xp: number;
  isRoutine: true;
}> {
  const routines = getAllRoutines();
  const completions = getCompletions();
  const dateCompletions = completions[date] ?? {};

  return routines.map((r) => {
    const config = RARITY_CONFIG[r.rarity];
    return {
      id: `routine-${r.id}`,
      title: r.title,
      description: r.description,
      rarity: r.rarity,
      completed: dateCompletions[r.id] ?? false,
      date,
      xp: config.xp,
      isRoutine: true as const,
    };
  });
}

export function seedRoutines(seeds: Omit<Routine, "id" | "order">[]): void {
  if (typeof window === "undefined") return;
  const existing = getRoutines();
  for (const seed of seeds) {
    const alreadyExists = existing.some((r) => r.title === seed.title);
    if (!alreadyExists) addRoutine(seed);
  }
}

export function toggleRoutineCompletion(routineId: string, date: string): boolean {
  const completions = getCompletions();
  if (!completions[date]) completions[date] = {};
  const wasCompleted = completions[date][routineId] ?? false;
  completions[date][routineId] = !wasCompleted;

  const routine = getRoutines().find((r) => r.id === routineId);
  if (routine) {
    const config = RARITY_CONFIG[routine.rarity];
    const stats = getStats();
    if (!wasCompleted) {
      stats.totalXp += config.xp;
      stats.totalCompletions = (stats.totalCompletions ?? 0) + 1;
      if (!stats.datesWithCompletion.includes(date)) {
        stats.datesWithCompletion.push(date);
        stats.datesWithCompletion.sort();
      }
    } else {
      stats.totalXp = Math.max(0, stats.totalXp - config.xp);
      stats.totalCompletions = Math.max(0, (stats.totalCompletions ?? 0) - 1);
      const anyLeft = Object.values(completions[date]).some(Boolean);
      if (!anyLeft) {
        stats.datesWithCompletion = stats.datesWithCompletion.filter((d) => d !== date);
      }
    }
    setStats(stats);
  }

  setCompletions(completions);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("quests-updated"));
  return !wasCompleted;
}
