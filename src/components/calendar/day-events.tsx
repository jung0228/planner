"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";
import type { Event } from "@/lib/db";

type Props = {
  date: Date | null;
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
};

export function DayEvents({ date, events, onEdit, onDelete }: Props) {
  if (!date) return null;

  const dayEvents = events.filter((e) => {
    const start = parseISO(e.start_date);
    const end = parseISO(e.end_date);
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    return (start <= dEnd && end >= d) || (e.is_all_day && start <= dEnd && end >= d);
  });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Calendar size={16} />
        {format(date, "M월 d일 (EEE)", { locale: ko })} 일정
      </h3>
      {dayEvents.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">이 날 일정이 없어요</p>
      ) : (
        <div className="space-y-2">
          {dayEvents.map((ev) => (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group rounded-lg border border-[var(--border)] p-3 transition-colors hover:border-[var(--accent)]/30"
            >
              <div
                className="mb-1 h-1 w-8 rounded-full"
                style={{ backgroundColor: ev.color }}
              />
              <h4 className="font-medium">{ev.title}</h4>
              {ev.description && (
                <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                  {ev.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                <Clock size={12} />
                {ev.is_all_day
                  ? "종일"
                  : `${format(parseISO(ev.start_date), "HH:mm")} - ${format(parseISO(ev.end_date), "HH:mm")}`}
              </div>
              <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(ev)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(ev)}
                  className="text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
