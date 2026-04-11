// Semantic search primitives for RateMyWater.
//
// Architecture note (why this file exists):
// We're on a MongoDB Atlas M0 cluster, which does NOT support the
// $vectorSearch aggregation stage (that requires M10+). So for now we do
// the k-nearest-neighbor search in Node: load all embeddings from the
// collection, compute cosine similarity against the query vector, sort,
// return top K.
//
// When we eventually upgrade the cluster, the ONLY function that needs
// to change is `findNearestNeighbors` — callers go through that function,
// so swapping its body to use the $vectorSearch aggregation is a ~15 line
// change and nothing above it moves. Keep the boundary clean.
//
// Embedding provider: Voyage AI, but accessed via MongoDB Atlas's hosted
// endpoint at https://ai.mongodb.com/v1 (NOT the legacy api.voyageai.com).
// After MongoDB acquired Voyage, API keys are issued from Atlas (Atlas UI
// → AI Models → Model API Keys) and are only valid against the Atlas
// endpoint. Atlas gives each org a free tier, billed through Atlas itself.
//
// Docs: https://www.mongodb.com/docs/api/doc/atlas-embedding-and-reranking-api/
//
// Model: "voyage-4-large" — the model the Atlas docs example uses and
// the one configured in the project's Rate Limits table. 1024 dimensions.
// Cosine similarity.
//
// Critical Voyage detail: the API distinguishes between `inputType: "document"`
// (for things you index) and `inputType: "query"` (for things users search
// for). Using the right one measurably improves retrieval quality over
// passing raw text both ways — this is why we expose two functions instead
// of one.

import { VoyageAIClient } from "voyageai";
import WaterBody, { type IWaterBody } from "@/models/WaterBody";
import { dbConnect } from "@/lib/mongoose";

export const EMBEDDING_MODEL = "voyage-4-large";
export const EMBEDDING_DIMENSIONS = 1024;

// MongoDB-hosted Voyage endpoint. Overridable via env in case MongoDB
// changes the URL (the docs page currently labels the feature "preview",
// so expect churn).
const VOYAGE_BASE_URL = process.env.VOYAGE_BASE_URL ?? "https://ai.mongodb.com/v1";

let cachedClient: VoyageAIClient | null = null;

function getClient(): VoyageAIClient {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VOYAGE_API_KEY is not set. Create one at cloud.mongodb.com → your project → AI Models → Model API Keys, then add it to .env.local",
    );
  }
  cachedClient = new VoyageAIClient({
    apiKey,
    // Override the SDK's default base URL (api.voyageai.com) to hit the
    // MongoDB-hosted Atlas endpoint instead. The wire protocol is identical;
    // only the host differs.
    baseUrl: VOYAGE_BASE_URL,
  });
  return cachedClient;
}

/**
 * Extract the first embedding out of a Voyage embed response.
 * The SDK returns `{ data: [{ embedding, index }] }` — we pluck the first.
 */
function firstEmbedding(result: { data?: { embedding?: number[] }[] }): number[] {
  const vec = result.data?.[0]?.embedding;
  if (!vec || vec.length === 0) {
    throw new Error("Voyage returned no embedding");
  }
  return vec;
}

/**
 * Embed a piece of content that will be INDEXED (a water body's text).
 * Pass the document-shaped text: name + location + description + type +
 * top rating label, joined however you like.
 */
export async function embedDocument(text: string): Promise<number[]> {
  const client = getClient();
  const result = await client.embed({
    input: text,
    model: EMBEDDING_MODEL,
    inputType: "document",
  });
  return firstEmbedding(result);
}

/**
 * Embed a user's SEARCH QUERY. Separate from embedDocument because Voyage
 * tunes the two input types differently under the hood.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const client = getClient();
  const result = await client.embed({
    input: text,
    model: EMBEDDING_MODEL,
    inputType: "query",
  });
  return firstEmbedding(result);
}

/**
 * Batch-embed multiple documents in one API call. Used by the backfill
 * script. Voyage's per-call list cap is 128 entries, so chunk upstream
 * if you have more.
 */
export async function embedDocumentsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 128) {
    throw new Error(
      `embedDocumentsBatch got ${texts.length} inputs; Voyage max is 128. Chunk upstream.`,
    );
  }
  const client = getClient();
  const result = await client.embed({
    input: texts,
    model: EMBEDDING_MODEL,
    inputType: "document",
  });
  const rows = (result.data ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return rows.map((r) => {
    if (!r.embedding) throw new Error("Voyage returned a row with no embedding");
    return r.embedding;
  });
}

/**
 * Build the text representation of a water body that we embed. Centralized
 * so backfill and new-insert use exactly the same shape — otherwise
 * embeddings drift over time and similarity scores become meaningless.
 */
export function waterBodyToEmbeddingText(water: {
  name: string;
  location: string;
  type: string;
  description?: string | null;
  topRating?: string | null;
  uploadedBy?: string | null;
}): string {
  const parts = [
    water.name,
    water.location,
    `type: ${water.type}`,
    water.description?.trim() ? water.description.trim() : null,
    water.topRating ? `rated: ${water.topRating.replace(/_/g, " ")}` : null,
    water.uploadedBy ? `by ${water.uploadedBy}` : null,
  ].filter(Boolean);
  return parts.join(". ");
}

/**
 * Cosine similarity in [-1, 1]. Higher = more similar. No defensive
 * length check — caller must ensure both vectors are the same dimension,
 * which is trivially true because everything goes through one model.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = a.length;
  for (let i = 0; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface NearestNeighborHit {
  water: IWaterBody;
  score: number; // cosine similarity, higher = more similar
}

/**
 * k-nearest-neighbor search over the water bodies collection.
 *
 * CURRENT IMPLEMENTATION (M0-compatible): loads all water bodies that have
 * an embedding field into Node memory, computes cosine similarity, sorts,
 * returns top k. Fine at ~hundreds of docs; becomes painful past ~5000.
 *
 * FUTURE (M10+): replace the body of this function with a $vectorSearch
 * aggregation against the waterbodies collection. Signature and return
 * shape stay the same, so no caller changes.
 */
export async function findNearestNeighbors(
  queryVector: number[],
  k: number,
  filter?: { type?: string },
): Promise<NearestNeighborHit[]> {
  await dbConnect();

  // Pull only the fields we need for ranking + display. In particular we
  // need `embedding` for scoring, plus everything the UI wants to render.
  // We skip docs without an embedding (they're either not backfilled yet
  // or the background embed failed).
  const mongoFilter: Record<string, unknown> = {
    embedding: { $exists: true, $ne: [] },
  };
  if (filter?.type) mongoFilter.type = filter.type;

  // Explicitly select the embedding field — it's `select: false` in the
  // schema so it doesn't accidentally ship from the feed endpoint. Without
  // `+embedding` we'd get docs back with no embedding and the scoring loop
  // would skip every row.
  const rows = await WaterBody.find(mongoFilter).select("+embedding").lean();

  const scored: NearestNeighborHit[] = [];
  for (const row of rows) {
    const r = row as unknown as IWaterBody & { embedding?: number[] };
    if (!r.embedding || r.embedding.length === 0) continue;
    const score = cosineSimilarity(queryVector, r.embedding);
    scored.push({ water: r, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
