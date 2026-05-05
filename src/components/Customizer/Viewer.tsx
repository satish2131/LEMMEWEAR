"use client";
import React, { Suspense, Component, ReactNode, useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import ShirtModel from './ShirtModel';
import { ShirtType } from '@/lib/constants/modelConfig';

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          3D preview unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

interface ViewerProps {
  shirtType: ShirtType;
  color: string;
  designTexFront: THREE.Texture | null;
  designTexBack: THREE.Texture | null;
  showFront: boolean;
  showBack: boolean;
  autoRotate: boolean;
  onInteract: () => void;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
}

export default function Viewer({
  shirtType, color, designTexFront, designTexBack,
  showFront, showBack, autoRotate, onInteract, onResetRef
}: ViewerProps) {
  const controlsRef = useRef<any>(null);

  // Expose reset to parent via ref callback
  if (onResetRef) {
    onResetRef.current = () => {
      controlsRef.current?.reset();
    };
  }

  return (
    <CanvasErrorBoundary>
    <Canvas
      shadows
      camera={{ position: [0, 0, 3.5], fov: 30 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        borderRadius: "1.5rem",
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 2]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 2, -3]} intensity={0.45} color="#c4b5fd" />
      <directionalLight position={[0, -1, 3]} intensity={0.3} color="#ffffff" />
      <pointLight position={[0, -2, 4]} intensity={0.2} />

      <Suspense fallback={null}>
        <group key={shirtType}>
          <ShirtModel
            shirtType={shirtType}
            color={color}
            designTexFront={designTexFront}
            designTexBack={designTexBack}
            showFront={showFront}
            showBack={showBack}
          />
        </group>
        <ContactShadows position={[0, -0.45, 0]} opacity={0.4} scale={4} blur={2.0} far={2} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={2.5}
        maxDistance={7.0}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI - 0.15}
        autoRotate={autoRotate}
        autoRotateSpeed={1.0}
        onStart={onInteract}
      />
    </Canvas>
    </CanvasErrorBoundary>
  );
}
