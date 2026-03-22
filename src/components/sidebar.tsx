"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flame, Swords, Users, Timer, LogOut, LayoutGrid } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "대시보드" },
  { href: "/quests", icon: Swords, label: "퀘스트" },
  { href: "/pomodoro", icon: Timer, label: "뽀모도로" },
  { href: "/social", icon: Users, label: "함께" },
  { href: "/board", icon: LayoutGrid, label: "보드" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const displayName = (user?.user_metadata?.display_name as string | undefined)
    ?? user?.user_metadata?.full_name as string | undefined
    ?? user?.email?.split("@")[0]
    ?? "사용자";

  return (
    <>
      {/* ── 데스크탑 사이드바 ── */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
            <Flame size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight">내 공간</span>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(pathname, href)
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--foreground)] hover:bg-[var(--border)]/50"
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          {/* 사용자 정보 */}
          {user && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold text-[var(--accent)]">
                {displayName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{displayName}</p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="shrink-0 rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                title="로그아웃"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}

          {/* 테마 */}
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

      {/* ── 모바일 하단 내비게이션 ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)]">
        <div className="no-scrollbar flex overflow-x-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-[60px] flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-center transition-colors",
                  active ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"
                )}
              >
                <Icon size={20} className="shrink-0" />
                <span className="text-[10px] font-medium leading-tight whitespace-nowrap">{label}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[var(--accent)]" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
