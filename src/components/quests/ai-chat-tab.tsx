"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Plus, Sparkles, Check } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/quests";
import type { AiQuestItem } from "@/lib/ai-quest-schema";
import type { AiEventItem } from "@/lib/ai-event-schema";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

const AI_CHAT_STORAGE_PREFIX = "personal-site-ai-chat-";
const AI_CHAT_ADDED_PREFIX = "personal-site-ai-chat-added-";
const AI_CHAT_ADDED_EVENTS_PREFIX = "personal-site-ai-chat-added-events-";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  quests?: AiQuestItem[];
  events?: AiEventItem[];
};

function loadChatForDate(dateStr: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${AI_CHAT_STORAGE_PREFIX}${dateStr}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChatForDate(dateStr: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${AI_CHAT_STORAGE_PREFIX}${dateStr}`,
      JSON.stringify(messages)
    );
  } catch {
    // ignore
  }
}

function loadAddedKeysForDate(dateStr: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${AI_CHAT_ADDED_PREFIX}${dateStr}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveAddedKeysForDate(dateStr: string, keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${AI_CHAT_ADDED_PREFIX}${dateStr}`,
      JSON.stringify([...keys])
    );
  } catch {
    // ignore
  }
}

function loadAddedEventKeysForDate(dateStr: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${AI_CHAT_ADDED_EVENTS_PREFIX}${dateStr}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveAddedEventKeysForDate(dateStr: string, keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${AI_CHAT_ADDED_EVENTS_PREFIX}${dateStr}`,
      JSON.stringify([...keys])
    );
  } catch {
    // ignore
  }
}

export type QuestContextItem = {
  title: string;
  completed: boolean;
  isRoutine?: boolean;
};

type Props = {
  dateStr: string;
  quests: QuestContextItem[];
  onAddQuest: (quest: AiQuestItem) => void;
  onAddEvent?: (event: AiEventItem) => void;
  disabled?: boolean;
  /** "calendar"면 퀘스트 UI 숨김, 일정만 표시 */
  mode?: "quests" | "calendar";
};

export function AiChatTab({ dateStr, quests, onAddQuest, onAddEvent, disabled, mode = "quests" }: Props) {
  const mounted = useMounted();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedQuestKeys, setAddedQuestKeys] = useState<Set<string>>(new Set());
  const [addedEventKeys, setAddedEventKeys] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleAddQuest = (msgIndex: number, questIndex: number, q: AiQuestItem) => {
    onAddQuest(q);
    const key = `${msgIndex}-${questIndex}`;
    setAddedQuestKeys((prev) => {
      const next = new Set(prev).add(key);
      if (dateStr) saveAddedKeysForDate(dateStr, next);
      return next;
    });
  };

  const handleAddEvent = (msgIndex: number, eventIndex: number, e: AiEventItem) => {
    onAddEvent?.(e);
    const key = `e-${msgIndex}-${eventIndex}`;
    setAddedEventKeys((prev) => {
      const next = new Set(prev).add(key);
      if (dateStr) saveAddedEventKeysForDate(dateStr, next);
      return next;
    });
  };

  // 날짜별 채팅 로그 + 추가한 퀘스트/일정 로드
  useEffect(() => {
    if (!mounted || !dateStr) return;
    setMessages(loadChatForDate(dateStr));
    setAddedQuestKeys(loadAddedKeysForDate(dateStr));
    setAddedEventKeys(loadAddedEventKeysForDate(dateStr));
  }, [mounted, dateStr]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextAfterUser = [...messages, userMsg];
    setMessages(nextAfterUser);
    if (dateStr) saveChatForDate(dateStr, nextAfterUser);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          questContext: dateStr
            ? {
                date: dateStr,
                quests: quests.map((q) => ({
                  title: q.title,
                  completed: q.completed,
                  isRoutine: q.isRoutine,
                })),
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `오류: ${res.status}`);
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.message || "(응답 없음)",
        quests: data.quests,
        events: data.events,
      };
      const nextAfterAssistant = [...nextAfterUser, assistantMsg];
      setMessages(nextAfterAssistant);
      if (dateStr) saveChatForDate(dateStr, nextAfterAssistant);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[400px] flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <Sparkles size={20} className="text-[var(--accent)]" />
        <span className="font-bold text-[var(--foreground)]">AI 어시스턴트</span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {disabled ? "(날짜를 선택해주세요)" : ""}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              {onAddEvent
                ? "일정을 말하면 캘린더에 추가해줄게요."
                : "자유롭게 대화하거나, 할 일을 말하면 퀘스트로 만들어줄게요."}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]/80">
              {onAddEvent
                ? '예: "3월 10일 메타리뷰 릴리즈 일정 추가해줘"'
                : '예: "오늘 운동하고 책 읽어야 해"'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-2.5",
                msg.role === "user"
                  ? "bg-[var(--accent)]/20 text-[var(--foreground)]"
                  : "bg-[var(--muted)]/30 text-[var(--foreground)]"
              )}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

              {msg.quests && msg.quests.length > 0 && mode !== "calendar" && (
                <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    생성된 퀘스트 (추가 버튼을 눌러 넣어보세요)
                  </p>
                  {msg.quests.map((q, qi) => {
                    const key = `${i}-${qi}`;
                    const isAdded = addedQuestKeys.has(key);
                    return (
                      <motion.div
                        key={qi}
                        layout
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {q.title}
                          </span>
                          <span
                            className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
                            style={{
                              backgroundColor: `${RARITY_CONFIG[q.rarity].borderColor}40`,
                              color: RARITY_CONFIG[q.rarity].color,
                            }}
                          >
                            {RARITY_CONFIG[q.rarity].label}
                          </span>
                        </div>
                        {isAdded ? (
                          <span className="flex shrink-0 items-center gap-1 rounded bg-[var(--muted)]/50 px-2 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                            <Check size={12} strokeWidth={2.5} />
                            추가됐어요
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddQuest(i, qi, q)}
                            disabled={disabled}
                            className="flex shrink-0 items-center gap-1 rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                          >
                            <Plus size={12} />
                            추가
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {msg.events && msg.events.length > 0 && onAddEvent && (
                <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">
                    생성된 일정 (추가 버튼을 눌러 캘린더에 넣어보세요)
                  </p>
                  {msg.events.map((ev, ei) => {
                    const key = `e-${i}-${ei}`;
                    const isAdded = addedEventKeys.has(key);
                    const dateLabel =
                      ev.date === ev.endDate
                        ? ev.date
                        : `${ev.date} ~ ${ev.endDate ?? ev.date}`;
                    return (
                      <motion.div
                        key={ei}
                        layout
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {ev.title}
                          </span>
                          <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                            {dateLabel}
                          </span>
                        </div>
                        {isAdded ? (
                          <span className="flex shrink-0 items-center gap-1 rounded bg-[var(--muted)]/50 px-2 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                            <Check size={12} strokeWidth={2.5} />
                            추가됐어요
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddEvent(i, ei, ev)}
                            disabled={disabled}
                            className="flex shrink-0 items-center gap-1 rounded bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                          >
                            <Plus size={12} />
                            일정 추가
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--muted)]/30 px-4 py-2.5">
              <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
              <span className="text-sm text-[var(--muted-foreground)]">생각 중...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="px-4 text-xs text-red-400">{error}</p>
      )}

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="메시지 입력..."
            disabled={disabled}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <motion.button
            whileHover={!loading ? { scale: 1.02 } : undefined}
            whileTap={!loading ? { scale: 0.98 } : undefined}
            onClick={handleSend}
            disabled={!input.trim() || loading || disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
