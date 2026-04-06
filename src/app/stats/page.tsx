"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { pullFromSupabase } from "@/lib/quest-sync";

type MonthData = {
  month: string;
  label: string;
  total: number;
  done: number;
  rate: number;
};

type Quest = { date: string; completed: boolean };
type Routine = { id: string };
type Completions = Record<string, Record<string, boolean>>;

function getMonthlyData(): MonthData[] {
  const data: MonthData[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getMonth() + 1}월`;

    // quests
    let total = 0;
    let done = 0;
    try {
      const quests: Quest[] = JSON.parse(localStorage.getItem("personal-site-quests") ?? "[]");
      const monthQuests = quests.filter((q) => q.date.startsWith(ym));
      total += monthQuests.length;
      done += monthQuests.filter((q) => q.completed).length;
    } catch {}

    // routines (count completions per day in month)
    try {
      const routines: Routine[] = JSON.parse(localStorage.getItem("personal-site-routines") ?? "[]");
      const completions: Completions = JSON.parse(localStorage.getItem("personal-site-routine-completions") ?? "{}");
      for (const [date, dayCompletions] of Object.entries(completions)) {
        if (!date.startsWith(ym)) continue;
        for (const r of routines) {
          total++;
          if (dayCompletions[r.id]) done++;
        }
      }
    } catch {}

    data.push({ month: ym, label, total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 });
  }
  return data;
}

export default function StatsPage() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    pullFromSupabase().then(() => {
      setData(getMonthlyData());
      setLoaded(true);
    });
  }, []);

  const maxRate = Math.max(...data.map((d) => d.rate), 1);
  const totalDone = data.reduce((s, d) => s + d.done, 0);
  const totalAll = data.reduce((s, d) => s + d.total, 0);
  const avgRate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <BarChart2 size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">통계</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">월별 퀘스트 완료율</p>
        </div>
      </motion.div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "최근 6개월 완료", value: totalDone },
          { label: "전체 퀘스트", value: totalAll },
          { label: "평균 완료율", value: `${avgRate}%` },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[var(--accent)]">{s.value}</p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* 바 차트 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-[var(--foreground)]">월별 완료율 (%)</h2>
        {loaded && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barCategoryGap="30%">
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} unit="%" />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload as MonthData;
                  return (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow">
                      <p className="font-semibold text-[var(--foreground)]">{d.label}</p>
                      <p className="text-[var(--muted-foreground)]">{d.done}/{d.total} 완료 ({d.rate}%)</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.rate >= 80 ? "#10B981" : entry.rate >= 50 ? "#3B82F6" : entry.rate >= 20 ? "#F59E0B" : "#94a3b8"}
                    opacity={entry.rate === 0 ? 0.3 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* 월별 상세 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-[var(--foreground)]">월별 상세</h2>
        <div className="space-y-3">
          {[...data].reverse().map((d) => (
            <div key={d.month} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-sm font-medium text-[var(--foreground)]">{d.label}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-[var(--muted)] h-2">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${d.rate}%`,
                    backgroundColor: d.rate >= 80 ? "#10B981" : d.rate >= 50 ? "#3B82F6" : d.rate >= 20 ? "#F59E0B" : "#94a3b8",
                  }} />
              </div>
              <span className="w-16 shrink-0 text-right text-sm text-[var(--muted-foreground)]">{d.done}/{d.total} ({d.rate}%)</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
