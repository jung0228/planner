"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Plus, Check, Trash2, Swords, Repeat, RefreshCw,
  Heart, Flame, MessageCircle, Send, X, Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { getQuestsByDate, toggleQuest, getStats, addQuest, RARITY_CONFIG } from "@/lib/quests";
import { getRoutineQuestsForDate, toggleRoutineCompletion } from "@/lib/routines";
import {
  syncSharedBoardToSupabase, loadSharedBoard, pullFromSupabase,
  upsertQuestToSupabase, upsertRoutineCompletionToSupabase, upsertStatsToSupabase,
  sendChallengeToUser, loadDismissed, dismissChallenge,
  loadMyItemComments, addItemComment, deleteItemComment,
  type BoardItem, type SharedBoard, type Challenge, type Comment,
} from "@/lib/quest-sync";
import { generateId } from "@/lib/utils";

type Profile = { id: string; display_name: string; avatar_color: string };
type DisplayItem = { id: string; text: string; done: boolean; type: "quest" | "routine" | "manual" };
type UserBoardData = { user_id: string; items: DisplayItem[]; streak: number };
type ItemReactions = Record<string, string[]>;
type AllComments = Record<string, Comment[]>; // itemId → comments from ALL users

const PRESET_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];
const RARITY_OPTIONS = ["normal","rare","epic","legendary"] as const;
const RARITY_LABELS: Record<string, string> = { normal:"일반", rare:"희귀", epic:"영웅", legendary:"전설" };

function getUserColor(userId: string, profiles: Profile[]): string {
  const p = profiles.find((p) => p.id === userId);
  return p?.avatar_color ?? PRESET_COLORS[userId.charCodeAt(0) % PRESET_COLORS.length];
}
function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}
function extractStreak(statsRaw: unknown): number {
  if (!statsRaw || typeof statsRaw !== "object") return 0;
  const s = statsRaw as Record<string, unknown>;
  const dates = Array.isArray(s.datesWithCompletion) ? s.datesWithCompletion as string[] : [];
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...dates].sort();
  let streak = 0;
  let check = new Date(today + "T12:00:00");
  const set = new Set(sorted);
  for (let i = 0; i < 365; i++) {
    const d = check.toISOString().slice(0, 10);
    if (set.has(d)) streak++;
    else if (i > 0) break;
    check = new Date(check.getTime() - 86400000);
  }
  return streak;
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

const REACTIONS_KEY_PREFIX = "item-reactions-";

export default function BoardPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [otherBoards, setOtherBoards] = useState<UserBoardData[]>([]);
  const [myItems, setMyItems] = useState<DisplayItem[]>([]);
  const [itemReactions, setItemReactions] = useState<ItemReactions>({});
  const [allComments, setAllComments] = useState<AllComments>({});
  const [incomingChallenges, setIncomingChallenges] = useState<(Challenge & { fromUserId: string })[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  // challenge modal
  const [challengeTarget, setChallengeTarget] = useState<{ userId: string; name: string } | null>(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeRarity, setChallengeRarity] = useState<typeof RARITY_OPTIONS[number]>("normal");
  // comments
  const [openCommentItemId, setOpenCommentItemId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);

  const today = getTodayStr();
  const reactionsKey = `${REACTIONS_KEY_PREFIX}${today}`;

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
      const merged: ItemReactions = {};
      const mergedComments: AllComments = {};
      const dismissed = loadDismissed();

      for (const row of allStoreRes.data) {
        if (row.key === reactionsKey) {
          const liked = row.value as Record<string, boolean> | null;
          if (liked) {
            for (const itemId of Object.keys(liked)) {
              if (liked[itemId]) {
                if (!merged[itemId]) merged[itemId] = [];
                if (!merged[itemId].includes(row.user_id)) merged[itemId].push(row.user_id);
              }
            }
          }
          continue;
        }
        // aggregate comments for today
        if (row.key === `item-comments-${today}`) {
          const userComments = row.value as Record<string, Comment[]> | null;
          if (userComments) {
            for (const [itemId, comments] of Object.entries(userComments)) {
              if (!mergedComments[itemId]) mergedComments[itemId] = [];
              mergedComments[itemId].push(...(comments as Comment[]));
            }
          }
          if (row.user_id !== user.id) continue;
        }
        if (row.user_id === user.id) continue;
        if (!byUser[row.user_id]) byUser[row.user_id] = {};
        byUser[row.user_id][row.key] = row.value;
      }

      // sort comments by ts
      for (const id of Object.keys(mergedComments)) {
        mergedComments[id].sort((a, b) => a.ts.localeCompare(b.ts));
      }
      setItemReactions(merged);
      setAllComments(mergedComments);

      // incoming challenges: from other users' quest-challenges-out where toUserId === me
      const incoming: (Challenge & { fromUserId: string })[] = [];
      for (const [uid, store] of Object.entries(byUser)) {
        const challenges = Array.isArray(store["quest-challenges-out"]) ? store["quest-challenges-out"] as Challenge[] : [];
        for (const c of challenges) {
          if (c.toUserId === user.id && !dismissed.includes(c.id)) {
            incoming.push({ ...c, fromUserId: uid });
          }
        }
      }
      incoming.sort((a, b) => b.ts.localeCompare(a.ts));
      setIncomingChallenges(incoming);

      const boards: UserBoardData[] = Object.entries(byUser).map(([uid, store]) => ({
        user_id: uid,
        items: buildItemsFromStore(
          store["personal-site-quests"], store["personal-site-routines"],
          store["personal-site-routine-completions"], store[`shared-board-${today}`], today
        ),
        streak: extractStreak(store["personal-site-quest-stats"]),
      }));
      boards.sort((a, b) => b.items.length - a.items.length);
      setOtherBoards(boards);
    }
    setLoading(false);
  }, [user, today, reactionsKey]);

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
    return () => {
      window.removeEventListener("quests-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [loadMyItems]);

  useEffect(() => {
    if (openCommentItemId) setTimeout(() => commentInputRef.current?.focus(), 100);
  }, [openCommentItemId]);

  const handleToggleItem = async (item: DisplayItem) => {
    setMyItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i));
    if (item.type === "quest") {
      const questId = item.id.replace(/^quest-/, "");
      const updated = toggleQuest(questId);
      if (updated) { upsertQuestToSupabase(updated); upsertStatsToSupabase(getStats()); }
      else loadMyItems();
    } else if (item.type === "routine") {
      const routineId = item.id.replace(/^routine-/, "");
      toggleRoutineCompletion(routineId, today);
      upsertRoutineCompletionToSupabase(routineId, today, !item.done);
      upsertStatsToSupabase(getStats());
    } else {
      const next = myItems.map((i) => i.id === item.id ? { ...i, done: !i.done } : i);
      syncMyBoard(next);
    }
  };

  const handleLike = async (itemId: string) => {
    if (!user || !supabase) return;
    const current = itemReactions[itemId] ?? [];
    const iLiked = current.includes(user.id);
    setItemReactions((prev) => ({
      ...prev,
      [itemId]: iLiked ? current.filter((id) => id !== user.id) : [...current, user.id],
    }));
    const { data } = await supabase.from("user_store").select("value")
      .eq("user_id", user.id).eq("key", reactionsKey).maybeSingle();
    const existing = (data?.value as Record<string, boolean> | null) ?? {};
    existing[itemId] = !iLiked;
    await supabase.from("user_store").upsert(
      { user_id: user.id, key: reactionsKey, value: existing, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );
  };

  const handleAddComment = async (itemId: string) => {
    if (!user || !commentText.trim()) return;
    const comment: Comment = { id: generateId(), userId: user.id, text: commentText.trim(), ts: new Date().toISOString() };
    setAllComments((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), comment],
    }));
    setCommentText("");
    await addItemComment(today, itemId, comment);
  };

  const handleDeleteComment = async (itemId: string, commentId: string) => {
    setAllComments((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? []).filter((c) => c.id !== commentId),
    }));
    await deleteItemComment(today, itemId, commentId);
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

  const handleSendChallenge = async () => {
    if (!user || !challengeTarget || !challengeTitle.trim()) return;
    const config = RARITY_CONFIG[challengeRarity];
    const challenge: Challenge = {
      id: generateId(),
      toUserId: challengeTarget.userId,
      title: challengeTitle.trim(),
      rarity: challengeRarity,
      xp: config.xp,
      ts: new Date().toISOString(),
    };
    await sendChallengeToUser(challenge);
    setChallengeTarget(null);
    setChallengeTitle("");
    setChallengeRarity("normal");
  };

  const handleAcceptChallenge = async (c: Challenge & { fromUserId: string }) => {
    const quest = addQuest({ title: c.title, rarity: c.rarity, xp: c.xp, date: today });
    upsertQuestToSupabase(quest);
    upsertStatsToSupabase(getStats());
    await dismissChallenge(c.id);
    setIncomingChallenges((prev) => prev.filter((x) => x.id !== c.id));
    loadMyItems();
  };

  const handleDismissChallenge = async (id: string) => {
    await dismissChallenge(id);
    setIncomingChallenges((prev) => prev.filter((x) => x.id !== id));
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);
  const myDone = myItems.filter((i) => i.done).length;
  const myTotal = myItems.length;
  const myStats = getStats();
  const myStreak = extractStreak(myStats);

  const typeIcon = (type: DisplayItem["type"]) =>
    type === "routine" ? <Repeat size={11} className="shrink-0 opacity-40" /> :
    type === "quest" ? <Swords size={11} className="shrink-0 opacity-40" /> : null;

  const rarityColor: Record<string, string> = {
    normal: "#94a3b8", rare: "#38bdf8", epic: "#a78bfa", legendary: "#fbbf24",
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
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

      {/* 받은 도전장 */}
      <AnimatePresence>
        {incomingChallenges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-yellow-500/40 bg-yellow-500/5 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-yellow-500">
              <Zap size={15} />도전장이 왔어요!
            </p>
            <div className="space-y-2">
              {incomingChallenges.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: rarityColor[c.rarity] }} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{c.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{getName(c.fromUserId)} · {c.xp} XP</p>
                  </div>
                  <button onClick={() => handleAcceptChallenge(c)}
                    className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white">
                    수락
                  </button>
                  <button onClick={() => handleDismissChallenge(c.id)}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--foreground)]">{getName(user.id)} (나)</p>
                  {myStreak > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-xs font-medium text-orange-500">
                      <Flame size={10} />{myStreak}일
                    </span>
                  )}
                </div>
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
              {myItems.map((item) => {
                const likes = itemReactions[item.id] ?? [];
                const comments = allComments[item.id] ?? [];
                const isCommentOpen = openCommentItemId === item.id;
                return (
                  <div key={item.id}>
                    <div className="group flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-3 py-2.5">
                      <button onClick={() => handleToggleItem(item)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:opacity-80"
                        style={{ borderColor: getUserColor(user.id, profiles), backgroundColor: item.done ? getUserColor(user.id, profiles) : "transparent" }}>
                        {item.done && <Check size={11} className="text-white" strokeWidth={3} />}
                      </button>
                      {typeIcon(item.type)}
                      <span className={`flex-1 text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>{item.text}</span>
                      {likes.length > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-red-400">
                          <Heart size={11} fill="currentColor" />{likes.length}
                        </span>
                      )}
                      <button onClick={() => setOpenCommentItemId(isCommentOpen ? null : item.id)}
                        className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all ${isCommentOpen || comments.length > 0 ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)]"}`}>
                        <MessageCircle size={12} />{comments.length > 0 && <span>{comments.length}</span>}
                      </button>
                      {item.type === "manual" && (
                        <button onClick={() => handleDeleteManual(item.id)}
                          className="shrink-0 rounded p-1 text-[var(--muted-foreground)] opacity-30 transition-all hover:text-red-400 hover:opacity-100 active:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {isCommentOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-b-xl border border-t-0 border-[var(--border)] bg-[var(--background)]/40 px-3 pb-2 pt-2">
                          {comments.map((c, i) => (
                            <div key={i} className="group/comment mb-1 flex items-start gap-1.5">
                              <span className="mt-0.5 shrink-0 text-xs font-medium" style={{ color: getUserColor(c.userId, profiles) }}>{getName(c.userId)}</span>
                              <span className="flex-1 text-xs text-[var(--foreground)]">{c.text}</span>
                              {user && c.userId === user.id && (
                                <button onClick={() => handleDeleteComment(item.id, c.id)}
                                  className="shrink-0 rounded p-0.5 text-[var(--muted-foreground)]/40 transition-all hover:text-red-400 active:text-red-400">
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                          <div className="mt-2 flex gap-1.5">
                            <input ref={commentInputRef} type="text" value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleAddComment(item.id)}
                              placeholder="응원 한마디..."
                              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none" />
                            <button onClick={() => handleAddComment(item.id)}
                              className="rounded-lg bg-[var(--accent)] p-1.5 text-white">
                              <Send size={12} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
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
            {otherBoards.map(({ user_id, items, streak }, idx) => {
              const color = getUserColor(user_id, profiles);
              const name = getName(user_id);
              const doneCount = items.filter((i) => i.done).length;
              const total = items.length;
              const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

              return (
                <motion.div key={user_id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                  className="rounded-2xl border bg-[var(--card)] p-4 shadow-sm" style={{ borderColor: `${color}40` }}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: color }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-[var(--foreground)]">{name}</p>
                        {streak > 0 && (
                          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-xs font-medium text-orange-500">
                            <Flame size={10} />{streak}일
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">{doneCount}/{total} 완료</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {total > 0 && <span className="shrink-0 text-sm font-bold" style={{ color }}>{pct}%</span>}
                      <button onClick={() => setChallengeTarget({ userId: user_id, name })}
                        className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted-foreground)] hover:border-yellow-500/50 hover:text-yellow-500 transition-colors">
                        <Zap size={12} />
                      </button>
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  )}

                  {items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">아직 할 일이 없어요</p>
                  ) : (
                    <div className="space-y-1">
                      {items.map((item) => {
                        const likes = itemReactions[item.id] ?? [];
                        const iLiked = user ? likes.includes(user.id) : false;
                        const comments = allComments[item.id] ?? [];
                        const isCommentOpen = openCommentItemId === item.id;
                        return (
                          <div key={item.id}>
                            <div className="flex items-center gap-2 rounded-lg px-1 py-1">
                              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                                style={{ borderColor: color, backgroundColor: item.done ? color : "transparent" }}>
                                {item.done && <Check size={9} className="text-white" strokeWidth={3} />}
                              </div>
                              {typeIcon(item.type)}
                              <span className={`flex-1 text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>{item.text}</span>
                              <button onClick={() => handleLike(item.id)}
                                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all ${iLiked ? "text-red-400" : "text-[var(--muted-foreground)]/50 hover:text-red-300"}`}>
                                <Heart size={12} fill={iLiked ? "currentColor" : "none"} />
                                {likes.length > 0 && <span>{likes.length}</span>}
                              </button>
                              <button onClick={() => setOpenCommentItemId(isCommentOpen ? null : item.id)}
                                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all ${isCommentOpen || comments.length > 0 ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]/50 hover:text-[var(--muted-foreground)]"}`}>
                                <MessageCircle size={12} />{comments.length > 0 && <span>{comments.length}</span>}
                              </button>
                            </div>
                            <AnimatePresence>
                              {isCommentOpen && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden rounded-b-lg border border-t-0 border-[var(--border)] bg-[var(--background)]/40 px-2 pb-2 pt-1">
                                  {comments.map((c, i) => (
                                    <div key={i} className="mb-1 flex items-start gap-1.5">
                                      <span className="mt-0.5 text-xs font-medium" style={{ color: getUserColor(c.userId, profiles) }}>{getName(c.userId)}</span>
                                      <span className="text-xs text-[var(--foreground)]">{c.text}</span>
                                    </div>
                                  ))}
                                  <div className="mt-1.5 flex gap-1.5">
                                    <input ref={isCommentOpen ? commentInputRef : undefined} type="text" value={openCommentItemId === item.id ? commentText : ""}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(item.id)}
                                      placeholder="응원 한마디..."
                                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none" />
                                    <button onClick={() => handleAddComment(item.id)}
                                      className="rounded-lg bg-[var(--accent)] p-1.5 text-white">
                                      <Send size={11} />
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {/* 도전장 보내기 모달 */}
      <AnimatePresence>
        {challengeTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => e.target === e.currentTarget && setChallengeTarget(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[var(--foreground)]">도전장 보내기</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">→ {challengeTarget.name}</p>
                </div>
                <button onClick={() => setChallengeTarget(null)} className="rounded-lg p-1.5 hover:bg-[var(--muted)]">
                  <X size={18} className="text-[var(--muted-foreground)]" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">퀘스트 이름</label>
                  <input type="text" value={challengeTitle} onChange={(e) => setChallengeTitle(e.target.value)}
                    placeholder="예: 오늘 30분 운동하기"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">난이도</label>
                  <div className="grid grid-cols-4 gap-2">
                    {RARITY_OPTIONS.map((r) => (
                      <button key={r} onClick={() => setChallengeRarity(r)}
                        className={`rounded-lg border py-2 text-xs font-medium transition-colors ${challengeRarity === r ? "border-transparent text-white" : "border-[var(--border)] text-[var(--muted-foreground)]"}`}
                        style={challengeRarity === r ? { backgroundColor: rarityColor[r] } : {}}>
                        {RARITY_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleSendChallenge}
                  disabled={!challengeTitle.trim()}
                  className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50">
                  도전장 보내기 ⚡
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
