"use client";
import { useCallback, useRef, useState } from "react";
import {
  GoogleMap,
  OverlayView,
  InfoWindow,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/lib/google-maps";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, X } from "lucide-react";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { cn } from "@/lib/utils";

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#060d1f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7ec8e3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d2137" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#22d3ee" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#0f1f35" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a3050" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#172a45" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#0a1525" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0a1e1a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#0d1f33" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1a2d47" }] },
];

export interface MapWaterEntry {
  _id: string;
  name: string;
  location: string;
  type: string;
  imageUrl: string;
  averageScore: number;
  totalRatings: number;
  topRating?: WaterRating;
  coordinates?: { lat: number; lng: number };
}

function getScoreColor(score: number) {
  if (score >= 4.5) return "#22d3ee";
  if (score >= 3.5) return "#34d399";
  if (score >= 2.5) return "#fbbf24";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
}

function WaterPin({ water, onClick, isSelected }: { water: MapWaterEntry; onClick: () => void; isSelected: boolean }) {
  const meta = water.topRating ? RATING_META[water.topRating] : null;
  const color = water.totalRatings > 0 ? getScoreColor(water.averageScore) : "#64748b";

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isSelected ? 1.15 : 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative flex flex-col items-center cursor-pointer"
      style={{ transform: "translate(-50%, -100%)" }}
    >
      {/* Pin body */}
      <div
        className="h-9 w-9 rounded-full border-2 flex items-center justify-center shadow-lg text-base relative"
        style={{
          backgroundColor: `${color}20`,
          borderColor: color,
          boxShadow: isSelected ? `0 0 20px ${color}60, 0 4px 12px rgba(0,0,0,0.5)` : `0 4px 12px rgba(0,0,0,0.4)`,
        }}
      >
        {meta ? meta.emoji : "💧"}
        {/* Pulse ring when selected */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}` }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      {/* Score badge */}
      {water.totalRatings > 0 && (
        <div
          className="mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none shadow"
          style={{ backgroundColor: color, color: "#000" }}
        >
          {water.averageScore.toFixed(1)}
        </div>
      )}
      {/* Pointer */}
      <div
        className="w-0 h-0 mt-[-2px]"
        style={{
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `6px solid ${color}`,
        }}
      />
    </motion.button>
  );
}

interface Props {
  waters: MapWaterEntry[];
  center?: { lat: number; lng: number };
  zoom?: number;
  mode?: "full" | "mini";
  miniMarker?: { lat: number; lng: number };
  onMiniMarkerChange?: (pos: { lat: number; lng: number }) => void;
}

export function GoogleMapView({
  waters,
  center = { lat: 20, lng: 0 },
  zoom = 3,
  mode = "full",
  miniMarker,
  onMiniMarkerChange,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useGoogleMaps();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selected, setSelected] = useState<MapWaterEntry | null>(null);
  const [infoPos, setInfoPos] = useState<{ lat: number; lng: number } | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (mode === "full") {
      map.setTilt(45);
    }
  }, [mode]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (mode === "mini" && e.latLng && onMiniMarkerChange) {
      onMiniMarkerChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
    setSelected(null);
  }, [mode, onMiniMarkerChange]);

  if (!apiKey) {
    return (
      <div className="w-full h-full rounded-2xl border border-white/10 bg-slate-900/50 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <MapPin className="h-10 w-10 text-zinc-600" />
        <p className="text-zinc-400 text-sm font-medium">Google Maps API key not configured</p>
        <p className="text-zinc-600 text-xs">
          Add <code className="bg-white/5 px-1.5 py-0.5 rounded text-cyan-400">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full rounded-2xl border border-white/5 bg-slate-900/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <p className="text-zinc-500 text-xs">Loading map…</p>
        </div>
      </div>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    styles: MAP_STYLES,
    disableDefaultUI: true,
    zoomControl: mode === "full",
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    tilt: mode === "full" ? 45 : 0,
    rotateControl: mode === "full",
    gestureHandling: mode === "mini" ? "cooperative" : "greedy",
    ...(mode === "full" ? { mapTypeId: "roadmap" } : {}),
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={onLoad}
        onClick={onMapClick}
      >
        {/* Water body pins */}
        {mode === "full" && waters.map((w) => {
          if (!w.coordinates) return null;
          return (
            <OverlayView
              key={w._id}
              position={w.coordinates}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <WaterPin
                water={w}
                isSelected={selected?._id === w._id}
                onClick={() => {
                  setSelected(w);
                  setInfoPos(w.coordinates!);
                  mapRef.current?.panTo(w.coordinates!);
                }}
              />
            </OverlayView>
          );
        })}

        {/* Mini map draggable marker */}
        {mode === "mini" && miniMarker && (
          <OverlayView
            position={miniMarker}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <motion.div
              className="flex flex-col items-center"
              style={{ transform: "translate(-50%, -100%)" }}
              drag
              onDragEnd={(_, info) => {
                if (!mapRef.current || !onMiniMarkerChange) return;
                const bounds = mapRef.current.getBounds();
                if (!bounds) return;
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const mapDiv = mapRef.current.getDiv();
                const { width, height } = mapDiv.getBoundingClientRect();
                const newLng = sw.lng() + (info.point.x / width) * (ne.lng() - sw.lng());
                const newLat = ne.lat() - (info.point.y / height) * (ne.lat() - sw.lat());
                onMiniMarkerChange({ lat: newLat, lng: newLng });
              }}
            >
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 cursor-grab active:cursor-grabbing">
                <MapPin className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid #22d3ee" }} />
            </motion.div>
          </OverlayView>
        )}

        {/* Info popup */}
        {selected && infoPos && (
          <InfoWindow
            position={infoPos}
            onCloseClick={() => setSelected(null)}
            options={{ pixelOffset: new google.maps.Size(0, -60), disableAutoPan: false }}
          >
            <WaterInfoCard water={selected} onClose={() => setSelected(null)} />
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map controls overlay */}
      {mode === "full" && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 3) + 1)}
            className="h-9 w-9 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-white text-lg hover:bg-slate-800 transition-colors"
          >
            +
          </button>
          <button
            onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 3) - 1)}
            className="h-9 w-9 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-white text-lg hover:bg-slate-800 transition-colors"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
}

function WaterInfoCard({ water, onClose }: { water: MapWaterEntry; onClose: () => void }) {
  const meta = water.topRating ? RATING_META[water.topRating] : null;
  const color = water.totalRatings > 0 ? getScoreColor(water.averageScore) : "#64748b";

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ width: 240, background: "#0d1926", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="relative h-32 w-full">
        <Image src={water.imageUrl} alt={water.name} fill className="object-cover" sizes="240px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1926] to-transparent" />
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white text-sm leading-tight">{water.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-zinc-400 text-xs">
          <MapPin className="h-3 w-3" />
          {water.location}
        </div>
        {meta && (
          <div
            className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
            style={{ color: meta.color, borderColor: `${meta.color}30`, backgroundColor: `${meta.color}10` }}
          >
            {meta.emoji} {meta.label}
          </div>
        )}
        {water.totalRatings > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Star className="h-3 w-3" style={{ color }} />
            <span className="text-sm font-black" style={{ color }}>
              {water.averageScore.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-500">({water.totalRatings})</span>
          </div>
        )}
        <Link
          href={`/water/${water._id}`}
          className="mt-3 flex items-center justify-center w-full rounded-lg py-1.5 text-xs font-semibold text-black transition-colors"
          style={{ backgroundColor: color }}
        >
          View & Rate →
        </Link>
      </div>
    </div>
  );
}
