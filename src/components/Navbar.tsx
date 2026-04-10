"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Map, Trophy, MessageSquare, Search, Plus, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/search", label: "Search", icon: Search },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop top bar ──────────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-14 items-center px-6 border-b border-white/5 bg-[#060d1f]/90 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 mr-10 flex-shrink-0">
          <Droplets className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-black tracking-tight text-white">
            Rate<span className="text-cyan-400">My</span>Water
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  active
                    ? "text-cyan-400 bg-cyan-500/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {active && (
                  <motion.div
                    layoutId="desktop-active"
                    className="absolute inset-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto">
          <Link
            href="/upload"
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
              pathname === "/upload"
                ? "bg-cyan-500 text-black"
                : "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Submit Water
          </Link>
        </div>
      </header>

      {/* ── Mobile bottom bar ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/5 bg-[#060d1f]/95 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-active"
                    className="absolute inset-0 rounded-xl bg-cyan-500/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 relative z-10 transition-colors",
                    active ? "text-cyan-400" : "text-zinc-500"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium relative z-10 transition-colors",
                    active ? "text-cyan-400" : "text-zinc-600"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Submit FAB */}
          <Link
            href="/upload"
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl",
              pathname === "/upload" && "after:absolute after:inset-0 after:rounded-xl after:bg-cyan-500/10"
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                pathname === "/upload"
                  ? "bg-cyan-500 shadow-lg shadow-cyan-500/30"
                  : "bg-cyan-500/20 border border-cyan-500/30"
              )}
            >
              <Plus
                className={cn(
                  "h-4 w-4",
                  pathname === "/upload" ? "text-black" : "text-cyan-400"
                )}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                pathname === "/upload" ? "text-cyan-400" : "text-zinc-600"
              )}
            >
              Submit
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
