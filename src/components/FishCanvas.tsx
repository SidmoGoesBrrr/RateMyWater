"use client";
import { useEffect, useRef } from "react";

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;         // current facing angle in radians
  targetAngle: number;
  wobble: number;        // tail wobble phase
  scattering: boolean;
  scatterVx: number;
  scatterVy: number;
  scatterLife: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
}

interface Bubble {
  x: number; y: number; r: number; alpha: number; vy: number; life: number;
}

const FISH_COLORS = [
  "96,185,255", "56,200,248", "134,220,180",
  "120,180,255", "80,210,220", "140,230,200",
  "100,200,230", "80,170,255", "70,190,240",
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function angleLerp(a: number, b: number, t: number) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

function drawFish(
  ctx: CanvasRenderingContext2D,
  fish: Fish,
  now: number
) {
  const { x, y, size, color, angle, wobble } = fish;
  const tailWag = Math.sin(wobble) * 0.3;
  const alpha = 0.7;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + tailWag * 0.15);

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.5, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${color},${alpha})`;
  ctx.fill();

  // Tail
  ctx.save();
  ctx.translate(-size * 0.45, 0);
  ctx.rotate(tailWag);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.35, -size * 0.22);
  ctx.lineTo(-size * 0.35, size * 0.22);
  ctx.closePath();
  ctx.fillStyle = `rgba(${color},${alpha * 0.8})`;
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

  // Fin
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.1);
  ctx.lineTo(size * 0.15, -size * 0.32);
  ctx.lineTo(size * 0.3, -size * 0.1);
  ctx.fillStyle = `rgba(${color},${alpha * 0.6})`;
  ctx.fill();

  ctx.restore();
  void now; // suppress unused warning
}

export function FishCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fishRef = useRef<Fish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Spawn 12 fish at random positions
    fishRef.current = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: 18 + Math.random() * 18,
      color: FISH_COLORS[i % FISH_COLORS.length],
      angle: Math.random() * Math.PI * 2,
      targetAngle: 0,
      wobble: Math.random() * Math.PI * 2,
      scattering: false,
      scatterVx: 0,
      scatterVy: 0,
      scatterLife: 0,
      orbitAngle: (i / 12) * Math.PI * 2,
      orbitRadius: 80 + Math.random() * 60,
      orbitSpeed: 0.012 + Math.random() * 0.012,
    }));

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      const mx = e.clientX, my = e.clientY;
      fishRef.current.forEach((fish, i) => {
        fish.scattering = true;
        fish.scatterLife = 80 + Math.random() * 40;
        // Radial burst direction + some orbit offset
        const baseAngle = (i / fishRef.current.length) * Math.PI * 2;
        const speed = 4 + Math.random() * 4;
        fish.scatterVx = Math.cos(baseAngle) * speed;
        fish.scatterVy = Math.sin(baseAngle) * speed;
        // Spawn bubbles at click
        for (let b = 0; b < 3; b++) {
          bubblesRef.current.push({
            x: mx + (Math.random() - 0.5) * 30,
            y: my + (Math.random() - 0.5) * 30,
            r: 3 + Math.random() * 8,
            alpha: 0.6,
            vy: -0.4 - Math.random() * 0.6,
            life: 0,
          });
        }
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      // Update + draw fish
      for (const fish of fishRef.current) {
        fish.wobble += 0.12;

        if (fish.scattering) {
          fish.scatterLife--;
          fish.x += fish.scatterVx;
          fish.y += fish.scatterVy;
          fish.scatterVx *= 0.94;
          fish.scatterVy *= 0.94;
          if (fish.scatterLife <= 0) { fish.scattering = false; }
          fish.targetAngle = Math.atan2(fish.scatterVy, fish.scatterVx);
        } else {
          const dx = mx - fish.x;
          const dy = my - fish.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 250) {
            // Orbit around cursor
            fish.orbitAngle += fish.orbitSpeed;
            const tx = mx + Math.cos(fish.orbitAngle) * fish.orbitRadius;
            const ty = my + Math.sin(fish.orbitAngle) * fish.orbitRadius;
            const odx = tx - fish.x;
            const ody = ty - fish.y;
            fish.vx = lerp(fish.vx, odx * 0.08, 0.15);
            fish.vy = lerp(fish.vy, ody * 0.08, 0.15);
            fish.targetAngle = Math.atan2(ody, odx);
          } else {
            // Drift + gentle pull toward cursor
            fish.vx = lerp(fish.vx, dx * 0.003, 0.04);
            fish.vy = lerp(fish.vy, dy * 0.003, 0.04);
            const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
            if (speed > 0.1) fish.targetAngle = Math.atan2(fish.vy, fish.vx);
          }

          fish.x += fish.vx;
          fish.y += fish.vy;
        }

        // Wrap edges
        if (fish.x < -50) fish.x = canvas.width + 50;
        if (fish.x > canvas.width + 50) fish.x = -50;
        if (fish.y < -50) fish.y = canvas.height + 50;
        if (fish.y > canvas.height + 50) fish.y = -50;

        // Smooth rotation
        fish.angle = angleLerp(fish.angle, fish.targetAngle, 0.08);

        // Occasionally emit a bubble
        if (Math.random() < 0.004) {
          bubblesRef.current.push({
            x: fish.x + (Math.random() - 0.5) * 10,
            y: fish.y - fish.size * 0.2,
            r: 2 + Math.random() * 4,
            alpha: 0.5,
            vy: -0.3 - Math.random() * 0.4,
            life: 0,
          });
        }

        drawFish(ctx, fish, now);
      }

      // Update + draw bubbles
      bubblesRef.current = bubblesRef.current.filter((b) => b.alpha > 0.02);
      for (const b of bubblesRef.current) {
        b.life++;
        b.y += b.vy;
        b.x += Math.sin(b.life * 0.08) * 0.3;
        b.alpha *= 0.975;

        const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.05, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(200,245,255,${b.alpha * 0.4})`);
        grad.addColorStop(1, `rgba(34,211,238,0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(130,220,255,${b.alpha * 0.6})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
