"use client";
import React, { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

function MovingBorderPath({
  duration = 2000,
  rx = "30%",
  ry = "30%",
}: {
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(progress, (val) =>
    pathRef.current?.getPointAtLength(val).x ?? 0
  );
  const y = useTransform(progress, (val) =>
    pathRef.current?.getPointAtLength(val).y ?? 0
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div
        style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}
      >
        <div className="h-20 w-20 bg-[radial-gradient(var(--cyan-400,#22d3ee)_30%,transparent_70%)] opacity-90" />
      </motion.div>
    </>
  );
}

export function MovingBorderButton({
  borderRadius = "0.5rem",
  children,
  containerClassName,
  borderClassName,
  duration = 3000,
  className,
  as: Tag = "button",
  ...rest
}: {
  borderRadius?: string;
  children: React.ReactNode;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden bg-transparent p-[1px]",
        containerClassName
      )}
      style={{ borderRadius }}
      {...rest}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorderPath duration={duration} />
      </div>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center",
          "border border-white/10 bg-slate-900/80 backdrop-blur-xl",
          "text-sm font-medium text-white antialiased",
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </Tag>
  );
}
