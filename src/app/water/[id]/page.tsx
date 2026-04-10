"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Upload, MapPin, Calendar, ChevronLeft,
  MessageSquare, CheckCircle, Loader2, Users
} from "lucide-react";
import { FloatingNav } from "@/components/ui/floating-nav";
import { MovingBorderButton } from "@/components/ui/moving-border";
import { WaterRatingPicker, RatingBadge, ScoreDisplay } from "@/components/WaterRatingPicker";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Home", link: "/" },
  { name: "Leaderboard", link: "/leaderboard", icon: <Trophy className="h-3.5 w-3.5" /> },
  { name: "Submit Water", link: "/upload", icon: <Upload className="h-3.5 w-3.5" /> },
];

interface RatingEntry {
  rating: WaterRating;
  comment?: string;
  ratedAt: string;
}

interface WaterDetail {
  _id: string;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  description?: string;
  uploadedBy: string;
  ratings: RatingEntry[];
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  createdAt: string;
}

const TYPE_EMOJIS: Record<string, string> = {
  beach: "🏖️", ocean: "🌊", lake: "🏔️", river: "🌿", pond: "🦆",
};

function RatingDistribution({ ratings }: { ratings: RatingEntry[] }) {
  if (ratings.length === 0) return null;

  const counts = Object.fromEntries(
    Object.keys(RATING_META).map((k) => [k, 0])
  ) as Record<WaterRating, number>;

  for (const r of ratings) counts[r.rating]++;

  return (
    <div className="space-y-2.5">
      {(Object.keys(RATING_META) as WaterRating[]).map((key) => {
        const meta = RATING_META[key];
        const count = counts[key];
        const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;

        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-lg flex-shrink-0 w-7 text-center">{meta.emoji}</span>
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function RatingCommentCard({ entry, index }: { entry: RatingEntry; index: number }) {
  const meta = RATING_META[entry.rating];
  const date = new Date(entry.ratedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-white/8 bg-slate-900/50 p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-lg border"
          style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}15` }}
        >
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <span className="text-xs text-zinc-600">{date}</span>
          </div>
          {entry.comment && (
            <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{entry.comment}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function WaterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [water, setWater] = useState<WaterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Rating form state
  const [selectedRating, setSelectedRating] = useState<WaterRating | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/water/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) { setWater(data); setLoading(false); }
      })
      .catch(() => setLoading(false));
  }, [id]);

  const submitRating = async () => {
    if (!selectedRating) {
      setRatingError("Please select a rating tier.");
      return;
    }
    setRatingError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/water/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");

      // Update local state
      setWater((prev) =>
        prev
          ? {
              ...prev,
              averageScore: data.averageScore,
              totalRatings: data.totalRatings,
              topRating: data.topRating,
              ratings: [
                { rating: selectedRating, comment, ratedAt: new Date().toISOString() },
                ...prev.ratings,
              ],
            }
          : prev
      );
      setRatingSubmitted(true);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#060d1f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <p className="text-zinc-500 text-sm">Loading water data…</p>
        </div>
      </main>
    );
  }

  if (notFound || !water) {
    return (
      <main className="min-h-screen bg-[#060d1f] flex flex-col items-center justify-center text-white">
        <div className="text-7xl mb-6">💧</div>
        <h1 className="text-2xl font-bold">Water body not found</h1>
        <Link href="/" className="mt-6 text-cyan-400 hover:text-cyan-300">← Back to home</Link>
      </main>
    );
  }

  const createdDate = new Date(water.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#060d1f] text-white">
      <FloatingNav navItems={NAV_ITEMS} />

      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[320px] w-full">
        <Image
          src={water.imageUrl}
          alt={water.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#060d1f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060d1f]/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/leaderboard"
          className="absolute top-20 left-4 md:left-8 inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-sm text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Type badge */}
        <div className="absolute top-20 right-4 md:right-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-sm text-white">
          {TYPE_EMOJIS[water.type] ?? "💧"}{" "}
          <span className="capitalize">{water.type}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 -mt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title + meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                {water.name}
              </h1>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{water.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Submitted {createdDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>by {water.uploadedBy}</span>
                </div>
              </div>

              {water.topRating && (
                <div className="mt-4">
                  <RatingBadge rating={water.topRating} />
                  <span className="ml-2 text-xs text-zinc-600">community consensus</span>
                </div>
              )}

              {water.description && (
                <p className="mt-4 text-zinc-300 leading-relaxed text-sm rounded-xl border border-white/8 bg-slate-900/50 p-4">
                  {water.description}
                </p>
              )}
            </motion.div>

            {/* Rating distribution */}
            {water.totalRatings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/8 bg-slate-900/50 p-5"
              >
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Rating Breakdown</h2>
                <RatingDistribution ratings={water.ratings} />
              </motion.div>
            )}

            {/* Community ratings list */}
            {water.ratings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-300">
                    Community Ratings ({water.totalRatings})
                  </h2>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {water.ratings
                    .slice()
                    .reverse()
                    .map((entry, i) => (
                      <RatingCommentCard key={i} entry={entry} index={i} />
                    ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: score + rating form */}
          <div className="space-y-6">
            {/* Score card */}
            {water.totalRatings > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/8 bg-slate-900/50 p-6 text-center"
              >
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">
                  Community Score
                </p>
                <ScoreDisplay score={water.averageScore} totalRatings={water.totalRatings} />
              </motion.div>
            )}

            {/* Rating form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/8 bg-slate-900/50 p-5"
            >
              <h2 className="text-base font-bold text-white mb-5">
                {ratingSubmitted ? "Thanks for rating!" : "Rate This Water"}
              </h2>

              <AnimatePresence mode="wait">
                {ratingSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <CheckCircle className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">Rating submitted!</p>
                    {selectedRating && (
                      <div className="mt-3">
                        <RatingBadge rating={selectedRating} />
                      </div>
                    )}
                    <button
                      onClick={() => { setRatingSubmitted(false); setSelectedRating(null); setComment(""); }}
                      className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Rate again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <WaterRatingPicker
                      selected={selectedRating}
                      onSelect={setSelectedRating}
                    />

                    {/* Optional comment */}
                    <div className="mt-4">
                      <textarea
                        placeholder="Add a comment… (optional)"
                        maxLength={300}
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className={cn(
                          "w-full rounded-xl bg-slate-800/60 border border-white/10 px-3 py-2.5",
                          "text-sm text-white placeholder-zinc-600",
                          "focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                        )}
                      />
                      <div className="text-xs text-zinc-700 text-right mt-1">{comment.length}/300</div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {ratingError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-2 text-xs text-red-400"
                        >
                          {ratingError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <MovingBorderButton
                      as="button"
                      onClick={submitting ? undefined : submitRating}
                      disabled={submitting}
                      containerClassName="h-12 w-full rounded-xl mt-4"
                      className="gap-2 text-sm font-semibold text-white disabled:opacity-50"
                      duration={2500}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit Rating"
                      )}
                    </MovingBorderButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Share / more actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-2"
            >
              <Link
                href="/leaderboard"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <Trophy className="h-4 w-4 text-yellow-400" />
                View Full Leaderboard
              </Link>
              <Link
                href="/upload"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
              >
                <Upload className="h-4 w-4 text-cyan-400" />
                Submit Another Water
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
