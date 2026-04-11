"use client";
import { useEffect, useRef } from "react";
import { type WaterRating } from "@/lib/water-types";

// ── Utilities ────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Tier: DIVE IN WITH MOUTH OPEN 🏊 ─────────────────────────────────────────
// Tropical fish schooling + light rays + sparkles + rising bubbles

interface SchoolFish { x: number; y: number; vx: number; vy: number; phase: number; size: number; hue: number }
interface Sparkle { x: number; y: number; r: number; opacity: number; life: number }
interface Ray { angle: number; width: number; opacity: number; speed: number }

function drawDiveIn(ctx: CanvasRenderingContext2D, t: number, W: number, H: number,
  fish: SchoolFish[], sparkles: Sparkle[], rays: Ray[]) {

  // Light rays from top
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const ray of rays) {
    ray.angle += ray.speed * 0.0005;
    const grd = ctx.createLinearGradient(
      W / 2 + Math.cos(ray.angle) * W * 0.3, 0,
      W / 2 + Math.cos(ray.angle + 0.3) * W * 0.3, H * 0.7
    );
    grd.addColorStop(0, `rgba(100,230,255,${ray.opacity * 0.08})`);
    grd.addColorStop(1, "rgba(100,230,255,0)");
    ctx.beginPath();
    ctx.moveTo(W / 2 + Math.cos(ray.angle) * W * 0.3, 0);
    ctx.lineTo(W / 2 + Math.cos(ray.angle + ray.width) * W * 0.3 + 80, H * 0.8);
    ctx.lineTo(W / 2 + Math.cos(ray.angle + ray.width + 0.06) * W * 0.3 + 80, H * 0.8);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  // Schooling fish
  for (const f of fish) {
    // Flock loosely toward center
    const cx = W / 2 + Math.cos(t * 0.3 + f.phase) * W * 0.25;
    const cy = H / 2 + Math.sin(t * 0.2 + f.phase * 0.7) * H * 0.2;
    f.vx = lerp(f.vx, (cx - f.x) * 0.004 + Math.sin(t * 0.5 + f.phase) * 0.3, 0.05);
    f.vy = lerp(f.vy, (cy - f.y) * 0.004 + Math.cos(t * 0.4 + f.phase) * 0.3, 0.05);
    f.x += f.vx;
    f.y += f.vy;
    f.phase += 0.02;

    const angle = Math.atan2(f.vy, f.vx);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.82;

    const g = ctx.createLinearGradient(-f.size, 0, f.size, 0);
    g.addColorStop(0, `hsl(${f.hue},85%,45%)`);
    g.addColorStop(0.6, `hsl(${f.hue + 20},90%,60%)`);
    g.addColorStop(1, `hsl(${f.hue - 10},80%,40%)`);

    // tail
    ctx.beginPath();
    ctx.moveTo(-f.size, 0);
    ctx.lineTo(-f.size * 1.6, -f.size * 0.5);
    ctx.lineTo(-f.size * 1.6, f.size * 0.5);
    ctx.closePath();
    ctx.fillStyle = `hsl(${f.hue},70%,35%)`;
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();

    // stripe
    ctx.beginPath();
    ctx.ellipse(0, 0, f.size * 0.35, f.size * 0.45, 0, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fill();

    // eye
    ctx.beginPath();
    ctx.arc(f.size * 0.55, -f.size * 0.1, f.size * 0.15, 0, TAU);
    ctx.fillStyle = "#1e1e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.size * 0.58, -f.size * 0.13, f.size * 0.06, 0, TAU);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
  }

  // Sparkles
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.life -= 0.018;
    s.opacity = s.life;
    if (s.life <= 0) { sparkles.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = s.opacity * 0.8;
    ctx.translate(s.x + Math.sin(t + i) * 3, s.y - (1 - s.life) * 30);
    const rs = s.r * s.life;
    // 4-pointed star
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * TAU - Math.PI / 2;
      const r2 = p % 2 === 0 ? rs : rs * 0.35;
      p === 0 ? ctx.moveTo(Math.cos(a) * r2, Math.sin(a) * r2) : ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    }
    ctx.closePath();
    ctx.fillStyle = `hsl(${180 + Math.sin(t + i * 20) * 40},100%,80%)`;
    ctx.fill();
    ctx.restore();
  }
  if (Math.random() < 0.06) {
    sparkles.push({ x: Math.random() * W, y: Math.random() * H, r: 4 + Math.random() * 5, opacity: 1, life: 1 });
  }
}

// ── Tier: FEET ONLY ZONE 👣 ──────────────────────────────────────────────────
// Jellyfish drifting + tiny crabs scuttling

interface Jellyfish { x: number; y: number; vy: number; phase: number; size: number; hue: number }
interface Crab { x: number; y: number; vx: number; legPhase: number; size: number }

function drawJellyfish(ctx: CanvasRenderingContext2D, j: Jellyfish, t: number) {
  const bob = Math.sin(t * 0.6 + j.phase) * 8;
  const pulse = 0.9 + Math.sin(t * 1.2 + j.phase) * 0.08;
  ctx.save();
  ctx.translate(j.x, j.y + bob);
  ctx.globalAlpha = 0.55;

  // dome
  const dg = ctx.createRadialGradient(0, 0, 0, 0, 0, j.size);
  dg.addColorStop(0, `hsla(${j.hue},80%,80%,0.8)`);
  dg.addColorStop(0.6, `hsla(${j.hue},65%,60%,0.5)`);
  dg.addColorStop(1, `hsla(${j.hue},50%,40%,0.1)`);
  ctx.beginPath();
  ctx.ellipse(0, 0, j.size * pulse, j.size * 0.65 * pulse, 0, Math.PI, TAU);
  ctx.fillStyle = dg;
  ctx.fill();

  // tentacles
  const tentCount = 6;
  for (let i = 0; i < tentCount; i++) {
    const tx = ((i / tentCount) - 0.5) * j.size * 1.6;
    const wag = Math.sin(t * 0.8 + j.phase + i * 0.9) * 12;
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.bezierCurveTo(
      tx + wag, j.size * 0.5,
      tx - wag * 0.5, j.size * 1.1,
      tx + wag * 0.3, j.size * (1.4 + i * 0.1)
    );
    ctx.strokeStyle = `hsla(${j.hue},70%,70%,0.45)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // inner glow rings
  ctx.globalAlpha = 0.25;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.ellipse(0, -j.size * 0.15 * pulse, j.size * 0.5 * (r + 1) / 3, j.size * 0.18 * (r + 1) / 3, 0, 0, TAU);
    ctx.strokeStyle = `hsla(${j.hue},90%,90%,0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCrab(ctx: CanvasRenderingContext2D, crab: Crab, t: number) {
  ctx.save();
  ctx.translate(crab.x, crab.y);
  ctx.globalAlpha = 0.75;
  const s = crab.size;
  const lp = crab.legPhase;

  // legs (4 per side)
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const legAngle = Math.PI * 0.25 + i * 0.18;
    const swing = Math.sin(lp + i * 0.8) * 0.2;
    // right
    ctx.beginPath();
    ctx.moveTo(s * 0.7, -s * 0.1);
    ctx.lineTo(s * 0.7 + Math.cos(legAngle + swing) * s * 1.0, s * 0.2 + Math.sin(legAngle + swing) * s * 0.7);
    ctx.stroke();
    // left
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.1);
    ctx.lineTo(-s * 0.7 - Math.cos(legAngle + swing) * s * 1.0, s * 0.2 + Math.sin(legAngle + swing) * s * 0.7);
    ctx.stroke();
  }
  // claws
  const clawAngle = Math.PI * 0.15 + Math.sin(lp * 0.5) * 0.15;
  [1, -1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * s * 0.7, -s * 0.3);
    ctx.lineTo(side * (s * 0.7 + Math.cos(clawAngle * side) * s * 1.3), -s * 0.3 + Math.sin(clawAngle) * s * 0.8);
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(side * (s * 0.7 + Math.cos(clawAngle * side) * s * 1.3), -s * 0.3 + Math.sin(clawAngle) * s * 0.8, s * 0.28, 0, TAU);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
  });
  // body
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
  bg.addColorStop(0, "#fbbf24");
  bg.addColorStop(1, "#b45309");
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.65, 0, 0, TAU);
  ctx.fillStyle = bg;
  ctx.fill();
  // eyes on stalks
  [0.4, -0.4].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * s * 0.5, -s * 0.6);
    ctx.lineTo(side * s * 0.5, -s);
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(side * s * 0.5, -s, s * 0.18, 0, TAU);
    ctx.fillStyle = "#1e1e2e";
    ctx.fill();
  });
  ctx.restore();
}

// ── Tier: HARD NO 🤢 ─────────────────────────────────────────────────────────
// Bacteria blobs with spikes + murky particles + sludge droplets

interface Bacteria { x: number; y: number; vx: number; vy: number; size: number; phase: number; spikeCount: number; hue: number }
interface MurkyParticle { x: number; y: number; vx: number; vy: number; r: number; life: number; hue: number }

function drawBacteria(ctx: CanvasRenderingContext2D, b: Bacteria, t: number) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(t * 0.15 + b.phase);
  ctx.globalAlpha = 0.7;

  const pulse = b.size * (0.95 + Math.sin(t * 2 + b.phase) * 0.06);

  // Spiky halo
  ctx.beginPath();
  for (let i = 0; i < b.spikeCount; i++) {
    const a = (i / b.spikeCount) * TAU;
    const r1 = pulse * 1.35 + Math.sin(t * 3 + i * 1.2) * pulse * 0.12;
    const r2 = pulse * 0.9;
    const am = a + TAU / (b.spikeCount * 2);
    if (i === 0) ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    else ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(am) * r2, Math.sin(am) * r2);
  }
  ctx.closePath();
  ctx.fillStyle = `hsla(${b.hue},55%,40%,0.35)`;
  ctx.fill();

  // Body
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, pulse);
  bg.addColorStop(0, `hsl(${b.hue},70%,55%)`);
  bg.addColorStop(0.7, `hsl(${b.hue},55%,38%)`);
  bg.addColorStop(1, `hsl(${b.hue},40%,25%)`);
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, TAU);
  ctx.fillStyle = bg;
  ctx.fill();

  // Cell membrane detail
  ctx.beginPath();
  ctx.arc(0, 0, pulse * 0.95, 0, TAU);
  ctx.strokeStyle = `hsla(${b.hue},60%,70%,0.3)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Nucleus
  ctx.beginPath();
  ctx.arc(-pulse * 0.15, pulse * 0.1, pulse * 0.35, 0, TAU);
  ctx.fillStyle = `hsla(${b.hue},45%,22%,0.8)`;
  ctx.fill();

  // Flagellum
  ctx.beginPath();
  ctx.moveTo(pulse, 0);
  for (let x = 0; x <= 30; x += 2) {
    ctx.lineTo(pulse + x, Math.sin((x * 0.4) + t * 3 + b.phase) * (pulse * 0.4));
  }
  ctx.strokeStyle = `hsla(${b.hue},50%,60%,0.5)`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

// ── Tier: BIOHAZARD SPEEDRUN ☢️ ──────────────────────────────────────────────
// Amoeba morphing + bacteria rods + toxic glow + radioactive symbols

interface Amoeba { x: number; y: number; vx: number; vy: number; size: number; phase: number; harmonics: number[] }
interface ToxicParticle { x: number; y: number; vx: number; vy: number; r: number; life: number; angle: number }
interface BacteriaRod { x: number; y: number; vx: number; vy: number; angle: number; length: number; phase: number }

function drawAmoeba(ctx: CanvasRenderingContext2D, a: Amoeba, t: number) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.globalAlpha = 0.65;

  const pts = 60;
  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const angle = (i / pts) * TAU;
    let r = a.size;
    // Multiple harmonics create the morphing amoeba shape
    a.harmonics.forEach((h, hi) => {
      r += Math.sin(angle * (hi + 2) + t * (0.4 + hi * 0.3) + h) * a.size * (0.18 - hi * 0.03);
    });
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();

  const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, a.size * 1.3);
  grd.addColorStop(0, "rgba(74,222,128,0.9)");
  grd.addColorStop(0.4, "rgba(22,163,74,0.7)");
  grd.addColorStop(0.8, "rgba(5,46,22,0.5)");
  grd.addColorStop(1, "rgba(5,46,22,0)");
  ctx.fillStyle = grd;
  ctx.fill();

  // Toxic glow border
  ctx.strokeStyle = "rgba(134,239,172,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vacuoles (internal bubbles)
  for (let i = 0; i < 3; i++) {
    const va = a.phase + i * 2.1 + t * 0.2;
    const vr = a.size * 0.35;
    ctx.beginPath();
    ctx.arc(Math.cos(va) * vr, Math.sin(va) * vr, a.size * 0.14, 0, TAU);
    ctx.fillStyle = "rgba(187,247,208,0.4)";
    ctx.fill();
  }

  // Nucleus
  ctx.beginPath();
  ctx.arc(0, 0, a.size * 0.28, 0, TAU);
  ctx.fillStyle = "rgba(20,83,45,0.85)";
  ctx.fill();
  ctx.strokeStyle = "rgba(134,239,172,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawBacteriaRod(ctx: CanvasRenderingContext2D, rod: BacteriaRod, t: number) {
  ctx.save();
  ctx.translate(rod.x, rod.y);
  ctx.rotate(rod.angle + Math.sin(t * 2 + rod.phase) * 0.15);
  ctx.globalAlpha = 0.7;

  const W = rod.length * 0.32;
  const L = rod.length;

  const rg = ctx.createLinearGradient(-L / 2, 0, L / 2, 0);
  rg.addColorStop(0, "rgba(74,222,128,0.8)");
  rg.addColorStop(0.5, "rgba(134,239,172,0.9)");
  rg.addColorStop(1, "rgba(74,222,128,0.8)");
  ctx.beginPath();
  ctx.roundRect(-L / 2, -W / 2, L, W, W / 2);
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.strokeStyle = "rgba(187,247,208,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Flagella on both ends
  [L / 2, -L / 2].forEach((ex, si) => {
    const dir = si === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(ex, 0);
    for (let xi = 0; xi <= 20; xi += 2) {
      ctx.lineTo(ex + dir * xi * 1.5, Math.sin((xi * 0.6) + t * 4 + rod.phase) * W * 0.8);
    }
    ctx.strokeStyle = "rgba(134,239,172,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  ctx.restore();
}

function drawBioHazardSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, phase: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.08 + phase);
  const opacity = 0.08 + Math.sin(t * 1.5 + phase) * 0.04;
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  // outer circle
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  // 3 arcs + inner circle (simplified biohazard)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.38, a - 0.5, a + Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// ── Tier: SWIM MOUTH CLOSED 🤿 ────────────────────────────────────────────────
// Gentle seaweed swaying + small fish + soft bubbles (reuses school fish lightly)

interface Seaweed { x: number; height: number; segments: number; phase: number; hue: number }

function drawSeaweed(ctx: CanvasRenderingContext2D, sw: Seaweed, t: number, H: number) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  const segH = sw.height / sw.segments;
  ctx.beginPath();
  ctx.moveTo(sw.x, H);
  for (let i = 1; i <= sw.segments; i++) {
    const progress = i / sw.segments;
    const wag = Math.sin(t * 0.6 + sw.phase + progress * 2) * 18 * progress;
    ctx.lineTo(sw.x + wag, H - i * segH);
  }
  ctx.strokeStyle = `hsl(${sw.hue},65%,35%)`;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  rating: WaterRating;
  className?: string;
}

export function RatingCreatures({ rating, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const start = performance.now();

    // ── Initialise per-tier state ─────────────────────────────────────────

    // dive_in
    const schoolFish: SchoolFish[] = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
      phase: Math.random() * TAU, size: 6 + Math.random() * 8,
      hue: [180, 30, 270, 15, 200][i % 5],
    }));
    const sparkles: Sparkle[] = [];
    const rays: Ray[] = Array.from({ length: 5 }, () => ({
      angle: Math.random() * TAU, width: 0.08 + Math.random() * 0.14,
      opacity: 0.4 + Math.random() * 0.4, speed: (Math.random() - 0.5) * 0.3,
    }));

    // swim_mouth_closed seaweed + few fish
    const seaweeds: Seaweed[] = Array.from({ length: 7 }, (_, i) => ({
      x: (W / 8) * i + W / 12, height: 60 + Math.random() * 80,
      segments: 6 + Math.floor(Math.random() * 4),
      phase: Math.random() * TAU, hue: 120 + Math.random() * 40,
    }));
    const swimFish: SchoolFish[] = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * W, y: H * 0.2 + Math.random() * H * 0.5,
      vx: 0.8 + Math.random() * 0.5, vy: 0,
      phase: Math.random() * TAU, size: 5 + Math.random() * 6,
      hue: [195, 210, 185][i % 3],
    }));

    // feet_only
    const jellies: Jellyfish[] = Array.from({ length: 5 }, () => ({
      x: Math.random() * W * 0.8 + W * 0.1,
      y: H * 0.15 + Math.random() * H * 0.5,
      vy: -(0.15 + Math.random() * 0.2),
      phase: Math.random() * TAU, size: 18 + Math.random() * 22,
      hue: 260 + Math.random() * 40,
    }));
    const crabs: Crab[] = Array.from({ length: 4 }, () => ({
      x: Math.random() * W * 0.8 + W * 0.1,
      y: H - 20 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 0.5,
      legPhase: Math.random() * TAU, size: 8 + Math.random() * 8,
    }));

    // nope — bacteria
    const bacteriaList: Bacteria[] = Array.from({ length: 12 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: 8 + Math.random() * 14,
      phase: Math.random() * TAU,
      spikeCount: 6 + Math.floor(Math.random() * 6),
      hue: 70 + Math.floor(Math.random() * 40), // sickly yellow-green
    }));
    const murkyParticles: MurkyParticle[] = [];

    // biohazard
    const amoebas: Amoeba[] = Array.from({ length: 6 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: 20 + Math.random() * 30,
      phase: Math.random() * TAU,
      harmonics: Array.from({ length: 4 }, () => Math.random() * TAU),
    }));
    const bioRods: BacteriaRod[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
      angle: Math.random() * TAU, length: 18 + Math.random() * 20,
      phase: Math.random() * TAU,
    }));
    const toxicParticles: ToxicParticle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * W, y: H + Math.random() * 60,
      vx: (Math.random() - 0.5) * 0.4, vy: -(0.3 + Math.random() * 0.6),
      r: 2 + Math.random() * 4, life: Math.random(),
      angle: Math.random() * TAU,
    }));

    // ── Animation loop ────────────────────────────────────────────────────

    const animate = () => {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, W, H);

      if (rating === "dive_in_mouth_open") {
        drawDiveIn(ctx, t, W, H, schoolFish, sparkles, rays);
      } else if (rating === "swim_mouth_closed") {
        // Seaweed
        seaweeds.forEach((sw) => drawSeaweed(ctx, sw, t, H));
        // Gentle fish
        swimFish.forEach((f) => {
          f.x += f.vx;
          f.vy += Math.sin(t * 0.5 + f.phase) * 0.03;
          f.y += f.vy;
          if (f.x > W + 20) f.x = -20;
          if (f.y < 0 || f.y > H) f.vy *= -1;
          const a = Math.atan2(f.vy, f.vx);
          ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(a); ctx.globalAlpha = 0.65;
          ctx.beginPath(); ctx.ellipse(0, 0, f.size, f.size * 0.4, 0, 0, TAU);
          ctx.fillStyle = `hsl(${f.hue},70%,55%)`; ctx.fill();
          ctx.beginPath(); ctx.moveTo(-f.size, 0); ctx.lineTo(-f.size * 1.5, -f.size * 0.4); ctx.lineTo(-f.size * 1.5, f.size * 0.4); ctx.closePath();
          ctx.fillStyle = `hsl(${f.hue},55%,40%)`; ctx.fill();
          ctx.restore();
        });
      } else if (rating === "feet_only") {
        // Jellyfish
        jellies.forEach((j) => {
          j.y += j.vy * 0.4;
          if (j.y < -j.size * 2) j.y = H + j.size;
          drawJellyfish(ctx, j, t);
        });
        // Crabs
        crabs.forEach((c) => {
          c.x += c.vx;
          if (c.x < 0 || c.x > W) c.vx *= -1;
          c.legPhase += 0.12;
          drawCrab(ctx, c, t);
        });
      } else if (rating === "nope") {
        // Bacteria
        bacteriaList.forEach((b) => {
          b.x += b.vx; b.y += b.vy;
          if (b.x < -b.size) b.x = W + b.size;
          if (b.x > W + b.size) b.x = -b.size;
          if (b.y < -b.size) b.y = H + b.size;
          if (b.y > H + b.size) b.y = -b.size;
          drawBacteria(ctx, b, t);
        });
        // Murky particles
        if (Math.random() < 0.12) {
          murkyParticles.push({ x: Math.random() * W, y: H + 5, vx: (Math.random() - 0.5) * 0.3, vy: -(0.2 + Math.random() * 0.5), r: 2 + Math.random() * 5, life: 1, hue: 80 + Math.random() * 30 });
        }
        for (let i = murkyParticles.length - 1; i >= 0; i--) {
          const p = murkyParticles[i];
          p.y += p.vy; p.x += p.vx; p.life -= 0.008;
          if (p.life <= 0) { murkyParticles.splice(i, 1); continue; }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, TAU);
          ctx.fillStyle = `hsla(${p.hue},40%,30%,${p.life * 0.5})`; ctx.fill();
        }
      } else if (rating === "biohazard_speedrun") {
        // Background toxic glow
        const tgrd = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.8);
        tgrd.addColorStop(0, "rgba(5,46,22,0)");
        tgrd.addColorStop(0.7, "rgba(5,46,22,0)");
        tgrd.addColorStop(1, `rgba(74,222,128,${0.04 + Math.sin(t * 1.2) * 0.02})`);
        ctx.fillStyle = tgrd; ctx.fillRect(0, 0, W, H);

        // Biohazard symbols
        drawBioHazardSymbol(ctx, W * 0.2, H * 0.2, 40, t, 0);
        drawBioHazardSymbol(ctx, W * 0.8, H * 0.6, 55, t, 1.5);
        drawBioHazardSymbol(ctx, W * 0.5, H * 0.8, 30, t, 3);

        // Toxic particles
        toxicParticles.forEach((p) => {
          p.y += p.vy; p.x += p.vx; p.life += p.vy * 0.01;
          if (p.y < -10) { p.y = H + 10; p.life = 0.2 + Math.random() * 0.6; }
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU);
          const gl = `rgba(74,222,128,${p.life * 0.6})`;
          ctx.fillStyle = gl; ctx.fill();
          // glow
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.5, 0, TAU);
          ctx.fillStyle = `rgba(74,222,128,${p.life * 0.12})`; ctx.fill();
        });

        // Bacteria rods
        bioRods.forEach((rod) => {
          rod.x += rod.vx; rod.y += rod.vy;
          if (rod.x < -30) rod.x = W + 30;
          if (rod.x > W + 30) rod.x = -30;
          if (rod.y < -30) rod.y = H + 30;
          if (rod.y > H + 30) rod.y = -30;
          drawBacteriaRod(ctx, rod, t);
        });

        // Amoeba (on top)
        amoebas.forEach((a) => {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -a.size) a.x = W + a.size;
          if (a.x > W + a.size) a.x = -a.size;
          if (a.y < -a.size) a.y = H + a.size;
          if (a.y > H + a.size) a.y = -a.size;
          drawAmoeba(ctx, a, t);
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rating]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    />
  );
}
