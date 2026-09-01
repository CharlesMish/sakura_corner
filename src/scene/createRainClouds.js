import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box } from './primitives.js';

const CLUSTERS = [
  [-32.0, 6.55, -18.2, 1.45],
  [-28.6, 6.35, -17.5, 1.38],
  [-24.8, 6.85, -18.6, 1.62],
  [-19.6, 6.95, -18.0, 1.7],
  [-14.8, 7.05, -17.4, 1.52],
  [-10.6, 6.7, -18.5, 1.68],
  [-7.4, 6.55, -17.15, 1.42],
  [-3.2, 6.35, -18.05, 1.38],
  [1.4, 6.15, -16.9, 1.28],
];

const PUFFS = [
  [0, 0, 0, 3.15, 0.88, 2.25],
  [1.45, 0.28, -0.55, 2.35, 0.74, 1.75],
  [-1.55, 0.22, 0.5, 2.15, 0.66, 1.55],
  [0.35, 0.5, 0.2, 1.65, 0.55, 1.25],
  [-0.7, 0.36, -0.7, 1.55, 0.52, 1.2],
  [0.85, 0.18, 0.45, 1.7, 0.48, 1.28],
];

function forceLightning() {
  if (typeof window === 'undefined') return false;
  if (window.__forceLightning) return true;
  return new URLSearchParams(window.location.search).get('flash') === '1';
}

function strikeAmount(elapsed) {
  if (forceLightning()) return 1;
  const t = elapsed % 6.8;
  if (t >= 2.4 && t < 2.48) return 1;
  if (t >= 2.58 && t < 2.64) return 0.55;
  return 0;
}

export function createRainClouds() {
  if (!weatherIsWet()) return null;

  const body = new THREE.MeshBasicMaterial({ color: 0x1c2a32, fog: false });
  const shade = new THREE.MeshBasicMaterial({ color: 0x10181e, fog: false });
  const lift = new THREE.MeshBasicMaterial({ color: 0x2a3a44, fog: false });
  const surfaces = [shade, body, lift];
  const clouds = new THREE.Group();
  clouds.name = 'Heavy rain clouds';

  CLUSTERS.forEach(([x, y, z, scale], cluster) => {
    PUFFS.forEach((puff, index) => {
      const [dx, dy, dz, width, height, depth] = puff;
      const mesh = box(
        `Rain cloud ${cluster + 1} puff ${index + 1}`,
        [width * scale, height * scale, depth * scale],
        [x + dx * scale, y + dy * scale, z + dz],
        surfaces[(cluster + index) % 3],
      );
      mesh.rotation.y = (cluster + index) % 2 === 0 ? 0.22 : -0.18;
      mesh.rotation.z = index === 1 ? 0.06 : index === 2 ? -0.05 : 0.02;
      clouds.add(mesh);
    });
  });

  const flash = new THREE.PointLight(0xc5d8e6, 0, 22, 1.7);
  flash.name = 'Distant storm lightning';
  flash.position.set(-8.55, 5.85, -14.95);
  flash.castShadow = false;

  const boltMaterial = new THREE.MeshBasicMaterial({
    color: 0xe4f2fa,
    fog: false,
    depthTest: false,
    depthWrite: false,
  });
  const bolt = new THREE.Group();
  bolt.name = 'Distant lightning bolt';
  const segments = [
    [[0.18, 0.82, 0.18], [-8.7, 6.08, -15.02]],
    [[0.14, 0.55, 0.14], [-8.48, 5.58, -15.08]],
    [[0.1, 0.38, 0.1], [-8.78, 5.22, -15.14]],
  ];
  segments.forEach((segment, index) => {
    const [size, position] = segment;
    const mesh = box(`Lightning segment ${index + 1}`, size, position, boltMaterial);
    mesh.rotation.z = index % 2 === 0 ? 0.32 : -0.38;
    mesh.renderOrder = 5;
    bolt.add(mesh);
  });
  bolt.visible = false;
  clouds.add(flash, bolt);

  clouds.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });

  function update(elapsed) {
    const amount = strikeAmount(elapsed);
    flash.intensity = amount * 12;
    boltMaterial.color.setRGB(
      0.68 + amount * 0.18,
      0.78 + amount * 0.14,
      0.86 + amount * 0.1,
    );
    bolt.visible = amount > 0.08;
  }

  return { group: clouds, update };
}
