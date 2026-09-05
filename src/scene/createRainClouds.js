import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';

const ORIGIN = [-22.4, 7.8, -15.2];

// Keep the weather on the left and top-left. Do not stretch a lid over the
// sakura. One lower step behind roofs, one quieter continuation that stays
// left of the crown.
const PUFFS = [
  { offset: [0, 0.4, 0.15], size: [18.8, 4.4, 6.4], role: 'step' },
  { offset: [-8.4, 0.3, 0.55], size: [13.6, 4.1, 5.4], role: 'step' },
  { offset: [5.4, 1.35, -0.45], size: [11.5, 2.5, 5.2], role: 'retreat' },
];

export function createRainClouds() {
  if (!weatherIsWet()) return null;

  const step = new THREE.MeshBasicMaterial({ color: 0x1b2a3b, fog: false, side: THREE.DoubleSide });
  const retreat = new THREE.MeshBasicMaterial({ color: 0x26394b, fog: false, side: THREE.DoubleSide });
  const clouds = new THREE.Group();
  clouds.name = 'Heavy rain clouds';

  PUFFS.forEach((puff, index) => {
    const [dx, dy, dz] = puff.offset;
    const shape = new THREE.Shape();
    const [width, height] = puff.size;
    shape.moveTo(-width * 0.8, height * 4);
    // Unequal overlapping lobes, sampled coarsely enough to keep the handmade edge.
    shape.lineTo(-0.55 * width, 0.22 * height);
    const profile = index === 1
      ? [[-0.47, -0.02, -0.34, 0.05], [-0.25, -0.19, -0.12, -0.11],
        [0.01, -0.28, 0.15, -0.09], [0.29, -0.15, 0.36, 0.08], [0.49, 0.04, 0.56, 0.36]]
      : [[-0.47, -0.11, -0.32, -0.02], [-0.21, -0.21, -0.06, -0.1],
        [0.04, -0.3, 0.19, -0.13], [0.34, -0.18, 0.4, 0.08], [0.53, 0.02, 0.58, 0.38]];
    profile.forEach(([cx, cy, x, y]) => shape.quadraticCurveTo(cx * width, cy * height, x * width, y * height));
    shape.quadraticCurveTo(width * 0.68, height * 0.85, width * 0.56, height * 1.25);
    shape.quadraticCurveTo(width * 0.66, height * 1.85, width * 0.47, height * 2.2);
    shape.quadraticCurveTo(width * 0.56, height * 2.8, width * 0.37, height * 3.2);
    shape.lineTo(width * 0.32, height * 4);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 4), puff.role === 'step' ? step : retreat);
    mesh.name = `Rain cloud silhouette ${index + 1}`;
    mesh.position.set(ORIGIN[0] + dx, ORIGIN[1] + dy, ORIGIN[2] + dz);
    mesh.rotation.y = 0.35;
    clouds.add(mesh);
  });

  clouds.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });

  return clouds;
}
