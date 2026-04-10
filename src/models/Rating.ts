import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ScoresSchema = new Schema(
  {
    cleanliness: { type: Number, required: true, min: 1, max: 10 },
    swimmability: { type: Number, required: true, min: 1, max: 10 },
    vibe: { type: Number, required: true, min: 1, max: 10 },
  },
  { _id: false },
);

const RatingSchema = new Schema(
  {
    spotId: { type: Schema.Types.ObjectId, ref: "Spot", required: true },
    deviceId: { type: String, required: true },
    scores: { type: ScoresSchema, required: true },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Gotcha #11: dedupe — one rating per (spot, device). E11000 → 409 in route.
RatingSchema.index({ spotId: 1, deviceId: 1 }, { unique: true });
// "Recent ratings on this spot" lookup.
RatingSchema.index({ spotId: 1, createdAt: -1 });

export type RatingDoc = InferSchemaType<typeof RatingSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

// Gotcha #2: HMR-safe model registration.
export const Rating: Model<RatingDoc> =
  (mongoose.models.Rating as Model<RatingDoc> | undefined) ??
  mongoose.model<RatingDoc>("Rating", RatingSchema);
