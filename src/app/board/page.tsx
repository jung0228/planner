"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Plus, Check, Trash2, Swords, Repeat, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { getQuestsByDate, toggleQuest } from "@/lib/quests";
import { getRoutineQuestsForDate, toggleRoutineCompletion } from "@/lib/routines";
import { syncSharedBoardToSupabase, loadSharedBoard, upsertQuestToSupabase, upsertRoutineCompletionToSupabase, upsertStatsToSupabase, type BoardItem, type SharedBoard } from "@/lib/quest-sync";
import { getStats } from "@/lib/quests";
import { generateId } from "@/lib/utils";

type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
};

type DisplayItem = {
  id: string;
  text: string;
  done: boolean;
  type: "quest" | "routine" | "manual";
};

type UserBoardData = {
  user_id: string;
  items: DisplayItem[];
};

const PRESET_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];

function getUserColor(userId: string, profiles: Profile[]): string {
  const p = profiles.find((p) => p.id === userId);
  return p?.avatar_color ?? PRESET_COLORS[userId.charCodeAt(0) % PRESET_COLORS.length];
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

// 다른 유저의 Supabase user_store 데이터에서 오늘 할일 구성
function buildItemsFromStore(
  questsRaw: unknown,
  routinesRaw: unknown,
  completionsRaw: unknown,
  manualRaw: unknown,
  today: string
): DisplayItem[] {
  const items: DisplayItem[] = [];

  // 루틴
  const routines = Array.isArray(routinesRaw) ? routinesRaw : [];
  const completions = (completionsRaw as Record<string, Record<string, boolean>> | null) ?? {};
  const todayCompletions = completions[today] ?? {};
  for (const r of routines) {
    if (r?.title) {
      items.push({ id: `routine-${r.id}`, text: r.title, done: todayCompletions[r.id] ?? false, type: "routine" });
    }
  }

  // 커스텀 퀘스트
  const quests = Array.isArray(questsRaw) ? questsRaw : [];
  for (const q of quests) {
    if (q?.date === today && q?.title) {
      items.push({ id: `quest-${q.id}`, text: q.title, done: q.completed ?? false, type: "quest" });
    }
  }

  // 수동 보드 항목
  const manual = (manualRaw as SharedBoard | null)?.items ?? [];
  for (const m of manual) {
    if (m?.text) items.push({ ...m, type: "manual" });
  }

  return items;
}

export default function BoardPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [otherBoards, setOtherBoards] = useState<UserBoardData[]>([]);
  const [myItems, setMyItems] = useState<DisplayItem[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const today = getTodayStr();

  // 내 아이템 로드 (localStorage에서 퀘스트 + 루틴 + 수동 항목)
  const loadMyItems = useCallback(() => {
    const routineItems: DisplayItem[] = getRoutineQuestsForDate(today).map((q) => ({
      id: q.id,
      text: q.title,
      done: q.completed,
      type: "routine" as const,
    }));
    const questItems: DisplayItem[] = getQuestsByDate(today).map((q) => ({
      id: `quest-${q.id}`,
      text: q.title,
      done: q.completed,
      type: "quest" as const,
    }));
    const manual = loadSharedBoard(today);
    const manualItems: DisplayItem[] = manual.items.map((m) => ({ ...m, type: "manual" as const }));

    setMyItems([...routineItems, ...questItems, ...manualItems]);
  }, [today]);

  // 내 수동 항목 + 퀘스트 완료 상태를 Supabase에 동기화
  const syncMyBoard = useCallback(async (items: DisplayItem[]) => {
    const manual: BoardItem[] = items.filter((i) => i.type === "manual").map(({ id, text, done }) => ({ id, text, done }));
    const board: SharedBoard = { date: today, items: manual };
    await syncSharedBoardToSupabase(today, board);
  }, [today]);

  // 다른 유저 보드 fetch
  const fetchOtherBoards = useCallback(async () => {
    if (!supabase || !user) return;

    const [profilesRes, allStoreRes] = await Promise.all([
      supabase.from("profiles").select("id,display_name,avatar_color"),
      supabase.from("user_store").select("user_id,key,value"),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);

    if (allStoreRes.data) {
      const byUser: Record<string, Record<string, unknown>> = {};
      for (const row of allStoreRes.data) {
        if (row.user_id === user.id) continue; // 내 데이터는 localStorage에서
        if (!byUser[row.user_id]) byUser[row.user_id] = {};
        byUser[row.user_id][row.key] = row.value;
      }

      const boards: UserBoardData[] = Object.entries(byUser).map(([uid, store]) => ({
        user_id: uid,
        items: buildItemsFromStore(
          store["personal-site-quests"],
          store["personal-site-routines"],
          store["personal-site-routine-completions"],
          store[`shared-board-${today}`],
          today
        ),
      }));
      setOtherBoards(boards);
    }

    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    loadMyItems();
    fetchOtherBoards();
  }, [loadMyItems, fetchOtherBoards]);

  const handleToggleItem = async (item: DisplayItem) => {
    if (item.type === "quest") {
      const questId = item.id.replace(/^quest-/, "");
      const updated = toggleQuest(questId);
      if (updated) {
        await upsertQuestToSupabase(updated);
        await upsertStatsToSupabase(getStats());
      }
    } else if (item.type === "routine") {
      const routineId = item.id.replace(/^routine-/, "");
      const newDone = !item.done;
      toggleRoutineCompletion(routineId, today);
      await upsertRoutineCompletionToSupabase(routineId, today, newDone);
      await upsertStatsToSupabase(getStats());
    } else {
      // manual item
      const next = myItems.map((i) => i.id === item.id ? { ...i, done: !i.done } : i);
      setMyItems(next);
      await syncMyBoard(next);
      return;
    }
    loadMyItems();
  };

  const handleAddManual = async () => {
    if (!newText.trim()) return;
    const item: DisplayItem = { id: generateId(), text: newText.trim(), done: false, type: "manual" };
    const next = [...myItems, item];
    setMyItems(next);
    setNewText("");
    await syncMyBoard(next);
  };

  const handleDeleteManual = async (id: string) => {
    const next = myItems.filter((i) => i.id !== id);
    setMyItems(next);
    await syncMyBoard(next);
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);

  const myDone = myItems.filter((i) => i.done).length;
  const myTotal = myItems.length;

  const typeIcon = (type: DisplayItem["type"]) =>
    type === "routine" ? <Repeat size={11} className="shrink-0 opacity-50" /> :
    type === "quest" ? <Swords size={11} className="shrink-0 opacity-50" /> : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">보드</h1>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{formatDate(today)} · 퀘스트와 할 일을 공유해보세요</p>
          </div>
        </div>
        <button onClick={() => { loadMyItems(); fetchOtherBoards(); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors">
          <RefreshCw size={14} />
          새로고침
        </button>
      </motion.div>

      {/* 내 보드 */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border-2 p-5 shadow-sm"
          style={{ borderColor: `${getUserColor(user.id, profiles)}60`, backgroundColor: `${getUserColor(user.id, profiles)}08` }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: getUserColor(user.id, profiles) }}>
                {(getName(user.id))[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">{getName(user.id)} (나)</p>
                <p className="text-xs text-[var(--muted-foreground)]">{myDone}/{myTotal} 완료</p>
              </div>
            </div>
            {myTotal > 0 && (
              <span className="text-sm font-bold" style={{ color: getUserColor(user.id, profiles) }}>
                {Math.round((myDone / myTotal) * 100)}%
              </span>
            )}
          </div>

          {myTotal > 0 && (
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${myTotal > 0 ? (myDone / myTotal) * 100 : 0}%`, backgroundColor: getUserColor(user.id, profiles) }} />
            </div>
          )}

          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
              placeholder="퀘스트 외 추가 할 일..."
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
            <button onClick={handleAddManual}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: getUserColor(user.id, profiles) }}>
              <Plus size={16} />
              추가
            </button>
          </div>

          {myItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">
              오늘 퀘스트를 만들거나 할 일을 추가해보세요
            </p>
          ) : (
            <div className="space-y-1.5">
              {myItems.map((item) => (
                <div key={item.id} className="group flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5">
                  <button onClick={() => handleToggleItem(item)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:opacity-80"
                    style={{ borderColor: getUserColor(user.id, profiles), backgroundColor: item.done ? getUserColor(user.id, profiles) : "transparent" }}>
                    {item.done && <Check size={11} className="text-white" strokeWidth={3} />}
                  </button>
                  {typeIcon(item.type)}
                  <span className={`flex-1 text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>
                    {item.text}
                  </span>
                  {item.type === "manual" && (
                    <button onClick={() => handleDeleteManual(item.id)}
                      className="shrink-0 rounded p-1 text-transparent transition-all hover:text-red-400 group-hover:text-[var(--muted-foreground)]">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* 다른 사람들 보드 */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]" />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherBoards.map(({ user_id, items }, idx) => {
              const color = getUserColor(user_id, profiles);
              const name = getName(user_id);
              const doneCount = items.filter((i) => i.done).length;
              const total = items.length;
              const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

              return (
                <motion.div key={user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  className="rounded-2xl border bg-[var(--card)] p-4 shadow-sm"
                  style={{ borderColor: `${color}40` }}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: color }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--foreground)]">{name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{doneCount}/{total} 완료</p>
                    </div>
                    {total > 0 && <span className="shrink-0 text-sm font-bold" style={{ color }}>{pct}%</span>}
                  </div>

                  {total > 0 && (
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  )}

                  {items.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[var(--muted-foreground)]">아직 할 일이 없어요</p>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                            style={{ borderColor: color, backgroundColor: item.done ? color : "transparent" }}>
                            {item.done && <Check size={9} className="text-white" strokeWidth={3} />}
                          </div>
                          {typeIcon(item.type)}
                          <span className={`text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {!loading && otherBoards.length === 0 && !user && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-[var(--muted-foreground)]">
          <LayoutGrid size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 아무도 할 일을 공유하지 않았어요</p>
        </div>
      )}
    </div>
  );
}
