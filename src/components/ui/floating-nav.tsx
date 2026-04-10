"use client";
import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: { name: string; link: string; icon?: React.ReactNode }[];
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    const prev = scrollYProgress.getPrevious() ?? 0;
    const direction = current - prev;
    if (scrollYProgress.get() < 0.05) {
      setVisible(true);
    } else {
      setVisible(direction < 0);
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        initial={{ opacity: 1, y: -100 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "fixed top-4 inset-x-0 z-50 mx-auto flex max-w-fit items-center justify-center gap-6",
          "rounded-full border border-white/10 px-8 py-3",
          "bg-[rgba(6,13,31,0.85)] backdrop-blur-lg shadow-lg shadow-cyan-500/5",
          className
        )}
      >
        {navItems.map((item, idx) => (
          <Link
            key={idx}
            href={item.link}
            className="flex items-center gap-1.5 text-sm text-neutral-300 hover:text-cyan-400 transition-colors"
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.name}</span>
          </Link>
        ))}
      </motion.nav>
    </AnimatePresence>
  );
};
