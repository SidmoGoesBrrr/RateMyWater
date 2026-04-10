import { useJsApiLoader } from "@react-google-maps/api";

// Must be a stable reference — if this array is re-created on every render,
// @react-google-maps/api will re-initialize the loader and throw.
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

export function useGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
}
