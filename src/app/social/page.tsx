"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, BookOpen, Clock, Flame, RefreshCw, Play, Square } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { syncStudyStatusToSupabase, loadStudyStatus, type StudyStatus } from "@/lib/quest-sync";

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

type UserStudyStatus = {
  user_id: string;
  status: StudyStatus;
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

function getElapsedMinutes(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  return Math.floor((Date.now() - start) / 60000);
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(getElapsedMinutes(startedAt));
  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsedMinutes(startedAt)), 30000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span>{elapsed}분째 집중 중</span>;
}

export default function SocialPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<UserStats[]>([]);
  const [studyStatuses, setStudyStatuses] = useState<UserStudyStatus[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [myStudyStatus, setMyStudyStatus] = useState<StudyStatus | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // 내 공부 상태 로드
  useEffect(() => {
    const s = loadStudyStatus();
    if (s.date === today) setMyStudyStatus(s);
    else setMyStudyStatus({ active: false, started_at: null, today_minutes: 0, sessions_today: 0, date: today });
  }, [today]);

  const handleToggleStudy = async () => {
    const current = myStudyStatus ?? { active: false, started_at: null, today_minutes: 0, sessions_today: 0, date: today };
    let next: StudyStatus;
    if (current.active) {
      const elapsed = current.started_at ? Math.floor((Date.now() - new Date(current.started_at).getTime()) / 60000) : 0;
      next = { ...current, active: false, started_at: null, today_minutes: current.today_minutes + elapsed };
    } else {
      next = { ...current, active: true, started_at: new Date().toISOString() };
    }
    setMyStudyStatus(next);
    await syncStudyStatusToSupabase(next);
    // 내 상태를 studyStatuses에도 반영
    if (user) {
      setStudyStatuses((prev) => {
        const others = prev.filter((s) => s.user_id !== user.id);
        return [...others, { user_id: user.id, status: next }];
      });
    }
  };

  const fetchData = useCallback(async () => {
    if (!supabase) return;

    const [profilesRes, statsRes, studyRes] = await Promise.all([
      supabase.from("profiles").select("id,display_name,avatar_color"),
      supabase.from("user_store").select("user_id,value").eq("key", "personal-site-quest-stats"),
      supabase.from("user_store").select("user_id,value").eq("key", "study-status"),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);

    if (statsRes.data) {
      setStats(statsRes.data.map((row) => {
        const v = row.value as { totalXp?: number; totalCompletions?: number; datesWithCompletion?: string[] } | null;
        return {
          user_id: row.user_id,
          total_xp: v?.totalXp ?? 0,
          total_completions: v?.totalCompletions ?? 0,
          dates_with_completion: v?.datesWithCompletion ?? [],
        };
      }));
    }

    if (studyRes.data) {
      setStudyStatuses(studyRes.data.map((row) => ({
        user_id: row.user_id,
        status: row.value as StudyStatus,
      })));
    }

    setLastRefreshed(new Date());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 30초마다 자동 갱신
  useEffect(() => {
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);
  const leaderboard = [...stats].sort((a, b) => b.total_xp - a.total_xp);

  const todayStudyStatuses = studyStatuses.filter((s) => s.status.date === today);
  const activeStudiers = todayStudyStatuses.filter((s) => s.status.active);
  const todayStudiers = todayStudyStatuses.filter((s) => s.status.sessions_today > 0 || s.status.active);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">함께</h1>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">지금 누가 공부 중인지, XP 현황을 확인해보세요</p>
          </div>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors">
          <RefreshCw size={14} />
          {lastRefreshed.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
        </button>
      </motion.div>

      {/* 내 공부 상태 토글 */}
      {user && myStudyStatus && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={handleToggleStudy}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className={`w-full rounded-2xl border-2 p-4 text-left shadow-sm transition-all ${
            myStudyStatus.active
              ? "border-green-500/50 bg-green-500/10"
              : "border-[var(--border)] bg-[var(--card)]"
          }`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${myStudyStatus.active ? "bg-green-500" : "bg-[var(--muted)]"} transition-colors`}>
              {myStudyStatus.active
                ? <Square size={20} className="text-white" fill="white" />
                : <Play size={20} className="text-[var(--muted-foreground)] translate-x-0.5" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${myStudyStatus.active ? "text-green-600" : "text-[var(--foreground)]"}`}>
                {myStudyStatus.active ? "공부 중 (탭하면 종료)" : "공부 시작하기"}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {myStudyStatus.active && myStudyStatus.started_at
                  ? `${Math.floor((Date.now() - new Date(myStudyStatus.started_at).getTime()) / 60000)}분째 집중 중 · 오늘 총 ${myStudyStatus.today_minutes}분`
                  : `오늘 ${myStudyStatus.today_minutes}분 · ${myStudyStatus.sessions_today}세션`}
              </p>
            </div>
            {myStudyStatus.active && (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
            )}
          </div>
        </motion.button>
      )}

      {/* 지금 공부 중 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          지금 공부 중
          <span className="ml-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-600">
            {activeStudiers.length}명
          </span>
        </h2>

        {activeStudiers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">
            아직 공부 중인 사람이 없어요. 뽀모도로를 시작해보세요!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeStudiers.map(({ user_id, status }) => {
              const color = getUserColor(user_id, profiles);
              const name = getName(user_id);
              const isMe = user_id === user?.id;
              return (
                <div key={user_id}
                  className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}>
                    {name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--foreground)]">{isMe ? `${name} (나)` : name}</p>
                    <p className="text-xs text-green-600">
                      {status.started_at ? <ElapsedTimer startedAt={status.started_at} /> : "집중 중"}
                    </p>
                  </div>
                  <BookOpen size={16} className="text-green-500" />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 오늘 공부 현황 */}
      {todayStudiers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
            <Clock size={18} className="text-[var(--accent)]" />
            오늘 공부 현황
          </h2>
          <div className="space-y-3">
            {[...todayStudiers].sort((a, b) => (b.status.today_minutes + (b.status.active ? getElapsedMinutes(b.status.started_at ?? "") : 0)) - (a.status.today_minutes + (a.status.active ? getElapsedMinutes(a.status.started_at ?? "") : 0))).map(({ user_id, status }) => {
              const color = getUserColor(user_id, profiles);
              const name = getName(user_id);
              const isMe = user_id === user?.id;
              const totalMin = status.today_minutes + (status.active && status.started_at ? getElapsedMinutes(status.started_at) : 0);
              const maxMin = Math.max(...todayStudiers.map((s) => s.status.today_minutes + (s.status.active && s.status.started_at ? getElapsedMinutes(s.status.started_at) : 0)), 1);
              const barWidth = Math.max(4, (totalMin / maxMin) * 100);
              return (
                <div key={user_id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}>
                        {name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-[var(--foreground)]">{isMe ? `${name} (나)` : name}</span>
                      {status.active && <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-600">공부 중</span>}
                    </div>
                    <span className="text-[var(--muted-foreground)]">{totalMin}분 · {status.sessions_today}세션</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* XP 리더보드 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
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
                <div key={entry.user_id}
                  className={`rounded-xl border p-4 ${isMe ? "border-[var(--accent)]/40 bg-[var(--accent)]/5" : "border-[var(--border)]"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{medal}</span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: color }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--foreground)]">{isMe ? `${name} (나)` : name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{entry.total_xp.toLocaleString()} XP</p>
                    </div>
                    {streak > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-500">
                        <Flame size={12} />
                        {streak}일
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs text-[var(--muted-foreground)]">
                    <span>완료 {entry.total_completions}개</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
