"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type Event,
  type EventInput,
} from "@/lib/db";
import { format } from "date-fns";
import { EventModal } from "@/components/calendar/event-modal";
import { MonthlyCalendar } from "@/components/calendar/monthly-calendar";
import { DayEvents } from "@/components/calendar/day-events";
import { AiChatTab } from "@/components/quests/ai-chat-tab";
import type { AiEventItem } from "@/lib/ai-event-schema";
import { addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";

export default function CalendarPage() {
  const mounted = useMounted();
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  }, []);
  const [events, setEvents] = useState<Event[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!currentMonth) return;
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const data = await getEvents(start, end);
    setEvents(data);
  }, [currentMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreate = async (input: EventInput) => {
    const ev = await createEvent(input);
    setEvents((prev) => [...prev, ev].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()));
  };

  const handleAddAiEvent = async (item: AiEventItem) => {
    const endDate = item.endDate ?? item.date;
    await createEvent({
      title: item.title,
      start_date: `${item.date}T00:00:00`,
      end_date: `${endDate}T23:59:59`,
      category: "work",
      color: "#3B82F6",
      is_all_day: true,
    });
    await fetchEvents();
  };

  const handleUpdate = async (input: EventInput) => {
    if (!editEvent) return;
    const updated = await updateEvent(editEvent.id, input);
    if (updated) {
      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
      setEditEvent(null);
      setModalOpen(false);
    }
  };

  const handleDelete = async (ev: Event) => {
    if (!confirm(`"${ev.title}" 일정을 삭제할까요?`)) return;
    await deleteEvent(ev.id);
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    setEditEvent(null);
    setModalOpen(false);
  };

  const handleDateDrop = async (date: Date, eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;

    const start = new Date(ev.start_date);
    const end = new Date(ev.end_date);
    const diff = end.getTime() - start.getTime();

    const newStart = new Date(date);
    newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + diff);

    const updated = await updateEvent(eventId, {
      ...ev,
      start_date: newStart.toISOString(),
      end_date: newEnd.toISOString(),
    });
    if (updated) {
      setEvents((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    }
  };

  const openEdit = (ev: Event) => {
    setEditEvent(ev);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditEvent(null);
    setModalOpen(true);
  };

  if (!mounted || !currentMonth) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-[var(--border)]" />
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--border)]/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">일정</h1>
          <p className="text-[var(--muted-foreground)]">드래그로 날짜 이동 가능</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          <Plus size={20} />
          새 일정
        </motion.button>
      </motion.div>

      <div className="flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm lg:flex-row">
        <div className="min-w-0 flex-1">
          <MonthlyCalendar
            currentMonth={currentMonth}
            events={events}
            onPrevMonth={() => setCurrentMonth((m) => subMonths(m ?? new Date(), 1))}
            onNextMonth={() => setCurrentMonth((m) => addMonths(m ?? new Date(), 1))}
            onSelectDate={setSelectedDate}
            onSelectEvent={openEdit}
            onDateDrop={handleDateDrop}
            selectedDate={selectedDate}
          />
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-96">
          <DayEvents
            date={selectedDate}
            events={events}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <AiChatTab
            dateStr={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
            quests={[]}
            onAddQuest={() => {}}
            onAddEvent={handleAddAiEvent}
            disabled={!selectedDate}
            mode="calendar"
          />
        </div>
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditEvent(null);
        }}
        onSubmit={editEvent ? handleUpdate : handleCreate}
        editEvent={editEvent}
      />
    </div>
  );
}
