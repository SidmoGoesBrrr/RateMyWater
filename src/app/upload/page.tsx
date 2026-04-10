"use client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Upload, X, User, FileText, ChevronLeft,
  CheckCircle, Loader2, MapPin, Crosshair
} from "lucide-react";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { cn } from "@/lib/utils";

// Dynamically import the map to avoid SSR issues
const GoogleMapView = dynamic(
  () => import("@/components/GoogleMapView").then((m) => m.GoogleMapView),
  { ssr: false }
);

const WATER_TYPES = [
  { value: "beach", label: "Beach", emoji: "🏖️" },
  { value: "ocean", label: "Ocean", emoji: "🌊" },
  { value: "lake", label: "Lake", emoji: "🏔️" },
  { value: "river", label: "River", emoji: "🌿" },
  { value: "pond", label: "Pond", emoji: "🦆" },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    type: "",
    description: "",
    uploadedBy: "",
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB."); return; }
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const locateMe = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoordinates(coords);
        setShowMap(true);
      },
      () => setError("Could not get your location.")
    );
  }, []);

  const handlePlaceSelected = useCallback(
    (place: { address: string; lat: number; lng: number; name?: string }) => {
      setForm((f) => ({
        ...f,
        location: place.address,
        name: f.name || place.name || "",
      }));
      setCoordinates({ lat: place.lat, lng: place.lng });
      setShowMap(true);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !form.name || !form.location || !form.type) {
      setError("Please fill in all required fields and upload a photo.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

      setUploading(false);
      setSubmitting(true);

      const res = await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: uploadData.url,
          ...(coordinates ? { coordinates } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => router.push(`/water/${data._id}`), 1800);
    } catch (err) {
      setUploading(false);
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isLoading = uploading || submitting;

  return (
    <main className="min-h-screen bg-[#060d1f] text-white pt-14 md:pt-14">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto px-4 pt-6 pb-32 md:pb-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black text-white">Submit Water</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Help the community know what they&apos;re getting into.
          </p>
        </motion.div>

        <AnimatePresence>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                className="text-7xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                🌊
              </motion.div>
              <CheckCircle className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">Water submitted!</h2>
              <p className="mt-2 text-zinc-400">Redirecting to your water&apos;s page…</p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* ── Image drop zone ────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Photo <span className="text-red-400">*</span>
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => !previewUrl && fileInputRef.current?.click()}
                  className={cn(
                    "relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
                    isDragging ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]" : "border-white/15 bg-slate-900/40 hover:border-white/25",
                    !previewUrl && "cursor-pointer"
                  )}
                  style={{ minHeight: 180 }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                  {previewUrl ? (
                    <div className="relative h-56 w-full">
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setSelectedFile(null); }}
                        className="absolute top-3 right-3 rounded-full bg-black/70 p-1.5 hover:bg-black/90 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-zinc-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-zinc-300 font-medium">
                          Drop your photo or <span className="text-cyan-400">click to browse</span>
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WEBP · max 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Water type ─────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Water Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {WATER_TYPES.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: value }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 border text-xs font-medium transition-all duration-200",
                        form.type === value
                          ? "border-cyan-500/50 bg-cyan-500/15 text-white scale-[1.04]"
                          : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Name ───────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Water Body Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Roth Pond, Bondi Beach"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              {/* ── Location with Places autocomplete ──────── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-300">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={locateMe}
                    className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-400 transition-colors"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    Use my location
                  </button>
                </div>
                <PlacesAutocomplete
                  value={form.location}
                  onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                  onPlaceSelected={handlePlaceSelected}
                  placeholder="Search or type location…"
                />
                {coordinates && (
                  <p className="mt-1.5 text-xs text-cyan-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Pin at {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
                      className="ml-2 text-cyan-600 hover:text-cyan-400 underline"
                    >
                      {showMap ? "Hide" : "Show"} map
                    </button>
                  </p>
                )}
              </div>

              {/* ── Mini map ───────────────────────────────── */}
              <AnimatePresence>
                {showMap && coordinates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 220 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-2xl border border-white/10"
                  >
                    <div className="h-[220px] w-full">
                      <GoogleMapView
                        waters={[]}
                        center={coordinates}
                        zoom={14}
                        mode="mini"
                        miniMarker={coordinates}
                        onMiniMarkerChange={(pos) => setCoordinates(pos)}
                      />
                    </div>
                    <p className="text-xs text-zinc-600 px-3 py-2 bg-slate-900/80 border-t border-white/5">
                      Drag the pin to fine-tune the location · Click anywhere to move
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Description ────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <FileText className="inline h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                  Description{" "}
                  <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Vibe? Notable features? Mystery foam?"
                  maxLength={500}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                />
              </div>

              {/* ── Name ───────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <User className="inline h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                  Your Name{" "}
                  <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Anonymous"
                  maxLength={50}
                  value={form.uploadedBy}
                  onChange={(e) => setForm((f) => ({ ...f, uploadedBy: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              {/* ── Error ──────────────────────────────────── */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  >
                    <X className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Submit button ───────────────────────────── */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploading ? "Uploading photo…" : "Submitting…"}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Submit Water Body
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
