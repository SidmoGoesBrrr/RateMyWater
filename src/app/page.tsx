"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Upload, Droplets, ArrowRight } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { FloatingNav } from "@/components/ui/floating-nav";
import { MovingBorderButton } from "@/components/ui/moving-border";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import NumberTicker from "@/components/ui/number-ticker";
import { WaterCard, type WaterCardData } from "@/components/WaterCard";
import { RATING_META } from "@/lib/water-types";

const NAV_ITEMS = [
  { name: "Home", link: "/" },
  { name: "Leaderboard", link: "/leaderboard", icon: <Trophy className="h-3.5 w-3.5" /> },
  { name: "Submit Water", link: "/upload", icon: <Upload className="h-3.5 w-3.5" /> },
];

const RECENT_REVIEWS = [
  { quote: "Crystal clear, I could see the bottom from 20 feet. Absolute perfection.", name: "surferbro99", title: "🏊 Dive In With Mouth Open" },
  { quote: "Smelled a bit funky but the vibe was immaculate. Feet only for me.", name: "pondwatcher", title: "👣 Feet Only Zone" },
  { quote: "Saw something glowing near the shore. Did not investigate. Left quickly.", name: "anonymous", title: "☢️ Biohazard Speed Run" },
  { quote: "Perfect turquoise water. Would absolutely swim here again.", name: "beach_queen", title: "🏊 Dive In With Mouth Open" },
  { quote: "Pretty solid, brought my dog. He seemed fine afterwards.", name: "dogwalker_dan", title: "🤿 Would Swim, Mouth Closed" },
  { quote: "There was foam. A lot of foam. Mystery foam.", name: "foam_witness", title: "🤢 Hard No From Me" },
];

const HOW_IT_WORKS = [
  { emoji: "📸", title: "Snap It", desc: "Upload a photo of your beach, pond, lake, or any water body you encounter." },
  { emoji: "🗳️", title: "Rate It", desc: "Choose from 5 iconic tiers — from crystal clear paradise to full biohazard." },
  { emoji: "🏆", title: "Rank It", desc: "Climb the leaderboard. The cleanest waters get the glory." },
];

export default function Home() {
  const [recent, setRecent] = useState<WaterCardData[]>([]);
  const [stats, setStats] = useState({ total: 0, rated: 0, topScore: 0 });

  useEffect(() => {
    fetch("/api/water?limit=6&sort=createdAt")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setRecent(data.items);
          const rated = data.items.filter((w: WaterCardData) => w.totalRatings > 0).length;
          const top = data.items.reduce(
            (m: number, w: WaterCardData) => Math.max(m, w.averageScore ?? 0),
            0
          );
          setStats({ total: data.total, rated, topScore: top });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#060d1f] text-white">
      <FloatingNav navItems={NAV_ITEMS} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <AuroraBackground className="min-h-screen" showRadialGradient>
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#22d3ee" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-16">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-400"
          >
            <Droplets className="h-3.5 w-3.5" />
            <span>The internet&apos;s water quality authority</span>
          </motion.div>

          <TextGenerateEffect
            words="Rate My Water"
            className="text-6xl md:text-8xl font-black tracking-tight [&_span]:bg-clip-text [&_span]:text-transparent [&_span]:bg-gradient-to-b [&_span]:from-white [&_span]:via-white [&_span]:to-cyan-400"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-6 max-w-lg text-lg text-zinc-400 leading-relaxed"
          >
            From pristine dive-in-with-mouth-open beaches to full biohazard speedruns —
            the community rates the world&apos;s water bodies.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <MovingBorderButton
              as={Link}
              href="/upload"
              containerClassName="h-14 w-52 rounded-xl"
              className="px-6 gap-2 text-base font-semibold text-white"
              duration={2500}
            >
              <Upload className="h-4 w-4" />
              Submit Water
            </MovingBorderButton>

            <Link
              href="/leaderboard"
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              <Trophy className="h-4 w-4 text-yellow-400" />
              Leaderboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-8 md:gap-16"
          >
            {[
              { label: "Waters Submitted", value: stats.total, suffix: "+" },
              { label: "Community Ratings", value: stats.rated, suffix: "" },
              { label: "Top Water Score", value: stats.topScore, decimals: 1, suffix: "/5" },
            ].map(({ label, value, suffix, decimals }) => (
              <div key={label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white">
                  <NumberTicker value={value} decimalPlaces={decimals ?? 0} />
                  <span className="text-cyan-400">{suffix}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </AuroraBackground>

      {/* ── RATING TIERS EXPLAINER ───────────────────────────────── */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d1f] via-slate-900/30 to-[#060d1f] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white">The 5 Tiers of Water</h2>
            <p className="mt-3 text-zinc-400">From paradise to apocalypse</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {Object.entries(RATING_META).map(([key, meta], idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl p-4 text-center border"
                style={{
                  borderColor: `${meta.color}30`,
                  background: `linear-gradient(135deg, ${meta.color}10, transparent)`,
                }}
              >
                <div className="text-4xl mb-2">{meta.emoji}</div>
                <div className="text-xs font-semibold text-white leading-tight">{meta.label}</div>
                <div className="mt-2 text-xs text-zinc-500">{meta.description}</div>
                <div className="mt-3 flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1 w-4 rounded-full"
                      style={{ backgroundColor: i < meta.score ? meta.color : "rgba(255,255,255,0.1)" }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-3xl font-black text-white mb-12"
          >
            How It Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ emoji, title, desc }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-sm p-6 text-center"
              >
                <div className="text-5xl mb-4">{emoji}</div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT SUBMISSIONS ──────────────────────────────────── */}
      {recent.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-black text-white"
              >
                Recently Submitted
              </motion.h2>
              <Link
                href="/leaderboard"
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.map((w) => (
                <WaterCard key={w._id} water={w} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── EMPTY STATE CTA ─────────────────────────────────────── */}
      {recent.length === 0 && (
        <section className="py-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto"
          >
            <div className="text-7xl mb-6">🌊</div>
            <h3 className="text-2xl font-bold text-white">Be the first!</h3>
            <p className="mt-3 text-zinc-400 mb-8">No water has been rated yet. Start the movement.</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Submit a Water Body
            </Link>
          </motion.div>
        </section>
      )}

      {/* ── COMMUNITY REVIEWS TICKER ────────────────────────────── */}
      <section className="py-16 overflow-hidden">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-black text-white mb-8 px-4"
        >
          What People Are Saying
          <span className="ml-2 text-zinc-500 text-sm font-normal">(probably)</span>
        </motion.h2>
        <InfiniteMovingCards
          items={RECENT_REVIEWS}
          direction="left"
          speed="slow"
          className="max-w-full"
        />
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-4 text-center text-zinc-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Droplets className="h-4 w-4 text-cyan-600" />
          <span className="font-bold text-zinc-400">RateMyWater</span>
        </div>
        <p>Not responsible for any rash decisions made near water bodies.</p>
        <div className="mt-4 flex justify-center gap-6 text-xs">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <Link href="/leaderboard" className="hover:text-cyan-400 transition-colors">Leaderboard</Link>
          <Link href="/upload" className="hover:text-cyan-400 transition-colors">Submit</Link>
        </div>
      </footer>
    </main>
  );
}
