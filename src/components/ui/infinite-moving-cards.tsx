"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: { quote: string; name: string; title: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // Clone children for seamless loop
    const items = Array.from(scrollerRef.current.children);
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      scrollerRef.current!.appendChild(clone);
    });

    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );
    containerRef.current.style.setProperty(
      "--animation-duration",
      speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s"
    );

    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            key={idx}
            className="w-[280px] max-w-full relative rounded-2xl border border-white/10 flex-shrink-0 px-6 py-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <blockquote>
              <p className="text-sm text-zinc-300 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-3">
                <p className="text-xs font-semibold text-cyan-400">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.title}</p>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
