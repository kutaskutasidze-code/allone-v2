'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

function QubitVector({ theta = Math.PI / 4, phi = Math.PI / 4 }) {
  const vectorRef = useRef<THREE.Group>(null);
  
  // Convert spherical to cartesian
  const x = Math.sin(theta) * Math.cos(phi);
  const z = Math.sin(theta) * Math.sin(phi);
  const y = Math.cos(theta);

  return (
    <group ref={vectorRef}>
      <Line
        points={[[0, 0, 0], [x, y, z]]}
        color="#0A68F5"
        lineWidth={3}
      />
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#0A68F5" />
      </mesh>
      
      {/* Label for the state */}
      <Html position={[x * 1.2, y * 1.2, z * 1.2]} center>
        <div className="bg-accent text-white px-2 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap shadow-lg">
          |ψ⟩
        </div>
      </Html>
    </group>
  );
}

function SphereGrid() {
  return (
    <>
      {/* Main Sphere (Wireframe) */}
      <Sphere args={[1, 32, 32]}>
        <meshBasicMaterial color="#DCE9F6" wireframe transparent opacity={0.3} />
      </Sphere>
      
      {/* Equator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.99, 1, 64]} />
        <meshBasicMaterial color="#DCE9F6" transparent opacity={0.5} />
      </mesh>

      {/* Vertical Ring */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.99, 1, 64]} />
        <meshBasicMaterial color="#DCE9F6" transparent opacity={0.5} />
      </mesh>

      {/* Axes */}
      <Line points={[[0, -1.2, 0], [0, 1.2, 0]]} color="#071D2F" lineWidth={1} opacity={0.2} transparent />
      <Line points={[[-1.2, 0, 0], [1.2, 0, 0]]} color="#071D2F" lineWidth={1} opacity={0.2} transparent />
      <Line points={[[0, 0, -1.2], [0, 0, 1.2]]} color="#071D2F" lineWidth={1} opacity={0.2} transparent />

      {/* Pole Labels */}
      <Html position={[0, 1.3, 0]} center>
        <span className="text-[12px] font-mono text-heading font-bold">|0⟩</span>
      </Html>
      <Html position={[0, -1.3, 0]} center>
        <span className="text-[12px] font-mono text-heading font-bold">|1⟩</span>
      </Html>
    </>
  );
}

export function BlochSphere({ theta = Math.PI / 4, phi = Math.PI / 4 }) {
  return (
    <div className="w-full h-full min-h-[400px] relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [2, 2, 2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <SphereGrid />
        <QubitVector theta={theta} phi={phi} />
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-border-light text-[10px] font-mono text-muted uppercase tracking-wider">
          <div>θ = {(theta / Math.PI).toFixed(2)}π</div>
          <div>φ = {(phi / Math.PI).toFixed(2)}π</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-border-light text-[10px] font-mono text-accent">
          Bloch Sphere Visualization
        </div>
      </div>
    </div>
  );
}
