import { NextRequest, NextResponse } from "next/server";
import { embedQuery, findNearestNeighbors } from "@/lib/embeddings";

// POST /api/search/semantic
// Body: { q: string, type?: string, limit?: number }
// Embeds the query with Voyage (inputType: "query") then runs an in-memory
// cosine-similarity kNN over the water bodies collection. See the big
// comment at the top of src/lib/embeddings.ts for the M0-vs-M10 story.
//
// POST (not GET) because the request body is naturally a JSON payload
// and we don't want the query string leaking into browser history / logs.
export async function POST(req: NextRequest) {
  let body: { q?: unknown; type?: unknown; limit?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const q = typeof body.q === "string" ? body.q.trim() : "";
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const type = typeof body.type === "string" && body.type.length > 0 ? body.type : undefined;

  // Clamp limit so one request can't accidentally pull the whole collection
  // through the similarity loop.
  const rawLimit = typeof body.limit === "number" ? body.limit : 20;
  const limit = Math.min(Math.max(Math.floor(rawLimit) || 20, 1), 50);

  try {
    const queryVector = await embedQuery(q);
    const hits = await findNearestNeighbors(queryVector, limit, type ? { type } : undefined);

    // Strip embedding arrays from the response — the client never needs
    // them and they'd bloat the payload by ~8KB per result.
    const items = hits.map(({ water, score }) => {
      const w = water as unknown as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { embedding, ...rest } = w;
      return { ...rest, score };
    });

    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    console.error("Semantic search failed", err);
    // 503 (not 500) signals "service degraded, client should fall back to
    // plain string matching" — the client uses this to decide whether to
    // retry or switch to the legacy filter path.
    return NextResponse.json(
      { error: "Semantic search is temporarily unavailable" },
      { status: 503 },
    );
  }
}
