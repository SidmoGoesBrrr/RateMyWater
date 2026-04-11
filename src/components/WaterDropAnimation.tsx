"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// woo we
interface Drop {
  x: number;
  y: number;
  vy: number;
  radius: number;
  landed: boolean;
  landY: number;
  rings: { r: number; opacity: number; maxR: number }[];
  splashParticles: { x: number; y: number; vx: number; vy: number; opacity: number; r: number }[];
}

export function WaterDropAnimation({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [fading, setFading] = useState(false);
  const dropsRef = useRef<Drop[]>([]);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    // Create initial drops
    const createDrop = (delay: number): Drop => ({
      x: Math.random() * W * 0.8 + W * 0.1,
      y: -20 - delay * 180,
      vy: 4 + Math.random() * 3,
      radius: 6 + Math.random() * 8,
      landed: false,
      landY: H * (0.35 + Math.random() * 0.35),
      rings: [],
      splashParticles: [],
    });

    dropsRef.current = Array.from({ length: 12 }, (_, i) => createDrop(i));
    startTimeRef.current = performance.now();

    const DURATION = 3200; // ms before fade starts

    const draw = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#060d1f");
      skyGrad.addColorStop(1, "#0a1628");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      let allLanded = true;

      for (const drop of dropsRef.current) {
        if (!drop.landed) {
          allLanded = false;
          drop.y += drop.vy;
          drop.vy += 0.18; // gravity

          if (drop.y >= drop.landY) {
            drop.landed = true;
            drop.y = drop.landY;

            // Add expanding rings
            drop.rings.push({ r: drop.radius, opacity: 0.9, maxR: drop.radius * 10 + 40 });
            drop.rings.push({ r: drop.radius * 0.6, opacity: 0.6, maxR: drop.radius * 7 + 25 });

            // Splash particles
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2;
              const speed = 2 + Math.random() * 3;
              drop.splashParticles.push({
                x: drop.x, y: drop.y,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle)) * (2 + Math.random() * 3) - 1,
                opacity: 0.8,
                r: 1.5 + Math.random() * 2,
              });
            }
          }

          // Draw teardrop shape
          if (drop.y < drop.landY) {
            ctx.save();
            ctx.translate(drop.x, drop.y);

            const dropGrad = ctx.createRadialGradient(0, 0, 0, 0, drop.radius * 0.5, drop.radius * 2);
            dropGrad.addColorStop(0, "rgba(147, 231, 252, 0.95)");
            dropGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.85)");
            dropGrad.addColorStop(1, "rgba(6, 182, 212, 0.6)");

            ctx.beginPath();
            ctx.moveTo(0, -drop.radius * 2.2);
            ctx.bezierCurveTo(
              drop.radius * 1.1, -drop.radius * 0.8,
              drop.radius * 1.3, drop.radius * 0.5,
              0, drop.radius * 1.2
            );
            ctx.bezierCurveTo(
              -drop.radius * 1.3, drop.radius * 0.5,
              -drop.radius * 1.1, -drop.radius * 0.8,
              0, -drop.radius * 2.2
            );
            ctx.fillStyle = dropGrad;
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.ellipse(-drop.radius * 0.3, -drop.radius * 0.8, drop.radius * 0.3, drop.radius * 0.5, -0.4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fill();
            ctx.restore();
          }
        }

        // Draw rings
        drop.rings = drop.rings.filter((ring) => ring.opacity > 0.01);
        for (const ring of drop.rings) {
          ring.r += (ring.maxR - ring.r) * 0.04 + 0.8;
          ring.opacity -= 0.012;

          ctx.beginPath();
          ctx.ellipse(drop.x, drop.landY, ring.r, ring.r * 0.35, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, ring.opacity)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Splash particles
        drop.splashParticles = drop.splashParticles.filter((p) => p.opacity > 0.01);
        for (const p of drop.splashParticles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.opacity -= 0.03;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(125, 231, 252, ${Math.max(0, p.opacity)})`;
          ctx.fill();
        }
      }

      // Water surface shimmer at bottom
      const shimmerGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
      shimmerGrad.addColorStop(0, "rgba(6, 182, 212, 0)");
      shimmerGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.04)");
      shimmerGrad.addColorStop(1, "rgba(6, 182, 212, 0.08)");
      ctx.fillStyle = shimmerGrad;
      ctx.fillRect(0, H * 0.7, W, H * 0.3);

      if (elapsed > DURATION && !completedRef.current) {
        completedRef.current = true;
        setFading(true);
        setTimeout(() => onComplete(), 900);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="water-drop-overlay"
        className="fixed inset-0 z-[100]"
        animate={{ opacity: fading ? 0 : 1 }}
        transition={{ duration: 0.85, ease: "easeInOut" }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Animated title in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: fading ? 0 : 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              className="text-7xl mb-3"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              💧
            </motion.div>
            <h1 className="text-5xl font-black text-white tracking-tight">
              Rate<span className="text-cyan-400">My</span>Water
            </h1>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
