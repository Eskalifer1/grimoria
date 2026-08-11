import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME } from '@/constants/theme';
import { isTheme, toTheme } from '@/i18n/theme';

describe('isTheme', () => {
  it('accepts every Theme that exists', () => {
    expect(isTheme('standard')).toBe(true);
    expect(isTheme('dark-fantasy')).toBe(true);
  });

  it('rejects a value whose case does not match', () => {
    expect(isTheme('DARK-FANTASY')).toBe(false);
  });

  it('rejects absent and empty values', () => {
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme('')).toBe(false);
  });

  it('rejects an arbitrary string', () => {
    expect(isTheme('not-a-theme')).toBe(false);
  });
});

describe('toTheme', () => {
  it('passes a known Theme through untouched', () => {
    expect(toTheme('dark-fantasy')).toBe('dark-fantasy');
  });

  it('falls back for absent, empty and unknown values', () => {
    expect(toTheme(undefined)).toBe(DEFAULT_THEME);
    expect(toTheme(null)).toBe(DEFAULT_THEME);
    expect(toTheme('')).toBe(DEFAULT_THEME);
    expect(toTheme('not-a-theme')).toBe(DEFAULT_THEME);
  });

  it('falls back for a Theme written in the wrong case', () => {
    expect(toTheme('DARK-FANTASY')).toBe(DEFAULT_THEME);
  });
});
