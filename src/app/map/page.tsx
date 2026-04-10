"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Search, Filter, Navigation, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MapWaterEntry } from "@/components/GoogleMapView";

// Dynamically import the map to avoid SSR issues
const GoogleMapView = dynamic(
  () => import("@/components/GoogleMapView").then((m) => m.GoogleMapView),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        <p className="text-zinc-500 text-sm">Loading 3D Map…</p>
      </div>
    </div>
  )}
);

const TYPE_OPTIONS = [
  { value: "all", label: "All", emoji: "💧" },
  { value: "beach", label: "Beach", emoji: "🏖️" },
  { value: "ocean", label: "Ocean", emoji: "🌊" },
  { value: "lake", label: "Lake", emoji: "🏔️" },
  { value: "river", label: "River", emoji: "🌿" },
  { value: "pond", label: "Pond", emoji: "🦆" },
];

export default function MapPage() {
  const [waters, setWaters] = useState<MapWaterEntry[]>([]);
  const [filtered, setFiltered] = useState<MapWaterEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMode, setMapMode] = useState<"roadmap" | "satellite">("roadmap");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/water?limit=100&sort=score")
      .then((r) => r.json())
      .then((d) => {
        setWaters(d.items ?? []);
        setFiltered(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = waters;
    if (typeFilter !== "all") list = list.filter((w) => w.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.location.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [typeFilter, search, waters]);

  const locateMe = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Compute map center
  const mapCenter = userCenter ??
    (filtered.find((w) => w.coordinates)?.coordinates) ??
    { lat: 20, lng: 0 };

  const mapZoom = userCenter ? 10 : filtered.length > 0 && filtered[0].coordinates ? 5 : 3;

  return (
    <main className="h-screen bg-[#060d1f] flex flex-col pt-14 md:pt-14">
      {/* ── Top Controls ─────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search water bodies on map…"
            className="w-full max-w-lg rounded-xl bg-slate-900/80 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          {TYPE_OPTIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                typeFilter === value
                  ? "border-cyan-500/50 bg-cyan-500/15 text-white"
                  : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
              )}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}

          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            {/* Locate me */}
            <button
              onClick={locateMe}
              title="Center on my location"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-white/10 bg-slate-900/40 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            >
              <Navigation className="h-3.5 w-3.5" />
              Locate Me
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
          <span>
            {loading ? "Loading…" : `${filtered.filter((w) => w.coordinates).length} of ${filtered.length} pins visible`}
          </span>
          <span className="text-zinc-700">
            {filtered.length - filtered.filter((w) => w.coordinates).length} need location data
          </span>
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────── */}
      <div className="flex-1 px-4 pb-4 md:pb-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full"
        >
          <GoogleMapView
            waters={filtered}
            center={mapCenter}
            zoom={mapZoom}
            mode="full"
          />
        </motion.div>
      </div>

      {/* ── Legend ───────────────────────────────────────── */}
      <div className="fixed bottom-20 md:bottom-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-xs">
        <div className="text-zinc-500 font-medium mb-1">Score Key</div>
        {[
          { color: "#22d3ee", label: "4.5–5.0" },
          { color: "#34d399", label: "3.5–4.4" },
          { color: "#fbbf24", label: "2.5–3.4" },
          { color: "#f97316", label: "1.5–2.4" },
          { color: "#ef4444", label: "0–1.4" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: `${color}30`, borderColor: color }} />
            <span className="text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
