import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const LETTER_SPACING = ['display', 'title', 'body', 'meta', 'mono'] as const;

const DESTRUCTIVE = ['bg', 'bg-hover', 'bg-pressed', 'fg', 'bg-disabled', 'fg-disabled'] as const;

const THEMES = {
  standard: 'src/styles/standard.css',
  'dark-fantasy': 'src/styles/dark-fantasy.css',
} as const;

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

const DECLARATION = /^\s*(--[\w-]+):\s*([^;]+);/gm;

/** Every custom property a Theme file declares, mapped to its literal right-hand side. */
function declarations(css: string): Map<string, string> {
  const tokens = new Map<string, string>();

  for (const { 1: name = '', 2: value = '' } of css.matchAll(DECLARATION)) {
    tokens.set(name, value.trim());
  }

  return tokens;
}

/** Walks a `var()` chain down to the primitive hex the Theme ultimately spends. */
function resolveColor(name: string, tokens: Map<string, string>): string {
  const value = tokens.get(name) ?? '';
  const reference = value.match(/^var\((--[\w-]+)\)$/)?.[1];

  return reference === undefined ? value : resolveColor(reference, tokens);
}

/** One sRGB channel of a six-digit hex, linearized — what relative luminance takes. */
function linearChannel(hex: string, offset: number): number {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  return (
    0.2126 * linearChannel(hex, 1) + 0.7152 * linearChannel(hex, 3) + 0.0722 * linearChannel(hex, 5)
  );
}

function contrast(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe.each(Object.entries(THEMES))('%s', (_theme, path) => {
  const css = read(path);
  const tokens = declarations(css);

  it.each(LETTER_SPACING)('declares --ls-%s', (role) => {
    expect(tokens.has(`--ls-${role}`)).toBe(true);
  });

  it.each(DESTRUCTIVE)('declares --action-destructive-%s', (part) => {
    expect(tokens.has(`--action-destructive-${part}`)).toBe(true);
  });

  it('spends the destructive pair at readable contrast', () => {
    const foreground = resolveColor('--action-destructive-fg', tokens);
    const background = resolveColor('--action-destructive-bg', tokens);

    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});

const TYPE_STEPS = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
] as const;

const SPACE_STEPS = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;

const SPACE_PAIRS = ['sm-lg', 'md-lg', 'lg-xl', 'xl-2xl'] as const;

// `clamp(<min>rem, <intercept>rem + <slope>vw, <max>rem)` — the shape both fluid scales take.
const FLUID = /^clamp\(([\d.]+)rem,\s*[\d.]+rem\s*\+\s*[\d.]+vw,\s*([\d.]+)rem\)$/;

interface FluidRange {
  min: number;
  max: number;
}

// The two ends of a fluid declaration in rem, or `null` where it is not one.
function fluidRange(value: string | undefined): FluidRange | null {
  const match = value?.match(FLUID);

  if (!match) {
    return null;
  }

  return { min: Number(match[1]), max: Number(match[2]) };
}

function ranges(names: readonly string[], tokens: Map<string, string>): FluidRange[] {
  return names.map((name) => fluidRange(tokens.get(name))).filter((range) => range !== null);
}

function isStrictlyIncreasing(values: number[]): boolean {
  return values.every((value, index) => index === 0 || value > (values[index - 1] ?? Number.NaN));
}

describe('the Tailwind bridge', () => {
  const css = read('src/styles/tokens.css');
  const tokens = declarations(css);

  it.each(LETTER_SPACING)('wires --ls-%s to a utility', (role) => {
    expect(css).toContain(`var(--ls-${role})`);
  });

  it('leaves line height to Tailwind, dropping neither namespace', () => {
    expect(css).not.toMatch(/--(text|leading)-\*:\s*initial/);
  });

  it.each(TYPE_STEPS)('sets --text-%s as a clamp with a rem + vw preferred term', (step) => {
    expect(fluidRange(tokens.get(`--text-${step}`))).not.toBeNull();
  });

  it('starts --text-base at 1rem', () => {
    expect(fluidRange(tokens.get('--text-base'))?.min).toBe(1);
  });

  it('keeps the type steps in order at both ends', () => {
    const steps = ranges(
      TYPE_STEPS.map((step) => `--text-${step}`),
      tokens,
    );

    expect(steps).toHaveLength(TYPE_STEPS.length);
    expect(isStrictlyIncreasing(steps.map((range) => range.min))).toBe(true);
    expect(isStrictlyIncreasing(steps.map((range) => range.max))).toBe(true);
  });

  it.each([...SPACE_STEPS, ...SPACE_PAIRS])(
    'sets --spacing-%s as a clamp with a rem + vw preferred term',
    (step) => {
      expect(fluidRange(tokens.get(`--spacing-${step}`))).not.toBeNull();
    },
  );

  it('keeps the space steps in order at both ends', () => {
    const steps = ranges(
      SPACE_STEPS.map((step) => `--spacing-${step}`),
      tokens,
    );

    expect(steps).toHaveLength(SPACE_STEPS.length);
    expect(isStrictlyIncreasing(steps.map((range) => range.min))).toBe(true);
    expect(isStrictlyIncreasing(steps.map((range) => range.max))).toBe(true);
  });

  it('leaves Tailwind’s 4px multiplier alone', () => {
    expect(tokens.has('--spacing')).toBe(false);
    expect(css).not.toMatch(/--spacing-\*:\s*initial/);
  });

  it('drops Tailwind’s tracking scale, so a fixed value cannot outrank a Theme', () => {
    expect(css).toMatch(/--tracking-\*:\s*initial/);
  });
});

describe('the destructive alias', () => {
  const css = read('src/styles/shadcn-adapter.css');

  it('points shadcn at the action pair rather than the status', () => {
    expect(css).toContain('--destructive: var(--action-destructive-bg)');
    expect(css).toContain('--destructive-foreground: var(--action-destructive-fg)');
  });
});
