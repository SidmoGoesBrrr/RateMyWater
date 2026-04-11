"use client";
import { useEffect, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIdx: number;
  tailPhase: number;       // current tail-wag phase
  tailSpeed: number;
  // scatter state
  scatterVx: number;       // added scatter impulse
  scatterVy: number;
  orbitVx: number;         // tangential orbit component
  orbitVy: number;
  scatterT: number;        // countdown (seconds)
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

// ── Palette ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { body: "#22d3ee", fin: "#0891b2", stripe: "#a5f3fc" },
  { body: "#34d399", fin: "#059669", stripe: "#6ee7b7" },
  { body: "#fbbf24", fin: "#d97706", stripe: "#fde68a" },
  { body: "#a78bfa", fin: "#7c3aed", stripe: "#ddd6fe" },
  { body: "#fb7185", fin: "#e11d48", stripe: "#fecdd3" },
  { body: "#38bdf8", fin: "#0284c7", stripe: "#bae6fd" },
];

// ── Drawing helpers ──────────────────────────────────────────────────────────

function drawFish(
  ctx: CanvasRenderingContext2D,
  fish: Fish,
  p: (typeof PALETTES)[0],
  time: number
) {
  const angle = Math.atan2(fish.vy, fish.vx);
  const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
  const wagAmp = Math.min(0.4, speed * 0.04);
  const tailWag = Math.sin(fish.tailPhase) * wagAmp;
  const s = fish.size;

  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.88;

  // ── Tail ────────────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(-s * 1.0, 0);
  ctx.rotate(tailWag * 1.4);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-s * 0.9, -s * 0.55);
  ctx.lineTo(-s * 0.9, s * 0.55);
  ctx.closePath();
  ctx.fillStyle = p.fin;
  ctx.fill();
  ctx.restore();

  // ── Body ────────────────────────────────────────────────────────────────
  const bodyGrad = ctx.createRadialGradient(-s * 0.1, -s * 0.15, s * 0.05, 0, 0, s * 1.1);
  bodyGrad.addColorStop(0, p.stripe);
  bodyGrad.addColorStop(0.5, p.body);
  bodyGrad.addColorStop(1, p.fin);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 1.15, s * 0.58, 0, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // ── Dorsal fin ──────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.55);
  ctx.quadraticCurveTo(s * 0.25, -s * 1.0, s * 0.55, -s * 0.55);
  ctx.closePath();
  ctx.fillStyle = p.fin;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 0.88;

  // ── Pectoral fin ────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(s * 0.1, s * 0.3);
  ctx.rotate(Math.sin(fish.tailPhase * 0.8) * 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.5, s * 0.22, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = p.fin;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 0.88;

  // ── Eye ─────────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(s * 0.65, -s * 0.1, s * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  // pupil glint
  ctx.beginPath();
  ctx.arc(s * 0.7, -s * 0.14, s * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();

  // ── Scales (3 subtle arcs) ───────────────────────────────────────────────
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 3; i++) {
    const sx = -s * 0.2 + i * s * 0.4;
    ctx.beginPath();
    ctx.arc(sx, 0, s * 0.32, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.strokeStyle = p.stripe;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, b: Bubble) {
  const x = b.x + Math.sin(b.wobble) * 4;
  ctx.save();
  ctx.globalAlpha = b.opacity;
  ctx.beginPath();
  ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(147, 231, 252, 0.7)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // shimmer
  ctx.beginPath();
  ctx.arc(x - b.r * 0.35, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();
  ctx.restore();
}

// ── Main component ────────────────────────────────────────────────────────────

export function FishCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fishRef = useRef<Fish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const cursorRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ── spawn fish ────────────────────────────────────────────────────────────
  const spawnFish = useCallback((W: number, H: number) => {
    const count = Math.min(14, Math.floor((W * H) / 55000) + 6);
    fishRef.current = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: 10 + Math.random() * 10,
      colorIdx: i % PALETTES.length,
      tailPhase: Math.random() * Math.PI * 2,
      tailSpeed: 2.5 + Math.random() * 2,
      scatterVx: 0, scatterVy: 0,
      orbitVx: 0, orbitVy: 0,
      scatterT: 0,
    }));
  }, []);

  // ── scatter on click ──────────────────────────────────────────────────────
  const scatter = useCallback((cx: number, cy: number) => {
    // spawn click bubble burst
    for (let i = 0; i < 6; i++) {
      bubblesRef.current.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 20,
        r: 4 + Math.random() * 8,
        vy: -(0.8 + Math.random() * 1.5),
        opacity: 0.9,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.06 + Math.random() * 0.06,
      });
    }

    fishRef.current.forEach((fish) => {
      const dx = fish.x - cx;
      const dy = fish.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Radial push
      const pushStr = Math.max(0, 1 - dist / 400) * 6;
      const nx = dx / dist;
      const ny = dy / dist;

      // Tangential orbit component (perpendicular, random sign per fish)
      const sign = Math.random() > 0.5 ? 1 : -1;
      const tanStr = pushStr * (0.8 + Math.random() * 0.8);

      fish.scatterVx = nx * pushStr + (-ny * sign) * tanStr;
      fish.scatterVy = ny * pushStr + (nx * sign) * tanStr;
      fish.orbitVx = (-ny * sign) * 1.5;
      fish.orbitVy = (nx * sign) * 1.5;
      fish.scatterT = 2.5 + Math.random() * 1.5; // seconds to decay
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (fishRef.current.length === 0) {
        spawnFish(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    const onClick = (e: MouseEvent) => scatter(e.clientX, e.clientY);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);

    const ctx = canvas.getContext("2d")!;

    const tick = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cursor = cursorRef.current;

      // ── Update + draw fish ──────────────────────────────────────────────
      for (const fish of fishRef.current) {
        const p = PALETTES[fish.colorIdx];

        // Cursor attraction
        const cdx = cursor.x - fish.x;
        const cdy = cursor.y - fish.y;
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
        const attractRadius = 250;
        const attractStr = cdist < attractRadius
          ? (1 - cdist / attractRadius) * 2.2 * dt
          : 0;

        // Wander force (slow oscillation per fish)
        const wanderAngle = timestamp * 0.0005 + fish.colorIdx * 1.2;
        const wanderStr = 0.6 * dt;

        // Scatter decay
        let sx = 0, sy = 0;
        if (fish.scatterT > 0) {
          fish.scatterT = Math.max(0, fish.scatterT - dt);
          const decay = fish.scatterT / 3.5;
          sx = (fish.scatterVx + fish.orbitVx) * decay * 6 * dt;
          sy = (fish.scatterVy + fish.orbitVy) * decay * 6 * dt;
          // Spin scatter vector (orbit)
          const spinSpeed = 2.5 * dt;
          const ox = fish.orbitVx;
          const oy = fish.orbitVy;
          fish.orbitVx = ox * Math.cos(spinSpeed) - oy * Math.sin(spinSpeed);
          fish.orbitVy = ox * Math.sin(spinSpeed) + oy * Math.cos(spinSpeed);
        }

        // Integrate velocity
        fish.vx += (cdx / cdist) * attractStr;
        fish.vy += (cdy / cdist) * attractStr;
        fish.vx += Math.cos(wanderAngle) * wanderStr;
        fish.vy += Math.sin(wanderAngle) * wanderStr;
        fish.vx += sx;
        fish.vy += sy;

        // Speed clamp
        const maxSpeed = fish.scatterT > 0 ? 8 : 3;
        const spd = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        if (spd > maxSpeed) {
          fish.vx = (fish.vx / spd) * maxSpeed;
          fish.vy = (fish.vy / spd) * maxSpeed;
        }
        if (spd < 0.3 && fish.scatterT === 0) {
          // nudge if too slow
          fish.vx += (Math.random() - 0.5) * 0.4;
          fish.vy += (Math.random() - 0.5) * 0.4;
        }

        // Drag
        fish.vx *= 0.985;
        fish.vy *= 0.985;

        // Wrap around edges with soft margin
        const margin = 60;
        if (fish.x < -margin) fish.x = W + margin;
        if (fish.x > W + margin) fish.x = -margin;
        if (fish.y < -margin) fish.y = H + margin;
        if (fish.y > H + margin) fish.y = -margin;

        fish.x += fish.vx;
        fish.y += fish.vy;

        fish.tailPhase += fish.tailSpeed * dt;

        // Occasionally emit a bubble
        if (Math.random() < 0.003) {
          bubblesRef.current.push({
            x: fish.x,
            y: fish.y - fish.size,
            r: 2 + Math.random() * 3,
            vy: -(0.5 + Math.random()),
            opacity: 0.7,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.05 + Math.random() * 0.04,
          });
        }

        drawFish(ctx, fish, p, timestamp * 0.001);
      }

      // ── Update + draw bubbles ───────────────────────────────────────────
      bubblesRef.current = bubblesRef.current.filter((b) => b.opacity > 0.02);
      for (const b of bubblesRef.current) {
        b.y += b.vy;
        b.wobble += b.wobbleSpeed;
        b.opacity -= 0.006;
        b.r = Math.max(0, b.r - 0.01);
        drawBubble(ctx, b);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
    };
  }, [spawnFish, scatter]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 30 }}
      aria-hidden
    />
  );
}
