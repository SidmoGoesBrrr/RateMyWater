"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Droplets } from "lucide-react";
import { WaterCard, type WaterCardData } from "@/components/WaterCard";
import { cn } from "@/lib/utils";

const QUICK_FILTERS = [
  { label: "All", value: "" },
  { label: "Beach 🏖️", value: "beach" },
  { label: "Ocean 🌊", value: "ocean" },
  { label: "Lake 🏔️", value: "lake" },
  { label: "River 🌿", value: "river" },
  { label: "Pond 🦆", value: "pond" },
];

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

  useEffect(() => { filter(); }, [filter]);

  return (
    <main className="min-h-screen bg-[#060d1f] text-white pt-14 md:pt-14">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pb-10">
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search water bodies, locations, users…"
            autoFocus
            className="w-full rounded-2xl bg-slate-900/80 border border-white/10 pl-12 pr-12 py-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick type filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
          {QUICK_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={cn(
                "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all",
                typeFilter === value
                  ? "border-cyan-500/50 bg-cyan-500/15 text-white"
                  : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="text-xs text-zinc-600 mb-4">
          {loading ? "Loading…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
          {query && <span className="text-zinc-500"> for &ldquo;{query}&rdquo;</span>}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Droplets className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white">No results found</h3>
              <p className="mt-2 text-zinc-500 text-sm">
                {query ? `Nothing matches "${query}"` : "No water bodies match your filters"}
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((w) => (
              <WaterCard key={w._id} water={w} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
