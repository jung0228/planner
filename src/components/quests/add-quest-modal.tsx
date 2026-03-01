"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { QuestRarity } from "@/lib/quests";
import { RARITY_CONFIG, QUEST_TEMPLATES } from "@/lib/quests";
import { cn } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    rarity: QuestRarity;
    xp: number;
  }) => void;
  date: string;
};

export function AddQuestModal({ isOpen, onClose, onSubmit, date }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rarity, setRarity] = useState<QuestRarity>("normal");

  const handleQuickAdd = (t: (typeof QUEST_TEMPLATES)[0]) => {
    const config = RARITY_CONFIG[t.rarity];
    onSubmit({ title: t.title, rarity: t.rarity, xp: config.xp });
    onClose();
  };

  const config = RARITY_CONFIG[rarity];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      rarity,
      xp: config.xp,
    });
    setTitle("");
    setDescription("");
    setRarity("normal");
    onClose();
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-amber-700/50 bg-amber-950/95 p-6 shadow-2xl shadow-black/50"
            style={{
              backgroundImage: "linear-gradient(180deg, rgba(120,53,15,0.3) 0%, rgba(69,26,3,0.95) 100%)",
            }}
          >
            <div className="mb-6 flex items-center justify-between border-b border-amber-700/30 pb-4">
              <h2 className="text-xl font-bold text-amber-100">
                새로운 퀘스트 추가
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-amber-300 hover:bg-amber-800/50 hover:text-amber-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* 빠른 추가 템플릿 */}
            <div className="mb-4 rounded-lg border border-amber-700/30 bg-amber-900/30 p-3">
              <p className="mb-2 text-xs font-medium text-amber-400/80">빠른 추가</p>
              <div className="flex flex-wrap gap-2">
                {QUEST_TEMPLATES.map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => handleQuickAdd(t)}
                    className="rounded-lg border border-amber-700/50 bg-amber-900/50 px-2.5 py-1.5 text-xs text-amber-300 transition-colors hover:bg-amber-800/50"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-amber-200">
                  퀘스트 이름
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="오늘의 미션을 입력하세요"
                  required
                  className="w-full rounded-lg border-2 border-amber-700/50 bg-amber-900/50 px-4 py-2.5 text-amber-100 placeholder-amber-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-amber-200">
                  상세 설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="보상이나 힌트를 적어보세요"
                  rows={2}
                  className="w-full rounded-lg border-2 border-amber-700/50 bg-amber-900/50 px-4 py-2.5 text-amber-100 placeholder-amber-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-amber-200">
                  등급 (난이도에 따라 XP 차등)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(RARITY_CONFIG) as QuestRarity[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRarity(r)}
                      className={cn(
                        "rounded-lg border-2 px-3 py-2 text-center text-sm font-medium transition-all",
                        rarity === r ? "text-white" : "border-transparent bg-amber-900/30 text-amber-400 hover:bg-amber-800/50"
                      )}
                      style={
                        rarity === r
                          ? {
                              backgroundColor: RARITY_CONFIG[r].borderColor,
                              borderColor: RARITY_CONFIG[r].color,
                            }
                          : undefined
                      }
                    >
                      <span className="block text-xs">{RARITY_CONFIG[r].label}</span>
                      <span className="text-[10px]">+{RARITY_CONFIG[r].xp} XP</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border-2 border-amber-700/50 py-2.5 font-medium text-amber-300 transition-colors hover:bg-amber-800/50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg py-2.5 font-bold text-amber-950 transition-colors"
                  style={{ backgroundColor: config.color }}
                >
                  퀘스트 등록
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
