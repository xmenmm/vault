'use client';

import { Component, Suspense, lazy, useState, type ReactNode } from 'react';
import Hero3D from '@/components/Hero3D';
const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

// Catches the synchronous/render-time throw path if the 3D runtime fails.
class SplineBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Fallback({ className }: { className?: string }) {
  // If the external 3D scene can't load (offline / restricted network), fall
  // back to the self-rendered WebGL blob instead of a flat placeholder.
  return <Hero3D className={className} />;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  // Covers the async path: react-spline calls onError when the scene fetch fails
  // (e.g. offline / network-restricted). On a deployed app the scene loads fine.
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback className={className} />;

  return (
    <SplineBoundary fallback={<Fallback className={className} />}>
      <Suspense
        fallback={
          <div className="spline-fallback">
            <span style={{ color: '#6b7280', fontSize: 13 }}>Loading 3D…</span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
          // Defer to a microtask: react-spline may fire onError during its own
          // render, and calling setState synchronously then triggers React's
          // "Cannot update a component while rendering a different component".
          onError={() => queueMicrotask(() => setFailed(true))}
        />
      </Suspense>
    </SplineBoundary>
  );
}
