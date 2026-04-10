"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ChevronDown, ChevronUp,
  Send, Droplets, User, ThumbsUp, X, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  waterBodyName?: string;
  waterBodyId?: string;
  tags: string[];
  replies: Reply[];
  upvotes: number;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replies, setReplies] = useState<Reply[]>(post.replies);
  const [submitting, setSubmitting] = useState(false);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/forum/${post._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText, author: replyAuthor || "Anonymous" }),
      });
      const data = await r.json();
      if (r.ok) {
        setReplies(data.replies);
        setReplyText("");
        setReplyAuthor("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-slate-900/50 overflow-hidden"
    >
      {/* Post header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white text-sm leading-tight">{post.title}</h3>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-zinc-500">{post.author}</span>
              <span className="text-zinc-700 text-xs">·</span>
              <span className="text-xs text-zinc-600">{timeAgo(post.createdAt)}</span>
              {post.waterBodyName && (
                <>
                  <span className="text-zinc-700 text-xs">·</span>
                  <Link
                    href={post.waterBodyId ? `/water/${post.waterBodyId}` : "#"}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-cyan-600 hover:text-cyan-400 flex items-center gap-0.5"
                  >
                    <Droplets className="h-2.5 w-2.5" />
                    {post.waterBodyName}
                  </Link>
                </>
              )}
            </div>
            {/* Tags + reply count preview */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] rounded-full px-2 py-0.5 border border-white/10 text-zinc-500"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {!expanded && (
                <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {replies.length} repl{replies.length !== 1 ? "ies" : "y"}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded body + replies */}
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
              {/* Body */}
              <p className="mt-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {post.body}
              </p>

              {/* Replies */}
              {replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="text-xs text-zinc-500 font-medium">
                    {replies.length} repl{replies.length !== 1 ? "ies" : "y"}
                  </div>
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
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                    maxLength={1000}
                    className="flex-1 rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                  />
                  <button
                    onClick={submitReply}
                    disabled={!replyText.trim() || submitting}
                    className="flex-shrink-0 h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", body: "", author: "", tags: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/forum?limit=30")
      .then((r) => r.json())
      .then((d) => { setPosts(d.posts ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          author: form.author || "Anonymous",
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
        }),
      });
      const post = await r.json();
      if (r.ok) {
        setPosts((prev) => [post, ...prev]);
        setForm({ title: "", body: "", author: "", tags: "" });
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060d1f] text-white pt-14 md:pt-14">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32 md:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Forum</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Discuss water quality, share tips, ask questions</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              showForm
                ? "bg-white/10 text-white"
                : "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
            )}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New Post"}
          </button>
        </div>

        {/* New post form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              onSubmit={submitPost}
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
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  maxLength={50}
                  className="rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                />
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="rounded-xl bg-slate-800/60 border border-white/8 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                />
              </div>
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

        {/* Posts */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-white">No discussions yet</h3>
            <p className="mt-2 text-zinc-500 text-sm mb-6">Start the conversation!</p>
            <button
              onClick={() => setShowForm(true)}
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
      </div>
    </main>
  );
}
