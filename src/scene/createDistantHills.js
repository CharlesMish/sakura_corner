import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';

const FAR_PROFILE = [
  [-32.0, 0],
  [-25.5, 1.55],
  [-20.2, 1.9],
  [-13.4, 1.15],
  [-5.6, 1.4],
  [5.8, 0.9],
  [14.2, 0],
];

const NEAR_PROFILE = [
  [-28.4, 0],
  [-22.6, 1.2],
  [-16.8, 1.5],
  [-9.4, 0.95],
  [1.8, 1.15],
  [12.6, 0],
];

function createRidge(profile, surface) {
  const positions = [];
  const indices = [];
  for (let index = 0; index < profile.length - 1; index += 1) {
    const [x0, y0] = profile[index];
    const [x1, y1] = profile[index + 1];
    const base = positions.length / 3;
    positions.push(x0, 0, 0, x1, 0, 0, x1, y1, 0, x0, y0, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function createDistantHills() {
  const wet = weatherIsWet();
  const near = new THREE.MeshBasicMaterial({
    color: wet ? 0x1c2830 : 0x6a6662,
    fog: true,
    side: THREE.DoubleSide,
  });
  const far = new THREE.MeshBasicMaterial({
    color: wet ? 0x161e24 : 0x5a5652,
    fog: true,
    side: THREE.DoubleSide,
  });

  const hills = new THREE.Group();
  hills.name = 'Distant mountain silhouette';

  const farRidge = createRidge(FAR_PROFILE, far);
  farRidge.name = 'Mountain range far';
  farRidge.position.set(-0.6, 0.04, -18.6);

  const nearRidge = createRidge(NEAR_PROFILE, near);
  nearRidge.name = 'Mountain range near';
  nearRidge.position.set(0.4, 0, -16.4);

  hills.add(farRidge, nearRidge);
  hills.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  return hills;
}
