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
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function LeaderboardRow({
  water,
  rank,
  index,
}: {
  water: WaterCardData;
  rank: number;
  index: number;
}) {
  const topMeta = water.topRating ? RATING_META[water.topRating as WaterRating] : null;
  const style = rank < 3 ? RANK_STYLES[rank] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/water/${water._id}`}>
        <div
          className={cn(
            "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200",
            "hover:scale-[1.01] hover:shadow-lg",
            style
              ? `bg-gradient-to-r ${style.bg} ${style.border}`
              : "border-white/8 bg-slate-900/50 hover:border-white/15 hover:bg-slate-900/80"
          )}
        >
          {/* Rank */}
          <div
            className={cn(
              "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-sm font-black",
              style ? `${style.text}` : "text-zinc-600",
              "border",
              style ? style.border : "border-white/10"
            )}
          >
            {rank < 3 ? (
              <span className="text-base">{style!.medal}</span>
            ) : (
              <span>#{rank + 1}</span>
            )}
          </div>

          {/* Image */}
          <div className="relative h-14 w-20 flex-shrink-0 rounded-xl overflow-hidden">
            <Image
              src={water.imageUrl}
              alt={water.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="80px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm leading-tight truncate">
              {water.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-zinc-500 text-xs">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{water.location}</span>
            </div>
            {topMeta && (
              <div
                className="mt-1.5 inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border"
                style={{
                  color: topMeta.color,
                  borderColor: `${topMeta.color}30`,
                  backgroundColor: `${topMeta.color}10`,
                }}
              >
                <span>{topMeta.emoji}</span>
                <span className="truncate max-w-[100px]">{topMeta.label}</span>
              </div>
            )}
          </div>

          {/* Score */}
          <div className="flex-shrink-0 w-32 hidden sm:block">
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

          {/* Mobile score */}
          <div className="flex-shrink-0 sm:hidden">
            {water.totalRatings > 0 ? (
              <div className="text-right">
                <div
                  className="text-lg font-black"
                  style={{
                    color:
                      water.averageScore >= 4.5
                        ? "#22d3ee"
                        : water.averageScore >= 3.5
                        ? "#34d399"
                        : water.averageScore >= 2.5
                        ? "#fbbf24"
                        : water.averageScore >= 1.5
                        ? "#f97316"
                        : "#ef4444",
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

          <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
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

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-yellow-500/3 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[300px] bg-cyan-500/4 rounded-full blur-3xl translate-x-1/2" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-black text-white">Leaderboard</h1>
          </div>
          <p className="text-zinc-400">
            {total > 0 ? (
              <>
                <NumberTicker value={total} className="font-semibold text-white" /> water
                {total !== 1 ? "s" : ""} rated by the community
              </>
            ) : (
              "Be the first to submit and rate a water body!"
            )}
          </p>
        </motion.div>

        {/* Top 3 podium (when sorted by score) */}
        <AnimatePresence>
          {sortBy === "score" && topThree.length === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-3 gap-3 mb-10"
            >
              {topThree.map((w, i) => {
                const meta = w.topRating ? RATING_META[w.topRating as WaterRating] : null;
                const s = RANK_STYLES[i];
                return (
                  <Link key={w._id} href={`/water/${w._id}`}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className={cn(
                        "rounded-2xl border p-3 text-center cursor-pointer bg-gradient-to-b",
                        s.bg, s.border
                      )}
                    >
                      <div className="text-3xl mb-2">{s.medal}</div>
                      <div className="relative h-16 w-full rounded-xl overflow-hidden mb-2">
                        <Image src={w.imageUrl} alt={w.name} fill className="object-cover" sizes="120px" />
                      </div>
                      <p className="text-xs font-semibold text-white truncate">{w.name}</p>
                      <p className={cn("text-lg font-black mt-1", s.text)}>
                        {w.averageScore.toFixed(1)}
                      </p>
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Type filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                    typeFilter === value
                      ? "border-cyan-500/50 bg-cyan-500/15 text-white"
                      : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  )}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <TrendingUp className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <div className="flex gap-2">
              {SORT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                    sortBy === value
                      ? "border-cyan-500/50 bg-cyan-500/15 text-white"
                      : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : waters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🌊</div>
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
          <div className="flex flex-col gap-3">
            {waters.map((w, i) => (
              <LeaderboardRow key={w._id} water={w} rank={i} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
