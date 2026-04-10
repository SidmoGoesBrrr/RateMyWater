import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { dbConnect } from "../lib/mongoose";
import { Spot } from "../models/Spot";
import { Rating } from "../models/Rating";
import { recomputeSpotStats } from "../lib/recomputeStats";

const SEED_SPOTS = [
  {
    name: "Bondi Beach",
    locationLabel: "Sydney, Australia",
    description: "Iconic stretch of golden sand and rolling surf.",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    location: { type: "Point" as const, coordinates: [151.2767, -33.8908] },
  },
  {
    name: "Walden Pond",
    locationLabel: "Concord, MA, USA",
    description: "Thoreau's pond, surprisingly clean and swimmable.",
    coverImageUrl: "https://images.unsplash.com/photo-1502136969935-8d8a3cee0e68",
    location: { type: "Point" as const, coordinates: [-71.3367, 42.4391] },
  },
  {
    name: "Tahoe East Shore",
    locationLabel: "Lake Tahoe, NV, USA",
    description: "Crystal clear alpine lake water.",
    coverImageUrl: "https://images.unsplash.com/photo-1473773508845-188df298d2d1",
    location: { type: "Point" as const, coordinates: [-119.9402, 39.0968] },
  },
  {
    name: "Palolem Beach",
    locationLabel: "Goa, India",
    description: "Crescent-shaped beach with calm waters.",
    coverImageUrl: "https://images.unsplash.com/photo-1512100356356-de1b84283e18",
    location: { type: "Point" as const, coordinates: [74.0233, 15.0099] },
  },
  {
    name: "Murky Pond",
    locationLabel: "Somewhere swampy",
    description: "Don't drink the water. Don't even look at it.",
    coverImageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074",
    location: { type: "Point" as const, coordinates: [-90.0, 30.0] },
  },
];

function jitter() {
  return Math.floor(Math.random() * 5) - 2; // -2..+2
}

function clamp(n: number) {
  return Math.max(1, Math.min(10, n));
}

async function main() {
  await dbConnect();
  console.log("connected to mongo");

  await Promise.all([Spot.deleteMany({}), Rating.deleteMany({})]);
  console.log("cleared existing spots + ratings");

  for (const spec of SEED_SPOTS) {
    const spot = await Spot.create({ ...spec, slug: nanoid(8) });
    const numRatings = 3 + Math.floor(Math.random() * 3); // 3..5
    const baseScore = 1 + Math.floor(Math.random() * 10); // 1..10

    for (let i = 0; i < numRatings; i++) {
      await Rating.create({
        spotId: spot._id,
        deviceId: `seed-${nanoid(10)}`,
        scores: {
          cleanliness: clamp(baseScore + jitter()),
          swimmability: clamp(baseScore + jitter()),
          vibe: clamp(baseScore + jitter()),
        },
        comment: `Seeded rating #${i + 1}`,
      });
    }

    const stats = await recomputeSpotStats(spot._id);
    console.log(
      `seeded ${spot.name} (${spot.slug}) — ${numRatings} ratings, avgOverall=${stats.avgOverall}`,
    );
  }

  await mongoose.disconnect();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
