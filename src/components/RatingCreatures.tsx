"use client";
import { useEffect, useRef } from "react";
import { type WaterRating } from "@/lib/water-types";

interface Props {
  rating: WaterRating;
}

// ── dive_in_mouth_open — tropical fish school + light rays + sparkles ─────────
function drawDiveIn(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Light rays from top
  for (let i = 0; i < 6; i++) {
    const x = w * (0.1 + i * 0.16);
    const angle = -0.12 + i * 0.04;
    const alpha = 0.04 + 0.03 * Math.sin(t * 0.8 + i);
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.9);
    grad.addColorStop(0, `rgba(180,240,255,${alpha})`);
    grad.addColorStop(1, "rgba(180,240,255,0)");
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(8, h * 0.9);
    ctx.lineTo(-8, h * 0.9);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // Tropical fish school
  const school = [
    { ox: 0.25, oy: 0.4, phase: 0, color: "255,160,60" },
    { ox: 0.4,  oy: 0.35, phase: 0.8, color: "255,220,50" },
    { ox: 0.55, oy: 0.45, phase: 1.6, color: "60,210,255" },
    { ox: 0.7,  oy: 0.38, phase: 2.4, color: "255,100,120" },
    { ox: 0.35, oy: 0.55, phase: 3.2, color: "120,255,180" },
    { ox: 0.6,  oy: 0.6,  phase: 1.1, color: "220,100,255" },
  ];

  for (const f of school) {
    const fx = w * f.ox + Math.sin(t * 0.9 + f.phase) * 18;
    const fy = h * f.oy + Math.cos(t * 0.6 + f.phase) * 12;
    const sz = 14;
    const flip = Math.sin(t * 0.9 + f.phase) > 0 ? 1 : -1;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(flip, 1);

    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.55, sz * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${f.color},0.85)`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-sz * 0.5, 0);
    ctx.lineTo(-sz * 0.85, -sz * 0.25);
    ctx.lineTo(-sz * 0.85, sz * 0.25);
    ctx.closePath();
    ctx.fillStyle = `rgba(${f.color},0.65)`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sz * 0.28, -sz * 0.07, sz * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fill();
    ctx.restore();
  }

  // Sparkles
  for (let i = 0; i < 12; i++) {
    const sx = w * (0.1 + (i / 12) * 0.8);
    const sy = h * (0.15 + ((i * 137) % 100) / 100 * 0.7);
    const alpha = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.3);
    const r = 1.5 + Math.sin(t * 1.5 + i) * 1;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,240,180,${alpha * 0.7})`;
    ctx.fill();
  }
}

// ── swim_mouth_closed — swaying seaweed + leisurely fish ──────────────────────
function drawSwim(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Seaweed strands
  const strands = [
    { x: 0.1, color: "80,200,120" }, { x: 0.22, color: "60,180,100" },
    { x: 0.55, color: "100,220,140" }, { x: 0.72, color: "70,190,110" },
    { x: 0.88, color: "90,210,130" },
  ];

  for (const s of strands) {
    const bx = w * s.x;
    const segments = 8;
    ctx.beginPath();
    ctx.moveTo(bx, h);
    for (let i = 1; i <= segments; i++) {
      const seg = i / segments;
      const sway = Math.sin(t * 0.7 + s.x * 10 + seg * 2) * 14 * seg;
      ctx.lineTo(bx + sway, h - seg * h * 0.45);
    }
    ctx.strokeStyle = `rgba(${s.color},0.5)`;
    ctx.lineWidth = 3 + Math.sin(t + s.x * 5) * 1;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // 3 leisurely fish
  const fish = [
    { ox: 0.3, oy: 0.35, phase: 0, color: "96,185,255", sz: 20 },
    { ox: 0.6, oy: 0.55, phase: 2, color: "134,220,180", sz: 16 },
    { ox: 0.75, oy: 0.28, phase: 4, color: "120,180,255", sz: 18 },
  ];

  for (const f of fish) {
    const fx = w * f.ox + Math.sin(t * 0.5 + f.phase) * 30;
    const fy = h * f.oy + Math.cos(t * 0.3 + f.phase) * 15;
    const flip = Math.sin(t * 0.5 + f.phase) > 0 ? 1 : -1;
    const tailWag = Math.sin(t * 2 + f.phase) * 0.2;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(flip, 1);

    ctx.beginPath();
    ctx.ellipse(0, 0, f.sz * 0.5, f.sz * 0.25, tailWag * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${f.color},0.75)`;
    ctx.fill();

    ctx.save();
    ctx.translate(-f.sz * 0.45, 0);
    ctx.rotate(tailWag);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-f.sz * 0.35, -f.sz * 0.22);
    ctx.lineTo(-f.sz * 0.35, f.sz * 0.22);
    ctx.closePath();
    ctx.fillStyle = `rgba(${f.color},0.6)`;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(f.sz * 0.25, -f.sz * 0.06, f.sz * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();

    ctx.restore();
  }

  // Gentle bubbles
  for (let i = 0; i < 5; i++) {
    const bx = w * (0.15 + i * 0.18) + Math.sin(t * 0.4 + i) * 8;
    const by = h * (0.7 - ((t * 0.05 + i * 0.2) % 1) * 0.6);
    const r = 3 + i % 3;
    const alpha = 0.25 + 0.15 * Math.sin(t + i);
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(130,220,255,${alpha})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

// ── feet_only — pulsing jellyfish + crabs ─────────────────────────────────────
function drawFeetOnly(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // 3 jellyfish
  const jellies = [
    { x: 0.2, y: 0.35, r: 28, glow: "160,130,255", phase: 0 },
    { x: 0.5, y: 0.25, r: 22, glow: "130,200,255", phase: 2 },
    { x: 0.78, y: 0.4, r: 25, glow: "180,140,255", phase: 4 },
  ];

  for (const j of jellies) {
    const jx = w * j.x + Math.sin(t * 0.3 + j.phase) * 10;
    const jy = h * j.y + Math.cos(t * 0.4 + j.phase) * 14;
    const pulse = 1 + 0.08 * Math.sin(t * 1.2 + j.phase);
    const r = j.r * pulse;

    // Glow
    const grad = ctx.createRadialGradient(jx, jy, 0, jx, jy, r * 2.5);
    grad.addColorStop(0, `rgba(${j.glow},0.25)`);
    grad.addColorStop(1, `rgba(${j.glow},0)`);
    ctx.beginPath();
    ctx.arc(jx, jy, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Dome
    ctx.beginPath();
    ctx.arc(jx, jy, r, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(${j.glow},0.3)`;
    ctx.strokeStyle = `rgba(${j.glow},0.7)`;
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();

    // Tentacles
    for (let ti = 0; ti < 6; ti++) {
      const tx = jx - r + ti * (r * 2 / 5);
      const wag = Math.sin(t * 1.5 + ti * 0.8 + j.phase) * 5;
      ctx.beginPath();
      ctx.moveTo(tx, jy);
      ctx.bezierCurveTo(tx + wag, jy + r * 0.6, tx - wag, jy + r * 1.2, tx + wag * 0.5, jy + r * 1.7);
      ctx.strokeStyle = `rgba(${j.glow},0.45)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // 2 crabs at the bottom
  for (let ci = 0; ci < 2; ci++) {
    const cx = w * (0.25 + ci * 0.5) + Math.sin(t * 0.6 + ci * 3) * 20;
    const cy = h * 0.82 + Math.abs(Math.sin(t * 0.6 + ci * 3)) * 4;

    ctx.save();
    ctx.translate(cx, cy);

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220,80,60,0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,120,100,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Claws
    for (const side of [-1, 1]) {
      const clawAngle = side * (0.6 + 0.2 * Math.sin(t * 1.2 + ci));
      ctx.save();
      ctx.rotate(clawAngle);
      ctx.beginPath();
      ctx.moveTo(side * 14, 0);
      ctx.lineTo(side * 26, -5);
      ctx.lineTo(side * 28, 0);
      ctx.lineTo(side * 26, 5);
      ctx.strokeStyle = "rgba(220,80,60,0.8)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Eyes
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 7, -9, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(side * 7.5, -9.5, 1, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── nope — bacteria blobs with flagella + murky particles ─────────────────────
function drawNope(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Murky overlay
  const murkGrad = ctx.createLinearGradient(0, 0, 0, h);
  murkGrad.addColorStop(0, "rgba(40,30,10,0.15)");
  murkGrad.addColorStop(1, "rgba(60,40,5,0.3)");
  ctx.fillStyle = murkGrad;
  ctx.fillRect(0, 0, w, h);

  // Suspended particles
  for (let i = 0; i < 25; i++) {
    const px = w * ((i * 137 + t * 3) % 100) / 100;
    const py = h * ((i * 73 + t * 2) % 100) / 100;
    const r = 0.8 + (i % 3) * 0.6;
    const alpha = 0.2 + 0.15 * Math.sin(t * 0.8 + i);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,130,60,${alpha})`;
    ctx.fill();
  }

  // Bacteria blobs
  const bacteria = [
    { x: 0.2, y: 0.4, color: "120,200,80", phase: 0 },
    { x: 0.45, y: 0.3, color: "100,180,60", phase: 1.5 },
    { x: 0.65, y: 0.5, color: "140,210,90", phase: 3 },
    { x: 0.35, y: 0.65, color: "110,190,70", phase: 4.5 },
    { x: 0.75, y: 0.35, color: "130,200,85", phase: 2 },
  ];

  for (const b of bacteria) {
    const bx = w * b.x + Math.sin(t * 0.4 + b.phase) * 12;
    const by = h * b.y + Math.cos(t * 0.5 + b.phase) * 10;
    const r = 12 + 3 * Math.sin(t * 0.8 + b.phase);

    // Blob body (irregular)
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.3) {
      const rr = r + 3 * Math.sin(a * 3 + t + b.phase);
      const px2 = bx + Math.cos(a) * rr;
      const py2 = by + Math.sin(a) * rr;
      a === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(${b.color},0.55)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${b.color},0.8)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Flagella
    for (let fi = 0; fi < 2; fi++) {
      const fStartAngle = b.phase + fi * Math.PI;
      const fsx = bx + Math.cos(fStartAngle) * r;
      const fsy = by + Math.sin(fStartAngle) * r;
      ctx.beginPath();
      ctx.moveTo(fsx, fsy);
      for (let s = 1; s <= 8; s++) {
        const ss = s / 8;
        const fx2 = fsx + Math.cos(fStartAngle) * ss * 28 + Math.sin(t * 2 + fi + s) * 6;
        const fy2 = fsy + Math.sin(fStartAngle) * ss * 28 + Math.cos(t * 2 + fi + s) * 6;
        ctx.lineTo(fx2, fy2);
      }
      ctx.strokeStyle = `rgba(${b.color},0.5)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

// ── biohazard_speedrun — morphing amoeba + toxic glow + biohazard symbols ─────
function drawBiohazard(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Pulsing toxic vignette
  const edgeAlpha = 0.25 + 0.1 * Math.sin(t * 1.5);
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(40,100,20,${edgeAlpha})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Floating biohazard symbols (simplified 3-arc)
  const symbols = [
    { x: 0.15, y: 0.25, scale: 0.6, phase: 0 },
    { x: 0.82, y: 0.6, scale: 0.5, phase: 2 },
    { x: 0.5, y: 0.8, scale: 0.45, phase: 4 },
  ];

  for (const sym of symbols) {
    const sx = w * sym.x + Math.sin(t * 0.3 + sym.phase) * 8;
    const sy = h * sym.y + Math.cos(t * 0.4 + sym.phase) * 8;
    const sr = 20 * sym.scale;
    const alpha = 0.3 + 0.15 * Math.sin(t * 1.2 + sym.phase);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.2 + sym.phase);
    // 3 arcs at 120° apart
    for (let ai = 0; ai < 3; ai++) {
      const rot = (ai / 3) * Math.PI * 2;
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, -sr * 0.6, sr * 0.55, Math.PI * 0.2, Math.PI * 0.8);
      ctx.strokeStyle = `rgba(80,220,60,${alpha})`;
      ctx.lineWidth = sr * 0.3;
      ctx.stroke();
      ctx.restore();
    }
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, sr * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,220,60,${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  // Morphing amoeba
  const amoebaX = w * 0.5 + Math.sin(t * 0.3) * w * 0.15;
  const amoebaY = h * 0.45 + Math.cos(t * 0.4) * h * 0.1;
  const amoebaR = 38;

  const amGrad = ctx.createRadialGradient(amoebaX, amoebaY, 0, amoebaX, amoebaY, amoebaR * 1.5);
  amGrad.addColorStop(0, `rgba(60,180,40,0.35)`);
  amGrad.addColorStop(1, `rgba(30,100,20,0)`);
  ctx.fillStyle = amGrad;
  ctx.beginPath();
  ctx.arc(amoebaX, amoebaY, amoebaR * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += 0.2) {
    const rr = amoebaR + 10 * Math.sin(a * 4 + t * 1.2) + 5 * Math.cos(a * 7 + t * 0.8);
    const px = amoebaX + Math.cos(a) * rr;
    const py = amoebaY + Math.sin(a) * rr;
    a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(60,180,40,0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(100,240,70,0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Nucleus
  ctx.beginPath();
  ctx.ellipse(amoebaX + 5, amoebaY - 5, 10, 7, t * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40,120,30,0.7)";
  ctx.fill();

  // Bacteria rods scattered around
  const rods = [
    { x: 0.25, y: 0.3, phase: 0 }, { x: 0.7, y: 0.25, phase: 1.5 },
    { x: 0.3, y: 0.7, phase: 3 }, { x: 0.72, y: 0.68, phase: 4.5 },
  ];

  for (const rod of rods) {
    const rx = w * rod.x + Math.sin(t * 0.5 + rod.phase) * 12;
    const ry = h * rod.y + Math.cos(t * 0.6 + rod.phase) * 10;
    const angle = t * 0.4 + rod.phase;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(80,200,50,0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(120,240,90,0.6)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Rod flagella
    ctx.beginPath();
    ctx.moveTo(14, 0);
    for (let s = 1; s <= 6; s++) {
      ctx.lineTo(14 + s * 4, Math.sin(t * 3 + s) * 5);
    }
    ctx.strokeStyle = "rgba(80,200,50,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // Toxic bubble particles
  for (let i = 0; i < 8; i++) {
    const px = w * ((i * 137 + t * 5) % 100) / 100;
    const py = h * ((i * 73 + t * 4) % 100) / 100;
    const r = 2 + (i % 4);
    const alpha = 0.3 + 0.2 * Math.sin(t * 1.5 + i);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,220,60,${alpha})`;
    ctx.fill();
  }
}

// ── Main component ─────────────────────────────────────────────────────────────
export function RatingCreatures({ rating }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

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

    const draw = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const t = (now - startRef.current) / 1000;
      const { width: w, height: h } = canvas;

      ctx.clearRect(0, 0, w, h);

      switch (rating) {
        case "dive_in_mouth_open":  drawDiveIn(ctx, w, h, t); break;
        case "swim_mouth_closed":   drawSwim(ctx, w, h, t); break;
        case "feet_only":           drawFeetOnly(ctx, w, h, t); break;
        case "nope":                drawNope(ctx, w, h, t); break;
        case "biohazard_speedrun":  drawBiohazard(ctx, w, h, t); break;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [rating]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
