"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, LayoutDashboard, ListTodo, StickyNote, Bookmark, Flame, Swords, BookOpen, ScrollText, Headphones, Pencil, GraduationCap } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "대시보드", active: true },
  { href: "/calendar", icon: Calendar, label: "일정", active: true },
  { href: "/quests", icon: Swords, label: "일일 퀘스트", active: true },
  { href: "/vocab", icon: BookOpen, label: "TEPS 어휘", active: true },
  { href: "/teps", icon: ScrollText, label: "TEPS 독해", active: true },
  { href: "/teps-listening", icon: Headphones, label: "TEPS 리스닝", active: true },
  { href: "/teps-vocab", icon: Pencil, label: "TEPS 어휘", active: true },
  { href: "/teps-grammar", icon: GraduationCap, label: "TEPS 문법", active: true },
  { href: "/todos", icon: ListTodo, label: "할일", active: false, soon: true },
  { href: "/notes", icon: StickyNote, label: "메모", active: false, soon: true },
  { href: "/bookmarks", icon: Bookmark, label: "북마크", active: false, soon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolved } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <Flame size={22} />
        </div>
        <span className="text-lg font-bold tracking-tight">내 공간</span>
      </div>

      <nav className="space-y-1">
        {navItems.map(({ href, icon: Icon, label, active, soon }) => (
          <Link
            key={href}
            href={active ? href : "#"}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? pathname === href || (href !== "/" && pathname.startsWith(href))
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--foreground)] hover:bg-[var(--border)]/50"
                : "cursor-not-allowed text-[var(--muted)]"
            )}
          >
            <Icon size={18} className="shrink-0" />
            <span>{label}</span>
            {soon && (
              <span className="ml-auto rounded bg-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                soon
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-lg border border-[var(--border)] p-2">
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">테마</p>
          <div className="flex gap-1">
            {(["light", "dark", "auto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  theme === t
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--border)]"
                )}
              >
                {t === "light" ? "☀️" : t === "dark" ? "🌙" : "🖥️"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
