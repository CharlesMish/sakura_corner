import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box } from './primitives.js';

const FRONT_Z = -15.78;

const FAR_PROFILE = [
  [-28.4, 0],
  [-26.6, 3.15],
  [-24.2, 6.55],
  [-21.6, 5.85],
  [-17.4, 4.35],
  [-12.8, 3.25],
  [-7.6, 2.75],
  [-2.2, 2.55],
  [2.4, 3.45],
  [6.8, 2.15],
  [11.6, 0],
];

const BACK_PROFILE = [
  [-30.2, 0],
  [-27.4, 1.15],
  [-24.8, 2.55],
  [-21.6, 1.95],
  [-18.2, 1.75],
  [-15.1, 4.95],
  [-12.8, 3.85],
  [-9.4, 2.35],
  [-6.2, 2.65],
  [-2.8, 5.45],
  [0.6, 3.55],
  [4.2, 2.25],
  [8.4, 1.55],
  [12.6, 0],
];

const FRONT_PROFILE = [
  [-27.1, 0],
  [-26.2, 2.65],
  [-25.0, 3.95],
  [-23.5, 5.25],
  [-22.2, 4.35],
  [-20.6, 3.55],
  [-18.4, 2.28],
  [-15.6, 2.02],
  [-12.4, 2.18],
  [-9.8, 2.48],
  [-8.2, 3.05],
  [-6.95, 5.42],
  [-5.85, 3.38],
  [-3.8, 2.68],
  [-1.6, 2.95],
  [0.8, 2.42],
  [2.6, 2.28],
  [4.55, 4.72],
  [5.95, 2.48],
  [8.4, 1.78],
  [11.4, 0],
];

const FOREST_PATCHES = [
  {
    x: -21.85,
    trees: [
      [-0.2, 0.28, 0.68, 0.58, 0.5],
      [0.15, 0.32, 0.82, 0.7, 0.55],
      [0.55, 0.4, 0.58, 0.95, 0.68],
      [0.0, 0.55, 0.48, 1.15, 0.75],
      [0.85, 0.52, 0.5, 0.82, 0.58],
      [0.35, 0.7, 0.4, 1.05, 0.7],
    ],
  },
  {
    x: -20.7,
    trees: [
      [0.55, 0.68, 0.5, 1.25, 0.8],
      [-0.35, 0.4, 0.85, 0.7, 0.55],
      [0.28, 0.46, 0.72, 0.6, 0.48],
      [-0.12, 0.82, 0.4, 1.2, 0.75],
      [0.78, 0.78, 0.45, 0.88, 0.6],
      [0.38, 1.0, 0.36, 1.35, 0.7],
      [-0.55, 0.55, 0.58, 0.55, 0.45],
      [0.15, 0.62, 0.55, 0.95, 0.65],
    ],
  },
  {
    x: -8.55,
    trees: [
      [0.0, 0.85, 0.7, 1.35, 0.9],
      [-0.4, 0.55, 0.92, 0.72, 0.55],
      [0.45, 0.7, 0.62, 0.65, 0.48],
      [0.1, 1.15, 0.48, 1.55, 0.82],
      [0.7, 1.05, 0.42, 0.95, 0.65],
      [-0.15, 0.95, 0.55, 0.88, 0.6],
    ],
  },
];

const BACK_FOREST = [
  [-13.6, 1.35, 0.72, 1.15, 0.7],
  [-12.9, 1.85, 0.5, 1.55, 0.85],
  [-14.2, 1.55, 0.58, 0.82, 0.55],
];

const SNOW_CAPS = [
  [-23.5, 1.7],
  [-6.95, 1.35],
  [4.55, 1.05],
];

function heightAt(profile, x) {
  for (let index = 0; index < profile.length - 1; index += 1) {
    const [x0, y0] = profile[index];
    const [x1, y1] = profile[index + 1];
    if (x >= Math.min(x0, x1) && x <= Math.max(x0, x1)) {
      const span = x1 - x0;
      const t = Math.abs(span) < 0.001 ? 0 : (x - x0) / span;
      return y0 + (y1 - y0) * t;
    }
  }
  return 0;
}

function ridgeClearance(profile, x, width, topY) {
  const samples = [
    x - width * 0.5,
    x - width * 0.25,
    x,
    x + width * 0.25,
    x + width * 0.5,
  ];
  return Math.min(...samples.map((sampleX) => heightAt(profile, sampleX))) - topY;
}

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

function createForestPatches(needle, needleDark) {
  const forest = new THREE.Group();
  forest.name = 'Mountain forest patches';
  let count = 0;
  FOREST_PATCHES.forEach((patch, patchIndex) => {
    patch.trees.forEach((tree, treeIndex) => {
      const [dx, belowCrest, height, width, depth] = tree;
      const x = patch.x + dx;
      const localRidge = heightAt(FRONT_PROFILE, x);
      const topY = localRidge - belowCrest;
      const centerY = Math.max(height * 0.5 + 0.2, topY - height * 0.5);
      const actualTop = centerY + height * 0.5;
      if (x - width * 0.5 < -22.52) return;
      if (ridgeClearance(FRONT_PROFILE, x, width, actualTop) < 0.12) return;
      const surface = width > 1.05 || treeIndex % 3 === 0 ? needleDark : needle;
      const mesh = box(
        `Mountain patch ${patchIndex + 1} mass ${treeIndex + 1}`,
        [width, height, depth],
        [x, centerY, FRONT_Z + 0.22 - (treeIndex % 3) * 0.07],
        surface,
      );
      mesh.rotation.y = ((count % 5) - 2) * 0.16;
      forest.add(mesh);
      count += 1;
    });
  });
  BACK_FOREST.forEach((tree, index) => {
    const [x, belowCrest, height, width, depth] = tree;
    const localRidge = heightAt(BACK_PROFILE, x);
    const centerY = Math.max(height * 0.5 + 0.2, localRidge - belowCrest - height * 0.5);
    const mesh = box(
      `Back ridge grove ${index + 1}`,
      [width, height, depth],
      [x + 1.05, centerY, -17.0],
      index % 2 === 0 ? needleDark : needle,
    );
    forest.add(mesh);
  });
  return forest;
}

function createSnowCaps(snow, snowShade) {
  const caps = new THREE.Group();
  caps.name = 'Mountain snow caps';
  SNOW_CAPS.forEach(([x, width], index) => {
    const ridgeY = heightAt(FRONT_PROFILE, x);
    if (ridgeY < 4.5) return;
    const cap = box(
      `Snow cap ${index + 1}`,
      [width, 0.18, 0.85],
      [x, ridgeY + 0.06, FRONT_Z + 0.22],
      index % 2 === 0 ? snow : snowShade,
    );
    cap.rotation.z = index % 2 === 0 ? -0.05 : 0.04;
    caps.add(cap);
  });
  return caps;
}

export function createDistantHills() {
  const wet = weatherIsWet();
  const body = new THREE.MeshBasicMaterial({
    color: wet ? 0x2c3e48 : 0x6e6a66,
    fog: false,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.MeshBasicMaterial({
    color: wet ? 0x18242c : 0x5c5854,
    fog: false,
    side: THREE.DoubleSide,
  });
  const farShade = new THREE.MeshBasicMaterial({
    color: wet ? 0x0c1418 : 0x4a4642,
    fog: false,
    side: THREE.DoubleSide,
  });
  const needle = new THREE.MeshBasicMaterial({
    color: wet ? 0x2a6a44 : 0x3a4c40,
    fog: false,
  });
  const needleDark = new THREE.MeshBasicMaterial({
    color: wet ? 0x1a4a32 : 0x2c3a32,
    fog: false,
  });
  const snow = new THREE.MeshBasicMaterial({
    color: wet ? 0x6e828c : 0xc8d0d4,
    fog: false,
  });
  const snowShade = new THREE.MeshBasicMaterial({
    color: wet ? 0x5c7078 : 0xb0b8bc,
    fog: false,
  });

  const hills = new THREE.Group();
  hills.name = 'Distant mountain silhouette';

  const far = createRidge(FAR_PROFILE, farShade);
  far.name = 'Mountain range far';
  far.position.set(-1.85, 0.08, -19.15);

  const back = createRidge(BACK_PROFILE, shade);
  back.name = 'Mountain range back';
  back.position.set(1.05, 0, -17.02);

  const front = createRidge(FRONT_PROFILE, body);
  front.name = 'Mountain range front';
  front.position.set(0, 0, FRONT_Z);

  hills.add(far, back, front, createForestPatches(needle, needleDark), createSnowCaps(snow, snowShade));
  hills.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  return hills;
}
