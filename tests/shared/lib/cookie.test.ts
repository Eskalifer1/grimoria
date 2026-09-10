import { describe, expect, it } from 'vitest';

import { readCookie } from '@/shared/lib/cookie';

describe('readCookie', () => {
  it('finds a value wherever it sits in the document', () => {
    expect(readCookie('theme=dark-fantasy', 'theme')).toBe('dark-fantasy');
    expect(readCookie('a=1; theme=dark-fantasy; b=2', 'theme')).toBe('dark-fantasy');
  });

  it('answers null when the name is absent, and for an empty document', () => {
    expect(readCookie('a=1; b=2', 'theme')).toBeNull();
    expect(readCookie('', 'theme')).toBeNull();
  });

  it('matches the whole name rather than the end of a longer one', () => {
    expect(readCookie('other-theme=dark-fantasy', 'theme')).toBeNull();
  });

  it('decodes the value, which is how a cookie carries anything but a word', () => {
    expect(readCookie('scope=a%20b', 'scope')).toBe('a b');
  });

  it('reads an empty value as absent — a cleared cookie names nobody', () => {
    expect(readCookie('scope=', 'scope')).toBeNull();
  });
});
