"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Upload, X, MapPin, User, FileText, ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import { FloatingNav } from "@/components/ui/floating-nav";
import { MovingBorderButton } from "@/components/ui/moving-border";
import { Trophy, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Home", link: "/" },
  { name: "Leaderboard", link: "/leaderboard", icon: <Trophy className="h-3.5 w-3.5" /> },
  { name: "Submit Water", link: "/upload", icon: <Upload className="h-3.5 w-3.5" /> },
];

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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !form.name || !form.location || !form.type) {
      setError("Please fill in all required fields and upload a photo.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 1. Upload image
      const fd = new FormData();
      fd.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

      setUploading(false);
      setSubmitting(true);

      // 2. Create water body
      const res = await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl: uploadData.url }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      setSubmitting(false);
      setSubmitted(true);

      setTimeout(() => {
        router.push(`/water/${data._id}`);
      }, 1800);
    } catch (err) {
      setUploading(false);
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isLoading = uploading || submitting;

  return (
    <main className="min-h-screen bg-[#060d1f] text-white">
      <FloatingNav navItems={NAV_ITEMS} />

      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-28 pb-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-black text-white">Submit a Water Body</h1>
          <p className="mt-2 text-zinc-400">
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
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="text-7xl mb-6"
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
              className="space-y-6"
            >
              {/* Image drop zone */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Photo <span className="text-red-400">*</span>
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => !previewUrl && fileInputRef.current?.click()}
                  className={cn(
                    "relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
                    isDragging
                      ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                      : "border-white/15 bg-slate-900/40 hover:border-white/25 hover:bg-slate-900/60",
                    !previewUrl && "cursor-pointer"
                  )}
                  style={{ minHeight: 200 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />

                  {previewUrl ? (
                    <div className="relative h-64 w-full">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-3 right-3 rounded-full bg-black/70 p-1.5 hover:bg-black/90 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-zinc-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-zinc-300 font-medium">
                          Drop your photo here or{" "}
                          <span className="text-cyan-400">click to browse</span>
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Water type */}
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
                          ? "border-cyan-500/50 bg-cyan-500/15 text-white scale-105"
                          : "border-white/10 bg-slate-900/40 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                      )}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Water Body Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Droplets className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="e.g. Bondi Beach"
                      maxLength={100}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900/60 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="e.g. Sydney, Australia"
                      maxLength={100}
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full rounded-xl bg-slate-900/60 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <FileText className="inline h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                  Description{" "}
                  <span className="text-zinc-600 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="What's the vibe? Any notable features? Mysterious foam?"
                  maxLength={500}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all resize-none"
                />
              </div>

              {/* Submitted by */}
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
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all"
                />
              </div>

              {/* Error */}
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

              {/* Submit */}
              <MovingBorderButton
                as="button"
                type="submit"
                disabled={isLoading}
                containerClassName="h-14 w-full rounded-xl"
                className="gap-2 text-base font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                duration={2500}
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
              </MovingBorderButton>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
