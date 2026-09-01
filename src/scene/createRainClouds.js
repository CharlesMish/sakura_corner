import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box } from './primitives.js';

const CLUSTERS = [
  [-23.9, 4.85, -15.4],
  [-21.4, 4.5, -15.2],
  [-8.5, 5.2, -14.8],
  [-3.3, 5.4, -15.0],
  [1.5, 4.85, -14.6],
  [5.1, 4.65, -14.4],
];

export function createRainClouds() {
  if (!weatherIsWet()) return null;

  const body = new THREE.MeshBasicMaterial({ color: 0x2a3c44, fog: false });
  const shade = new THREE.MeshBasicMaterial({ color: 0x1e2c34, fog: false });
  const lift = new THREE.MeshBasicMaterial({ color: 0x33444c, fog: false });
  const surfaces = [shade, body, lift];
  const clouds = new THREE.Group();
  clouds.name = 'Heavy rain clouds';

  CLUSTERS.forEach(([x, y, z], cluster) => {
    const puffs = [
      [0, 0, 0, 1.55, 0.58, 1.25],
      [0.7, 0.28, -0.25, 1.15, 0.5, 1.05],
      [-0.65, 0.18, 0.3, 1.05, 0.46, 0.95],
      [0.15, 0.42, 0.1, 0.85, 0.4, 0.8],
    ];
    puffs.forEach((puff, index) => {
      const [dx, dy, dz, width, height, depth] = puff;
      const mesh = box(
        `Rain cloud ${cluster + 1} puff ${index + 1}`,
        [width, height, depth],
        [x + dx, y + dy, z + dz],
        surfaces[(cluster + index) % 3],
      );
      mesh.rotation.y = (cluster + index) % 2 === 0 ? 0.28 : -0.22;
      mesh.rotation.z = index === 1 ? 0.08 : index === 2 ? -0.06 : 0.03;
      clouds.add(mesh);
    });
  });

  clouds.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });

  return clouds;
}
