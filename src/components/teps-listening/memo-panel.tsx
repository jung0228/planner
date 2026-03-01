"use client";

import { StickyNote } from "lucide-react";

interface MemoPanelProps {
  value: string;
  onChange: (v: string) => void;
}

export function MemoPanel({ value, onChange }: MemoPanelProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sticky top-4 space-y-3">
      <div className="flex items-center gap-2">
        <StickyNote size={15} className="text-[var(--accent)]" />
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">메모</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="단어, 표현, 노트..."
        rows={16}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      />
      <p className="text-[10px] text-[var(--muted)]">자동 저장됨</p>
    </div>
  );
}
