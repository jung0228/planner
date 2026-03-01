"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Event } from "@/lib/db";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "work", label: "업무", color: "#3B82F6" },
  { value: "personal", label: "개인", color: "#10B981" },
  { value: "health", label: "건강", color: "#F59E0B" },
  { value: "study", label: "공부", color: "#8B5CF6" },
  { value: "other", label: "기타", color: "#6B7280" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Event, "id" | "created_at" | "updated_at">) => void;
  editEvent?: Event | null;
};

export function EventModal({ isOpen, onClose, onSubmit, editEvent }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [category, setCategory] = useState("other");
  const [isAllDay, setIsAllDay] = useState(false);

  const color = CATEGORIES.find((c) => c.value === category)?.color ?? "#6B7280";

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description ?? "");
      const s = new Date(editEvent.start_date);
      const e = new Date(editEvent.end_date);
      setStartDate(s.toISOString().slice(0, 10));
      setStartTime(s.toTimeString().slice(0, 5));
      setEndDate(e.toISOString().slice(0, 10));
      setEndTime(e.toTimeString().slice(0, 5));
      setCategory(editEvent.category);
      setIsAllDay(editEvent.is_all_day);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
      setTitle("");
      setDescription("");
      setStartTime("09:00");
      setEndTime("10:00");
      setCategory("other");
      setIsAllDay(false);
    }
  }, [editEvent, isOpen]);

  useEffect(() => {
    if (!startDate) return;
    if (!endDate || endDate < startDate) setEndDate(startDate);
  }, [startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = isAllDay
      ? new Date(startDate + "T00:00:00")
      : new Date(startDate + "T" + startTime);
    const end = isAllDay
      ? new Date(endDate + "T23:59:59")
      : new Date(endDate + "T" + endTime);

    if (end <= start) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      category,
      color,
      is_all_day: isAllDay,
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[60] mx-4 w-full max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editEvent ? "일정 수정" : "새 일정"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="일정 제목"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">설명 (선택)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="상세 설명"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-[var(--border)]"
                  />
                  <span className="text-sm font-medium">종일 일정</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <label className="mb-1 block text-sm font-medium">시작</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  {!isAllDay && (
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <label className="mb-1 block text-sm font-medium">종료</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  {!isAllDay && (
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                        category === c.value
                          ? "text-white"
                          : "bg-[var(--border)]/50 text-[var(--muted)] hover:bg-[var(--border)]"
                      )}
                      style={
                        category === c.value
                          ? { backgroundColor: c.color }
                          : undefined
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-[var(--border)] py-2.5 font-medium transition-colors hover:bg-[var(--border)]/50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg py-2.5 font-medium text-white transition-colors"
                  style={{ backgroundColor: color }}
                >
                  {editEvent ? "저장" : "추가"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
