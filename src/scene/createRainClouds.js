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
  const retreat = new THREE.MeshBasicMaterial({ color: 0x283c50, fog: false, side: THREE.DoubleSide });
  const clouds = new THREE.Group();
  clouds.name = 'Heavy rain clouds';

  PUFFS.forEach((puff, index) => {
    const [dx, dy, dz] = puff.offset;
    const shape = new THREE.Shape();
    const [width, height] = puff.size;
    shape.moveTo(-width / 2, height + 20);
    [[-0.5, 0.1], [-0.38, 0.1], [-0.38, -0.05], [-0.2, -0.05],
      [-0.12, -0.18], [0.04, -0.18], [0.04, -0.08], [0.22, -0.08],
      [0.3, 0.12], [0.42, 0.12], [0.5, 0.3]].forEach(([x, y]) => shape.lineTo(x * width, y * height));
    shape.lineTo(width * 1.3, height + 20);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), puff.role === 'step' ? step : retreat);
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
