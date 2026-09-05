import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function hatchPiece(name, size, position, surface) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  // The existing pole and canopy shadows remain the roof's only cast accents.
  mesh.castShadow = false;
  return mesh;
}

function depositGeometry(x, y, z, width, depth, phase) {
  const vertices = [x, y, z];
  const indices = [];
  const edge = [0.89, 1, 0.84, 0.96, 0.87, 1, 0.91, 0.81, 0.97, 0.88];
  edge.forEach((radius, index) => {
    const angle = (index / edge.length) * Math.PI * 2 + phase;
    vertices.push(x + Math.cos(angle) * width * 0.5 * radius, y,
      z + Math.sin(angle) * depth * 0.5 * radius);
    // Clockwise in the x/z plane gives an upward-facing surface.
    indices.push(0, ((index + 1) % edge.length) + 1, index + 1);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoofWeatherDetails({ roofMaterial, snow = false }) {
  const group = new THREE.Group();
  group.name = 'Weather details: quiet rooftop additions';
  const hatch = new THREE.Group();
  hatch.name = 'Weather detail: low shop maintenance hatch';

  const base = roofMaterial.clone();
  base.color.multiplyScalar(0.8);
  base.roughness = 0.96;
  base.metalness = 0;
  const lid = roofMaterial.clone();
  lid.color.multiplyScalar(0.92);
  lid.roughness = 0.96;
  lid.metalness = 0;
  hatch.add(
    hatchPiece('Shallow maintenance hatch base', [0.72, 0.045, 0.48], [7.1, 5.3075, -2.7], base),
    hatchPiece('Matte maintenance hatch lid', [0.78, 0.04, 0.54], [7.1, 5.35, -2.7], lid),
  );
  group.add(hatch);

  if (snow) {
    const deposits = new THREE.Group();
    deposits.name = 'Weather detail: two sheltered snow deposits';
    const pieces = [
      depositGeometry(7.19, 5.373, -2.78, 0.27, 0.22, 0.16),
      depositGeometry(-10.33, 3.144, -4.48, 0.28, 0.22, -0.27),
    ];
    const surface = new THREE.MeshStandardMaterial({
      color: 0xb8bfba,
      roughness: 1,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(mergeGeometries(pieces), surface);
    pieces.forEach(piece => piece.dispose());
    mesh.name = 'Two paper-thin irregular snow patches';
    mesh.userData.depositCount = 2;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    deposits.add(mesh);
    group.add(deposits);
  }

  return group;
}
