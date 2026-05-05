import * as THREE from 'three';

export type ShirtType = 'regular' | 'oversized' | 'hoodie';

export const SHIRT_MODELS: Record<ShirtType, string> = {
  regular: '/models/shirt_baked.glb',
  oversized: '/models/oversized_t-shirt.glb',
  hoodie: '/models/hoodie.glb',
};

// Target world-space decal size: 0.55 x 0.55 for all models
// local_scale = world_target / model_scale
// This ensures the canvas texture maps to the same physical size on every garment,
// so text/image position sliders behave identically across all three types.

export const MODEL_CONFIG: Record<ShirtType, {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  decal: { position: [number, number, number]; scale: [number, number] };
}> = {
  // shirt_baked: no root matrix, rendered h=0.613, scale=1.4
  // local decal = 0.55 / 1.4 = 0.393
  regular: {
    position: [0.001, 0.013, -0.014],
    rotation: [0, 0, 0],
    scale: 1.4,
    decal: {
      position: [0, -0.033, 0.154],
      scale: [0.393, 0.393]
    }
  },
  // oversized: root matrix [x,y,z]->[x,z,-y], rendered h=0.711, scale=1.207
  // local decal = 0.55 / 1.207 = 0.456
  oversized: {
    position: [-0.007, -1.589, 0.002],
    rotation: [0, 0, 0],
    scale: 1.207,
    decal: {
      position: [0, 1.290, 0.22],
      scale: [0.456, 0.456]
    }
  },
  // hoodie: root matrix [x,y,z]->[x,z,-y], rendered h=0.386, scale=2.223
  // local decal = 0.55 / 2.223 = 0.247
  hoodie: {
    position: [0.000, -1.257, 0.047],
    rotation: [0, 0, 0],
    scale: 2.223,
    decal: {
      position: [0, 0.551, 0.08],
      scale: [0.247, 0.247]
    }
  }
};
