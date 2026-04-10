import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ForumPost from "@/models/ForumPost";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { body, author } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    const post = await ForumPost.findById(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    post.replies.push({
      body: body.trim().slice(0, 1000),
      author: author?.trim() || "Anonymous",
      createdAt: new Date(),
    });
    await post.save();

    return NextResponse.json({ replies: post.replies });
  } catch {
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}
