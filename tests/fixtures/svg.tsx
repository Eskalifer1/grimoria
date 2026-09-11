import type { SVGProps } from 'react';

/**
 * Stands in for an SVG import, which only becomes a component inside Next's
 * bundler (`next.config.ts`). An empty `<svg>` carrying the props is enough:
 * no test asserts on a drawing, only on what the mascot wraps it in.
 */
function SvgStub(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} />;
}

export default SvgStub;
