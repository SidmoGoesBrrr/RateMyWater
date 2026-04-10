import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { jsonError } from "@/lib/api";
import { Spot } from "@/models/Spot";
import { Rating } from "@/models/Rating";

export const dynamic = "force-dynamic";

// Gotcha #8: lookup by `slug` (string) instead of raw ObjectId so we never
// have to worry about wrapping params in `new Types.ObjectId(...)`.
export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await dbConnect();
    const { slug } = await context.params;

    const spot = await Spot.findOne({ slug }).lean();
    if (!spot) return jsonError(404, "Spot not found");

    const ratings = await Rating.find({ spotId: spot._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ spot, ratings });
  } catch (err) {
    return jsonError(
      500,
      "Failed to fetch spot",
      err instanceof Error ? err.message : String(err),
    );
  }
}
