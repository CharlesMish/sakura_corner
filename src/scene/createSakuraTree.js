import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';
import { branchBetween, material } from './primitives.js';
import { applyWetMaterial } from './wetSurfaces.js';

const { palette } = ART_DIRECTION;
const knotGeometry = new THREE.IcosahedronGeometry(1, 1);
const matrixHelper = new THREE.Object3D();
const detailNormal = new THREE.Vector3(0, 0, 1);

function createReadableBlossomGeometry() {
  const shape = new THREE.Shape();
  const segments = 40;

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2 + Math.PI * 0.5;
    // Five broad lobes read as a blossom after the low-resolution render compresses them.
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
  geometry.computeVertexNormals();
  return geometry;
}

const readableBlossomGeometry = createReadableBlossomGeometry();

function createBlossomClusterGeometry(pattern) {
  const transform = new THREE.Object3D();
  const pieces = pattern.map(([position, scale, roll, tiltX, tiltY]) => {
    const blossom = readableBlossomGeometry.clone();
    transform.position.set(...position);
    transform.rotation.set(tiltX, tiltY, roll);
    transform.scale.setScalar(scale);
    transform.updateMatrix();
    blossom.applyMatrix4(transform.matrix);
    return blossom;
  });
  const geometry = mergeGeometries(pieces, false);
  pieces.forEach((piece) => piece.dispose());
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

const blossomClusterGeometries = {
  compact: createBlossomClusterGeometry([
    [[-0.34, 0.04, 0.02], 0.31, -0.25, 0.1, 0],
    [[0, 0.1, 0.11], 0.42, 0.18, -0.08, 0.12],
    [[0.36, 0.06, -0.03], 0.3, 0.45, 0.14, -0.1],
    [[-0.18, 0.38, -0.08], 0.29, -0.5, 0.06, 0.12],
    [[0.15, -0.32, 0.06], 0.28, 0.65, -0.1, -0.08],
    [[-0.43, -0.24, -0.1], 0.23, 0.1, 0.08, 0.1],
  ]),
  airy: createBlossomClusterGeometry([
    [[-0.55, 0.08, 0], 0.27, -0.35, 0.08, 0.12],
    [[-0.15, 0.34, 0.1], 0.36, 0.2, -0.12, -0.08],
    [[0.36, 0.26, -0.05], 0.29, 0.55, 0.1, 0.06],
    [[0.55, -0.18, 0.08], 0.24, -0.15, -0.08, 0.1],
    [[-0.2, -0.42, -0.06], 0.25, 0.7, 0.12, -0.12],
  ]),
  trailing: createBlossomClusterGeometry([
    [[0, 0.3, 0.06], 0.34, -0.2, 0.08, 0.08],
    [[-0.18, 0, 0.1], 0.3, 0.32, -0.1, -0.06],
    [[0.12, -0.34, 0], 0.27, -0.48, 0.1, 0.1],
    [[-0.08, -0.68, 0.08], 0.23, 0.6, -0.08, -0.1],
    [[0.1, -1.02, -0.03], 0.19, -0.15, 0.12, 0.05],
  ]),
};

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function subtractOrigin(point, origin) {
  return [point[0] - origin[0], point[1] - origin[1], point[2] - origin[2]];
}

function createLimb(name, points, radii, surface, origin = [0, 0, 0]) {
  const limb = new THREE.Group();
  limb.name = name;

  for (let index = 0; index < points.length - 1; index += 1) {
    limb.add(
      branchBetween(
        `${name} segment ${index + 1}`,
        subtractOrigin(points[index], origin),
        subtractOrigin(points[index + 1], origin),
        radii[index],
        radii[index + 1],
        surface,
        index < 2 ? 8 : 7,
      ),
    );

    if (index > 0 && radii[index] > 0.075) {
      const knot = new THREE.Mesh(knotGeometry, surface);
      knot.name = `${name} joint ${index}`;
      knot.position.set(...subtractOrigin(points[index], origin));
      knot.scale.set(radii[index] * 1.08, radii[index] * 1.25, radii[index]);
      knot.rotation.set(index * 0.4, index * 0.7, index * 0.23);
      knot.castShadow = true;
      knot.receiveShadow = true;
      limb.add(knot);
    }
  }

  return limb;
}

function chooseTone(position, worldPivot, scatter, random, lightBias = 0) {
  const absoluteX = worldPivot[0] + position.x;
  const absoluteY = worldPivot[1] + position.y;
  const absoluteZ = worldPivot[2] + position.z;
  const edgeExposure = Math.min(
    1,
    Math.hypot(scatter[0] * 2, scatter[1] * 2, scatter[2] * 2) * 0.9,
  );
  const heightLight = THREE.MathUtils.clamp((absoluteY - 4.9) / 2.35, 0, 1);
  const sunwardLight = THREE.MathUtils.clamp((-absoluteX + 3.1) / 6.4, 0, 1);
  const frontLight = THREE.MathUtils.clamp((absoluteZ + 0.7) / 2.2, 0, 1);
  const jitter = (random() - 0.5) * 0.13;
  const lightScore =
    heightLight * 0.43 +
    sunwardLight * 0.27 +
    frontLight * 0.08 +
    edgeExposure * 0.22 +
    jitter +
    lightBias;

  if (edgeExposure < 0.24 && lightScore < 0.56) return 'deep';
  if (lightScore > 0.72) return 'highlight';
  if (lightScore > 0.54) return 'light';
  if (lightScore > 0.38) return random() > 0.58 ? 'warm' : 'mid';
  if (lightScore > 0.2) return 'shade';
  return 'deep';
}

function createCanopyZone(definition, blossomSurfaces) {
  const random = seededRandom(definition.seed);
  const zone = new THREE.Group();
  zone.name = `${definition.name} blossom spray zone`;
  zone.position.set(...definition.pivot);

  const tones = ['highlight', 'light', 'warm', 'mid', 'shade', 'deep'];
  const instances = Object.fromEntries(
    Object.keys(blossomClusterGeometries).map((variant) => [
      variant,
      Object.fromEntries(tones.map((tone) => [tone, []])),
    ]),
  );
  const cameraPosition = ART_DIRECTION.camera.useFrameCompletionVariant
    ? ART_DIRECTION.camera.frameCompletionPosition
    : ART_DIRECTION.camera.desktopPosition;
  const cameraTreeLocal = new THREE.Vector3(...cameraPosition).sub(
    new THREE.Vector3(...ART_DIRECTION.world.treePosition),
  );
  const cameraZoneLocal = cameraTreeLocal.sub(
    new THREE.Vector3(...definition.worldPivot),
  );

  definition.strands.forEach((strand, strandIndex) => {
    const curve = new THREE.CatmullRomCurve3(
      strand.points.map((point) => new THREE.Vector3(...point)),
      false,
      'centripetal',
    );
    for (let index = 0; index < strand.count; index += 1) {
      const t = THREE.MathUtils.clamp(
        (index + THREE.MathUtils.lerp(0.18, 0.82, random())) / strand.count,
        0,
        1,
      );
      const position = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const scatter = [
        (random() - 0.5) * strand.width[0],
        (random() - 0.5) * strand.width[1],
        (random() - 0.5) * strand.width[2],
      ];
      position.add(new THREE.Vector3(...scatter));
      const size = THREE.MathUtils.lerp(
        strand.sizeRange[0],
        strand.sizeRange[1],
        random(),
      );
      const scale = new THREE.Vector3(
        size * THREE.MathUtils.lerp(0.88, 1.12, random()),
        size * THREE.MathUtils.lerp(0.92, 1.16, random()),
        size,
      );
      const variant = strand.variant ?? (random() > 0.58 ? 'airy' : 'compact');
      const normalizedScatter = scatter.map((value, axis) =>
        value / Math.max(strand.width[axis], 0.001),
      );
      const tone = chooseTone(
        position,
        definition.worldPivot,
        normalizedScatter,
        random,
        strand.lightBias ?? 0,
      );
      instances[variant][tone].push({
        position,
        scale,
        roll:
          Math.atan2(tangent.y, tangent.x) * 0.28 +
          (random() - 0.5) * 0.72 +
          strandIndex * 0.08,
        tilt: (random() - 0.5) * 0.28,
      });
    }
  });

  Object.entries(instances).forEach(([variant, byTone]) => {
    Object.entries(byTone).forEach(([tone, items]) => {
      if (items.length === 0) return;
      const mesh = new THREE.InstancedMesh(
        blossomClusterGeometries[variant],
        blossomSurfaces[tone],
        items.length,
      );
      mesh.name = `${definition.name} ${tone} ${variant} blossom sprays`;
      mesh.castShadow = true;

      items.forEach((item, index) => {
        matrixHelper.position.copy(item.position);
        matrixHelper.quaternion.setFromUnitVectors(
          detailNormal,
          cameraZoneLocal.clone().sub(item.position).normalize(),
        );
        matrixHelper.rotateZ(item.roll);
        matrixHelper.rotateX(item.tilt);
        matrixHelper.scale.copy(item.scale);
        matrixHelper.updateMatrix();
        mesh.setMatrixAt(index, matrixHelper.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      zone.add(mesh);
    });
  });

  zone.userData.swayPhase = definition.swayPhase;
  zone.userData.swayAmount = definition.swayAmount;
  return zone;
}

const readableBlossomDefinitions = [
  // A sparse lit contour, following the accepted silhouette rather than enlarging it.
  [[-3.15, 5.24, 0.55], 0.11, 'warm', -0.6, 0.1],
  [[-2.84, 5.75, 0.72], 0.13, 'light', 0.3, -0.1],
  [[-2.62, 6.28, 0.4], 0.11, 'highlight', -0.2, 0.12],
  [[-2.14, 6.63, 0.72], 0.14, 'highlight', 0.6, -0.06],
  [[-1.67, 7.05, 0.42], 0.13, 'highlight', -0.45, 0.06],
  [[-1.05, 7.42, 0.12], 0.12, 'light', 0.2, -0.12],
  [[-0.42, 7.54, 0.28], 0.14, 'highlight', -0.3, 0.05],
  [[0.18, 7.28, 0.5], 0.11, 'light', 0.5, 0.12],
  [[0.72, 6.92, 0.68], 0.14, 'light', -0.6, -0.08],
  [[1.2, 6.56, 0.62], 0.12, 'warm', 0.2, 0.04],
  [[1.83, 6.14, 0.78], 0.14, 'light', 0.5, -0.1],
  [[2.36, 5.82, 0.5], 0.11, 'warm', -0.4, 0.1],
  [[2.84, 5.44, 0.56], 0.13, 'light', 0.25, 0],
  [[3.28, 4.94, 0.4], 0.11, 'warm', -0.3, 0.12],
  [[3.52, 4.48, 0.2], 0.09, 'mid', 0.4, -0.08],
  // Near-plane accents provide a second readable scale without covering canopy gaps.
  [[-2.45, 5.45, 1.12], 0.14, 'light', -0.2, 0.08],
  [[-1.95, 5.92, 1.22], 0.11, 'warm', 0.5, -0.05],
  [[-1.46, 6.25, 1.38], 0.15, 'light', -0.4, 0.1],
  [[-0.92, 5.78, 1.55], 0.13, 'warm', 0.3, -0.08],
  [[-0.35, 6.12, 1.46], 0.12, 'light', -0.55, 0.04],
  [[0.12, 5.6, 1.55], 0.15, 'warm', 0.2, 0.1],
  [[0.62, 6.05, 1.28], 0.12, 'light', 0.6, -0.08],
  [[1.1, 5.6, 1.22], 0.13, 'warm', -0.35, 0.05],
  [[1.58, 5.25, 1.05], 0.12, 'mid', 0.45, -0.06],
  [[2.04, 5.02, 0.88], 0.1, 'warm', -0.5, 0.09],
  [[-1.1, 5.05, 0.95], 0.1, 'shade', 0.35, -0.08],
  [[-0.25, 4.96, 1.28], 0.11, 'warm', -0.15, 0.06],
  [[0.68, 5.05, 1.18], 0.1, 'mid', 0.55, -0.04],
];

function createReadableBlossoms(crownOrigin, blossomSurfaces) {
  const pivot = [0, 5.75, 0.7];
  const group = new THREE.Group();
  group.name = 'Readable near blossom accents';
  group.position.set(...subtractOrigin(pivot, crownOrigin));

  const byTone = {
    highlight: [],
    light: [],
    warm: [],
    mid: [],
    shade: [],
  };
  readableBlossomDefinitions.forEach((definition) => byTone[definition[2]].push(definition));

  const cameraPosition = ART_DIRECTION.camera.useFrameCompletionVariant
    ? ART_DIRECTION.camera.frameCompletionPosition
    : ART_DIRECTION.camera.desktopPosition;
  const cameraLocal = new THREE.Vector3(...cameraPosition).sub(
    new THREE.Vector3(...ART_DIRECTION.world.treePosition),
  );

  Object.entries(byTone).forEach(([tone, blossoms]) => {
    if (blossoms.length === 0) return;
    const mesh = new THREE.InstancedMesh(
      readableBlossomGeometry,
      blossomSurfaces[tone],
      blossoms.length,
    );
    mesh.name = `${tone} readable blossom accents`;

    blossoms.forEach(([position, scale, , roll, tilt], index) => {
      matrixHelper.position.set(...subtractOrigin(position, pivot));
      matrixHelper.quaternion.setFromUnitVectors(
        detailNormal,
        cameraLocal.clone().sub(new THREE.Vector3(...position)).normalize(),
      );
      matrixHelper.rotateZ(roll);
      matrixHelper.rotateX(tilt);
      matrixHelper.scale.set(scale, scale, scale);
      matrixHelper.updateMatrix();
      mesh.setMatrixAt(index, matrixHelper.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });

  group.userData.swayPhase = 8.65;
  group.userData.swayAmount = 0.72;
  return group;
}

export const canopyDefinitions = [
  {
    name: 'left crown',
    seed: 18,
    pivot: [-1.72, 5.82, 0.18],
    swayPhase: 0.5,
    swayAmount: 0.78,
    strands: [
      {
        points: [[-0.95, 0.12, -0.05], [-0.45, 0.62, 0.05], [0.2, 0.88, 0.02], [0.78, 0.72, -0.08]],
        count: 9,
        width: [0.25, 0.18, 0.28],
        sizeRange: [0.34, 0.46],
      },
      {
        points: [[0.05, 0.68, 0.12], [-0.72, 0.55, 0.15], [-1.35, 0.15, 0.08], [-1.62, -0.55, 0.12]],
        count: 8,
        width: [0.22, 0.18, 0.25],
        sizeRange: [0.3, 0.42],
      },
      {
        points: [[0.65, 0.1, 0.35], [0.1, -0.05, 0.55], [-0.55, -0.35, 0.42], [-1.1, -0.82, 0.25]],
        count: 8,
        width: [0.22, 0.16, 0.24],
        sizeRange: [0.3, 0.43],
        lightBias: -0.05,
      },
      {
        points: [[0.55, 0.55, 0.72], [0.05, 0.2, 0.92], [-0.32, -0.62, 0.82]],
        count: 5,
        width: [0.18, 0.14, 0.2],
        sizeRange: [0.27, 0.38],
        variant: 'airy',
      },
      {
        points: [[-0.35, 0.3, 0.38], [-0.48, -0.25, 0.5], [-0.55, -0.72, 0.46]],
        count: 3,
        width: [0.12, 0.12, 0.16],
        sizeRange: [0.23, 0.31],
        variant: 'trailing',
      },
    ],
  },
  {
    name: 'high crown',
    seed: 41,
    pivot: [-0.2, 6.65, -0.12],
    swayPhase: 2.1,
    swayAmount: 1,
    strands: [
      {
        points: [[-1.25, -0.15, 0.05], [-0.7, 0.45, 0.1], [0, 0.78, 0], [0.72, 0.53, 0.02], [1.15, 0.12, 0.1]],
        count: 11,
        width: [0.22, 0.18, 0.24],
        sizeRange: [0.34, 0.48],
      },
      {
        points: [[-0.95, -0.35, -0.5], [-0.3, 0.25, -0.6], [0.5, 0.15, -0.55], [0.95, -0.3, -0.38]],
        count: 8,
        width: [0.22, 0.18, 0.2],
        sizeRange: [0.3, 0.42],
        lightBias: -0.18,
      },
      {
        points: [[-1, -0.1, -0.95], [-0.3, 0.42, -1.05], [0.55, 0.25, -0.9]],
        count: 6,
        width: [0.18, 0.14, 0.16],
        sizeRange: [0.27, 0.38],
        variant: 'airy',
        lightBias: -0.28,
      },
      {
        points: [[-0.55, 0.55, 0.22], [-0.05, 1.05, 0.14], [0.45, 0.7, 0.08]],
        count: 5,
        width: [0.18, 0.14, 0.18],
        sizeRange: [0.26, 0.38],
        variant: 'airy',
        lightBias: 0.08,
      },
      {
        points: [[0.6, 0.25, 0.35], [0.8, -0.25, 0.45], [0.85, -0.75, 0.5]],
        count: 4,
        width: [0.14, 0.12, 0.16],
        sizeRange: [0.25, 0.34],
        variant: 'trailing',
      },
    ],
  },
  {
    name: 'reaching crown',
    seed: 73,
    pivot: [1.55, 5.65, 0.02],
    swayPhase: 4.3,
    swayAmount: 1.15,
    strands: [
      {
        points: [[-1.25, 0.45, -0.1], [-0.5, 0.72, 0], [0.25, 0.55, 0.1], [0.95, 0.18, 0.05], [1.65, -0.45, 0]],
        count: 12,
        width: [0.24, 0.18, 0.25],
        sizeRange: [0.32, 0.45],
      },
      {
        points: [[0.25, 0.35, 0.38], [0.95, 0.05, 0.45], [1.55, -0.62, 0.35], [1.9, -1.05, 0.18]],
        count: 9,
        width: [0.22, 0.16, 0.2],
        sizeRange: [0.28, 0.4],
      },
      {
        points: [[-1.15, -0.05, 0.85], [-0.45, 0.2, 1], [0.3, -0.1, 0.92], [0.95, -0.55, 0.72]],
        count: 8,
        width: [0.2, 0.16, 0.2],
        sizeRange: [0.29, 0.41],
        variant: 'airy',
      },
      {
        points: [[-0.5, 0.55, -0.55], [0.25, 0.28, -0.62], [0.8, -0.28, -0.5]],
        count: 6,
        width: [0.18, 0.14, 0.18],
        sizeRange: [0.27, 0.38],
        lightBias: -0.2,
      },
      {
        points: [[1.35, -0.3, 0.2], [1.55, -0.75, 0.16], [1.65, -1.2, 0.1]],
        count: 3,
        width: [0.12, 0.12, 0.14],
        sizeRange: [0.23, 0.31],
        variant: 'trailing',
      },
      // Reassigned from `annotated gap infill` — these two sprays sit closest to
      // this zone's own rightward descent, so they swing with it instead of
      // drifting out of sync during wind (see PROGRESS.md canopy-sway note).
      {
        points: [[1.45, -0.3, 0.48], [1.7, -0.35, 0.53]],
        count: 1,
        width: [0.1, 0.08, 0.1],
        sizeRange: [0.2, 0.27],
        variant: 'airy',
        lightBias: -0.04,
      },
      {
        points: [[1.3, -1.3, 0.43], [1.55, -1.43, 0.48]],
        count: 1,
        width: [0.1, 0.08, 0.1],
        sizeRange: [0.18, 0.24],
        variant: 'trailing',
        lightBias: -0.08,
      },
    ],
  },
  {
    name: 'near lower crown',
    seed: 116,
    pivot: [-0.25, 5.38, 1.05],
    swayPhase: 5.7,
    swayAmount: 0.68,
    strands: [
      {
        points: [[-1.15, 0.15, 0.1], [-0.55, 0.42, 0.25], [0.15, 0.22, 0.3], [0.75, -0.05, 0.22]],
        count: 9,
        width: [0.22, 0.16, 0.2],
        sizeRange: [0.31, 0.43],
      },
      {
        points: [[-0.65, -0.1, 0.4], [-0.1, -0.35, 0.52], [0.55, -0.42, 0.35], [1.15, -0.55, 0.15]],
        count: 8,
        width: [0.2, 0.14, 0.18],
        sizeRange: [0.28, 0.4],
        variant: 'airy',
        lightBias: -0.03,
      },
      {
        points: [[0.2, 0.15, 0.28], [0.2, -0.4, 0.42], [0.1, -0.85, 0.3]],
        count: 3,
        width: [0.12, 0.1, 0.14],
        sizeRange: [0.24, 0.32],
        variant: 'trailing',
      },
    ],
  },
  {
    name: 'selective inner crown infill',
    seed: 219,
    pivot: [0, 5.95, 0.8],
    swayPhase: 6.45,
    swayAmount: 0.72,
    strands: [
      {
        points: [[-0.65, 0.5, -0.15], [-0.25, 0.65, -0.05], [0.15, 0.5, -0.15]],
        count: 4,
        width: [0.16, 0.12, 0.14],
        sizeRange: [0.26, 0.34],
        variant: 'airy',
        lightBias: 0.05,
      },
      {
        points: [[0.05, 0.25, 0], [0.45, 0.1, 0.1], [0.75, -0.1, 0]],
        count: 4,
        width: [0.15, 0.12, 0.14],
        sizeRange: [0.25, 0.34],
        variant: 'airy',
      },
      {
        points: [[-0.55, -0.1, 0.35], [-0.15, -0.35, 0.45], [0.35, -0.4, 0.4]],
        count: 4,
        width: [0.16, 0.12, 0.14],
        sizeRange: [0.27, 0.35],
        lightBias: -0.04,
      },
    ],
  },
  {
    name: 'annotated gap infill',
    seed: 263,
    pivot: [0, 5.8, 0.75],
    swayPhase: 6.9,
    swayAmount: 0.78,
    strands: [
      {
        points: [[-0.77, 0.72, 0.05], [-1.3, 0.16, 0.05]],
        count: 2,
        width: [0.12, 0.1, 0.12],
        sizeRange: [0.26, 0.33],
        variant: 'airy',
      },
      {
        points: [[1.25, 1.1, -0.3], [1.45, 1.14, -0.25]],
        count: 1,
        width: [0.1, 0.08, 0.1],
        sizeRange: [0.26, 0.32],
        variant: 'airy',
        lightBias: 0.05,
      },
      {
        points: [[0.75, 0.4, 0.05], [1.08, 0.12, 0.08]],
        count: 2,
        width: [0.12, 0.1, 0.12],
        sizeRange: [0.25, 0.32],
        variant: 'airy',
      },
      {
        points: [[-0.02, -0.35, 0.1], [0.3, -0.55, 0.12]],
        count: 2,
        width: [0.12, 0.1, 0.12],
        sizeRange: [0.24, 0.31],
      },
      {
        points: [[1.8, -0.55, 0.05], [2.15, -0.72, 0]],
        count: 2,
        width: [0.12, 0.1, 0.12],
        sizeRange: [0.23, 0.3],
        variant: 'airy',
        lightBias: -0.03,
      },
    ],
  },
  {
    name: 'trailing edge sprays',
    seed: 151,
    pivot: [-0.1, 5.55, 0.15],
    swayPhase: 7.2,
    swayAmount: 1.35,
    strands: [
      {
        points: [[-2.7, 0.45, 0.1], [-3.1, -0.1, 0.15], [-3.45, -0.55, 0.1]],
        count: 3,
        width: [0.12, 0.1, 0.14],
        sizeRange: [0.2, 0.28],
        variant: 'trailing',
      },
      {
        points: [[-2.25, 1.1, -0.2], [-2.55, 0.65, -0.1]],
        count: 2,
        width: [0.1, 0.1, 0.12],
        sizeRange: [0.2, 0.28],
        variant: 'trailing',
      },
      {
        points: [[2.65, -0.1, 0.1], [3, -0.55, 0.05], [3.35, -0.95, 0]],
        count: 3,
        width: [0.12, 0.1, 0.14],
        sizeRange: [0.21, 0.3],
        variant: 'trailing',
      },
      {
        points: [[0.35, 1.25, -0.1], [0.55, 0.8, 0.05]],
        count: 2,
        width: [0.1, 0.1, 0.12],
        sizeRange: [0.2, 0.27],
        variant: 'trailing',
        lightBias: 0.05,
      },
      {
        points: [[-0.85, 0.45, 1], [-0.65, -0.15, 1.15]],
        count: 2,
        width: [0.1, 0.1, 0.12],
        sizeRange: [0.21, 0.29],
        variant: 'trailing',
      },
    ],
  },
];

export function createSakuraTree() {
  const tree = new THREE.Group();
  tree.name = 'Sakura tree';
  tree.position.set(...ART_DIRECTION.world.treePosition);

  const barkSurfaces = {
    dark: material(palette.bark),
    mid: material(palette.barkMid),
    light: material(palette.barkLight),
    scar: material(palette.barkShadow),
  };
  if (weatherIsWet()) {
    applyWetMaterial(barkSurfaces.dark, 'bark');
    applyWetMaterial(barkSurfaces.mid, 'bark');
    applyWetMaterial(barkSurfaces.light, 'bark');
    applyWetMaterial(barkSurfaces.scar, 'bark');
  }
  const blossomSurfaces = {
    highlight: material(palette.blossomHighlight, { side: THREE.DoubleSide, roughness: 0.84, emissive: 0x32151f, emissiveIntensity: 0.06 }),
    light: material(palette.blossomLight, { side: THREE.DoubleSide, roughness: 0.84, emissive: 0x32151f, emissiveIntensity: 0.06 }),
    warm: material(palette.blossomWarm, { side: THREE.DoubleSide, roughness: 0.84, emissive: 0x32151f, emissiveIntensity: 0.06 }),
    mid: material(palette.blossomMid, { side: THREE.DoubleSide, roughness: 0.84, emissive: 0x32151f, emissiveIntensity: 0.06 }),
    shade: material(palette.blossomShade, { side: THREE.DoubleSide, roughness: 0.84, emissive: 0x32151f, emissiveIntensity: 0.06 }),
    deep: material(palette.blossomDeep, { side: THREE.DoubleSide, roughness: 0.84, emissive: 0x32151f, emissiveIntensity: 0.06 }),
  };
  const readableBlossomSurfaces = {
    highlight: material(palette.blossomHighlight, { side: THREE.DoubleSide, roughness: 0.82 }),
    light: material(palette.blossomLight, { side: THREE.DoubleSide, roughness: 0.82 }),
    warm: material(palette.blossomWarm, { side: THREE.DoubleSide, roughness: 0.82 }),
    mid: material(palette.blossomMid, { side: THREE.DoubleSide, roughness: 0.82 }),
    shade: material(palette.blossomShade, { side: THREE.DoubleSide, roughness: 0.82 }),
  };

  const rootFlare = new THREE.Mesh(
    new THREE.CylinderGeometry(0.49, 0.66, 0.36, 8),
    barkSurfaces.mid,
  );
  rootFlare.name = 'Grounded trunk flare';
  rootFlare.position.set(0.01, 0.13, 0.01);
  rootFlare.rotation.y = 0.18;
  rootFlare.castShadow = true;
  rootFlare.receiveShadow = true;

  tree.add(
    rootFlare,
    createLimb(
      'rooted lower trunk',
      [[0, 0, 0], [0.1, 0.78, -0.04], [-0.03, 1.52, 0.05], [0.06, 2.16, 0.02]],
      [0.54, 0.49, 0.42, 0.36],
      barkSurfaces.light,
    ),
  );

  const rootLines = [
    [[0.03, 0.22, 0.02], [-0.68, 0.04, 0.35], 0.22, 0.055],
    [[0.06, 0.18, 0.05], [0.75, 0.035, 0.28], 0.2, 0.045],
    [[-0.02, 0.16, -0.02], [-0.42, 0.02, -0.58], 0.17, 0.04],
  ];
  rootLines.forEach(([start, end, startRadius, endRadius], index) => {
    tree.add(branchBetween(`surface root ${index + 1}`, start, end, startRadius, endRadius, barkSurfaces.dark, 7));
  });

  const crownOrigin = [0.04, 2.05, 0.02];
  const crownRig = new THREE.Group();
  crownRig.name = 'Upper tree wind rig';
  crownRig.position.set(...crownOrigin);
  tree.add(crownRig);

  const limbs = [
    ['upper trunk', [[0.04, 2.05, 0.02], [-0.04, 3.05, 0.04], [-0.34, 4.2, 0.12], [-0.18, 5.38, -0.08], [0.02, 6.25, -0.15]], [0.37, 0.33, 0.25, 0.14, 0.045], barkSurfaces.light],
    ['left major branch', [[0, 2.83, 0.03], [-0.68, 3.66, 0.13], [-1.5, 4.55, 0.23], [-2.38, 5.35, 0.08], [-3.03, 5.75, 0.02]], [0.31, 0.26, 0.17, 0.09, 0.035], barkSurfaces.mid],
    ['right major branch', [[0, 2.66, 0.01], [0.63, 3.38, 0.09], [1.48, 4.13, 0.18], [2.55, 4.52, 0.05], [3.22, 4.78, 0]], [0.32, 0.27, 0.18, 0.085, 0.03], barkSurfaces.mid],
    ['left rising branch', [[-0.52, 3.85, 0.13], [-0.88, 4.88, 0.58], [-1.28, 5.92, 0.75]], [0.17, 0.1, 0.035], barkSurfaces.dark],
    ['right rising branch', [[0.9, 3.62, 0.11], [1.31, 4.72, -0.18], [1.27, 5.73, -0.42]], [0.16, 0.09, 0.03], barkSurfaces.dark],
    ['near branch', [[-0.24, 3.52, 0.08], [-0.48, 4.32, 0.72], [-0.72, 5.18, 1.18]], [0.18, 0.1, 0.035], barkSurfaces.dark],
    ['high fork', [[-0.21, 4.55, 0.02], [0.42, 5.32, -0.28], [0.83, 6.12, -0.38]], [0.13, 0.075, 0.028], barkSurfaces.dark],
  ];
  const branchSwayGroups = [];
  limbs.forEach(([name, points, radii, surface], index) => {
    const limb = createLimb(name, points, radii, surface, crownOrigin);
    crownRig.add(limb);
    if (name !== 'upper trunk') {
      branchSwayGroups.push({
        group: limb,
        phase: 0.8 + index * 1.17,
        amount: name.includes('major') ? 0.32 : 0.58,
      });
    }
  });

  const fineTwigs = [
    [[-1.45, 4.56, 0.22], [-1.78, 5.4, -0.18], [-2.02, 5.94, -0.2]],
    [[-2.34, 5.33, 0.08], [-2.75, 5.62, 0.52], [-3.12, 5.92, 0.62]],
    [[1.46, 4.12, 0.18], [1.92, 4.87, 0.62], [2.08, 5.43, 0.72]],
    [[2.45, 4.49, 0.05], [2.83, 5.08, -0.34], [3.18, 5.36, -0.38]],
    [[-0.24, 5.23, -0.08], [-0.72, 6.06, -0.34], [-1.02, 6.58, -0.28]],
    [[0.1, 5.83, -0.14], [0.42, 6.48, 0.16], [0.48, 7.03, 0.18]],
    [[-2.35, 5.34, 0.08], [-2.84, 5.13, 0.1], [-3.26, 5.08, 0.04]],
    [[2.53, 4.51, 0.05], [3.02, 4.35, 0.13], [3.52, 4.18, 0.02]],
    [[-0.7, 5.12, 1.14], [-0.28, 5.72, 1.34], [0.04, 6.12, 1.25]],
    [[1.9, 4.84, 0.6], [2.42, 5.27, 0.86], [2.82, 5.43, 0.76]],
    [[-1.28, 5.9, 0.74], [-1.65, 6.26, 0.78], [-1.92, 5.75, 0.84]],
    [[0.48, 7.02, 0.18], [0.83, 6.87, 0.26], [1.05, 6.42, 0.34]],
    [[1.27, 5.72, -0.4], [1.82, 6, -0.28], [2.25, 5.56, -0.2]],
    [[2.08, 5.42, 0.72], [2.56, 5.6, 0.68], [2.86, 5.08, 0.58]],
  ];
  const twigAccentCameraPosition = ART_DIRECTION.camera.useFrameCompletionVariant
    ? ART_DIRECTION.camera.frameCompletionPosition
    : ART_DIRECTION.camera.desktopPosition;
  const twigAccentCameraTreeLocal = new THREE.Vector3(...twigAccentCameraPosition).sub(
    new THREE.Vector3(...ART_DIRECTION.world.treePosition),
  );

  fineTwigs.forEach((points, index) => {
    const twig = createLimb(
      `fine branch ${index + 1}`,
      points,
      [0.072, 0.043, 0.018],
      barkSurfaces.dark,
      crownOrigin,
    );
    crownRig.add(twig);

    if (index === 0) {
      // Most isolated exposed tip (no blossom within ~0.7 units) — one small
      // accent so it reads as structural rather than unfinished. The second
      // most isolated tip (fine branch 5) is intentionally left bare.
      const tipTreeSpace = points[points.length - 1];
      const accent = new THREE.Mesh(blossomClusterGeometries.trailing, blossomSurfaces.warm);
      accent.name = 'Fine branch 1 tip accent';
      accent.position.set(...subtractOrigin(tipTreeSpace, crownOrigin));
      accent.quaternion.setFromUnitVectors(
        detailNormal,
        twigAccentCameraTreeLocal.clone().sub(new THREE.Vector3(...tipTreeSpace)).normalize(),
      );
      accent.scale.setScalar(0.24);
      accent.castShadow = true;
      twig.add(accent);
    }

    branchSwayGroups.push({
      group: twig,
      phase: 2.4 + index * 0.91,
      amount: 0.76,
    });
  });

  const scarPositions = [
    [[0.32, 0.72, 0.1], [0.12, 0.25, 0.06]],
    [[-0.34, 1.2, 0.1], [0.1, 0.28, 0.07]],
    [[0.3, 1.7, 0.09], [0.09, 0.24, 0.05]],
  ];
  scarPositions.forEach(([position, scale], index) => {
    const scar = new THREE.Mesh(knotGeometry, barkSurfaces.scar);
    scar.name = `bark scar ${index + 1}`;
    scar.position.set(...position);
    scar.scale.set(...scale);
    scar.rotation.set(index * 0.8, 0.2, index * 0.45);
    tree.add(scar);
  });

  const junctionGroup = new THREE.Group();
  junctionGroup.name = 'Branch junction facets';
  [
    [[0.01, 2.74, 0.03], [0.36, 0.43, 0.32], barkSurfaces.mid, [0.1, 0.55, -0.12]],
    [[-0.28, 3.56, 0.11], [0.21, 0.28, 0.19], barkSurfaces.dark, [-0.2, 0.35, 0.18]],
    [[1.46, 4.13, 0.17], [0.2, 0.25, 0.18], barkSurfaces.mid, [0.22, -0.4, 0.1]],
  ].forEach(([position, scale, surface, rotation], index) => {
    const junction = new THREE.Mesh(knotGeometry, surface);
    junction.name = `branch junction facet ${index + 1}`;
    junction.position.set(...subtractOrigin(position, crownOrigin));
    junction.scale.set(...scale);
    junction.rotation.set(...rotation);
    junction.castShadow = true;
    junction.receiveShadow = true;
    junctionGroup.add(junction);
  });
  crownRig.add(junctionGroup);

  const canopyZones = canopyDefinitions.map((definition) => {
    const localDefinition = {
      ...definition,
      worldPivot: definition.pivot,
      pivot: subtractOrigin(definition.pivot, crownOrigin),
    };
    const zone = createCanopyZone(localDefinition, blossomSurfaces);
    zone.userData.zoneName = definition.name;
    crownRig.add(zone);
    return zone;
  });
  const readableBlossoms = createReadableBlossoms(crownOrigin, readableBlossomSurfaces);
  crownRig.add(readableBlossoms);

  const responseStates = canopyZones.map(() => createResponseState());
  const localHit = new THREE.Vector3();
  let lastElapsed = 0;

  function zoneIndexByName(name) {
    return canopyDefinitions.findIndex((definition) => definition.name === name);
  }

  function responseOmega() {
    const { damping, settleTime } = ART_DIRECTION.treeResponse;
    return 3.9 / (Math.max(damping, 0.15) * Math.max(settleTime, 0.08));
  }

  function applyImpulse(state, velX, velZ) {
    const maxRotation = ART_DIRECTION.treeResponse.maxStackedRotation;
    const current = Math.hypot(state.rotX, state.rotZ);
    const incoming = Math.hypot(state.velX + velX, state.velZ + velZ);
    const estimate = current + incoming * 0.12;
    const scale = estimate > maxRotation && estimate > 0
      ? maxRotation / estimate
      : 1;
    state.velX += velX * scale;
    state.velZ += velZ * scale;
  }

  function yieldRotationFor(zone, worldPoint, peak) {
    zone.updateWorldMatrix(true, false);
    localHit.copy(worldPoint);
    zone.worldToLocal(localHit);
    const lateral = Math.abs(localHit.x) < 1e-4 ? 1 : Math.sign(localHit.x);
    const depth = Math.abs(localHit.z) < 1e-4 ? 1 : Math.sign(localHit.z);
    const reach = Math.min(1, Math.hypot(localHit.x, localHit.z) / 1.15);
    const rotZ = -lateral * peak * (0.78 + 0.22 * reach);
    const rotX = -depth * peak * 0.32;
    const magnitude = Math.hypot(rotZ, rotX) || 1;
    const scale = peak / magnitude;
    return { rotZ: rotZ * scale, rotX: rotX * scale };
  }

  function applyLocalResponse({
    zoneName,
    neighborName,
    worldPoint,
    strength = 1,
  }) {
    if (!ART_DIRECTION.treeResponse.enabled) return null;
    const index = zoneIndexByName(zoneName);
    if (index < 0 || !worldPoint) return null;
    const omega = responseOmega();
    const peak = Math.min(
      ART_DIRECTION.treeResponse.maxAddedRotation * THREE.MathUtils.clamp(strength, 0, 1),
      ART_DIRECTION.treeResponse.maxAddedRotation,
    );
    const rotation = yieldRotationFor(canopyZones[index], worldPoint, peak);
    const velocityScale = omega * Math.E;
    applyImpulse(
      responseStates[index],
      rotation.rotX * velocityScale,
      rotation.rotZ * velocityScale,
    );

    const neighborIndex = neighborName ? zoneIndexByName(neighborName) : -1;
    if (neighborIndex >= 0 && ART_DIRECTION.treeResponse.neighborShare > 0) {
      const neighborRotation = yieldRotationFor(
        canopyZones[neighborIndex],
        worldPoint,
        peak * ART_DIRECTION.treeResponse.neighborShare,
      );
      const neighborState = responseStates[neighborIndex];
      neighborState.pendingVelX = neighborRotation.rotX * velocityScale;
      neighborState.pendingVelZ = neighborRotation.rotZ * velocityScale;
      neighborState.pendingWait = ART_DIRECTION.treeResponse.neighborDelay;
    }
    return { zoneName, neighborName: neighborIndex >= 0 ? neighborName : null, peak };
  }

  function clearResponse() {
    responseStates.forEach((state) => {
      state.rotX = 0;
      state.rotZ = 0;
      state.velX = 0;
      state.velZ = 0;
      state.pendingVelX = 0;
      state.pendingVelZ = 0;
      state.pendingWait = 0;
    });
  }

  function getResponseState() {
    return responseStates.map((state, index) => ({
      zoneName: canopyDefinitions[index].name,
      rotX: state.rotX,
      rotZ: state.rotZ,
      velX: state.velX,
      velZ: state.velZ,
      magnitude: Math.hypot(state.rotX, state.rotZ),
    }));
  }

  function integrateResponse(delta) {
    if (delta <= 0) return;
    const omega = responseOmega();
    const omega2 = omega * omega;
    const drag = 2 * Math.max(ART_DIRECTION.treeResponse.damping, 0.15) * omega;
    const maxRotation = ART_DIRECTION.treeResponse.maxStackedRotation;
    let remaining = delta;

    while (remaining > 1e-6) {
      const dt = Math.min(1 / 60, remaining);
      responseStates.forEach((state) => {
        if (state.pendingWait > 0) {
          state.pendingWait -= dt;
          if (state.pendingWait <= 0) {
            applyImpulse(state, state.pendingVelX, state.pendingVelZ);
            state.pendingVelX = 0;
            state.pendingVelZ = 0;
            state.pendingWait = 0;
          }
        }
        state.velX += (-omega2 * state.rotX - drag * state.velX) * dt;
        state.rotX += state.velX * dt;
        state.velZ += (-omega2 * state.rotZ - drag * state.velZ) * dt;
        state.rotZ += state.velZ * dt;
        const magnitude = Math.hypot(state.rotX, state.rotZ);
        if (magnitude > maxRotation) {
          const scale = maxRotation / magnitude;
          state.rotX *= scale;
          state.rotZ *= scale;
        }
        if (Math.abs(state.rotX) < 1e-6 && Math.abs(state.velX) < 1e-5) {
          state.rotX = 0;
          state.velX = 0;
        }
        if (Math.abs(state.rotZ) < 1e-6 && Math.abs(state.velZ) < 1e-5) {
          state.rotZ = 0;
          state.velZ = 0;
        }
      });
      remaining -= dt;
    }
  }

  function update(elapsed) {
    if (elapsed < lastElapsed) lastElapsed = elapsed;
    const delta = Math.min(Math.max(elapsed - lastElapsed, 0), 0.05);
    lastElapsed = elapsed;
    integrateResponse(delta);

    const { motion } = ART_DIRECTION;
    const time = elapsed * motion.swayFrequency;
    const wind = motion.windStrength;
    crownRig.rotation.z =
      (Math.sin(time) * 0.72 + Math.sin(time * 0.43 + 1.7) * 0.28) *
      motion.branchSwayAmplitude * wind;
    crownRig.rotation.x = Math.sin(time * 0.77 + 0.8) * motion.branchSwayAmplitude * wind * 0.42;

    branchSwayGroups.forEach(({ group: branch, phase, amount }) => {
      branch.rotation.z =
        (Math.sin(time * 0.92 + phase) * 0.68 +
          Math.sin(time * 0.39 + phase * 1.7) * 0.32) *
        motion.branchDetailSwayAmplitude * amount * wind;
      branch.rotation.x =
        Math.sin(time * 0.66 + phase * 1.23) *
        motion.branchDetailSwayAmplitude * amount * wind * 0.38;
    });

    canopyZones.forEach((zone, index) => {
      const phase = zone.userData.swayPhase;
      const amount = zone.userData.swayAmount;
      const response = responseStates[index];
      zone.rotation.z =
        (Math.sin(time * 1.14 + phase) * 0.73 +
          Math.sin(time * 0.52 + phase * 1.61) * 0.27) *
          motion.canopySwayAmplitude * amount * wind +
        response.rotZ;
      zone.rotation.x =
        Math.sin(time * 0.83 + phase * 1.31) * motion.canopySwayAmplitude * amount * wind * 0.38 +
        response.rotX;
    });

    readableBlossoms.rotation.z =
      (Math.sin(time * 1.23 + readableBlossoms.userData.swayPhase) * 0.7 +
        Math.sin(time * 0.47 + 2.2) * 0.3) *
      motion.blossomDetailSwayAmplitude * readableBlossoms.userData.swayAmount * wind;
    readableBlossoms.rotation.x =
      Math.sin(time * 0.91 + 1.4) * motion.blossomDetailSwayAmplitude * wind * 0.24;
  }

  return {
    group: tree,
    update,
    applyLocalResponse,
    clearResponse,
    getResponseState,
  };
}

function createResponseState() {
  return {
    rotX: 0,
    rotZ: 0,
    velX: 0,
    velZ: 0,
    pendingVelX: 0,
    pendingVelZ: 0,
    pendingWait: 0,
  };
}
