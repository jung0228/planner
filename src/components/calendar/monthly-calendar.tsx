"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { Event } from "@/lib/db";
import { cn } from "@/lib/utils";

type Props = {
  currentMonth: Date;
  events: Event[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: Event) => void;
  onDateDrop?: (date: Date, eventId: string) => void;
  selectedDate: Date | null;
};

export function MonthlyCalendar({
  currentMonth,
  events,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onSelectEvent,
  onDateDrop,
  selectedDate,
}: Props) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const start = parseISO(e.start_date);
      const end = parseISO(e.end_date);
      return (
        (date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
          date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) ||
        isSameDay(start, date) ||
        isSameDay(end, date)
      );
    });
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("eventId");
    if (id && onDateDrop) onDateDrop(date, id);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h2 className="text-xl font-bold">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onPrevMonth}
            className="rounded-lg p-2 hover:bg-[var(--border)] transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => {
              const today = new Date();
              onSelectDate(today);
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-[var(--border)]"
          >
            오늘
          </button>
          <button
            onClick={onNextMonth}
            className="rounded-lg p-2 hover:bg-[var(--border)] transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-sm font-medium text-[var(--muted)] border-b border-[var(--border)]">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="py-3">
            {d}
          </div>
        ))}
      </div>

      <div className="divide-y divide-[var(--border)]">
        {rows.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected =
                selectedDate && isSameDay(date, selectedDate);

              return (
                <div
                  key={date.toISOString()}
                  onDrop={(e) => handleDrop(e, date)}
                  onDragOver={handleDragOver}
                  className={cn(
                    "min-h-[140px] border-r border-[var(--border)] last:border-r-0 p-2 transition-colors",
                    !isCurrentMonth && "bg-[var(--background)]/50",
                    isSelected && "bg-[var(--accent)]/10"
                  )}
                >
                  <button
                    onClick={() => onSelectDate(date)}
                    className={cn(
                      "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isToday(date)
                        ? "bg-[var(--accent)] text-white"
                        : "hover:bg-[var(--border)]",
                      !isCurrentMonth && "text-[var(--muted)]"
                    )}
                  >
                    {format(date, "d")}
                  </button>

                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("eventId", ev.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className="cursor-pointer truncate rounded px-2 py-1 text-xs font-medium text-white transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-[var(--muted)]">
                        +{dayEvents.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
