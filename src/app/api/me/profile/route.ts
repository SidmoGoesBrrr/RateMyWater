// GET /api/me/profile
//
// Returns the signed-in user's profile payload in one request:
//   - uploads: every water body they submitted, sorted newest-first
//   - ratings: every rating they left, newest-first, with the parent
//     water body inlined for rendering
//   - stats: tallies (upload count, rating count, member-since)
//   - taste: derived analytics (avg score they give, rating distribution,
//     favorite water type, title)
//
// Why one endpoint instead of three? The profile page wants everything at
// once, and three round-trips means three loading states. Doing the whole
// thing server-side is also easier to cache later if we need to.
//
// 401 if the caller isn't signed in — the client redirects to /auth/login.

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import WaterBody from "@/models/WaterBody";
import { auth0 } from "@/lib/auth0";
import { sanitizeImageUrl } from "@/lib/sanitizeImageUrl";
import { RATING_META, type WaterRating } from "@/lib/water-types";

// "Taste" title picker. Driven by the distribution of ratings the user
// has given — not by what people said about their uploads. Order matters:
// the first branch that matches wins.
function pickTitle(dist: Record<WaterRating, number>, total: number): string {
  if (total < 3) return "Fresh Face";
  const pct = (k: WaterRating) => dist[k] / total;
  if (pct("dive_in_mouth_open") >= 0.5) return "The Optimist";
  if (pct("biohazard_speedrun") >= 0.3) return "The Health Department";
  if (pct("nope") + pct("biohazard_speedrun") >= 0.5) return "The Skeptic";
  if (pct("feet_only") >= 0.4) return "Cautiously Curious";
  if (pct("swim_mouth_closed") >= 0.4) return "The Swimmer";
  return "The Connoisseur";
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await dbConnect();
  const sub = session.user.sub;

  // --- Uploads ---------------------------------------------------------------
  // Top-level auth0Sub field is indexed, so this is a straight B-tree lookup.
  const uploadsRaw = await WaterBody.find({ auth0Sub: sub })
    .sort({ createdAt: -1 })
    .lean();

  const uploads = uploadsRaw.map((w) => {
    const r = w as unknown as Record<string, unknown>;
    // Strip ratings[] — the profile card doesn't render individual ratings,
    // only the aggregate totals that are already denormalized on the doc.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ratings: _ratings, ...rest } = r;
    return {
      ...rest,
      imageUrl: sanitizeImageUrl(rest.imageUrl as string | undefined),
    };
  });

  // --- Ratings ---------------------------------------------------------------
  // Ratings live inside the water body doc as a subdocument array. We can't
  // index-lookup them the same way; instead we query for any water body
  // containing a rating with this auth0Sub, then unpack the matching
  // ratings on the server. At our scale (<100k docs) this is trivial; if
  // it ever becomes a problem we'd denormalize ratings into their own
  // collection.
  const withMyRatings = await WaterBody.find(
    { "ratings.auth0Sub": sub },
    { name: 1, location: 1, type: 1, imageUrl: 1, ratings: 1 },
  ).lean();

  type RatingRow = {
    water: {
      _id: string;
      name: string;
      location: string;
      type: string;
      imageUrl: string;
    };
    rating: WaterRating;
    comment?: string;
    ratedAt: string;
  };

  const ratings: RatingRow[] = [];
  for (const doc of withMyRatings) {
    const w = doc as unknown as {
      _id: unknown;
      name: string;
      location: string;
      type: string;
      imageUrl?: string;
      ratings: Array<{
        rating: WaterRating;
        comment?: string;
        ratedAt: Date | string;
        auth0Sub?: string;
      }>;
    };
    for (const r of w.ratings) {
      if (r.auth0Sub !== sub) continue;
      ratings.push({
        water: {
          _id: String(w._id),
          name: w.name,
          location: w.location,
          type: w.type,
          imageUrl: sanitizeImageUrl(w.imageUrl),
        },
        rating: r.rating,
        comment: r.comment,
        ratedAt: new Date(r.ratedAt).toISOString(),
      });
    }
  }
  ratings.sort((a, b) => (a.ratedAt < b.ratedAt ? 1 : -1));

  // --- Stats + taste ---------------------------------------------------------
  const dist: Record<WaterRating, number> = {
    dive_in_mouth_open: 0,
    swim_mouth_closed: 0,
    feet_only: 0,
    nope: 0,
    biohazard_speedrun: 0,
  };
  const typeCount: Record<string, number> = {};
  let scoreSum = 0;
  for (const r of ratings) {
    dist[r.rating] = (dist[r.rating] || 0) + 1;
    typeCount[r.water.type] = (typeCount[r.water.type] || 0) + 1;
    scoreSum += RATING_META[r.rating].score;
  }

  const favoriteType =
    Object.entries(typeCount).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  // "Member since" is the earlier of (first upload, first rating). If the
  // user has neither we return null and the client renders "just joined".
  const firstUpload = uploadsRaw[uploadsRaw.length - 1] as { createdAt?: Date } | undefined;
  const firstRating = ratings[ratings.length - 1];
  const firstUploadAt = firstUpload?.createdAt
    ? new Date(firstUpload.createdAt).toISOString()
    : null;
  const firstRatingAt = firstRating?.ratedAt ?? null;
  const memberSince =
    firstUploadAt && firstRatingAt
      ? firstUploadAt < firstRatingAt
        ? firstUploadAt
        : firstRatingAt
      : (firstUploadAt ?? firstRatingAt);

  return NextResponse.json({
    user: {
      sub,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      picture: session.user.picture ?? null,
    },
    uploads,
    ratings,
    stats: {
      uploadCount: uploads.length,
      ratingCount: ratings.length,
      memberSince,
    },
    taste: {
      averageGivenScore: ratings.length > 0 ? scoreSum / ratings.length : 0,
      distribution: dist,
      favoriteType,
      title: pickTitle(dist, ratings.length),
    },
  });
}
