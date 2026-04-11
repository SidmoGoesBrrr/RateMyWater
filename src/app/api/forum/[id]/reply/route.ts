import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import ForumPost from "@/models/ForumPost";
import { auth0 } from "@/lib/auth0";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const { body } = await req.json();

    if (typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    const post = await ForumPost.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const displayName =
      (session.user.name as string | undefined) ??
      (session.user.nickname as string | undefined) ??
      (session.user.email as string | undefined) ??
      "Anonymous";

    post.replies.push({
      body: body.trim().slice(0, 1000),
      author: displayName,
      createdAt: new Date(),
    });
    await post.save();

    return NextResponse.json({ replies: post.replies });
  } catch (err) {
    console.error("POST /api/forum/[id]/reply failed", err);
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}
