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

describe('the Tailwind bridge', () => {
  const css = read('src/styles/tokens.css');

  it.each(LETTER_SPACING)('wires --ls-%s to a utility', (role) => {
    expect(css).toContain(`var(--ls-${role})`);
  });

  it('leaves size and line height to Tailwind, dropping neither namespace', () => {
    expect(css).not.toMatch(/--(text|leading)-\*:\s*initial/);
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
