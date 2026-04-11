"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LogIn, MapPin, Upload, Star, Calendar, Trophy, Loader2,
} from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0";
import { cn } from "@/lib/utils";
import { type WaterCardData } from "@/components/WaterCard";
import { RATING_META, type WaterRating } from "@/lib/water-types";

// ── Types ─────────────────────────────────────────────────────────────────

interface ProfileRating {
  water: {
    _id: string;
    name: string;
    location: string;
    type: string;
    imageUrl: string;
  };
  rating: WaterRating;
  comment?: string;
  ratedAt: string;
}

interface ProfilePayload {
  user: {
    sub: string;
    name: string | null;
    email: string | null;
    picture: string | null;
  };
  uploads: WaterCardData[];
  ratings: ProfileRating[];
  stats: {
    uploadCount: number;
    ratingCount: number;
    memberSince: string | null;
  };
  taste: {
    averageGivenScore: number;
    distribution: Record<WaterRating, number>;
    favoriteType: string | null;
    title: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatMemberSince(iso: string | null): string {
  if (!iso) return "just joined";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60_000) return "just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function scoreColor(score: number): string {
  if (score >= 4.5) return "#22d3ee";
  if (score >= 3.5) return "#34d399";
  if (score >= 2.5) return "#fbbf24";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
}

// ── Sub-components ────────────────────────────────────────────────────────

function UploadCard({ water }: { water: WaterCardData }) {
  const color = water.totalRatings > 0 ? scoreColor(water.averageScore) : "#64748b";
  return (
    <Link
      href={`/water/${water._id}`}
      className="relative overflow-hidden bg-[#0a1628] aspect-square group"
    >
      <Image
        src={water.imageUrl}
        alt={water.name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="33vw"
      />
      {water.totalRatings > 0 && (
        <div
          className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-md border"
          style={{
            color,
            backgroundColor: `${color}28`,
            borderColor: `${color}55`,
          }}
        >
          {water.averageScore.toFixed(1)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/90 to-transparent">
        <p className="text-xs font-bold text-white truncate">{water.name}</p>
        <p className="text-[10px] text-zinc-400 truncate">📍 {water.location}</p>
      </div>
    </Link>
  );
}

function RatingRow({ entry }: { entry: ProfileRating }) {
  const meta = RATING_META[entry.rating];
  return (
    <Link
      href={`/water/${entry.water._id}`}
      className="flex gap-3 p-3 rounded-2xl bg-white/4 border border-white/6 hover:bg-white/8 hover:border-white/12 transition-all"
    >
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[#0a1628]">
        <Image
          src={entry.water.imageUrl}
          alt={entry.water.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-white truncate">{entry.water.name}</p>
          <span className="text-[10px] text-zinc-500 shrink-0">{formatRelative(entry.ratedAt)}</span>
        </div>
        <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3" />
          {entry.water.location}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
            style={{
              color: meta.color,
              borderColor: `${meta.color}40`,
              backgroundColor: `${meta.color}20`,
            }}
          >
            {meta.emoji} {meta.label}
          </span>
          {entry.comment && (
            <span className="text-[11px] text-zinc-400 italic truncate">
              &ldquo;{entry.comment}&rdquo;
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TasteCard({ taste, ratingCount }: { taste: ProfilePayload["taste"]; ratingCount: number }) {
  // Order the bar from best to worst — matches the rating scale's color gradient.
  const ORDER: WaterRating[] = [
    "dive_in_mouth_open",
    "swim_mouth_closed",
    "feet_only",
    "nope",
    "biohazard_speedrun",
  ];
  const total = Math.max(ratingCount, 1);

  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-500/10 via-cyan-500/5 to-sky-500/10 border border-violet-400/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-4 w-4 text-violet-300" />
        <h2 className="text-sm font-black uppercase tracking-wider text-violet-200">
          Your taste
        </h2>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-black text-white">{taste.title}</span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        {ratingCount > 0
          ? `You rate water ${taste.averageGivenScore.toFixed(1)} / 5 on average${
              taste.favoriteType ? ` · Favorite: ${taste.favoriteType}` : ""
            }`
          : "Rate some water to unlock your taste profile."}
      </p>

      {ratingCount > 0 && (
        <>
          {/* Distribution bar */}
          <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
            {ORDER.map((k) => {
              const pct = (taste.distribution[k] / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={k}
                  style={{ width: `${pct}%`, backgroundColor: RATING_META[k].color }}
                  title={`${RATING_META[k].label}: ${taste.distribution[k]}`}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-5 gap-1 mt-3">
            {ORDER.map((k) => (
              <div key={k} className="text-center">
                <div className="text-base">{RATING_META[k].emoji}</div>
                <div
                  className="text-[10px] font-bold"
                  style={{ color: RATING_META[k].color }}
                >
                  {taste.distribution[k]}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function MePage() {
  const { user, isLoading: userLoading } = useUser();
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for Auth0 to finish loading before deciding whether to fetch —
    // fetching while the session is still resolving will 401 and cause a
    // flicker on first paint.
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/me/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Profile fetch failed: ${r.status}`);
        return r.json();
      })
      .then((payload: ProfilePayload) => setData(payload))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, userLoading]);

  // ── Not signed in ──
  if (!userLoading && !user) {
    return (
      <main className="min-h-screen bg-[#0a1628] text-white pt-14 md:pt-16 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center py-16"
        >
          <div className="text-6xl mb-4">🏊</div>
          <h1 className="text-2xl font-black text-white mb-2">Your profile</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Sign in to see the water you&apos;ve submitted, the ratings you&apos;ve dropped,
            and your taste profile.
          </p>
          <a
            href="/auth/login?returnTo=/me"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-sky-100 bg-sky-500/20 border border-sky-400/30 hover:bg-sky-500/30 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </a>
        </motion.div>
      </main>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a1628] text-white pt-14 md:pt-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-sky-400 animate-spin" />
      </main>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#0a1628] text-white pt-14 md:pt-16 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🌊</div>
          <p className="text-sm text-zinc-400">Couldn&apos;t load your profile.</p>
          {error && <p className="text-[11px] text-zinc-600 mt-1">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a1628] text-white pt-14 md:pt-16 pb-24 md:pb-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Header ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          {data.user.picture ? (
            <Image
              src={data.user.picture}
              alt={data.user.name ?? "You"}
              width={72}
              height={72}
              className="rounded-full border-2 border-sky-400/40"
            />
          ) : (
            <div className="h-[72px] w-[72px] rounded-full bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center text-3xl">
              💧
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-white truncate">
              {data.user.name ?? "Water Connoisseur"}
            </h1>
            {data.user.email && (
              <p className="text-xs text-zinc-500 truncate">{data.user.email}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Upload className="h-3 w-3 text-sky-400" />
                <strong className="text-white">{data.stats.uploadCount}</strong> uploads
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400" />
                <strong className="text-white">{data.stats.ratingCount}</strong> ratings
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 text-zinc-500" />
                since {formatMemberSince(data.stats.memberSince)}
              </span>
            </div>
          </div>
        </motion.section>

        {/* ── Taste ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <TasteCard taste={data.taste} ratingCount={data.stats.ratingCount} />
        </motion.section>

        {/* ── Uploads ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-sky-200">
              Your water
            </h2>
            <span className="text-xs text-zinc-500">({data.uploads.length})</span>
          </div>
          {data.uploads.length === 0 ? (
            <div className="rounded-2xl bg-white/3 border border-white/6 p-8 text-center">
              <p className="text-sm text-zinc-400 mb-3">
                You haven&apos;t submitted any water yet.
              </p>
              <Link
                href="/forum"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200"
              >
                Submit your first →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5">
              {data.uploads.map((w) => (
                <UploadCard key={w._id} water={w} />
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Ratings timeline ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-yellow-200">
              Your ratings
            </h2>
            <span className="text-xs text-zinc-500">({data.ratings.length})</span>
          </div>
          {data.ratings.length === 0 ? (
            <div className="rounded-2xl bg-white/3 border border-white/6 p-8 text-center">
              <p className="text-sm text-zinc-400">
                You haven&apos;t rated any water yet. Find a spot you love (or hate)
                and drop a verdict.
              </p>
            </div>
          ) : (
            <div className={cn("flex flex-col gap-2")}>
              {data.ratings.map((r, i) => (
                <RatingRow key={`${r.water._id}-${r.ratedAt}-${i}`} entry={r} />
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
