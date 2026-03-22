"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Plus, Check, Trash2, Swords, Repeat, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { getQuestsByDate, toggleQuest, getStats } from "@/lib/quests";
import { getRoutineQuestsForDate, toggleRoutineCompletion } from "@/lib/routines";
import {
  syncSharedBoardToSupabase, loadSharedBoard, pullFromSupabase,
  upsertQuestToSupabase, upsertRoutineCompletionToSupabase, upsertStatsToSupabase,
  type BoardItem, type SharedBoard,
} from "@/lib/quest-sync";
import { generateId } from "@/lib/utils";

type Profile = { id: string; display_name: string; avatar_color: string };
type DisplayItem = { id: string; text: string; done: boolean; type: "quest" | "routine" | "manual" };
type UserBoardData = { user_id: string; items: DisplayItem[] };
// reactions: { [targetUserId]: { [emoji]: userId[] } }
type Reactions = Record<string, Record<string, string[]>>;

const PRESET_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];
const EMOJIS = ["👍","🔥","💪","🎉","❤️"];

function getUserColor(userId: string, profiles: Profile[]): string {
  const p = profiles.find((p) => p.id === userId);
  return p?.avatar_color ?? PRESET_COLORS[userId.charCodeAt(0) % PRESET_COLORS.length];
}
function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function buildItemsFromStore(questsRaw: unknown, routinesRaw: unknown, completionsRaw: unknown, manualRaw: unknown, today: string): DisplayItem[] {
  const items: DisplayItem[] = [];
  const routines = Array.isArray(routinesRaw) ? routinesRaw : [];
  const completions = (completionsRaw as Record<string, Record<string, boolean>> | null) ?? {};
  const todayCompletions = completions[today] ?? {};
  for (const r of routines) {
    if (r?.title) items.push({ id: `routine-${r.id}`, text: r.title, done: todayCompletions[r.id] ?? false, type: "routine" });
  }
  const quests = Array.isArray(questsRaw) ? questsRaw : [];
  for (const q of quests) {
    if (q?.date === today && q?.title) items.push({ id: `quest-${q.id}`, text: q.title, done: q.completed ?? false, type: "quest" });
  }
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
  const [reactions, setReactions] = useState<Reactions>({});
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const today = getTodayStr();

  const loadMyItems = useCallback(() => {
    const routineItems: DisplayItem[] = getRoutineQuestsForDate(today).map((q) => ({
      id: q.id, text: q.title, done: q.completed, type: "routine" as const,
    }));
    const questItems: DisplayItem[] = getQuestsByDate(today).map((q) => ({
      id: `quest-${q.id}`, text: q.title, done: q.completed, type: "quest" as const,
    }));
    const manual = loadSharedBoard(today);
    const manualItems: DisplayItem[] = manual.items.map((m) => ({ ...m, type: "manual" as const }));
    setMyItems([...routineItems, ...questItems, ...manualItems]);
  }, [today]);

  const syncMyBoard = useCallback(async (items: DisplayItem[]) => {
    const manual: BoardItem[] = items.filter((i) => i.type === "manual").map(({ id, text, done }) => ({ id, text, done }));
    await syncSharedBoardToSupabase(today, { date: today, items: manual });
  }, [today]);

  const fetchOtherBoards = useCallback(async () => {
    if (!supabase || !user) return;
    const [profilesRes, allStoreRes] = await Promise.all([
      supabase.from("profiles").select("id,display_name,avatar_color"),
      supabase.from("user_store").select("user_id,key,value"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (allStoreRes.data) {
      const byUser: Record<string, Record<string, unknown>> = {};
      const newReactions: Reactions = {};
      for (const row of allStoreRes.data) {
        if (row.key === `board-reactions-${today}`) {
          // reactions는 모든 유저 것 합산
          const r = row.value as Record<string, string[]> | null;
          if (r) {
            for (const [emoji, uids] of Object.entries(r)) {
              if (!newReactions[row.user_id]) newReactions[row.user_id] = {};
              newReactions[row.user_id][emoji] = uids as string[];
            }
          }
          continue;
        }
        if (row.user_id === user.id) continue;
        if (!byUser[row.user_id]) byUser[row.user_id] = {};
        byUser[row.user_id][row.key] = row.value;
      }
      setReactions(newReactions);
      const boards: UserBoardData[] = Object.entries(byUser).map(([uid, store]) => ({
        user_id: uid,
        items: buildItemsFromStore(
          store["personal-site-quests"], store["personal-site-routines"],
          store["personal-site-routine-completions"], store[`shared-board-${today}`], today
        ),
      }));
      setOtherBoards(boards);
    }
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    pullFromSupabase().then(() => loadMyItems());
    fetchOtherBoards();
  }, [loadMyItems, fetchOtherBoards]);

  useEffect(() => {
    const id = setInterval(fetchOtherBoards, 30000);
    return () => clearInterval(id);
  }, [fetchOtherBoards]);

  useEffect(() => {
    const refresh = () => loadMyItems();
    window.addEventListener("quests-updated", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("quests-updated", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadMyItems]);

  const handleToggleItem = async (item: DisplayItem) => {
    if (item.type === "quest") {
      const questId = item.id.replace(/^quest-/, "");
      const updated = toggleQuest(questId);
      if (updated) {
        upsertQuestToSupabase(updated);
        upsertStatsToSupabase(getStats());
      }
    } else if (item.type === "routine") {
      const routineId = item.id.replace(/^routine-/, "");
      const newDone = !item.done;
      toggleRoutineCompletion(routineId, today);
      upsertRoutineCompletionToSupabase(routineId, today, newDone);
      upsertStatsToSupabase(getStats());
    } else {
      const next = myItems.map((i) => i.id === item.id ? { ...i, done: !i.done } : i);
      setMyItems(next);
      syncMyBoard(next);
    }
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

  const handleReact = async (targetUserId: string, emoji: string) => {
    if (!user || !supabase) return;
    const current = reactions[targetUserId]?.[emoji] ?? [];
    const hasReacted = current.includes(user.id);
    const updated = hasReacted ? current.filter((id) => id !== user.id) : [...current, user.id];
    const newTargetReactions = { ...(reactions[targetUserId] ?? {}), [emoji]: updated };
    setReactions((prev) => ({ ...prev, [targetUserId]: newTargetReactions }));
    // reactions는 "내가 다른 사람에게 보낸 것"을 내 user_store에 저장하지 않고,
    // 대신 target 유저 id별로 집계. 여기선 내 own store에 내가 보낸 reaction을 저장
    // 실제로는 reactions를 별도 key로 저장: board-reactions-{today} on MY store = { targetUserId: { emoji: [myId] } }
    const myReactionsKey = `board-reactions-${today}`;
    const { data } = await supabase.from("user_store").select("value").eq("user_id", user.id).eq("key", myReactionsKey).single();
    const existing = (data?.value as Record<string, Record<string, string[]>> | null) ?? {};
    if (!existing[targetUserId]) existing[targetUserId] = {};
    const myEmojiList = existing[targetUserId][emoji] ?? [];
    existing[targetUserId][emoji] = hasReacted
      ? myEmojiList.filter((id) => id !== user.id)
      : [...myEmojiList, user.id];
    await supabase.from("user_store").upsert(
      { user_id: user.id, key: myReactionsKey, value: existing, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);
  const myDone = myItems.filter((i) => i.done).length;
  const myTotal = myItems.length;
  const typeIcon = (type: DisplayItem["type"]) =>
    type === "routine" ? <Repeat size={11} className="shrink-0 opacity-40" /> :
    type === "quest" ? <Swords size={11} className="shrink-0 opacity-40" /> : null;

  // 다른 유저에 대한 나의 reaction 집계 (fetchOtherBoards에서 로드된 reactions 구조 재정리)
  // reactions[targetUserId][emoji] = [userId, ...] (각 사람이 보낸 reaction 합산)
  const getReactionsFor = (targetUserId: string): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    // 모든 유저(나 포함)의 user_store에서 해당 target에 보낸 reaction을 합산
    // 현재 reactions state는 row.user_id = 보낸사람, value = { targetId: { emoji: [senderId] } }
    // 단순화: reactions[targetUserId] 를 직접 집계한 형태로 fetchOtherBoards에서 처리
    return reactions[targetUserId] ?? result;
  };

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
        <button onClick={() => { pullFromSupabase().then(() => loadMyItems()); fetchOtherBoards(); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors">
          <RefreshCw size={14} />새로고침
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
                {getName(user.id)[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">{getName(user.id)} (나)</p>
                <p className="text-xs text-[var(--muted-foreground)]">{myDone}/{myTotal} 완료</p>
              </div>
            </div>
            {myTotal > 0 && <span className="text-sm font-bold" style={{ color: getUserColor(user.id, profiles) }}>{Math.round((myDone / myTotal) * 100)}%</span>}
          </div>

          {myTotal > 0 && (
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(myDone / myTotal) * 100}%`, backgroundColor: getUserColor(user.id, profiles) }} />
            </div>
          )}

          <div className="mb-3 flex gap-2">
            <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
              placeholder="퀘스트 외 추가 할 일..."
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none" />
            <button onClick={handleAddManual}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: getUserColor(user.id, profiles) }}>
              <Plus size={16} />추가
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
                  <span className={`flex-1 text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>{item.text}</span>
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
          {[1,2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]" />)}
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
              const myReactions = getReactionsFor(user_id);

              return (
                <motion.div key={user_id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                  className="rounded-2xl border bg-[var(--card)] p-4 shadow-sm" style={{ borderColor: `${color}40` }}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: color }}>
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
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  )}

                  {items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">아직 할 일이 없어요</p>
                  ) : (
                    <div className="mb-3 space-y-1.5">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                            style={{ borderColor: color, backgroundColor: item.done ? color : "transparent" }}>
                            {item.done && <Check size={9} className="text-white" strokeWidth={3} />}
                          </div>
                          {typeIcon(item.type)}
                          <span className={`text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 공감 버튼 */}
                  <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-3">
                    {EMOJIS.map((emoji) => {
                      const reactors = myReactions[emoji] ?? [];
                      const iReacted = user ? reactors.includes(user.id) : false;
                      return (
                        <button key={emoji} onClick={() => handleReact(user_id, emoji)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-all ${
                            iReacted
                              ? "bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40"
                              : "bg-[var(--muted)] hover:bg-[var(--border)]"
                          }`}>
                          <span>{emoji}</span>
                          {reactors.length > 0 && <span className="text-xs font-medium text-[var(--muted-foreground)]">{reactors.length}</span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {!loading && otherBoards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-[var(--muted-foreground)]">
          <LayoutGrid size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 다른 멤버가 없어요</p>
        </div>
      )}
    </div>
  );
}
