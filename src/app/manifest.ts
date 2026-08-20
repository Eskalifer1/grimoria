import type { MetadataRoute } from 'next';

import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';

/**
 * Installed-app metadata. Static and Theme-agnostic: a launcher caches the icon
 * it was installed with, so it cannot follow the in-app Theme toggle. Colors
 * are `standard`'s `--surface-page` and `--text-brand`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fcfcfe',
    theme_color: '#0d5a54',
    // One file serves both purposes — its field is opaque to the canvas edge
    // and the mark's furthest point sits at 70% of the width, inside the 80%
    // circle Android masks to. The manifest spec spells that as one entry with
    // `purpose: "any maskable"`; Next's type takes a single value, so the 512
    // is listed twice instead.
    icons: [
      { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
