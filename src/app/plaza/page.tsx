"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { PlazaMap } from "@/components/plaza/plaza-map";

export default function PlazaPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <MapPin size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">광장</h1>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            Gather Town 스타일로 구역을 돌아다니며 상태를 설정해보세요 ✦ 방향키/WASD로 이동
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center overflow-x-auto"
      >
        <PlazaMap />
      </motion.div>
    </div>
  );
}
