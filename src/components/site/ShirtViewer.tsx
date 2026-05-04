"use client";
import { Suspense, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/shirt_baked.glb";
useGLTF.preload(MODEL_URL);

/* ─── Helper: a plane that sticks flush to a surface via polygonOffset ─── */
function DesignPlane({
  tex,
  position,
  rotation,
  width,
  height,
}: {
  tex: THREE.CanvasTexture;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
}) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    side: THREE.FrontSide,
  }), [tex]);

  useEffect(() => { mat.map = tex; mat.needsUpdate = true; }, [tex, mat]);
  useEffect(() => () => mat.dispose(), [mat]);

  return (
    <mesh position={position} rotation={rotation} renderOrder={10}>
      <planeGeometry args={[width, height]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/* ─── Shirt mesh ─── */
function ShirtMesh({
  shirtColor,
  designTexFront,
  designTexBack,
  autoRotate,
}: {
  shirtColor: string;
  designTexFront: THREE.CanvasTexture | null;
  designTexBack: THREE.CanvasTexture | null;
  autoRotate: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const { nodes, materials } = useGLTF(MODEL_URL) as any;
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, dt) => {
    if (autoRotate && group.current) group.current.rotation.y += dt * 0.38;
  });

  useEffect(() => {
    materials.lambert1.color.set(shirtColor);
    materials.lambert1.needsUpdate = true;
  }, [shirtColor, materials]);

  /*
   * Shirt mesh at scale=1.4, center y=-0.6
   * Bounding box (empirically): Z front ≈ +0.19, Z back ≈ -0.19
   * Chest center Y ≈ -0.40 (slightly above body center)
   * Design plane: 0.80 wide × 0.55 tall (world units)
   */
  const FRONT_Z = 0.20;
  const BACK_Z = -0.20;
  const CHEST_Y = -0.38;
  const PW = 0.80;
  const PH = 0.55;

  return (
    <group ref={group}>
      {/* The shirt */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes.T_Shirt_male.geometry}
        material={materials.lambert1}
        material-roughness={0.90}
        dispose={null}
        scale={1.4}
        position={[0, -0.6, 0]}
      />

      {/* Front design — flush against front surface */}
      {designTexFront && (
        <DesignPlane
          tex={designTexFront}
          position={[0, CHEST_Y, FRONT_Z]}
          rotation={[0, 0, 0]}
          width={PW}
          height={PH}
        />
      )}

      {/* Back design — flush against back surface, uses pre-mirrored texture */}
      {designTexBack && (
        <DesignPlane
          tex={designTexBack}
          position={[0, CHEST_Y, BACK_Z]}
          rotation={[0, Math.PI, 0]}
          width={PW}
          height={PH}
        />
      )}
    </group>
  );
}

/* ─── Canvas wrapper ─── */
export default function ShirtViewer({
  shirtColor,
  designTexFront,
  designTexBack,
  autoRotate,
  onInteract,
}: {
  shirtColor: string;
  designTexFront: THREE.CanvasTexture | null;
  designTexBack: THREE.CanvasTexture | null;
  autoRotate: boolean;
  onInteract: () => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.1, 4.0], fov: 28 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "1.5rem",   /* matches rounded-3xl so WebGL clips at the corners */
      }}
    >
      <ambientLight intensity={0.70} />
      <directionalLight
        position={[4, 8, 5]} intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-5, 2, -3]} intensity={0.45} color="#c4b5fd" />
      <pointLight position={[0, -2, 4]} intensity={0.2} />
      <hemisphereLight args={["#dcd8f8", "#ffffff", 0.40]} />

      <Suspense fallback={null}>
        <ShirtMesh
          shirtColor={shirtColor}
          designTexFront={designTexFront}
          designTexBack={designTexBack}
          autoRotate={autoRotate}
        />
        <ContactShadows position={[0, -0.9, 0]} opacity={0.45} scale={6} blur={2.0} far={3.5} />
        <Environment preset="studio" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={6.5}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI - 0.15}
        onStart={onInteract}
      />
    </Canvas>
  );
}
