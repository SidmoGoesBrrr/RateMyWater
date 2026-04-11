import type { Metadata } from "next";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { BubbleCursor } from "@/components/BubbleCursor";
import { FishCanvas } from "@/components/FishCanvas";
import { auth0 } from "@/lib/auth0";

export const metadata: Metadata = {
  title: "RateMyWater — Rate the World's Water",
  description:
    "From dive-in-with-mouth-open perfection to biohazard speedruns — the community rates water bodies worldwide.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Load the session server-side so useUser() has an initial value on first
  // render. Tolerate missing/invalid Auth0 config: until the env vars are set,
  // getSession() can throw — treat that as "not logged in" so the rest of the
  // site still boots.
  let initialUser: unknown = undefined;
  try {
    const session = await auth0.getSession();
    initialUser = session?.user;
  } catch {
    initialUser = undefined;
  }

  return (
    <html lang="en">
      <body className="antialiased bg-[#0a1628] text-white" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Auth0Provider user={initialUser as never}>
          <BubbleCursor />
          <FishCanvas />
          <Navbar />
          {children}
        </Auth0Provider>
      </body>
    </html>
  );
}
