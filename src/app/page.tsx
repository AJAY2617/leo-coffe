"use client";

/* Product photography uses plain img elements so external images need no optimizer service. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { products, categories, defaultOptions, money, itemPrice, deliveryFee, type CartItem, type Product, type Options } from "@/lib/menu";
import { Icon } from "@/components/icon";
import { Brand } from "@/components/brand";

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; }, [close]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button, input, select")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const elements = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, a[href]');
        if (!elements?.length) return;
        const first = elements[0]; const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, []);
  return <div className="overlay" onClick={e => { if (e.target === e.currentTarget) close(); }}><div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={close} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</div></div>;
}

export default function Home() {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [options, setOptions] = useState<Options>(defaultOptions);
  const [panel, setPanel] = useState<"cart" | "checkout" | "track" | null>(null);
  const [fulfilment, setFulfilment] = useState<"Delivery" | "Pickup">("Delivery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("brew-cart") || "[]");
      // Read browser storage after hydration; the server cannot initialize this state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(saved)) setCart(saved.filter((i: CartItem) => products.some(p => p.id === i.productId) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 20 && i.options && ["Regular", "Large"].includes(i.options.size) && ["Whole", "Oat"].includes(i.options.milk) && ["None", "Regular", "Extra"].includes(i.options.sugar)));
      setLastOrder(localStorage.getItem("brew-last-order") || "");
    } catch { /* Start with an empty cart when browser storage is unavailable. */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem("brew-cart", JSON.stringify(cart)); } catch { /* Ordering still works without storage. */ } } }, [cart, loaded]);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(""), 2600); return () => clearTimeout(timer); } }, [notice]);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + itemPrice(products.find(p => p.id === item.productId)!, item.options) * item.quantity, 0);
  const fee = deliveryFee(subtotal, fulfilment);
  const filtered = products.filter(p => (category === categories[0] || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()));
  function add(product: Product, choices: Options) {
    const key = `${product.id}-${choices.size}-${choices.milk}-${choices.sugar}`;
    const existing = cart.find(i => i.key === key);
    if (existing && existing.quantity >= 20) { setNotice("Maximum 20 of each item per order."); return; }
    setCart(current => existing ? current.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i) : [...current, { key, productId: product.id, options: { ...choices }, quantity: 1 }]);
    setSelected(null); setNotice(`${product.name} added to your bag`);
  }
  function quantity(key: string, delta: number) { setCart(current => current.map(i => i.key === key ? { ...i, quantity: Math.min(20, i.quantity + delta) } : i).filter(i => i.quantity > 0)); }
  function openPanel(value: typeof panel) { setError(""); setPanel(value); }
  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart, fulfilment, customer: { name: form.get("name"), phone: form.get("phone"), address: form.get("address") || "" }, notes: form.get("notes") }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      try { localStorage.setItem("brew-last-order", result.id); localStorage.removeItem("brew-cart"); } catch { /* The order link remains available on the next screen. */ }
      setCart([]); router.push(`/orders/${result.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't place your order. Please try again."); setBusy(false); }
  }

  return <>
    <div className="announcement"><span>Good coffee. Good mornings.</span><span className="announcement-right">Free delivery on orders ₹499+ <Icon name="arrow" size={14}/></span></div>
    <header className="header"><Brand/><nav aria-label="Main navigation"><a className="active" href="#menu">Our menu</a><a href="#story">Our story</a><button onClick={() => openPanel("track")}>Track order</button></nav><button aria-label={`Your bag ${count}`} className="bag-button" onClick={() => openPanel("cart")}><Icon name="bag" size={18}/><span>Your bag</span><span className="bag-count">{count}</span></button></header>
    <main>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span className="tiny-dot"/> YOUR NEIGHBOURHOOD COFFEE SPOT</span><h1>A little joy,<br/>freshly <em>brewed.</em></h1><p>Thoughtfully sourced coffee. Freshly baked treats.<br className="desktop-break"/> Your favourite daily ritual, delivered to your door.</p><a className="button" href="#menu">Find your favourite <Icon name="arrow" size={19}/></a><div className="hero-perks"><span><Icon name="clock" size={17}/> Fresh to you in 30–45 min</span><span><Icon name="leaf" size={17}/> Crafted with care</span></div><div className="social-proof"><div className="avatars"><span>AK</span><span>SM</span><span>RJ</span><span>NP</span></div><div><div className="stars">★★★★★ <span>Made for your daily ritual</span></div><small>A good day starts with a great cup.</small></div></div></div>
        <div className="hero-photo"><img src="/images/hero.jpg" alt="A freshly brewed cup of coffee on a rustic café table" fetchPriority="high"/><div className="photo-shade"/><span className="photo-note">Slow mornings.<br/>Really good coffee.</span><div className="roast-stamp"><Icon name="coffee" size={28}/><span>SMALL BATCH<br/>BIG HEART</span></div><div className="hero-photo-card"><span className="hero-card-icon"><Icon name="leaf" size={22}/></span><div><strong>Good from the ground up.</strong><small>Thoughtfully sourced. Lovingly brewed.</small></div></div></div>
      </section>
      <div className="values-strip"><span><Icon name="coffee"/> Specialty coffee, always</span><i/><span><Icon name="leaf"/> Ingredients we believe in</span><i/><span><Icon name="truck"/> A little happiness, delivered</span><i/><span><Icon name="star"/> Made just the way you like it</span></div>
      <section className="menu-section" id="menu"><div className="section-top"><div><span className="eyebrow">FIND YOUR EVERYDAY FAVOURITE</span><h2>Made for your kind of day<span>.</span></h2><p>From your first sip to your last crumb. Something to love, every time.</p></div><span className="fresh-label"><span className="tiny-dot"/> Freshly made to order</span></div><div className="menu-controls"><div className="category-tabs" role="group" aria-label="Menu categories">{categories.map((c, i) => <button aria-pressed={category === c} className={category === c ? "selected" : ""} key={c} onClick={() => setCategory(c)}>{i === 0 && <Icon name="coffee" size={16}/>} {c}</button>)}</div><label className="search-box"><Icon name="search" size={17}/><input aria-label="Search the menu" placeholder="Find your craving…" value={search} onChange={e => setSearch(e.target.value)}/></label></div><div className="product-grid">{filtered.map(p => <article className="product-card" key={p.id}><div className="product-photo"><img src={p.image} alt={p.name} loading="lazy"/>{p.badge && <span className="product-badge">{p.badge}</span>}<span className="photo-category">{p.category}</span></div><div className="product-info"><h3>{p.name}</h3><p>{p.description}</p><div className="product-bottom"><div><strong>{money(p.price)}</strong>{p.customizable && <small>Regular</small>}</div><button className="add-button" aria-label={`Add ${p.name}`} onClick={() => { if (p.customizable) { setOptions({ ...defaultOptions }); setSelected(p); } else add(p, defaultOptions); }}><Icon name="plus" size={17}/> Add</button></div></div></article>)}</div>{!filtered.length && <div className="empty-state"><Icon name="search" size={36}/><h3>No sips found</h3><p>Try another search, or explore all our favourites.</p><button className="button" onClick={() => { setSearch(""); setCategory(categories[0]); }}>See the full menu</button></div>}</section>
      <section className="ritual" id="story"><div className="ritual-art"><Icon name="coffee" size={72}/><span>coffee. connection. repeat.</span></div><div><span className="eyebrow">MORE THAN A CUP</span><h2>Your daily pause.<br/>Our favourite part of the day.</h2><p>We believe the little things make a big difference. A carefully pulled espresso. A warm, buttery bake. A familiar favourite, made just for you. That’s the spirit behind Leo Coffe.</p><a href="#menu">Let’s make your day a little better <Icon name="arrow" size={18}/></a></div></section>
      <section className="delivery-banner"><div className="delivery-banner-icon"><Icon name="truck" size={32}/></div><div><h3>Your coffee break, wherever you are.</h3><p>Order ahead for pickup or let us bring a little joy to your door.</p></div><a className="button" href="#menu">Order your favourites <Icon name="arrow" size={18}/></a></section>
    </main>
    <footer><div className="footer-top"><Brand/><span>A little joy in every cup.</span><Link href="/admin">Shop dashboard <Icon name="arrow" size={15}/></Link></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Leo Coffe. Made with care.</span><span>Local preview · Cash on delivery / pickup</span></div></footer>
    {notice && <div className="toast" role="status"><Icon name="check" size={18}/>{notice}<button onClick={() => { setNotice(""); openPanel("cart"); }}>View bag</button></div>}
    {selected && <Modal title="Make it your favourite" close={() => setSelected(null)}><img className="customize-photo" src={selected.image} alt={selected.name}/><h3>{selected.name}</h3><p className="muted">{selected.description}</p><div className="option-group"><span>Size</span><div>{(["Regular", "Large"] as const).map(value => <button className={options.size === value ? "choice chosen" : "choice"} aria-pressed={options.size === value} key={value} onClick={() => setOptions({ ...options, size: value })}>{value}<small>{value === "Large" ? "+₹40" : "Included"}</small></button>)}</div></div><div className="option-group"><span>Milk</span><div>{(["Whole", "Oat"] as const).map(value => <button className={options.milk === value ? "choice chosen" : "choice"} aria-pressed={options.milk === value} key={value} onClick={() => setOptions({ ...options, milk: value })}>{value} milk<small>{value === "Oat" ? "+₹30" : "Included"}</small></button>)}</div></div><div className="option-group"><span>Sugar</span><div>{(["None", "Regular", "Extra"] as const).map(value => <button className={options.sugar === value ? "choice chosen" : "choice"} aria-pressed={options.sugar === value} key={value} onClick={() => setOptions({ ...options, sugar: value })}>{value}</button>)}</div></div><button className="button full" onClick={() => add(selected, options)}>Add to bag <span>{money(itemPrice(selected, options))}</span></button></Modal>}
    {panel === "cart" && <Modal title={`Your bag (${count})`} close={() => setPanel(null)}>{cart.length ? <><div className="cart-list">{cart.map(item => { const p = products.find(p => p.id === item.productId)!; return <div className="cart-row" key={item.key}><img src={p.image} alt={p.name}/><div className="cart-row-info"><strong>{p.name}</strong><small>{p.customizable ? `${item.options.size} · ${item.options.milk} milk · ${item.options.sugar} sugar` : "Freshly baked"}</small><div className="quantity"><button onClick={() => quantity(item.key, -1)} aria-label={`Remove one ${p.name}`}><Icon name="minus" size={14}/></button><span>{item.quantity}</span><button disabled={item.quantity >= 20} onClick={() => quantity(item.key, 1)} aria-label={`Add one ${p.name}`}><Icon name="plus" size={14}/></button></div></div><strong>{money(itemPrice(p, item.options) * item.quantity)}</strong></div>; })}</div><div className="free-delivery"><Icon name="truck" size={18}/>{subtotal >= 499 ? "A little extra joy: your delivery is free!" : `${money(499 - subtotal)} away from free delivery`}</div><div className="totals"><span>Subtotal<strong>{money(subtotal)}</strong></span><small>Delivery is calculated at checkout.</small></div><button className="button full" onClick={() => openPanel("checkout")}>Continue to checkout <Icon name="arrow" size={18}/></button><button className="text-button" onClick={() => setPanel(null)}>Keep exploring</button></> : <div className="empty-state"><Icon name="bag" size={44}/><h3>A good cup is waiting.</h3><p>Your bag is empty. Let’s find you something lovely.</p><button className="button" onClick={() => { setPanel(null); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Explore the menu <Icon name="arrow" size={18}/></button></div>}</Modal>}
    {panel === "checkout" && <Modal title="One step closer to a good day" close={() => { if (!busy) setPanel(null); }}><form onSubmit={checkout}><div className="fulfilment"><button type="button" className={fulfilment === "Delivery" ? "choice chosen" : "choice"} onClick={() => setFulfilment("Delivery")}><Icon name="truck"/> Delivery</button><button type="button" className={fulfilment === "Pickup" ? "choice chosen" : "choice"} onClick={() => setFulfilment("Pickup")}><Icon name="bag"/> Pickup</button></div><label className="field">Your name<input name="name" autoComplete="name" placeholder="e.g. Ananya Sharma" minLength={2} maxLength={100} required/></label><label className="field">Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="e.g. 98765 43210" pattern="\+?[0-9\s()\-]{10,18}" required/></label>{fulfilment === "Delivery" ? <label className="field">Delivery address<textarea name="address" autoComplete="street-address" placeholder="Flat / house, street, area, city and PIN code" minLength={10} maxLength={500} required/></label> : <p className="pickup-note">Pickup is selected. This preview has no shop address configured yet; add your real location before accepting live orders.</p>}<label className="field">Anything we should know? <span>(optional)</span><input name="notes" placeholder="Delivery instructions or a little request" maxLength={500}/></label><div className="payment-note"><Icon name="check" size={19}/><div><strong>Pay {fulfilment === "Delivery" ? "on delivery" : "at pickup"}</strong><small>Cash payment · No online payment required</small></div></div><div className="totals"><span>Subtotal<strong>{money(subtotal)}</strong></span><span>Delivery<strong>{fee ? money(fee) : "Free"}</strong></span><span className="total">Total<strong>{money(subtotal + fee)}</strong></span></div><p className="preview-note">Local preview: orders are saved for testing and do not dispatch a real delivery.</p>{error && <p className="error" role="alert">{error}</p>}<button disabled={busy || !cart.length} className="button full" type="submit">{busy ? "Placing your order…" : "Place my order"}<Icon name="arrow" size={18}/></button><button type="button" className="text-button" disabled={busy} onClick={() => openPanel("cart")}>Back to your bag</button></form></Modal>}
    {panel === "track" && <Modal title="Your daily joy, on its way" close={() => setPanel(null)}><p className="muted">Use the tracking link from your order confirmation, or enter your order reference below.</p>{lastOrder && <Link className="button full" href={`/orders/${lastOrder}`}>Track your latest order <Icon name="arrow" size={18}/></Link>}<form onSubmit={e => { e.preventDefault(); const value = String(new FormData(e.currentTarget).get("orderId")).trim(); if (/^[a-f0-9-]{36}$/i.test(value)) router.push(`/orders/${value}`); else setError("Please enter the full order reference from your confirmation."); }}><label className="field">Order reference<input name="orderId" placeholder="Your full order reference" required/></label>{error && <p className="error" role="alert">{error}</p>}<button className="button full">Find my order <Icon name="arrow" size={18}/></button></form></Modal>}
  </>;
}





