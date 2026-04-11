"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@auth0/nextjs-auth0";
import { Home, Map, MessageSquare, Search, Plus, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/search", label: "Search", icon: Search },
];

// Only shown when the user is signed in — added dynamically below so the
// signed-out mobile bar stays at 4 tabs and doesn't get cramped.
const PROFILE_ITEM = { href: "/me", label: "Me", icon: User } as const;

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  return (
    <>
      {/* ── Desktop top bar ──────────────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed top-0 inset-x-0 z-50 h-16 items-center px-8 border-b border-white/6 bg-[#082232]/92 backdrop-blur-xl"
      >
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link href="/" className="flex items-center gap-2.5 mr-10 shrink-0 group">
            <motion.span
              className="text-xl"
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
            >
              💧
            </motion.span>
            <span className="text-base font-black tracking-tight text-white group-hover:text-sky-100 transition-colors">
              Rate<span className="text-sky-400">My</span>Water
            </span>
          </Link>
        </motion.div>

        {/* Nav items */}
        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    active
                      ? "text-sky-100 bg-sky-500/18 border border-sky-400/30 shadow-sm shadow-sky-500/10"
                      : "text-white/70 hover:text-white bg-white/4 border border-white/6 hover:bg-white/10 hover:border-white/12"
                  )}
                >
                  <motion.div
                    animate={active ? { rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-400" : "text-white/50")} />
                  </motion.div>
                  {label}
                  {active && (
                    <motion.div
                      layoutId="desktop-active"
                      className="absolute inset-0 rounded-xl bg-sky-500/12 border border-sky-400/25"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Auth control */}
        <div className="ml-auto flex items-center gap-2">
          {isLoading ? null : user ? (
            <>
              {/* Profile link — only for signed-in users. Sits next to sign-out
                  so the "you are signed in" state feels cohesive. */}
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={PROFILE_ITEM.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                    pathname.startsWith(PROFILE_ITEM.href)
                      ? "text-sky-100 bg-sky-500/18 border border-sky-400/30 shadow-sm shadow-sky-500/10"
                      : "text-white/70 hover:text-white bg-white/4 border border-white/6 hover:bg-white/10 hover:border-white/12"
                  )}
                >
                  <PROFILE_ITEM.icon
                    className={cn(
                      "h-4 w-4",
                      pathname.startsWith(PROFILE_ITEM.href) ? "text-sky-400" : "text-white/50"
                    )}
                  />
                  {PROFILE_ITEM.label}
                </Link>
              </motion.div>
              {/* Sign-out: red/destructive — visually distinct from sign-in */}
              <motion.a
                href="/auth/logout"
                whileHover={{ scale: 1.05, boxShadow: "0 0 16px rgba(239,68,68,0.25)" }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-300 bg-red-500/10 border border-red-500/25 hover:bg-red-500/18 hover:border-red-400/40 hover:text-red-200 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 text-red-400" />
                Sign out
              </motion.a>
            </>
          ) : (
            /* Sign-in: sky-blue, prominent call-to-action */
            <motion.a
              href="/auth/login"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(56,189,248,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-sky-100 bg-sky-500/18 border border-sky-400/30 hover:bg-sky-500/25 transition-all duration-200"
            >
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <LogIn className="h-4 w-4 text-sky-400" />
              </motion.div>
              Sign in
            </motion.a>
          )}
        </div>
      </motion.header>

      {/* ── Mobile bottom bar ────────────────────────────────── */}
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/6 bg-[#082232]/96 backdrop-blur-xl"
      >
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <motion.div
                key={href}
                whileTap={{ scale: 0.85 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  href={href}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-active"
                      className="absolute inset-0 rounded-xl bg-sky-500/15 border border-sky-500/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={active ? { scale: [1, 1.3, 1], y: [0, -3, 0] } : {}}
                    transition={{ duration: 0.35 }}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 relative z-10 transition-colors",
                        active ? "text-sky-400" : "text-white/40"
                      )}
                    />
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold relative z-10 transition-colors",
                      active ? "text-sky-300" : "text-white/40"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </motion.div>
            );
          })}

          {/* Submit FAB */}
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ y: -2 }}>
            <Link
              href="/upload"
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl",
                pathname === "/upload" && "after:absolute after:inset-0 after:rounded-xl after:bg-sky-500/10"
              )}
            >
              <motion.div
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                  pathname === "/upload"
                    ? "bg-sky-500 shadow-lg shadow-sky-500/30"
                    : "bg-sky-500/25 border border-sky-500/35"
                )}
                animate={pathname === "/upload" ? { boxShadow: ["0 0 10px rgba(56,189,248,0.3)", "0 0 20px rgba(56,189,248,0.6)", "0 0 10px rgba(56,189,248,0.3)"] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Plus
                  className={cn(
                    "h-4 w-4",
                    pathname === "/upload" ? "text-black" : "text-sky-300"
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors",
                  pathname === "/upload" ? "text-sky-400" : "text-white/40"
                )}
              >
                Submit
              </span>
            </Link>
          </motion.div>

          {/* Profile — mobile, signed-in only. Slots in as the 6th item
              (4 nav + FAB + profile). On narrow phones this is tight, but
              padding shrinks gracefully via `justify-around`. */}
          {!isLoading && user && (() => {
            const active = pathname.startsWith(PROFILE_ITEM.href);
            const Icon = PROFILE_ITEM.icon;
            return (
              <motion.div whileTap={{ scale: 0.85 }} whileHover={{ y: -2 }}>
                <Link
                  href={PROFILE_ITEM.href}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-active"
                      className="absolute inset-0 rounded-xl bg-sky-500/15 border border-sky-500/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <motion.div
                    animate={active ? { scale: [1, 1.3, 1], y: [0, -3, 0] } : {}}
                    transition={{ duration: 0.35 }}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 relative z-10 transition-colors",
                        active ? "text-sky-400" : "text-white/40"
                      )}
                    />
                  </motion.div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold relative z-10 transition-colors",
                      active ? "text-sky-300" : "text-white/40"
                    )}
                  >
                    {PROFILE_ITEM.label}
                  </span>
                </Link>
              </motion.div>
            );
          })()}
        </div>
      </motion.nav>
    </>
  );
}
