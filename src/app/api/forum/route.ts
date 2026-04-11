import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import ForumPost from "@/models/ForumPost";
import { auth0 } from "@/lib/auth0";

// GET /api/forum
// Cursor-paginated feed. Cursor is the ISO `createdAt` of the last post in the
// previous page. Stable under new posts arriving mid-scroll, unlike skip.
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "15", 10) || 15, 1),
      30
    );
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : null;
    if (cursor && Number.isNaN(cursor.getTime())) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    // Fetch limit + 1 so we can detect `hasMore` without a separate count query.
    const query = cursor ? { createdAt: { $lt: cursor } } : {};
    const rows = await ForumPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const posts = hasMore ? rows.slice(0, limit) : rows;
    const last = posts[posts.length - 1] as { createdAt?: Date } | undefined;
    const nextCursor = hasMore && last?.createdAt ? last.createdAt.toISOString() : null;

    return NextResponse.json({ posts, nextCursor });
  } catch (err) {
    console.error("GET /api/forum failed", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/forum
// Requires an authenticated Auth0 session. Stamps authorUserId + authorName
// from the session instead of trusting client-supplied fields.
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await auth0.getSession();
  } catch {
    session = null;
  }
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { title, body: postBody, waterBodyId, waterBodyName, tags } = body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof postBody !== "string" || !postBody.trim()) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    const displayName =
      (session.user.name as string | undefined) ??
      (session.user.nickname as string | undefined) ??
      (session.user.email as string | undefined) ??
      "Anonymous";

    const post = await ForumPost.create({
      title: title.trim(),
      body: postBody.trim(),
      author: displayName, // keep the legacy field populated too
      authorUserId: session.user.sub,
      authorName: displayName,
      waterBodyId: typeof waterBodyId === "string" ? waterBodyId : undefined,
      waterBodyName: typeof waterBodyName === "string" ? waterBodyName : undefined,
      tags: Array.isArray(tags)
        ? tags
            .filter((t): t is string => typeof t === "string")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 5)
        : [],
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("POST /api/forum failed", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
