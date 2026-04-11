import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { FishCanvas } from "@/components/FishCanvas";

export const metadata: Metadata = {
  title: "RateMyWater — Rate the World's Water",
  description:
    "From dive-in-with-mouth-open perfection to biohazard speedruns — the community rates water bodies worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#060d1f] text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Navbar />
        <FishCanvas />
        {children}
      </body>
    </html>
  );
}
