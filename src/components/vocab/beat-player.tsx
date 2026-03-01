"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const BPM = 87;
const STEP_TIME = 60 / BPM / 4; // 16th note duration

// 16-step patterns (trap style)
const KICK   = [1,0,0,0, 0,0,0,1, 1,0,0,0, 0,0,0,0];
const SNARE  = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
const HIHAT  = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];
const HIHAT_O= [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0];

function playKick(ctx: AudioContext, t: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(0.001, t + 0.4);
  gain.gain.setValueAtTime(1.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.4);
}

function playSnare(ctx: AudioContext, t: number) {
  const size = Math.floor(ctx.sampleRate * 0.13);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2800;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
}

function playHihat(ctx: AudioContext, t: number, open: boolean) {
  const dur = open ? 0.14 : 0.04;
  const size = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 9000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(open ? 0.22 : 0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
}

interface BeatPlayerProps {
  onBeatChange?: (step: number) => void;
  words?: { word: string; meaning: string }[];
}

export function BeatPlayer({ onBeatChange, words }: BeatPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const playingRef = useRef(false);

  const schedule = useCallback((ctx: AudioContext) => {
    const lookahead = 0.12;
    while (nextTimeRef.current < ctx.currentTime + lookahead) {
      const step = stepRef.current % 16;
      const t = nextTimeRef.current;
      if (KICK[step])    playKick(ctx, t);
      if (SNARE[step])   playSnare(ctx, t);
      if (HIHAT[step])   playHihat(ctx, t, false);
      if (HIHAT_O[step]) playHihat(ctx, t, true);
      const s = step;
      setTimeout(() => {
        if (playingRef.current) setCurrentStep(s);
        onBeatChange?.(s);
      }, Math.max(0, (t - ctx.currentTime) * 1000));
      nextTimeRef.current += STEP_TIME;
      stepRef.current++;
    }
    timerRef.current = setTimeout(() => schedule(ctx), 25);
  }, [onBeatChange]);

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx() as AudioContext;
    ctxRef.current = ctx;
    nextTimeRef.current = ctx.currentTime + 0.05;
    stepRef.current = 0;
    playingRef.current = true;
    setPlaying(true);
    schedule(ctx);
  }, [schedule]);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    ctxRef.current?.close();
    ctxRef.current = null;
    setPlaying(false);
    setCurrentStep(-1);
  }, []);

  // Speech synthesis: read English then Korean for each word
  useEffect(() => {
    if (!playing || !words || words.length === 0) {
      window.speechSynthesis?.cancel();
      return;
    }

    let idx = 0;
    let cancelled = false;

    const speakPair = () => {
      if (cancelled || !playingRef.current) return;
      const { word, meaning } = words[idx % words.length];

      const uttEn = new SpeechSynthesisUtterance(word);
      uttEn.lang = "en-US";
      uttEn.rate = 1.5;

      const uttKo = new SpeechSynthesisUtterance(meaning);
      uttKo.lang = "ko-KR";
      uttKo.rate = 1.5;
      uttKo.onend = () => {
        if (cancelled || !playingRef.current) return;
        idx++;
        setTimeout(speakPair, 500);
      };

      window.speechSynthesis.speak(uttEn);
      window.speechSynthesis.speak(uttKo);
    };

    setTimeout(speakPair, 400);

    return () => {
      cancelled = true;
      window.speechSynthesis?.cancel();
    };
  }, [playing, words]);

  useEffect(() => () => { stop(); }, [stop]);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={playing ? stop : start}
        className={cn(
          "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors",
          playing
            ? "bg-rose-500 text-white hover:bg-rose-600"
            : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
        )}
      >
        {playing ? <Square size={14} /> : <Play size={14} fill="currentColor" />}
        {playing ? "정지" : "비트 재생"}
      </button>

      {/* Visualizer bars */}
      <div className="flex items-end gap-[3px] h-6">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-sm transition-all duration-75",
              playing && i === currentStep
                ? "bg-[var(--accent)] h-6"
                : playing && KICK[i]
                ? "bg-[var(--accent)]/60 h-4"
                : playing && SNARE[i]
                ? "bg-[var(--accent)]/40 h-3"
                : "bg-[var(--border)] h-1.5"
            )}
          />
        ))}
      </div>

      {playing && (
        <span className="text-xs text-[var(--muted)]">{BPM} BPM</span>
      )}
    </div>
  );
}
