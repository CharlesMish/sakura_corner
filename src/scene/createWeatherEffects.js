import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { getRainStyle, getWeatherMode, weatherIsWet } from '../weatherMode.js';

const matrixHelper = new THREE.Object3D();

function resetDrop(drop, spec, random) {
  const [treeX, , treeZ] = ART_DIRECTION.world.treePosition;
  const canopyRadiusSq = spec.canopySkipRadius ** 2;
  drop.speed = THREE.MathUtils.lerp(spec.speed[0], spec.speed[1], random());
  drop.length = THREE.MathUtils.lerp(spec.length[0], spec.length[1], random());
  const chunk = random() < 0.38 ? 1 + spec.widthJitter : 1;
  drop.width = spec.width * chunk;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    drop.x = THREE.MathUtils.lerp(spec.spawn.x[0], spec.spawn.x[1], random());
    drop.y = THREE.MathUtils.lerp(spec.spawn.y[0], spec.spawn.y[1], random());
    drop.z = THREE.MathUtils.lerp(spec.spawn.z[0], spec.spawn.z[1], random());
    const dx = drop.x - treeX;
    const dz = drop.z - treeZ;
    if (dx * dx + dz * dz >= canopyRadiusSq) return;
    drop.z -= spec.canopySkipRadius;
  }
}

function createRainStreaks(random) {
  const spec = ART_DIRECTION.weather.rain[getRainStyle()] ?? ART_DIRECTION.weather.rain.dash;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const surface = new THREE.MeshBasicMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, surface, spec.count);
  mesh.name = 'Bounded rain streaks';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const drops = Array.from({ length: spec.count }, () => {
    const drop = { x: 0, y: 0, z: 0, speed: 1, length: 0.4, width: spec.width };
    resetDrop(drop, spec, random);
    return drop;
  });

  const tilt = spec.tilt;

  function place(drop, index) {
    matrixHelper.position.set(drop.x, drop.y, drop.z);
    matrixHelper.rotation.set(0, 0, tilt);
    matrixHelper.scale.set(drop.width, drop.length, drop.width);
    matrixHelper.updateMatrix();
    mesh.setMatrixAt(index, matrixHelper.matrix);
  }

  drops.forEach(place);
  mesh.instanceMatrix.needsUpdate = true;

  function update(delta) {
    drops.forEach((drop, index) => {
      drop.y -= drop.speed * delta;
      drop.x += spec.drift[0] * delta;
      drop.z += spec.drift[2] * delta;
      if (drop.y < spec.groundY) resetDrop(drop, spec, random);
      place(drop, index);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { mesh, update };
}

function createDrips(random) {
  const spec = ART_DIRECTION.weather.drips;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const surface = new THREE.MeshBasicMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, surface, spec.sources.length);
  mesh.name = 'Wire and fascia drips';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const drips = spec.sources.map((source) => ({
    x: source[0],
    y: source[1],
    z: source[2],
    originY: source[1],
    delay: random() * spec.maxDelay,
    speed: THREE.MathUtils.lerp(spec.speed[0], spec.speed[1], random()),
  }));

  function hide(index) {
    matrixHelper.position.set(0, -12, 0);
    matrixHelper.rotation.set(0, 0, 0);
    matrixHelper.scale.set(0, 0, 0);
    matrixHelper.updateMatrix();
    mesh.setMatrixAt(index, matrixHelper.matrix);
  }

  function update(delta) {
    drips.forEach((drip, index) => {
      if (drip.delay > 0) {
        drip.delay -= delta;
        hide(index);
        return;
      }
      drip.y -= drip.speed * delta;
      if (drip.y < spec.groundY) {
        drip.y = drip.originY;
        drip.delay = THREE.MathUtils.lerp(spec.minDelay, spec.maxDelay, random());
        drip.speed = THREE.MathUtils.lerp(spec.speed[0], spec.speed[1], random());
        hide(index);
        return;
      }
      matrixHelper.position.set(drip.x, drip.y, drip.z);
      matrixHelper.rotation.set(0, 0, 0);
      matrixHelper.scale.set(spec.width, spec.length, spec.width);
      matrixHelper.updateMatrix();
      mesh.setMatrixAt(index, matrixHelper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  drips.forEach((_, index) => hide(index));
  mesh.instanceMatrix.needsUpdate = true;
  return { mesh, update };
}

function createSpoutTrickle(random) {
  const spec = ART_DIRECTION.weather.spoutWater;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const surface = new THREE.MeshBasicMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, surface, spec.count);
  mesh.name = 'Downspout trickle';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const [originX, originY, originZ] = spec.origin;
  const drops = Array.from({ length: spec.count }, () => ({
    y: originY,
    delay: random() * spec.maxDelay,
    speed: THREE.MathUtils.lerp(spec.speed[0], spec.speed[1], random()),
  }));

  function hide(index) {
    matrixHelper.position.set(0, -12, 0);
    matrixHelper.rotation.set(0, 0, 0);
    matrixHelper.scale.set(0, 0, 0);
    matrixHelper.updateMatrix();
    mesh.setMatrixAt(index, matrixHelper.matrix);
  }

  function update(delta) {
    drops.forEach((drop, index) => {
      if (drop.delay > 0) {
        drop.delay -= delta;
        hide(index);
        return;
      }
      drop.y -= drop.speed * delta;
      const fallen = originY - drop.y;
      const z = originZ + spec.drift[2] * fallen;
      if (drop.y < spec.groundY) {
        drop.y = originY;
        drop.delay = THREE.MathUtils.lerp(spec.minDelay, spec.maxDelay, random());
        drop.speed = THREE.MathUtils.lerp(spec.speed[0], spec.speed[1], random());
        hide(index);
        return;
      }
      matrixHelper.position.set(originX, drop.y, z);
      matrixHelper.rotation.set(0, 0, 0.08);
      matrixHelper.scale.set(spec.width, spec.length, spec.width);
      matrixHelper.updateMatrix();
      mesh.setMatrixAt(index, matrixHelper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  drops.forEach((_, index) => hide(index));
  mesh.instanceMatrix.needsUpdate = true;
  return { mesh, update };
}

export function createWeatherEffects() {
  const group = new THREE.Group();
  group.name = 'Weather study effects';
  const random = () => Math.random();
  const mode = getWeatherMode();
  const updaters = [];

  if (weatherIsWet()) {
    const drips = createDrips(random);
    group.add(drips.mesh);
    updaters.push(drips.update);
    const trickle = createSpoutTrickle(random);
    group.add(trickle.mesh);
    updaters.push(trickle.update);
  }

  if (mode === 'rain') {
    const rain = createRainStreaks(random);
    group.add(rain.mesh);
    updaters.push(rain.update);
  }

  return {
    group,
    update(delta) {
      updaters.forEach((update) => update(delta));
    },
  };
}
