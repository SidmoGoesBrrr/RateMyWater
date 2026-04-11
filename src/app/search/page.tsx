"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Search, MapPin, Umbrella, Waves, Mountain, Trees, Droplets, Droplet, type LucideIcon } from "lucide-react";
import { type WaterCardData } from "@/components/WaterCard";
import { RATING_META } from "@/lib/water-types";
import { AppleEmoji } from "@/components/WaterRatingPicker";
import { cn } from "@/lib/utils";

const QUICK_FILTERS: Array<{ label: string; value: string; icon: LucideIcon; color: string }> = [
  { label: "All",   value: "",      icon: Droplet,  color: "#94a3b8" },
  { label: "Beach", value: "beach", icon: Umbrella, color: "#fbbf24" },
  { label: "Ocean", value: "ocean", icon: Waves,    color: "#22d3ee" },
  { label: "Lake",  value: "lake",  icon: Mountain, color: "#818cf8" },
  { label: "River", value: "river", icon: Trees,    color: "#34d399" },
  { label: "Pond",  value: "pond",  icon: Droplets, color: "#60a5fa" },
];

function WaterQuestionMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M18 22C18 8 46 8 46 22C46 34 32 36 32 42L32 48"
        stroke="#38bdf8"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 51C36 55 37 57 37 59A5 5 0 0 1 27 59C27 57 28 55 32 51Z"
        fill="#38bdf8"
      />
    </svg>
  );
}

function getScoreColor(score: number) {
  if (score >= 4.5) return "#22d3ee";
  if (score >= 3.5) return "#34d399";
  if (score >= 2.5) return "#fbbf24";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
}

// Minimal autocomplete suggestion row
function Suggestion({
  water,
  onSelect,
}: {
  water: WaterCardData;
  onSelect: (w: WaterCardData) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(water)}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors text-left"
    >
      <div className="relative h-9 w-12 shrink-0 rounded-lg overflow-hidden">
        <Image src={water.imageUrl} alt={water.name} fill className="object-cover" sizes="48px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{water.name}</p>
        <p className="text-xs text-zinc-500 truncate">{water.location}</p>
      </div>
      <span className="shrink-0 text-xs text-zinc-600 capitalize">{water.type}</span>
    </button>
  );
}

function GridCard({ water, index }: { water: WaterCardData; index: number }) {
  const [hovered, setHovered] = useState(false);
  const topMeta = water.topRating ? RATING_META[water.topRating] : null;
  const scoreColor = water.totalRatings > 0 ? getScoreColor(water.averageScore) : "#64748b";

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
        <Image
          src={water.imageUrl}
          alt={water.name}
          fill
          className={cn("object-cover transition-transform duration-500", hovered && "scale-[1.05]")}
          sizes="25vw"
        />
        {water.totalRatings > 0 && (
          <div
            className="absolute top-2 right-2 z-20 text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-md border"
            style={{ color: scoreColor, backgroundColor: `${scoreColor}28`, borderColor: `${scoreColor}55` }}
          >
            {water.averageScore.toFixed(1)}
          </div>
        )}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-linear-to-t from-black/92 via-black/55 to-transparent" />
          <div className="relative z-10 px-3 pb-3">
            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/85 border border-white/15 mb-1.5">
              {water.type.charAt(0).toUpperCase() + water.type.slice(1)}
            </span>
            <p className="font-bold text-white text-sm leading-snug truncate">{water.name}</p>
            <p className="text-zinc-300 text-[11px] mt-0.5 truncate flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5 shrink-0 text-zinc-500" />
              {water.location}
            </p>
            {topMeta && (
              <div
                className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold border"
                style={{ color: topMeta.color, borderColor: `${topMeta.color}40`, backgroundColor: `${topMeta.color}20` }}
              >
                <AppleEmoji hex={topMeta.emojiHex} fallback={topMeta.emoji} size={10} />
                {topMeta.label}
              </div>
            )}
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[9px] text-zinc-400">by {water.uploadedBy}</p>
              {water.totalRatings > 0 && (
                <p className="text-[9px] text-zinc-400">{water.totalRatings} rating{water.totalRatings !== 1 ? "s" : ""}</p>
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
  const [committed, setCommitted] = useState(""); // query actually searched
  const [typeFilter, setTypeFilter] = useState("");
  const [suggestions, setSuggestions] = useState<WaterCardData[]>([]);
  const [results, setResults] = useState<WaterCardData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout>>(null!);

  // Load top rated on mount as default grid
  useEffect(() => {
    fetch(`/api/search?limit=50${typeFilter ? `&type=${typeFilter}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setResults(d.items ?? []); setInitialLoaded(true); })
      .catch(() => setInitialLoaded(true));
  }, [typeFilter]);

  // Debounced autocomplete — fires 200ms after typing stops
  useEffect(() => {
    clearTimeout(suggestTimer.current);
    if (!query.trim()) { setSuggestions([]); setShowSuggestions(false); return; }

    suggestTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, autocomplete: "1", limit: "6" });
        if (typeFilter) params.set("type", typeFilter);
        const r = await fetch(`/api/search?${params}`);
        const d = await r.json();
        setSuggestions(d.items ?? []);
        setShowSuggestions(true);
      } catch { /* ignore */ }
    }, 200);

    return () => clearTimeout(suggestTimer.current);
  }, [query, typeFilter]);

  // Full search — committed on Enter or suggestion click
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setCommitted(q);
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: "50" });
      if (typeFilter) params.set("type", typeFilter);
      const r = await fetch(`/api/search?${params}`);
      const d = await r.json();
      setResults(d.items ?? []);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, [typeFilter]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); runSearch(query); }
    if (e.key === "Escape") { setShowSuggestions(false); }
  };

  const handleSuggestionSelect = (w: WaterCardData) => {
    setQuery(w.name);
    setShowSuggestions(false);
    runSearch(w.name);
  };

  const clearQuery = () => {
    setQuery("");
    setCommitted("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-[#082232] text-white pt-14 md:pt-16 overflow-x-hidden">
      {/* ── Sticky search header ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-[#082232]/96 backdrop-blur-xl border-b border-white/6 px-4 py-3">
        <div className="max-w-5xl mx-auto space-y-3">

          {/* Search bar + suggestion dropdown */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search water bodies, locations…"
              autoFocus
              className="w-full rounded-2xl bg-white/6 border border-white/8 pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/40 focus:bg-white/9 transition-all"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={clearQuery}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border border-white/10 bg-[#0a1a2e]/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="py-1">
                    {suggestions.map((w) => (
                      <Suggestion key={w._id} water={w} onSelect={handleSuggestionSelect} />
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-white/6 text-[10px] text-zinc-600">
                    Press <kbd className="px-1 py-0.5 rounded bg-white/8 text-zinc-500">↵ Enter</kbd> to search all results
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_FILTERS.map(({ label, value, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all duration-200",
                  typeFilter === value
                    ? "border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-sm shadow-sky-500/10"
                    : "border-white/8 bg-white/4 text-zinc-400 hover:border-white/18 hover:text-white hover:bg-white/8"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: typeFilter === value ? "currentColor" : color }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results grid ── */}
      <div className="w-full px-0 pt-0 pb-24 md:pb-4">
        {committed && !searching && (
          <div className="flex items-center gap-2 px-4 py-2">
            <p className="text-xs text-zinc-600">
              {results.length} result{results.length !== 1 ? "s" : ""}{" "}
              <span className="text-zinc-500">for &ldquo;{committed}&rdquo;</span>
            </p>
          </div>
        )}

        {!initialLoaded || searching ? (
          <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white/4 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24 px-4">
            <div className="flex justify-center mb-4"><WaterQuestionMark /></div>
            <h3 className="text-lg font-bold text-white">No results found</h3>
            <p className="mt-2 text-zinc-500 text-sm">
              {committed ? `Nothing matches "${committed}"` : "No water bodies match your filters"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${committed}-${typeFilter}`}
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
