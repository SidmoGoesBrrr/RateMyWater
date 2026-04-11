"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Upload, MapPin, Calendar, ChevronLeft,
  MessageSquare, CheckCircle, Loader2, Users, Sparkles,
  Umbrella, Waves, Mountain, Trees, Droplets, Droplet,
  type LucideIcon,
} from "lucide-react";
import { WaterRatingPicker, RatingBadge, ScoreDisplay, AppleEmoji } from "@/components/WaterRatingPicker";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { cn } from "@/lib/utils";

interface RatingEntry {
  rating: WaterRating;
  comment?: string;
  ratedAt: string;
}

interface RecommendedWater {
  _id: string;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  reason: "collaborative" | "similar_vibes";
  sharedRaters?: number;
  similarity?: number;
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

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  beach:  { icon: Umbrella, color: "#fbbf24" },
  ocean:  { icon: Waves,    color: "#22d3ee" },
  lake:   { icon: Mountain, color: "#818cf8" },
  river:  { icon: Trees,    color: "#34d399" },
  pond:   { icon: Droplets, color: "#60a5fa" },
};
const DEFAULT_TYPE_ICON = { icon: Droplet, color: "#94a3b8" };

function RatingDistribution({ ratings }: { ratings: RatingEntry[] }) {
  if (ratings.length === 0) return null;
  const counts = Object.fromEntries(
    Object.keys(RATING_META).map((k) => [k, 0])
  ) as Record<WaterRating, number>;
  for (const r of ratings) counts[r.rating]++;

  return (
    <div className="space-y-2.5">
      {(Object.keys(RATING_META) as WaterRating[]).map((key, i) => {
        const meta = RATING_META[key];
        const count = counts[key];
        const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
        return (
          <motion.div
            key={key}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
          >
            <AppleEmoji hex={meta.emojiHex} fallback={meta.emoji} size={20} className="shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{count}</span>
          </motion.div>
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
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
      whileHover={{ scale: 1.01, x: 2 }}
      className="rounded-xl border border-white/8 bg-slate-900/50 p-4"
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-lg border"
          style={{ borderColor: `${meta.color}30`, backgroundColor: `${meta.color}15` }}
          whileHover={{ scale: 1.15, rotate: 5 }}
        >
          <AppleEmoji hex={meta.emojiHex} fallback={meta.emoji} size={18} />
        </motion.div>
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

function RecommendationCard({ rec, index }: { rec: RecommendedWater; index: number }) {
  const { icon: Icon, color } = TYPE_ICONS[rec.type] ?? DEFAULT_TYPE_ICON;
  const isCollaborative = rec.reason === "collaborative";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 280, damping: 22 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="flex-shrink-0 w-48 rounded-2xl border border-white/8 bg-slate-900/70 overflow-hidden cursor-pointer"
    >
      <Link href={`/water/${rec._id}`} className="block">
        <div className="relative h-28 overflow-hidden">
          <Image
            src={rec.imageUrl}
            alt={rec.name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="192px"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/60" />
          {/* Reason chip */}
          <div
            className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm border"
            style={{
              color: isCollaborative ? "#22d3ee" : "#a78bfa",
              borderColor: isCollaborative ? "rgba(34,211,238,0.3)" : "rgba(167,139,250,0.3)",
              backgroundColor: isCollaborative ? "rgba(34,211,238,0.12)" : "rgba(167,139,250,0.12)",
            }}
          >
            {isCollaborative
              ? <><Users className="h-2.5 w-2.5" /> {rec.sharedRaters} shared</>
              : <><Sparkles className="h-2.5 w-2.5" /> Similar</>
            }
          </div>
          {/* Score badge */}
          <div className="absolute bottom-2 right-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-white tabular-nums">
            {rec.averageScore.toFixed(1)}
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className="h-3 w-3 shrink-0" style={{ color }} />
            <span className="text-[10px] text-zinc-500 capitalize">{rec.type}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-tight line-clamp-1">{rec.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {rec.location}
          </p>
          {rec.topRating && (
            <div className="mt-2">
              <RatingBadge rating={rec.topRating} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function RecommendationsSection({ waterId }: { waterId: string }) {
  const [recs, setRecs] = useState<RecommendedWater[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/water/${waterId}/recommendations`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRecs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [waterId]);

  if (!loading && recs.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 22 }}
      className="mt-10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-zinc-200">
          People who loved this also loved…
        </h2>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-[212px] rounded-2xl border border-white/8 bg-slate-900/40 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {recs.map((rec, i) => (
            <div key={rec._id} className="snap-start">
              <RecommendationCard rec={rec} index={i} />
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export default function WaterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [water, setWater] = useState<WaterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
    if (!selectedRating) { setRatingError("Please select a rating tier."); return; }
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
      setWater((prev) =>
        prev ? {
          ...prev,
          averageScore: data.averageScore,
          totalRatings: data.totalRatings,
          topRating: data.topRating,
          ratings: [{ rating: selectedRating, comment, ratedAt: new Date().toISOString() }, ...prev.ratings],
        } : prev
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
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-zinc-500 text-sm">Loading water data…</p>
        </motion.div>
      </main>
    );
  }

  if (notFound || !water) {
    return (
      <main className="min-h-screen bg-[#060d1f] flex flex-col items-center justify-center text-white">
        <motion.div
          className="text-7xl mb-6"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          💧
        </motion.div>
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
      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[320px] w-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src={water.imageUrl}
            alt={water.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-[#060d1f]" />
        <div className="absolute inset-0 bg-linear-to-r from-[#060d1f]/20 to-transparent" />

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          whileHover={{ x: -3 }}
          className="absolute top-20 left-4 md:left-8"
        >
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-sm text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </motion.div>

        {/* Type badge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
          className="absolute top-20 right-4 md:right-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-sm text-white flex items-center gap-1.5"
        >
          {(() => {
            const { icon: Icon, color } = TYPE_ICONS[water.type] ?? DEFAULT_TYPE_ICON;
            return <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />;
          })()}
          <span className="capitalize">{water.type}</span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 -mt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              <motion.h1
                className="text-4xl md:text-5xl font-black text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 300 }}
              >
                {water.name}
              </motion.h1>

              <motion.div
                className="flex items-center gap-4 mt-3 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.div
                  className="flex items-center gap-1.5 text-zinc-400 text-sm"
                  whileHover={{ scale: 1.05, x: 2 }}
                >
                  <MapPin className="h-4 w-4" />
                  <span>{water.location}</span>
                </motion.div>
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Submitted {createdDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>by {water.uploadedBy}</span>
                </div>
              </motion.div>

              <AnimatePresence>
                {water.topRating && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  >
                    <RatingBadge rating={water.topRating} />
                    <span className="ml-2 text-xs text-zinc-600">community consensus</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {water.description && (
                <motion.p
                  className="mt-4 text-zinc-300 leading-relaxed text-sm rounded-xl border border-white/8 bg-slate-900/50 p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {water.description}
                </motion.p>
              )}
            </motion.div>

            {/* Rating distribution */}
            {water.totalRatings > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 280 }}
                className="rounded-2xl border border-white/8 bg-slate-900/50 p-5"
              >
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Rating Breakdown</h2>
                <RatingDistribution ratings={water.ratings} />
              </motion.div>
            )}

            {/* Community ratings */}
            {water.ratings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 280 }}
              >
                <motion.div
                  className="flex items-center gap-2 mb-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 }}
                >
                  <MessageSquare className="h-4 w-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-300">
                    Community Ratings ({water.totalRatings})
                  </h2>
                </motion.div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {water.ratings.slice().reverse().map((entry, i) => (
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
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 22 }}
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
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, type: "spring", stiffness: 280, damping: 22 }}
              className="rounded-2xl border border-white/8 bg-slate-900/50 p-5"
            >
              <motion.h2
                className="text-base font-bold text-white mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
              >
                {ratingSubmitted ? "Thanks for rating!" : "Rate This Water"}
              </motion.h2>

              <AnimatePresence mode="wait">
                {ratingSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="text-center py-6"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    >
                      <CheckCircle className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
                    </motion.div>
                    <motion.p
                      className="text-white font-semibold"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Rating submitted!
                    </motion.p>
                    {selectedRating && (
                      <motion.div
                        className="mt-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <RatingBadge rating={selectedRating} />
                      </motion.div>
                    )}
                    <motion.button
                      onClick={() => { setRatingSubmitted(false); setSelectedRating(null); setComment(""); }}
                      whileHover={{ scale: 1.05, color: "#d4d4d8" }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-4 text-xs text-zinc-500 transition-colors"
                    >
                      Rate again
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <WaterRatingPicker selected={selectedRating} onSelect={setSelectedRating} />

                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.textarea
                        whileFocus={{ scale: 1.01, borderColor: "rgba(34,211,238,0.5)" }}
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
                    </motion.div>

                    <AnimatePresence>
                      {ratingError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-2 text-xs text-red-400"
                        >
                          {ratingError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.button
                      onClick={submitting ? undefined : submitRating}
                      disabled={submitting}
                      whileHover={!submitting ? { scale: 1.02, boxShadow: "0 0 24px rgba(34,211,238,0.35)" } : {}}
                      whileTap={!submitting ? { scale: 0.97 } : {}}
                      className="mt-4 w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                      <AnimatePresence mode="wait">
                        {submitting ? (
                          <motion.span key="loading" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting…
                          </motion.span>
                        ) : (
                          <motion.span key="idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                            Submit Rating
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 280 }}
              className="flex flex-col gap-2"
            >
              {[
                { href: "/leaderboard", icon: <Trophy className="h-4 w-4 text-yellow-400" />, label: "View Full Leaderboard" },
                { href: "/upload", icon: <Upload className="h-4 w-4 text-cyan-400" />, label: "Submit Another Water" },
              ].map(({ href, icon, label }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.32 + i * 0.07, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.02, x: 3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    href={href}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {icon}
                    {label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Recommendations — lazy loaded below the main grid */}
        <RecommendationsSection waterId={id} />
      </div>
    </main>
  );
}
