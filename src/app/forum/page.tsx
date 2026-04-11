"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@auth0/nextjs-auth0";
import {
  Plus, X, User, Loader2, MapPin, MessageSquare, Star, LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { WaterComposer, type CreatedWaterBody } from "@/components/WaterComposer";

// ── Types ──────────────────────────────────────────────────────────────────

interface WaterBody {
  _id: string;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  description?: string;
  uploadedBy: string;
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  commentCount?: number;
}

interface FeedResponse {
  items: WaterBody[];
  nextCursor: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Feed card (Reddit-style: title top, image middle, stats bottom) ────────

function FeedCard({ water }: { water: WaterBody }) {
  const topMeta = water.topRating ? RATING_META[water.topRating] : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-slate-900/50 overflow-hidden hover:border-white/15 transition-colors"
    >
      <Link href={`/water/${water._id}`} className="block">
        {/* Header row: author + timestamp + location */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2 text-xs text-zinc-500">
          <div className="h-6 w-6 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
            <User className="h-3 w-3 text-cyan-500" />
          </div>
          <span className="text-zinc-400 font-medium">{water.uploadedBy}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600">{timeAgo(water.createdAt)}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600 flex items-center gap-0.5 truncate">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{water.location}</span>
          </span>
        </div>

        {/* Title (Reddit-style) */}
        <h2 className="px-4 pb-3 text-lg font-bold text-white leading-tight">
          {water.name}
        </h2>

        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-slate-950">
          <Image
            src={water.imageUrl}
            alt={water.name}
            fill
            sizes="(max-width: 672px) 100vw, 672px"
            className="object-cover"
          />
          {/* Top rating badge overlaid on image */}
          {topMeta && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md"
              style={{
                backgroundColor: "#0a1628",
                borderColor: `${topMeta.color}70`,
                borderWidth: 1,
                color: topMeta.color,
              }}
            >
              <span>{topMeta.emoji}</span>
              <span>{topMeta.label}</span>
            </div>
          )}
        </div>

        {/* Description preview */}
        {water.description && (
          <p className="px-4 pt-3 text-sm text-zinc-300 line-clamp-2 leading-relaxed">
            {water.description}
          </p>
        )}

        {/* Stats footer: ratings + comments */}
        <div className="px-4 py-3 flex items-center gap-5 text-xs text-zinc-500 border-t border-white/5 mt-3">
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-cyan-500" />
            <span className="text-zinc-400 font-semibold">
              {water.totalRatings}
            </span>
            <span>{water.totalRatings === 1 ? "rating" : "ratings"}</span>
            {water.totalRatings > 0 && (
              <span className="text-zinc-600 ml-0.5">
                · {water.averageScore.toFixed(1)}/5
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-cyan-500" />
            <span className="text-zinc-400 font-semibold">
              {water.commentCount ?? 0}
            </span>
            <span>{water.commentCount === 1 ? "comment" : "comments"}</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

// ── Composer modal wrapper ─────────────────────────────────────────────────

function ComposerModal({
  open,
  onClose,
  onSubmitted,
  defaultAuthorName,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (water: CreatedWaterBody) => void;
  defaultAuthorName?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-2xl border border-cyan-500/20 bg-[#060d1f] p-5 shadow-2xl shadow-cyan-500/10 my-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
            <h2 className="text-xl font-black text-white mb-1">Submit Water</h2>
            <p className="text-xs text-zinc-500 mb-5">
              Help the community know what they&apos;re getting into.
            </p>
            <WaterComposer
              defaultAuthorName={defaultAuthorName}
              onSubmitted={onSubmitted}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Forum page ─────────────────────────────────────────────────────────────

export default function ForumPage() {
  const { user, isLoading: userLoading } = useUser();
  const [items, setItems] = useState<WaterBody[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [composing, setComposing] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "15" });
      if (cursor) params.set("cursor", cursor);
      const r = await fetch(`/api/water?${params.toString()}`);
      if (!r.ok) throw new Error("fetch failed");
      const data: FeedResponse = await r.json();
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const fresh = data.items.filter((p) => !seen.has(p._id));
        return [...prev, ...fresh];
      });
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [cursor, hasMore, loading]);

  // Initial load.
  useEffect(() => {
    if (!initialLoaded) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver for infinite scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "800px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleNewPostClick = () => {
    if (userLoading) return;
    if (!user) {
      window.location.href = "/auth/login?returnTo=/forum";
      return;
    }
    setComposing(true);
  };

  const handleSubmitted = (water: CreatedWaterBody) => {
    setItems((prev) => [water as unknown as WaterBody, ...prev]);
    setComposing(false);
  };

  return (
    <main className="min-h-screen bg-[#082232] text-white pt-16">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Feed</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fresh water bodies, freshly rated
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewPostClick}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
          >
            <Plus className="h-4 w-4" />
            Submit Water
          </button>
        </div>

        {/* Unauthenticated CTA */}
        {!userLoading && !user && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-slate-900/40 px-4 py-3">
            <p className="text-xs text-zinc-400">
              Sign in to submit water bodies and rate them.
            </p>
            <a
              href="/auth/login?returnTo=/forum"
              className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </a>
          </div>
        )}

        {/* Composer modal */}
        <ComposerModal
          open={composing}
          onClose={() => setComposing(false)}
          onSubmitted={handleSubmitted}
          defaultAuthorName={user?.name ?? undefined}
        />

        {/* Feed */}
        {!initialLoaded ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💧</div>
            <h3 className="text-lg font-bold text-white">No water yet</h3>
            <p className="mt-2 text-zinc-500 text-sm mb-6">
              Be the first to submit a water body!
            </p>
            <button
              type="button"
              onClick={handleNewPostClick}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold px-5 py-2.5 text-sm hover:bg-cyan-500/25 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Submit Water
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((water) => (
              <FeedCard key={water._id} water={water} />
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel */}
        {initialLoaded && hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-8">
            {loading && <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />}
          </div>
        )}

        {initialLoaded && !hasMore && items.length > 0 && (
          <p className="text-center text-xs text-zinc-600 py-8">
            You&apos;ve reached the bottom.
          </p>
        )}
      </div>
    </main>
  );
}
