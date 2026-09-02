import * as THREE from 'three';
import { box, material } from './primitives.js';

export function createFarLeftShrineHint() {
  const woodDark = material(0x4c2c2a, { roughness: 0.82 });
  const roof = material(0x3a4146, { roughness: 0.88 });

  const shrine = new THREE.Group();
  shrine.name = 'Far left shrine hint';

  shrine.add(
    box('Shrine hall', [1.02, 0.72, 0.92], [-15.45, 0.5, -4.86], woodDark),
    box('Shrine roof', [1.55, 0.1, 1.28], [-15.45, 0.98, -4.86], roof),
  );

  shrine.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  return shrine;
}
