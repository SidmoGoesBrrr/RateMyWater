import mongoose from "mongoose";

// Gotcha #1: cache the connection on globalThis so HMR / module re-execution
// doesn't open a fresh client on every request and exhaust the Atlas pool.
type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const g = globalThis as unknown as { _mongoose?: Cached };
const cached: Cached = g._mongoose ?? (g._mongoose = { conn: null, promise: null });

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // Read the URI lazily so importing this module at build time (when env
    // vars may be absent) doesn't blow up.
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    cached.promise = mongoose.connect(uri, {
      // Gotcha #6: fail fast instead of silently buffering when disconnected.
      bufferCommands: false,
      // Don't hang for 30s on a bad URI / unreachable cluster.
      serverSelectionTimeoutMS: 5000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
