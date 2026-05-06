import * as THREE from 'three';

export type ShirtType = 'regular' | 'oversized' | 'hoodie' | 'polo';

export const SHIRT_MODELS: Record<ShirtType, string> = {
  regular: '/models/shirt_baked.glb',
  oversized: '/models/oversized_t-shirt.glb',
  hoodie: '/models/hoodie.glb',
  polo: '/models/polo_tshirt.glb',
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
  },
  // polo_tshirt: raw bbox 60×167×33 units, root matrix [x,y,z]→[x,z,-y],
  // node4 scale=0.001, node6 scale=10 → effective internal scale=0.01
  // rendered height = 167 * 0.01 = 1.67m
  // target same visual size as hoodie → group scale = 2.223 * (0.386/1.67) ≈ 0.514
  // world center after internal transforms: y = 82.6 * 0.01 = 0.826
  // position.y offset = same pattern as hoodie/oversized = -1.257 (empirical match)
  polo: {
    position: [0.000, -0.425, 0.047],
    rotation: [0, 0, 0],
    scale: 0.75,
    decal: {
      // chest area: raw Y≈120 → local 1.2, front Z≈16.9 → local 0.169
      position: [0, 1.2, 0.169],
      scale: [0.38, 0.38]
    }
  }
};
