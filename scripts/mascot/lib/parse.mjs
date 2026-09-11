import { readFileSync } from 'node:fs';

export function parseTrace(file) {
  const src = readFileSync(file, 'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(src)[1];
  const defs = {};
  for (const m of src.matchAll(
    /<(linear|radial)Gradient[^>]*id="([^"]+)"[\s\S]*?<\/(?:linear|radial)Gradient>/g,
  )) {
    const stops = [...m[0].matchAll(/stop-color="([^"]+)"/g)].map((s) => s[1]);
    defs[m[2]] = stops;
  }
  const paths = [];
  for (const m of src.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const a = m[1];
    const fill = /fill="([^"]+)"/.exec(a)?.[1] ?? 'none';
    const opacity = /fill-opacity="([^"]+)"/.exec(a)?.[1];
    const d = /\bd="([^"]+)"/.exec(a)?.[1];
    if (!d) continue;
    paths.push({ fill, opacity, d });
  }
  return { viewBox, defs, paths };
}
