"use client";
import { useEffect, useRef } from "react";

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  wobble: number;
  // rush-to-cursor state
  rushing: boolean;
  rushLife: number;
}

interface Bubble {
  x: number; y: number; r: number; alpha: number; vy: number; life: number;
}

interface Ripple {
  x: number; y: number; r: number; maxR: number; alpha: number;
}

const FISH_COLORS = [
  "96,185,255", "56,200,248", "134,220,180",
  "120,180,255", "80,210,220", "140,230,200",
];

const COUNT = 6;

function angleLerp(a: number, b: number, t: number) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

function drawFish(ctx: CanvasRenderingContext2D, fish: Fish) {
  const { x, y, size, color, angle, wobble } = fish;
  const tailWag = Math.sin(wobble) * 0.28;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + tailWag * 0.12);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.5, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${color},0.72)`;
  ctx.fill();

  // Tail
  ctx.save();
  ctx.translate(-size * 0.45, 0);
  ctx.rotate(tailWag);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.33, -size * 0.21);
  ctx.lineTo(-size * 0.33, size * 0.21);
  ctx.closePath();
  ctx.fillStyle = `rgba(${color},0.55)`;
  ctx.fill();
  ctx.restore();

  // Eye
  ctx.beginPath();
  ctx.arc(size * 0.25, -size * 0.06, size * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.27, -size * 0.06, size * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = "#0c2d5e";
  ctx.fill();

  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.1);
  ctx.lineTo(size * 0.14, -size * 0.3);
  ctx.lineTo(size * 0.28, -size * 0.1);
  ctx.fillStyle = `rgba(${color},0.5)`;
  ctx.fill();

  ctx.restore();
}

export function FishCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fishRef = useRef<Fish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Spawn fish inside the canvas bounds
    fishRef.current = Array.from({ length: COUNT }, (_, i) => ({
      x: 80 + Math.random() * (canvas.width - 160),
      y: 60 + Math.random() * (canvas.height - 120),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: 20 + Math.random() * 16,
      color: FISH_COLORS[i % FISH_COLORS.length],
      angle: Math.random() * Math.PI * 2,
      wobble: Math.random() * Math.PI * 2,
      rushing: false,
      rushLife: 0,
    }));

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Ripple at click point (even if outside — just clip visually)
      ripplesRef.current.push({ x: mx, y: my, r: 0, maxR: 80, alpha: 0.6 });

      // All fish rush toward click point
      for (const fish of fishRef.current) {
        fish.rushing = true;
        fish.rushLife = 90 + Math.random() * 30;
      }

      // Bubbles at click
      for (let b = 0; b < 5; b++) {
        bubblesRef.current.push({
          x: mx + (Math.random() - 0.5) * 24,
          y: my + (Math.random() - 0.5) * 24,
          r: 3 + Math.random() * 7,
          alpha: 0.55,
          vy: -0.35 - Math.random() * 0.5,
          life: 0,
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    const draw = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);

      const { x: mx, y: my } = mouseRef.current;

      // ── Separation pass (boids rule 1) ──
      // For each pair of fish, if they're within (sumRadius * SEPARATION_RADIUS),
      // push them apart along the line between their centers. Force falls off
      // linearly with distance so distant pairs barely feel each other. This
      // happens BEFORE the per-fish wander/rush step, so the accumulated
      // `sep` nudges get mixed into the same frame's velocity update below.
      //
      // Complexity is O(n²) — fine at COUNT=6. If you bump the count past
      // ~50 you'd want to spatial-hash this.
      const SEPARATION_RADIUS = 1.6; // multiplier on (fish.size + other.size)
      const SEPARATION_STRENGTH = 0.35;
      const seps = fishRef.current.map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < fishRef.current.length; i++) {
        for (let j = i + 1; j < fishRef.current.length; j++) {
          const a = fishRef.current[i];
          const b = fishRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          const minDist = (a.size + b.size) * 0.5 * SEPARATION_RADIUS;
          if (distSq > minDist * minDist || distSq === 0) continue;
          const dist = Math.sqrt(distSq);
          // Normalize and scale so closer = stronger push (1 at contact, 0 at minDist).
          const falloff = 1 - dist / minDist;
          const push = (SEPARATION_STRENGTH * falloff) / dist;
          seps[i].x += dx * push;
          seps[i].y += dy * push;
          seps[j].x -= dx * push;
          seps[j].y -= dy * push;
        }
      }

      // ── Fish ──
      for (let i = 0; i < fishRef.current.length; i++) {
        const fish = fishRef.current[i];
        fish.wobble += 0.1;

        // Apply separation first so it's felt on every branch (rush + wander).
        fish.vx += seps[i].x;
        fish.vy += seps[i].y;

        if (fish.rushing) {
          fish.rushLife--;
          // Steer toward mouse position
          const dx = mx - fish.x;
          const dy = my - fish.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 8) {
            fish.vx += (dx / dist) * 0.5;
            fish.vy += (dy / dist) * 0.5;
          }
          // Speed cap while rushing
          const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
          if (speed > 4) { fish.vx = (fish.vx / speed) * 4; fish.vy = (fish.vy / speed) * 4; }
          if (fish.rushLife <= 0 || dist < 15) { fish.rushing = false; }
        } else {
          // Independent wandering. Two forces at play here:
          //
          //   1. Random nudge — ±0.15 per axis, large enough to actually
          //      rotate a fish that was already moving at max speed. The
          //      previous value (0.06) was so small relative to maxSpeed
          //      (1.4) that a fish which picked up speed from an edge
          //      bounce would glide in a near-straight line for a full
          //      second before the nudges could turn it.
          //
          //   2. Drag — vx *= 0.985 per frame. Without drag, velocity is
          //      conserved forever, so edge bounces leave lasting momentum
          //      and fish favor whatever direction they were already going.
          //      Light drag pulls them toward stillness, letting the nudge
          //      dominate and produce real wandering.
          fish.vx += (Math.random() - 0.5) * 0.3;
          fish.vy += (Math.random() - 0.5) * 0.3;
          fish.vx *= 0.985;
          fish.vy *= 0.985;

          // Soft speed cap
          const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
          const maxSpeed = 1.4;
          if (speed > maxSpeed) { fish.vx = (fish.vx / speed) * maxSpeed; fish.vy = (fish.vy / speed) * maxSpeed; }
        }

        // Bounce off canvas edges (with margin = fish size)
        const margin = fish.size;
        if (fish.x < margin) { fish.vx += 0.3; }
        if (fish.x > W - margin) { fish.vx -= 0.3; }
        if (fish.y < margin) { fish.vy += 0.3; }
        if (fish.y > H - margin) { fish.vy -= 0.3; }

        fish.x += fish.vx;
        fish.y += fish.vy;

        // Clamp hard to canvas bounds
        fish.x = Math.max(margin, Math.min(W - margin, fish.x));
        fish.y = Math.max(margin, Math.min(H - margin, fish.y));

        // Smooth rotation toward velocity direction
        const speed2 = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
        if (speed2 > 0.15) {
          fish.angle = angleLerp(fish.angle, Math.atan2(fish.vy, fish.vx), 0.1);
        }

        // Occasional bubble
        if (Math.random() < 0.003) {
          bubblesRef.current.push({
            x: fish.x + (Math.random() - 0.5) * 8,
            y: fish.y - fish.size * 0.25,
            r: 1.5 + Math.random() * 3,
            alpha: 0.45,
            vy: -0.25 - Math.random() * 0.35,
            life: 0,
          });
        }

        drawFish(ctx, fish);
      }

      // ── Ripples ──
      ripplesRef.current = ripplesRef.current.filter((rp) => rp.alpha > 0.01);
      for (const rp of ripplesRef.current) {
        rp.r += (rp.maxR - rp.r) * 0.07;
        rp.alpha *= 0.92;
        for (let ring = 0; ring < 3; ring++) {
          const ringR = rp.r * (0.5 + ring * 0.3);
          const ringAlpha = rp.alpha * (1 - ring * 0.28);
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(130,220,255,${ringAlpha})`;
          ctx.lineWidth = 1.2 - ring * 0.3;
          ctx.stroke();
        }
      }

      // ── Bubbles ──
      bubblesRef.current = bubblesRef.current.filter((b) => b.alpha > 0.02);
      for (const b of bubblesRef.current) {
        b.life++;
        b.y += b.vy;
        b.x += Math.sin(b.life * 0.09) * 0.25;
        b.alpha *= 0.977;

        const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.05, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(200,245,255,${b.alpha * 0.38})`);
        grad.addColorStop(1, `rgba(34,211,238,0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(130,220,255,${b.alpha * 0.55})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen", zIndex: 5 }}
    />
  );
}
