// One-shot cleanup: remove the `embedding` field from every water body.
//
// Left over from the ripped-out Voyage semantic search feature. Each
// embedding was a 1024-dim number array (~8KB per doc). The code no
// longer reads or writes this field, but existing docs still have it
// on disk and in index/memory footprints. This script wipes them.
//
// GOTCHA: Mongoose's `updateMany` silently drops `$unset` for fields
// that aren't defined in the current schema (strict mode default). Since
// we already removed `embedding` from src/models/WaterBody.ts, a model-
// level update would be a no-op — you'd see matchedCount: N, modifiedCount: N,
// and then a second query would find the exact same N docs still carrying
// the field. To sidestep that, we drop down to the raw MongoDB collection
// via `mongoose.connection.db.collection("waterbodies")` which has no
// schema awareness.
//
// Safe to re-run — $unset is idempotent, and docs without the field
// are left alone.
//
// Usage:
//   npx tsx --env-file=.env.local src/scripts/cleanupEmbeddings.ts

import mongoose from "mongoose";
import { dbConnect } from "../lib/mongoose";

async function main() {
  console.log("Connecting to Mongo…");
  await dbConnect();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Mongo connection has no .db — connect() didn't finish?");
  }
  const col = db.collection("waterbodies");

  const before = await col.countDocuments({ embedding: { $exists: true } });
  console.log(`Found ${before} water bodies with an embedding field.`);

  if (before === 0) {
    console.log("Nothing to clean up.");
    await mongoose.disconnect();
    return;
  }

  const result = await col.updateMany(
    { embedding: { $exists: true } },
    { $unset: { embedding: "" } },
  );
  console.log(
    `Modified ${result.modifiedCount} docs (matched ${result.matchedCount}).`,
  );

  const after = await col.countDocuments({ embedding: { $exists: true } });
  console.log(`${after} docs still carry an embedding field (should be 0).`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
