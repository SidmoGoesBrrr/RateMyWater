"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { WaterDropAnimation } from "@/components/WaterDropAnimation";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { cn } from "@/lib/utils";
import { Trophy, Navigation, Clock, TrendingUp } from "lucide-react";

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
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
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
      <svg width="76" height="100" viewBox="0 0 76 100" fill="none" style={{ animation: "drop-float 3.2s ease-in-out infinite" }}>
        <defs>
          <clipPath id="drop-mask"><path d="M38 5 C38 5 9 38 9 60 A29 29 0 0 0 67 60 C67 38 38 5 38 5 Z" /></clipPath>
          <linearGradient id="drop-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.55" />
          </linearGradient>
          <filter id="drop-glow"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M38 5 C38 5 9 38 9 60 A29 29 0 0 0 67 60 C67 38 38 5 38 5 Z" fill="url(#drop-bg)" />
        <g clipPath="url(#drop-mask)">
          <rect x="0" y="62" width="76" height="42" fill="rgba(14,165,233,0.32)" />
          <g style={{ animation: "drop-fill 1.8s linear infinite" }}>
            <path d="M0 62 C9.5 56 19 68 28.5 62 C38 56 47.5 68 57 62 C66.5 56 76 68 85.5 62 C95 56 104.5 68 114 62 C123.5 56 133 68 142.5 62 C152 56 161.5 68 171 62 L171 100 L0 100 Z" fill="rgba(34,211,238,0.52)" />
          </g>
          <g style={{ animation: "drop-fill 2.6s linear infinite reverse" }}>
            <path d="M0 66 C12 61 24 71 36 66 C48 61 60 71 72 66 C84 61 96 71 108 66 C120 61 132 71 144 66 C156 61 168 71 180 66 L180 100 L0 100 Z" fill="rgba(56,189,248,0.2)" />
          </g>
        </g>
        <path d="M38 5 C38 5 9 38 9 60 A29 29 0 0 0 67 60 C67 38 38 5 38 5 Z" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.75" filter="url(#drop-glow)" />
        <ellipse cx="28" cy="44" rx="4" ry="8" fill="rgba(255,255,255,0.1)" transform="rotate(-22 28 44)" />
      </svg>
    </div>
  );
}

function OceanFloor() {
  const bubbles = [
    { left: "3%",  bottom: 90,  size: 6, delay: "0s",   dur: "4.5s" },
    { left: "8%",  bottom: 70,  size: 4, delay: "1.4s", dur: "3.5s" },
    { left: "14%", bottom: 100, size: 8, delay: "0.6s", dur: "5.5s" },
    { left: "20%", bottom: 75,  size: 5, delay: "2.2s", dur: "4.5s" },
    { left: "28%", bottom: 88,  size: 6, delay: "1s",   dur: "4.2s" },
    { left: "35%", bottom: 80,  size: 5, delay: "3s",   dur: "4s"   },
    { left: "42%", bottom: 95,  size: 7, delay: "0.3s", dur: "5s"   },
    { left: "50%", bottom: 70,  size: 4, delay: "2s",   dur: "3.8s" },
    { left: "58%", bottom: 85,  size: 6, delay: "1.2s", dur: "4.3s" },
    { left: "65%", bottom: 78,  size: 5, delay: "0.8s", dur: "4.6s" },
    { left: "72%", bottom: 92,  size: 8, delay: "2.5s", dur: "5.2s" },
    { left: "80%", bottom: 68,  size: 4, delay: "1.8s", dur: "4.1s" },
    { left: "87%", bottom: 85,  size: 6, delay: "0.5s", dur: "4.4s" },
    { left: "95%", bottom: 75,  size: 5, delay: "3.2s", dur: "3.9s" },
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
        @keyframes wave-1      { from{transform:translateX(0)}    to{transform:translateX(-50%)} }
        @keyframes wave-2      { from{transform:translateX(-50%)} to{transform:translateX(0)}   }
        @keyframes wave-3      { from{transform:translateX(-25%)} to{transform:translateX(-75%)} }
        @keyframes bubble-up   { 0%{transform:translateY(0);opacity:0.65} 100%{transform:translateY(-200px);opacity:0} }
        @keyframes jelly-drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes jelly-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes jelly-halo  { 0%,100%{opacity:0.25;transform:scale(1)} 50%{opacity:0.55;transform:scale(1.12)} }
      `}</style>
      {jellies.map((j, i) => (
        <div key={`jelly-${i}`} className="absolute" style={{ bottom: `${j.bottom}px`, left: j.left, animation: `jelly-drift ${j.dur}s ease-in-out infinite ${j.delay}s` }}>
          <div className="absolute rounded-full blur-2xl" style={{ width: j.w*2.4, height: j.w*2, top: -j.w*0.5, left: -j.w*0.7, backgroundColor: `rgba(${j.glow},0.2)`, animation: `jelly-halo ${j.dur*0.7}s ease-in-out infinite ${j.delay}s` }} />
          <div className="absolute rounded-full blur-xl"  style={{ width: j.w*1.6, height: j.w*1.2, top: -j.w*0.1, left: -j.w*0.3, backgroundColor: `rgba(${j.glow},0.3)`, animation: `jelly-halo ${j.dur*0.5}s ease-in-out infinite ${j.delay+0.3}s` }} />
          <svg width={j.w} height={j.h} viewBox={`0 0 ${j.w} ${j.h}`} fill="none" style={{ animation: `jelly-pulse ${j.dur*0.7}s ease-in-out infinite ${j.delay}s`, filter: `drop-shadow(0 0 8px rgba(${j.glow},0.6)) drop-shadow(0 0 20px rgba(${j.glow},0.3))` }}>
            <path d={`M3 ${j.h*0.38} A${j.w/2-3} ${j.w/2-3} 0 0 1 ${j.w-3} ${j.h*0.38} C${j.w-3} ${j.h*0.22} ${j.w*0.75} ${j.h*0.12} ${j.w/2} ${j.h*0.12} C${j.w*0.25} ${j.h*0.12} 3 ${j.h*0.22} 3 ${j.h*0.38} Z`} fill={`rgba(${j.glow},0.35)`} stroke={`rgba(${j.glow},0.8)`} strokeWidth="1.5" />
            <ellipse cx={j.w/2} cy={j.h*0.28} rx={j.w*0.28} ry={j.h*0.06} fill="rgba(255,255,255,0.2)" />
            {Array.from({ length: 6 }).map((_, ti) => {
              const x = 4 + ti * ((j.w - 8) / 5);
              return <path key={ti} d={`M${x} ${j.h*0.38} C${x-2} ${j.h*0.55+ti*2} ${x+3} ${j.h*0.65+ti} ${x-1} ${j.h*0.82+ti}`} stroke={`rgba(${j.glow},${0.45+ti*0.06})`} strokeWidth="1.2" fill="none" strokeLinecap="round" />;
            })}
          </svg>
        </div>
      ))}
      {bubbles.map((b, i) => (
        <div key={`bub-${i}`} className="absolute rounded-full border" style={{ left: b.left, bottom: b.bottom, width: b.size, height: b.size, borderColor: "rgba(165,225,250,0.5)", animation: `bubble-up ${b.dur} ease-in infinite ${b.delay}` }} />
      ))}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "160px", background: "linear-gradient(to top, #04192a 0%, rgba(6,35,60,0.95) 40%, rgba(8,50,85,0.6) 70%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-1 14s linear infinite" }}><svg viewBox="0 0 2880 180" preserveAspectRatio="none" className="w-full" style={{ height: "180px" }}><path d="M0 90 C180 30 360 150 540 90 C720 30 900 150 1080 90 C1260 30 1440 150 1620 90 C1800 30 1980 150 2160 90 C2340 30 2520 150 2700 90 C2790 60 2835 120 2880 90 L2880 180 L0 180 Z" fill="rgba(6,40,75,0.9)" /></svg></div>
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-2 10s linear infinite" }}><svg viewBox="0 0 2880 140" preserveAspectRatio="none" className="w-full" style={{ height: "140px" }}><path d="M0 70 C240 18 480 122 720 70 C960 18 1200 122 1440 70 C1680 18 1920 122 2160 70 C2400 18 2640 122 2880 70 L2880 140 L0 140 Z" fill="rgba(10,70,120,0.75)" /></svg></div>
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-3 7s linear infinite" }}><svg viewBox="0 0 2880 100" preserveAspectRatio="none" className="w-full" style={{ height: "100px" }}><path d="M0 50 C360 10 720 90 1080 50 C1440 10 1800 90 2160 50 C2520 10 2880 90 2880 50 L2880 100 L0 100 Z" fill="rgba(14,110,170,0.55)" /></svg></div>
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-1 8s linear infinite reverse" }}><svg viewBox="0 0 2880 70" preserveAspectRatio="none" className="w-full" style={{ height: "70px" }}><path d="M0 35 C180 8 360 62 540 35 C720 8 900 62 1080 35 C1260 8 1440 62 1620 35 C1800 8 1980 62 2160 35 C2340 8 2520 62 2700 35 C2790 22 2835 48 2880 35 L2880 70 L0 70 Z" fill="rgba(20,180,230,0.3)" /></svg></div>
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-2 6s linear infinite" }}><svg viewBox="0 0 2880 50" preserveAspectRatio="none" className="w-full" style={{ height: "48px" }}><path d="M0 25 C240 5 480 45 720 25 C960 5 1200 45 1440 25 C1680 5 1920 45 2160 25 C2400 5 2640 45 2880 25 L2880 50 L0 50 Z" fill="rgba(34,211,238,0.2)" /></svg></div>
      <div className="absolute bottom-0 left-0" style={{ width: "200%", animation: "wave-3 5s linear infinite reverse" }}><svg viewBox="0 0 2880 32" preserveAspectRatio="none" className="w-full" style={{ height: "30px" }}><path d="M0 16 C180 4 360 28 540 16 C720 4 900 28 1080 16 C1260 4 1440 28 1620 16 C1800 4 1980 28 2160 16 C2340 4 2520 28 2700 16 C2790 10 2835 22 2880 16 L2880 32 L0 32 Z" fill="rgba(186,230,253,0.15)" /></svg></div>
    </div>
  );
}

const MAP_DOTS = [
  { top: "30%", left: "35%" }, { top: "55%", left: "63%" }, { top: "24%", left: "72%" },
  { top: "66%", left: "24%" }, { top: "42%", left: "50%" }, { top: "38%", left: "18%" },
  { top: "70%", left: "55%" },
];

const RANK_STYLES = [
  { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/30", text: "text-yellow-400", medal: "🥇" },
  { bg: "from-slate-400/20 to-slate-500/5",   border: "border-slate-400/30",  text: "text-slate-300",  medal: "🥈" },
  { bg: "from-orange-600/20 to-orange-700/5", border: "border-orange-600/30", text: "text-orange-400", medal: "🥉" },
];

function TopWaterCard({ entry, rank }: { entry: FeedEntry; rank: number }) {
  const s = RANK_STYLES[rank];
  const meta = entry.topRating ? RATING_META[entry.topRating] : null;
  const color = getScoreColor(entry.averageScore);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.08, type: "spring", stiffness: 280, damping: 22 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={`/water/${entry._id}`}>
        <div className={cn("relative rounded-2xl border p-4 bg-linear-to-br transition-all duration-200 hover:shadow-xl", s.bg, s.border)}>
          <div className="flex items-center gap-3">
            <motion.span className="text-2xl shrink-0" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5, delay: rank * 0.15 + 0.4 }}>
              {s.medal}
            </motion.span>
            <div className="relative h-12 w-16 shrink-0 rounded-xl overflow-hidden">
              <Image src={entry.imageUrl} alt={entry.name} fill className="object-cover" sizes="64px" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{entry.name}</h3>
              <p className="text-xs text-zinc-500 truncate">{entry.location}</p>
              {meta && <span className="text-xs" style={{ color: meta.color }}>{meta.emoji} {meta.label}</span>}
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl font-black" style={{ color }}>{entry.averageScore.toFixed(1)}</div>
              <div className="text-[10px] text-zinc-600">/5</div>
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} whileInView={{ width: `${(entry.averageScore / 5) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: rank * 0.1, ease: "easeOut" }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>{entry.totalRatings} rating{entry.totalRatings !== 1 ? "s" : ""}</span>
            <span>{entry.location}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FeedCard({ entry, distKm: dist }: { entry: FeedEntry; distKm?: number }) {
  const meta = entry.topRating ? RATING_META[entry.topRating] : null;
  const color = entry.totalRatings > 0 ? getScoreColor(entry.averageScore) : "#64748b";
  return (
    <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ x: 3, scale: 1.005 }}>
      <Link href={`/water/${entry._id}`}>
        <div className="group flex gap-4 rounded-2xl border border-white/8 bg-linear-to-br from-slate-900/70 to-slate-900/30 p-4 hover:border-cyan-500/20 hover:from-slate-900/90 transition-all duration-200 backdrop-blur-sm">
          <div className="relative h-20 w-28 shrink-0 rounded-xl overflow-hidden">
            <Image src={entry.imageUrl} alt={entry.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="112px" />
            <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 rounded-md px-1.5 py-0.5 text-white/80 backdrop-blur-sm capitalize">{entry.type}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-cyan-100 transition-colors">{entry.name}</h3>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{entry.location}</p>
              </div>
              {entry.totalRatings > 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-lg font-black leading-none" style={{ color }}>{entry.averageScore.toFixed(1)}</div>
                  <div className="text-[10px] text-zinc-600">/5</div>
                </div>
              )}
            </div>
            {meta && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border" style={{ color: meta.color, borderColor: `${meta.color}30`, backgroundColor: `${meta.color}10` }}>
                <span>{meta.emoji}</span>
                <span className="truncate max-w-[140px]">{meta.label}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[10px] text-zinc-600">
              <span>{timeAgo(entry.createdAt)}</span>
              <span>by {entry.uploadedBy}</span>
              {entry.totalRatings > 0 && <span>{entry.totalRatings} rating{entry.totalRatings !== 1 ? "s" : ""}</span>}
              {dist !== undefined && <span className="text-cyan-700/80">{dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

type SortMode = "recent" | "top" | "nearby";

export default function HomePage() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [sort, setSort] = useState<SortMode>("recent");
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [topRated, setTopRated] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("rmw-intro-seen");
    if (seen) setShowAnimation(false);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    sessionStorage.setItem("rmw-intro-seen", "1");
    setShowAnimation(false);
  }, []);

  useEffect(() => {
    fetch("/api/water?limit=3&sort=score")
      .then((r) => r.json())
      .then((d) => setTopRated((d.items ?? []).filter((w: FeedEntry) => w.totalRatings > 0)))
      .catch(() => {});
  }, []);

  const loadFeed = useCallback(async (mode: SortMode, pos?: { lat: number; lng: number } | null) => {
    setLoading(true);
    try {
      if (mode === "nearby" && pos) {
        const r = await fetch("/api/water?limit=50&sort=createdAt");
        const data = await r.json();
        const all: FeedEntry[] = data.items ?? [];
        const sorted = all
          .filter((w) => w.coordinates)
          .map((w) => ({ ...w, _dist: distanceKm(pos.lat, pos.lng, w.coordinates!.lat, w.coordinates!.lng) }))
          .sort((a, b) => a._dist - b._dist);
        setEntries(sorted.length > 0 ? sorted : all);
      } else {
        const apiSort = mode === "top" ? "score" : "createdAt";
        const r = await fetch(`/api/water?limit=30&sort=${apiSort}`);
        const data = await r.json();
        setEntries(data.items ?? []);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setLocating(false);
        setSort("nearby");
        loadFeed("nearby", p);
      },
      () => {
        setLocationError(true);
        setLocating(false);
        setSort("recent");
        loadFeed("recent", null);
      }
    );
  }, [loadFeed]);

  useEffect(() => {
    loadFeed("recent", null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortChange = (next: SortMode) => {
    setSort(next);
    if (next === "nearby") {
      if (userPos) loadFeed("nearby", userPos);
      else requestLocation();
    } else {
      loadFeed(next, userPos);
    }
  };

  return (
    <main className="min-h-screen bg-[#082232] text-white overflow-x-hidden">
      <AnimatePresence>
        {showAnimation && <WaterDropAnimation onComplete={handleAnimationComplete} />}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 min-h-[88vh] flex flex-col justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div key={i} className="absolute rounded-full border border-cyan-400/10" initial={{ width: 60, height: 60, opacity: 0.6 }} animate={{ width: 560 + i * 130, height: 560 + i * 130, opacity: 0 }} transition={{ duration: 6, repeat: Infinity, delay: i * 1.2, ease: "linear" }} />
          ))}
        </div>
        <OceanFloor />
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-cyan-400/12 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto px-5 pt-16 pb-36 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 180 }} className="mb-6 flex justify-center">
            <AnimatedWaterDrop />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
            Rate<span className="text-cyan-400">My</span>
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-blue-300 to-teal-400">Water</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-5 text-zinc-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            From dive-in-with-mouth-open perfection to full biohazard speedruns — the world&apos;s water bodies, rated.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/forum" className="relative group w-full sm:w-auto">
              <div className="absolute -inset-1.5 rounded-[20px] bg-cyan-500/35 blur-xl group-hover:bg-cyan-400/55 transition-all duration-300" />
              <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl px-12 py-5 transition-all hover:scale-[1.03] shadow-2xl shadow-cyan-500/40 w-full">
                <span className="text-2xl">💧</span>Submit Water
              </div>
            </Link>
            <Link href="/map" className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-500/35 text-cyan-100 font-semibold px-10 py-5 text-base transition-all">
              Explore Map →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TOP RATED ────────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className="px-4 py-10">
          <div className="max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6">
              <motion.div className="h-9 w-9 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center" animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}>
                <Trophy className="h-4 w-4 text-yellow-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-black text-white">Top Rated Waters</h2>
                <p className="text-xs text-zinc-500">Community&apos;s highest scored bodies of water</p>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topRated.map((entry, i) => <TopWaterCard key={entry._id} entry={entry} rank={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── MAP PREVIEW ──────────────────────────────────────── */}
      <section className="px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}>
            <Link href="/map" className="group block relative rounded-3xl overflow-hidden border border-white/8 hover:border-cyan-500/30 transition-all duration-300 shadow-2xl shadow-black/40">
              <div className="h-72 md:h-[420px] relative bg-[#082535]">
                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)`, backgroundSize: "52px 52px" }} />
                <div className="absolute top-[22%] left-[30%] w-48 h-28 bg-cyan-500/18 rounded-[60%] blur-3xl" />
                <div className="absolute top-[48%] right-[22%] w-64 h-40 bg-blue-500/14 rounded-[50%] blur-3xl" />
                <div className="absolute bottom-[20%] left-[18%] w-32 h-32 bg-teal-500/14 rounded-full blur-2xl" />
                {MAP_DOTS.map((pos, i) => (
                  <div key={i} className="absolute" style={{ top: pos.top, left: pos.left }}>
                    <motion.div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/60" animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }} />
                    <motion.div className="absolute inset-0 rounded-full bg-cyan-400/30" animate={{ scale: [1, 3, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }} />
                  </div>
                ))}
                <div className="absolute inset-0 bg-linear-to-t from-[#082535]/95 via-[#082535]/20 to-transparent" />
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/4 transition-all duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6 text-center">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Explore the Map</h2>
                  <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-xs">Discover and rate water bodies around the world</p>
                  <div className="mt-6 px-8 py-3.5 rounded-2xl bg-white/8 border border-white/12 text-white text-sm font-semibold group-hover:bg-cyan-500 group-hover:border-cyan-500 group-hover:text-black group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all duration-300">Open Full Map</div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── RATING SCALE ─────────────────────────────────────── */}
      <section className="px-4 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold text-cyan-700 uppercase tracking-[0.18em] mb-1">How do you rate water?</p>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Pick your vibe, rate a water body</h2>
            </div>
            <Link href="/forum" className="hidden sm:block text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Rate water →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
            {Object.entries(RATING_META).map(([key, meta]) => (
              <Link key={key} href="/forum" className="group shrink-0 w-44 md:w-auto relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 hover:scale-[1.08] hover:z-10 hover:shadow-2xl" style={{ borderColor: `${meta.color}25`, boxShadow: `0 4px 24px ${meta.color}08` }}>
                <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${meta.color}18 0%, #071a2e 55%, #040f1c 100%)` }} />
                <div className="absolute bottom-0 left-0 right-0 opacity-30 group-hover:opacity-50 transition-opacity">
                  <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className="w-full h-8">
                    <path d="M0 20 C33 5 67 35 100 20 C133 5 167 35 200 20 L200 40 L0 40 Z" fill={meta.color} fillOpacity="0.25" />
                    <path d="M0 28 C40 14 80 42 120 28 C150 18 175 36 200 28 L200 40 L0 40 Z" fill={meta.color} fillOpacity="0.15" />
                  </svg>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" style={{ boxShadow: `inset 0 0 40px ${meta.color}18` }} />
                <div className="relative flex flex-col items-center gap-2 px-4 pt-6 pb-10 text-center">
                  <motion.span className="text-4xl md:text-5xl block" whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }} transition={{ duration: 0.3 }}>{meta.emoji}</motion.span>
                  <div className="text-[10px] font-black px-2.5 py-0.5 rounded-full" style={{ color: meta.color, backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>{meta.score}/5</div>
                  <p className="text-xs font-bold text-white leading-tight mt-0.5">{meta.label}</p>
                  <p className="text-[10px] text-zinc-500 leading-snug group-hover:text-zinc-400 transition-colors">{meta.description}</p>
                  <div className="mt-2 text-[10px] font-semibold px-3 py-1 rounded-full border opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0" style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}12` }}>Rate water →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEED ─────────────────────────────────────────────── */}
      <section className="px-4 pb-32 md:pb-10">
        <div className="max-w-5xl mx-auto">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 mb-5 p-1 rounded-2xl bg-slate-900/60 border border-white/8 w-fit">
            {([
              { key: "recent" as SortMode, label: "Recent",    icon: <Clock      className="h-3.5 w-3.5" /> },
              { key: "top"    as SortMode, label: "Top Rated", icon: <TrendingUp className="h-3.5 w-3.5" /> },
              { key: "nearby" as SortMode, label: "Nearby",    icon: <Navigation className="h-3.5 w-3.5" /> },
            ]).map(({ key, label, icon }) => (
              <motion.button
                key={key}
                onClick={() => handleSortChange(key)}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                  sort === key
                    ? key === "nearby" ? "bg-cyan-500/15 text-cyan-400 shadow" : "bg-white/10 text-white shadow"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {locating && key === "nearby"
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Navigation className="h-3.5 w-3.5" /></motion.div>
                  : icon}
                {label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {locationError && sort === "nearby" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-400">
                Location access denied. Showing global feed instead.
                <button onClick={() => { setLocationError(false); handleSortChange("recent"); }} className="ml-auto text-xs text-amber-500 hover:text-amber-300">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div key={i} className="h-28 rounded-2xl bg-slate-900/50 border border-white/5" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <motion.div className="text-5xl mb-4" animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>🌊</motion.div>
              <h3 className="text-lg font-bold text-white">No water bodies yet</h3>
              <p className="mt-2 text-zinc-500 text-sm mb-8">Be the first to submit one!</p>
              <Link href="/forum" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 text-black font-bold px-8 py-3.5 text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30">💧 Submit Water</Link>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => {
                const dist = sort === "nearby" && userPos && entry.coordinates
                  ? distanceKm(userPos.lat, userPos.lng, entry.coordinates.lat, entry.coordinates.lng)
                  : undefined;
                return <FeedCard key={entry._id} entry={entry} distKm={dist} />;
              })}
              <motion.button
                onClick={() => handleSortChange(sort)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 py-3.5 text-sm text-zinc-500 hover:text-zinc-300 transition-all"
              >
                Refresh
              </motion.button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
