import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';

const FAR_PROFILE = [
  [-32.0, 0],
  [-29, 0.42], [-27.4, 0.92], [-25.5, 1.32], [-23.8, 1.46],
  [-22.2, 1.82], [-20.2, 1.9], [-18.7, 1.68], [-17, 1.72],
  [-15.2, 1.33], [-13.4, 1.15], [-11.5, 1.25], [-9.8, 1.13],
  [-7.8, 1.4], [-5.6, 1.47], [-3.8, 1.24], [-1.8, 1.29],
  [0.8, 1.08], [3.4, 1.16], [5.8, 0.9], [8.1, 0.76], [10.6, 0.37],
  [14.2, 0],
];

const NEAR_PROFILE = [
  [-28.4, 0],
  [-26.4, 0.35], [-24.6, 0.94], [-22.6, 1.2], [-20.8, 1.11],
  [-18.8, 1.38], [-16.8, 1.5], [-15.1, 1.31], [-13.7, 1.35],
  [-11.4, 1.04], [-9.4, 0.95], [-7.4, 1.11], [-5.2, 1.01],
  [-2.8, 1.18], [-0.7, 1.06], [1.8, 1.15], [4, 0.91], [6.1, 0.84], [9.2, 0.42],
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
    color: wet ? 0x304253 : 0x6a6662,
    fog: !wet,
    side: THREE.DoubleSide,
  });
  const far = new THREE.MeshBasicMaterial({
    color: wet ? 0x334557 : 0x5a5652,
    fog: !wet,
    side: THREE.DoubleSide,
  });

  const hills = new THREE.Group();
  hills.name = 'Distant mountain silhouette';

  const farRidge = createRidge(FAR_PROFILE, far);
  farRidge.name = 'Mountain range far';
  farRidge.position.set(-0.6, 0.04, -18.6);
  farRidge.scale.set(1.4, 1.65, 1);

  const nearRidge = createRidge(NEAR_PROFILE, near);
  nearRidge.name = 'Mountain range near';
  nearRidge.position.set(0.4, 0, -16.4);
  nearRidge.scale.set(1.3, 1.2, 1);

  hills.add(farRidge, nearRidge);
  hills.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  return hills;
}
