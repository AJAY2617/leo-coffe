import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const COOKIE = "brew_admin";
export function equal(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
export function signature(value: string) { return createHmac("sha256", process.env.ADMIN_PASSWORD || "disabled").update(value).digest("hex"); }
export function token() { const expiry = String(Date.now() + 8 * 60 * 60 * 1000); return `${expiry}.${signature(expiry)}`; }
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const value = (await cookies()).get(COOKIE)?.value || "";
  const [expiry, hash] = value.split(".");
  return !!hash && Number(expiry) > Date.now() && equal(hash, signature(expiry));
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    const host = request.headers.get("host") || target.host;
    const protocol = request.headers.get("x-forwarded-proto") ? `${request.headers.get("x-forwarded-proto")}:` : target.protocol;
    return source.host === host && source.protocol === protocol;
  } catch { return false; }
}
