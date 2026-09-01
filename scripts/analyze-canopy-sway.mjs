// Headless, browser-free check for whether the canopy's per-zone rigid sway
// (src/scene/createSakuraTree.js) opens a visible gap between any spray and
// its true nearest neighboring blossom during wind. Works by driving the
// real `createSakuraTree()` scene graph through `tree.update(elapsed)` over
// a simulated time window and reading actual instance-zone world matrices —
// no renderer/browser required, since this only touches Three.js's math
// (Object3D/Matrix4), not WebGL.
//
// Usage: node scripts/analyze-canopy-sway.mjs
import * as THREE from 'three';
import { createSakuraTree, canopyDefinitions } from '../src/scene/createSakuraTree.js';

const tree = createSakuraTree();

function zoneWorldPositions(elapsed) {
  tree.update(elapsed);
  tree.group.updateMatrixWorld(true);
  const result = {};
  for (const definition of canopyDefinitions) {
    const zoneObject = tree.group.getObjectByName(`${definition.name} blossom spray zone`);
    if (!zoneObject) throw new Error(`zone not found: ${definition.name}`);
    const points = definition.strands.flatMap((strand) => strand.points);
    result[definition.name] = points.map((p) => new THREE.Vector3(...p).applyMatrix4(zoneObject.matrixWorld));
  }
  return result;
}

function nearestOtherZoneDistance(worldPositions, ownZone, worldPoint) {
  let best = Infinity;
  for (const [zoneName, points] of Object.entries(worldPositions)) {
    if (zoneName === ownZone) continue;
    for (const p of points) {
      const d = p.distanceTo(worldPoint);
      if (d < best) best = d;
    }
  }
  return best;
}

const sampleCount = 121; // 0..30s in 0.25s steps — several full sway beats (swayFrequency 0.34)
const duration = 30;

const swings = [];
for (const definition of canopyDefinitions) {
  definition.strands.forEach((strand, strandIndex) => {
    strand.points.forEach((point, pointIndex) => {
      swings.push({
        zone: definition.name,
        label: `${definition.name} [strand ${strandIndex}, pt ${pointIndex}]`,
        point,
        values: [],
      });
    });
  });
}

for (let i = 0; i < sampleCount; i += 1) {
  const t = (i / (sampleCount - 1)) * duration;
  const worldPositions = zoneWorldPositions(t);
  for (const entry of swings) {
    const zoneObject = tree.group.getObjectByName(`${entry.zone} blossom spray zone`);
    const worldPoint = new THREE.Vector3(...entry.point).applyMatrix4(zoneObject.matrixWorld);
    entry.values.push(nearestOtherZoneDistance(worldPositions, entry.zone, worldPoint));
  }
}

const ranked = swings
  .map((entry) => {
    const rest = entry.values[0];
    const max = Math.max(...entry.values);
    return { ...entry, rest, max, driftFromRest: max - rest };
  })
  .sort((a, b) => b.driftFromRest - a.driftFromRest);

console.log('Top 12 sprays by worst-case drift-from-rest distance to their nearest neighboring zone');
console.log('(a large value means the gap between this spray and its nearest neighbor widens during sway):\n');
ranked.slice(0, 12).forEach((entry) => {
  console.log(
    `${entry.label.padEnd(48)} rest=${entry.rest.toFixed(4)}  max=${entry.max.toFixed(4)}  drift=${entry.driftFromRest.toFixed(4)}`,
  );
});
