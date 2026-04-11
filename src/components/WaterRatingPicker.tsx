"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { type WaterRating, RATING_META } from "@/lib/water-types";

const RATINGS: WaterRating[] = [
  "dive_in_mouth_open",
  "swim_mouth_closed",
  "feet_only",
  "nope",
  "biohazard_speedrun",
];

const PARTICLE_CONFIG: Record<WaterRating, { count: number; colors: string[] }> = {
  dive_in_mouth_open: { count: 20, colors: ["#22d3ee", "#0ea5e9", "#fff", "#a5f3fc"] },
  swim_mouth_closed: { count: 14, colors: ["#34d399", "#10b981", "#6ee7b7"] },
  feet_only: { count: 8, colors: ["#fbbf24", "#f59e0b", "#fde68a"] },
  nope: { count: 6, colors: ["#f97316", "#ea580c", "#fed7aa"] },
  biohazard_speedrun: { count: 12, colors: ["#ef4444", "#dc2626", "#fca5a5", "#22c55e"] },
};

const APPLE_EMOJI_BASE =
  "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64";

/** Renders an emoji as an iOS-style image. Falls back to the text emoji on load error. */
export function AppleEmoji({
  hex,
  fallback,
  size = 24,
  className,
}: {
  hex: string;
  fallback: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={className} style={{ fontSize: size }}>
        {fallback}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${APPLE_EMOJI_BASE}/${hex}.png`}
      alt={fallback}
      width={size}
      height={size}
      className={cn("select-none", className)}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

/** Styled iOS app-icon container around an Apple emoji. */
function RatingIcon({
  hex,
  fallback,
  color,
  size = 40,
  isSelected,
  isHovered,
}: {
  hex: string;
  fallback: string;
  color: string;
  size?: number;
  isSelected?: boolean;
  isHovered?: boolean;
}) {
  return (
    <motion.div
      className="flex-shrink-0 rounded-2xl flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}${isSelected ? "28" : isHovered ? "18" : "12"}`,
        border: `1.5px solid ${color}${isSelected ? "60" : isHovered ? "40" : "25"}`,
        boxShadow: isSelected ? `0 0 14px ${color}40` : undefined,
      }}
      animate={{ scale: isSelected ? [1, 1.12, 1] : 1 }}
      transition={{ duration: 0.35 }}
    >
      <AppleEmoji hex={hex} fallback={fallback} size={Math.round(size * 0.55)} />
    </motion.div>
  );
}

function Particles({ rating }: { rating: WaterRating }) {
  const cfg = PARTICLE_CONFIG[rating];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: cfg.count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 6 + 3,
            height: Math.random() * 6 + 3,
            backgroundColor: cfg.colors[i % cfg.colors.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -(Math.random() * 60 + 20)],
            x: [(Math.random() - 0.5) * 60],
          }}
          transition={{
            duration: Math.random() * 0.8 + 0.5,
            delay: Math.random() * 0.3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

interface WaterRatingPickerProps {
  selected: WaterRating | null;
  onSelect: (rating: WaterRating) => void;
}

export function WaterRatingPicker({ selected, onSelect }: WaterRatingPickerProps) {
  const [hovered, setHovered] = useState<WaterRating | null>(null);
  const [burst, setBurst] = useState<WaterRating | null>(null);

  const handleSelect = (rating: WaterRating) => {
    onSelect(rating);
    setBurst(rating);
    setTimeout(() => setBurst(null), 800);
  };

  // Preview only appears while actively hovering — zero footprint otherwise.
  const preview = hovered;

  return (
    <div className="w-full space-y-2">
      {/* Preview — collapses to zero height when not hovering */}
      <AnimatePresence initial={false}>
        {preview && (
          <motion.div
            key={preview}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 border mb-2"
              style={{
                borderColor: `${RATING_META[preview].color}30`,
                backgroundColor: `${RATING_META[preview].color}0c`,
              }}
            >
              <AppleEmoji
                hex={RATING_META[preview].emojiHex}
                fallback={RATING_META[preview].emoji}
                size={32}
              />
              <p className="text-sm font-semibold leading-tight" style={{ color: RATING_META[preview].color }}>
                {RATING_META[preview].description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating buttons */}
      <div className="flex flex-col gap-2">
        {RATINGS.map((rating, idx) => {
          const meta = RATING_META[rating];
          const isSelected = selected === rating;
          const isHovered = hovered === rating;

          return (
            <motion.button
              key={rating}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              onClick={() => handleSelect(rating)}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                // No scale transform — keeps the hit target stable so edge-hover never flickers.
                "relative w-full rounded-2xl px-4 py-3 text-left transition-colors duration-150",
                "border overflow-hidden group",
                isSelected ? "border-opacity-60 shadow-lg" : "border-white/10 hover:border-white/20",
              )}
              style={{
                borderColor: isSelected || isHovered ? `${meta.color}50` : undefined,
                background: isSelected
                  ? `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`
                  : isHovered
                  ? `${meta.color}0a`
                  : "rgba(15,23,42,0.6)",
                boxShadow: isSelected
                  ? `0 0 20px ${meta.color}25, inset 0 0 20px ${meta.color}08`
                  : undefined,
              }}
            >
              {/* Burst particles */}
              <AnimatePresence>
                {burst === rating && <Particles rating={rating} />}
              </AnimatePresence>

              {/* Selected left bar */}
              <motion.div
                className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                style={{ backgroundColor: meta.color }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isSelected ? 1 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />

              <div className="flex items-center gap-3 relative z-10">
                {/* iOS app-icon style emoji */}
                <RatingIcon
                  hex={meta.emojiHex}
                  fallback={meta.emoji}
                  color={meta.color}
                  size={38}
                  isSelected={isSelected}
                  isHovered={isHovered}
                />

                {/* Label + score dots */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-semibold text-sm leading-tight transition-colors duration-150",
                      isSelected ? "text-white" : "text-zinc-300 group-hover:text-white",
                    )}
                  >
                    {meta.label}
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-5 rounded-full"
                        style={{
                          backgroundColor:
                            i < meta.score ? meta.color : "rgba(255,255,255,0.1)",
                        }}
                        animate={{
                          opacity: isSelected && i < meta.score ? [0.7, 1, 0.7] : 1,
                        }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.1,
                          repeat: isSelected ? Infinity : 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: `${meta.color}30`,
                        border: `1.5px solid ${meta.color}`,
                      }}
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke={meta.color}
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Compact badge version for display
export function RatingBadge({ rating }: { rating: WaterRating }) {
  const meta = RATING_META[rating];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
      style={{
        color: meta.color,
        borderColor: `${meta.color}70`,
        backgroundColor: "#0a1628",
      }}
    >
      <AppleEmoji hex={meta.emojiHex} fallback={meta.emoji} size={13} />
      <span>{meta.label}</span>
    </span>
  );
}

// Score display for leaderboard
export function ScoreDisplay({ score, totalRatings }: { score: number; totalRatings: number }) {
  const getColor = (s: number) => {
    if (s >= 4.5) return "#22d3ee";
    if (s >= 3.5) return "#34d399";
    if (s >= 2.5) return "#fbbf24";
    if (s >= 1.5) return "#f97316";
    return "#ef4444";
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="text-4xl font-black tabular-nums"
        style={{ color }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {score.toFixed(1)}
      </motion.div>
      <div className="text-xs text-zinc-500 mt-0.5">
        {totalRatings} rating{totalRatings !== 1 ? "s" : ""}
      </div>
      <div className="mt-2 h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 5) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}
