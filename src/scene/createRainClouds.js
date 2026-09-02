import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box } from './primitives.js';

const ORIGIN = [-22.4, 9.7, -15.2];

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

  const step = new THREE.MeshBasicMaterial({ color: 0x10161c, fog: false });
  const retreat = new THREE.MeshBasicMaterial({ color: 0x1a232b, fog: false });
  const clouds = new THREE.Group();
  clouds.name = 'Heavy rain clouds';

  PUFFS.forEach((puff, index) => {
    const [dx, dy, dz] = puff.offset;
    const mesh = box(
      `Rain cloud ${puff.role} ${index + 1}`,
      puff.size,
      [ORIGIN[0] + dx, ORIGIN[1] + dy, ORIGIN[2] + dz],
      puff.role === 'step' ? step : retreat,
    );
    mesh.rotation.y = puff.role === 'step' ? 0.07 : -0.05;
    mesh.rotation.z = puff.role === 'step' ? 0.05 : -0.03;
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
