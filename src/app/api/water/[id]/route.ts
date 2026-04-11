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
    const water = await WaterBody.findById(id).lean();
    if (!water) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Strip internal identity fields before returning — auth0Sub and
    // deviceId are used server-side for the /me profile and collaborative
    // filtering, not intended for public consumption. Also sanitize
    // orphan pre-Blob imageUrls (same treatment /api/water GET gives them).
    const w = water as unknown as {
      imageUrl?: string;
      auth0Sub?: string;
      ratings?: Array<{ auth0Sub?: string; deviceId?: string } & Record<string, unknown>>;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { auth0Sub: _uploaderSub, ...rest } = w;
    const cleanedRatings = (w.ratings ?? []).map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { auth0Sub: _raterSub, deviceId: _did, ...rRest } = r;
      return rRest;
    });
    return NextResponse.json({
      ...rest,
      imageUrl: sanitizeImageUrl(w.imageUrl),
      ratings: cleanedRatings,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
