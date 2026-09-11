import { writeFileSync } from 'node:fs';

import { center, roundD, splitSubpaths } from './lib/geom.mjs';
import { DETAIL, readPalette } from './lib/palette.mjs';
import { parseTrace } from './lib/parse.mjs';

/**
 * Labels one traced pose: `node scripts/mascot/label.mjs <pose>` reads
 * `design/mascot/<pose>.svg` and `poses/<pose>.mjs`, writes
 * `src/shared/assets/mascot/<pose>.svg`. The procedure is `design/mascot.md`.
 */
const [pose] = process.argv.slice(2);
const cfg = (await import(`./poses/${pose}.mjs`)).default;
const { viewBox, defs, paths } = parseTrace(`design/mascot/${pose}.svg`);
const [, , vw, vh] = viewBox.split(' ');
const PALETTE = readPalette();

const rgb = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => rgb(a).reduce((s, v, i) => s + (v - rgb(b)[i]) ** 2, 0);
const snapped = {};

// A hex the config names goes where it says; any other snaps to the nearest
// palette color and is reported, so the config can pin it if the snap is wrong.
function classOf(fill) {
  const hex = fill.startsWith('url') ? defs[fill.slice(5, -1)][0] : fill;
  if (cfg.map[hex]) return cfg.map[hex];
  let best;
  for (const [cls, ph] of Object.entries(PALETTE)) {
    const d = dist(hex, ph);
    if (!best || d < best.d) best = { cls, d };
  }
  snapped[hex] = best.cls;
  return best.cls;
}

function place(cls, sub) {
  const c = center(sub);
  for (const r of cfg.regions ?? []) {
    const [x1, y1, x2, y2] = r.box;
    if (r.from.includes(cls) && c.x >= x1 && c.x <= x2 && c.y >= y1 && c.y <= y2) return r.to;
  }
  return cls;
}

// The trace's first path is the whole silhouette as one contour, flame
// included. It goes to `<defs>` and is drawn twice through masks: the body
// minus the flame polygon, and the flame polygon alone, hidden with `detail`.
const body = [];
const detail = [];
let silhouette = '';
paths.forEach((p, idx) => {
  const base = classOf(p.fill);
  const byClass = new Map();
  let subs = splitSubpaths(p.d);
  if (idx === 0 && cfg.cut) {
    const big = subs
      .map((s) => ({ s, a: center(s).w * center(s).h }))
      .sort((a, b) => b.a - a.a)[0].s;
    silhouette = roundD(big);
    subs = subs.filter((s) => s !== big);
    body.push({ cls: base, raw: '<use href="#body" mask="url(#body-mask)"/>' });
    body.push({ cls: 'detail flame-ink', raw: '<use href="#body" mask="url(#flame-mask)"/>' });
    if (cfg.backdrop) {
      const ys = cfg.cut.map((pt) => pt[1]);
      const y1 = Math.min(...ys);
      const h = Math.max(...ys) - y1;
      for (const r of cfg.backdrop) {
        body.push({
          cls: r.cls,
          raw: `<rect x="${r.x1}" y="${y1}" width="${r.x2 - r.x1}" height="${h}" mask="url(#flame-mask)"/>`,
        });
      }
    }
  }
  for (const sub of subs) {
    const cls = place(base, sub);
    byClass.set(cls, (byClass.get(cls) ?? '') + roundD(sub));
  }
  for (const [cls, d] of byClass) (DETAIL.includes(cls) ? detail : body).push({ cls, d });
});

// The tail tip lies over the flame and its outline is the silhouette showing
// through, so the flame area is masked minus the tail's skin dilated by the
// outline's width — every skin subpath that reaches into the flame polygon.
function tailSubpaths() {
  const bx = cfg.cut.map((pt) => pt[0]);
  const by = cfg.cut.map((pt) => pt[1]);
  const box = {
    x1: Math.min(...bx),
    y1: Math.min(...by),
    x2: Math.max(...bx),
    y2: Math.max(...by),
  };
  let out = '';
  for (const p of paths) {
    if (classOf(p.fill) !== 'skin') continue;
    for (const sub of splitSubpaths(p.d)) {
      const c = center(sub);
      const b = { x1: c.x - c.w / 2, y1: c.y - c.h / 2, x2: c.x + c.w / 2, y2: c.y + c.h / 2 };
      if (b.x1 < box.x2 && b.x2 > box.x1 && b.y1 < box.y2 && b.y2 > box.y1) out += roundD(sub);
    }
  }
  return out;
}

function emit(list) {
  let out = '';
  let open = null;
  for (const { cls, d, raw } of list) {
    if (cls !== open) {
      if (open) out += '</g>';
      out += `<g class="${cls}">`;
      open = cls;
    }
    out += raw ?? `<path d="${d}"/>`;
  }
  return open ? `${out}</g>` : out;
}

let defsBlock = '';
if (cfg.cut) {
  const poly = `M${cfg.cut.map((pt) => pt.join(' ')).join('L')}Z`;
  const dilate = cfg.dilate ?? 34;
  const stroke = `stroke-width="${dilate}" stroke-linejoin="miter" stroke-miterlimit="6"`;
  const maskAttrs = `maskUnits="userSpaceOnUse" x="0" y="0" width="${vw}" height="${vh}"`;
  defsBlock =
    `<defs><path id="body" d="${silhouette}"/><path id="flame-area" d="${poly}"/><path id="tail" d="${tailSubpaths()}"/>` +
    `<mask id="flame-mask" ${maskAttrs}><use href="#flame-area" fill="#fff"/><use href="#tail" fill="#000" stroke="#000" ${stroke}/></mask>` +
    `<mask id="body-mask" ${maskAttrs}><rect width="${vw}" height="${vh}" fill="#fff"/><use href="#flame-area" fill="#000"/><use href="#tail" fill="#fff" stroke="#fff" ${stroke}/></mask></defs>`;
}
const detailBlock = detail.length ? `<g class="detail">${emit(detail)}</g>` : '';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${defsBlock}${emit(body)}${detailBlock}</svg>\n`;
writeFileSync(`src/shared/assets/mascot/${pose}.svg`, svg);

const used = new Set([...body, ...detail].flatMap((x) => x.cls.split(' ')));
const unknown = [...used].filter((c) => c !== 'detail' && !PALETTE[c]);
console.log(
  `${pose}: ${body.length + detail.length} paths, classes: ${[...used].sort().join(' ')}`,
);
if (Object.keys(snapped).length) console.log('snapped:', JSON.stringify(snapped));
if (unknown.length) {
  console.error(`no token for: ${unknown.join(' ')}`);
  process.exit(1);
}
