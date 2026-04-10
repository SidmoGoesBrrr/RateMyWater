// Pure type + constant definitions — no Node.js/Mongoose imports.
// Safe to import in both server and client components.

export type WaterRating =
  | "dive_in_mouth_open"
  | "swim_mouth_closed"
  | "feet_only"
  | "nope"
  | "biohazard_speedrun";

export const RATING_META: Record<
  WaterRating,
  { label: string; emoji: string; score: number; color: string; description: string }
> = {
  dive_in_mouth_open: {
    label: "Dive In With Mouth Open",
    emoji: "🏊",
    score: 5,
    color: "#22d3ee",
    description: "Crystal clear perfection. Drink it.",
  },
  swim_mouth_closed: {
    label: "Would Swim, Mouth Closed",
    emoji: "🤿",
    score: 4,
    color: "#34d399",
    description: "Pretty clean. Swim, but maybe don't sip.",
  },
  feet_only: {
    label: "Feet Only Zone",
    emoji: "👣",
    score: 3,
    color: "#fbbf24",
    description: "Suspicious. Toes are brave enough.",
  },
  nope: {
    label: "Hard No From Me",
    emoji: "🤢",
    score: 2,
    color: "#f97316",
    description: "Visibly questionable. Stay on dry land.",
  },
  biohazard_speedrun: {
    label: "Biohazard Speed Run",
    emoji: "☢️",
    score: 1,
    color: "#ef4444",
    description: "Run. Don't walk. Leave the area immediately.",
  },
};
