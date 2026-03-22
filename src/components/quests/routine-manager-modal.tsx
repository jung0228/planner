"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Repeat, Trash2 } from "lucide-react";
import {
  getAllRoutines,
  addRoutine,
  removeRoutine,
  type Routine,
} from "@/lib/routines";
import { RARITY_CONFIG, type QuestRarity } from "@/lib/quests";
import { syncRoutinesToSupabase, deleteRoutineFromSupabase } from "@/lib/quest-sync";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onRoutinesChange: () => void;
};

const ROUTINE_SUGGESTIONS = [
  { title: "물 8잔 마시기", rarity: "normal" as QuestRarity },
  { title: "30분 운동하기", rarity: "normal" as QuestRarity },
  { title: "1시간 공부/독서", rarity: "rare" as QuestRarity },
  { title: "메모 정리하기", rarity: "normal" as QuestRarity },
  { title: "아침 일찍 일어나기", rarity: "normal" as QuestRarity },
  { title: "10분 스트레칭", rarity: "normal" as QuestRarity },
];

export function RoutineManagerModal({ isOpen, onClose, onRoutinesChange }: Props) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newRarity, setNewRarity] = useState<QuestRarity>("normal");

  useEffect(() => {
    if (isOpen) setRoutines(getAllRoutines());
  }, [isOpen]);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addRoutine({ title: newTitle.trim(), rarity: newRarity });
    const updated = getAllRoutines();
    setRoutines(updated);
    setNewTitle("");
    syncRoutinesToSupabase(updated);
    onRoutinesChange();
  };

  const handleQuickAdd = (title: string, rarity: QuestRarity) => {
    addRoutine({ title, rarity });
    const updated = getAllRoutines();
    setRoutines(updated);
    syncRoutinesToSupabase(updated);
    onRoutinesChange();
  };

  const handleRemove = (id: string) => {
    removeRoutine(id);
    const updated = getAllRoutines();
    setRoutines(updated);
    deleteRoutineFromSupabase(id);
    onRoutinesChange();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-amber-700/50 bg-amber-950/95 shadow-2xl"
          >
            <div className="border-b border-amber-700/30 bg-amber-900/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat size={22} className="text-amber-400" />
                  <h2 className="text-xl font-bold text-amber-100">매일 루틴</h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-amber-400 hover:bg-amber-800/50 hover:text-amber-100"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="mt-1 text-sm text-amber-500/80">
                매일 자동으로 나타나는 퀘스트예요
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {/* 추가 폼 */}
              <div className="rounded-lg border border-amber-700/30 bg-amber-900/30 p-3">
                <p className="mb-2 text-xs font-medium text-amber-400/80">
                  새 루틴 추가
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="예: 물 8잔 마시기"
                    className="flex-1 rounded-lg border border-amber-700/50 bg-amber-900/50 px-3 py-2 text-sm text-amber-100 placeholder-amber-600"
                  />
                  <select
                    value={newRarity}
                    onChange={(e) => setNewRarity(e.target.value as QuestRarity)}
                    className="rounded-lg border border-amber-700/50 bg-amber-900/50 px-2 py-2 text-sm text-amber-200"
                  >
                    {(Object.keys(RARITY_CONFIG) as QuestRarity[]).map((r) => (
                      <option key={r} value={r}>
                        {RARITY_CONFIG[r].label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAdd}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-500"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* 빠른 추가 */}
              <div>
                <p className="mb-2 text-xs font-medium text-amber-400/80">
                  추천 루틴
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROUTINE_SUGGESTIONS.map(({ title, rarity }) => (
                    <button
                      key={title}
                      onClick={() => handleQuickAdd(title, rarity)}
                      className="rounded-lg border border-amber-700/50 bg-amber-900/30 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-800/50"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* 내 루틴 목록 */}
              <div>
                <p className="mb-2 text-xs font-medium text-amber-400/80">
                  내 루틴 ({routines.length}개)
                </p>
                {routines.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-amber-700/40 bg-amber-900/10 py-6 text-center text-sm text-amber-600/80">
                    아직 루틴이 없어요. 위에서 추가해보세요!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {routines.map((r) => (
                      <motion.div
                        key={r.id}
                        layout
                        className="flex items-center justify-between rounded-lg border border-amber-700/30 bg-amber-900/20 px-3 py-2"
                      >
                        <div>
                          <span className="font-medium text-amber-200">
                            {r.title}
                          </span>
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                            style={{
                              backgroundColor: `${RARITY_CONFIG[r.rarity].borderColor}40`,
                              color: RARITY_CONFIG[r.rarity].color,
                            }}
                          >
                            {RARITY_CONFIG[r.rarity].label}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemove(r.id)}
                          className="rounded p-1.5 text-amber-500 hover:bg-red-500/20 hover:text-red-400"
                          title="루틴에서 제거"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
