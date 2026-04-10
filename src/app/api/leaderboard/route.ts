import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { jsonError } from "@/lib/api";
import { Spot } from "@/models/Spot";

export const dynamic = "force-dynamic";

// Gotcha #12: NO .populate() — stats are denormalized onto the spot doc, so the
// leaderboard is a single index-backed find().sort().limit().
export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "10", 10) || 10,
      100,
    );
    const min = Math.max(
      parseInt(url.searchParams.get("min") ?? "1", 10) || 1,
      0,
    );

    const spots = await Spot.find({ "stats.ratingCount": { $gte: min } })
      .sort({ "stats.avgOverall": -1, "stats.ratingCount": -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(spots);
  } catch (err) {
    return jsonError(
      500,
      "Failed to fetch leaderboard",
      err instanceof Error ? err.message : String(err),
    );
  }
}
