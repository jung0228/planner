"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ListTodo, StickyNote, Bookmark, ArrowRight, Sparkles, Swords, BookOpen } from "lucide-react";

const apps = [
  {
    href: "/calendar",
    icon: Calendar,
    title: "일정",
    description: "캘린더로 일정을 관리하고 드래그로 쉽게 이동해보세요",
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/quests",
    icon: Swords,
    title: "일일 퀘스트",
    description: "매일 미션을 추가하고 완료해보세요. RPG 스타일로 재밌게!",
    color: "from-amber-500 to-orange-700",
  },
  {
    href: "/teps",
    icon: BookOpen,
    title: "텝스 독해",
    description: "공식 모의고사 독해 35문제 풀기. 바로 채점까지!",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/todos",
    icon: ListTodo,
    title: "할일",
    description: "곧 만나요! 할일 리스트와 우선순위 관리",
    color: "from-violet-500 to-purple-600",
    soon: true,
  },
  {
    href: "/notes",
    icon: StickyNote,
    title: "메모",
    description: "곧 만나요! 빠르게 메모하고 검색",
    color: "from-amber-500 to-orange-600",
    soon: true,
  },
  {
    href: "/bookmarks",
    icon: Bookmark,
    title: "북마크",
    description: "곧 만나요! 링크 모음과 태그",
    color: "from-rose-500 to-pink-600",
    soon: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
      >
        <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
          <Sparkles size={20} />
          <span className="text-sm font-medium">환영해요</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          내 공간에 오신 걸 환영해요
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          일정, 할일, 메모를 한곳에서 관리하세요. 지금은 일정 앱부터 시작해볼까요?
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {apps.map((app, i) => (
          <motion.div
            key={app.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
          >
            <Link
              href={app.soon ? "#" : app.href}
              className={`group block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
                app.soon ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              <div
                className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${app.color} p-3 text-white`}
              >
                <app.icon size={24} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{app.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {app.description}
                  </p>
                </div>
                {!app.soon && (
                  <ArrowRight
                    size={20}
                    className="text-[var(--accent)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-hover)]"
                  />
                )}
                {app.soon && (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                    준비중
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
