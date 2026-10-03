import { NextResponse } from "next/server";
import { COOKIE, equal, sameOrigin, token } from "@/lib/auth";
const attempts = new Map<string, { count: number; reset: number }>();
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Shop login has not been configured." }, { status: 503 });
  const key = request.headers.get("x-forwarded-for") || "local";
  const attempt = attempts.get(key);
  if (attempt && attempt.reset > Date.now() && attempt.count >= 10) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof body.password !== "string" || !equal(body.password, process.env.ADMIN_PASSWORD)) {
    attempts.set(key, { count: attempt && attempt.reset > Date.now() ? attempt.count + 1 : 1, reset: attempt && attempt.reset > Date.now() ? attempt.reset : Date.now() + 900000 });
    return NextResponse.json({ error: "That password doesn't match. Please try again." }, { status: 401 });
  }
  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(COOKIE, token(), { httpOnly: true, sameSite: "strict", secure, path: "/", maxAge: 28800 });
  return response;
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const response = NextResponse.json({ ok: true }); response.cookies.delete(COOKIE); return response;
}
