export type Product = { id: string; name: string; description: string; category: string; price: number; image: string; badge?: string; customizable: boolean };
const photo = (id: string) => `/images/${id}.jpg`;
export const products: Product[] = [
  { id: "latte", name: "Signature Latte", description: "Velvety espresso meets silky steamed milk.", category: "Hot coffee", price: 180, image: photo("photo-1570968915860-54d5c301fa9f"), badge: "HOUSE FAVOURITE", customizable: true },
  { id: "iced-latte", name: "Iced Vanilla Latte", description: "A smooth espresso, vanilla, and a little chill.", category: "Iced coffee", price: 220, image: photo("photo-1461023058943-07fcbe16d735"), badge: "BESTSELLER", customizable: true },
  { id: "matcha", name: "Matcha Latte", description: "Earthy ceremonial matcha, perfectly balanced.", category: "Matcha & more", price: 240, image: photo("photo-1515823064-d6e0c04616a7"), customizable: true },
  { id: "croissant", name: "Butter Croissant", description: "Golden, flaky layers. Baked fresh every day.", category: "Fresh bakes", price: 140, image: photo("photo-1555507036-ab1f4038808a"), badge: "FRESHLY BAKED", customizable: false },
  { id: "americano", name: "Classic Americano", description: "Our house espresso, beautifully uncomplicated.", category: "Hot coffee", price: 150, image: photo("photo-1509042239860-f550ce710b93"), customizable: true },
  { id: "cold-brew", name: "Slow Steeped Cold Brew", description: "Steeped for 18 hours. Smooth to the last sip.", category: "Iced coffee", price: 210, image: photo("photo-1517701604599-bb29b565090c"), customizable: true },
  { id: "chocolate", name: "Cozy Hot Chocolate", description: "Rich cocoa with a soft cloud of steamed milk.", category: "Matcha & more", price: 200, image: photo("photo-1542990253-0b8be5b5ed0a"), customizable: true },
  { id: "cookie", name: "Chocolate Chip Cookie", description: "Crisp edges, a soft centre, generous chocolate.", category: "Fresh bakes", price: 100, image: photo("photo-1499636136210-6f4ee915583e"), customizable: false },
];
export const categories = ["All favourites", "Hot coffee", "Iced coffee", "Matcha & more", "Fresh bakes"];
export type Options = { size: "Regular" | "Large"; milk: "Whole" | "Oat"; sugar: "None" | "Regular" | "Extra" };
export type CartItem = { key: string; productId: string; quantity: number; options: Options };
export const defaultOptions: Options = { size: "Regular", milk: "Whole", sugar: "Regular" };
export const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
export function itemPrice(product: Product, options: Options) { return product.price + (product.customizable && options.size === "Large" ? 40 : 0) + (product.customizable && options.milk === "Oat" ? 30 : 0); }
export const deliveryFee = (subtotal: number, fulfilment: string) => fulfilment === "Pickup" || subtotal >= 499 ? 0 : 40;
export const statuses = ["Confirmed", "Preparing", "Out for delivery", "Delivered"] as const;
export type Status = typeof statuses[number];
export type Order = { id: string; createdAt: string; status: Status; customer: { name: string; phone: string; address: string }; fulfilment: "Delivery" | "Pickup"; items: (CartItem & { name: string; unitPrice: number })[]; subtotal: number; delivery: number; total: number; notes: string };
