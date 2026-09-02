import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box, material } from './primitives.js';

function createRetainingWall(stone, stoneDark) {
  const wall = new THREE.Group();
  wall.name = 'Left street retaining wall';
  wall.add(
    box('Left retaining run', [5.95, 0.38, 0.18], [-15.25, 0.22, -1.02], stoneDark),
    box('Left retaining cap', [6.15, 0.08, 0.26], [-15.25, 0.44, -1.02], stone),
  );
  return wall;
}

export function createLeftHorizonFill() {
  const wet = weatherIsWet();
  const earth = material(wet ? 0x4a453c : 0x5c564c, { roughness: 0.95 });
  const earthDark = material(wet ? 0x3a3731 : 0x4a453c, { roughness: 0.96 });
  const grass = material(wet ? 0x4a6354 : 0x56705c, { roughness: 0.88 });
  const stone = material(wet ? 0x7a7e76 : 0x8a8e84, { roughness: 0.88 });
  const stoneDark = material(wet ? 0x5c6058 : 0x6c7066, { roughness: 0.9 });

  const fill = new THREE.Group();
  fill.name = 'Left horizon neighborhood fill';

  fill.add(
    box('Left street-end earth', [11.5, 0.1, 5.4], [-16.4, 0.04, -1.55], earth),
    box('Left street-end earth shade', [6.8, 0.08, 3.2], [-18.8, 0.05, -3.15], earthDark),
    box('Left street-end grass lip', [4.6, 0.06, 1.15], [-14.2, 0.055, -0.72], grass),
    box('Left slope rise', [5.4, 0.85, 3.6], [-20.4, 0.42, -3.55], earthDark),
    box('Left wooded bank', [6.8, 1.15, 3.4], [-17.4, 0.58, -5.15], earth),
    box('Far-left covering earth', [10.8, 0.14, 6.4], [-26.2, 0.07, -3.55], earth),
    createRetainingWall(stone, stoneDark),
  );

  fill.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  return fill;
}
