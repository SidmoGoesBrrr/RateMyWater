// Placeholder for orphan images — water bodies submitted before the Vercel
// Blob migration have imageUrls like `/uploads/xxx.jpg` pointing at files
// that were deleted from the repo when storage moved to Vercel Blob.
// Rather than letting next/image crash the error boundary on every load
// attempt, rewrite these to a generic placeholder at the API layer.
//
// We also catch pre-existing DB rows that already hold the *previous*
// placeholder URL (photo-1502136969935), which started 404ing in
// April 2026 when Unsplash removed or re-IDed the photo. Any such rows
// are rewritten on read to the current placeholder — no migration needed.
//
// Any other non-local https:// URL is left untouched.
export const BROKEN_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";

// The previous placeholder, still present in some seed DB rows. Matched
// by substring so cache-busting query params don't trip us up.
const LEGACY_PLACEHOLDER_FRAGMENT = "photo-1502136969935-8d8a3cee0e68";

export function sanitizeImageUrl(url: string | undefined | null): string {
  if (!url) return BROKEN_IMAGE_PLACEHOLDER;
  if (url.startsWith("/uploads/")) return BROKEN_IMAGE_PLACEHOLDER;
  if (url.includes(LEGACY_PLACEHOLDER_FRAGMENT)) return BROKEN_IMAGE_PLACEHOLDER;
  return url;
}
