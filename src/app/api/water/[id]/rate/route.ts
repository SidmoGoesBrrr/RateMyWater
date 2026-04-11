import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WaterBody, { type IRating } from "@/models/WaterBody";
import { type WaterRating, RATING_META } from "@/models/WaterBody";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { auth0 } from "@/lib/auth0";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { rating, comment } = await req.json();

    if (!rating || !Object.keys(RATING_META).includes(rating as string)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const water = await WaterBody.findById(id);
    if (!water) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const deviceId = await getOrCreateDeviceId();
    const session = await auth0.getSession();
    const auth0Sub = session?.user?.sub;

    // Prevent duplicate ratings: one rating per user/device per water body.
    // If the user already rated, update their existing rating instead.
    const existing = water.ratings.find(
      (r: IRating) =>
        (auth0Sub && r.auth0Sub === auth0Sub) ||
        (!auth0Sub && r.deviceId === deviceId)
    );

    let updated = false;
    if (existing) {
      existing.rating = rating as WaterRating;
      existing.comment = comment?.trim().slice(0, 300);
      existing.ratedAt = new Date();
      if (auth0Sub) existing.auth0Sub = auth0Sub;
      updated = true;
    } else {
      water.ratings.push({
        rating: rating as WaterRating,
        comment: comment?.trim().slice(0, 300),
        ratedAt: new Date(),
        deviceId,
        ...(auth0Sub ? { auth0Sub } : {}),
      });
    }

    await water.save();

    return NextResponse.json({
      averageScore: water.averageScore,
      totalRatings: water.totalRatings,
      topRating: water.topRating,
      updated,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
