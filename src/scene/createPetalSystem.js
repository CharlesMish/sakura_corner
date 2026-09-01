import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';

const matrixHelper = new THREE.Object3D();
const hiddenScale = new THREE.Vector3(0, 0, 0);
const settledPositionHelper = new THREE.Vector3();
const flutterQuaternion = new THREE.Quaternion();
const petalColors = [
  new THREE.Color(ART_DIRECTION.palette.blossomHighlight),
  new THREE.Color(ART_DIRECTION.palette.blossomLight),
  new THREE.Color(ART_DIRECTION.palette.blossomWarm),
  new THREE.Color(ART_DIRECTION.palette.blossomMid),
];

// Seven authored flight personalities keep a release irregular without turning
// it into an evenly randomized spray. Interactive flowers share the passive
// geometry/integrator; only their starting data differs.
const INTERACTIVE_FLIGHT_PROFILES = [
  { scale: 1.14, vy: -0.26, vx: 0.02, vz: 0.04, windScale: 0.42, tilt: 0.4, drift: 0.028, frequency: 0.78, spin: [0.95, 0.62, 0.55], depth: 0.55 },
  { scale: 1.02, vy: -0.34, vx: 0.05, vz: -0.02, windScale: 0.7, tilt: 0.48, drift: 0.04, frequency: 1.05, spin: [1.12, 0.7, -0.8], depth: 0.12 },
  { scale: 0.94, vy: -0.4, vx: 0.08, vz: 0.06, windScale: 1.05, tilt: 0.55, drift: 0.062, frequency: 1.28, spin: [1.3, 0.8, 1.1], depth: -0.28 },
  { scale: 0.88, vy: -0.46, vx: 0.03, vz: 0.1, windScale: 1.28, tilt: 0.5, drift: 0.078, frequency: 1.5, spin: [1.48, 0.88, -1.2], depth: 0.72 },
  { scale: 1.08, vy: -0.3, vx: -0.02, vz: -0.05, windScale: 0.55, tilt: 0.44, drift: 0.033, frequency: 0.86, spin: [1.02, 0.66, 0.35], depth: -0.48 },
  { scale: 0.9, vy: -0.38, vx: 0.12, vz: 0.02, windScale: 1.55, tilt: 0.52, drift: 0.09, frequency: 1.4, spin: [1.22, 0.74, 0.95], depth: 0.2 },
  { scale: 0.96, vy: -0.36, vx: 0, vz: 0, windScale: 0.88, tilt: 0.46, drift: 0.05, frequency: 1.12, spin: [1.18, 0.72, -0.45], depth: -0.1 },
];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createPetalGeometry() {
  const shape = new THREE.Shape();
  const segments = 40;

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2 + Math.PI * 0.5;
    const radius = 0.73 + Math.cos(angle * 5) * 0.2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const radius = Math.hypot(positions.getX(index), positions.getY(index));
    positions.setZ(index, Math.max(0, 1 - radius) * 0.08);
  }
  positions.needsUpdate = true;
  geometry.scale(0.13, 0.13, 0.13);

  geometry.computeVertexNormals();
  return geometry;
}

function pickPetalColor(random) {
  return petalColors[Math.floor(random() * petalColors.length)];
}

function groundHeightAt(x, z) {
  const [treeX, , treeZ] = ART_DIRECTION.world.treePosition;
  const cutoutDistance = Math.hypot((x - treeX) / 1.02, (z - treeZ) / 0.76);
  if (cutoutDistance < 1) return 0.105;
  if (z < 3.08) return 0.005;
  if (z < 3.62) return -0.065;
  if (z < 3.98) return -0.37;
  return -0.5;
}

export function createPetalSystem() {
  const { petals, world } = ART_DIRECTION;
  const wetPetals = weatherIsWet() ? ART_DIRECTION.weather.petals : null;
  const gravity = wetPetals?.gravity ?? petals.gravity;
  const wind = wetPetals?.wind ?? petals.wind;
  const settledTilt = wetPetals?.settledTilt ?? 0.08;
  const random = seededRandom(9081);
  const interactiveRandom = seededRandom(petals.interactive.seed);
  const group = new THREE.Group();
  group.name = 'Passive and settled petals';

  const geometry = createPetalGeometry();
  const cameraPosition = ART_DIRECTION.camera.useFrameCompletionVariant
    ? ART_DIRECTION.camera.frameCompletionPosition
    : ART_DIRECTION.camera.desktopPosition;
  const canopyCenter = new THREE.Vector3(
    world.treePosition[0],
    5.4,
    world.treePosition[2],
  );
  const fallingFacingQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(...cameraPosition).sub(canopyCenter).normalize(),
  );
  const fallingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0,
    side: THREE.DoubleSide,
    flatShading: true,
    vertexColors: true,
    emissive: 0xac5570,
    emissiveIntensity: petals.rosyFill,
  });
  const settledMaterial = fallingMaterial.clone();
  settledMaterial.roughness = wetPetals?.settledRoughness ?? 0.92;
  settledMaterial.emissiveIntensity = petals.rosyFill * (weatherIsWet() ? 0.32 : 0.45);

  const fallingMesh = new THREE.InstancedMesh(
    geometry,
    fallingMaterial,
    petals.maximumFalling,
  );
  fallingMesh.name = 'Falling petal pool';
  fallingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  fallingMesh.frustumCulled = false;

  const settledMesh = new THREE.InstancedMesh(
    geometry,
    settledMaterial,
    petals.maximumSettled,
  );
  settledMesh.name = 'Bounded settled petal memory';
  settledMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  settledMesh.frustumCulled = false;
  settledMesh.receiveShadow = true;

  const particles = Array.from({ length: petals.maximumFalling }, () => ({
    active: false,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    spin: new THREE.Vector3(),
    phase: 0,
    secondaryPhase: 0,
    driftFrequency: 1,
    driftAmplitude: 0.05,
    windScale: 1,
    scale: 1,
    age: 0,
    tiltAmplitude: 0.6,
    source: 'passive',
    profileIndex: -1,
  }));

  function hideInstance(mesh, index) {
    matrixHelper.position.set(0, -10, 0);
    matrixHelper.rotation.set(0, 0, 0);
    matrixHelper.scale.copy(hiddenScale);
    matrixHelper.updateMatrix();
    mesh.setMatrixAt(index, matrixHelper.matrix);
  }

  particles.forEach((particle, index) => {
    hideInstance(fallingMesh, index);
    fallingMesh.setColorAt(index, pickPetalColor(random));
  });
  fallingMesh.instanceMatrix.needsUpdate = true;
  fallingMesh.instanceColor.needsUpdate = true;

  let settledCursor = 0;

  function placeSettled(index, position, angle, scale, color, rng = random) {
    matrixHelper.position.copy(position);
    matrixHelper.rotation.set(-Math.PI / 2 + (rng() - 0.5) * settledTilt, 0, angle);
    const blossomScale = scale * petals.blossomScale;
    matrixHelper.scale.set(
      blossomScale,
      blossomScale * THREE.MathUtils.lerp(0.84, 1, rng()),
      blossomScale,
    );
    matrixHelper.updateMatrix();
    settledMesh.setMatrixAt(index, matrixHelper.matrix);
    settledMesh.setColorAt(index, color);
  }

  for (let index = 0; index < petals.maximumSettled; index += 1) {
    hideInstance(settledMesh, index);
    settledMesh.setColorAt(index, pickPetalColor(random));
  }

  for (let index = 0; index < petals.initialSettled; index += 1) {
    if (index < 14) {
      const angle = random() * Math.PI * 2;
      const radius = 0.24 + Math.sqrt(random()) * 1.08;
      settledPositionHelper.set(
        world.treePosition[0] + Math.cos(angle) * radius * 1.08,
        0,
        world.treePosition[2] + Math.sin(angle) * radius * 0.72,
      );
    } else if (index < 22) {
      const progress = (index - 14) / 7;
      settledPositionHelper.set(
        world.treePosition[0] + 0.15 + progress * 3.25 + (random() - 0.5) * 0.52,
        0,
        world.treePosition[2] + 0.45 + random() * 1.62,
      );
    } else if (index < 27) {
      settledPositionHelper.set(
        world.treePosition[0] - 1.1 + random() * 5.25,
        0,
        index % 2 === 0
          ? 3.18 + (random() - 0.5) * 0.09
          : 3.72 + (random() - 0.5) * 0.08,
      );
    } else if (index < 31) {
      settledPositionHelper.set(
        2.12 + random() * 3.15,
        0,
        -1.37 + random() * 0.28,
      );
    } else {
      const catchPoints = [
        [-4.82, -1.79],
        [-2.83, 2.46],
        [-0.26, -1.96],
      ];
      const catchPoint = catchPoints[index - 31];
      settledPositionHelper.set(
        catchPoint[0] + (random() - 0.5) * 0.24,
        0,
        catchPoint[1] + (random() - 0.5) * 0.16,
      );
    }
    settledPositionHelper.y = groundHeightAt(
      settledPositionHelper.x,
      settledPositionHelper.z,
    );
    placeSettled(
      index,
      settledPositionHelper,
      random() * Math.PI * 2,
      THREE.MathUtils.lerp(0.62, 1.08, random()),
      pickPetalColor(random),
    );
  }
  settledCursor = petals.initialSettled;
  settledMesh.instanceMatrix.needsUpdate = true;
  settledMesh.instanceColor.needsUpdate = true;

  const canopyAnchors = [
    [-2.3, 5.92, 0.1],
    [-0.82, 6.55, -0.1],
    [0.28, 6.7, -0.14],
    [1.45, 5.82, 0.02],
    [2.55, 5.05, 0.04],
    [-0.35, 5.38, 0.82],
    [-1.62, 6.08, -0.62],
    [1.18, 5.68, -0.52],
  ];

  const interactive = petals.interactive;
  const worldAnchors = canopyAnchors.map((anchor) => new THREE.Vector3(
    world.treePosition[0] + anchor[0],
    world.treePosition[1] + anchor[1],
    world.treePosition[2] + anchor[2],
  ));
  const anchorRank = new Uint8Array(worldAnchors.length);
  const profileOrder = new Uint8Array(INTERACTIVE_FLIGHT_PROFILES.length);
  const interactionPoint = new THREE.Vector3();
  const interactionDirection = new THREE.Vector3();
  const clusterCenter = new THREE.Vector3();
  const nearestAnchorPoint = new THREE.Vector3();
  const landingTargets = [
    new THREE.Vector2(world.treePosition[0], world.treePosition[2]),
    new THREE.Vector2(-3.35, 0.32),
    new THREE.Vector2(-1.05, 2.03),
    new THREE.Vector2(-4.82, -1.79),
    new THREE.Vector2(-2.83, 2.46),
    new THREE.Vector2(-0.26, -1.96),
    new THREE.Vector2(world.treePosition[0] + 1.4, 3.18),
  ];
  const releaseQueue = Array.from({ length: interactive.maximumQueued }, () => ({
    active: false,
    remaining: 0,
    waitTime: 0,
    ox: 0,
    oy: 0,
    oz: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    scale: 1,
    windScale: 1,
    tiltAmplitude: 0.5,
    driftAmplitude: 0.05,
    driftFrequency: 1,
    spinX: 1,
    spinY: 0.7,
    spinZ: 0,
    phase: 0,
    secondaryPhase: 0,
    profileIndex: 0,
  }));
  const lastReleaseResult = {
    accepted: false,
    reason: 'disabled',
    planned: 0,
    queued: 0,
    liveInteractive: 0,
    tokens: interactive.tokenBudget,
    strength: 1,
    clamped: false,
  };
  const stats = {
    fallingActive: 0,
    fallingPassive: 0,
    fallingInteractive: 0,
    queued: 0,
    tokens: interactive.tokenBudget,
    settledCursor,
    dynamicSettledOccupancy: 0,
    dropped: 0,
    lastElapsed: 0,
    lastAcceptElapsed: -1,
    lastResult: lastReleaseResult,
  };

  let fallingPassiveCount = 0;
  let fallingInteractiveCount = 0;
  let queuedLiveCount = 0;
  let droppedReleases = 0;
  let interactionTokens = interactive.tokenBudget;
  let lastElapsed = 0;
  let lastAcceptElapsed = -Infinity;
  let burstIndex = 0;

  function writeVector(target, value, fallback) {
    if (value == null) target.copy(fallback);
    else if (typeof value.x === 'number') target.set(value.x, value.y, value.z);
    else target.set(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0);
    return target;
  }

  function clampOrigin(point) {
    const bounds = interactive.originBounds;
    point.x = THREE.MathUtils.clamp(point.x, bounds.x[0], bounds.x[1]);
    point.y = THREE.MathUtils.clamp(point.y, bounds.y[0], bounds.y[1]);
    point.z = THREE.MathUtils.clamp(point.z, bounds.z[0], bounds.z[1]);
  }

  function rankAnchors(point) {
    for (let index = 0; index < anchorRank.length; index += 1) anchorRank[index] = index;
    for (let index = 1; index < anchorRank.length; index += 1) {
      const candidate = anchorRank[index];
      const distance = worldAnchors[candidate].distanceToSquared(point);
      let cursor = index - 1;
      while (
        cursor >= 0 &&
        worldAnchors[anchorRank[cursor]].distanceToSquared(point) > distance
      ) {
        anchorRank[cursor + 1] = anchorRank[cursor];
        cursor -= 1;
      }
      anchorRank[cursor + 1] = candidate;
    }
  }

  function prepareClusterCenter(worldPoint) {
    writeVector(interactionPoint, worldPoint, worldAnchors[2]);
    rankAnchors(interactionPoint);
    const nearestDistance = worldAnchors[anchorRank[0]].distanceTo(interactionPoint);
    const insideShop =
      interactionPoint.x > 1.05 &&
      interactionPoint.z < -1.4 &&
      interactionPoint.y < 5.2;
    const clamped = insideShop || nearestDistance > 3.8;
    if (clamped) interactionPoint.copy(worldAnchors[anchorRank[0]]);

    const roll = interactiveRandom();
    const rank = roll < 0.5 ? 0 : roll < 0.82 ? 1 : 2;
    nearestAnchorPoint.copy(worldAnchors[anchorRank[rank]]);
    clusterCenter.lerpVectors(
      interactionPoint,
      nearestAnchorPoint,
      THREE.MathUtils.lerp(0.18, 0.52, interactiveRandom()),
    );
    clusterCenter.x += (interactiveRandom() - 0.5) * interactive.originJitter[0] * 2;
    clusterCenter.y += (interactiveRandom() - 0.5) * interactive.originJitter[1] * 2;
    clusterCenter.z += (interactiveRandom() - 0.5) * interactive.originJitter[2] * 2;
    clampOrigin(clusterCenter);
    return clamped;
  }

  function shuffleProfiles() {
    for (let index = 0; index < profileOrder.length; index += 1) profileOrder[index] = index;
    for (let index = profileOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(interactiveRandom() * (index + 1));
      const current = profileOrder[index];
      profileOrder[index] = profileOrder[swapIndex];
      profileOrder[swapIndex] = current;
    }
  }

  function takeQueueSlot() {
    return releaseQueue.find((entry) => !entry.active);
  }

  const defaultInteractionDirection = new THREE.Vector3(...petals.wind);

  function writeDirection(value) {
    writeVector(interactionDirection, value, defaultInteractionDirection);
    if (interactionDirection.lengthSq() < 1e-6) {
      interactionDirection.copy(defaultInteractionDirection);
    }
    interactionDirection.normalize();
  }

  function planClusterPeel(worldPoint, count, strength, direction) {
    const clamped = prepareClusterCenter(worldPoint);
    writeDirection(direction);
    shuffleProfiles();

    let planned = 0;
    for (let index = 0; index < count; index += 1) {
      const slot = takeQueueSlot();
      if (!slot) break;
      const profileIndex = profileOrder[index];
      const profile = INTERACTIVE_FLIGHT_PROFILES[profileIndex];
      const radialRoll = interactiveRandom();
      const radius = interactive.clusterRadius * Math.sqrt(radialRoll);
      const angle = interactiveRandom() * Math.PI * 2;

      slot.active = true;
      slot.remaining = interactive.clusterBeats[index] + interactiveRandom() * 0.025;
      slot.waitTime = 0;
      slot.ox = clusterCenter.x + Math.cos(angle) * radius;
      slot.oy = clusterCenter.y + (interactiveRandom() - 0.5) * interactive.clusterRadius * 0.35;
      slot.oz = clusterCenter.z + Math.sin(angle) * radius + profile.depth;
      slot.ox = THREE.MathUtils.clamp(slot.ox, interactive.originBounds.x[0], interactive.originBounds.x[1]);
      slot.oy = THREE.MathUtils.clamp(slot.oy, interactive.originBounds.y[0], interactive.originBounds.y[1]);
      slot.oz = THREE.MathUtils.clamp(slot.oz, interactive.originBounds.z[0], interactive.originBounds.z[1]);
      const directionalImpulse = interactive.directionImpulse * strength;
      slot.vx =
        profile.vx +
        interactionDirection.x * directionalImpulse +
        interactive.peelImpulse[0] * strength;
      slot.vy =
        profile.vy +
        interactionDirection.y * directionalImpulse * 0.25 +
        interactive.peelImpulse[1] * strength;
      slot.vz =
        profile.vz +
        interactionDirection.z * directionalImpulse +
        interactive.peelImpulse[2] * strength;
      slot.scale = profile.scale;
      slot.windScale = THREE.MathUtils.clamp(profile.windScale * strength, 0.25, 2.05);
      slot.tiltAmplitude = profile.tilt;
      slot.driftAmplitude = profile.drift;
      slot.driftFrequency = profile.frequency;
      slot.spinX = profile.spin[0];
      slot.spinY = profile.spin[1];
      slot.spinZ = profile.spin[2];
      slot.phase = interactiveRandom() * Math.PI * 2;
      slot.secondaryPhase = interactiveRandom() * Math.PI * 2;
      slot.profileIndex = profileIndex;
      queuedLiveCount += 1;
      planned += 1;
    }
    return { planned, clamped };
  }

  function releaseInteractive(worldPoint, options = {}) {
    lastReleaseResult.accepted = false;
    lastReleaseResult.reason = 'disabled';
    lastReleaseResult.planned = 0;
    lastReleaseResult.queued = queuedLiveCount;
    lastReleaseResult.liveInteractive = fallingInteractiveCount;
    lastReleaseResult.tokens = interactionTokens;
    lastReleaseResult.strength = 1;
    lastReleaseResult.clamped = false;
    if (!interactive.enabled) return lastReleaseResult;

    const gap = lastElapsed - lastAcceptElapsed;
    if (!Number.isFinite(lastAcceptElapsed) || gap >= interactive.cooldown) burstIndex = 0;
    const baseCount = options.count == null
      ? interactive.count[0] + Math.floor(interactiveRandom() * (interactive.count[1] - interactive.count[0] + 1))
      : THREE.MathUtils.clamp(Math.floor(options.count), 1, INTERACTIVE_FLIGHT_PROFILES.length);
    const diminish = interactive.diminish[Math.min(burstIndex, interactive.diminish.length - 1)];
    const requested = Math.floor(baseCount * diminish);
    const freeQueue = interactive.maximumQueued - queuedLiveCount;
    const wanted = Math.min(requested, Math.floor(interactionTokens), freeQueue);

    if (wanted <= 0) {
      lastReleaseResult.reason = interactionTokens < 1 || freeQueue <= 0
        ? 'saturated'
        : 'diminished';
      return lastReleaseResult;
    }

    const strength = THREE.MathUtils.clamp(options.strength ?? 1, 0.35, 1.35);
    const result = planClusterPeel(worldPoint, wanted, strength, options.direction);
    interactionTokens -= result.planned;
    lastAcceptElapsed = lastElapsed;
    burstIndex += 1;
    lastReleaseResult.accepted = result.planned > 0;
    lastReleaseResult.reason = diminish < 1 ? 'diminished' : 'released';
    lastReleaseResult.planned = result.planned;
    lastReleaseResult.queued = queuedLiveCount;
    lastReleaseResult.liveInteractive = fallingInteractiveCount;
    lastReleaseResult.tokens = interactionTokens;
    lastReleaseResult.strength = strength;
    lastReleaseResult.clamped = result.clamped;
    return lastReleaseResult;
  }

  function spawnPetal() {
    const index = particles.findIndex((particle) => !particle.active);
    if (index === -1) return;

    const particle = particles[index];
    const anchor = canopyAnchors[Math.floor(random() * canopyAnchors.length)];
    const longTraveler = random() < petals.longDriftChance;
    const intoWind = !longTraveler && random() < 0.12;
    particle.active = true;
    particle.source = 'passive';
    particle.profileIndex = -1;
    fallingPassiveCount += 1;
    particle.position.set(
      world.treePosition[0] + anchor[0] + (random() - 0.5) * 0.72,
      world.treePosition[1] + anchor[1] + (random() - 0.5) * 0.4,
      world.treePosition[2] + anchor[2] + (random() - 0.5) * 0.55,
    );
    particle.velocity.set(
      longTraveler
        ? THREE.MathUtils.lerp(0.08, 0.18, random())
        : intoWind
          ? -THREE.MathUtils.lerp(0.04, 0.12, random())
          : THREE.MathUtils.lerp(-0.025, 0.065, random()),
      -THREE.MathUtils.lerp(longTraveler ? 0.23 : 0.32, longTraveler ? 0.34 : 0.5, random()),
      THREE.MathUtils.lerp(longTraveler ? -0.12 : -0.045, longTraveler ? 0.13 : 0.065, random()),
    );
    particle.age = 0;
    particle.rotation.set(0, 0, random() * Math.PI * 2);
    particle.spin.set(
      THREE.MathUtils.lerp(0.9, 1.55, random()),
      THREE.MathUtils.lerp(0.58, 0.92, random()),
      THREE.MathUtils.lerp(-1.35, 1.35, random()),
    );
    particle.phase = random() * Math.PI * 2;
    particle.secondaryPhase = random() * Math.PI * 2;
    particle.driftFrequency = THREE.MathUtils.lerp(0.72, 1.62, random());
    particle.driftAmplitude = THREE.MathUtils.lerp(
      longTraveler ? 0.075 : 0.028,
      longTraveler ? 0.14 : 0.082,
      random(),
    );
    particle.windScale = longTraveler
      ? THREE.MathUtils.lerp(1.45, 2.05, random())
      : intoWind
        ? THREE.MathUtils.lerp(0.25, 0.55, random())
        : THREE.MathUtils.lerp(0.55, 1.18, random());
    particle.scale = THREE.MathUtils.lerp(0.72, 1.18, random());
    particle.tiltAmplitude = THREE.MathUtils.lerp(
      petals.tumbleTilt * 0.58,
      petals.tumbleTilt,
      random(),
    );
    fallingMesh.setColorAt(index, pickPetalColor(random));
    fallingMesh.instanceColor.needsUpdate = true;
  }

  function takeInteractiveParticleSlot() {
    if (fallingInteractiveCount >= interactive.maximumLive) return -1;
    const inactive =
      petals.maximumFalling - fallingPassiveCount - fallingInteractiveCount;
    if (inactive <= interactive.passiveReserve) return -1;
    return particles.findIndex((particle) => !particle.active);
  }

  function spawnInteractiveFromQueue(slot) {
    const index = takeInteractiveParticleSlot();
    if (index < 0) return false;
    const particle = particles[index];
    particle.active = true;
    particle.source = 'interactive';
    particle.profileIndex = slot.profileIndex;
    particle.position.set(slot.ox, slot.oy, slot.oz);
    particle.velocity.set(slot.vx, slot.vy, slot.vz);
    particle.rotation.set(0, 0, interactiveRandom() * Math.PI * 2);
    particle.spin.set(slot.spinX, slot.spinY, slot.spinZ);
    particle.phase = slot.phase;
    particle.secondaryPhase = slot.secondaryPhase;
    particle.driftFrequency = slot.driftFrequency;
    particle.driftAmplitude = slot.driftAmplitude;
    particle.windScale = slot.windScale;
    particle.scale = slot.scale;
    particle.age = 0;
    particle.tiltAmplitude = slot.tiltAmplitude;
    fallingMesh.setColorAt(index, pickPetalColor(interactiveRandom));
    fallingMesh.instanceColor.needsUpdate = true;
    fallingInteractiveCount += 1;
    return true;
  }

  function updateInteractiveQueue(delta) {
    releaseQueue.forEach((slot) => {
      if (!slot.active) return;
      slot.remaining -= delta;
      if (slot.remaining > 0) return;
      if (spawnInteractiveFromQueue(slot)) {
        slot.active = false;
        queuedLiveCount -= 1;
        return;
      }
      slot.waitTime += delta;
      if (slot.waitTime < interactive.queueGiveUp) return;
      slot.active = false;
      queuedLiveCount -= 1;
      droppedReleases += 1;
    });
  }

  function removeFallingParticle(particle, index) {
    if (particle.source === 'interactive') fallingInteractiveCount -= 1;
    else fallingPassiveCount -= 1;
    particle.active = false;
    hideInstance(fallingMesh, index);
  }

  function attractInteractiveLanding(position) {
    const [treeX, , treeZ] = world.treePosition;
    const inTreeCutout =
      Math.hypot((position.x - treeX) / 1.02, (position.z - treeZ) / 0.76) < 1;
    if (inTreeCutout || (position.z >= 3.05 && position.z <= 3.9)) return;
    if (
      position.x >= 2 &&
      position.z <= -1.15 &&
      position.z >= -1.7
    ) {
      position.x = 3.55 + (interactiveRandom() - 0.5) * 0.4;
      position.z = -0.9;
      return;
    }
    if (interactiveRandom() > interactive.attractorChance) return;

    let nearest = landingTargets[0];
    let nearestDistance = Infinity;
    landingTargets.forEach((target) => {
      const distance =
        (target.x - position.x) ** 2 +
        (target.y - position.z) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = target;
      }
    });
    position.x = THREE.MathUtils.lerp(position.x, nearest.x, 0.62);
    position.z = THREE.MathUtils.lerp(position.z, nearest.y, 0.62);
  }

  function settleParticle(particle, index) {
    const dynamicSettledCapacity =
      petals.maximumSettled - petals.initialSettled;
    const settledIndex = petals.initialSettled +
      ((settledCursor - petals.initialSettled) % dynamicSettledCapacity);
    settledPositionHelper.set(
      particle.position.x,
      0,
      particle.position.z,
    );
    const rng = particle.source === 'interactive' ? interactiveRandom : random;
    if (particle.source === 'interactive') {
      attractInteractiveLanding(settledPositionHelper);
    }
    settledPositionHelper.y = groundHeightAt(
      settledPositionHelper.x,
      settledPositionHelper.z,
    );
    const settledColor = pickPetalColor(rng);
    placeSettled(
      settledIndex,
      settledPositionHelper,
      particle.rotation.z,
      particle.scale,
      settledColor,
      rng,
    );
    settledCursor += 1;
    settledMesh.instanceMatrix.needsUpdate = true;
    settledMesh.instanceColor.needsUpdate = true;
    removeFallingParticle(particle, index);
  }

  let timeUntilSpawn = 0.8;

  function update(delta, elapsed) {
    lastElapsed = elapsed;
    interactionTokens = Math.min(
      interactive.tokenBudget,
      interactionTokens +
        (interactive.tokenBudget / interactive.tokenRefillSeconds) * delta,
    );
    updateInteractiveQueue(delta);

    timeUntilSpawn -= delta;
    if (timeUntilSpawn <= 0) {
      spawnPetal();
      timeUntilSpawn = THREE.MathUtils.lerp(
        petals.passiveInterval[0],
        petals.passiveInterval[1],
        random(),
      );
      if (random() < 0.18) timeUntilSpawn += THREE.MathUtils.lerp(0.8, 2.3, random());
    }

    const gust =
      0.82 +
      Math.sin(elapsed * 0.17) * 0.12 +
      Math.sin(elapsed * 0.41 + 1.3) * 0.06;

    particles.forEach((particle, index) => {
      if (!particle.active) return;

      particle.velocity.y -= gravity * delta;
      const flutter = Math.sin(
        elapsed * particle.driftFrequency + particle.phase,
      );
      const crossFlutter = Math.sin(
        elapsed * particle.driftFrequency * 0.61 + particle.secondaryPhase,
      );
      particle.age += delta;
      particle.position.x +=
        (particle.velocity.x +
          wind[0] * particle.windScale * gust +
          flutter * particle.driftAmplitude) * delta;
      particle.position.y +=
        (particle.velocity.y + Math.abs(crossFlutter) * 0.012) * delta;
      particle.position.z +=
        (particle.velocity.z +
          wind[2] * particle.windScale * gust +
          crossFlutter * particle.driftAmplitude * 0.68) * delta;
      particle.rotation.x =
        Math.sin(particle.age * particle.spin.x + particle.phase) *
        particle.tiltAmplitude;
      particle.rotation.y =
        Math.cos(
          particle.age * particle.spin.x * particle.spin.y +
          particle.secondaryPhase,
        ) *
        particle.tiltAmplitude * 0.72;
      particle.rotation.z += (particle.spin.z + flutter * 0.24) * delta;

      if (
        particle.source === 'interactive' &&
        (
          particle.position.x < -8 ||
          particle.position.x > 9 ||
          particle.position.z < -3.5 ||
          particle.position.z > 6
        )
      ) {
        removeFallingParticle(particle, index);
        return;
      }

      if (
        particle.position.y <=
        groundHeightAt(particle.position.x, particle.position.z)
      ) {
        settleParticle(particle, index);
        return;
      }

      matrixHelper.position.copy(particle.position);
      flutterQuaternion.setFromEuler(particle.rotation);
      matrixHelper.quaternion
        .copy(fallingFacingQuaternion)
        .multiply(flutterQuaternion);
      matrixHelper.scale.setScalar(particle.scale * petals.blossomScale);
      matrixHelper.updateMatrix();
      fallingMesh.setMatrixAt(index, matrixHelper.matrix);
    });

    fallingMesh.instanceMatrix.needsUpdate = true;
  }

  function getStats() {
    stats.fallingActive = fallingPassiveCount + fallingInteractiveCount;
    stats.fallingPassive = fallingPassiveCount;
    stats.fallingInteractive = fallingInteractiveCount;
    stats.queued = queuedLiveCount;
    stats.tokens = interactionTokens;
    stats.settledCursor = settledCursor;
    stats.dynamicSettledOccupancy = Math.min(
      Math.max(settledCursor - petals.initialSettled, 0),
      petals.maximumSettled - petals.initialSettled,
    );
    stats.dropped = droppedReleases;
    stats.lastElapsed = lastElapsed;
    stats.lastAcceptElapsed = Number.isFinite(lastAcceptElapsed)
      ? lastAcceptElapsed
      : -1;
    return stats;
  }

  group.add(settledMesh, fallingMesh);
  return { group, update, releaseInteractive, getStats };
}
