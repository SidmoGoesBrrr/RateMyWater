import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => Array.isArray(v) && v.length === 2,
        message: "coordinates must be [lng, lat]",
      },
    },
  },
  { _id: false },
);

const StatsSchema = new Schema(
  {
    ratingCount: { type: Number, default: 0, min: 0 },
    avgCleanliness: { type: Number, default: 0, min: 0, max: 10 },
    avgSwimmability: { type: Number, default: 0, min: 0, max: 10 },
    avgVibe: { type: Number, default: 0, min: 0, max: 10 },
    avgOverall: { type: Number, default: 0, min: 0, max: 10 },
  },
  { _id: false },
);

const SpotSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    locationLabel: { type: String, trim: true, maxlength: 200 },
    location: { type: PointSchema, required: false },
    // Gotcha #10: store URL strings only, never image bytes / base64.
    coverImageUrl: { type: String, required: true, trim: true },
    stats: { type: StatsSchema, default: () => ({}) },
    createdByDeviceId: { type: String },
  },
  { timestamps: true },
);

// Leaderboard query is scan-free thanks to this compound index.
SpotSchema.index({ "stats.avgOverall": -1, "stats.ratingCount": -1 });
// Recent feed.
SpotSchema.index({ createdAt: -1 });
// Gotcha #9: declare the geo index now so it exists before any geo doc is
// inserted, even though no API uses $near yet.
SpotSchema.index({ location: "2dsphere" });

export type SpotDoc = InferSchemaType<typeof SpotSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

// Gotcha #2: avoid OverwriteModelError on Next.js HMR by reusing the cached
// model if it's already been registered in this process.
export const Spot: Model<SpotDoc> =
  (mongoose.models.Spot as Model<SpotDoc> | undefined) ??
  mongoose.model<SpotDoc>("Spot", SpotSchema);
