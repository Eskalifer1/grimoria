import sharp from 'sharp';

import { parseTrace } from './lib/parse.mjs';

/**
 * The first look at a trace: `node scripts/mascot/sheet.mjs <pose> <out.png>`
 * draws one tile per fill color with that color's paths in red, so each hex can
 * be read off and named in `poses/<pose>.mjs`.
 */
const [pose, out] = process.argv.slice(2);
const { viewBox, defs, paths } = parseTrace(`design/mascot/${pose}.svg`);
const [, , vw, vh] = viewBox.split(' ').map(Number);
const fills = [...new Set(paths.map((p) => p.fill))];
const tile = 300;
const cols = 6;
const rows = Math.ceil(fills.length / cols);
const scale = tile / Math.max(vw, vh);
const silhouette = paths.map((p) => `<path fill="#d8d8d8" d="${p.d}"/>`).join('');
let tiles = '';
fills.forEach((fill, i) => {
  const x = (i % cols) * tile;
  const y = Math.floor(i / cols) * (tile + 30);
  const own = paths.filter((p) => p.fill === fill);
  const red = own.map((p) => `<path fill="#ff0000" d="${p.d}"/>`).join('');
  const isGradient = fill.startsWith('url');
  const label = isGradient ? (defs[fill.slice(5, -1)] ?? []).join(',') : fill;
  const swatch = isGradient ? defs[fill.slice(5, -1)][0] : fill;
  tiles += `<g transform="translate(${x} ${y})"><rect width="${tile}" height="${tile}" fill="#fff" stroke="#000"/><g transform="scale(${scale})">${silhouette}${red}</g><rect width="18" height="18" x="4" y="${tile + 4}" fill="${swatch}"/><text x="26" y="${tile + 18}" font-size="14" font-family="monospace">${i}: ${label} (${own.length})</text></g>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * tile}" height="${rows * (tile + 30)}"><rect width="100%" height="100%" fill="#fff"/>${tiles}</svg>`;
await sharp(Buffer.from(svg)).png().toFile(out);
