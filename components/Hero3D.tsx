'use client';

import dynamic from 'next/dynamic';

// Client-only (WebGL needs the browser). Shows a glowing orb while loading.
const Scene3D = dynamic(() => import('@/components/ui/scene3d').then((m) => m.Scene3D), {
  ssr: false,
  loading: () => (
    <div className="spline-fallback">
      <div className="spline-orb" />
    </div>
  ),
});

export default function Hero3D({ className }: { className?: string }) {
  return <Scene3D className={className} />;
}
