"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Upload, Globe, Navigation, Droplets,
  Star, ChevronRight, RefreshCw, AlertCircle
} from "lucide-react";
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

const TYPE_EMOJIS: Record<string, string> = {
  beach: "🏖️", ocean: "🌊", lake: "🏔️", river: "🌿", pond: "🦆",
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function distanceKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
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

function FeedCard({ entry, distKm }: { entry: FeedEntry; distKm?: number }) {
  const meta = entry.topRating ? RATING_META[entry.topRating] : null;
  const color = entry.totalRatings > 0 ? getScoreColor(entry.averageScore) : "#64748b";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/water/${entry._id}`}>
        <div className="group flex gap-3.5 rounded-2xl border border-white/8 bg-slate-900/50 p-3.5 hover:border-white/15 hover:bg-slate-900/80 transition-all duration-200">
          {/* Thumbnail */}
          <div className="relative h-20 w-28 flex-shrink-0 rounded-xl overflow-hidden">
            <Image
              src={entry.imageUrl}
              alt={entry.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="112px"
            />
            {/* Type overlay */}
            <div className="absolute bottom-1 left-1 text-sm">
              {TYPE_EMOJIS[entry.type] ?? "💧"}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-cyan-100 transition-colors">
                  {entry.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                  <span className="text-xs text-zinc-500 truncate">{entry.location}</span>
                </div>
              </div>

              {/* Score */}
              {entry.totalRatings > 0 ? (
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-black leading-none" style={{ color }}>
                    {entry.averageScore.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-zinc-600">/5</div>
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <Droplets className="h-5 w-5 text-zinc-700" />
                </div>
              )}
            </div>

            {/* Rating badge */}
            {meta && (
              <div
                className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
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

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
              <span>{timeAgo(entry.createdAt)}</span>
              <span>by {entry.uploadedBy}</span>
              {entry.totalRatings > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5" />
                  {entry.totalRatings} rating{entry.totalRatings !== 1 ? "s" : ""}
                </span>
              )}
              {distKm !== undefined && (
                <span className="flex items-center gap-0.5 text-cyan-700">
                  <Navigation className="h-2.5 w-2.5" />
                  {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 self-center flex-shrink-0 transition-colors" />
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

  // Skip animation if already seen this session
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
      // Sort by distance
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
    <main className="min-h-screen bg-[#060d1f] text-white">
      {/* Water drop intro animation */}
      <AnimatePresence>
        {showAnimation && (
          <WaterDropAnimation onComplete={handleAnimationComplete} />
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 md:pt-14">
        {/* Animated water background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 pt-10 pb-8 text-center">
          {/* Animated drop icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              💧
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Rate<span className="text-cyan-400">My</span>Water
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-3 text-zinc-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed"
          >
            From dive-in-with-mouth-open perfection to full biohazard speedruns —
            the world&apos;s water bodies, rated.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-6 flex items-center justify-center gap-3 flex-wrap"
          >
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2.5 text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105"
            >
              <Upload className="h-4 w-4" />
              Submit Water
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium px-5 py-2.5 text-sm transition-all"
            >
              <MapPin className="h-4 w-4 text-cyan-400" />
              Explore Map
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── RATING TIER MINI DISPLAY ─────────────────────────── */}
      <section className="px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Object.entries(RATING_META).map(([key, meta]) => (
              <Link
                key={key}
                href={`/leaderboard?rating=${key}`}
                className="flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-center hover:scale-105 transition-transform"
                style={{
                  borderColor: `${meta.color}25`,
                  background: `linear-gradient(135deg, ${meta.color}08, transparent)`,
                }}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <span className="text-[10px] text-zinc-400 w-16 leading-tight text-center">{meta.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEED ─────────────────────────────────────────────── */}
      <section className="px-4 pb-32 md:pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-4 p-1 rounded-2xl bg-slate-900/60 border border-white/8 w-fit">
            <button
              onClick={() => setTab("global")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                tab === "global"
                  ? "bg-white/10 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              Global
            </button>
            <button
              onClick={() => setTab("nearby")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                tab === "nearby"
                  ? "bg-white/10 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Navigation className="h-3.5 w-3.5 text-cyan-400" />
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
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Location access denied. Showing global feed instead.
                <button
                  onClick={() => { setLocationError(false); setTab("global"); }}
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
                <div key={i} className="h-28 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-5xl mb-4">🌊</div>
              <h3 className="text-lg font-bold text-white">No water bodies yet</h3>
              <p className="mt-2 text-zinc-500 text-sm mb-6">Be the first to submit one!</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 text-black font-semibold px-5 py-2.5 text-sm hover:bg-cyan-400 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Submit Water
              </Link>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => {
                const distKm =
                  tab === "nearby" && userPos && entry.coordinates
                    ? distanceKm(userPos.lat, userPos.lng, entry.coordinates.lat, entry.coordinates.lng)
                    : undefined;
                return <FeedCard key={entry._id} entry={entry} distKm={distKm} />;
              })}

              <button
                onClick={() => tab === "global" ? loadGlobal() : userPos && loadNearby(userPos.lat, userPos.lng)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-3 text-sm text-zinc-400 hover:text-white transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
