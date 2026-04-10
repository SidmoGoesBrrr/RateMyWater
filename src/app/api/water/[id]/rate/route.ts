import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WaterBody from "@/models/WaterBody";
import { type WaterRating, RATING_META } from "@/models/WaterBody";

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

    water.ratings.push({
      rating: rating as WaterRating,
      comment: comment?.trim().slice(0, 300),
      ratedAt: new Date(),
    });

    await water.save(); // triggers pre-save hook to recalculate stats

    return NextResponse.json({
      averageScore: water.averageScore,
      totalRatings: water.totalRatings,
      topRating: water.topRating,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
