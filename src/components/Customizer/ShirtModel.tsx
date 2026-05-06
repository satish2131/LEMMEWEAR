"use client";
import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SHIRT_MODELS, MODEL_CONFIG, ShirtType } from '@/lib/constants/modelConfig';

interface ShirtModelProps {
  shirtType: ShirtType;
  color: string;
  designTexFront: THREE.Texture | null;
  designTexBack: THREE.Texture | null;
  showFront: boolean;
  showBack: boolean;
}

/* ─── Helper: a plane that sticks flush to a surface via polygonOffset ─── */
function DesignPlane({
  tex,
  position,
  rotation,
  width,
  height,
}: {
  tex: THREE.Texture;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
}) {
  return (
    <mesh position={position} rotation={rotation} renderOrder={10}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        map={tex}
        transparent={true}
        alphaTest={0.01}
        depthWrite={false}
        polygonOffset={true}
        polygonOffsetFactor={-10}
        polygonOffsetUnits={-10}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default function ShirtModel({
  shirtType,
  color,
  designTexFront,
  designTexBack,
  showFront,
  showBack
}: ShirtModelProps) {
  const modelUrl = SHIRT_MODELS[shirtType];
  const { scene } = useGLTF(modelUrl) as any;
  const config = MODEL_CONFIG[shirtType];
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.color.set(color);
          child.material.roughness = 0.8;
          child.material.metalness = 0;
          child.material.needsUpdate = true;
        }
      }
    });

    // Auto-center polo (and any model with autoCenter flag)
    if (shirtType === 'polo' && groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const center = box.getCenter(new THREE.Vector3());
      // Shift the group so its bounding box center sits at world origin
      groupRef.current.position.y -= center.y;
    }
  }, [scene, color, shirtType]);

  if (!scene) return null;

  return (
    <group
      ref={groupRef}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
      dispose={null}
    >
      <primitive object={scene} />

      {designTexFront && showFront && (
        <DesignPlane
          tex={designTexFront}
          position={config.decal.position}
          rotation={[0, 0, 0]}
          width={config.decal.scale[0]}
          height={config.decal.scale[1]}
        />
      )}

      {designTexBack && showBack && (
        <DesignPlane
          tex={designTexBack}
          position={[config.decal.position[0], config.decal.position[1], -config.decal.position[2]]}
          rotation={[0, Math.PI, 0]}
          width={config.decal.scale[0]}
          height={config.decal.scale[1]}
        />
      )}
    </group>
  );
}

// Preload all models so switching is instant
useGLTF.preload('/models/shirt_baked.glb');
useGLTF.preload('/models/oversized_t-shirt.glb');
useGLTF.preload('/models/hoodie.glb');
useGLTF.preload('/models/polo_tshirt.glb');
