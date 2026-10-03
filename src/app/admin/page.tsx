"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { type Order, type Status, statuses, money } from "@/lib/menu";
import { Icon } from "@/components/icon";
import { Brand } from "@/components/brand";
export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All orders");
  const load = useCallback(async () => {
    try { const response = await fetch("/api/orders", { cache: "no-store" }); if (response.status === 401) { setLoggedIn(false); return; } if (!response.ok) throw Error("Couldn't load orders. Try refreshing."); setOrders(await response.json()); setLoggedIn(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); } finally { setLoading(false); }
  }, []);
  // This effect fetches external order data; updates occur after the request resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (loggedIn) { const timer = setInterval(load, 10000); return () => clearInterval(timer); } }, [loggedIn, load]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); const form = new FormData(e.currentTarget);
    try { const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password") }) }); const result = await response.json(); if (!response.ok) throw Error(result.error); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't log in."); } finally { setBusy(false); }
  }
  async function update(id: string, status: Status) {
    setBusy(true); setError("");
    try { const response = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) { const result = await response.json(); throw Error(result.error); } await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't update order."); } finally { setBusy(false); }
  }
  async function logout() { setError(""); try { const response = await fetch("/api/admin/session", { method: "DELETE" }); if (!response.ok) throw Error("Couldn't log out. Please try again."); setLoggedIn(false); setOrders([]); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't log out."); } }
  return <main className="admin-shell"><header className="admin-header"><Brand/><span>SHOP DASHBOARD</span>{loggedIn && <button className="choice" onClick={logout}>Log out</button>}</header>{loading ? <p role="status">Opening the shop…</p> : !loggedIn ? <div className="login-card"><Icon name="coffee" size={40}/><h1>Welcome back.</h1><p className="muted">A good day starts behind the counter.</p><form onSubmit={login}><label className="field">Shop password<input name="password" type="password" autoComplete="current-password" required/></label>{error && <p className="error" role="alert">{error}</p>}<button className="button full" disabled={busy}>{busy ? "Logging in…" : "Open dashboard"}<Icon name="arrow" size={18}/></button></form></div> : <><div className="section-top"><div><span className="eyebrow">BEHIND THE COUNTER</span><h1>Good things are brewing.</h1><p>Your orders, all in one place. Updates refresh every 10 seconds.</p></div><button className="choice" onClick={load}>Refresh orders</button></div><div className="admin-stats"><div><small>Total orders</small><strong>{orders.length}</strong></div><div><small>In progress</small><strong>{orders.filter(o => o.status !== "Delivered").length}</strong></div><div><small>Delivered / collected value</small><strong>{money(orders.filter(o => o.status === "Delivered").reduce((s, o) => s + o.total, 0))}</strong></div></div><div className="category-tabs admin-tabs">{["All orders", ...statuses].map(s => <button key={s} className={filter === s ? "selected" : ""} onClick={() => setFilter(s)}>{s}</button>)}</div>{error && <p className="error" role="alert">{error}</p>}<div className="admin-orders">{orders.filter(o => filter === "All orders" || o.status === filter).map(order => <article className="admin-order" key={order.id}><div className="admin-order-top"><div><Link href={`/orders/${order.id}`}>#{order.id.slice(0, 8).toUpperCase()}</Link><small>{new Date(order.createdAt).toLocaleString("en-IN")}</small></div><span className="status-pill">{order.fulfilment} · {order.fulfilment === "Pickup" && order.status === "Out for delivery" ? "Ready for pickup" : order.fulfilment === "Pickup" && order.status === "Delivered" ? "Collected" : order.status}</span></div><h3>{order.customer.name} <a href={`tel:${order.customer.phone.replace(/[^+\d]/g, "")}`}>{order.customer.phone}</a></h3>{order.fulfilment === "Delivery" && <p><Icon name="pin" size={16}/>{order.customer.address}</p>}<ul>{order.items.map((item, i) => <li key={i}>{item.quantity} × {item.name} <small>{item.options.size} / {item.options.milk} / {item.options.sugar} sugar</small><strong>{money(item.unitPrice * item.quantity)}</strong></li>)}</ul>{order.notes && <p className="order-note">Note: {order.notes}</p>}<div className="admin-order-bottom"><strong>{money(order.total)} <small>Cash {order.fulfilment === "Delivery" ? "on delivery" : "at pickup"}</small></strong><label>Order status<select value={order.status} disabled={busy} onChange={e => update(order.id, e.target.value as Status)}>{statuses.map(s => <option key={s} value={s}>{order.fulfilment === "Pickup" && s === "Out for delivery" ? "Ready for pickup" : order.fulfilment === "Pickup" && s === "Delivered" ? "Collected" : s}</option>)}</select></label></div></article>)}</div>{!orders.filter(o => filter === "All orders" || o.status === filter).length && <div className="empty-state"><Icon name="bag" size={42}/><h3>No orders here yet.</h3><p>New customer orders will appear here.</p><Link href="/" className="button">Visit your shop <Icon name="arrow" size={18}/></Link></div>}</>}</main>;
}

