// Downloads the sample Unsplash photos used by the demo and stores
// optimized WebP masters in src/assets. Astro then derives responsive sizes.
// Usage: node scripts/fetch-photos.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const photos = [
  // id on images.unsplash.com, output name, download width, output width, quality, optional crop
  { id: '1503454537195-1dcabb73ffb9', out: 'hero.webp', dl: 900, w: 900, q: 68 },
  { id: '1602631985686-1bb0e6a8696e', out: 'party-band.webp', dl: 1100, w: 1100, q: 66 },
  { id: '1472162072942-cd5147eb3902', out: 'collage-laugh.webp', dl: 1400, w: 420, q: 64, crop: { left: 200, top: 60, width: 540, height: 540 } },
  { id: '1530103862676-de8c9debad1d', out: 'collage-balloons.webp', dl: 1400, w: 420, q: 64, crop: { left: 0, top: 0, width: 934, height: 934 } },
];

for (const p of photos) {
  const url = `https://images.unsplash.com/photo-${p.id}?w=${p.dl}&q=80&auto=format&fm=jpg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  let img = sharp(buf);
  if (p.crop) img = img.extract(p.crop);
  const out = await img.resize({ width: p.w }).webp({ quality: p.q, effort: 6 }).toBuffer();
  await writeFile(new URL(`../src/assets/${p.out}`, import.meta.url), out);
  const meta = await sharp(out).metadata();
  console.log(p.out, `${meta.width}x${meta.height}`, `${(out.length / 1024).toFixed(1)} KB`);
}
