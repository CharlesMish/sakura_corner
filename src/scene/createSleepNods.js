import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';
import { box, material } from './primitives.js';

const matrixHelper = new THREE.Object3D();

export function createSleepNods() {
  if (!weatherIsWet()) return null;

  const group = new THREE.Group();
  group.name = 'Quiet sleep-app nods';
  const { hearth, moths } = ART_DIRECTION.sleepNods;

  const glow = material(hearth.color, {
    emissive: hearth.emissive,
    emissiveIntensity: hearth.emissiveIntensity,
    roughness: 0.52,
  });
  const fire = box('Distant hearth glow', hearth.size, hearth.position, glow);
  fire.castShadow = false;
  fire.receiveShadow = false;

  const light = new THREE.PointLight(
    hearth.lightColor,
    hearth.lightIntensity,
    hearth.lightDistance,
    2,
  );
  light.name = 'Distant hearth';
  light.position.set(...hearth.lightPosition);

  const mothMaterial = material(moths.color, {
    emissive: moths.color,
    emissiveIntensity: 0.22,
    roughness: 0.7,
  });
  const mothMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(moths.size[0], moths.size[1], moths.size[2]),
    mothMaterial,
    moths.count,
  );
  mothMesh.name = 'Quiet moths near hearth';
  mothMesh.frustumCulled = false;
  mothMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mothMesh.castShadow = false;

  group.add(fire, light, mothMesh);

  function update(elapsed) {
    const flicker =
      1 +
      Math.sin(elapsed * 2.15) * 0.14 +
      Math.sin(elapsed * 5.4 + 0.7) * 0.07;
    light.intensity = hearth.lightIntensity * flicker;
    glow.emissiveIntensity = hearth.emissiveIntensity * (0.88 + flicker * 0.12);

    for (let index = 0; index < moths.count; index += 1) {
      const phase = elapsed * moths.speed + index * 2.15;
      matrixHelper.position.set(
        hearth.position[0] + Math.cos(phase) * moths.radius[0],
        hearth.position[1] + 0.38 + Math.sin(phase * 1.65 + index) * moths.radius[1],
        hearth.position[2] + 0.22 + Math.sin(phase) * moths.radius[2],
      );
      matrixHelper.rotation.set(0, phase * 0.8, Math.sin(phase * 3) * 0.4);
      matrixHelper.scale.setScalar(1);
      matrixHelper.updateMatrix();
      mothMesh.setMatrixAt(index, matrixHelper.matrix);
    }
    mothMesh.instanceMatrix.needsUpdate = true;
  }

  update(0);
  return { group, update };
}
