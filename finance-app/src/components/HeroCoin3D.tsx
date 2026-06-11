"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Image, Environment, ContactShadows } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Coin() {
  const meshRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Плавное вращение и парение
    meshRef.current.rotation.y = t * 0.3;
    meshRef.current.position.y = Math.sin(t * 1.5) * 0.15;
  });

  return (
    <group ref={meshRef}>
      {/* Используем компонент Image из drei для идеальной отрисовки PNG */}
      <Image 
        url="/coin-texture.png" 
        transparent 
        toneMapped={false} 
        scale={[2.5, 2.5]} 
      />
    </group>
  );
}

export default function HeroCoin3D() {
  return (
    <div className="w-full h-[500px] relative">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Environment preset="city" />
        <Coin />
        <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}