/**
 * Recommendation engine — two modes:
 *
 * 1. Collaborative filtering (primary)
 *    Find deviceIds who gave THIS spot a high rating, then find other spots
 *    those same devices also rated highly. Ranked by shared-rater count.
 *    Requires at least 2 shared raters; falls back to feature similarity otherwise.
 *
 * 2. Feature-vector similarity (fallback)
 *    Build an 11-dim vector per spot:
 *      [avgScore/5, %dive_in, %swim, %feet, %nope, %biohazard, type×5 one-hot]
 *    Rank all other spots by cosine similarity to the source spot.
 *    Works immediately on existing data — no user identity required.
 *
 * Both modes are M0-compatible (no Atlas Vector Search needed).
 */

import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import WaterBody from "@/models/WaterBody";
import { type WaterRating } from "@/lib/water-types";

// ── Types ─────────────────────────────────────────────────────────────────────

type RatingEntry = { rating: WaterRating; deviceId?: string };

type WaterLean = {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  ratings: RatingEntry[];
};

export type RecommendedWater = {
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
};

// ── Constants ─────────────────────────────────────────────────────────────────

/** Ratings that count as "loved it" for collaborative filtering. */
const LOVED: WaterRating[] = ["dive_in_mouth_open", "swim_mouth_closed"];

const RATING_KEYS: WaterRating[] = [
  "dive_in_mouth_open",
  "swim_mouth_closed",
  "feet_only",
  "nope",
  "biohazard_speedrun",
];

const WATER_TYPES = ["beach", "ocean", "lake", "river", "pond"] as const;

/** Minimum shared raters before we trust the collaborative signal. */
const MIN_SHARED_RATERS = 2;

// ── Feature vector ────────────────────────────────────────────────────────────

function buildVector(water: WaterLean): number[] {
  const total = Math.max(water.totalRatings, 1);
  const counts = Object.fromEntries(RATING_KEYS.map((k) => [k, 0])) as Record<WaterRating, number>;
  for (const r of water.ratings) counts[r.rating] = (counts[r.rating] || 0) + 1;

  return [
    water.averageScore / 5,
    ...RATING_KEYS.map((k) => counts[k] / total),
    ...WATER_TYPES.map((t) => (water.type === t ? 1 : 0)),
  ];
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ── Algorithm 1: Collaborative filtering ─────────────────────────────────────

async function collaborativeRecs(
  oid: mongoose.Types.ObjectId,
  source: WaterLean,
  limit: number,
): Promise<RecommendedWater[]> {
  const coRaterIds = [
    ...new Set(
      source.ratings
        .filter((r) => LOVED.includes(r.rating) && r.deviceId)
        .map((r) => r.deviceId as string),
    ),
  ];

  if (coRaterIds.length < MIN_SHARED_RATERS) return [];

  const results = await WaterBody.aggregate<
    WaterLean & { sharedRaters: number }
  >([
    {
      $match: {
        _id: { $ne: oid },
        ratings: {
          $elemMatch: {
            deviceId: { $in: coRaterIds },
            rating: { $in: LOVED },
          },
        },
      },
    },
    {
      $addFields: {
        sharedRaters: {
          $size: {
            $filter: {
              input: "$ratings",
              as: "r",
              cond: {
                $and: [
                  { $in: ["$$r.deviceId", coRaterIds] },
                  { $in: ["$$r.rating", LOVED] },
                ],
              },
            },
          },
        },
      },
    },
    { $sort: { sharedRaters: -1, averageScore: -1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        location: 1,
        type: 1,
        imageUrl: 1,
        averageScore: 1,
        totalRatings: 1,
        topRating: 1,
        sharedRaters: 1,
      },
    },
  ]);

  return results.map((r) => ({
    _id: r._id.toString(),
    name: r.name,
    location: r.location,
    type: r.type,
    imageUrl: r.imageUrl,
    averageScore: r.averageScore,
    totalRatings: r.totalRatings,
    topRating: r.topRating,
    reason: "collaborative" as const,
    sharedRaters: r.sharedRaters,
  }));
}

// ── Algorithm 2: Feature-vector similarity ────────────────────────────────────

async function featureVectorRecs(
  oid: mongoose.Types.ObjectId,
  source: WaterLean,
  limit: number,
): Promise<RecommendedWater[]> {
  const others = await WaterBody.find(
    { _id: { $ne: oid }, totalRatings: { $gt: 0 } },
    { name: 1, location: 1, type: 1, imageUrl: 1, averageScore: 1, totalRatings: 1, topRating: 1, ratings: 1 },
  ).lean() as WaterLean[];

  const srcVec = buildVector(source);

  return others
    .map((w) => ({ w, sim: cosine(srcVec, buildVector(w)) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit)
    .map(({ w, sim }) => ({
      _id: w._id.toString(),
      name: w.name,
      location: w.location,
      type: w.type,
      imageUrl: w.imageUrl,
      averageScore: w.averageScore,
      totalRatings: w.totalRatings,
      topRating: w.topRating,
      reason: "similar_vibes" as const,
      similarity: Math.round(sim * 100) / 100,
    }));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns up to `limit` recommended water bodies for a given water body ID.
 * Tries collaborative filtering first; falls back to feature-vector similarity.
 */
export async function getRecommendations(
  waterBodyId: string,
  limit = 5,
): Promise<RecommendedWater[]> {
  await connectDB();

  const oid = new mongoose.Types.ObjectId(waterBodyId);

  const source = await WaterBody.findById(
    oid,
    { name: 1, type: 1, ratings: 1, averageScore: 1, totalRatings: 1 },
  ).lean() as WaterLean | null;

  if (!source) return [];

  // Try collaborative first — if enough shared raters exist, prefer it.
  const collab = await collaborativeRecs(oid, source, limit);
  if (collab.length >= MIN_SHARED_RATERS) return collab;

  // Fallback: feature-vector cosine similarity.
  return featureVectorRecs(oid, source, limit);
}
