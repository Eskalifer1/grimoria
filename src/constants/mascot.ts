/**
 * Every pose the mascot is drawn in, one SVG each under `shared/assets/mascot/`.
 * A pose added here fails `tsc` in `shared/components/Mascot/` until its
 * drawing is in the map — `docs/features/mascot.md`.
 */
const MASCOT_POSE = {
  /** The error boundary and `BlockingView`'s failed state. */
  SAD: 'sad',
  /** Not found. */
  LOST: 'lost',
  /** Unauthorized and forbidden. */
  DENIED: 'denied',
  /** An empty list. */
  IDLE: 'idle',
} as const;

type MascotPose = (typeof MASCOT_POSE)[keyof typeof MASCOT_POSE];

export type { MascotPose };
export { MASCOT_POSE };
