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
  if (score >= 4.5) return "#22d3ee";
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
          stroke="#22d3ee"
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

function OceanWaves() {
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none" style={{ height: "140px" }}>
      <style>{`
        @keyframes wave-slow   { from{transform:translateX(0)}   to{transform:translateX(-50%)} }
        @keyframes wave-medium { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes wave-fast   { from{transform:translateX(0)}   to{transform:translateX(-50%)} }
      `}</style>

      {/* Layer 1 — slowest, deepest ocean blue */}
      <div
        className="absolute bottom-0 left-0"
        style={{ width: "200%", animation: "wave-slow 14s linear infinite" }}
      >
        <svg viewBox="0 0 2880 90" preserveAspectRatio="none" className="w-full" style={{ height: "90px" }}>
          <path
            d="M0 50 C180 20 360 80 540 50 C720 20 900 80 1080 50 C1260 20 1440 80 1620 50 C1800 20 1980 80 2160 50 C2340 20 2520 80 2700 50 C2790 35 2835 65 2880 50 L2880 90 L0 90 Z"
            fill="rgba(8,80,128,0.65)"
          />
        </svg>
      </div>

      {/* Layer 2 — medium speed, mid blue */}
      <div
        className="absolute bottom-0 left-0"
        style={{ width: "200%", animation: "wave-medium 9s linear infinite" }}
      >
        <svg viewBox="0 0 2880 70" preserveAspectRatio="none" className="w-full" style={{ height: "70px" }}>
          <path
            d="M0 35 C240 5 480 65 720 35 C960 5 1200 65 1440 35 C1680 5 1920 65 2160 35 C2400 5 2640 65 2880 35 L2880 70 L0 70 Z"
            fill="rgba(14,116,185,0.5)"
          />
        </svg>
      </div>

      {/* Layer 3 — fastest, lightest cyan */}
      <div
        className="absolute bottom-0 left-0"
        style={{ width: "200%", animation: "wave-fast 6s linear infinite" }}
      >
        <svg viewBox="0 0 2880 52" preserveAspectRatio="none" className="w-full" style={{ height: "52px" }}>
          <path
            d="M0 26 C360 4 720 48 1080 26 C1440 4 1800 48 2160 26 C2520 4 2880 48 2880 26 L2880 52 L0 52 Z"
            fill="rgba(14,165,233,0.28)"
          />
        </svg>
      </div>

      {/* Thin foam line on top */}
      <div
        className="absolute bottom-0 left-0"
        style={{ width: "200%", animation: "wave-slow 10s linear infinite reverse" }}
      >
        <svg viewBox="0 0 2880 28" preserveAspectRatio="none" className="w-full" style={{ height: "28px" }}>
          <path
            d="M0 14 C180 4 360 24 540 14 C720 4 900 24 1080 14 C1260 4 1440 24 1620 14 C1800 4 1980 24 2160 14 C2340 4 2520 24 2700 14 C2790 9 2835 19 2880 14 L2880 28 L0 28 Z"
            fill="rgba(186,230,253,0.12)"
          />
        </svg>
      </div>
    </div>
  );
}

function OceanCreatures() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes fish-r  { 0%{transform:translateX(-120px) scaleX(-1)} 100%{transform:translateX(110vw) scaleX(-1)} }
        @keyframes fish-l  { 0%{transform:translateX(110vw) scaleX(1)}  100%{transform:translateX(-120px) scaleX(1)} }
        @keyframes bubble-up  { 0%{transform:translateY(0);opacity:0.55} 100%{transform:translateY(-80px);opacity:0} }
        @keyframes sway    { 0%,100%{transform-origin:bottom center;transform:rotate(-6deg)} 50%{transform-origin:bottom center;transform:rotate(6deg)} }
        @keyframes starfish-bob { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(12deg)} }
        @keyframes jelly-float  { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-18px) scaleY(1.06)} }
      `}</style>

      {/* ── Starfish — lower left ── */}
      <div className="absolute" style={{ bottom: "170px", left: "5%", animation: "starfish-bob 4.5s ease-in-out infinite" }}>
        <svg width="54" height="54" viewBox="0 0 100 100" opacity="0.9">
          <path
            d="M50,8 L61,35 L90,37 L67,56 L75,84 L50,68 L25,84 L33,56 L10,37 L39,35 Z"
            fill="#e8622f"
            stroke="#c94f1e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Texture dots */}
          <circle cx="50" cy="50" r="6" fill="#c94f1e" opacity="0.6" />
          <circle cx="50" cy="35" r="3" fill="#c94f1e" opacity="0.4" />
          <circle cx="63" cy="55" r="2.5" fill="#c94f1e" opacity="0.4" />
          <circle cx="37" cy="55" r="2.5" fill="#c94f1e" opacity="0.4" />
        </svg>
      </div>

      {/* ── Starfish 2 — right side, smaller ── */}
      <div className="absolute hidden md:block" style={{ bottom: "175px", right: "7%", animation: "starfish-bob 5.5s ease-in-out infinite 1.5s" }}>
        <svg width="36" height="36" viewBox="0 0 100 100" opacity="0.7">
          <path
            d="M50,8 L61,35 L90,37 L67,56 L75,84 L50,68 L25,84 L33,56 L10,37 L39,35 Z"
            fill="#f97316"
            stroke="#ea6010"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="6" fill="#ea6010" opacity="0.5" />
        </svg>
      </div>

      {/* ── Seaweed left ── */}
      <div className="absolute" style={{ bottom: "148px", left: "2%", animation: "sway 3.5s ease-in-out infinite" }}>
        <svg width="28" height="90" viewBox="0 0 28 90" fill="none">
          <path d="M14 90 C14 90 6 72 14 58 C22 44 6 34 14 20 C20 10 14 4 14 0" stroke="#1a7a50" strokeWidth="5" strokeLinecap="round" />
          <path d="M14 70 C14 70 22 62 20 54" stroke="#22a262" strokeWidth="3" strokeLinecap="round" />
          <path d="M14 48 C14 48 6 40 8 32" stroke="#22a262" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="absolute" style={{ bottom: "148px", left: "8%", animation: "sway 4.2s ease-in-out infinite 0.8s" }}>
        <svg width="22" height="70" viewBox="0 0 22 70" fill="none">
          <path d="M11 70 C11 70 4 56 11 44 C18 32 4 24 11 12 C15 4 11 0 11 0" stroke="#1a6b43" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── Seaweed right ── */}
      <div className="absolute hidden sm:block" style={{ bottom: "148px", right: "3%", animation: "sway 3.8s ease-in-out infinite 0.5s" }}>
        <svg width="28" height="85" viewBox="0 0 28 85" fill="none">
          <path d="M14 85 C14 85 6 68 14 54 C22 40 6 30 14 16 C20 6 14 0 14 0" stroke="#177a4a" strokeWidth="5" strokeLinecap="round" />
          <path d="M14 64 C14 64 22 56 20 48" stroke="#1da362" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── Jellyfish — upper right ── */}
      <div className="absolute hidden md:block" style={{ top: "18%", right: "8%", animation: "jelly-float 5s ease-in-out infinite" }}>
        <svg width="56" height="80" viewBox="0 0 56 80" fill="none" opacity="0.75">
          {/* dome */}
          <path d="M6 30 A22 22 0 0 1 50 30 C50 20 42 12 28 12 C14 12 6 20 6 30 Z" fill="rgba(186,230,253,0.28)" stroke="rgba(186,230,253,0.5)" strokeWidth="1.2" />
          {/* inner dome shine */}
          <path d="M13 26 A14 10 0 0 1 43 26" stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />
          {/* tentacles */}
          {[10, 17, 24, 31, 38, 44].map((x, i) => (
            <path
              key={i}
              d={`M${x} 30 C${x - 3} ${45 + i * 2} ${x + 4} ${52 + i * 2} ${x - 2} ${62 + i * 2}`}
              stroke={`rgba(186,230,253,${0.25 + i * 0.03})`}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* ── Small fish swimming right ── */}
      <div
        className="absolute"
        style={{ top: "30%", left: "-100px", animation: "fish-r 22s linear infinite 2s" }}
      >
        <svg width="80" height="38" viewBox="0 0 80 38" fill="none" opacity="0.7">
          <path d="M60 19 L80 8 L80 30 Z" fill="rgba(96,165,250,0.65)" />
          <ellipse cx="38" cy="19" rx="24" ry="10" fill="rgba(96,165,250,0.65)" />
          <path d="M28 11 L34 2 L44 11" fill="rgba(56,130,210,0.4)" />
          <circle cx="18" cy="17" r="3" fill="white" />
          <circle cx="18.8" cy="17" r="1.6" fill="#1e3a5f" />
          <line x1="30" y1="10" x2="30" y2="28" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── Larger fish swimming left ── */}
      <div
        className="absolute hidden sm:block"
        style={{ top: "55%", right: "-120px", animation: "fish-l 28s linear infinite 6s" }}
      >
        <svg width="100" height="46" viewBox="0 0 100 46" fill="none" opacity="0.55">
          <path d="M72 23 L100 10 L100 36 Z" fill="rgba(56,189,248,0.6)" />
          <ellipse cx="46" cy="23" rx="30" ry="13" fill="rgba(56,189,248,0.6)" />
          <path d="M32 13 L40 2 L52 13" fill="rgba(14,165,233,0.4)" />
          <circle cx="20" cy="20" r="4" fill="white" />
          <circle cx="21" cy="20" r="2" fill="#0c2d5e" />
          <line x1="36" y1="11" x2="36" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
          <line x1="46" y1="11" x2="46" y2="35" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── Tiny fish lower ── */}
      <div
        className="absolute"
        style={{ top: "70%", left: "-80px", animation: "fish-r 18s linear infinite 10s" }}
      >
        <svg width="54" height="26" viewBox="0 0 54 26" fill="none" opacity="0.6">
          <path d="M40 13 L54 5 L54 21 Z" fill="rgba(134,239,172,0.55)" />
          <ellipse cx="26" cy="13" rx="16" ry="7" fill="rgba(134,239,172,0.55)" />
          <circle cx="12" cy="12" r="2.5" fill="white" />
          <circle cx="12.5" cy="12" r="1.2" fill="#064e3b" />
        </svg>
      </div>

      {/* ── Coral tubes — bottom right ── */}
      <div className="absolute hidden md:block" style={{ bottom: "148px", right: "14%" }}>
        <svg width="60" height="70" viewBox="0 0 60 70" fill="none" opacity="0.85">
          <rect x="10" y="25" width="12" height="45" rx="6" fill="#5b8dd9" />
          <rect x="24" y="15" width="14" height="55" rx="7" fill="#6b9ee9" />
          <rect x="40" y="30" width="10" height="40" rx="5" fill="#e8622f" />
          <circle cx="16" cy="24" r="7" fill="#4a7cc9" />
          <circle cx="31" cy="13" r="8" fill="#5b8dd9" />
          <circle cx="45" cy="29" r="6" fill="#d4531e" />
          <ellipse cx="16" cy="24" rx="3" ry="2" fill="#2a5aa9" />
          <ellipse cx="31" cy="13" rx="4" ry="2.5" fill="#3a68b9" />
        </svg>
      </div>

      {/* ── Bubbles scattered ── */}
      {[
        { left: "15%", bottom: "240px", size: 6, delay: "0s", dur: "4s" },
        { left: "18%", bottom: "200px", size: 4, delay: "1.2s", dur: "3.5s" },
        { left: "22%", bottom: "260px", size: 8, delay: "0.5s", dur: "5s" },
        { left: "80%", bottom: "220px", size: 5, delay: "2s", dur: "4.2s" },
        { left: "85%", bottom: "250px", size: 7, delay: "0.8s", dur: "3.8s" },
        { left: "12%", bottom: "300px", size: 4, delay: "1.8s", dur: "4.5s" },
      ].map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            left: b.left,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            borderColor: "rgba(186,230,253,0.4)",
            animation: `bubble-up ${b.dur} ease-in infinite ${b.delay}`,
          }}
        />
      ))}
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
        <div className="group flex gap-4 rounded-2xl border border-white/8 bg-linear-to-br from-slate-900/70 to-slate-900/30 p-4 hover:border-cyan-500/20 hover:from-slate-900/90 transition-all duration-200 backdrop-blur-sm">
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
                <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-cyan-100 transition-colors">
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
                  borderColor: `${meta.color}30`,
                  backgroundColor: `${meta.color}10`,
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
                <span className="text-cyan-700/80">
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
      setEntries(data.items ?? []);
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
        .sort((a, b) => a._dist - b._dist);
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
      <section className="relative overflow-hidden pt-14 min-h-[88vh] flex flex-col justify-center">
        {/* Expanding ripple rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-cyan-400/10"
              initial={{ width: 60, height: 60, opacity: 0.6 }}
              animate={{ width: 560 + i * 130, height: 560 + i * 130, opacity: 0 }}
              transition={{ duration: 6, repeat: Infinity, delay: i * 1.2, ease: "linear" }}
            />
          ))}
        </div>

        {/* Background water glow blobs */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-cyan-400/12 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/6 w-48 h-48 bg-teal-400/8 rounded-full blur-2xl" />

        {/* Ocean creatures */}
        <OceanCreatures />

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
            Rate<span className="text-cyan-400">My</span>
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-300 to-teal-400">
              Water
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 text-zinc-400 text-base md:text-lg max-w-md mx-auto leading-relaxed"
          >
            From dive-in-with-mouth-open perfection to full biohazard speedruns —
            the world&apos;s water bodies, rated.
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
              <div className="absolute -inset-1.5 rounded-[20px] bg-cyan-500/35 blur-xl group-hover:bg-cyan-400/55 transition-all duration-300" />
              <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl px-12 py-5 transition-all hover:scale-[1.03] shadow-2xl shadow-cyan-500/40 w-full">
                <span className="text-2xl">💧</span>
                Submit Water
              </div>
            </Link>

            <Link
              href="/map"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/35 text-cyan-100 font-semibold px-10 py-5 text-base transition-all"
            >
              Explore Map →
            </Link>
          </motion.div>
        </div>

        {/* Layered ocean waves */}
        <OceanWaves />
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
              className="group block relative rounded-3xl overflow-hidden border border-white/8 hover:border-cyan-500/30 transition-all duration-300 shadow-2xl shadow-black/40"
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
                <div className="absolute top-[22%] left-[30%] w-48 h-28 bg-cyan-500/18 rounded-[60%] blur-3xl" />
                <div className="absolute top-[48%] right-[22%] w-64 h-40 bg-blue-500/14 rounded-[50%] blur-3xl" />
                <div className="absolute bottom-[20%] left-[18%] w-32 h-32 bg-teal-500/14 rounded-full blur-2xl" />
                <div className="absolute top-[35%] right-[40%] w-24 h-14 bg-cyan-400/10 rounded-full blur-xl" />
                <div className="absolute bottom-[35%] right-[10%] w-20 h-20 bg-blue-400/8 rounded-full blur-xl" />

                {/* Animated location dots */}
                {MAP_DOTS.map((pos, i) => (
                  <div key={i} className="absolute" style={{ top: pos.top, left: pos.left }}>
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/60"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-cyan-400/30"
                      animate={{ scale: [1, 3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                  </div>
                ))}

                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-[#082535]/95 via-[#082535]/20 to-transparent" />
                {/* Hover tint */}
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/4 transition-all duration-300" />

                {/* Text content */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Explore the Map
                  </h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xs">
                    Discover and rate water bodies around the world
                  </p>
                  <div className="mt-6 px-8 py-3.5 rounded-2xl bg-white/8 border border-white/12 text-white text-sm font-semibold group-hover:bg-cyan-500 group-hover:border-cyan-500 group-hover:text-black group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all duration-300">
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
              <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-[0.18em] mb-1">
                How do you rate water?
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Pick your vibe, rate a water body
              </h2>
            </div>
            <Link
              href="/upload"
              className="hidden sm:block text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
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
                  ? "bg-cyan-500/15 text-cyan-400 shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Nearby
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
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 text-black font-bold px-8 py-3.5 text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30"
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

              <button
                onClick={() =>
                  tab === "global"
                    ? loadGlobal()
                    : userPos && loadNearby(userPos.lat, userPos.lng)
                }
                className="rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 py-3.5 text-sm text-zinc-500 hover:text-zinc-300 transition-all"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
