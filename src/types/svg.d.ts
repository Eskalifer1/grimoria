/**
 * What `@svgr/webpack` hands back for an SVG import — a component that takes
 * every `<svg>` attribute. The rule is in `next.config.ts`; under Vitest the
 * same path resolves to `tests/fixtures/svg.tsx`.
 *
 * Next's own `*.svg` declaration types the import `any`, and the wider pattern
 * would swallow this one — TypeScript picks the longest matching prefix, so
 * the mascot's folder is named here to win it.
 */
declare module '@/shared/assets/*.svg' {
  import type { ComponentType, SVGProps } from 'react';

  const SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}
