import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import WaterBody from "@/models/WaterBody";

// GET /api/water
// Cursor-paginated feed of water bodies. Cursor is the ISO `createdAt` of the
// last item in the previous page. Stable under new submissions arriving mid-scroll,
// unlike skip-pagination.
//
// Legacy query params (type, sort, limit, skip) are kept for backward compat
// with the home page and leaderboard.
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const sortParam = searchParams.get("sort") ?? "createdAt";
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "15", 10) || 15, 1),
      50
    );
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : null;
    if (cursor && Number.isNaN(cursor.getTime())) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    const filter: Record<string, unknown> = {};
    if (type && type !== "all") filter.type = type;
    if (cursor) filter.createdAt = { $lt: cursor };

    const sortField: Record<string, 1 | -1> =
      sortParam === "score" ? { averageScore: -1, createdAt: -1 } : { createdAt: -1 };

    // Fetch limit + 1 so we can detect hasMore without a separate count query.
    const rowsRaw = await WaterBody.find(filter)
      .sort(sortField)
      .limit(limit + 1)
      .lean();

    const hasMore = rowsRaw.length > limit;
    const rows = hasMore ? rowsRaw.slice(0, limit) : rowsRaw;

    // Compute commentCount on the server so the client doesn't have to
    // download every rating's comment just to count them.
    type Row = { ratings?: { comment?: string }[]; createdAt?: Date };
    const items = rows.map((row) => {
      const r = row as Row;
      const commentCount = Array.isArray(r.ratings)
        ? r.ratings.filter((x) => typeof x.comment === "string" && x.comment.trim().length > 0).length
        : 0;
      return { ...row, commentCount };
    });

    const last = items[items.length - 1] as { createdAt?: Date } | undefined;
    const nextCursor =
      hasMore && last?.createdAt
        ? new Date(last.createdAt).toISOString()
        : null;

    // Legacy home-page callers still expect { items, total }. Include total only
    // when cursor pagination isn't being used, to keep response shape stable.
    if (cursor) {
      return NextResponse.json({ items, nextCursor });
    }
    // For the first page we also compute total (used by skip-paginated legacy callers).
    const total = await WaterBody.countDocuments(
      type && type !== "all" ? { type } : {}
    );
    return NextResponse.json({ items, total, nextCursor });
  } catch (err) {
    console.error("GET /api/water failed", err);
    return NextResponse.json({ error: "Failed to fetch water bodies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

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
    console.error("POST /api/water failed", err);
    return NextResponse.json({ error: "Failed to create water body" }, { status: 500 });
  }
}
