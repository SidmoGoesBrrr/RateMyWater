import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import WaterBody from "@/models/WaterBody";

// GET /api/search?q=<query>&type=<type>&limit=<n>&autocomplete=1
//
// Uses Atlas Search ($search). Requires an index named "water_search" on
// the waterbodies collection. Create it in Atlas UI > Search > Create Index:
//
// Name: water_search
// {
//   "mappings": {
//     "dynamic": false,
//     "fields": {
//       "name":        [{ "type": "autocomplete", "tokenization": "edgeGram" }, { "type": "string" }],
//       "location":    [{ "type": "autocomplete", "tokenization": "edgeGram" }, { "type": "string" }],
//       "description": { "type": "string" },
//       "type":        { "type": "string" }
//     }
//   }
// }

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const isAutocomplete = searchParams.get("autocomplete") === "1";

    if (!q) {
      // Empty query — return top rated
      const items = await WaterBody.find(type ? { type } : {})
        .select("-embedding -__v -auth0Sub -ratings -coordinates")
        .sort({ averageScore: -1 })
        .limit(limit)
        .lean();
      return NextResponse.json({ items });
    }

    const pipeline = isAutocomplete
      ? buildAutocompletePipeline(q, type, limit)
      : buildFuzzyPipeline(q, type, limit);

    const db = WaterBody.db;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await db.collection("waterbodies").aggregate(pipeline as any).toArray();

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

// Autocomplete — fast prefix matching while typing
function buildAutocompletePipeline(q: string, type: string, limit: number) {
  const pipeline: unknown[] = [
    {
      $search: {
        index: "water_search",
        compound: {
          should: [
            {
              autocomplete: {
                query: q,
                path: "name",
                fuzzy: { maxEdits: 1 },
                tokenOrder: "sequential",
                score: { boost: { value: 2 } },
              },
            },
            {
              autocomplete: {
                query: q,
                path: "location",
                fuzzy: { maxEdits: 1 },
                tokenOrder: "sequential",
              },
            },
          ],
          minimumShouldMatch: 1,
        },
      },
    },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $sort: { score: -1 } },
    { $limit: limit },
    { $project: { embedding: 0, __v: 0, auth0Sub: 0, ratings: 0, coordinates: 0 } },
  ];

  if (type) pipeline.splice(1, 0, { $match: { type } });
  return pipeline;
}

// Full fuzzy search — for committed searches
function buildFuzzyPipeline(q: string, type: string, limit: number) {
  const pipeline: unknown[] = [
    {
      $search: {
        index: "water_search",
        compound: {
          should: [
            {
              text: {
                query: q,
                path: ["name", "location"],
                fuzzy: { maxEdits: 2, prefixLength: 2 },
                score: { boost: { value: 3 } },
              },
            },
            {
              text: {
                query: q,
                path: "description",
                fuzzy: { maxEdits: 2, prefixLength: 2 },
              },
            },
            {
              text: {
                query: q,
                path: "type",
                score: { boost: { value: 0.5 } },
              },
            },
          ],
          minimumShouldMatch: 1,
        },
      },
    },
    { $addFields: { score: { $meta: "searchScore" } } },
    { $sort: { score: -1 } },
    { $limit: limit },
    { $project: { embedding: 0, __v: 0, auth0Sub: 0, ratings: 0, coordinates: 0 } },
  ];

  if (type) pipeline.splice(1, 0, { $match: { type } });
  return pipeline;
}
