import { cookies } from "next/headers";
import { nanoid } from "nanoid";

const COOKIE = "rmw_did";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function readDeviceId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;
  const fresh = nanoid(16);
  jar.set(COOKIE, fresh, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return fresh;
}
