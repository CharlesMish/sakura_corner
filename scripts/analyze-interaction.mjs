import * as THREE from 'three';
import { createPetalSystem } from '../src/scene/createPetalSystem.js';

const system = createPetalSystem();
const settled = system.group.getObjectByName('Bounded settled petal memory');
const matrix = new THREE.Matrix4();
const initialStoryMatrices = [];

for (let index = 0; index < 34; index += 1) {
  settled.getMatrixAt(index, matrix);
  initialStoryMatrices.push([...matrix.elements]);
}

const dt = 1 / 30;
let elapsed = 0;
let peakFalling = 0;
let peakInteractive = 0;
let peakQueued = 0;
let accepted = 0;
let diminished = 0;
let rejected = 0;

system.update(dt, elapsed);

for (let frame = 1; frame <= 5 * 60 * 30; frame += 1) {
  elapsed += dt;
  if (frame === 60) {
    const result = system.releaseInteractive([-3.07, 5.81, 0.33]);
    if (result.accepted) accepted += 1;
  }
  if (frame === 240) {
    const result = system.releaseInteractive([-1.55, 6.64, 0.03]);
    if (result.accepted) accepted += 1;
  }
  if (frame === 600) {
    for (let index = 0; index < 10; index += 1) {
      const result = system.releaseInteractive([1.2, 5.04, 0.19]);
      if (result.accepted) {
        accepted += 1;
        if (result.reason === 'diminished') diminished += 1;
      } else {
        rejected += 1;
      }
    }
  }
  system.update(dt, elapsed);
  const stats = system.getStats();
  peakFalling = Math.max(peakFalling, stats.fallingActive);
  peakInteractive = Math.max(peakInteractive, stats.fallingInteractive);
  peakQueued = Math.max(peakQueued, stats.queued);
  if (stats.fallingActive > 20) throw new Error('Falling-petal pool exceeded 20');
  if (stats.fallingInteractive > 8) throw new Error('Interactive live cap exceeded 8');
  if (stats.queued > 9) throw new Error('Interactive queue cap exceeded 9');

  if (frame % 30 === 0) {
    system.group.updateMatrixWorld(true);
    system.group.traverse((object) => {
      if (!object.isInstancedMesh) return;
      for (let index = 0; index < object.count; index += 1) {
        object.getMatrixAt(index, matrix);
        if (!matrix.elements.every(Number.isFinite)) {
          throw new Error(`Non-finite matrix in ${object.name} instance ${index}`);
        }
      }
    });
  }
}

for (let index = 0; index < 34; index += 1) {
  settled.getMatrixAt(index, matrix);
  if (matrix.elements.some((value, axis) => value !== initialStoryMatrices[index][axis])) {
    throw new Error(`Protected story petal ${index} changed`);
  }
}

const finalStats = system.getStats();
if (finalStats.fallingInteractive !== 0 || finalStats.queued !== 0) {
  throw new Error('Interactive population did not return to baseline');
}

console.log('Interactive blossom analysis');
console.log(`accepted=${accepted} diminished=${diminished} rejected=${rejected}`);
console.log(`peak falling=${peakFalling}/20 interactive=${peakInteractive}/8 queued=${peakQueued}/9`);
console.log(`dropped=${finalStats.dropped} settledCursor=${finalStats.settledCursor}`);
console.log(`final interactive=${finalStats.fallingInteractive} queued=${finalStats.queued}`);
console.log('protected story petals: unchanged; transforms: finite');
