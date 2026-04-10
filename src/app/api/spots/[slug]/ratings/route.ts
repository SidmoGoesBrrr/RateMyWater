import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongoose";
import { jsonError, parseBody } from "@/lib/api";
import { Spot } from "@/models/Spot";
import { Rating } from "@/models/Rating";
import { readDeviceId, getOrCreateDeviceId } from "@/lib/deviceId";
import { recomputeSpotStats } from "@/lib/recomputeStats";

export const dynamic = "force-dynamic";

const RateSchema = z.object({
  scores: z.object({
    cleanliness: z.number().int().min(1).max(10),
    swimmability: z.number().int().min(1).max(10),
    vibe: z.number().int().min(1).max(10),
  }),
  comment: z.string().max(500).optional(),
  // Optional override so curl/Postman tests can supply a deviceId without a cookie.
  deviceId: z.string().min(1).max(64).optional(),
});

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await dbConnect();
    const { slug } = await context.params;
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10) || 20,
      100,
    );

    const spot = await Spot.findOne({ slug }, { _id: 1 }).lean();
    if (!spot) return jsonError(404, "Spot not found");

    const ratings = await Rating.find({ spotId: spot._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(ratings);
  } catch (err) {
    return jsonError(
      500,
      "Failed to fetch ratings",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    await dbConnect();
    const { slug } = await context.params;

    const parsed = await parseBody(req, RateSchema);
    if (!parsed.ok) return parsed.response;

    // Resolve deviceId: explicit body wins, else existing cookie, else mint a new one.
    const deviceId =
      parsed.data.deviceId ??
      (await readDeviceId()) ??
      (await getOrCreateDeviceId());

    const spot = await Spot.findOne({ slug }, { _id: 1 }).lean();
    if (!spot) return jsonError(404, "Spot not found");

    let rating;
    try {
      rating = await Rating.create({
        spotId: spot._id,
        deviceId,
        scores: parsed.data.scores,
        comment: parsed.data.comment,
      });
    } catch (err: unknown) {
      // Gotcha #11: E11000 = duplicate key on the (spotId, deviceId) unique
      // index → this device already rated this spot. Surface as 409.
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return jsonError(409, "You have already rated this spot");
      }
      throw err;
    }

    const stats = await recomputeSpotStats(spot._id);

    return NextResponse.json({ ok: true, rating, stats }, { status: 201 });
  } catch (err) {
    return jsonError(
      500,
      "Failed to submit rating",
      err instanceof Error ? err.message : String(err),
    );
  }
}
