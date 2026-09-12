import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = resolve('src');

const STYLED_FILE = /\.(ts|tsx|css)$/;

// `100vh` is a phone's largest viewport, so a screen-tall surface hides its last
// rows under the browser bar; `lvh` is that box by another name. `dvh`/`svh` pass.
const SCREEN_UTILITY = /\b(?:min-|max-)?h-screen\b/;
const VIEWPORT_HEIGHT = /\d(?:\.\d+)?l?vh\b/;

// A `vw` term alone does not grow under browser zoom (WCAG 1.4.4); the fluid
// scales pair it with `rem`, and a one-off `clamp()` owes the same pair.
const CLAMP = /clamp\(([^)]*)\)/g;
const PURE_VIEWPORT_TERM = /^[^r]*vw[^r]*$/;

function styledFiles(): string[] {
  return readdirSync(SOURCE_ROOT, { recursive: true, encoding: 'utf8' })
    .filter((path) => STYLED_FILE.test(path))
    .map((path) => join(SOURCE_ROOT, path));
}

describe('viewport height under src/', () => {
  const files = styledFiles();

  it('finds the tree it walks', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s sizes nothing by the largest viewport', (path) => {
    const source = readFileSync(path, 'utf8');

    expect(source).not.toMatch(SCREEN_UTILITY);
    expect(source).not.toMatch(VIEWPORT_HEIGHT);
  });

  it.each(files)('%s pairs every vw term in a clamp() with rem', (path) => {
    const source = readFileSync(path, 'utf8');

    for (const { 1: terms = '' } of source.matchAll(CLAMP)) {
      const preferred = terms.split(',')[1] ?? '';

      expect(preferred).not.toMatch(PURE_VIEWPORT_TERM);
    }
  });
});
