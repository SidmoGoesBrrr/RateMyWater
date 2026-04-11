import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WaterBody from "@/models/WaterBody";
import { sanitizeImageUrl } from "@/lib/sanitizeImageUrl";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    // Strip dead/internal fields at the query level — consistent with the
    // feed endpoint and /api/me/profile. Excludes:
    //   - embedding: legacy from semantic search, ~8KB dead weight
    //   - __v: Mongoose version key, internal
    //   - auth0Sub (top + rating): internal identity, not public
    //   - ratings.deviceId: internal, used only by collaborative filtering
    const water = await WaterBody.findById(id)
      .select("-embedding -__v -auth0Sub -ratings.auth0Sub -ratings.deviceId")
      .lean();
    if (!water) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const w = water as unknown as { imageUrl?: string };
    return NextResponse.json({
      ...water,
      imageUrl: sanitizeImageUrl(w.imageUrl),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
