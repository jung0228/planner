"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Sparkles, Swords, BookOpen, ScrollText, Headphones, Pencil, GraduationCap } from "lucide-react";

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
    href: "/vocab",
    icon: BookOpen,
    title: "TEPS 단어",
    description: "오늘의 TEPS 단어를 학습하고 복습해보세요",
    color: "from-violet-500 to-purple-600",
  },
  {
    href: "/teps",
    icon: ScrollText,
    title: "TEPS 독해",
    description: "공식 모의고사 독해 35문제 풀기. 바로 채점까지!",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/teps-listening",
    icon: Headphones,
    title: "TEPS 리스닝",
    description: "TEPS 리스닝 문제를 들으며 실전 감각을 키워보세요",
    color: "from-sky-500 to-cyan-600",
  },
  {
    href: "/teps-vocab",
    icon: Pencil,
    title: "TEPS 어휘",
    description: "오늘의 TEPS 어휘 문법 문제를 풀어보세요",
    color: "from-rose-500 to-pink-600",
  },
  {
    href: "/teps-grammar",
    icon: GraduationCap,
    title: "TEPS 문법",
    description: "오늘의 TEPS 문법 30문제에 도전해보세요",
    color: "from-orange-500 to-amber-600",
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

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        {apps.map((app, i) => (
          <motion.div
            key={app.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * i }}
          >
            <Link
              href={app.href}
              className="group block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
            >
              <div
                className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${app.color} p-3 text-white`}
              >
                <app.icon size={22} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">{app.title}</h2>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)] line-clamp-2">
                    {app.description}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
