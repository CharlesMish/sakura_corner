import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { weatherIsWet } from '../weatherMode.js';

// Authored at contact height; batching keeps this static detail to four draws.
export function createStreetWear() {
  const wet = weatherIsWet();
  const group = new THREE.Group();
  group.name = 'Everyday street wear';
  const batches = { dark: [], pale: [], moss: [], asphalt: [] };
  function patch(tone, points, y = 0.034) {
    // Road repairs follow the exposed asphalt just beyond the drain, z > 4.03.
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, y < -0.4 ? z - 2 : z)));
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, y, 0);
    batches[tone].push(geometry);
  }
  function strip(tone, a, b, width, y = 0.035) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const length = Math.hypot(dx, dz);
    const x = -dz / length * width / 2, z = dx / length * width / 2;
    patch(tone, [[a[0] + x, a[1] + z], [b[0] + x, b[1] + z],
      [b[0] - x, b[1] - z], [a[0] - x, a[1] - z]], y);
  }

  // A few connected cracks, with short forks, rather than a uniform noise field.
  for (const path of [
    [[-6.4, 1.66], [-6.05, 1.92], [-5.98, 2.13], [-5.55, 2.29]],
    [[0.7, 1.98], [0.93, 2.14], [1.18, 2.12], [1.44, 2.4]],
    [[4.87, 1.28], [5.06, 1.54], [5.37, 1.65], [5.45, 1.92]],
  ]) {
    path.slice(1).forEach((point, index) => strip('dark', path[index], point, 0.026));
    const p = path[1];
    strip('dark', p, [p[0] - 0.21, p[1] + 0.23], 0.018);
  }
  patch('pale', [[0.32, 1.33], [0.88, 1.37], [1.01, 1.61], [0.79, 1.76], [0.26, 1.67]]);
  patch('dark', [[-7.48, 0.8], [-7.02, 0.76], [-6.94, 1.04], [-7.18, 1.15], [-7.51, 1.06]]);
  patch('pale', [[3.8, -0.18], [4.38, -0.15], [4.45, -0.04], [4.03, 0.01]], 0.034);

  // Interrupt the existing painted edge and tuck moss into existing joints.
  for (const [x, length] of [[-10.4, 0.16], [-8.8, 0.3], [-7.2, 0.12], [-5.8, 0.21], [-3.9, 0.14]]) {
    strip('dark', [x, 2.72], [x + length, 2.72], 0.085);
  }
  for (const [x, z, length] of [[-9.28, 1.69, 0.38], [-7.8, 2.53, 0.26], [-5.92, 0.38, 0.31], [0.1, 3.09, 0.35], [5.1, 3.07, 0.42]]) {
    strip('moss', [x, z], [x + length, z + 0.024], 0.065);
  }
  for (const [x, length] of [[-8.4, 0.43], [-5.1, 0.3], [-0.3, 0.55], [2.2, 0.32], [5.8, 0.47]]) {
    strip('dark', [x, 3.23], [x + length, 3.23], 0.09, -0.078);
  }

  // Authored road coordinates are shifted toward the corrected curb in patch().
  patch('asphalt', [[-4.8, 6.42], [-3.3, 6.34], [-2.96, 6.65], [-3.18, 7.01], [-4.6, 7.08], [-4.98, 6.72]], -0.507);
  patch('asphalt', [[-8.4, 6.63], [-7.43, 6.58], [-7.18, 6.91], [-7.45, 7.15], [-8.3, 7.12]], -0.507);
  strip('dark', [-3.3, 6.35], [-2.96, 6.65], 0.035, -0.503);
  strip('dark', [-2.96, 6.65], [-2.7, 6.83], 0.026, -0.503);
  for (const [x, length] of [[-9, 0.8], [-6.7, 0.65], [-3.5, 0.9], [-1.8, 0.55]]) {
    strip('asphalt', [x, 6.12], [x + length, 6.12], 0.11, -0.502);
  }

  const tones = {
    dark: [wet ? 0x141e23 : 0x4c4942, 0.26],
    pale: [wet ? 0x728080 : 0xb3aa95, 0.07],
    moss: [wet ? 0x4a5c49 : 0x667255, 0.33],
    asphalt: [wet ? 0x56616a : 0x777871, wet ? 0.055 : 0.1],
  };
  for (const [tone, pieces] of Object.entries(batches)) {
    const [color, opacity] = tones[tone];
    const mesh = new THREE.Mesh(mergeGeometries(pieces), new THREE.MeshBasicMaterial({
      color, opacity, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    pieces.forEach(geometry => geometry.dispose());
    mesh.name = `Street wear ${tone}`;
    mesh.renderOrder = 1;
    group.add(mesh);
  }
  return group;
}
