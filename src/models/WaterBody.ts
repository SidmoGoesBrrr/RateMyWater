// Server-only module — contains Mongoose model.
// For type-only imports use @/lib/water-types instead.
import mongoose, { Schema, Document } from "mongoose";
import { type WaterRating, RATING_META } from "@/lib/water-types";

export type { WaterRating };
export { RATING_META };

export interface IRating {
  rating: WaterRating;
  comment?: string;
  ratedAt: Date;
  // Anonymous device ID for collaborative filtering.
  // Optional — ratings submitted before this field existed are still valid.
  deviceId?: string;
  // Auth0 OpenID subject (stable user ID). Captured when a signed-in user
  // rates. Optional because anonymous rating is still allowed. Used by the
  // /me profile page to show "your ratings" across devices.
  auth0Sub?: string;
}

export interface IWaterBody extends Document {
  name: string;
  location: string;
  type: "beach" | "pond" | "lake" | "river" | "ocean";
  imageUrl: string;
  description?: string;
  uploadedBy: string;
  // Auth0 OpenID subject (stable user ID) of the uploader. Required going
  // forward — uploads are gated behind sign-in. Existing pre-auth-gate
  // water bodies have this unset; the /me profile won't show them.
  auth0Sub?: string;
  ratings: IRating[];
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  coordinates?: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>({
  rating: {
    type: String,
    enum: Object.keys(RATING_META),
    required: true,
  },
  comment: { type: String, maxlength: 300 },
  ratedAt: { type: Date, default: Date.now },
  deviceId: { type: String, index: true },
  // Indexed — the /me profile page queries ratings by auth0Sub.
  auth0Sub: { type: String, index: true },
});

const WaterBodySchema = new Schema<IWaterBody>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    type: {
      type: String,
      enum: ["beach", "pond", "lake", "river", "ocean"],
      required: true,
    },
    imageUrl: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    uploadedBy: { type: String, default: "Anonymous", maxlength: 50 },
    // Indexed — the /me profile page queries water bodies by auth0Sub.
    auth0Sub: { type: String, index: true },
    ratings: [RatingSchema],
    averageScore: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    topRating: { type: String, enum: Object.keys(RATING_META) },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

// Recalculate stats before saving
WaterBodySchema.pre("save", async function () {
  const doc = this as unknown as IWaterBody;

  if (doc.ratings.length === 0) {
    doc.averageScore = 0;
    doc.totalRatings = 0;
    doc.topRating = undefined;
    return;
  }

  const total = doc.ratings.reduce(
    (sum, r) => sum + RATING_META[r.rating].score,
    0
  );
  doc.averageScore = parseFloat((total / doc.ratings.length).toFixed(2));
  doc.totalRatings = doc.ratings.length;

  const counts = {} as Record<WaterRating, number>;
  for (const r of doc.ratings) {
    counts[r.rating] = (counts[r.rating] || 0) + 1;
  }
  doc.topRating = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0] as WaterRating;
});

export default mongoose.models.WaterBody ||
  mongoose.model<IWaterBody>("WaterBody", WaterBodySchema);
