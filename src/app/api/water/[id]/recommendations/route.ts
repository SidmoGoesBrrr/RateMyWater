import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recs = await getRecommendations(id, 5);
    return NextResponse.json(recs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
