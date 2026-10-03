import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { products, itemPrice, deliveryFee, type CartItem, type Order } from "@/lib/menu";
import { saveOrder, readOrders, orderStorageAvailable } from "@/lib/store";
import { isAdmin, sameOrigin } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  try { return NextResponse.json(await readOrders(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "Order storage is temporarily unavailable." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!orderStorageAvailable()) return NextResponse.json({ error: "Online ordering is not ready yet. Please try again later." }, { status: 503 });
  try {
    const body = await request.json();
    const customer = body.customer;
    if (!customer || typeof customer.name !== "string" || customer.name.trim().length < 2 || customer.name.length > 100 || typeof customer.phone !== "string" || !/^\+?[\d\s()-]{10,18}$/.test(customer.phone) || typeof customer.address !== "string" || customer.address.length > 500 || !["Delivery", "Pickup"].includes(body.fulfilment) || (body.fulfilment === "Delivery" && customer.address.trim().length < 10)) throw Error("Please enter a valid name, phone number, and delivery address.");
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50) throw Error("Please add an item to your order.");
    const items = body.items.map((item: CartItem) => {
      const product = products.find(p => p.id === item.productId);
      if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 || !item.options || !["Regular", "Large"].includes(item.options.size) || !["Whole", "Oat"].includes(item.options.milk) || !["None", "Regular", "Extra"].includes(item.options.sugar)) throw Error("An item in your cart is invalid.");
      return { key: `${product.id}-${item.options.size}-${item.options.milk}-${item.options.sugar}`, productId: product.id, quantity: item.quantity, options: item.options, name: product.name, unitPrice: itemPrice(product, item.options) };
    });
    const subtotal = items.reduce((sum: number, item: Order["items"][number]) => sum + item.unitPrice * item.quantity, 0);
    const delivery = deliveryFee(subtotal, body.fulfilment);
    const order: Order = { id: randomUUID(), createdAt: new Date().toISOString(), status: "Confirmed", customer: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() }, fulfilment: body.fulfilment, items, subtotal, delivery, total: subtotal + delivery, notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : "" };
    try { await saveOrder(order); }
    catch { return NextResponse.json({ error: "We couldn't save your order. Please try again." }, { status: 503 }); }
    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to place order. Please try again." }, { status: 400 }); }
}
