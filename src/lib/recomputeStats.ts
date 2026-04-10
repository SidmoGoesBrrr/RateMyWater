import mongoose from "mongoose";
import { Rating } from "@/models/Rating";
import { Spot } from "@/models/Spot";

type Agg = {
  count: number;
  avgCleanliness: number;
  avgSwimmability: number;
  avgVibe: number;
};

/**
 * Recompute and persist denormalized rating averages on a spot doc.
 *
 * Single source of truth: every code path that mutates ratings (POST, future
 * DELETE, seed script) calls this. Cheap at hackathon scale and correct under
 * any update — no incremental-average drift to worry about.
 */
export async function recomputeSpotStats(spotId: mongoose.Types.ObjectId | string) {
  const _id =
    typeof spotId === "string" ? new mongoose.Types.ObjectId(spotId) : spotId;

  const [agg] = await Rating.aggregate<Agg>([
    { $match: { spotId: _id } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgCleanliness: { $avg: "$scores.cleanliness" },
        avgSwimmability: { $avg: "$scores.swimmability" },
        avgVibe: { $avg: "$scores.vibe" },
      },
    },
  ]);

  const stats = agg
    ? {
        ratingCount: agg.count,
        avgCleanliness: round2(agg.avgCleanliness),
        avgSwimmability: round2(agg.avgSwimmability),
        avgVibe: round2(agg.avgVibe),
        avgOverall: round2(
          (agg.avgCleanliness + agg.avgSwimmability + agg.avgVibe) / 3,
        ),
      }
    : {
        ratingCount: 0,
        avgCleanliness: 0,
        avgSwimmability: 0,
        avgVibe: 0,
        avgOverall: 0,
      };

  await Spot.findByIdAndUpdate(_id, { stats });
  return stats;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
