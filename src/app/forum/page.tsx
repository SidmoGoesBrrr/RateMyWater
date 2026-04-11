"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@auth0/nextjs-auth0";
import {
  MessageSquare, Plus, ChevronDown, ChevronUp,
  Send, Droplets, User, X, Tag, LogIn, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface Reply {
  body: string;
  author: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  body: string;
  author: string;
  authorName?: string;
  authorUserId?: string;
  waterBodyName?: string;
  waterBodyId?: string;
  tags: string[];
  replies: Reply[];
  createdAt: string;
}

interface ForumResponse {
  posts: Post[];
  nextCursor: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function displayName(post: Post) {
  return post.authorName || post.author || "Anonymous";
}

// ── Post card (inline for Pass 1; extract into ForumPostCard in a later pass) ─

function PostCard({ post }: { post: Post }) {
  const { user } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Reply[]>(post.replies);
  const [submitting, setSubmitting] = useState(false);

  const submitReply = async () => {
    if (!replyText.trim() || !user) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/forum/${post._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText }),
      });
      const data = await r.json();
      if (r.ok) {
        setReplies(data.replies);
        setReplyText("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-slate-900/50 overflow-hidden"
    >
      {/* Header (reddit-style: title up top) */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <div className="h-6 w-6 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
            <User className="h-3 w-3 text-cyan-500" />
          </div>
          <span className="text-zinc-400 font-medium">{displayName(post)}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600">{timeAgo(post.createdAt)}</span>
          {post.waterBodyName && (
            <>
              <span className="text-zinc-700">·</span>
              <Link
                href={post.waterBodyId ? `/water/${post.waterBodyId}` : "#"}
                className="text-cyan-600 hover:text-cyan-400 flex items-center gap-0.5"
              >
                <Droplets className="h-2.5 w-2.5" />
                {post.waterBodyName}
              </Link>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-white leading-tight mb-2">{post.title}</h2>

        {/* Body — collapsed preview unless expanded */}
        <div
          className={cn(
            "text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap",
            !expanded && "line-clamp-4"
          )}
        >
          {post.body}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] rounded-full px-2 py-0.5 border border-white/10 text-zinc-500"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: comments toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {replies.length === 0
            ? "Add a comment"
            : `View ${replies.length} comment${replies.length === 1 ? "" : "s"}`}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Expanded comments */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5">
              {replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  {replies.map((reply, i) => (
                    <div key={i} className="flex gap-2.5 pl-3 border-l border-white/8">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-cyan-600">{reply.author}</span>
                          <span className="text-[10px] text-zinc-600">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{reply.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              {user ? (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitReply();
                      }
                    }}
                    maxLength={1000}
                    className="flex-1 rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={submitReply}
                    disabled={!replyText.trim() || submitting}
                    className="flex-shrink-0 h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <a
                  href="/auth/login?returnTo=/forum"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in to comment
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ── Composer modal ─────────────────────────────────────────────────────────

function Composer({
  open,
  onClose,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  onPosted: (post: Post) => void;
}) {
  const [form, setForm] = useState({ title: "", body: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 5),
        }),
      });
      if (!r.ok) {
        if (r.status === 401) {
          window.location.href = "/auth/login?returnTo=/forum";
          return;
        }
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Failed to post");
        return;
      }
      const post = (await r.json()) as Post;
      onPosted(post);
      setForm({ title: "", body: "", tags: "" });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.form
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          onSubmit={submit}
          className="mb-6 rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Start a Discussion
          </h3>
          <input
            type="text"
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={150}
            required
            className="w-full rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
          <textarea
            placeholder="What's on your mind? *"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            maxLength={2000}
            rows={4}
            required
            className="w-full rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all resize-none"
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="w-full rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.body.trim()}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Posting…" : "Post Discussion"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

// ── Forum page ─────────────────────────────────────────────────────────────

export default function ForumPage() {
  const { user, isLoading: userLoading } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [composing, setComposing] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "15" });
      if (cursor) params.set("cursor", cursor);
      const r = await fetch(`/api/forum?${params.toString()}`);
      if (!r.ok) throw new Error("fetch failed");
      const data: ForumResponse = await r.json();
      setPosts((prev) => {
        // Dedupe by _id in case of overlap during rapid prepends.
        const seen = new Set(prev.map((p) => p._id));
        const fresh = data.posts.filter((p) => !seen.has(p._id));
        return [...prev, ...fresh];
      });
      setCursor(data.nextCursor);
      setHasMore(data.nextCursor !== null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [cursor, hasMore, loading]);

  // Initial load.
  useEffect(() => {
    if (!initialLoaded) {
      loadMore();
    }
    // Intentionally only runs once on mount — loadMore's own guards handle
    // re-entry, and we don't want the initial fetch to re-fire every time
    // loadMore changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver for infinite scroll.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "800px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleNewPostClick = () => {
    if (userLoading) return;
    if (!user) {
      window.location.href = "/auth/login?returnTo=/forum";
      return;
    }
    setComposing((v) => !v);
  };

  const handlePosted = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  return (
    <main className="min-h-screen bg-[#060d1f] text-white pt-14 md:pt-14">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Forum</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Discuss water quality, share tips, ask questions
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewPostClick}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              composing
                ? "bg-white/10 text-white"
                : "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
            )}
          >
            {composing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {composing ? "Cancel" : "New Post"}
          </button>
        </div>

        {/* Composer (only mounted when user is authed) */}
        {user && (
          <Composer
            open={composing}
            onClose={() => setComposing(false)}
            onPosted={handlePosted}
          />
        )}

        {/* Posts */}
        {!initialLoaded ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-white">No discussions yet</h3>
            <p className="mt-2 text-zinc-500 text-sm mb-6">Start the conversation!</p>
            <button
              type="button"
              onClick={handleNewPostClick}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold px-5 py-2.5 text-sm hover:bg-cyan-500/25 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Post
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel + loading indicator */}
        {initialLoaded && hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-8">
            {loading && <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />}
          </div>
        )}

        {initialLoaded && !hasMore && posts.length > 0 && (
          <p className="text-center text-xs text-zinc-600 py-8">
            You&apos;ve reached the bottom.
          </p>
        )}
      </div>
    </main>
  );
}
