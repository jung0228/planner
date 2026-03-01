import type { PresenceStatus } from "./presence";
import { PRESENCE_OPTIONS } from "./presence";

export type TimelineSegment = {
  status: PresenceStatus;
  startMin: number;
  endMin: number | null;
};

const STORAGE_PREFIX = "personal-site-timeline-";
const MINUTES_PER_DAY = 24 * 60;

function getMinutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getTimelineSegments(dateStr: string): TimelineSegment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${dateStr}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTimelineSegments(dateStr: string, segments: TimelineSegment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${dateStr}`, JSON.stringify(segments));
  } catch {}
}

export function recordStatusChange(
  newStatus: PresenceStatus,
  dateStr?: string
): TimelineSegment[] {
  const d = dateStr || getTodayDateStr();
  const nowMin = getMinutesFromMidnight(new Date());
  const segments = getTimelineSegments(d);

  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    if (last.endMin === null) {
      last.endMin = nowMin;
    }
  }

  if (newStatus !== "none") {
    segments.push({
      status: newStatus,
      startMin: nowMin,
      endMin: null,
    });
  }

  saveTimelineSegments(d, segments);
  return segments;
}

export function getSegmentsForDisplay(dateStr: string): TimelineSegment[] {
  const segments = getTimelineSegments(dateStr);
  const nowMin = getMinutesFromMidnight(new Date());
  const today = getTodayDateStr();

  return segments.map((s) => ({
    ...s,
    endMin: s.endMin ?? (dateStr === today ? nowMin : MINUTES_PER_DAY - 1),
  }));
}

export const TIMELINE_COLORS: Record<
  Exclude<PresenceStatus, "none">,
  { bg: string; border: string }
> = {
  studying: { bg: "bg-blue-200/80 dark:bg-blue-800/60", border: "border-blue-400/60" },
  coding: { bg: "bg-emerald-200/80 dark:bg-emerald-800/60", border: "border-emerald-400/60" },
  gaming: { bg: "bg-violet-200/80 dark:bg-violet-800/60", border: "border-violet-400/60" },
  researching: { bg: "bg-amber-200/80 dark:bg-amber-800/60", border: "border-amber-400/60" },
  blogging: { bg: "bg-rose-200/80 dark:bg-rose-800/60", border: "border-rose-400/60" },
  resting: { bg: "bg-sky-200/80 dark:bg-sky-800/60", border: "border-sky-400/60" },
  away: { bg: "bg-stone-200/80 dark:bg-stone-700/60", border: "border-stone-400/60" },
};
