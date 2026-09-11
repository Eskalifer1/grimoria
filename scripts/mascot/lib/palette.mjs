import { readFileSync } from 'node:fs';

/**
 * The `--mascot-*` tokens of one Theme file, keyed by class name — the token
 * list is the class list, so a class the stylesheet lacks is a labeling error.
 */
export function readTokens(theme) {
  const css = readFileSync(`src/styles/${theme}.css`, 'utf8');
  const out = {};
  for (const m of css.matchAll(/--mascot-([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

/** Class → hex as drawn, from `dark-fantasy`; `detail` is a display value, not a color. */
export function readPalette() {
  const { detail: _detail, ...colors } = readTokens('dark-fantasy');
  return colors;
}

/** Classes that only `dark-fantasy` shows; the labeler moves them into the `detail` group. */
export const DETAIL = ['flame', 'flame-mid', 'flame-core', 'flame-ink'];

/** A stylesheet coloring every class from one Theme's tokens, for a preview render. */
export function themeCss(theme) {
  return Object.entries(readTokens(theme))
    .map(([cls, v]) => `.${cls}{${cls === 'detail' ? 'display' : 'fill'}:${v}}`)
    .join('');
}
