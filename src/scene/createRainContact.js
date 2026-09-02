import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';

function cheatCard(name, size, position, surface, rotationY = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 2;
  return mesh;
}

function tintMaterial(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

export function createRainContact() {
  if (!weatherIsWet()) return null;

  const group = new THREE.Group();
  group.name = 'Rain contact memory';

  const catchHighlight = tintMaterial(0xa07046, 0.3);
  const catchHighlightDim = tintMaterial(0x7e5636, 0.2);
  const wetTint = tintMaterial(0x1a2226, 0.3);
  const wallTint = tintMaterial(0x2a2824, 0.2);

  const pool = new THREE.Group();
  pool.name = 'Shop pool wet catch';
  pool.add(
    cheatCard('Shop pool light catch', [0.5, 0.01, 0.32], [3.14, 0.042, -0.62], catchHighlight, 0.18),
    cheatCard('Shop pool light catch mid', [0.22, 0.008, 0.26], [3.34, 0.04, -0.26], catchHighlightDim, -0.22),
    cheatCard('Shop pool light catch interrupt', [0.13, 0.008, 0.11], [2.96, 0.041, -0.44], catchHighlightDim, 0.52),
  );
  group.add(pool);

  const drainage = new THREE.Group();
  drainage.name = 'Downspout runoff';
  drainage.add(
    cheatCard('Downspout shoe wet', [0.34, 0.016, 0.3], [7.2, 0.028, -0.92], wetTint, 0.05),
    cheatCard('Downspout runoff seam', [0.08, 0.01, 0.44], [7.16, 0.024, -0.55], wetTint, 0.03),
  );
  group.add(drainage);

  const wall = new THREE.Group();
  wall.name = 'Shop wall rain history';
  wall.add(
    cheatCard('Shop wet base course', [2.15, 0.14, 0.03], [3.28, 0.16, -1.445], wallTint),
    cheatCard('Shop wet plaster band', [0.95, 0.24, 0.03], [1.72, 0.32, -1.61], wallTint),
  );
  group.add(wall);

  return group;
}
