"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

type Props = {
  xp: number;
  show: boolean;
};

export function XpToast({ xp, show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border-2 border-amber-500/50 bg-amber-900/95 px-6 py-3 shadow-xl shadow-amber-900/50"
        >
          <Zap size={24} className="text-amber-400" />
          <span className="text-lg font-bold text-amber-200">
            +{xp} XP 획득!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
