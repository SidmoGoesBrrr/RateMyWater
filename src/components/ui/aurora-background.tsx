"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-[#060d1f] text-white transition-bg overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `pointer-events-none absolute -inset-[10px] opacity-60 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_50%_0%,black_30%,transparent_75%)]`
          )}
          style={{
            backgroundImage: `
              repeating-linear-gradient(100deg, #000 0%, #000 7%, transparent 10%, transparent 12%, #000 16%),
              repeating-linear-gradient(100deg, #06b6d4 10%, #6366f1 15%, #0ea5e9 20%, #8b5cf6 25%, #22d3ee 30%)
            `,
            backgroundSize: "300%, 200%",
            backgroundPosition: "50% 50%, 50% 50%",
            filter: "blur(12px)",
            animation: "aurora 12s linear infinite",
          }}
        />
      </div>
      {children}
    </div>
  );
};
