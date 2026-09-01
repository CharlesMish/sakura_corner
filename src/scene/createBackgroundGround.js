import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';
import { box, material } from './primitives.js';

const transform = new THREE.Object3D();

const HEDGE_CLUMPS = [
  [-18.4, -6.15, 0.85, 1.65, 0.48],
  [-16.9, -6.85, 0.72, 1.42, 0.44],
  [-19.6, -5.55, 0.9, 1.88, 0.5],
  [-15.6, -7.85, 0.68, 1.28, 0.4],
  [-17.8, -8.35, 0.78, 1.55, 0.46],
  [-22.4, -5.15, 0.7, 1.55, 0.42],
  [-21.6, -6.35, 0.85, 1.85, 0.48],
  [-22.8, -7.7, 0.62, 1.28, 0.4],
  [-21.3, -8.9, 0.78, 1.7, 0.44],
  [-20.4, -6.8, 0.55, 1.12, 0.36],
  [-19.4, -9.4, 0.72, 1.45, 0.42],
  [-17.6, -10.6, 0.8, 1.62, 0.46],
  [-15.8, -10.85, 0.64, 1.2, 0.38],
  [-13.5, -10.55, 0.88, 1.78, 0.5],
  [-11.4, -10.7, 0.7, 1.35, 0.42],
  [-9.2, -10.48, 0.6, 1.05, 0.36],
  [-7.15, -10.8, 0.82, 1.92, 0.48],
  [-5.05, -10.62, 0.74, 1.48, 0.44],
  [-3.1, -10.9, 0.9, 1.7, 0.5],
  [-1.15, -10.52, 0.58, 1.12, 0.36],
  [0.85, -10.75, 0.76, 1.55, 0.42],
  [2.7, -10.58, 0.68, 1.25, 0.4],
  [4.55, -11.05, 0.8, 1.68, 0.46],
  [-21.9, -11.8, 0.66, 1.4, 0.4],
  [-18.8, -12.15, 0.72, 1.52, 0.44],
];

function createHedgeLine(surface) {
  const hedges = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    surface,
    HEDGE_CLUMPS.length,
  );
  hedges.name = 'Far hedge line';
  hedges.frustumCulled = false;
  hedges.castShadow = false;
  hedges.receiveShadow = true;

  HEDGE_CLUMPS.forEach(([x, z, width, height, depth], index) => {
    transform.position.set(x, height / 2 + 0.03, z);
    transform.rotation.set(0, (index % 3 === 0 ? 0.1 : -0.06), 0);
    transform.scale.set(width, height, depth);
    transform.updateMatrix();
    hedges.setMatrixAt(index, transform.matrix);
  });
  hedges.instanceMatrix.needsUpdate = true;
  return hedges;
}

export function createBackgroundGround() {
  const wet = weatherIsWet();
  const earth = material(wet ? 0x3d3a34 : 0x524e46, { roughness: 0.95 });
  const earthDark = material(wet ? 0x302e2a : 0x413e38, { roughness: 0.96 });
  const grassFar = material(wet ? 0x3a463c : 0x4f5c4a, { roughness: 0.9 });
  const hedge = material(wet ? 0x2c3a32 : 0x3d4c42, { roughness: 0.86 });
  const water = material(wet ? 0x173038 : 0x2a4650, {
    roughness: 0.14,
    metalness: 0.12,
  });
  const bank = material(wet ? 0x555850 : 0x6a6e64, { roughness: 0.88 });

  const ground = new THREE.Group();
  ground.name = 'Far ground continuation';

  ground.add(
    box('Horizon earth', [58, 0.08, 32], [-6, 0.028, -26], earthDark),
    box('Yard earth behind street', [40, 0.07, 8.5], [-2.5, 0.03, -11.2], earth),
    box('Left earth beside shrine', [9.2, 0.07, 11.5], [-23.1, 0.032, -8.4], earth),
    box('Left precinct yard', [7.8, 0.075, 5.4], [-17.4, 0.034, -6.55], earth),
    box('Left grass beside shrine', [4.4, 0.055, 3.2], [-21.4, 0.04, -5.15], grassFar),
    box('Rear grass lip', [36, 0.055, 2.4], [-3.4, 0.036, -6.85], grassFar),
    box('Rear grass behind plots', [18, 0.05, 2.1], [-6.2, 0.034, -9.15], grassFar),
    box('Left canal bank inner', [0.48, 0.22, 9.6], [-20.55, 0.1, -8.7], bank),
    box('Left canal water', [1.22, 0.08, 9.2], [-21.35, -0.04, -8.7], water),
    box('Left canal bank outer', [0.44, 0.2, 9.6], [-22.15, 0.09, -8.7], bank),
    box('Back canal bank near', [36, 0.22, 0.5], [-4.8, 0.1, -13.15], bank),
    box('Back canal water', [34.5, 0.08, 1.35], [-4.8, -0.04, -14.05], water),
    box('Back canal bank far', [36, 0.2, 0.46], [-4.8, 0.08, -14.95], bank),
    box('Canal corner', [2.4, 0.22, 2.2], [-21.35, 0.1, -13.15], bank),
    createHedgeLine(hedge),
  );

  ground.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  if (wet) {
    const hazePlate = new THREE.Mesh(
      new THREE.BoxGeometry(80, 0.16, 42),
      new THREE.MeshBasicMaterial({
        color: ART_DIRECTION.palette.wetHaze,
        fog: true,
      }),
    );
    hazePlate.name = 'Unlit horizon haze ground';
    hazePlate.position.set(-4, -0.05, -30);
    hazePlate.castShadow = false;
    hazePlate.receiveShadow = false;
    ground.add(hazePlate);
  }

  return ground;
}
