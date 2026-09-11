/**
 * The four route boundaries a visitor can land on. One set rather than loose
 * names, so anything keyed by surface has to answer for all four or fail to
 * compile. The mascot is keyed by pose instead (`MASCOT_POSE`), two surfaces
 * sharing one.
 */
const BOUNDARY_SURFACE = {
  ERROR: 'error',
  NOT_FOUND: 'notFound',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
} as const;

type BoundarySurface = (typeof BOUNDARY_SURFACE)[keyof typeof BOUNDARY_SURFACE];

export type { BoundarySurface };
export { BOUNDARY_SURFACE };
