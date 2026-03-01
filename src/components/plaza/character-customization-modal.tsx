"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  type CharacterCustomization,
  SKIN_OPTIONS,
  HAIR_OPTIONS,
  SHIRT_OPTIONS,
  PANTS_OPTIONS,
} from "@/lib/character";
import { cn } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial: CharacterCustomization;
  onSave: (c: CharacterCustomization) => void;
};

const HAIR_STYLES: { value: CharacterCustomization["hairStyle"]; label: string }[] = [
  { value: "short", label: "짧은 머리" },
  { value: "long", label: "긴 머리" },
  { value: "spiky", label: "스파이키" },
  { value: "bald", label: "대머리" },
];

const ACCESSORIES: { value: CharacterCustomization["accessory"]; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "hat", label: "모자" },
  { value: "glasses", label: "안경" },
  { value: "scarf", label: "스카프" },
];

export function CharacterCustomizationModal({
  isOpen,
  onClose,
  initial,
  onSave,
}: Props) {
  const [custom, setCustom] = useState<CharacterCustomization>(initial);

  useEffect(() => {
    if (isOpen) setCustom(initial);
  }, [isOpen, initial]);

  const handleSave = () => {
    onSave(custom);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-amber-700/50 bg-amber-950/95 shadow-2xl"
          >
            <div className="border-b border-amber-700/30 bg-amber-900/50 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-amber-100">
                  캐릭터 커스터마이징
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-amber-400 hover:bg-amber-800/50 hover:text-amber-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
              {/* 미리보기 */}
              <div className="flex justify-center rounded-xl border border-amber-700/30 bg-amber-900/30 p-6">
                <svg viewBox="0 0 32 48" className="h-24 w-16">
                  <ellipse cx="16" cy="36" rx="10" ry="8" fill={custom.shirtColor} />
                  <path d="M 6 40 L 10 46 L 22 46 L 26 40 Z" fill={custom.pantsColor} />
                  <circle cx="16" cy="18" r="10" fill={custom.skinColor} />
                  {custom.hairStyle !== "bald" && (
                    <ellipse cx="16" cy="14" rx="10" ry="8" fill={custom.hairColor} />
                  )}
                  <circle cx="13" cy="17" r="1.5" fill="#1e293b" />
                  <circle cx="19" cy="17" r="1.5" fill="#1e293b" />
                </svg>
              </div>

              {/* 피부색 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-200">
                  피부색
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustom((p) => ({ ...p, skinColor: c }))}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        custom.skinColor === c ? "border-amber-400 ring-2 ring-amber-400/50" : "border-amber-700/50"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* 머리카락 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-200">
                  머리카락
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {HAIR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustom((p) => ({ ...p, hairColor: c }))}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-all",
                        custom.hairColor === c ? "border-amber-400" : "border-amber-700/50"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {HAIR_STYLES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setCustom((p) => ({ ...p, hairStyle: value }))}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm transition-colors",
                        custom.hairStyle === value
                          ? "bg-amber-600 text-amber-950"
                          : "bg-amber-900/50 text-amber-300 hover:bg-amber-800/50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상의 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-200">
                  상의
                </label>
                <div className="flex flex-wrap gap-2">
                  {SHIRT_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustom((p) => ({ ...p, shirtColor: c }))}
                      className={cn(
                        "h-8 w-8 rounded-lg border-2 transition-all",
                        custom.shirtColor === c ? "border-amber-400 ring-2 ring-amber-400/50" : "border-amber-700/50"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* 하의 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-200">
                  하의
                </label>
                <div className="flex flex-wrap gap-2">
                  {PANTS_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustom((p) => ({ ...p, pantsColor: c }))}
                      className={cn(
                        "h-8 w-8 rounded-lg border-2 transition-all",
                        custom.pantsColor === c ? "border-amber-400 ring-2 ring-amber-400/50" : "border-amber-700/50"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* 악세서리 */}
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-200">
                  악세서리
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACCESSORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setCustom((p) => ({ ...p, accessory: value }))}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm transition-colors",
                        custom.accessory === value
                          ? "bg-amber-600 text-amber-950"
                          : "bg-amber-900/50 text-amber-300 hover:bg-amber-800/50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-amber-700/30 p-4">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border-2 border-amber-700/50 py-2.5 font-medium text-amber-300 hover:bg-amber-800/50"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-lg bg-amber-600 py-2.5 font-bold text-amber-950 hover:bg-amber-500"
                >
                  적용
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
