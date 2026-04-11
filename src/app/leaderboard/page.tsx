"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Trophy, Upload, Droplets, MapPin, Filter, ArrowRight, TrendingUp } from "lucide-react";
import { MovingBorderButton } from "@/components/ui/moving-border";
import NumberTicker from "@/components/ui/number-ticker";
import { type WaterCardData } from "@/components/WaterCard";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types", emoji: "💧" },
  { value: "beach", label: "Beach", emoji: "🏖️" },
  { value: "ocean", label: "Ocean", emoji: "🌊" },
  { value: "lake", label: "Lake", emoji: "🏔️" },
  { value: "river", label: "River", emoji: "🌿" },
  { value: "pond", label: "Pond", emoji: "🦆" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Top Rated" },
  { value: "createdAt", label: "Most Recent" },
];

const RANK_STYLES = [
  { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/30", text: "text-yellow-400", medal: "🥇" },
  { bg: "from-slate-400/20 to-slate-500/5", border: "border-slate-400/30", text: "text-slate-300", medal: "🥈" },
  { bg: "from-orange-600/20 to-orange-700/5", border: "border-orange-600/30", text: "text-orange-400", medal: "🥉" },
];

function ScoreBar({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 4.5) return "#22d3ee";
    if (s >= 3.5) return "#34d399";
    if (s >= 2.5) return "#fbbf24";
    if (s >= 1.5) return "#f97316";
    return "#ef4444";
  };
  const color = getColor(score);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 5) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <motion.span
        className="text-sm font-bold tabular-nums"
        style={{ color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {score.toFixed(1)}
      </motion.span>
    </div>
  );
}

function LeaderboardRow({ water, rank, index }: { water: WaterCardData; rank: number; index: number }) {
  const topMeta = water.topRating ? RATING_META[water.topRating as WaterRating] : null;
  const style = rank < 3 ? RANK_STYLES[rank] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.055, type: "spring", stiffness: 280, damping: 24 }}
      whileHover={{ x: 4, scale: 1.01 }}
    >
      <Link href={`/water/${water._id}`}>
        <div
          className={cn(
            "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200",
            "hover:shadow-lg hover:shadow-cyan-500/5",
            style
              ? `bg-linear-to-r ${style.bg} ${style.border}`
              : "border-white/8 bg-slate-900/50 hover:border-white/15 hover:bg-slate-900/80"
          )}
        >
          {/* Rank */}
          <div
            className={cn(
              "shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-black border",
              style ? `${style.text} ${style.border}` : "text-zinc-600 border-white/10"
            )}
          >
            {rank < 3 ? (
              <motion.span
                className="text-base"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                {style!.medal}
              </motion.span>
            ) : (
              <span>#{rank + 1}</span>
            )}
          </div>

          {/* Image */}
          <div className="relative h-14 w-20 shrink-0 rounded-xl overflow-hidden">
            <Image
              src={water.imageUrl}
              alt={water.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="80px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-cyan-100 transition-colors">
              {water.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-zinc-500 text-xs">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{water.location}</span>
            </div>
            {topMeta && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className="mt-1.5 inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border"
                style={{
                  color: topMeta.color,
                  borderColor: `${topMeta.color}30`,
                  backgroundColor: `${topMeta.color}10`,
                }}
              >
                <span>{topMeta.emoji}</span>
                <span className="truncate max-w-[100px]">{topMeta.label}</span>
              </motion.div>
            )}
          </div>

          {/* Score desktop */}
          <div className="shrink-0 w-32 hidden sm:block">
            {water.totalRatings > 0 ? (
              <>
                <ScoreBar score={water.averageScore} />
                <div className="text-xs text-zinc-600 mt-1 text-right">
                  {water.totalRatings} rating{water.totalRatings !== 1 ? "s" : ""}
                </div>
              </>
            ) : (
              <div className="text-xs text-zinc-600 text-center">No ratings yet</div>
            )}
          </div>

          {/* Score mobile */}
          <div className="shrink-0 sm:hidden">
            {water.totalRatings > 0 ? (
              <div className="text-right">
                <div
                  className="text-lg font-black"
                  style={{
                    color: water.averageScore >= 4.5 ? "#22d3ee" : water.averageScore >= 3.5 ? "#34d399" : water.averageScore >= 2.5 ? "#fbbf24" : water.averageScore >= 1.5 ? "#f97316" : "#ef4444",
                  }}
                >
                  {water.averageScore.toFixed(1)}
                </div>
                <div className="text-xs text-zinc-600">/5</div>
              </div>
            ) : (
              <Droplets className="h-5 w-5 text-zinc-700" />
            )}
          </div>

          <motion.div
            className="shrink-0"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 + index * 0.3 }}
          >
            <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-cyan-400 transition-colors" />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [waters, setWaters] = useState<WaterCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      sort: sortBy,
      limit: "50",
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    });
    fetch(`/api/water?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setWaters(data.items ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [typeFilter, sortBy]);

  const topThree = waters.slice(0, 3).filter((w) => w.totalRatings > 0);

  return (
    <main className="min-h-screen bg-[#060d1f] text-white pt-14 md:pt-14">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-[500px] h-[400px] bg-yellow-500/3 rounded-full blur-3xl -translate-x-1/2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-0 w-[400px] h-[300px] bg-cyan-500/4 rounded-full blur-3xl translate-x-1/2"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className="h-10 w-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center"
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <Trophy className="h-5 w-5 text-yellow-400" />
            </motion.div>
            <motion.h1
              className="text-4xl font-black text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              Leaderboard
            </motion.h1>
          </div>
          <motion.p
            className="text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {total > 0 ? (
              <>
                <NumberTicker value={total} className="font-semibold text-white" /> water
                {total !== 1 ? "s" : ""} rated by the community
              </>
            ) : (
              "Be the first to submit and rate a water body!"
            )}
          </motion.p>
        </motion.div>

        {/* Top 3 podium */}
        <AnimatePresence>
          {sortBy === "score" && topThree.length === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="grid grid-cols-3 gap-3 mb-10"
            >
              {topThree.map((w, i) => {
                const meta = w.topRating ? RATING_META[w.topRating as WaterRating] : null;
                const s = RANK_STYLES[i];
                return (
                  <Link key={w._id} href={`/water/${w._id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                      whileHover={{ y: -5, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "rounded-2xl border p-3 text-center cursor-pointer bg-linear-to-b",
                        s.bg, s.border
                      )}
                    >
                      <motion.div
                        className="text-3xl mb-2"
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5, delay: i * 0.15 + 0.4 }}
                      >
                        {s.medal}
                      </motion.div>
                      <div className="relative h-16 w-full rounded-xl overflow-hidden mb-2">
                        <Image src={w.imageUrl} alt={w.name} fill className="object-cover transition-transform duration-500 hover:scale-110" sizes="120px" />
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{w.name}</p>
                      <motion.p
                        className={cn("text-lg font-black mt-1", s.text)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 400 }}
                      >
                        {w.averageScore.toFixed(1)}
                      </motion.p>
                      {meta && <span className="text-lg">{meta.emoji}</span>}
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 24 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map(({ value, label, emoji }, i) => (
                <motion.button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + i * 0.04, type: "spring", stiffness: 400 }}
                  whileHover={{ scale: 1.07, y: -1 }}
                  whileTap={{ scale: 0.93 }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                    typeFilter === value
                      ? "border-cyan-500/50 bg-cyan-500/15 text-white"
                      : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  )}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <TrendingUp className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="flex gap-2">
              {SORT_OPTIONS.map(({ value, label }) => (
                <motion.button
                  key={value}
                  onClick={() => setSortBy(value)}
                  whileHover={{ scale: 1.07, y: -1 }}
                  whileTap={{ scale: 0.93 }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                    sortBy === value
                      ? "border-cyan-500/50 bg-cyan-500/15 text-white"
                      : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  )}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* List */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="h-20 rounded-2xl bg-slate-900/50 border border-white/5"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </motion.div>
          ) : waters.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                🌊
              </motion.div>
              <h3 className="text-xl font-bold text-white">Nothing here yet</h3>
              <p className="mt-2 text-zinc-400 mb-8">Be the first to submit a water body!</p>
              <MovingBorderButton
                as={Link}
                href="/upload"
                containerClassName="h-12 w-44 rounded-xl mx-auto"
                className="gap-2 text-sm font-semibold text-white"
              >
                <Upload className="h-4 w-4" />
                Submit Water
              </MovingBorderButton>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {waters.map((w, i) => (
                <LeaderboardRow key={w._id} water={w} rank={i} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
