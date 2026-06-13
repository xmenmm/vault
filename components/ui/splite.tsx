'use client';

import { Component, Suspense, lazy, useState, type ReactNode } from 'react';
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
  return (
    <div className={`spline-fallback ${className ?? ''}`}>
      <div className="spline-orb" />
    </div>
  );
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
        <Spline scene={scene} className={className} onError={() => setFailed(true)} />
      </Suspense>
    </SplineBoundary>
  );
}
