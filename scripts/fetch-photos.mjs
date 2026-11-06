// Downloads the sample Unsplash photos used by the demo and stores
// optimized WebP masters in src/assets. Astro then derives responsive sizes.
// Usage: node scripts/fetch-photos.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const photos = [
  // id on images.unsplash.com, output name, width, quality
  { id: '1503454537195-1dcabb73ffb9', out: 'hero.webp', w: 900, q: 68 },
  { id: '1602631985686-1bb0e6a8696e', out: 'party-band.webp', w: 1100, q: 66 },
];

for (const p of photos) {
  const url = `https://images.unsplash.com/photo-${p.id}?w=${p.w}&q=80&auto=format&fm=jpg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const out = await sharp(buf).resize({ width: p.w }).webp({ quality: p.q, effort: 6 }).toBuffer();
  await writeFile(new URL(`../src/assets/${p.out}`, import.meta.url), out);
  const meta = await sharp(out).metadata();
  console.log(p.out, `${meta.width}x${meta.height}`, `${(out.length / 1024).toFixed(1)} KB`);
}
