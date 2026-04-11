"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Umbrella, Waves, Mountain, Trees, Droplets, Droplet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type WaterRating, RATING_META } from "@/lib/water-types";
import { ScoreDisplay, AppleEmoji } from "./WaterRatingPicker";

export interface WaterCardData {
  _id: string;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  uploadedBy: string;
  createdAt: string;
}

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  beach: { icon: Umbrella,  color: "#fbbf24" },
  ocean: { icon: Waves,     color: "#22d3ee" },
  lake:  { icon: Mountain,  color: "#818cf8" },
  river: { icon: Trees,     color: "#34d399" },
  pond:  { icon: Droplets,  color: "#60a5fa" },
};
const DEFAULT_TYPE_ICON = { icon: Droplet, color: "#94a3b8" };

export function WaterCard({
  water,
  rank,
}: {
  water: WaterCardData;
  rank?: number;
}) {
  const topMeta = water.topRating ? RATING_META[water.topRating] : null;

  return (
    <Link href={`/water/${water._id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "group relative rounded-2xl overflow-hidden cursor-pointer",
          "border border-white/8 bg-slate-900/60 backdrop-blur-sm",
          "hover:border-cyan-500/30 transition-colors duration-300",
          "shadow-lg hover:shadow-cyan-500/10"
        )}
      >
        {/* Rank badge */}
        {rank !== undefined && (
          <div
            className={cn(
              "absolute top-3 left-3 z-20 h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border",
              rank === 0 && "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
              rank === 1 && "bg-slate-400/20 border-slate-400/50 text-slate-300",
              rank === 2 && "bg-orange-600/20 border-orange-600/50 text-orange-400",
              rank > 2 && "bg-white/10 border-white/20 text-white/70"
            )}
          >
            {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
          </div>
        )}

        {/* Image */}
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={water.imageUrl}
            alt={water.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

          {/* Type badge */}
          <div className="absolute top-3 right-3 z-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-2.5 py-1 text-xs text-white flex items-center gap-1">
            {(() => { const { icon: Icon, color } = TYPE_ICONS[water.type] ?? DEFAULT_TYPE_ICON; return <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />; })()}
            <span className="capitalize">{water.type}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base leading-tight truncate">
                {water.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-zinc-400 text-xs">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{water.location}</span>
              </div>
            </div>

            {water.totalRatings > 0 && (
              <ScoreDisplay
                score={water.averageScore}
                totalRatings={water.totalRatings}
              />
            )}

            {water.totalRatings === 0 && (
              <div className="flex flex-col items-center text-zinc-600">
                <Droplets className="h-6 w-6" />
                <span className="text-xs mt-1">No ratings</span>
              </div>
            )}
          </div>

          {/* Top rating badge */}
          {topMeta && water.totalRatings > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border"
              style={{
                color: topMeta.color,
                borderColor: `${topMeta.color}35`,
                backgroundColor: `${topMeta.color}12`,
              }}
            >
              <AppleEmoji hex={topMeta.emojiHex} fallback={topMeta.emoji} size={12} />
              <span className="truncate max-w-[160px]">{topMeta.label}</span>
            </div>
          )}

          {/* Uploader */}
          <div className="mt-3 text-xs text-zinc-600 border-t border-white/5 pt-3">
            Submitted by <span className="text-zinc-400">{water.uploadedBy}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
