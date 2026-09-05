import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { createSnowCollision } from './snowCollision.js';

export const SNOW_SPEC = Object.freeze({
  count: 64,
  bounds: { x: [-13, 10], y: [-0.515, 12.8], z: [-8, 8] },
  speed: [0.45, 0.8],
  radius: [0.016, 0.033],
  color: 0xb9c1c2,
  opacity: 0.68,
});

export function createSnowfall({ camera, environment, tree, random = Math.random, collision = createSnowCollision({ environment, tree }) } = {}) {
  const group = new THREE.Group();
  group.name = 'Snow: quiet spring flurry';
  const surface = new THREE.MeshBasicMaterial({
    color: SNOW_SPEC.color,
    transparent: true,
    opacity: SNOW_SPEC.opacity,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    toneMapped: true,
  });
  const mesh = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 6), surface, SNOW_SPEC.count);
  mesh.name = 'Snow: fixed 64-flake pool';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh);

  const helper = new THREE.Object3D();
  const facing = new THREE.Quaternion();
  const nextPosition = new THREE.Vector3();
  const fallbackCamera = new THREE.PerspectiveCamera();
  fallbackCamera.position.set(...ART_DIRECTION.camera.frameCompletionPosition);
  fallbackCamera.lookAt(...ART_DIRECTION.camera.frameCompletionTarget);
  const stats = { capacity: SNOW_SPEC.count, recycled: 0, ground: 0, construction: 0, canopy: 0, trunk: 0, boundary: 0 };
  let elapsed = 0;
  const sample = range => THREE.MathUtils.lerp(range[0], range[1], random());
  const flakes = Array.from({ length: SNOW_SPEC.count }, () => ({
    position: new THREE.Vector3(),
    speed: sample(SNOW_SPEC.speed),
    radius: sample(SNOW_SPEC.radius),
    phase: random() * Math.PI * 2,
    frequency: 0.38 + random() * 0.34,
    drift: 0.035 + random() * 0.07,
    roll: random() * Math.PI,
  }));

  function respawn(flake, initial = false) {
    for (let attempt = 0; attempt < 48; attempt += 1) {
      flake.position.set(sample(SNOW_SPEC.bounds.x), initial ? sample([0.25, 12.8]) : sample([10.8, 12.8]), sample(SNOW_SPEC.bounds.z));
      if (!collision.contains(flake.position, flake.radius)) return;
    }
    // A bounded deterministic fallback keeps a pathological injected random
    // source from either blocking initialization or placing a flake indoors.
    for (let index = 0; index < 16; index += 1) {
      flake.position.set(-12 + index * 1.4, 12.7, 7.6);
      if (!collision.contains(flake.position, flake.radius)) return;
    }
    throw new Error('Snow needs exposed air inside its authored spawn bounds.');
  }

  function place(flake, index) {
    helper.position.copy(flake.position);
    helper.quaternion.copy(facing);
    helper.rotateZ(flake.roll + Math.sin(elapsed * 0.22 + flake.phase) * 0.15);
    // Fixed world size and a short foreground range prevent large near-camera
    // flakes; ordinary blending avoids new glints from the shop lighting.
    helper.scale.set(flake.radius, flake.radius * 0.82, flake.radius);
    helper.updateMatrix();
    mesh.setMatrixAt(index, helper.matrix);
  }

  flakes.forEach(flake => respawn(flake, true));

  function update(delta = 0, wind = 1) {
    const step = Number.isFinite(delta) ? THREE.MathUtils.clamp(delta, 0, 0.1) : 0;
    const breeze = Number.isFinite(wind) ? THREE.MathUtils.clamp(wind, 0, 1.5) : 1;
    elapsed += step;
    (camera ?? fallbackCamera).getWorldQuaternion(facing);
    flakes.forEach((flake, index) => {
      if (step > 0) {
        nextPosition.copy(flake.position);
        nextPosition.x += (0.048 * breeze + Math.sin(elapsed * flake.frequency + flake.phase) * flake.drift) * step;
        nextPosition.y -= flake.speed * step;
        nextPosition.z += (0.012 * breeze + Math.cos(elapsed * flake.frequency * 0.71 + flake.phase) * flake.drift * 0.55) * step;
        let reason = collision.intercepts(flake.position, nextPosition, flake.radius);
        if (!reason && (nextPosition.x < SNOW_SPEC.bounds.x[0] || nextPosition.x > SNOW_SPEC.bounds.x[1]
          || nextPosition.z < SNOW_SPEC.bounds.z[0] || nextPosition.z > SNOW_SPEC.bounds.z[1])) reason = 'boundary';
        if (reason) {
          stats.recycled += 1;
          stats[reason] += 1;
          respawn(flake);
        } else flake.position.copy(nextPosition);
      }
      place(flake, index);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  update();

  return {
    group,
    update,
    getStats: () => ({ ...stats, boundsCount: collision.blockers.length, elapsed }),
    // Snapshots are requested only by review/analyzers, never on the render path.
    getParticleState: () => flakes.map(flake => ({ x: flake.position.x, y: flake.position.y, z: flake.position.z, radius: flake.radius, speed: flake.speed })),
  };
}
