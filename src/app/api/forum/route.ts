import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ForumPost from "@/models/ForumPost";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const skip = parseInt(searchParams.get("skip") ?? "0");

    const [posts, total] = await Promise.all([
      ForumPost.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ForumPost.countDocuments(),
    ]);

    return NextResponse.json({ posts, total });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, body: postBody, author, waterBodyId, waterBodyName, tags } = body;

    if (!title?.trim() || !postBody?.trim()) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    const post = await ForumPost.create({
      title: title.trim(),
      body: postBody.trim(),
      author: author?.trim() || "Anonymous",
      waterBodyId,
      waterBodyName,
      tags: (tags ?? []).slice(0, 5),
    });

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
