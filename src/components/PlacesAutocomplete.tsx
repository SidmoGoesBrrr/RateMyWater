"use client";
import { useRef, useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoogleMaps } from "@/lib/google-maps";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: { address: string; lat: number; lng: number; name?: string }) => void;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Search for a water body or location…",
  className,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useGoogleMaps();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [focused, setFocused] = useState(false);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address ?? place.name ?? "";

    onChange(address);
    onPlaceSelected({ address, lat, lng, name: place.name });
  };

  // Fallback when no API key
  if (!apiKey || !isLoaded) {
    return (
      <div className={cn("relative", className)}>
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 z-10" />
        {!apiKey && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 animate-spin" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl bg-slate-900/60 border border-white/10 pl-10 pr-4 py-3",
            "text-sm text-white placeholder-zinc-600",
            "focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all"
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <MapPin
        className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 z-10 transition-colors",
          focused ? "text-cyan-400" : "text-zinc-500"
        )}
      />
      <Autocomplete
        onLoad={(ac) => (autocompleteRef.current = ac)}
        onPlaceChanged={handlePlaceChanged}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl bg-slate-900/60 border pl-10 pr-4 py-3",
            "text-sm text-white placeholder-zinc-600",
            "focus:outline-none transition-all",
            focused
              ? "border-cyan-500/50 bg-slate-900/80 shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
              : "border-white/10 hover:border-white/20"
          )}
        />
      </Autocomplete>
    </div>
  );
}
