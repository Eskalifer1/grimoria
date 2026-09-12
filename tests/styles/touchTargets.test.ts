import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// The primitives every control is built from: each grows its hit area to 44px
// under a coarse pointer, so no feature component has to (`responsive.md`).
const PRIMITIVES = ['button', 'checkbox', 'radio-group', 'switch', 'input', 'select'] as const;

const COARSE_TARGET = /pointer-coarse:(?:before:)?(?:min-h|min-w|h|size)-11\b/;

// A field under 16px zooms on iOS; `pointer-fine:` is where a smaller size may live.
const TYPED_FIELDS = ['input', 'textarea'] as const;

describe('touch targets in ui/', () => {
  it.each(PRIMITIVES)('%s grows to 44px under a coarse pointer', (name) => {
    const source = readFileSync(resolve(`src/shared/components/ui/${name}.tsx`), 'utf8');

    expect(source).toMatch(COARSE_TARGET);
  });

  it.each(TYPED_FIELDS)('%s never sets a size under 16px by viewport', (name) => {
    const source = readFileSync(resolve(`src/shared/components/ui/${name}.tsx`), 'utf8');

    expect(source).not.toMatch(/\b(?:sm|md|lg|xl):text-(?:xs|sm)\b/);
  });
});
