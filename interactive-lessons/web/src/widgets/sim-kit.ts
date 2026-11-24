import { useEffect, useRef, useState } from "react";

/**
 * Shared helpers for the tick-based simulators. Every random draw comes from a seeded PRNG keyed by the tick number,
 * so the same settings always replay the same run and the timer only decides when the next tick happens, never what it does.
 */

/** mulberry32: tiny seeded PRNG, returns floats in [0, 1). */
export function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh PRNG for one tick of one simulation, independent of how many ticks ran before. */
export const tickRng = (seed: number, tick: number) => rng(Math.imul(seed ^ 0x9e3779b9, 31) + Math.imul(tick + 1, 2654435761));

/** FNV-1a 32-bit plus murmur3's fmix32 finalizer (plain FNV clusters on look-alike keys such as "S1#3"), unsigned. */
export function fnv1a(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Nearest-rank percentile of an unsorted list; 0 for an empty list. */
export function percentile(xs: number[], p: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))];
}

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Calls onTick every `ms` while `playing`. The callback is read from a ref so it always sees fresh state. */
export function useTicker(playing: boolean, ms: number, onTick: () => void) {
  const cb = useRef(onTick);
  useEffect(() => { cb.current = onTick; });
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => cb.current(), ms);
    return () => clearInterval(id);
  }, [playing, ms]);
}

/** Play state that starts paused when the user asked for reduced motion. */
export function usePlaying() {
  return useState(() => !reducedMotion());
}
