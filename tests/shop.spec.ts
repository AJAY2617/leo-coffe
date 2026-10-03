import { test, expect } from "@playwright/test";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import type { Order } from "../src/lib/menu";

const created: string[] = [];
test.afterAll(async () => {
  if (!created.length) return;
  const file = "data/orders.json";
  const orders: Order[] = JSON.parse(await readFile(file, "utf8"));
  await writeFile(`${file}.test-cleanup`, JSON.stringify(orders.filter(o => !created.includes(o.id)), null, 2));
  await rename(`${file}.test-cleanup`, file);
});

test("server validates prices, protects orders, and supports the status lifecycle", async ({ request }) => {
  const denied = await request.get("/api/orders"); expect(denied.status()).toBe(401);
  const invalid = await request.post("/api/orders", { data: { items: [] } }); expect(invalid.status()).toBe(400);
  const data = { fulfilment: "Delivery", customer: { name: "Smoke Test", phone: "9876543210", address: "123 Testing Street, Preview City" }, items: [{ productId: "latte", quantity: 2, unitPrice: 1, options: { size: "Large", milk: "Oat", sugar: "None" } }] };
  const create = await request.post("/api/orders", { data }); expect(create.status()).toBe(201);
  const { id } = await create.json(); created.push(id);
  let tracking = await (await request.get(`/api/orders/${id}`)).json();
  expect(tracking.total).toBe(500); expect(tracking.delivery).toBe(0); expect(tracking.customer).toBeUndefined(); expect(tracking.notes).toBeUndefined();
  const blocked = await request.patch(`/api/orders/${id}`, { data: { status: "Preparing" } }); expect(blocked.status()).toBe(401);
  const env = (await readFile(".env.local", "utf8")).trimStart();
  const password = env.match(/^ADMIN_PASSWORD=(.+)$/m)?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  const login = await request.post("/api/admin/session", { data: { password } }); expect(login.status()).toBe(200);
  const authorized = await request.get("/api/orders"); expect(authorized.status()).toBe(200);
  const orders = await authorized.json(); expect(orders.some((o: Order) => o.id === id)).toBe(true);
  const updated = await request.patch(`/api/orders/${id}`, { data: { status: "Preparing" } }); expect(updated.status()).toBe(200);
  tracking = await (await request.get(`/api/orders/${id}`)).json(); expect(tracking.status).toBe("Preparing");
  await request.delete("/api/admin/session"); expect((await request.get("/api/orders")).status()).toBe(401);
});

test("customer can filter, customize, persist a cart, and place a pickup order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A little joy, freshly brewed." })).toBeVisible();
  await page.getByRole("button", { name: "Fresh bakes", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.getByRole("button", { name: "All favourites", exact: true }).click();
  await page.getByRole("textbox", { name: "Search the menu" }).fill("signature");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Add Signature Latte", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Large" }).click();
  await dialog.getByRole("button", { name: "Oat milk" }).click();
  await dialog.getByRole("button", { name: "None", exact: true }).click();
  await dialog.getByRole("button", { name: "Add to bag" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Your bag 1", exact: true }).click();
  await expect(dialog).toContainText("₹250");
  await dialog.getByRole("button", { name: "Continue to checkout" }).click();
  await dialog.getByRole("button", { name: "Pickup", exact: true }).click();
  await dialog.getByLabel("Your name").fill("Browser Test");
  await dialog.getByLabel("Phone number").fill("9876543210");
  await dialog.getByRole("button", { name: "Place my order" }).click();
  await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/);
  created.push(page.url().split("/").at(-1)!);
  await expect(page.getByRole("heading", { name: "Thanks a latte!" })).toBeVisible();
  await expect(page.locator(".tracking-items")).toContainText("₹250");
  await expect(page.locator(".tracking-steps")).toContainText("Ready for pickup");
});

test("mobile layout fits the viewport and the cart dialog supports Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator(".bag-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("img").evaluateAll(async images => {
    await Promise.all(images.map(async image => { const photo = image as HTMLImageElement; photo.loading = "eager"; await photo.decode(); }));
  });
  await mkdir(".preview", { recursive: true });
  await page.screenshot({ path: ".preview/mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: ".preview/desktop.png", fullPage: true });
});
