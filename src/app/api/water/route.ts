import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import WaterBody from "@/models/WaterBody";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") ?? "createdAt";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const skip = parseInt(searchParams.get("skip") ?? "0");

    const filter: Record<string, unknown> = {};
    if (type && type !== "all") filter.type = type;

    const sortField: Record<string, 1 | -1> =
      sort === "score" ? { averageScore: -1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      WaterBody.find(filter).sort(sortField).skip(skip).limit(limit).lean(),
      WaterBody.countDocuments(filter),
    ]);

    return NextResponse.json({ items, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch water bodies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, location, type, imageUrl, description, uploadedBy, coordinates } = body;

    if (!name || !location || !type || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const waterBody = await WaterBody.create({
      name: name.trim(),
      location: location.trim(),
      type,
      imageUrl,
      description: description?.trim(),
      uploadedBy: uploadedBy?.trim() || "Anonymous",
      ...(coordinates?.lat && coordinates?.lng ? { coordinates } : {}),
    });

    return NextResponse.json(waterBody, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create water body" }, { status: 500 });
  }
}
