// Next.js 16 uses `proxy.ts` in place of the legacy `middleware.ts`.
// Docs: https://github.com/auth0/nextjs-auth0/blob/main/EXAMPLES.md#nextjs-16-compatibility
import { auth0 } from "@/lib/auth0";

export async function proxy(request: Request) {
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    // Run on every request except Next internals and common static files.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
