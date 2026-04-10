import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { dbConnect } from "@/lib/mongoose";
import { jsonError, parseBody } from "@/lib/api";
import { Spot } from "@/models/Spot";
import { readDeviceId } from "@/lib/deviceId";

export const dynamic = "force-dynamic";

const CreateSpotSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  locationLabel: z.string().max(200).optional(),
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  coverImageUrl: z.url(),
});

export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10) || 20,
      100,
    );
    const sortParam = url.searchParams.get("sort");
    const sort: Record<string, 1 | -1> =
      sortParam === "top"
        ? { "stats.avgOverall": -1, "stats.ratingCount": -1 }
        : { createdAt: -1 };

    // Gotcha #7: .lean() returns plain objects so they serialize cleanly across
    // the Server → Client boundary and skip Mongoose hydration overhead.
    const spots = await Spot.find().sort(sort).limit(limit).lean();
    return NextResponse.json(spots);
  } catch (err) {
    return jsonError(
      500,
      "Failed to list spots",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const parsed = await parseBody(req, CreateSpotSchema);
    if (!parsed.ok) return parsed.response;

    const deviceId = await readDeviceId();
    const slug = nanoid(8);

    const spot = await Spot.create({
      ...parsed.data,
      slug,
      createdByDeviceId: deviceId ?? undefined,
    });

    return NextResponse.json({ slug: spot.slug, _id: spot._id }, { status: 201 });
  } catch (err) {
    return jsonError(
      500,
      "Failed to create spot",
      err instanceof Error ? err.message : String(err),
    );
  }
}
