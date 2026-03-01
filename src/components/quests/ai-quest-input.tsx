"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";
import type { QuestRarity } from "@/lib/quests";

type Props = {
  onQuestsGenerated: (quests: { title: string; rarity: QuestRarity }[]) => void;
  disabled?: boolean;
};

export function AiQuestInput({ onQuestsGenerated, disabled }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `오류: ${res.status}`);
      }

      const quests = data.quests || [];
      if (quests.length > 0) {
        onQuestsGenerated(quests);
        setInput("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "퀘스트 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-600/40 bg-gradient-to-br from-amber-900/40 to-amber-950/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={18} className="text-amber-400" />
        <span className="text-sm font-bold text-amber-200">AI 퀘스트 생성</span>
      </div>
      <p className="mb-3 text-xs text-amber-500/80">
        할 일을 대충 적으면 AI가 퀘스트로 바꿔줘요. 예: &quot;운동하고 책 읽고 메일 답장&quot;
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="오늘 할 일 적어주세요..."
          disabled={disabled}
          className="flex-1 rounded-lg border border-amber-700/50 bg-amber-900/50 px-4 py-2.5 text-amber-100 placeholder-amber-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
        />
        <motion.button
          whileHover={!loading ? { scale: 1.02 } : undefined}
          whileTap={!loading ? { scale: 0.98 } : undefined}
          onClick={handleSubmit}
          disabled={!input.trim() || loading || disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-amber-950 transition-colors hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </motion.button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
