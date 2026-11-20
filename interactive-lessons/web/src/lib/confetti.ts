/** One-shot confetti burst on a throwaway canvas (no dependency). Skipped when the user prefers reduced motion. */
const COLORS = ["#4f8cf7", "#4cc26b", "#e8b339", "#f0605d", "#a78bfa", "#6aa8ff"];

type Power = "small" | "big";
type Bit = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; c: string; life: number };

export function celebrate(power: Power = "small", origin?: { x: number; y: number }) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.className = "confetti";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const n = power === "big" ? 170 : 60;
  const ox = origin?.x ?? W / 2, oy = origin?.y ?? (power === "big" ? H * 0.35 : H * 0.6);
  const bits: Bit[] = Array.from({ length: n }, (_, i) => {
    const a = (power === "big" ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 1.6);
    const sp = (power === "big" ? 7 : 6) + Math.random() * (power === "big" ? 9 : 5);
    return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (power === "big" ? 3 : 2), w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[i % COLORS.length], life: 1 };
  });

  const start = performance.now();
  const dur = power === "big" ? 2600 : 1600;
  const frame = (t: number) => {
    const k = (t - start) / dur;
    ctx.clearRect(0, 0, W, H);
    for (const b of bits) {
      b.vx *= 0.985; b.vy = b.vy * 0.985 + 0.32; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.6) / 0.4);
      ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)));
      ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Burst from the centre of an element (e.g. the quiz that was just answered). */
export function celebrateAt(el: Element | null, power: Power = "small") {
  if (!el) return celebrate(power);
  const r = el.getBoundingClientRect();
  celebrate(power, { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 120) });
}
