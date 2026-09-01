import * as THREE from 'three';
import { box, material } from './primitives.js';

const REAR_BLOCK = {
  massSize: [2.65, 5.55, 2.45],
  massPosition: [7.05, 2.975, -7.28],
  roofSize: [2.85, 0.1, 2.6],
  roofPosition: [7.05, 5.8, -7.27],
  returnSize: [0.22, 5.5, 2.38],
  returnPosition: [5.62, 2.95, -7.3],
  jointSize: [2.4, 0.1, 0.22],
  jointPosition: [7, 5.34, -6.05],
};

export function createRightBackgroundExtension({ surfaces: _surfaces }) {
  const extension = new THREE.Group();
  extension.name = 'Connected right-rear neighborhood block';

  const surfaces = {
    wall: material(0x6e7477, {
      emissive: 0x25292b,
      emissiveIntensity: 0.07,
      roughness: 0.97,
    }),
    shade: material(0x565d61, { roughness: 0.98 }),
    roof: material(0x747a7d, { roughness: 0.98 }),
    joint: material(0x454b4e, { roughness: 0.98 }),
  };

  extension.add(
    box('Right-rear block mass', REAR_BLOCK.massSize, REAR_BLOCK.massPosition, surfaces.wall),
    box('Right-rear block roof', REAR_BLOCK.roofSize, REAR_BLOCK.roofPosition, surfaces.roof),
    box('Right-rear block shade return', REAR_BLOCK.returnSize, REAR_BLOCK.returnPosition, surfaces.shade),
    box('Right-rear block roof joint', REAR_BLOCK.jointSize, REAR_BLOCK.jointPosition, surfaces.joint),
  );

  extension.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  return extension;
}
