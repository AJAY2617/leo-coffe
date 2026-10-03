import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import type { Order, Status } from "./menu";
const dir = path.join(process.cwd(), "data");
const file = path.join(dir, "orders.json");
let queue: Promise<unknown> = Promise.resolve();
let database: ReturnType<typeof postgres> | undefined;
let schemaReady: Promise<unknown> | undefined;

const connectionString = () => process.env.DATABASE_URL || process.env.POSTGRES_URL;
export function orderStorageAvailable() { return !!connectionString() || !process.env.VERCEL; }

async function getDatabase() {
  const url = connectionString();
  if (!url) throw new Error("Persistent order storage has not been configured.");
  database ??= postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  const sql = database;
  schemaReady ??= sql`
    CREATE TABLE IF NOT EXISTS leo_coffe_orders (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      data JSONB NOT NULL
    )
  `.catch(error => { schemaReady = undefined; throw error; });
  await schemaReady;
  return sql;
}

export async function readOrders(): Promise<Order[]> {
  if (connectionString()) {
    const sql = await getDatabase();
    const rows = await sql<{ data: Order }[]>`SELECT data FROM leo_coffe_orders ORDER BY created_at DESC`;
    return rows.map(row => row.data);
  }
  if (!orderStorageAvailable()) throw new Error("Persistent order storage has not been configured.");
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}
function mutateOrders<T>(fn: (orders: Order[]) => T): Promise<T> {
  const operation = queue.then(async () => {
    const orders = await readOrders();
    const result = fn(orders);
    await mkdir(dir, { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(orders, null, 2), "utf8");
    await rename(`${file}.tmp`, file);
    return result;
  });
  queue = operation.catch(() => undefined);
  return operation;
}

export async function saveOrder(order: Order): Promise<void> {
  if (connectionString()) {
    const sql = await getDatabase();
    await sql`INSERT INTO leo_coffe_orders (id, created_at, data) VALUES (${order.id}, ${order.createdAt}, ${sql.json(order)})`;
    return;
  }
  if (!orderStorageAvailable()) throw new Error("Persistent order storage has not been configured.");
  await mutateOrders(orders => orders.unshift(order));
}

export async function findOrder(id: string): Promise<Order | undefined> {
  if (connectionString()) {
    const sql = await getDatabase();
    const rows = await sql<{ data: Order }[]>`SELECT data FROM leo_coffe_orders WHERE id = ${id}`;
    return rows[0]?.data;
  }
  return (await readOrders()).find(order => order.id === id);
}

export async function updateOrderStatus(id: string, status: Status): Promise<boolean> {
  if (connectionString()) {
    const sql = await getDatabase();
    const rows = await sql`UPDATE leo_coffe_orders SET data = jsonb_set(data, '{status}', to_jsonb(${status}::text)) WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }
  if (!orderStorageAvailable()) throw new Error("Persistent order storage has not been configured.");
  return mutateOrders(orders => {
    const order = orders.find(order => order.id === id);
    if (!order) return false;
    order.status = status;
    return true;
  });
}
