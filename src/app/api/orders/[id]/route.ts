import { NextResponse } from "next/server";
import { findOrder, updateOrderStatus } from "@/lib/store";
import { statuses, type Status } from "@/lib/menu";
import { isAdmin, sameOrigin } from "@/lib/auth";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let order;
  try { order = await findOrder(id); }
  catch { return NextResponse.json({ error: "Order storage is temporarily unavailable." }, { status: 503 }); }
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  // The unguessable order link shows progress without exposing customer contact details.
  const { customer: _customer, notes: _notes, ...tracking } = order;
  void _customer; void _notes;
  return NextResponse.json(tracking, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!await isAdmin()) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const { id } = await context.params;
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!statuses.includes(body.status as Status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  let updated;
  try { updated = await updateOrderStatus(id, body.status); }
  catch { return NextResponse.json({ error: "We couldn't update this order. Please try again." }, { status: 503 }); }
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Order not found." }, { status: 404 });
}
