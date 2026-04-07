"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Plus, Check, Trash2, Swords, Repeat, RefreshCw,
  Heart, Flame, MessageCircle, Send, X, Zap, Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { getQuestsByDate, toggleQuest, getStats, addQuest, RARITY_CONFIG } from "@/lib/quests";
import { getRoutineQuestsForDate, toggleRoutineCompletion } from "@/lib/routines";
import {
  syncSharedBoardToSupabase, loadSharedBoard, pullFromSupabase,
  upsertQuestToSupabase, upsertRoutineCompletionToSupabase, upsertStatsToSupabase,
  sendChallengeToUser, loadDismissed, dismissChallenge,
  loadMyItemComments, addItemComment, editItemComment, deleteItemComment,
  type BoardItem, type SharedBoard, type Challenge, type Comment,
} from "@/lib/quest-sync";
import { generateId } from "@/lib/utils";

type Profile = { id: string; display_name: string; avatar_color: string };
type DisplayItem = { id: string; text: string; done: boolean; type: "quest" | "routine" | "manual" };
type UserBoardData = { user_id: string; items: DisplayItem[]; streak: number };
type ItemReactions = Record<string, string[]>;
type AllComments = Record<string, Comment[]>;

const PRESET_COLORS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];
const RARITY_OPTIONS = ["normal","rare","epic","legendary"] as const;
const RARITY_LABELS: Record<string, string> = { normal:"일반", rare:"희귀", epic:"영웅", legendary:"전설" };
const RARITY_COLOR: Record<string, string> = { normal:"#94a3b8", rare:"#38bdf8", epic:"#a78bfa", legendary:"#fbbf24" };

function getUserColor(userId: string, profiles: Profile[]) {
  const p = profiles.find((p) => p.id === userId);
  return p?.avatar_color ?? PRESET_COLORS[userId.charCodeAt(0) % PRESET_COLORS.length];
}
function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}
function extractStreak(raw: unknown): number {
  if (!raw || typeof raw !== "object") return 0;
  const s = raw as Record<string, unknown>;
  const dates = Array.isArray(s.datesWithCompletion) ? s.datesWithCompletion as string[] : [];
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  let check = new Date(new Date().toISOString().slice(0, 10) + "T12:00:00");
  for (let i = 0; i < 365; i++) {
    if (set.has(check.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
    check = new Date(check.getTime() - 86400000);
  }
  return streak;
}
function buildItemsFromStore(qR: unknown, rR: unknown, cR: unknown, mR: unknown, today: string): DisplayItem[] {
  const items: DisplayItem[] = [];
  const routines = Array.isArray(rR) ? rR : [];
  const comp = (cR as Record<string, Record<string, boolean>> | null)?.[today] ?? {};
  for (const r of routines) if (r?.title) items.push({ id: `routine-${r.id}`, text: r.title, done: comp[r.id] ?? false, type: "routine" });
  const quests = Array.isArray(qR) ? qR : [];
  for (const q of quests) if (q?.date === today && q?.title) items.push({ id: `quest-${q.id}`, text: q.title, done: q.completed ?? false, type: "quest" });
  const manual = (mR as SharedBoard | null)?.items ?? [];
  for (const m of manual) if (m?.text) items.push({ ...m, type: "manual" });
  return items;
}

/* ── 댓글 박스 (아이템별 독립 상태) ── */
function CommentBox({ itemId, comments, userId, profiles, today, onAdd, onEdit, onDelete }: {
  itemId: string; comments: Comment[]; userId: string; profiles: Profile[]; today: string;
  onAdd: (itemId: string, comment: Comment) => void;
  onEdit: (itemId: string, commentId: string, text: string) => void;
  onDelete: (itemId: string, commentId: string) => void;
}) {
  const [text, setText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const submit = async () => {
    if (!text.trim()) return;
    const c: Comment = { id: generateId(), userId, text: text.trim(), ts: new Date().toISOString() };
    onAdd(itemId, c);
    setText("");
    await addItemComment(today, itemId, c);
  };

  const submitEdit = async () => {
    if (!editId || !editText.trim()) return;
    onEdit(itemId, editId, editText.trim());
    await editItemComment(today, itemId, editId, editText.trim());
    setEditId(null); setEditText("");
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 6);
  const getColor = (uid: string) => getUserColor(uid, profiles);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden">
      <div className="rounded-b-xl border border-t-0 border-[var(--border)] bg-[var(--background)] px-3 pb-3 pt-2">
        {comments.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {comments.map((c) => (
              <div key={c.id} className="group/c flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: getColor(c.userId) }}>
                  {getName(c.userId)[0]?.toUpperCase()}
                </div>
                {editId === c.id ? (
                  <div className="flex flex-1 gap-1">
                    <input value={editText} onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") submitEdit(); if (e.key === "Escape") setEditId(null); }}
                      className="flex-1 rounded-lg border border-[var(--accent)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)] focus:outline-none"
                      autoFocus />
                    <button onClick={submitEdit} className="rounded-lg bg-[var(--accent)] px-2 py-1 text-xs text-white">저장</button>
                    <button onClick={() => setEditId(null)} className="rounded-lg px-1 py-1 text-xs text-[var(--muted-foreground)]"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex flex-1 items-start justify-between gap-1">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: getColor(c.userId) }}>{getName(c.userId)} </span>
                      <span className="text-xs text-[var(--foreground)]">{c.text}</span>
                    </div>
                    {c.userId === userId && (
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/c:opacity-100">
                        <button onClick={() => { setEditId(c.id); setEditText(c.text); }}
                          className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--accent)]"><Pencil size={10} /></button>
                        <button onClick={async () => { onDelete(itemId, c.id); await deleteItemComment(today, itemId, c.id); }}
                          className="rounded p-0.5 text-[var(--muted-foreground)] hover:text-red-400"><X size={10} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="응원 한마디..."
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none" />
          <button onClick={submit} className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-white transition-opacity hover:opacity-80">
            <Send size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── 아이템 행 ── */
function ItemRow({ item, color, isMe, onToggle, onDelete, onEdit, reactions, iLiked, onLike, commentCount, commentOpen, onCommentToggle }: {
  item: DisplayItem; color: string; isMe: boolean;
  onToggle?: () => void; onDelete?: () => void; onEdit?: (text: string) => void;
  reactions: string[]; iLiked: boolean; onLike: () => void;
  commentCount: number; commentOpen: boolean; onCommentToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveEdit = () => {
    if (editText.trim() && onEdit) { onEdit(editText.trim()); }
    setEditing(false);
  };

  const typeIcon = item.type === "routine"
    ? <Repeat size={11} className="shrink-0 text-[var(--muted-foreground)]/50" />
    : item.type === "quest"
    ? <Swords size={11} className="shrink-0 text-[var(--muted-foreground)]/50" />
    : null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--border)]/80">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {isMe && onToggle ? (
          <button onClick={onToggle}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-110"
            style={{ borderColor: color, backgroundColor: item.done ? color : "transparent" }}>
            {item.done && <Check size={11} className="text-white" strokeWidth={3} />}
          </button>
        ) : (
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
            style={{ borderColor: color, backgroundColor: item.done ? color : "transparent" }}>
            {item.done && <Check size={9} className="text-white" strokeWidth={3} />}
          </div>
        )}
        {typeIcon}
        {editing ? (
          <input ref={inputRef} value={editText} onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
            onBlur={saveEdit} autoFocus
            className="flex-1 rounded-lg border border-[var(--accent)] bg-[var(--background)] px-2 py-0.5 text-sm text-[var(--foreground)] focus:outline-none" />
        ) : (
          <span className={`flex-1 text-sm leading-snug ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>
            {item.text}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-1">
          {/* 하트 */}
          <button onClick={onLike}
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all hover:scale-110 ${iLiked ? "text-red-400" : "text-[var(--muted-foreground)]/60 hover:text-red-300"}`}>
            <Heart size={12} fill={iLiked ? "currentColor" : "none"} />
            {reactions.length > 0 && <span>{reactions.length}</span>}
          </button>
          {/* 댓글 */}
          <button onClick={onCommentToggle}
            className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all ${commentOpen || commentCount > 0 ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]/60 hover:text-[var(--muted-foreground)]"}`}>
            <MessageCircle size={12} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>
          {/* 수정/삭제 (내 보드 manual만) */}
          {isMe && item.type === "manual" && onEdit && (
            <button onClick={() => { setEditing(true); setEditText(item.text); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="rounded p-1 text-[var(--muted-foreground)]/40 transition-all hover:text-[var(--accent)] hover:opacity-100">
              <Pencil size={12} />
            </button>
          )}
          {isMe && item.type === "manual" && onDelete && (
            <button onClick={onDelete}
              className="rounded p-1 text-[var(--muted-foreground)]/40 transition-all hover:text-red-400 hover:opacity-100">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
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
  const [openCommentItemId, setOpenCommentItemId] = useState<string | null>(null);
  // challenge modal
  const [challengeTarget, setChallengeTarget] = useState<{ userId: string; name: string } | null>(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeRarity, setChallengeRarity] = useState<typeof RARITY_OPTIONS[number]>("normal");

  const today = getTodayStr();
  const reactionsKey = `item-reactions-${today}`;

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
    if (!allStoreRes.data) { setLoading(false); return; }

    const byUser: Record<string, Record<string, unknown>> = {};
    const merged: ItemReactions = {};
    const mergedComments: AllComments = {};
    const dismissed = loadDismissed();

    for (const row of allStoreRes.data) {
      if (row.key === reactionsKey) {
        const liked = row.value as Record<string, boolean> | null;
        if (liked) for (const id of Object.keys(liked)) {
          if (liked[id]) { if (!merged[id]) merged[id] = []; if (!merged[id].includes(row.user_id)) merged[id].push(row.user_id); }
        }
        continue;
      }
      if (row.key === `item-comments-${today}`) {
        const uc = row.value as Record<string, Comment[]> | null;
        if (uc) for (const [id, cs] of Object.entries(uc)) {
          if (!mergedComments[id]) mergedComments[id] = [];
          mergedComments[id].push(...(cs as Comment[]));
        }
        if (row.user_id !== user.id) { if (!byUser[row.user_id]) byUser[row.user_id] = {}; byUser[row.user_id][row.key] = row.value; }
        continue;
      }
      if (row.user_id === user.id) continue;
      if (!byUser[row.user_id]) byUser[row.user_id] = {};
      byUser[row.user_id][row.key] = row.value;
    }

    for (const id of Object.keys(mergedComments)) mergedComments[id].sort((a, b) => a.ts.localeCompare(b.ts));
    setItemReactions(merged);
    setAllComments(mergedComments);

    const incoming: (Challenge & { fromUserId: string })[] = [];
    for (const [uid, store] of Object.entries(byUser)) {
      const chs = Array.isArray(store["quest-challenges-out"]) ? store["quest-challenges-out"] as Challenge[] : [];
      for (const c of chs) if (c.toUserId === user.id && !dismissed.includes(c.id)) incoming.push({ ...c, fromUserId: uid });
    }
    incoming.sort((a, b) => b.ts.localeCompare(a.ts));
    setIncomingChallenges(incoming);

    const boards: UserBoardData[] = Object.entries(byUser).map(([uid, store]) => ({
      user_id: uid,
      items: buildItemsFromStore(store["personal-site-quests"], store["personal-site-routines"], store["personal-site-routine-completions"], store[`shared-board-${today}`], today),
      streak: extractStreak(store["personal-site-quest-stats"]),
    }));
    boards.sort((a, b) => b.items.length - a.items.length);
    setOtherBoards(boards);
    setLoading(false);
  }, [user, today, reactionsKey]);

  useEffect(() => { pullFromSupabase().then(() => loadMyItems()); fetchOtherBoards(); }, [loadMyItems, fetchOtherBoards]);
  useEffect(() => { const id = setInterval(fetchOtherBoards, 30000); return () => clearInterval(id); }, [fetchOtherBoards]);
  useEffect(() => {
    const r = () => loadMyItems();
    window.addEventListener("quests-updated", r); window.addEventListener("storage", r);
    return () => { window.removeEventListener("quests-updated", r); window.removeEventListener("storage", r); };
  }, [loadMyItems]);

  const handleToggle = async (item: DisplayItem) => {
    setMyItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i));
    if (item.type === "quest") {
      const updated = toggleQuest(item.id.replace(/^quest-/, ""));
      if (updated) { upsertQuestToSupabase(updated); upsertStatsToSupabase(getStats()); } else loadMyItems();
    } else if (item.type === "routine") {
      toggleRoutineCompletion(item.id.replace(/^routine-/, ""), today);
      upsertRoutineCompletionToSupabase(item.id.replace(/^routine-/, ""), today, !item.done);
      upsertStatsToSupabase(getStats());
    } else {
      const next = myItems.map((i) => i.id === item.id ? { ...i, done: !i.done } : i);
      syncMyBoard(next);
    }
  };

  const handleEditItem = async (id: string, newText: string) => {
    const next = myItems.map((i) => i.id === id ? { ...i, text: newText } : i);
    setMyItems(next);
    await syncMyBoard(next);
  };

  const handleDeleteItem = async (id: string) => {
    const next = myItems.filter((i) => i.id !== id);
    setMyItems(next);
    await syncMyBoard(next);
  };

  const handleAddManual = async () => {
    if (!newText.trim()) return;
    const item: DisplayItem = { id: generateId(), text: newText.trim(), done: false, type: "manual" };
    const next = [...myItems, item];
    setMyItems(next); setNewText("");
    await syncMyBoard(next);
  };

  const handleLike = async (itemId: string) => {
    if (!user || !supabase) return;
    const current = itemReactions[itemId] ?? [];
    const iLiked = current.includes(user.id);
    setItemReactions((prev) => ({ ...prev, [itemId]: iLiked ? current.filter((id) => id !== user.id) : [...current, user.id] }));
    const { data } = await supabase.from("user_store").select("value").eq("user_id", user.id).eq("key", reactionsKey).maybeSingle();
    const existing = (data?.value as Record<string, boolean> | null) ?? {};
    existing[itemId] = !iLiked;
    await supabase.from("user_store").upsert({ user_id: user.id, key: reactionsKey, value: existing, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
  };

  const handleAcceptChallenge = async (c: Challenge & { fromUserId: string }) => {
    const quest = addQuest({ title: c.title, rarity: c.rarity, xp: c.xp, date: today });
    upsertQuestToSupabase(quest); upsertStatsToSupabase(getStats());
    await dismissChallenge(c.id);
    setIncomingChallenges((prev) => prev.filter((x) => x.id !== c.id));
    loadMyItems();
  };

  const handleSendChallenge = async () => {
    if (!user || !challengeTarget || !challengeTitle.trim()) return;
    const config = RARITY_CONFIG[challengeRarity];
    await sendChallengeToUser({ id: generateId(), toUserId: challengeTarget.userId, title: challengeTitle.trim(), rarity: challengeRarity, xp: config.xp, ts: new Date().toISOString() });
    setChallengeTarget(null); setChallengeTitle(""); setChallengeRarity("normal");
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 6);
  const myColor = user ? getUserColor(user.id, profiles) : "#3B82F6";
  const myDone = myItems.filter((i) => i.done).length;
  const myTotal = myItems.length;
  const myStreak = extractStreak(getStats());

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">보드</h1>
            <p className="text-xs text-[var(--muted-foreground)]">{formatDate(today)}</p>
          </div>
        </div>
        <button onClick={() => { pullFromSupabase().then(() => loadMyItems()); fetchOtherBoards(); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">
          <RefreshCw size={13} />새로고침
        </button>
      </motion.div>

      {/* 도전장 */}
      <AnimatePresence>
        {incomingChallenges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-yellow-500">
              <Zap size={14} />도전장이 왔어요!
            </p>
            <div className="space-y-2">
              {incomingChallenges.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: RARITY_COLOR[c.rarity] }} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{c.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{getName(c.fromUserId)} · {c.xp} XP</p>
                  </div>
                  <button onClick={() => handleAcceptChallenge(c)}
                    className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                    수락
                  </button>
                  <button onClick={async () => { await dismissChallenge(c.id); setIncomingChallenges((p) => p.filter((x) => x.id !== c.id)); }}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
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
          style={{ borderColor: `${myColor}50`, background: `linear-gradient(135deg, ${myColor}06, transparent)` }}>
          {/* 프로필 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: myColor }}>
                {getName(user.id)[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[var(--foreground)]">{getName(user.id)}</p>
                  <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">나</span>
                  {myStreak > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-xs font-semibold text-orange-500">
                      <Flame size={10} />{myStreak}일
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">{myDone}/{myTotal} 완료 {myTotal > 0 && `· ${Math.round((myDone/myTotal)*100)}%`}</p>
              </div>
            </div>
          </div>

          {/* 진행 바 */}
          {myTotal > 0 && (
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                animate={{ width: `${(myDone/myTotal)*100}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ backgroundColor: myColor }} />
            </div>
          )}

          {/* 추가 입력 */}
          <div className="mb-3 flex gap-2">
            <input value={newText} onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
              placeholder="할 일 직접 추가..."
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors" />
            <button onClick={handleAddManual}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: myColor }}>
              <Plus size={15} />추가
            </button>
          </div>

          {myItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center">
              <Swords size={28} className="mx-auto mb-2 text-[var(--muted-foreground)]/40" />
              <p className="text-sm text-[var(--muted-foreground)]">오늘 퀘스트를 추가해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myItems.map((item) => {
                const isOpen = openCommentItemId === item.id;
                return (
                  <div key={item.id}>
                    <ItemRow item={item} color={myColor} isMe={true}
                      onToggle={() => handleToggle(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                      onEdit={item.type === "manual" ? (t) => handleEditItem(item.id, t) : undefined}
                      reactions={itemReactions[item.id] ?? []} iLiked={(itemReactions[item.id] ?? []).includes(user.id)}
                      onLike={() => handleLike(item.id)}
                      commentCount={(allComments[item.id] ?? []).length} commentOpen={isOpen}
                      onCommentToggle={() => setOpenCommentItemId(isOpen ? null : item.id)} />
                    <AnimatePresence>
                      {isOpen && (
                        <CommentBox key={item.id} itemId={item.id} comments={allComments[item.id] ?? []}
                          userId={user.id} profiles={profiles} today={today}
                          onAdd={(id, c) => setAllComments((p) => ({ ...p, [id]: [...(p[id] ?? []), c] }))}
                          onEdit={(id, cid, t) => setAllComments((p) => ({ ...p, [id]: (p[id] ?? []).map((c) => c.id === cid ? { ...c, text: t } : c) }))}
                          onDelete={(id, cid) => setAllComments((p) => ({ ...p, [id]: (p[id] ?? []).filter((c) => c.id !== cid) }))} />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* 다른 사람들 */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherBoards.map(({ user_id, items, streak }, idx) => {
            const color = getUserColor(user_id, profiles);
            const name = getName(user_id);
            const done = items.filter((i) => i.done).length;
            const total = items.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <motion.div key={user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * idx }}
                className="rounded-2xl border bg-[var(--card)] p-4 shadow-sm" style={{ borderColor: `${color}35` }}>
                {/* 카드 헤더 */}
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}>
                    {name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-bold text-[var(--foreground)]">{name}</p>
                      {streak > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-xs font-semibold text-orange-500">
                          <Flame size={9} />{streak}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{done}/{total} 완료 {total > 0 && `· ${pct}%`}</p>
                  </div>
                  <button onClick={() => setChallengeTarget({ userId: user_id, name })}
                    className="shrink-0 rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:border-yellow-500/50 hover:text-yellow-500">
                    <Zap size={13} />
                  </button>
                </div>

                {total > 0 && (
                  <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                )}

                {items.length === 0 ? (
                  <p className="py-5 text-center text-xs text-[var(--muted-foreground)]/60">아직 할 일이 없어요</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((item) => {
                      const isOpen = openCommentItemId === item.id;
                      return (
                        <div key={item.id}>
                          <ItemRow item={item} color={color} isMe={false}
                            reactions={itemReactions[item.id] ?? []} iLiked={user ? (itemReactions[item.id] ?? []).includes(user.id) : false}
                            onLike={() => handleLike(item.id)}
                            commentCount={(allComments[item.id] ?? []).length} commentOpen={isOpen}
                            onCommentToggle={() => setOpenCommentItemId(isOpen ? null : item.id)} />
                          <AnimatePresence>
                            {isOpen && user && (
                              <CommentBox key={item.id} itemId={item.id} comments={allComments[item.id] ?? []}
                                userId={user.id} profiles={profiles} today={today}
                                onAdd={(id, c) => setAllComments((p) => ({ ...p, [id]: [...(p[id] ?? []), c] }))}
                                onEdit={(id, cid, t) => setAllComments((p) => ({ ...p, [id]: (p[id] ?? []).map((c) => c.id === cid ? { ...c, text: t } : c) }))}
                                onDelete={(id, cid) => setAllComments((p) => ({ ...p, [id]: (p[id] ?? []).filter((c) => c.id !== cid) }))} />
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
      )}

      {!loading && otherBoards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
          <LayoutGrid size={28} className="mx-auto mb-3 text-[var(--muted-foreground)]/30" />
          <p className="text-sm text-[var(--muted-foreground)]">아직 다른 멤버가 없어요</p>
        </div>
      )}

      {/* 도전장 보내기 모달 */}
      <AnimatePresence>
        {challengeTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            onClick={(e) => e.target === e.currentTarget && setChallengeTarget(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-[var(--foreground)]">도전장 보내기</h2>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">→ {challengeTarget.name}</p>
                </div>
                <button onClick={() => setChallengeTarget(null)} className="rounded-lg p-1.5 hover:bg-[var(--muted)]">
                  <X size={16} className="text-[var(--muted-foreground)]" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">퀘스트 이름</label>
                  <input value={challengeTitle} onChange={(e) => setChallengeTitle(e.target.value)}
                    placeholder="예: 오늘 30분 운동하기"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">난이도</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {RARITY_OPTIONS.map((r) => (
                      <button key={r} onClick={() => setChallengeRarity(r)}
                        className={`rounded-xl py-2 text-xs font-semibold transition-all ${challengeRarity === r ? "text-white shadow-sm" : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/50"}`}
                        style={challengeRarity === r ? { backgroundColor: RARITY_COLOR[r] } : {}}>
                        {RARITY_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleSendChallenge} disabled={!challengeTitle.trim()}
                  className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                  ⚡ 도전장 보내기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
