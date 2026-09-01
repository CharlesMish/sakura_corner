import * as THREE from 'three';
import { ART_DIRECTION } from '../src/config.js';
import { createSakuraTree } from '../src/scene/createSakuraTree.js';

const tree = createSakuraTree();
const worldPoint = new THREE.Vector3(-3.05, 5.85, 0.35);
const dt = 1 / 60;
let elapsed = 0;
let peak = 0;

function assertState() {
  tree.group.updateMatrixWorld(true);
  tree.group.traverse((object) => {
    if (!object.matrixWorld.elements.every(Number.isFinite)) {
      throw new Error(`Non-finite tree matrix: ${object.name}`);
    }
  });
  tree.getResponseState().forEach((state) => {
    if (!Number.isFinite(state.magnitude)) {
      throw new Error(`Non-finite response: ${state.zoneName}`);
    }
    if (state.magnitude > ART_DIRECTION.treeResponse.maxStackedRotation + 1e-8) {
      throw new Error(`Response cap exceeded: ${state.zoneName}`);
    }
    peak = Math.max(peak, state.magnitude);
  });
}

tree.update(elapsed);
tree.applyLocalResponse({
  zoneName: 'left crown',
  neighborName: 'high crown',
  worldPoint,
  strength: 1,
});
for (let frame = 0; frame < 3 * 60; frame += 1) {
  elapsed += dt;
  tree.update(elapsed);
  assertState();
}

for (let index = 0; index < 10; index += 1) {
  tree.applyLocalResponse({
    zoneName: 'reaching crown',
    neighborName: 'annotated gap infill',
    worldPoint: new THREE.Vector3(0.2, 5.8, 0.4),
    strength: index === 0 ? 1 : ART_DIRECTION.treeResponse.cooldownStrength,
  });
  elapsed += 0.05;
  tree.update(elapsed);
  assertState();
}

for (let frame = 0; frame < 180 * 60; frame += 1) {
  elapsed += dt;
  if (frame % 120 === 0) {
    tree.applyLocalResponse({
      zoneName: 'reaching crown',
      neighborName: 'annotated gap infill',
      worldPoint,
      strength: 1,
    });
  }
  tree.update(elapsed);
  if (frame % 60 === 0) assertState();
}

console.log('Localized tree-response analysis');
console.log(`peak=${peak.toFixed(5)} rad / cap=${ART_DIRECTION.treeResponse.maxStackedRotation}`);
console.log('180-second response run: finite and bounded');
