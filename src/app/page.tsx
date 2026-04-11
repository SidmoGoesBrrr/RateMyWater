"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { WaterDropAnimation } from "@/components/WaterDropAnimation";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { cn } from "@/lib/utils";

interface FeedEntry {
  _id: string;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  uploadedBy: string;
  createdAt: string;
  coordinates?: { lat: number; lng: number };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getScoreColor(score: number) {
  if (score >= 4.5) return "#38bdf8";
  if (score >= 3.5) return "#34d399";
  if (score >= 2.5) return "#fbbf24";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
}

function AnimatedWaterDrop() {
  return (
    <div className="relative inline-block">
      <style>{`
        @keyframes drop-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes drop-fill  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>
      <svg
        width="76"
        height="100"
        viewBox="0 0 76 100"
        fill="none"
        style={{ animation: "drop-float 3.2s ease-in-out infinite" }}
      >
        <defs>
          <clipPath id="drop-mask">
            <path d="M38 5 C38 5 9 38 9 60 A29 29 0 0 0 67 60 C67 38 38 5 38 5 Z" />
          </clipPath>
          <linearGradient id="drop-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.55" />
          </linearGradient>
          <filter id="drop-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background fill */}
        <path
          d="M38 5 C38 5 9 38 9 60 A29 29 0 0 0 67 60 C67 38 38 5 38 5 Z"
          fill="url(#drop-bg)"
        />

        {/* Animated water wave inside the drop */}
        <g clipPath="url(#drop-mask)">
          {/* Base water fill */}
          <rect x="0" y="62" width="76" height="42" fill="rgba(14,165,233,0.32)" />
          {/* Scrolling wave on surface */}
          <g style={{ animation: "drop-fill 1.8s linear infinite" }}>
            <path
              d="M0 62 C9.5 56 19 68 28.5 62 C38 56 47.5 68 57 62 C66.5 56 76 68 85.5 62 C95 56 104.5 68 114 62 C123.5 56 133 68 142.5 62 C152 56 161.5 68 171 62 L171 100 L0 100 Z"
              fill="rgba(34,211,238,0.52)"
            />
          </g>
          {/* Second wave layer slightly offset */}
          <g style={{ animation: "drop-fill 2.6s linear infinite reverse" }}>
            <path
              d="M0 66 C12 61 24 71 36 66 C48 61 60 71 72 66 C84 61 96 71 108 66 C120 61 132 71 144 66 C156 61 168 71 180 66 L180 100 L0 100 Z"
              fill="rgba(56,189,248,0.2)"
            />
          </g>
        </g>

        {/* Drop outline */}
        <path
          d="M38 5 C38 5 9 38 9 60 A29 29 0 0 0 67 60 C67 38 38 5 38 5 Z"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeOpacity="0.75"
          filter="url(#drop-glow)"
        />

        {/* Glint / shine */}
        <ellipse cx="28" cy="44" rx="4" ry="8" fill="rgba(255,255,255,0.1)" transform="rotate(-22 28 44)" />
      </svg>
    </div>
  );
}

function OceanFloor() {
  const fish = [
    { bottom: 60,  dir: "r", dur: 20, delay: 0,   w: 46, h: 22, color: "96,185,255"  },
    { bottom: 100, dir: "l", dur: 23, delay: 3,   w: 54, h: 26, color: "56,200,248"  },
    { bottom: 140, dir: "r", dur: 18, delay: 6,   w: 42, h: 20, color: "134,220,180" },
    { bottom: 180, dir: "l", dur: 25, delay: 1,   w: 50, h: 24, color: "120,180,255" },
    { bottom: 220, dir: "r", dur: 21, delay: 9,   w: 48, h: 22, color: "80,210,220"  },
    { bottom: 260, dir: "l", dur: 17, delay: 5,   w: 44, h: 20, color: "96,160,250"  },
    { bottom: 80,  dir: "l", dur: 22, delay: 12,  w: 40, h: 18, color: "70,190,240"  },
    { bottom: 160, dir: "r", dur: 19, delay: 8,   w: 52, h: 24, color: "100,200,230" },
    { bottom: 240, dir: "l", dur: 24, delay: 2,   w: 38, h: 16, color: "140,230,200" },
    { bottom: 120, dir: "r", dur: 16, delay: 11,  w: 56, h: 26, color: "80,170,255"  },
    { bottom: 200, dir: "l", dur: 26, delay: 7,   w: 44, h: 20, color: "60,180,250"  },
    { bottom: 280, dir: "r", dur: 20, delay: 4,   w: 40, h: 18, color: "120,230,210" },
  ];

  const bubbles = [
    { left: "3%",  bottom: 90,  size: 16, delay: "0s",   dur: "4.5s" },
    { left: "8%",  bottom: 70,  size: 11, delay: "1.4s", dur: "3.5s" },
    { left: "14%", bottom: 100, size: 20, delay: "0.6s", dur: "5.5s" },
    { left: "20%", bottom: 75,  size: 14, delay: "2.2s", dur: "4.5s" },
    { left: "28%", bottom: 88,  size: 17, delay: "1s",   dur: "4.2s" },
    { left: "35%", bottom: 80,  size: 12, delay: "3s",   dur: "4s" },
    { left: "42%", bottom: 95,  size: 18, delay: "0.3s", dur: "5s" },
    { left: "50%", bottom: 70,  size: 11, delay: "2s",   dur: "3.8s" },
    { left: "58%", bottom: 85,  size: 15, delay: "1.2s", dur: "4.3s" },
    { left: "65%", bottom: 78,  size: 13, delay: "0.8s", dur: "4.6s" },
    { left: "72%", bottom: 92,  size: 22, delay: "2.5s", dur: "5.2s" },
    { left: "80%", bottom: 68,  size: 10, delay: "1.8s", dur: "4.1s" },
    { left: "87%", bottom: 85,  size: 16, delay: "0.5s", dur: "4.4s" },
    { left: "95%", bottom: 75,  size: 12, delay: "3.2s", dur: "3.9s" },
  ];

  const jellies = [
    { bottom: 200, left: "8%",  w: 48, h: 66, delay: 0,   dur: 5.5, glow: "160,130,255" },
    { bottom: 240, left: "30%", w: 36, h: 52, delay: 2,   dur: 6,   glow: "130,200,255" },
    { bottom: 180, left: "52%", w: 42, h: 60, delay: 3.5, dur: 5,   glow: "180,140,255" },
    { bottom: 220, left: "75%", w: 38, h: 54, delay: 1,   dur: 6.5, glow: "100,220,255" },
    { bottom: 260, left: "92%", w: 32, h: 46, delay: 4,   dur: 5.8, glow: "200,160,255" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: "580px" }}>
      <style>{`
        @keyframes wave-1     { from{transform:translateX(0)}   to{transform:translateX(-50%)} }
        @keyframes wave-2     { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes wave-3     { from{transform:translateX(-25%)} to{transform:translateX(-75%)} }
        @keyframes bubble-up  { 0%{transform:translateY(0);opacity:0.85} 100%{transform:translateY(-260px);opacity:0} }
        @keyframes fish-r     { 0%{transform:translateX(-120px) scaleX(-1)} 100%{transform:translateX(110vw) scaleX(-1)} }
        @keyframes fish-l     { 0%{transform:translateX(110vw) scaleX(1)}  100%{transform:translateX(-120px) scaleX(1)} }
        @keyframes jelly-drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes jelly-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes jelly-halo  { 0%,100%{opacity:0.25;transform:scale(1)} 50%{opacity:0.55;transform:scale(1.12)} }
      `}</style>

      {/* ══════ GLOWING JELLYFISH ══════ */}
      {jellies.map((j, i) => (
        <div
          key={`jelly-${i}`}
          className="absolute"
          style={{ bottom: `${j.bottom}px`, left: j.left, animation: `jelly-drift ${j.dur}s ease-in-out infinite ${j.delay}s` }}
        >
          {/* Outer glow halo */}
          <div
            className="absolute rounded-full blur-2xl"
            style={{
              width: j.w * 2.4,
              height: j.w * 2,
              top: -j.w * 0.5,
              left: -j.w * 0.7,
              backgroundColor: `rgba(${j.glow},0.2)`,
              animation: `jelly-halo ${j.dur * 0.7}s ease-in-out infinite ${j.delay}s`,
            }}
          />
          {/* Inner glow halo */}
          <div
            className="absolute rounded-full blur-xl"
            style={{
              width: j.w * 1.6,
              height: j.w * 1.2,
              top: -j.w * 0.1,
              left: -j.w * 0.3,
              backgroundColor: `rgba(${j.glow},0.3)`,
              animation: `jelly-halo ${j.dur * 0.5}s ease-in-out infinite ${j.delay + 0.3}s`,
            }}
          />
          <svg width={j.w} height={j.h} viewBox={`0 0 ${j.w} ${j.h}`} fill="none" style={{ animation: `jelly-pulse ${j.dur * 0.7}s ease-in-out infinite ${j.delay}s`, filter: `drop-shadow(0 0 8px rgba(${j.glow},0.6)) drop-shadow(0 0 20px rgba(${j.glow},0.3))` }}>
            {/* Dome */}
            <path
              d={`M3 ${j.h * 0.38} A${j.w / 2 - 3} ${j.w / 2 - 3} 0 0 1 ${j.w - 3} ${j.h * 0.38} C${j.w - 3} ${j.h * 0.22} ${j.w * 0.75} ${j.h * 0.12} ${j.w / 2} ${j.h * 0.12} C${j.w * 0.25} ${j.h * 0.12} 3 ${j.h * 0.22} 3 ${j.h * 0.38} Z`}
              fill={`rgba(${j.glow},0.35)`}
              stroke={`rgba(${j.glow},0.8)`}
              strokeWidth="1.5"
            />
            {/* Dome shine */}
            <ellipse cx={j.w / 2} cy={j.h * 0.28} rx={j.w * 0.28} ry={j.h * 0.06} fill="rgba(255,255,255,0.2)" />
            {/* Tentacles */}
            {Array.from({ length: 6 }).map((_, ti) => {
              const x = 4 + ti * ((j.w - 8) / 5);
              return (
                <path
                  key={ti}
                  d={`M${x} ${j.h * 0.38} C${x - 2} ${j.h * 0.55 + ti * 2} ${x + 3} ${j.h * 0.65 + ti} ${x - 1} ${j.h * 0.82 + ti}`}
                  stroke={`rgba(${j.glow},${0.45 + ti * 0.06})`}
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>
      ))}

      {/* ══════ BUBBLES ══════ */}
      {bubbles.map((b, i) => (
        <div
          key={`bub-${i}`}
          className="absolute rounded-full"
          style={{
            left: b.left,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            backgroundColor: "rgba(165,225,250,0.15)",
            border: "1.5px solid rgba(165,225,250,0.6)",
            boxShadow: "0 0 6px rgba(130,210,245,0.35), inset 0 0 3px rgba(255,255,255,0.12)",
            animation: `bubble-up ${b.dur} ease-in infinite ${b.delay}`,
          }}
        />
      ))}

      {/* ══════ FISH ══════ */}
      {fish.map((f, i) => (
        <div
          key={`fish-${i}`}
          className="absolute"
          style={{
            bottom: `${f.bottom}px`,
            [f.dir === "r" ? "left" : "right"]: "-120px",
            animation: `fish-${f.dir} ${f.dur}s linear infinite ${f.delay}s`,
          }}
        >
          <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} fill="none" opacity="0.6">
            <path d={`M${f.w * 0.75} ${f.h / 2} L${f.w} ${f.h * 0.15} L${f.w} ${f.h * 0.85} Z`} fill={`rgba(${f.color},0.7)`} />
            <ellipse cx={f.w * 0.46} cy={f.h / 2} rx={f.w * 0.3} ry={f.h * 0.38} fill={`rgba(${f.color},0.7)`} />
            <circle cx={f.w * 0.24} cy={f.h * 0.44} r={f.h * 0.1} fill="white" />
            <circle cx={f.w * 0.26} cy={f.h * 0.44} r={f.h * 0.06} fill="#0c2d5e" />
          </svg>
        </div>
      ))}

      {/* ══════ WAVE LAYERS — deep ocean ══════ */}

      {/* Deep water base — solid, always visible */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "160px", background: "linear-gradient(to top, #04192a 0%, rgba(6,35,60,0.95) 40%, rgba(8,50,85,0.6) 70%, transparent 100%)" }} />

      {/* Layer 1 — deepest undulation (flipped: troughs first) */}
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-1 14s linear infinite" }}>
        <svg viewBox="0 0 2880 160" preserveAspectRatio="none" className="w-full" style={{ height: "160px" }}>
          <path d="M0 80 C360 115 720 45 1080 80 C1440 115 1800 45 2160 80 C2520 115 2880 45 2880 80 L2880 160 L0 160 Z" fill="rgba(6,40,75,0.9)" />
        </svg>
      </div>

      {/* Layer 2 — dark blue (flipped) */}
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-2 10s linear infinite" }}>
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="w-full" style={{ height: "120px" }}>
          <path d="M0 60 C360 90 720 30 1080 60 C1440 90 1800 30 2160 60 C2520 90 2880 30 2880 60 L2880 120 L0 120 Z" fill="rgba(10,70,120,0.75)" />
        </svg>
      </div>

      {/* Layer 3 — mid ocean blue (flipped) */}
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-3 7s linear infinite" }}>
        <svg viewBox="0 0 2880 90" preserveAspectRatio="none" className="w-full" style={{ height: "90px" }}>
          <path d="M0 45 C360 70 720 20 1080 45 C1440 70 1800 20 2160 45 C2520 70 2880 20 2880 45 L2880 90 L0 90 Z" fill="rgba(14,110,170,0.55)" />
        </svg>
      </div>

      {/* Layer 4 — teal surface (flipped) */}
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-1 8s linear infinite reverse" }}>
        <svg viewBox="0 0 2880 60" preserveAspectRatio="none" className="w-full" style={{ height: "60px" }}>
          <path d="M0 30 C360 48 720 12 1080 30 C1440 48 1800 12 2160 30 C2520 48 2880 12 2880 30 L2880 60 L0 60 Z" fill="rgba(20,180,230,0.3)" />
        </svg>
      </div>

      {/* Layer 5 — light cyan shimmer (flipped) */}
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-2 6s linear infinite" }}>
        <svg viewBox="0 0 2880 45" preserveAspectRatio="none" className="w-full" style={{ height: "45px" }}>
          <path d="M0 22 C360 36 720 8 1080 22 C1440 36 1800 8 2160 22 C2520 36 2880 8 2880 22 L2880 45 L0 45 Z" fill="rgba(34,211,238,0.2)" />
        </svg>
      </div>

      {/* Layer 6 — foam crest */}
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-3 5s linear infinite reverse" }}>
        <svg viewBox="0 0 2880 30" preserveAspectRatio="none" className="w-full" style={{ height: "30px" }}>
          <path d="M0 15 C360 5 720 25 1080 15 C1440 5 1800 25 2160 15 C2520 5 2880 25 2880 15 L2880 30 L0 30 Z" fill="rgba(186,230,253,0.15)" />
        </svg>
      </div>
    </div>
  );
}

const MAP_DOTS = [
  { top: "30%", left: "35%" },
  { top: "55%", left: "63%" },
  { top: "24%", left: "72%" },
  { top: "66%", left: "24%" },
  { top: "42%", left: "50%" },
  { top: "38%", left: "18%" },
  { top: "70%", left: "55%" },
];

function FeedCard({ entry, distKm: dist }: { entry: FeedEntry; distKm?: number }) {
  const meta = entry.topRating ? RATING_META[entry.topRating] : null;
  const color = entry.totalRatings > 0 ? getScoreColor(entry.averageScore) : "#64748b";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/water/${entry._id}`}>
        <div className="group flex gap-4 rounded-2xl border border-white/8 bg-linear-to-br from-slate-900/70 to-slate-900/30 p-4 hover:border-sky-500/20 hover:from-slate-900/90 transition-all duration-200 backdrop-blur-sm">
          {/* Thumbnail */}
          <div className="relative h-20 w-28 shrink-0 rounded-xl overflow-hidden">
            <Image
              src={entry.imageUrl}
              alt={entry.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="112px"
            />
            <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 rounded-md px-1.5 py-0.5 text-white/80 backdrop-blur-sm capitalize">
              {entry.type}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-sky-100 transition-colors">
                  {entry.name}
                </h3>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{entry.location}</p>
              </div>
              {entry.totalRatings > 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-lg font-black leading-none" style={{ color }}>
                    {entry.averageScore.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-zinc-600">/5</div>
                </div>
              )}
            </div>

            {meta && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border"
                style={{
                  color: meta.color,
                  borderColor: `${meta.color}70`,
                  backgroundColor: "#0a1628",
                }}
              >
                <span>{meta.emoji}</span>
                <span className="truncate max-w-[140px]">{meta.label}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[10px] text-zinc-600">
              <span>{timeAgo(entry.createdAt)}</span>
              <span>by {entry.uploadedBy}</span>
              {entry.totalRatings > 0 && (
                <span>{entry.totalRatings} rating{entry.totalRatings !== 1 ? "s" : ""}</span>
              )}
              {dist !== undefined && (
                <span className="text-sky-600/80">
                  {dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomePage() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [tab, setTab] = useState<"global" | "nearby">("global");
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("rmw-intro-seen");
    if (seen) setShowAnimation(false);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    sessionStorage.setItem("rmw-intro-seen", "1");
    setShowAnimation(false);
  }, []);

  const loadGlobal = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/water?limit=30&sort=createdAt");
      const data = await r.json();
      const items: FeedEntry[] = data.items ?? [];
      items.sort((a, b) => b.averageScore - a.averageScore);
      setEntries(items);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/water?limit=50&sort=createdAt`);
      const data = await r.json();
      const all: FeedEntry[] = data.items ?? [];
      const withDist = all
        .filter((w) => w.coordinates)
        .map((w) => ({
          ...w,
          _dist: distanceKm(lat, lng, w.coordinates!.lat, w.coordinates!.lng),
        }))
        .sort((a, b) => b.averageScore - a.averageScore);
      setEntries(withDist.length > 0 ? withDist : all);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "global") {
      loadGlobal();
    } else {
      if (userPos) {
        loadNearby(userPos.lat, userPos.lng);
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserPos(p);
            loadNearby(p.lat, p.lng);
          },
          () => {
            setLocationError(true);
            loadGlobal();
          }
        );
      }
    }
  }, [tab, userPos, loadGlobal, loadNearby]);

  return (
    <main className="min-h-screen bg-[#082232] text-white overflow-x-hidden">
      <AnimatePresence>
        {showAnimation && <WaterDropAnimation onComplete={handleAnimationComplete} />}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 min-h-screen flex flex-col justify-center">
        {/* Expanding ripple rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-sky-400/10"
              initial={{ width: 60, height: 60, opacity: 0.6 }}
              animate={{ width: 560 + i * 130, height: 560 + i * 130, opacity: 0 }}
              transition={{ duration: 6, repeat: Infinity, delay: i * 1.2, ease: "linear" }}
            />
          ))}
        </div>

        {/* Ocean floor scene */}
        <OceanFloor />

        {/* Background water glow blobs */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-sky-400/12 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/6 w-48 h-48 bg-teal-400/8 rounded-full blur-2xl" />


        <div className="relative max-w-2xl mx-auto px-5 pt-16 pb-36 text-center">
          {/* Animated SVG water drop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
            className="mb-6 flex justify-center"
          >
            <AnimatedWaterDrop />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95]"
          >
            Rate<span className="text-sky-400">My</span><span className="text-transparent bg-clip-text bg-linear-to-r from-sky-400 via-blue-300 to-teal-400">Water</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 text-sky-200/80 text-lg md:text-xl font-medium tracking-wide max-w-md mx-auto leading-relaxed"
          >
            Rigorously unscientific water reviews.
          </motion.p>

          {/* ── SUBMIT WATER — big glowing CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <Link href="/upload" className="relative group w-full sm:w-auto">
              {/* Glow halo */}
              <div className="absolute -inset-1.5 rounded-[20px] bg-sky-500/35 blur-xl group-hover:bg-sky-400/55 transition-all duration-300" />
              <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xl px-12 py-5 transition-all hover:scale-[1.03] shadow-2xl shadow-sky-500/40 w-full">
                <span className="text-2xl">💧</span>
                Submit Water
              </div>
            </Link>

            <Link
              href="/map"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/35 text-sky-100 font-semibold px-10 py-5 text-base transition-all"
            >
              Explore Map →
            </Link>
          </motion.div>
        </div>

      </section>

      {/* ── MAP PREVIEW ──────────────────────────────────────── */}
      <section className="px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/map"
              className="group block relative rounded-3xl overflow-hidden border border-white/8 hover:border-sky-500/30 transition-all duration-300 shadow-2xl shadow-black/40"
            >
              <div className="h-72 md:h-[420px] relative bg-[#082535]">
                {/* Grid lines */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)
                    `,
                    backgroundSize: "52px 52px",
                  }}
                />

                {/* Water body blobs */}
                <div className="absolute top-[22%] left-[30%] w-48 h-28 bg-sky-500/18 rounded-[60%] blur-3xl" />
                <div className="absolute top-[48%] right-[22%] w-64 h-40 bg-blue-500/14 rounded-[50%] blur-3xl" />
                <div className="absolute bottom-[20%] left-[18%] w-32 h-32 bg-teal-500/14 rounded-full blur-2xl" />
                <div className="absolute top-[35%] right-[40%] w-24 h-14 bg-sky-400/10 rounded-full blur-xl" />
                <div className="absolute bottom-[35%] right-[10%] w-20 h-20 bg-blue-400/8 rounded-full blur-xl" />

                {/* Animated location dots */}
                {MAP_DOTS.map((pos, i) => (
                  <div key={i} className="absolute" style={{ top: pos.top, left: pos.left }}>
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-lg shadow-sky-400/60"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-sky-400/30"
                      animate={{ scale: [1, 3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                  </div>
                ))}

                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-[#082535]/95 via-[#082535]/20 to-transparent" />
                {/* Hover tint */}
                <div className="absolute inset-0 bg-sky-500/0 group-hover:bg-sky-500/4 transition-all duration-300" />

                {/* Text content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Explore the Map
                  </h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xs">
                    Discover and rate water bodies around the world
                  </p>
                  <div className="mt-6 px-8 py-3.5 rounded-2xl bg-white/8 border border-white/12 text-white text-sm font-semibold group-hover:bg-sky-500 group-hover:border-sky-500 group-hover:text-black group-hover:shadow-xl group-hover:shadow-sky-500/30 transition-all duration-300">
                    Open Full Map
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── RATING SCALE ─────────────────────────────────────── */}
      <section className="px-4 pb-10">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-[0.18em] mb-1">
                How do you rate water?
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Pick your vibe, rate a water body
              </h2>
            </div>
            <Link
              href="/upload"
              className="hidden sm:block text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Rate water →
            </Link>
          </div>

          {/* Cards — horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
            {Object.entries(RATING_META).map(([key, meta]) => (
              <Link
                key={key}
                href={`/upload`}
                className="group shrink-0 w-44 md:w-auto relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 hover:scale-[1.08] hover:z-10 hover:shadow-2xl"
                style={{
                  borderColor: `${meta.color}25`,
                  boxShadow: `0 4px 24px ${meta.color}08`,
                }}
              >
                {/* Ocean gradient background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${meta.color}18 0%, #071a2e 55%, #040f1c 100%)`,
                  }}
                />

                {/* Wave SVG at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 opacity-30 group-hover:opacity-50 transition-opacity">
                  <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="w-full h-8">
                    <path
                      d="M0 20 C33 5 67 35 100 20 C133 5 167 35 200 20 L200 40 L0 40 Z"
                      fill={meta.color}
                      fillOpacity="0.25"
                    />
                    <path
                      d="M0 28 C40 14 80 42 120 28 C150 18 175 36 200 28 L200 40 L0 40 Z"
                      fill={meta.color}
                      fillOpacity="0.15"
                    />
                  </svg>
                </div>

                {/* Glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                  style={{
                    boxShadow: `inset 0 0 40px ${meta.color}18`,
                  }}
                />

                {/* Content */}
                <div className="relative flex flex-col items-center gap-2 px-4 pt-6 pb-10 text-center">
                  {/* Big emoji */}
                  <motion.span
                    className="text-4xl md:text-5xl block"
                    whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    {meta.emoji}
                  </motion.span>

                  {/* Score pill */}
                  <div
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                    style={{
                      color: meta.color,
                      backgroundColor: `${meta.color}18`,
                      border: `1px solid ${meta.color}30`,
                    }}
                  >
                    {meta.score}/5
                  </div>

                  {/* Label */}
                  <p className="text-xs font-bold text-white leading-tight mt-0.5">
                    {meta.label}
                  </p>

                  {/* Description */}
                  <p className="text-[10px] text-zinc-500 leading-snug group-hover:text-zinc-400 transition-colors">
                    {meta.description}
                  </p>

                  {/* Rate CTA */}
                  <div
                    className="mt-2 text-[10px] font-semibold px-3 py-1 rounded-full border opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                    style={{
                      color: meta.color,
                      borderColor: `${meta.color}40`,
                      backgroundColor: `${meta.color}12`,
                    }}
                  >
                    Rate water →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEED ─────────────────────────────────────────────── */}
      <section className="px-4 pb-32 md:pb-10">
        <div className="max-w-5xl mx-auto">
          {/* Tabs — no icons */}
          <div className="flex items-center gap-1 mb-5 p-1 rounded-2xl bg-slate-900/60 border border-white/8 w-fit">
            <button
              onClick={() => setTab("global")}
              className={cn(
                "rounded-xl px-5 py-2 text-sm font-semibold transition-all",
                tab === "global"
                  ? "bg-white/10 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Global
            </button>
            <button
              onClick={() => setTab("nearby")}
              className={cn(
                "rounded-xl px-5 py-2 text-sm font-semibold transition-all",
                tab === "nearby"
                  ? "bg-sky-500/15 text-sky-400 shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Nearby
            </button>
          </div>

          {/* Rankings headline + refresh */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Rankings</h2>
            <button
              onClick={() =>
                tab === "global"
                  ? loadGlobal()
                  : userPos && loadNearby(userPos.lat, userPos.lng)
              }
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              Refresh ↻
            </button>
          </div>

          {/* Location error */}
          <AnimatePresence>
            {locationError && tab === "nearby" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-400"
              >
                Location access denied. Showing global feed instead.
                <button
                  onClick={() => {
                    setLocationError(false);
                    setTab("global");
                  }}
                  className="ml-auto text-xs text-amber-500 hover:text-amber-300"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="text-5xl mb-4">🌊</div>
              <h3 className="text-lg font-bold text-white">No water bodies yet</h3>
              <p className="mt-2 text-zinc-500 text-sm mb-8">Be the first to submit one!</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 text-black font-bold px-8 py-3.5 text-sm hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/30"
              >
                💧 Submit Water
              </Link>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => {
                const dist =
                  tab === "nearby" && userPos && entry.coordinates
                    ? distanceKm(
                        userPos.lat,
                        userPos.lng,
                        entry.coordinates.lat,
                        entry.coordinates.lng
                      )
                    : undefined;
                return <FeedCard key={entry._id} entry={entry} distKm={dist} />;
              })}

            </div>
          )}
        </div>
      </section>
    </main>
  );
}
