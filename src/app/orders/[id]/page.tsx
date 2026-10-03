"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { type Order, statuses, money } from "@/lib/menu";
import { Icon } from "@/components/icon";
import { Brand } from "@/components/brand";
export default function Tracking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Omit<Order, "customer" | "notes"> | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try { const response = await fetch(`/api/orders/${id}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw Error(data.error); if (active) { setOrder(data); setError(""); } }
      catch (err) { if (active) setError(err instanceof Error ? err.message : "We couldn't load this order."); }
    }
    load(); const timer = setInterval(load, 10000); return () => { active = false; clearInterval(timer); };
  }, [id]);
  const steps = order?.fulfilment === "Pickup" ? ["Confirmed", "Preparing", "Ready for pickup", "Collected"] : [...statuses];
  const current = order ? statuses.indexOf(order.status) : 0;
  return <main className="standalone"><Brand/><div className="tracking-card">{!order ? <><Icon name="coffee" size={44}/><h1>{error ? "Let’s find your order." : "Finding your favourite…"}</h1><p className="muted" role={error ? "alert" : "status"}>{error || "Just a moment."}</p></> : <><div className="success-icon"><Icon name={current === 3 ? "check" : "coffee"} size={36}/></div><span className="eyebrow">A LITTLE JOY IS ON THE WAY</span><h1>{current === 3 ? "Enjoy your little moment." : "Thanks a latte!"}</h1><p className="muted">{order.fulfilment === "Pickup" ? "Your pickup order" : "Your order"} is <strong>{steps[current].toLowerCase()}</strong>.</p><div className="order-reference">Order #{id.slice(0, 8).toUpperCase()} <span>{new Date(order.createdAt).toLocaleString("en-IN")}</span></div><div className="tracking-steps">{steps.map((s, i) => <div key={s} className={i <= current ? "step completed" : "step"}><span>{i < current ? <Icon name="check" size={17}/> : i + 1}</span><strong>{s}</strong>{i === current && <small>Current status</small>}</div>)}</div>{error && <p className="error" role="alert">{error} We’ll retry automatically.</p>}<div className="tracking-items">{order.items.map((item, i) => <div key={i}><span>{item.quantity} × {item.name}<small>{item.options.size} · {item.options.milk} milk</small></span><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}<div><span>Delivery</span><strong>{order.delivery ? money(order.delivery) : "Free"}</strong></div><div className="total"><span>Total · Pay {order.fulfilment === "Pickup" ? "at pickup" : "on delivery"}</span><strong>{money(order.total)}</strong></div></div><button className="button full" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setError("Copy the link from your browser’s address bar to save it."); } }}>{copied ? "Tracking link copied" : "Copy tracking link"}<Icon name="check" size={18}/></button><p className="preview-note">Local preview · Status is updated by the shop dashboard. No real delivery is dispatched.</p></>}<Link className="text-button" href="/">Back to the menu <Icon name="arrow" size={16}/></Link></div></main>;
}

