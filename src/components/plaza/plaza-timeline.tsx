"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getSegmentsForDisplay,
  TIMELINE_COLORS,
  type TimelineSegment,
} from "@/lib/presence-timeline";
import { PRESENCE_OPTIONS } from "@/lib/presence";
import { useMounted } from "@/hooks/use-mounted";

const HEIGHT = 560;
const MINUTES_PER_DAY = 24 * 60;
const START_HOUR = 9;
const START_MIN = START_HOUR * 60;
const DISPLAY_MINUTES = MINUTES_PER_DAY - START_MIN;
const TICK_COUNT = 17;

function formatHour(h: number) {
  return h === 24 ? "24" : h === 25 ? "" : String(h).padStart(2, "0");
}

type Props = {
  dateStr: string;
  refreshTrigger?: number;
};

export function PlazaTimeline({ dateStr, refreshTrigger = 0 }: Props) {
  const mounted = useMounted();
  const [segments, setSegments] = useState<TimelineSegment[]>([]);

  useEffect(() => {
    if (!mounted || !dateStr) return;
    setSegments(getSegmentsForDisplay(dateStr));
  }, [mounted, dateStr, refreshTrigger]);

  useEffect(() => {
    if (!mounted || !dateStr) return;
    const id = setInterval(
      () => setSegments(getSegmentsForDisplay(dateStr)),
      60000
    );
    return () => clearInterval(id);
  }, [mounted, dateStr]);

  const nowMin = typeof window !== "undefined"
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : 0;

  if (!mounted) {
    return (
      <div className="h-[560px] w-32 animate-pulse rounded-2xl bg-amber-100/50 dark:bg-amber-900/20" />
    );
  }

  return (
    <div
      className="flex shrink-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm"
      style={{ height: HEIGHT + 48 }}
    >
      <p className="mb-2 text-center text-xs font-bold text-[var(--muted-foreground)]">
        24h 타임라인
      </p>
      <div className="relative flex-1 overflow-hidden rounded-xl bg-[var(--muted)]/50" style={{ minHeight: HEIGHT }}>
        {/* 시간 눈금 (9~25, 25는 하단 여유로 24가 잘리지 않게) */}
        <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: TICK_COUNT }, (_, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center border-t border-[var(--border)] px-1 py-0.5 text-[9px] text-[var(--muted-foreground)]"
              style={{ height: `${100 / TICK_COUNT}%` }}
            >
              {formatHour(START_HOUR + i)}
            </div>
          ))}
        </div>

        {/* 세그먼트 블록 */}
        <div
          className="absolute inset-2 left-6 overflow-hidden"
          style={{ height: HEIGHT - 16 }}
        >
          {segments.map((seg, i) => {
            if (seg.status === "none") return null;
            const opt = PRESENCE_OPTIONS.find((o) => o.value === seg.status);
            const colors = TIMELINE_COLORS[seg.status as keyof typeof TIMELINE_COLORS];
            const endMin = seg.endMin ?? nowMin;
            const displayStart = Math.max(seg.startMin, START_MIN);
            const displayEnd = Math.min(endMin, MINUTES_PER_DAY);
            if (displayEnd <= START_MIN || displayStart >= MINUTES_PER_DAY) return null;

            const topPct = ((displayStart - START_MIN) / DISPLAY_MINUTES) * 100;
            const heightPct =
              ((displayEnd - displayStart) / DISPLAY_MINUTES) * 100;

            if (heightPct <= 0) return null;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.3 }}
                className={`absolute left-0 right-0 rounded-md border ${colors?.border ?? "border-amber-400/60"} ${colors?.bg ?? "bg-amber-200/80"} flex flex-col items-center justify-center overflow-hidden`}
                style={{
                  top: `${topPct}%`,
                  height: `${Math.max(heightPct, 2)}%`,
                }}
                title={`${opt?.label ?? seg.status} ${Math.floor(seg.startMin / 60)}:${String(seg.startMin % 60).padStart(2, "0")}~`}
              >
                <span className="text-[8px] font-bold">
                  {opt?.emoji ?? "·"}
                </span>
                <span className="truncate px-0.5 text-[8px] font-medium leading-tight">
                  {opt?.label ?? seg.status}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* 현재 시간 라인 (오늘만, 9시~24시 구간) */}
        {dateStr ===
          `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}` &&
          nowMin >= START_MIN && (
          <div
            className="absolute left-6 right-2 h-0.5 bg-rose-500/80"
            style={{
              top: 16 + ((nowMin - START_MIN) / DISPLAY_MINUTES) * (HEIGHT - 16),
            }}
          >
            <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
          </div>
        )}
      </div>
    </div>
  );
}
