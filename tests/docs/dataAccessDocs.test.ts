import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PATTERNS = ['pattern-a', 'pattern-b', 'pattern-c', 'pattern-d'] as const;

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

const router = read('docs/features/data-access.md');

describe('the data-access router', () => {
  it('stays short enough to be read in full every time', () => {
    expect(router.split('\n').length).toBeLessThanOrEqual(60);
  });

  it('holds no code, so nothing in it can go stale against the source', () => {
    expect(router).not.toContain('```');
  });

  it('routes to every pattern file and to the store', () => {
    for (const pattern of [...PATTERNS, 'store', 'optimistic-hooks']) {
      expect(router).toContain(`data-access/${pattern}.md`);
    }
  });

  it('states the rule that makes the router work at all', () => {
    expect(router.toLowerCase()).toContain('one pattern per surface');
  });
});

describe.each(PATTERNS)('%s', (pattern) => {
  const file = read(`docs/features/data-access/${pattern}.md`);

  it('names where it is used, or says plainly that nothing uses it yet', () => {
    expect(file).toContain('## Where it is used');
  });

  it('is self-sufficient — it does not send the reader to a sibling to write the code', () => {
    for (const sibling of PATTERNS.filter((other) => other !== pattern)) {
      expect(file).not.toContain(`data-access/${sibling}.md`);
    }
  });
});
