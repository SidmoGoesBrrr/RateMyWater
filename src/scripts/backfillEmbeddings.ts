// One-shot backfill: generate embeddings for every water body that
// doesn't already have one. Safe to re-run — it skips docs that already
// have `embedding` set.
//
// Usage:
//   npm run backfill-embeddings
//
// Which expands to (see package.json):
//   tsx --env-file=.env.local src/scripts/backfillEmbeddings.ts
//
// Prereqs: VOYAGE_API_KEY in .env.local (get one free at
// https://dash.voyageai.com).

import mongoose from "mongoose";
import { dbConnect } from "../lib/mongoose";
import WaterBody from "../models/WaterBody";
import { embedDocumentsBatch, waterBodyToEmbeddingText } from "../lib/embeddings";

const BATCH_SIZE = 64; // Voyage max is 128 per call; 64 is a safe cruise speed.

async function main() {
  console.log("Connecting to Mongo…");
  await dbConnect();

  // Pull all water bodies without an embedding. Explicitly select the
  // embedding field so we can see whether it's truly missing (it's
  // `select: false` in the schema, so a plain find() would always make
  // it look missing regardless of state).
  const missing = await WaterBody.find({
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  })
    .select("+embedding")
    .lean();

  if (missing.length === 0) {
    console.log("All water bodies already have embeddings. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${missing.length} water bodies without embeddings.`);
  console.log(`Batch size: ${BATCH_SIZE}. Expect ~${Math.ceil(missing.length / BATCH_SIZE)} API calls.`);

  let done = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const chunk = missing.slice(i, i + BATCH_SIZE);
    const texts = chunk.map((w) =>
      waterBodyToEmbeddingText({
        name: w.name,
        location: w.location,
        type: w.type,
        description: w.description,
        topRating: w.topRating,
        uploadedBy: w.uploadedBy,
      }),
    );

    try {
      const embeddings = await embedDocumentsBatch(texts);
      if (embeddings.length !== chunk.length) {
        throw new Error(
          `Voyage returned ${embeddings.length} embeddings for ${chunk.length} inputs`,
        );
      }

      // Write embeddings back. We do individual updates instead of a
      // bulk write for clarity — the volume is small and each write is
      // ~10ms over the wire.
      await Promise.all(
        chunk.map((w, j) =>
          WaterBody.updateOne({ _id: w._id }, { $set: { embedding: embeddings[j] } }),
        ),
      );

      done += chunk.length;
      console.log(`  [${done}/${missing.length}] embedded batch of ${chunk.length}`);
    } catch (err) {
      failed += chunk.length;
      console.error(`  ✗ batch starting at index ${i} failed:`, err);
    }
  }

  console.log(
    `\nDone. Embedded ${done}/${missing.length}${failed > 0 ? ` (${failed} failed)` : ""}.`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
