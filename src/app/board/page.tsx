"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Plus, Check, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { loadSharedBoard, syncSharedBoardToSupabase, type BoardItem, type SharedBoard } from "@/lib/quest-sync";
import { generateId } from "@/lib/utils";

type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
};

type UserBoard = {
  user_id: string;
  board: SharedBoard;
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

export default function BoardPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allBoards, setAllBoards] = useState<UserBoard[]>([]);
  const [newText, setNewText] = useState("");
  const today = getTodayStr();

  const myBoard = allBoards.find((b) => b.user_id === user?.id)?.board ?? { date: today, items: [] };

  const fetchBoards = useCallback(async () => {
    if (!supabase) return;
    const [profilesRes, boardsRes] = await Promise.all([
      supabase.from("profiles").select("id,display_name,avatar_color"),
      supabase.from("user_store").select("user_id,value").eq("key", `shared-board-${today}`),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (boardsRes.data) {
      setAllBoards(boardsRes.data.map((row) => ({
        user_id: row.user_id,
        board: (row.value as SharedBoard) ?? { date: today, items: [] },
      })));
    }
  }, [today]);

  useEffect(() => {
    // 내 보드를 localStorage에서 먼저 로드
    if (user) {
      const local = loadSharedBoard(today);
      setAllBoards((prev) => {
        const others = prev.filter((b) => b.user_id !== user.id);
        if (local.items.length > 0) {
          return [...others, { user_id: user.id, board: local }];
        }
        return prev;
      });
    }
    fetchBoards();
  }, [user, today, fetchBoards]);

  const updateMyBoard = async (items: BoardItem[]) => {
    if (!user) return;
    const updated: SharedBoard = { date: today, items };
    setAllBoards((prev) => {
      const others = prev.filter((b) => b.user_id !== user.id);
      return [...others, { user_id: user.id, board: updated }];
    });
    await syncSharedBoardToSupabase(today, updated);
  };

  const handleAdd = async () => {
    if (!newText.trim()) return;
    const item: BoardItem = { id: generateId(), text: newText.trim(), done: false };
    await updateMyBoard([...myBoard.items, item]);
    setNewText("");
  };

  const handleToggle = async (id: string) => {
    const items = myBoard.items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    await updateMyBoard(items);
  };

  const handleDelete = async (id: string) => {
    const items = myBoard.items.filter((item) => item.id !== id);
    await updateMyBoard(items);
  };

  const getName = (uid: string) => profiles.find((p) => p.id === uid)?.display_name ?? uid.slice(0, 8);

  // 내 보드 먼저, 그다음 다른 사람들
  const orderedBoards = [
    ...allBoards.filter((b) => b.user_id === user?.id),
    ...allBoards.filter((b) => b.user_id !== user?.id),
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <LayoutGrid size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">보드</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{formatDate(today)} · 오늘 할 일을 공유해보세요</p>
        </div>
      </motion.div>

      {/* 내 할일 입력 */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border-2 p-5 shadow-sm"
          style={{ borderColor: `${getUserColor(user.id, profiles)}60`, backgroundColor: `${getUserColor(user.id, profiles)}08` }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: getUserColor(user.id, profiles) }}>
              {(getName(user.id))[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">{getName(user.id)} (나)</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {myBoard.items.filter((i) => i.done).length}/{myBoard.items.length} 완료
              </p>
            </div>
          </div>

          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="오늘 할 일 추가..."
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: getUserColor(user.id, profiles) }}>
              <Plus size={16} />
              추가
            </button>
          </div>

          <AnimatePresence>
            {myBoard.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] py-6 text-center text-sm text-[var(--muted-foreground)]">
                오늘 할 일을 추가해보세요!
              </p>
            ) : (
              <div className="space-y-2">
                {myBoard.items.map((item) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-3 py-2.5">
                    <button onClick={() => handleToggle(item.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                      style={{ borderColor: getUserColor(user.id, profiles), backgroundColor: item.done ? getUserColor(user.id, profiles) : "transparent" }}>
                      {item.done && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.done ? "text-[var(--muted-foreground)] line-through" : "text-[var(--foreground)]"}`}>
                      {item.text}
                    </span>
                    <button onClick={() => handleDelete(item.id)}
                      className="shrink-0 rounded p-1 text-[var(--muted-foreground)] opacity-0 transition-all hover:text-red-400 group-hover:opacity-100 hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 다른 사람들 보드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedBoards.filter((b) => b.user_id !== user?.id).map(({ user_id, board }, idx) => {
          const color = getUserColor(user_id, profiles);
          const name = getName(user_id);
          const doneCount = board.items.filter((i) => i.done).length;
          const total = board.items.length;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          return (
            <motion.div key={user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (idx + 1) }}
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
                {total > 0 && (
                  <span className="shrink-0 text-sm font-bold" style={{ color }}>{pct}%</span>
                )}
              </div>

              {total > 0 && (
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              )}

              {board.items.length === 0 ? (
                <p className="py-4 text-center text-xs text-[var(--muted-foreground)]">아직 할 일이 없어요</p>
              ) : (
                <div className="space-y-1.5">
                  {board.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                        style={{ borderColor: color, backgroundColor: item.done ? color : "transparent" }}>
                        {item.done && <Check size={9} className="text-white" strokeWidth={3} />}
                      </div>
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

      {orderedBoards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-[var(--muted-foreground)]">
          <LayoutGrid size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 아무도 할 일을 공유하지 않았어요</p>
        </div>
      )}
    </div>
  );
}
