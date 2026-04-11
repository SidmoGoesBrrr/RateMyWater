"use client";
import { useEffect, useRef } from "react";

interface Bubble {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function BubbleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    // Check if mouse is inside the hero section
    const isInHero = () => {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (!hero) return false;
      const rect = hero.getBoundingClientRect();
      const { x, y } = mouseRef.current;
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const spawn = (now: number) => {
      if (!isInHero()) return;
      if (now - lastSpawnRef.current < 80) return; // slower spawn rate
      lastSpawnRef.current = now;
      const size = 4 + Math.random() * 12;
      const maxLife = 110 + Math.random() * 80; // longer life = slower fade
      bubblesRef.current.push({
        x: mouseRef.current.x + (Math.random() - 0.5) * 10,
        y: mouseRef.current.y + (Math.random() - 0.5) * 10,
        size,
        alpha: 0.5 + Math.random() * 0.25,
        vx: (Math.random() - 0.5) * 0.5,  // slower horizontal drift
        vy: -0.25 - Math.random() * 0.55,  // slower upward float
        life: 0,
        maxLife,
      });
    };

    const drawCursor = () => {
      const { x, y } = mouseRef.current;
      if (x < 0 || y < 0) return;
      const r = 11;

      // Bubble fill
      const grad = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.3, r * 0.05,
        x, y, r
      );
      grad.addColorStop(0, "rgba(200, 245, 255, 0.45)");
      grad.addColorStop(0.55, "rgba(34, 211, 238, 0.18)");
      grad.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Rim
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(130, 220, 255, 0.85)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Glint
      ctx.beginPath();
      ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fill();
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      spawn(now);

      bubblesRef.current = bubblesRef.current.filter((b) => b.life < b.maxLife);

      for (const b of bubblesRef.current) {
        b.life++;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.995; // less deceleration = stays drifting longer
        b.vy *= 0.995;
        const t = b.life / b.maxLife;
        const alpha = b.alpha * (1 - t);
        const r = b.size * (0.7 + 0.3 * t);

        const grad = ctx.createRadialGradient(
          b.x - r * 0.3, b.y - r * 0.3, r * 0.05,
          b.x, b.y, r
        );
        grad.addColorStop(0, `rgba(180, 240, 255, ${alpha * 0.35})`);
        grad.addColorStop(0.6, `rgba(34, 211, 238, ${alpha * 0.12})`);
        grad.addColorStop(1, `rgba(34, 211, 238, 0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(130, 220, 255, ${alpha * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(b.x - r * 0.3, b.y - r * 0.3, r * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.65})`;
        ctx.fill();
      }

      drawCursor();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-9999"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
