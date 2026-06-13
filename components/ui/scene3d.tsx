'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

// Self-contained WebGL hero blob — renders locally, no external assets.
function Blob() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <Float speed={1.4} rotationIntensity={1.1} floatIntensity={1.4}>
      <mesh ref={ref} scale={1.45}>
        <icosahedronGeometry args={[1, 24]} />
        <MeshDistortMaterial
          color="#5b8cff"
          emissive="#16225e"
          emissiveIntensity={0.55}
          roughness={0.16}
          metalness={0.7}
          distort={0.45}
          speed={1.8}
        />
      </mesh>
    </Float>
  );
}

export function Scene3D({ className }: { className?: string }) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 4, 4]} intensity={2.2} color="#cdd8ff" />
      <pointLight position={[-4, -3, -2]} intensity={2.6} color="#7c5cff" />
      <Blob />
    </Canvas>
  );
}
