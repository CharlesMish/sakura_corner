import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';

// Connected ridge. Broad left summit, modest pass behind the sakura,
// higher jags over the shop roofs. Built as quads so concave peaks stay intact.
const PROFILE = [
  [-28.6, 0],
  [-26.8, 2.2],
  [-25.6, 3.55],
  [-24.6, 4.45],
  [-23.8, 4.7],
  [-22.8, 4.25],
  [-21.6, 3.85],
  [-20.2, 3.55],
  [-18.2, 3.3],
  [-16.0, 3.4],
  [-13.6, 3.25],
  [-11.4, 3.5],
  [-9.6, 4.05],
  [-8.6, 5.05],
  [-7.8, 4.55],
  [-6.6, 3.95],
  [-5.2, 3.8],
  [-4.2, 4.45],
  [-3.4, 5.25],
  [-2.6, 4.7],
  [-1.4, 4.05],
  [0.2, 3.9],
  [1.4, 4.65],
  [2.6, 4.15],
  [4.0, 4.0],
  [5.2, 4.5],
  [6.6, 3.55],
  [8.6, 3.7],
  [11.6, 0],
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
  const body = new THREE.MeshBasicMaterial({
    color: wet ? 0x2c3e48 : 0x6e6a66,
    fog: false,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.MeshBasicMaterial({
    color: wet ? 0x1a2830 : 0x5c5854,
    fog: false,
    side: THREE.DoubleSide,
  });

  const hills = new THREE.Group();
  hills.name = 'Distant mountain silhouette';

  const back = createRidge(PROFILE, shade);
  back.name = 'Mountain range back';
  back.position.set(0, 0, -17.2);

  const front = createRidge(
    PROFILE.map(([x, y]) => [x + 0.35, y * 0.9]),
    body,
  );
  front.name = 'Mountain range front';
  front.position.set(0.12, 0, -15.8);

  hills.add(back, front);
  return hills;
}
