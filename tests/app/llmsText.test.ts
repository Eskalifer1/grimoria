import { describe, expect, it, vi } from 'vitest';

import { GET as getShort } from '@/app/llms.txt/route';
import { GET as getFull } from '@/app/llms-full.txt/route';

vi.mock('@/constants/env.server', () => ({ METADATA_BASE_URL: 'https://grimoria.example' }));

describe.each([
  ['/llms.txt', getShort],
  ['/llms-full.txt', getFull],
])('%s', (_path, handler) => {
  it('answers 200 as plain text', async () => {
    const response = handler();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });

  it('opens with an H1 of the site name and states its purpose', async () => {
    const body = await handler().text();

    expect(body.startsWith('# Grimoria\n')).toBe(true);
    expect(body).toContain('knowledge base');
  });

  it('links its sections with absolute URLs only', async () => {
    const body = await handler().text();
    const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link?.startsWith('https://grimoria.example/')).toBe(true);
    }
  });
});

it('serves the same content on both paths', async () => {
  expect(await getFull().text()).toBe(await getShort().text());
});
