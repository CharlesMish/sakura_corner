import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { weatherIsWet } from '../weatherMode.js';

export function createNeighborhoodLife() {
  const wet = weatherIsWet();
  const group = new THREE.Group();
  group.name = 'Quiet neighborhood life';
  const batches = { wall: [], roof: [], trim: [], window: [] };
  function block(tone, size, position) {
    const geometry = new THREE.BoxGeometry(...size);
    geometry.translate(...position);
    batches[tone].push(geometry);
  }
  // A second row behind the existing residences, with varied roof heights.
  for (const [x, z, width, height] of [[-16.8, -12.1, 3.2, 3.7], [-12.5, -12.7, 3.4, 4.25], [-7.1, -13, 2.8, 3.5]]) {
    block('wall', [width, height, 2.2], [x, height / 2, z]);
    block('roof', [width + 0.25, 0.14, 2.42], [x, height + 0.07, z]);
    block('trim', [0.42, 0.55, 0.45], [x - width * 0.23, height + 0.41, z]);
    block('roof', [0.57, 0.09, 0.59], [x - width * 0.23, height + 0.72, z]);
    block('roof', [0.5, 0.64, 0.045], [x + 0.38, height - 0.9, z + 1.13]);
    block('trim', [0.62, 0.055, 0.13], [x + 0.38, height - 1.23, z + 1.18]);
  }
  // Two small panes on an existing facade, kept much dimmer than the hearth.
  block('window', [0.21, 0.3, 0.025], [-7.57, 2.06, -4.525]);
  block('window', [0.15, 0.3, 0.025], [-7.28, 2.06, -4.525]);
  // A low rooftop vent and an aerial break the nearer roof's empty edge.
  block('trim', [0.6, 0.25, 0.43], [-10.8, 3.27, -4.35]);
  block('roof', [0.67, 0.065, 0.5], [-10.8, 3.43, -4.35]);
  block('roof', [0.035, 0.9, 0.035], [-12.95, 3.75, -5.55]);
  block('roof', [0.7, 0.035, 0.035], [-12.95, 4.07, -5.55]);
  block('roof', [0.42, 0.03, 0.035], [-12.95, 3.9, -5.55]);
  const colors = wet
    ? { wall: 0x384956, roof: 0x2c3c49, trim: 0x404f5b, window: 0x817253 }
    : { wall: 0x777b7d, roof: 0x555d65, trim: 0x888985, window: 0x736f60 };
  for (const [tone, pieces] of Object.entries(batches)) {
    const mesh = new THREE.Mesh(mergeGeometries(pieces), new THREE.MeshBasicMaterial({ color: colors[tone] }));
    pieces.forEach(geometry => geometry.dispose());
    mesh.name = `Neighborhood life ${tone}`;
    group.add(mesh);
  }
  return group;
}
