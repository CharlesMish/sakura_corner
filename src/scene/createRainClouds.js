import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box, material } from './primitives.js';

const CLUSTERS = [
  {
    name: 'Left rain cloud',
    puffs: [
      [5.4, 1.55, 2.8, -12.4, 10.6, -10.2],
      [3.6, 1.2, 2.2, -14.8, 11.1, -9.6],
      [2.8, 0.95, 1.8, -11.2, 11.35, -11.1],
      [4.1, 1.05, 2.4, -13.6, 10.15, -11.4],
    ],
  },
  {
    name: 'Center rain cloud',
    puffs: [
      [6.2, 1.7, 3.1, -1.8, 11.4, -11.8],
      [4.4, 1.25, 2.4, 1.4, 11.85, -11.0],
      [3.2, 1.05, 2.0, -3.6, 12.1, -12.6],
      [5.0, 1.15, 2.6, -0.2, 10.75, -12.9],
      [2.6, 0.85, 1.6, 2.8, 11.2, -12.2],
    ],
  },
  {
    name: 'Right rain cloud',
    puffs: [
      [4.8, 1.4, 2.5, 7.2, 10.4, -10.6],
      [3.4, 1.1, 2.1, 9.4, 10.95, -9.9],
      [2.7, 0.9, 1.7, 6.1, 11.2, -11.4],
      [3.8, 1.0, 2.2, 8.3, 9.85, -11.7],
    ],
  },
  {
    name: 'Far rain cloud',
    puffs: [
      [7.4, 1.85, 3.2, -6.5, 12.8, -16.4],
      [5.2, 1.3, 2.5, -3.4, 13.3, -15.6],
      [4.0, 1.1, 2.1, -8.6, 12.4, -17.2],
    ],
  },
];

export function createRainClouds() {
  if (!weatherIsWet()) return null;

  const body = material(0x3d5460, { roughness: 0.96 });
  const shade = material(0x2a3e48, { roughness: 0.97 });
  const clouds = new THREE.Group();
  clouds.name = 'Heavy rain clouds';

  CLUSTERS.forEach((cluster) => {
    const group = new THREE.Group();
    group.name = cluster.name;
    cluster.puffs.forEach((puff, index) => {
      const [width, height, depth, x, y, z] = puff;
      const surface = index % 2 === 0 ? body : shade;
      group.add(box(`${cluster.name} puff ${index + 1}`, [width, height, depth], [x, y, z], surface));
    });
    clouds.add(group);
  });

  clouds.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });

  return clouds;
}
