"use client";

import { format, isSameMonth, isToday, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";

type Props = {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export function MiniCalendar({ currentMonth, selectedDate, onSelectDate }: Props) {
  const start = startOfMonth(currentMonth);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const startDay = start.getDay();
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="mb-3 text-center text-sm font-medium text-[var(--muted)]">
        {format(currentMonth, "yyyy년 M월", { locale: ko })}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {dayNames.map((d) => (
          <div key={d} className="font-medium text-[var(--muted)]">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          if (d === null)
            return <div key={`empty-${i}`} className="py-1.5" />;
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            d
          );
          const selected =
            selectedDate.getDate() === d &&
            isSameMonth(selectedDate, currentMonth);
          const today = isToday(date);
          return (
            <button
              key={d}
              onClick={() => onSelectDate(date)}
              className={`rounded-lg py-1.5 transition-colors hover:bg-[var(--border)] ${
                selected
                  ? "bg-[var(--accent)] text-white"
                  : today
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : ""
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
