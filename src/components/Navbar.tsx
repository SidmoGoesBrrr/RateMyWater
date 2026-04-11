"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@auth0/nextjs-auth0";
import { Home, Map, Trophy, MessageSquare, Search, Plus, LogIn, LogOut } from "lucide-react";
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
  const { user, isLoading } = useUser();

  return (
    <>
      {/* ── Desktop top bar ──────────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-50 h-16 items-center px-8 border-b border-white/6 bg-[#082232]/92 backdrop-blur-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-10 shrink-0 group">
          <span className="text-xl">💧</span>
          <span className="text-base font-black tracking-tight text-white group-hover:text-cyan-100 transition-colors">
            Rate<span className="text-cyan-400">My</span>Water
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  active
                    ? "text-cyan-100 bg-cyan-500/18 border border-cyan-400/30 shadow-sm shadow-cyan-500/10"
                    : "text-white/70 hover:text-white bg-white/4 border border-white/6 hover:bg-white/10 hover:border-white/12"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-cyan-400" : "text-white/50")} />
                {label}
                {active && (
                  <motion.div
                    layoutId="desktop-active"
                    className="absolute inset-0 rounded-xl bg-cyan-500/12 border border-cyan-400/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth control */}
        <div className="ml-auto flex items-center">
          {isLoading ? null : user ? (
            <a
              href="/auth/logout"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white bg-white/4 border border-white/6 hover:bg-white/10 hover:border-white/12 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 text-white/50" />
              Sign out
            </a>
          ) : (
            <a
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-cyan-100 bg-cyan-500/18 border border-cyan-400/30 hover:bg-cyan-500/25 transition-all duration-200"
            >
              <LogIn className="h-4 w-4 text-cyan-400" />
              Sign in
            </a>
          )}
        </div>
      </header>

      {/* ── Mobile bottom bar ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/6 bg-[#082232]/96 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-active"
                    className="absolute inset-0 rounded-xl bg-cyan-500/15 border border-cyan-500/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 relative z-10 transition-colors",
                    active ? "text-cyan-400" : "text-white/40"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold relative z-10 transition-colors",
                    active ? "text-cyan-300" : "text-white/40"
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
                  : "bg-cyan-500/25 border border-cyan-500/35"
              )}
            >
              <Plus
                className={cn(
                  "h-4 w-4",
                  pathname === "/upload" ? "text-black" : "text-cyan-300"
                )}
              />
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold transition-colors",
                pathname === "/upload" ? "text-cyan-400" : "text-white/40"
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
