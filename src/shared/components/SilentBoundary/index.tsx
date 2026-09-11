'use client';

import { Component, type PropsWithChildren } from 'react';

/**
 * Renders its children until one of them throws, then nothing. For a part the
 * surface can stand without — a decorative drawing, a widget — so its failure
 * leaves a hole instead of reaching the route's error boundary.
 */
// biome-ignore lint/style/useReactFunctionComponents: React has no hook for getDerivedStateFromError
class SilentBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export { SilentBoundary };
