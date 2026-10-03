import { mkdir, writeFile } from "node:fs/promises";
const images = {
  "photo-1570968915860-54d5c301fa9f": "photo-1570968915860-54d5c301fa9f",
  "photo-1461023058943-07fcbe16d735": "photo-1461023058943-07fcbe16d735",
  "photo-1515823064-d6e0c04616a7": "photo-1515823064-d6e0c04616a7",
  "photo-1555507036-ab1f4038808a": "photo-1555507036-ab1f4038808a",
  "photo-1509042239860-f550ce710b93": "photo-1509042239860-f550ce710b93",
  "photo-1517701604599-bb29b565090c": "photo-1517701604599-bb29b565090c",
  "photo-1542990253-0b8be5b5ed0a": "photo-1517578239113-b03992dcdd25",
  "photo-1499636136210-6f4ee915583e": "photo-1499636136210-6f4ee915583e",
  "hero": "photo-1442512595331-e89e73853f31",
};
await mkdir("public/images", { recursive: true });
const results = await Promise.allSettled(Object.entries(images).map(async ([name, id]) => {
  const response = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${name === "hero" ? 1200 : 700}&q=85`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw Error(`${name}: image unavailable (${response.status})`);
  await writeFile(`public/images/${name}.jpg`, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved ${name}`);
}));
let failed = false;
for (const r of results) if (r.status === "rejected") { failed = true; console.error(r.reason.message); }
if (failed) process.exitCode = 1;
