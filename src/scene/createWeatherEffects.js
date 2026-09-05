import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { getRainStyle, getWeatherMode, hasLiquidWater } from '../weatherMode.js';

const matrixHelper = new THREE.Object3D();
const rainColor = new THREE.Color();

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

function createRainStreaks(random, camera) {
  const spec = ART_DIRECTION.weather.rain[getRainStyle()] ?? ART_DIRECTION.weather.rain.dash;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const accentSpec = ART_DIRECTION.weather.rainAccents;
  const accentCount = Math.max(1, Math.round(spec.count * accentSpec.fraction));
  const surface = new THREE.MeshBasicMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, surface, spec.count - accentCount);
  const profile = [[0, -0.5], [0.32, -0.42], [0.5, -0.23], [0.46, -0.02], [0.26, 0.22], [0, 0.5]];
  const accents = new THREE.InstancedMesh(
    new THREE.LatheGeometry(profile.map(([radius, y]) => new THREE.Vector2(radius, y)), 8),
    surface,
    accentCount,
  );
  accents.name = 'Sparse tapered raindrops';
  accents.frustumCulled = false;
  accents.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
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
    const isAccent = index < accentCount;
    const target = isAccent ? accents : mesh;
    const targetIndex = isAccent ? index : index - accentCount;
    const specDepth = ART_DIRECTION.weather.rainDepth;
    const position = camera?.position;
    const fallback = ART_DIRECTION.camera.useFrameCompletionVariant
      ? ART_DIRECTION.camera.frameCompletionPosition : ART_DIRECTION.camera.desktopPosition;
    const distance = Math.hypot(drop.x - (position?.x ?? fallback[0]), drop.y - (position?.y ?? fallback[1]), drop.z - (position?.z ?? fallback[2]));
    const depth = 1 - THREE.MathUtils.smoothstep(distance, specDepth.nearDistance, specDepth.farDistance);
    const scale = THREE.MathUtils.lerp(specDepth.farScale, specDepth.nearScale, depth);
    matrixHelper.position.set(drop.x, drop.y, drop.z);
    matrixHelper.rotation.set(0, 0, tilt);
    const width = isAccent ? THREE.MathUtils.lerp(...accentSpec.width, (index % 3) / 2) : drop.width;
    const length = isAccent ? THREE.MathUtils.lerp(...accentSpec.length, (index % 4) / 3) : drop.length;
    matrixHelper.scale.set(width * scale, length * scale, width * scale);
    matrixHelper.updateMatrix();
    target.setMatrixAt(targetIndex, matrixHelper.matrix);
    target.setColorAt(targetIndex, rainColor.setScalar(THREE.MathUtils.lerp(specDepth.farBrightness, 1, depth)));
  }

  drops.forEach(place);
  mesh.instanceMatrix.needsUpdate = true;
  accents.instanceMatrix.needsUpdate = true;

  function update(delta, wind = 1) {
    drops.forEach((drop, index) => {
      drop.y -= drop.speed * delta;
      drop.x += spec.drift[0] * delta * wind;
      drop.z += spec.drift[2] * delta * wind;
      if (drop.y < spec.groundY) resetDrop(drop, spec, random);
      place(drop, index);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    accents.instanceMatrix.needsUpdate = true;
    accents.instanceColor.needsUpdate = true;
  }

  return { mesh, accents, update };
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

export function createRainSplashes(random = Math.random) {
  const spec = ART_DIRECTION.weather.splashes;
  const mesh = new THREE.InstancedMesh(
    new THREE.RingGeometry(0.65, 1, 6),
    new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: spec.opacity, depthWrite: false, side: THREE.DoubleSide }),
    spec.count,
  );
  mesh.name = 'Pooled pavement rain contacts';
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const drops = Array.from({ length: spec.count }, () => ({ age: spec.lifetime, x: 0, z: 0 }));
  let next = 0;
  let untilSpawn = spec.interval;
  function update(delta) {
    untilSpawn -= delta;
    if (untilSpawn <= 0) {
      untilSpawn = spec.interval * (0.7 + random() * 0.6);
      const drop = drops[next];
      next = (next + 1) % drops.length;
      // Exposed strip beyond the crown and in front of the shop awning.
      drop.x = 2.7 + random() * 3.5;
      drop.z = 0.35 + random() * 2.5;
      drop.age = 0;
    }
    drops.forEach((drop, index) => {
      drop.age = Math.min(spec.lifetime, drop.age + delta);
      const t = drop.age / spec.lifetime;
      const size = t < 1 ? spec.radius * (0.35 + t * 0.65) : 0;
      matrixHelper.position.set(drop.x, 0.045, drop.z);
      matrixHelper.rotation.set(-Math.PI / 2, 0, 0);
      matrixHelper.scale.set(size, size, size);
      matrixHelper.updateMatrix();
      mesh.setMatrixAt(index, matrixHelper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { mesh, update };
}

export function createWeatherEffects({ camera } = {}) {
  const group = new THREE.Group();
  group.name = 'Weather study effects';
  const random = () => Math.random();
  const mode = getWeatherMode();
  const updaters = [];

  if (hasLiquidWater()) {
    const drips = createDrips(random);
    group.add(drips.mesh);
    updaters.push(drips.update);
    const trickle = createSpoutTrickle(random);
    group.add(trickle.mesh);
    updaters.push(trickle.update);
  }

  if (mode === 'rain') {
    const rain = createRainStreaks(random, camera);
    group.add(rain.mesh, rain.accents);
    updaters.push(rain.update);
    const splashes = createRainSplashes(random);
    group.add(splashes.mesh);
    updaters.push(splashes.update);
  }

  return {
    group,
    update(delta, wind = 1) {
      updaters.forEach((update) => update(delta, wind));
    },
  };
}
