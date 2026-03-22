"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths, subMonths, startOfMonth, endOfMonth,
  format, eachDayOfInterval, isSameMonth, isSameDay,
  startOfWeek, endOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

type Event = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  user_id: string;
};

type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
};

type UserStats = {
  user_id: string;
  total_xp: number;
  total_completions: number;
  dates_with_completion: string[];
};

const PRESET_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];

function getUserColor(userId: string, profiles: Profile[]): string {
  const p = profiles.find((p) => p.id === userId);
  return p?.avatar_color ?? PRESET_COLORS[userId.charCodeAt(0) % PRESET_COLORS.length];
}

function getCurrentStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let check = today;
  for (const d of sorted) {
    if (d === check) {
      streak++;
      const prev = new Date(check + "T12:00:00");
      prev.setDate(prev.getDate() - 1);
      check = prev.toISOString().slice(0, 10);
    } else if (d < check) break;
  }
  return streak;
}

export default function SocialPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<UserStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!supabase) return;
    const start = startOfMonth(currentMonth).toISOString();
    const end = endOfMonth(currentMonth).toISOString();
    supabase.from("events").select("id,title,start_date,end_date,user_id")
      .gte("start_date", start).lte("end_date", end)
      .then(({ data }) => setEvents((data ?? []) as Event[]));
  }, [currentMonth]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("profiles").select("id,display_name,avatar_color")
      .then(({ data }) => { if (data) setProfiles(data as Profile[]); });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("user_store").select("user_id,value").eq("key", "personal-site-quest-stats")
      .then(({ data }) => {
        if (!data) return;
        setStats(data.map((row) => {
          const v = row.value as { totalXp?: number; totalCompletions?: number; datesWithCompletion?: string[] } | null;
          return {
            user_id: row.user_id,
            total_xp: v?.totalXp ?? 0,
            total_completions: v?.totalCompletions ?? 0,
            dates_with_completion: v?.datesWithCompletion ?? [],
          };
        }));
      });
  }, []);

  const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedEvents = events.filter((e) => e.start_date.slice(0, 10) <= selectedDateStr && selectedDateStr <= e.end_date.slice(0, 10));

  const leaderboard = [...stats].sort((a, b) => b.total_xp - a.total_xp);
  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <Users size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">함께</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">멤버들의 일정과 퀘스트 현황을 확인해보세요</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 공유 달력 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
              <Calendar size={18} className="text-[var(--accent)]" />
              {format(currentMonth, "yyyy년 M월", { locale: ko })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--border)]"><ChevronLeft size={18} /></button>
              <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--border)]"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center">
            {["일","월","화","수","목","금","토"].map((d) => (
              <div key={d} className="py-1 text-xs font-medium text-[var(--muted-foreground)]">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEvents = events.filter((e) => e.start_date.slice(0, 10) <= dayStr && dayStr <= e.end_date.slice(0, 10));
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button key={dayStr} onClick={() => setSelectedDate(day)}
                  className={`relative flex min-h-[52px] flex-col items-center p-1 transition-colors hover:bg-[var(--border)]/30 ${isSelected ? "rounded-lg bg-[var(--accent)]/10" : ""} ${!isCurrentMonth ? "opacity-30" : ""}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday ? "bg-[var(--accent)] text-white" : "text-[var(--foreground)]"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span key={ev.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getUserColor(ev.user_id, profiles) }} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-[var(--muted-foreground)]">+{dayEvents.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedEvents.length > 0 && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
                {format(selectedDate, "M월 d일 (EEE)", { locale: ko })} 일정
              </p>
              <div className="space-y-2">
                {selectedEvents.map((ev) => {
                  const color = getUserColor(ev.user_id, profiles);
                  const isMe = ev.user_id === user?.id;
                  return (
                    <div key={ev.id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="flex-1 truncate text-sm text-[var(--foreground)]">{ev.title}</span>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: color }}>
                        {isMe ? "나" : getName(ev.user_id)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {profiles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.avatar_color }} />
                  {p.id === user?.id ? `${p.display_name} (나)` : p.display_name}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 리더보드 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
            <Trophy size={18} className="text-[var(--accent)]" />
            XP 리더보드
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">아직 데이터가 없어요</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, i) => {
                const color = getUserColor(entry.user_id, profiles);
                const name = getName(entry.user_id);
                const isMe = entry.user_id === user?.id;
                const streak = getCurrentStreak(entry.dates_with_completion);
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                return (
                  <div key={entry.user_id} className={`rounded-xl border p-3 ${isMe ? "border-[var(--accent)]/40 bg-[var(--accent)]/5" : "border-[var(--border)]"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medal}</span>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: color }}>
                        {name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{isMe ? `${name} (나)` : name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{entry.total_xp.toLocaleString()} XP</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-[var(--muted-foreground)]">
                      <span>완료 {entry.total_completions}개</span>
                      {streak > 0 && <span>🔥 {streak}일 연속</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
