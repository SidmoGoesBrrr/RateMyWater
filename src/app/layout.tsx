import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

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
      <body className="antialiased bg-[#082232] text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
