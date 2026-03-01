"use client";

import { motion } from "framer-motion";
import type { CharacterCustomization } from "@/lib/character";
import type { PresenceStatus } from "@/lib/presence";
import { PRESENCE_OPTIONS } from "@/lib/presence";
import { getQuestState, getLevel, getTitle } from "@/lib/quests";
import { useMounted } from "@/hooks/use-mounted";

type Props = {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  custom: CharacterCustomization;
  status?: PresenceStatus;
};

const TILE = 40;

export function PlazaCharacter({ x, y, direction, custom, status }: Props) {
  const mounted = useMounted();
  const left = x * TILE + TILE / 2 - 16;
  const top = y * TILE + TILE / 2 - 44;
  const scaleX = direction === "left" ? -1 : 1;
  const statusOpt = status ? PRESENCE_OPTIONS.find((o) => o.value === status) : null;

  const state = mounted ? getQuestState() : null;
  const levelInfo = state ? getLevel(state.totalXp) : null;
  const titleStr = levelInfo ? getTitle(levelInfo.level) : null;

  return (
    <motion.div
      key={`${x}-${y}`}
      className="absolute z-10 flex items-center justify-center"
      style={{
        left,
        top,
        width: 32,
        height: 48,
        transformOrigin: "center bottom",
        transform: `scaleX(${scaleX})`,
      }}
      initial={{ y: 4, opacity: 0.9 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* 상태 (위) - 공부중 등 */}
      {statusOpt && status !== "none" && (
        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-amber-400/50 bg-white/95 px-1.5 py-0.5 text-[9px] font-medium text-amber-800 shadow-sm dark:border-amber-600/50 dark:bg-amber-900/95 dark:text-amber-100"
          style={{ top: -24 }}
        >
          <span className="mr-0.5">{statusOpt.emoji}</span>
          {statusOpt.label}
        </motion.div>
      )}
      {/* 레벨·칭호 (아래) */}
      {mounted && levelInfo && titleStr && (
        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-amber-400/50 bg-white/95 px-1.5 py-0.5 text-[8px] font-semibold text-amber-800 shadow-sm dark:border-amber-600/50 dark:bg-amber-900/95 dark:text-amber-100"
          style={{
            top: statusOpt && status !== "none" ? -8 : -18,
          }}
        >
          Lv.{levelInfo.level} {titleStr}
        </motion.div>
      )}
      {/* 캐릭터 SVG */}
      <svg viewBox="0 0 32 48" className="h-full w-full">
        {/* 몸 (상의) */}
        <ellipse
          cx="16"
          cy="36"
          rx="10"
          ry="8"
          fill={custom.shirtColor}
          stroke="#2d3748"
          strokeWidth="1.2"
        />
        {/* 팔 */}
        <ellipse
          cx="8"
          cy="34"
          rx="4"
          ry="6"
          fill={custom.shirtColor}
          stroke="#1e293b"
          strokeWidth="0.5"
        />
        <ellipse
          cx="24"
          cy="34"
          rx="4"
          ry="6"
          fill={custom.shirtColor}
          stroke="#1e293b"
          strokeWidth="0.5"
        />
        {/* 하의 */}
        <path
          d="M 6 40 L 10 46 L 22 46 L 26 40 Z"
          fill={custom.pantsColor}
          stroke="#1e293b"
          strokeWidth="0.5"
        />
        {/* 얼굴 */}
        <circle
          cx="16"
          cy="18"
          r="10"
          fill={custom.skinColor}
          stroke="#1e293b"
          strokeWidth="0.5"
        />
        {/* 머리카락 */}
        {custom.hairStyle !== "bald" && (
          <g>
            {custom.hairStyle === "short" && (
              <ellipse cx="16" cy="14" rx="10" ry="8" fill={custom.hairColor} />
            )}
            {custom.hairStyle === "long" && (
              <>
                <ellipse cx="16" cy="14" rx="10" ry="8" fill={custom.hairColor} />
                <path
                  d="M 6 18 Q 4 28 8 36 Q 16 40 24 36 Q 28 28 26 18"
                  fill={custom.hairColor}
                />
              </>
            )}
            {custom.hairStyle === "spiky" && (
              <>
                <ellipse cx="16" cy="14" rx="9" ry="7" fill={custom.hairColor} />
                <path d="M 16 4 L 18 12 L 16 8 L 14 12 Z" fill={custom.hairColor} />
                <path d="M 8 10 L 14 14 L 10 12 Z" fill={custom.hairColor} />
                <path d="M 24 10 L 18 14 L 22 12 Z" fill={custom.hairColor} />
              </>
            )}
          </g>
        )}
        {/* 악세서리 */}
        {custom.accessory === "hat" && (
          <path
            d="M 4 12 Q 16 2 28 12 Q 24 14 16 14 Q 8 14 4 12"
            fill="#8B4513"
            stroke="#5D3A1A"
            strokeWidth="0.5"
          />
        )}
        {custom.accessory === "glasses" && (
          <g stroke="#333" strokeWidth="1" fill="none">
            <circle cx="12" cy="18" r="4" />
            <circle cx="20" cy="18" r="4" />
            <line x1="16" y1="18" x2="16" y2="18" />
            <path d="M 8 18 L 6 16 M 24 18 L 26 16" />
          </g>
        )}
        {custom.accessory === "scarf" && (
          <path
            d="M 12 28 L 10 36 L 16 34 L 22 36 L 20 28 Z"
            fill="#e11d48"
            stroke="#be123c"
            strokeWidth="0.5"
          />
        )}
        {/* 눈 */}
        <circle cx="13" cy="17" r="1.5" fill="#1e293b" />
        <circle cx="19" cy="17" r="1.5" fill="#1e293b" />
      </svg>
    </motion.div>
  );
}
