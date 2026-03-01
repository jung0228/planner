"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings2, ChevronDown } from "lucide-react";
import { PlazaCharacter } from "./plaza-character";
import { CharacterCustomizationModal } from "./character-customization-modal";
import {
  getCharacterCustomization,
  saveCharacterCustomization,
  type CharacterCustomization,
} from "@/lib/character";
import {
  getPresenceStatus,
  setPresenceStatus,
  PRESENCE_OPTIONS,
  type PresenceStatus,
} from "@/lib/presence";
import { recordStatusChange } from "@/lib/presence-timeline";
import { PlazaTimeline } from "./plaza-timeline";
import { useMounted } from "@/hooks/use-mounted";

const COLS = 20;
const ROWS = 14;
const TILE = 40;

type Direction = "up" | "down" | "left" | "right";

export function PlazaMap() {
  const mounted = useMounted();
  const [pos, setPos] = useState({ x: 10, y: 7 });
  const [direction, setDirection] = useState<Direction>("down");
  const [presence, setPresence] = useState<PresenceStatus>("none");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [timelineRefresh, setTimelineRefresh] = useState(0);
  const [custom, setCustom] = useState<CharacterCustomization>({
    skinColor: "#fcd5b8",
    hairColor: "#4a3728",
    hairStyle: "short",
    shirtColor: "#3b82f6",
    pantsColor: "#1e3a5f",
    accessory: "none",
  });
  const [customModalOpen, setCustomModalOpen] = useState(false);

  useEffect(() => {
    setCustom(getCharacterCustomization());
  }, []);

  useEffect(() => {
    if (mounted) setPresence(getPresenceStatus());
  }, [mounted]);

  const handlePresenceChange = useCallback((s: PresenceStatus) => {
    setPresence(s);
    setPresenceStatus(s);
    recordStatusChange(s);
    setTimelineRefresh((r) => r + 1);
    setStatusDropdownOpen(false);
  }, []);

  const handleSaveCustom = useCallback((c: CharacterCustomization) => {
    setCustom(c);
    saveCharacterCustomization(c);
  }, []);

  const move = useCallback(
    (dir: Direction) => {
      setDirection(dir);
      setPos((p) => {
        let nx = p.x;
        let ny = p.y;
        if (dir === "left") nx = Math.max(0, p.x - 1);
        if (dir === "right") nx = Math.min(COLS - 1, p.x + 1);
        if (dir === "up") ny = Math.max(0, p.y - 1);
        if (dir === "down") ny = Math.min(ROWS - 1, p.y + 1);
        return { x: nx, y: ny };
      });
    },
    []
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") move("up");
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") move("down");
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") move("left");
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") move("right");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);

  const todayStr =
    typeof window !== "undefined"
      ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`
      : "";

  return (
    <div className="flex items-start gap-6">
    <div className="relative shrink-0">
      {/* 상태 선택 드롭다운 */}
      {mounted && (
        <div className="absolute left-2 top-2 z-20">
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-2xl border-2 border-amber-400/40 bg-white/90 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-[0_4px_14px_rgba(251,191,36,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(251,191,36,0.3)] dark:border-amber-600/40 dark:bg-amber-950/90 dark:text-amber-100"
            >
              <span>
                {PRESENCE_OPTIONS.find((o) => o.value === presence)?.emoji}
              </span>
              <span>{PRESENCE_OPTIONS.find((o) => o.value === presence)?.label}</span>
              <ChevronDown size={14} className="opacity-70" />
            </button>
            {statusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setStatusDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute left-0 top-full z-40 mt-2 min-w-[150px] rounded-2xl border-2 border-amber-300/50 bg-white/98 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-amber-700/50 dark:bg-amber-950/98">
                  {PRESENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handlePresenceChange(opt.value)}
                      className={`flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm transition-all ${
                        presence === opt.value
                          ? "bg-amber-200/60 font-semibold text-amber-900 dark:bg-amber-700/50 dark:text-amber-100"
                          : "text-amber-800 hover:bg-amber-100/80 dark:text-amber-200 dark:hover:bg-amber-800/40"
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setCustomModalOpen(true)}
        className="absolute right-2 top-2 z-20 rounded-2xl border-2 border-amber-400/40 bg-white/90 p-2.5 text-amber-800 shadow-[0_4px_14px_rgba(251,191,36,0.2)] transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(251,191,36,0.3)] dark:border-amber-600/40 dark:bg-amber-900/90 dark:text-amber-200"
        title="캐릭터 커스터마이징"
      >
        <Settings2 size={20} />
      </button>

      <div
        className="relative overflow-hidden rounded-2xl border-2 border-amber-800/50 shadow-xl"
        style={{
          width: COLS * TILE,
          height: ROWS * TILE,
          background: `
            linear-gradient(90deg, rgba(180,160,140,0.35) 1px, transparent 1px),
            linear-gradient(rgba(180,160,140,0.35) 1px, transparent 1px)
          `,
          backgroundSize: `${TILE}px ${TILE}px`,
          backgroundColor: "#c4b5a5",
        }}
      >
        {/* 바닥 구역색 */}
        <div
          className="absolute rounded-2xl border-2 border-sky-300/40"
          style={{
            left: TILE,
            top: TILE,
            width: TILE * 5,
            height: TILE * 6,
            backgroundColor: "rgba(179, 205, 227, 0.5)",
          }}
        />
        <div
          className="absolute rounded-2xl border-2 border-emerald-300/40"
          style={{
            left: TILE * 14,
            top: TILE,
            width: TILE * 5,
            height: TILE * 6,
            backgroundColor: "rgba(167, 215, 183, 0.5)",
          }}
        />
        {/* 공부 구역 */}
        <div
          className="absolute flex items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-white/80 shadow-md"
          style={{
            left: 2 * TILE + 4,
            top: 3 * TILE + 4,
            width: TILE * 2 - 8,
            height: TILE * 2 - 8,
          }}
        >
          <span className="text-2xl drop-shadow-sm">📚</span>
        </div>
        {/* 분수대 */}
        <div
          className="absolute rounded-full border-2 border-stone-400/70 bg-stone-300/50 shadow-inner"
          style={{
            left: 7.5 * TILE,
            top: 4 * TILE,
            width: TILE * 4,
            height: TILE * 4,
          }}
        />
        <div
          className="absolute rounded-full border-2 border-sky-200/70 bg-sky-200/60"
          style={{
            left: 8 * TILE + 10,
            top: 4 * TILE + 10,
            width: TILE * 2.5,
            height: TILE * 2.5,
          }}
        />
        {/* 휴식 구역 */}
        <div
          className="absolute flex items-center justify-center rounded-2xl border-2 border-emerald-400/60 bg-white/70 shadow-md"
          style={{
            left: 15 * TILE + 4,
            top: 3 * TILE + 4,
            width: TILE * 1.5,
            height: TILE * 1.5,
          }}
        >
          <span className="text-xl drop-shadow-sm">🌿</span>
        </div>
        <div
          className="absolute flex items-center justify-center rounded-2xl border-2 border-emerald-400/60 bg-white/70 shadow-md"
          style={{
            left: 17 * TILE,
            top: 4 * TILE + 4,
            width: TILE * 1.5,
            height: TILE * 1.5,
          }}
        >
          <span className="text-xl drop-shadow-sm">🪴</span>
        </div>
        {/* 나무 */}
        {[
          [1, 1], [18, 1], [1, 12], [18, 12],
        ].map(([tx, ty]) => (
          <div
            key={`${tx}-${ty}`}
            className="absolute rounded-2xl border-2 border-emerald-500/50 bg-emerald-600/80 shadow-md"
            style={{
              left: tx * TILE + 6,
              top: ty * TILE + 6,
              width: TILE - 12,
              height: TILE - 12,
            }}
          />
        ))}

        <PlazaCharacter
          x={pos.x}
          y={pos.y}
          direction={direction}
          custom={custom}
          status={presence}
        />
      </div>

      <p className="mt-4 text-center text-sm font-medium text-[var(--muted-foreground)]">
        방향키 또는 WASD로 이동 ✦ 좌측에서 상태 선택 ✦ 우측에서 커스터마이징
      </p>

      <CharacterCustomizationModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        initial={custom}
        onSave={handleSaveCustom}
      />
    </div>

    {mounted && todayStr && (
      <PlazaTimeline dateStr={todayStr} refreshTrigger={timelineRefresh} />
    )}
    </div>
  );
}
