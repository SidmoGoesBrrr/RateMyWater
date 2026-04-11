"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { type WaterCardData } from "@/components/WaterCard";
import { RATING_META } from "@/lib/water-types";
import { cn } from "@/lib/utils";

const QUICK_FILTERS = [
  { label: "All", value: "" },
  { label: "Beach 🏖️", value: "beach" },
  { label: "Ocean 🌊", value: "ocean" },
  { label: "Lake 🏔️", value: "lake" },
  { label: "River 🌿", value: "river" },
  { label: "Pond 🦆", value: "pond" },
];

function getScoreColor(score: number) {
  if (score >= 4.5) return "#22d3ee";
  if (score >= 3.5) return "#34d399";
  if (score >= 2.5) return "#fbbf24";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
}

function GridCard({
  water,
  index,
}: {
  water: WaterCardData;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const topMeta = water.topRating ? RATING_META[water.topRating] : null;
  const scoreColor =
    water.totalRatings > 0 ? getScoreColor(water.averageScore) : "#64748b";

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay: Math.min(index * 0.04, 0.5) } },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden cursor-pointer bg-[#082232] aspect-square"
    >
      <Link href={`/water/${water._id}`} className="absolute inset-0">
        {/* Photo */}
        <Image
          src={water.imageUrl}
          alt={water.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500",
            hovered && "scale-[1.05]"
          )}
          sizes="25vw"
        />

        {/* Score badge — top right, always visible */}
        {water.totalRatings > 0 && (
          <div
            className="absolute top-2 right-2 z-20 text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-md border"
            style={{
              color: scoreColor,
              backgroundColor: `${scoreColor}28`,
              borderColor: `${scoreColor}55`,
            }}
          >
            {water.averageScore.toFixed(1)}
          </div>
        )}

        {/* Hover overlay — React-controlled opacity */}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          {/* Dark gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-black/92 via-black/55 to-transparent" />

          {/* Info content */}
          <div className="relative z-10 px-3 pb-3">
            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/85 border border-white/15 mb-1.5">
              {water.type.charAt(0).toUpperCase() + water.type.slice(1)}
            </span>
            <p className="font-bold text-white text-sm leading-snug truncate">
              {water.name}
            </p>
            <p className="text-zinc-300 text-[11px] mt-0.5 truncate">
              📍 {water.location}
            </p>
            {topMeta && (
              <div
                className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold border"
                style={{
                  color: topMeta.color,
                  borderColor: `${topMeta.color}40`,
                  backgroundColor: `${topMeta.color}20`,
                }}
              >
                {topMeta.emoji} {topMeta.label}
              </div>
            )}
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[9px] text-zinc-400">by {water.uploadedBy}</p>
              {water.totalRatings > 0 && (
                <p className="text-[9px] text-zinc-400">
                  {water.totalRatings} rating{water.totalRatings !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [results, setResults] = useState<WaterCardData[]>([]);
  const [all, setAll] = useState<WaterCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/water?limit=100&sort=score")
      .then((r) => r.json())
      .then((d) => {
        setAll(d.items ?? []);
        setResults(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filter = useCallback(() => {
    let list = all;
    if (typeFilter) list = list.filter((w) => w.type === typeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.location.toLowerCase().includes(q) ||
          w.uploadedBy.toLowerCase().includes(q)
      );
    }
    setResults(list);
  }, [all, query, typeFilter]);

  useEffect(() => {
    filter();
  }, [filter]);

  return (
    <main className="min-h-screen bg-[#082232] text-white pt-14 md:pt-16 overflow-x-hidden">
      {/* ── Sticky search header ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-[#082232]/96 backdrop-blur-xl border-b border-white/6 px-4 py-3">
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search water bodies, locations, users…"
              autoFocus
              className="w-full rounded-2xl bg-white/6 border border-white/8 pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/40 focus:bg-white/9 transition-all"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all duration-200",
                  typeFilter === value
                    ? "border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-sm shadow-sky-500/10"
                    : "border-white/8 bg-white/4 text-zinc-400 hover:border-white/18 hover:text-white hover:bg-white/8"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Explore grid ── */}
      <div className="w-full px-0 pt-0 pb-24 md:pb-4">
        {/* Result count row */}
        {!loading && results.length > 0 && (
          <p className="text-xs text-zinc-600 px-4 py-2">
            {results.length} result{results.length !== 1 ? "s" : ""}
            {query && (
              <span className="text-zinc-500"> for &ldquo;{query}&rdquo;</span>
            )}
          </p>
        )}

        {loading ? (
          /* Skeleton — mimic the tall pattern */
          <div
            className="grid grid-cols-4 gap-0.5"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white/4 animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 px-4"
          >
            <div className="text-5xl mb-4">🌊</div>
            <h3 className="text-lg font-bold text-white">No results found</h3>
            <p className="mt-2 text-zinc-500 text-sm">
              {query
                ? `Nothing matches "${query}"`
                : "No water bodies match your filters"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${query}-${typeFilter}`}
            className="grid grid-cols-4 gap-0.5"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {results.map((w, i) => (
              <GridCard key={w._id} water={w} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
