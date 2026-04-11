"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  OverlayView,
} from "@react-google-maps/api";
import Supercluster from "supercluster";
import { useGoogleMaps } from "@/lib/google-maps";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, X } from "lucide-react";
import { RATING_META, type WaterRating } from "@/lib/water-types";
import { AppleEmoji } from "@/components/WaterRatingPicker";
import { cn } from "@/lib/utils";

// ── Clustering types ─────────────────────────────────────────────────────────
// Supercluster stores each input as a GeoJSON Point with arbitrary properties.
// We stash the water body's _id in the properties so we can look up the full
// record when the cluster resolves to a single unclustered point.
type PointProps = { waterId: string };
// Cluster-level properties Supercluster tags onto grouped features.
type ClusterProps = {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number | string;
};

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1628" }] },
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

const PIN_W = 48;
const PIN_H = 64;
const PIN_OFFSET = { x: -(PIN_W / 2), y: -PIN_H };

// ── ClusterPin ───────────────────────────────────────────────────────────────
// Rendered in place of individual WaterPins when Supercluster groups several
// nearby water bodies at the current zoom level. Same visual language as the
// individual pin (circular, colored by average score, score badge below) so
// the map feels consistent zoomed in vs. out.
//
// Size scales with point_count: tiny clusters (2–5) match the regular pin,
// medium (6–20) get +25%, large (21+) get +50%. Prevents the "a cluster of
// 3 looks identical to a single pin" visual collision, and keeps huge
// clusters from dominating the map.
function ClusterPin({
  count,
  avgScore,
  onClick,
}: {
  count: number;
  avgScore: number;
  onClick: () => void;
}) {
  const color = getScoreColor(avgScore);
  const scale = count >= 21 ? 1.5 : count >= 6 ? 1.25 : 1;
  const sizePx = 36 * scale;

  return (
    <div style={{ width: PIN_W * scale, height: PIN_H * scale }} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
      >
        {/* Cluster body */}
        <div
          className="rounded-full border-2 flex items-center justify-center shadow-lg relative transition-transform duration-150 group-hover:scale-110"
          style={{
            width: sizePx,
            height: sizePx,
            backgroundColor: `${color}30`,
            borderColor: color,
            boxShadow: `0 0 16px ${color}40, 0 4px 12px rgba(0,0,0,0.5)`,
          }}
        >
          <span
            className="font-black tabular-nums"
            style={{
              color,
              fontSize: count >= 100 ? 12 * scale : 14 * scale,
            }}
          >
            {count}
          </span>
          {/* Soft pulsing halo so clusters feel alive like selected pins */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${color}` }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
        {/* Label below — tells the user this is a group, not just a big pin */}
        <div
          className="mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider leading-none shadow"
          style={{ backgroundColor: color, color: "#000" }}
        >
          spots
        </div>
        {/* Pointer */}
        <div
          className="w-0 h-0 mt-[-2px]"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${color}`,
          }}
        />
      </button>
    </div>
  );
}

function WaterPin({ water, onClick, isSelected }: { water: MapWaterEntry; onClick: () => void; isSelected: boolean }) {
  const meta = water.topRating ? RATING_META[water.topRating] : null;
  const color = water.totalRatings > 0 ? getScoreColor(water.averageScore) : "#64748b";

  return (
    <div style={{ width: PIN_W, height: PIN_H }} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer"
      >
        {/* Pin body */}
        <div
          className="h-9 w-9 rounded-full border-2 flex items-center justify-center shadow-lg text-base relative transition-transform duration-150"
          style={{
            backgroundColor: `${color}20`,
            borderColor: color,
            boxShadow: isSelected ? `0 0 20px ${color}60, 0 4px 12px rgba(0,0,0,0.5)` : `0 4px 12px rgba(0,0,0,0.4)`,
            transform: isSelected ? "scale(1.15)" : undefined,
          }}
        >
          {meta
            ? <AppleEmoji hex={meta.emojiHex} fallback={meta.emoji} size={18} />
            : <AppleEmoji hex="1f4a7" fallback="💧" size={18} />
          }
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
      </button>
    </div>
  );
}

function getPinOffset() {
  return PIN_OFFSET;
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

  // ── Clustering ──────────────────────────────────────────────────────────
  // We re-cluster on `onIdle` (not `onBoundsChanged`) to avoid thrashing
  // React state 60x per second during pan/drag. Supercluster's internal
  // index is fast enough that we could re-run every frame, but the React
  // re-render cost is what kills us. `onIdle` fires once when the map
  // stops moving — perfect cadence.
  //
  // Between interactions, cluster lat/lngs don't change, so the existing
  // cluster pins glide along with the map during a pan with zero recompute.
  const [viewport, setViewport] = useState<{
    bbox: [number, number, number, number]; // [west, south, east, north]
    zoom: number;
  } | null>(null);

  // Only waters that have coordinates can be clustered or pinned at all.
  // Pulled out once so both the supercluster index and the fallback path
  // (used before the first onIdle fires) share the same source list.
  const pinnableWaters = useMemo(
    () => waters.filter((w): w is MapWaterEntry & { coordinates: { lat: number; lng: number } } => !!w.coordinates),
    [waters],
  );

  // Index is memoized per waters[] so we don't rebuild it on every viewport
  // change. `radius: 60` = pixels at the current zoom level that supercluster
  // considers "close enough to merge." 60px is roughly one-and-a-half pin
  // widths, which felt right when sanity-checking against the existing
  // PIN_W of 48. `maxZoom: 16` stops clustering once the user has zoomed
  // in enough that overlap stops mattering.
  const clusterIndex = useMemo(() => {
    const idx = new Supercluster<PointProps, ClusterProps>({
      radius: 60,
      maxZoom: 16,
    });
    idx.load(
      pinnableWaters.map((w) => ({
        type: "Feature" as const,
        properties: { waterId: w._id },
        geometry: {
          type: "Point" as const,
          // GeoJSON order is [lng, lat] — NOT [lat, lng]. Easy to get wrong.
          coordinates: [w.coordinates.lng, w.coordinates.lat],
        },
      })),
    );
    return idx;
  }, [pinnableWaters]);

  // Fast lookup for when a cluster resolves to a single water body (point_count
  // absent). Rebuilt alongside the index.
  const waterById = useMemo(() => {
    const m = new Map<string, MapWaterEntry>();
    for (const w of pinnableWaters) m.set(w._id, w);
    return m;
  }, [pinnableWaters]);

  // The actual cluster + point features to render at the current viewport.
  // If viewport hasn't been measured yet (before the map's first `onIdle`),
  // we render all pinnable waters as individual points with no clustering —
  // matches pre-feature behavior and avoids a blank map on first paint.
  const clusters = useMemo(() => {
    if (!viewport) {
      // pinnableWaters is already narrowed to entries with coordinates,
      // so w.coordinates is guaranteed here — but TypeScript needs the
      // assertion below to propagate that narrowing into the union result.
      return pinnableWaters.map((w) => ({
        kind: "point" as const,
        water: w,
        lat: w.coordinates.lat,
        lng: w.coordinates.lng,
      })) as Array<{
        kind: "point";
        water: MapWaterEntry & { coordinates: { lat: number; lng: number } };
        lat: number;
        lng: number;
      }>;
    }
    const features = clusterIndex.getClusters(viewport.bbox, Math.floor(viewport.zoom));
    return features.map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      // Supercluster returns a heterogeneous array: cluster features
      // (ClusterProps with `cluster: true`) and point features (PointProps
      // with our `waterId`). TypeScript's narrowing through "in" checks
      // doesn't propagate across the union cleanly, so we widen to a
      // record type and key off a single runtime flag.
      const rawProps = f.properties as Record<string, unknown>;
      const isCluster = rawProps.cluster === true;
      if (isCluster) {
        const clusterProps = rawProps as unknown as ClusterProps;
        const clusterId = clusterProps.cluster_id;
        // Average score across all the water bodies under this cluster.
        // `getLeaves` with Infinity limit walks every descendant; fine at
        // our scale. If the cluster tree ever gets massive, cap the limit
        // to ~50 and accept a sample average.
        const leaves = clusterIndex.getLeaves(clusterId, Infinity);
        let sum = 0;
        let n = 0;
        for (const leaf of leaves) {
          const w = waterById.get(leaf.properties.waterId);
          if (w && w.totalRatings > 0) {
            sum += w.averageScore;
            n++;
          }
        }
        const avgScore = n > 0 ? sum / n : 0;
        return {
          kind: "cluster" as const,
          clusterId,
          count: clusterProps.point_count,
          avgScore,
          lat,
          lng,
        };
      }
      const pointProps = rawProps as unknown as PointProps;
      const w = waterById.get(pointProps.waterId);
      if (!w || !w.coordinates) return null;
      return {
        kind: "point" as const,
        water: w as MapWaterEntry & { coordinates: { lat: number; lng: number } },
        lat,
        lng,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [viewport, clusterIndex, waterById, pinnableWaters]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (mode === "full") {
      map.setTilt(45);
    }
  }, [mode]);

  // Re-measure the viewport every time the map settles. Called once after
  // tiles load, then after every pan/zoom interaction finishes.
  const onIdle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    if (!bounds || zoom == null) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setViewport({
      bbox: [sw.lng(), sw.lat(), ne.lng(), ne.lat()],
      zoom,
    });
  }, []);

  // Clicking a cluster drills in. `getClusterExpansionZoom` returns the zoom
  // level at which this cluster will break apart into smaller clusters (or
  // individual points). Pan to the cluster's center and zoom there, so the
  // user sees the split happen smoothly from the point they tapped.
  const onClusterClick = useCallback((clusterId: number, lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const expansionZoom = clusterIndex.getClusterExpansionZoom(clusterId);
      map.panTo({ lat, lng });
      map.setZoom(Math.min(expansionZoom, 16));
    } catch {
      // getClusterExpansionZoom throws if the cluster id no longer exists
      // (e.g. user interacted during a re-cluster). Fall back to a plain
      // +2 zoom step toward the click point.
      const current = map.getZoom() ?? 3;
      map.panTo({ lat, lng });
      map.setZoom(Math.min(current + 2, 16));
    }
  }, [clusterIndex]);

  // Seed the viewport once the map finishes loading initial tiles. Some
  // environments (including unit tests, oddly) fire `onLoad` before
  // `getBounds()` is available — in that case `onIdle` handles it.
  useEffect(() => {
    if (!mapRef.current || viewport) return;
    onIdle();
    // Intentionally only depending on isLoaded so this runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

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
    minZoom: 2,
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
        onIdle={mode === "full" ? onIdle : undefined}
        onClick={onMapClick}
      >
        {/* Cluster + pin layer. `clusters` is the derived render list —
            either a flat pinnableWaters (before first onIdle) or the
            output of supercluster.getClusters(bbox, zoom). Each entry
            branches between a ClusterPin (group of N) and a WaterPin
            (individual). */}
        {mode === "full" && clusters.map((c) => {
          if (c.kind === "cluster") {
            return (
              <OverlayView
                key={`c-${c.clusterId}`}
                position={{ lat: c.lat, lng: c.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={getPinOffset}
              >
                <div style={{ position: "relative", zIndex: selected ? -1 : 2 }}>
                  <ClusterPin
                    count={c.count}
                    avgScore={c.avgScore}
                    onClick={() => onClusterClick(c.clusterId, c.lat, c.lng)}
                  />
                </div>
              </OverlayView>
            );
          }
          const isActive = selected?._id === c.water._id;
          return (
            <OverlayView
              key={`p-${c.water._id}`}
              position={c.water.coordinates}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={getPinOffset}
            >
              <div style={{ zIndex: isActive ? 1000 : (selected ? -1 : 1), position: "relative" }}>
                <WaterPin
                  water={c.water}
                  isSelected={isActive}
                  onClick={() => {
                    setSelected(c.water);
                    setInfoPos(c.water.coordinates);
                  }}
                />
              </div>
            </OverlayView>
          );
        })}

        {/* Mini map draggable marker */}
        {mode === "mini" && miniMarker && (
          <OverlayView
            position={miniMarker}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={getPinOffset}
          >
            <motion.div
              className="flex flex-col items-center"
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
          <OverlayView
            position={infoPos}
            mapPaneName={OverlayView.FLOAT_PANE}
            getPixelPositionOffset={() => ({ x: -120, y: -340 })}
          >
            <WaterInfoCard water={selected} onClose={() => setSelected(null)} />
          </OverlayView>
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
            onClick={() => mapRef.current?.setZoom(Math.max(2, (mapRef.current.getZoom() ?? 3) - 1))}
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
      className="rounded-2xl overflow-hidden shadow-2xl relative"
      style={{ width: 240, background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-black/80 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-white/80" />
      </button>
      <div className="relative h-32 w-full">
        <Image src={water.imageUrl} alt={water.name} fill className="object-cover" sizes="240px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f35] to-transparent" />
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
            <AppleEmoji hex={meta.emojiHex} fallback={meta.emoji} size={13} />
            {meta.label}
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
