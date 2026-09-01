import * as THREE from 'three';

const up = new THREE.Vector3(0, 1, 0);

export function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
    ...options,
  });
}

export function box(name, size, position, surface) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function branchBetween(name, start, end, startRadius, endRadius, surface, radialSegments = 7) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const midpoint = a.clone().add(b).multiplyScalar(0.5);
  const direction = b.clone().sub(a);

  const geometry = new THREE.CylinderGeometry(
    endRadius,
    startRadius,
    direction.length(),
    radialSegments,
    1,
    false,
  );
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.name = name;
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
