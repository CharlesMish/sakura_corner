import assert from 'node:assert/strict';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createSnowfall, SNOW_SPEC } from '../src/scene/createSnowfall.js';
import { collectSnowBlockers, createSnowCollision } from '../src/scene/snowCollision.js';
import { createSakuraTree } from '../src/scene/createSakuraTree.js';
import { sampleWind } from '../src/scene/sampleWind.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// A construction fixture exercises broad walls, roof contact, transform handling
// and the real canopy. Browser review checks the full environment's extracted
// blockers because that module loads locally bundled PNGs through Vite.
const environment = new THREE.Group();
const surface = new THREE.MeshBasicMaterial();
for (const [name, size, position] of [
  ['Building body', [5.65, 5.45, 3.1], [3.8, 2.33, -3.25]],
  ['Building cap', [5.95, 0.25, 3.38], [3.76, 5.16, -3.23]],
  ['Continuation roof cap', [4.55, 0.25, 4.48], [8.2, 5.16, -3.78]],
  ['Left residence body', [2.9, 3.15, 2.1], [-10.42, 1.425, -4]],
  ['Left residence roofline', [3.05, 0.14, 2.25], [-10.42, 3.07, -4]],
  ['Low wall', [3.8, 1.18, 0.42], [-4.2, 0.42, -2.15]],
]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.name = name;
  mesh.position.set(...position);
  environment.add(mesh);
}
const vent = new THREE.BoxGeometry(0.6, 0.25, 0.43).translate(-10.8, 3.27, -4.35);
const rearHouse = new THREE.BoxGeometry(3.2, 3.7, 2.2).translate(-16.8, 1.85, -12.1);
const batch = new THREE.Mesh(mergeGeometries([vent, rearHouse]), surface);
batch.name = 'Neighborhood life trim';
environment.add(batch);
const transformed = new THREE.Group();
transformed.position.set(3, 0, 0);
const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 2), surface);
wall.name = 'Transformed construction';
transformed.add(wall);
environment.add(transformed);
const tree = createSakuraTree();
const blockers = collectSnowBlockers(environment, tree.group);
const collision = createSnowCollision({ blockers });
assert.ok(blockers.some(box => box.kind === 'canopy'));
assert.equal(blockers.filter(box => box.name.startsWith('Neighborhood life trim')).length, 2);
assert.equal(collision.contains({ x: 3, y: 1, z: 0 }), 'construction');
assert.equal(collision.contains({ x: -10.8, y: 3.3, z: -4.35 }), 'construction');
assert.equal(collision.contains({ x: 8, y: 2, z: 7 }), null);
assert.equal(collision.intercepts({ x: 8, y: 0, z: 7 }, { x: 8, y: -1, z: 7 }, 0.02), 'ground');
assert.equal(collision.intercepts({ x: 8, y: 6, z: -4 }, { x: 8, y: 4, z: -4 }, 0.02), 'construction', 'swept collision must catch thin roofs');

for (const hz of [24, 60, 120]) {
  const snowfall = createSnowfall({ collision, random: seededRandom(9167) });
  const mesh = snowfall.group.children[0];
  assert.equal(mesh.count, 64);
  assert.equal(mesh.material.blending, THREE.NormalBlending);
  assert.equal(mesh.material.depthTest, true);
  assert.equal(mesh.castShadow, false);
  for (let frame = 0; frame < 180 * hz; frame += 1) {
    snowfall.update(1 / hz, sampleWind(frame / hz));
    if (frame % hz !== 0) continue;
    assert.equal(mesh.count, SNOW_SPEC.count);
    assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
    for (const flake of snowfall.getParticleState()) {
      assert.equal(collision.contains(flake, flake.radius), null, 'every rendered flake must remain outside solids');
      assert.ok(flake.x >= SNOW_SPEC.bounds.x[0] && flake.x <= SNOW_SPEC.bounds.x[1]);
      assert.ok(flake.z >= SNOW_SPEC.bounds.z[0] && flake.z <= SNOW_SPEC.bounds.z[1]);
      assert.ok(flake.y >= SNOW_SPEC.bounds.y[0] && flake.y <= SNOW_SPEC.bounds.y[1]);
      assert.ok(flake.speed >= 0.45 && flake.speed <= 0.8);
      assert.ok(flake.radius <= 0.033);
    }
  }
  const before = snowfall.getParticleState();
  snowfall.update(Number.NaN, Number.NaN);
  snowfall.update(-1);
  assert.deepEqual(snowfall.getParticleState(), before);
  snowfall.update(10, 20);
  assert.ok(mesh.instanceMatrix.array.every(Number.isFinite), 'suspension/resume must preserve finite transforms');
  const stats = snowfall.getStats();
  assert.ok(stats.recycled > 200 && stats.ground > 0 && stats.construction > 0 && stats.canopy > 0);
  console.log(`${hz} Hz: 180 seconds; finite 64-flake pool, all world bounds and solid/canopy contacts respected. ${JSON.stringify(stats)}`);
}
