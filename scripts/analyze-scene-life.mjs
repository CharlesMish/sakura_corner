import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSceneLife, LIFE_SPEC } from '../src/scene/createSceneLife.js';
import { ART_DIRECTION } from '../src/config.js';

const matrix = new THREE.Matrix4();
const results = [];
for (const weather of ['rain', 'wet', 'clear', 'snow']) {
  const life = createSceneLife({ weather });
  const meshes = [];
  life.group.traverse(object => {
    assert.ok(!object.isLight, 'New inhabitants add no lights');
    if (object.isMesh) { meshes.push(object); assert.equal(object.castShadow, false); }
  });
  const ids = meshes.map(mesh => mesh.uuid);
  const random = Math.random;
  Math.random = () => { throw new Error('Animation must not consume the scene random stream'); };
  try {
    for (let frame = 0; frame < 180 * 60; frame++) {
      life.update(1 / 60);
      if (frame % 30) continue;
      life.group.updateMatrixWorld(true);
      for (const mesh of meshes) {
        assert.ok(mesh.matrixWorld.elements.every(Number.isFinite));
        if (mesh.isInstancedMesh) assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
      }
      if (weather === 'rain' || weather === 'snow') {
        const bounds = new THREE.Box3().setFromObject(life.group);
        assert.ok(bounds.min.y >= 1.1399 && bounds.max.y < 1.4875, 'Cat rests on counter below shelf');
        assert.ok(bounds.min.z > -1.5075 && bounds.max.z < -1.4475, 'Cat stays between backing and glass');
        assert.ok(bounds.min.x > 2.35 && bounds.max.x < 3.37, 'Cat stays inside the window and counter');
      }
      if (weather === 'wet') {
        const bird = life.group.children[0];
        assert.ok(bird.position.x >= 0.539 && bird.position.x <= 0.801);
        assert.ok(bird.position.z >= 2.049 && bird.position.z <= 2.231);
        assert.ok(bird.position.y >= -0.0201 && bird.position.y <= 0.066);
      }
    }
  } finally { Math.random = random; }
  assert.deepEqual(meshes.map(mesh => mesh.uuid), ids, 'Fixed geometry population');
  const before = life.getTelemetry().time;
  life.update(Number.NaN);
  life.update(-1);
  assert.equal(life.getTelemetry().time, before);
  life.update(1, true);
  life.group.updateMatrixWorld(true);
  const frozen = meshes.map(mesh => mesh.matrixWorld.toArray());
  for (let i = 0; i < 100; i++) { life.update(1 / 60, true); life.group.updateMatrixWorld(true); }
  assert.equal(life.getTelemetry().time, before);
  assert.deepEqual(meshes.map(mesh => mesh.matrixWorld.toArray()), frozen, 'Reduced motion freezes new inhabitants');
  if (weather === 'clear') assert.equal(life.group.children[0].visible, false);
  results.push({ weather, meshes: meshes.length, instancedSlots: meshes.reduce((n,m) => n + (m.isInstancedMesh ? m.count : 0),0) });
}

// The foraging loop returns without teleporting, and is frame-rate independent.
const poses = [];
for (const hz of [24, 60, 120]) {
  const life = createSceneLife({ weather: 'wet' });
  for (let i=0; i<38*hz; i++) life.update(1/hz);
  const bird = life.group.children[0];
  assert.ok(bird.position.distanceTo(new THREE.Vector3(...LIFE_SPEC.bird.position)) < 1e-8);
  poses.push(bird.position.toArray());
}

// Flight visibility changes only beyond each canonical frame's side edges.
for (const [aspect, narrow, ultra] of [[1920/1080,false,false],[1366/768,false,false],[390/844,true,false],[2560/1080,false,true]]) {
  const config = ART_DIRECTION.camera;
  const camera = new THREE.PerspectiveCamera(narrow ? config.narrowFieldOfView : ultra ? config.ultrawideFieldOfView : config.frameCompletionFieldOfView,aspect,.1,120);
  camera.position.set(...(narrow ? config.narrowPosition : config.frameCompletionPosition));
  camera.lookAt(...(narrow ? config.narrowTarget : ultra ? config.ultrawideTarget : config.frameCompletionTarget));
  camera.updateMatrixWorld();
  for (const time of [LIFE_SPEC.flock.start + 0.01, LIFE_SPEC.flock.start + LIFE_SPEC.flock.duration - 0.01]) {
    const life = createSceneLife({ weather: 'clear' });
    for(let t=0;t<Math.floor(time*100);t++) life.update(.01);
    const mesh = life.group.children[0].children[0];
    for(let i=0;i<mesh.count;i++) {
      mesh.getMatrixAt(i,matrix);
      const projected = new THREE.Vector3().setFromMatrixPosition(matrix).project(camera);
      assert.ok(Math.abs(projected.x)>1.025, `Flock boundary must be outside aspect ${aspect}: ${projected.x}`);
    }
  }
}
console.log(JSON.stringify({ secondsPerMode:180, results, frameRates:[24,60,120], checks:'Finite fixed populations, counter/window contact, bounded foraging, random-stream independence, reduced motion, continuous loop and offscreen flock boundaries pass.' },null,2));
