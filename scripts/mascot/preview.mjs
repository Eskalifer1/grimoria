import { readFileSync } from 'node:fs';

import sharp from 'sharp';

import { readPalette, themeCss } from './lib/palette.mjs';

/**
 * `node scripts/mascot/preview.mjs <pose> <out.png> [x1 y1 x2 y2]` renders a
 * labeled pose three ways side by side — one debug color per class with a
 * legend, then each Theme's tokens — optionally zoomed to a viewBox window.
 */
const [pose, out, ...win] = process.argv.slice(2);
const svg = readFileSync(`src/shared/assets/mascot/${pose}.svg`, 'utf8');
const classes = Object.keys(readPalette());
const debug = classes
  .map((c, i) => `.${c}{fill:hsl(${(i * 137.5) % 360} 85% ${35 + (i % 4) * 12}%)}`)
  .join('');
const tile = 800;
const view =
  win.length === 4 ? `viewBox="${win[0]} ${win[1]} ${win[2] - win[0]} ${win[3] - win[1]}"` : null;
function render(css) {
  let doc = svg.replace(/(<svg[^>]*>)/, `$1<style>${css}</style>`);
  if (view) doc = doc.replace(/viewBox="[^"]+"/, view);
  return sharp(Buffer.from(doc))
    .resize(tile, tile, { fit: 'contain', background: '#bbb' })
    .png()
    .toBuffer();
}
const legendRows = classes
  .map(
    (c, i) =>
      `<rect x="10" y="${10 + i * 26}" width="20" height="20" class="${c}"/><text x="36" y="${26 + i * 26}" font-size="16" font-family="monospace">${c}</text>`,
  )
  .join('');
const legend = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="${tile}"><style>${debug}</style>${legendRows}</svg>`;
const [a, b, c] = await Promise.all([
  render(debug),
  render(themeCss('dark-fantasy')),
  render(themeCss('standard')),
]);
await sharp({ create: { width: tile * 3 + 260, height: tile, channels: 3, background: '#bbb' } })
  .composite([
    { input: a, left: 0, top: 0 },
    { input: b, left: tile, top: 0 },
    { input: c, left: tile * 2, top: 0 },
    { input: Buffer.from(legend), left: tile * 3, top: 0 },
  ])
  .png()
  .toFile(out);
