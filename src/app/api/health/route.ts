import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { jsonError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Gotcha #5: connect inside the handler, never at module top level.
    const conn = await dbConnect();
    const state = conn.connection.readyState; // 1 = connected
    return NextResponse.json({
      ok: true,
      db: state === 1 ? "connected" : `state-${state}`,
    });
  } catch (err) {
    return jsonError(
      500,
      "Database connection failed",
      err instanceof Error ? err.message : String(err),
    );
  }
}
