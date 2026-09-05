import * as THREE from 'three';

const scratchBox = new THREE.Box3();
const scratchPoint = new THREE.Vector3();

function recordBox(box, name, kind, padding = 0) {
  return {
    name,
    kind,
    min: [box.min.x - padding, box.min.y - padding, box.min.z - padding],
    max: [box.max.x + padding, box.max.y + padding, box.max.z + padding],
  };
}

// Read the existing construction once. No scene geometry is mutated and no
// per-frame raycasting, triangle tests or moving collision bodies are needed.
export function collectSnowBlockers(environment, tree) {
  const blockers = [];
  environment?.updateWorldMatrix(true, true);
  environment?.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || !object.visible) return;
    const surfaces = Array.isArray(object.material) ? object.material : [object.material];
    if (surfaces.every(surface => surface.transparent)) return;
    if (object.geometry.type === 'BoxGeometry' || /utility pole/i.test(object.name)) {
      object.geometry.computeBoundingBox();
      scratchBox.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);
      // Broad construction, including roof overhangs and the fascia. Tiny
      // trim is already protected by its underlying wall/roof volume.
      const width = scratchBox.max.x - scratchBox.min.x;
      const depth = scratchBox.max.z - scratchBox.min.z;
      const height = scratchBox.max.y - scratchBox.min.y;
      if ((width >= 0.2 && depth >= 0.12) || (height > 1 && width >= 0.12 && depth >= 0.08)) {
        blockers.push(recordBox(scratchBox, object.name, 'construction', 0.008));
      }
      return;
    }

    // These batches consist solely of ordinary 24-vertex boxes. Reading each
    // piece separately also catches the existing roof vent, without turning
    // the empty gaps between the distant houses into one large blocker.
    if (/^Neighborhood life (wall|roof|trim)$/.test(object.name)) {
      const positions = object.geometry.getAttribute('position');
      for (let start = 0; start + 24 <= positions.count; start += 24) {
        scratchBox.makeEmpty();
        for (let index = start; index < start + 24; index += 1) {
          scratchPoint.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld);
          scratchBox.expandByPoint(scratchPoint);
        }
        blockers.push(recordBox(scratchBox, `${object.name} ${start / 24 + 1}`, 'construction', 0.008));
      }
    }
  });

  tree?.updateWorldMatrix(true, true);
  tree?.traverse(object => {
    const canopy = object.name.endsWith('blossom spray zone') || object.name === 'Readable near blossom accents';
    const trunk = object.isMesh && /trunk|flare/i.test(object.name);
    if (!canopy && !trunk) return;
    scratchBox.setFromObject(object);
    // The crown keeps its accepted sway and local response. This modest
    // envelope covers both without rebuilding bounds as the branches move.
    blockers.push(recordBox(scratchBox, object.name, canopy ? 'canopy' : 'trunk', canopy ? 0.2 : 0.08));
  });
  return blockers;
}

export function snowGroundHeightAt(x, z) {
  // Conservative surface tops of the existing paving, curb, drain and road.
  if (z < 3.14) return 0.03;
  if (z < 3.56) return -0.06;
  if (z < 4.03) return -0.365;
  return -0.515;
}

function insideBox(position, box, radius) {
  return position.x >= box.min[0] - radius && position.x <= box.max[0] + radius
    && position.y >= box.min[1] - radius && position.y <= box.max[1] + radius
    && position.z >= box.min[2] - radius && position.z <= box.max[2] + radius;
}

function crossesBox(start, end, box, radius) {
  let near = 0;
  let far = 1;
  for (let axis = 0; axis < 3; axis += 1) {
    const key = axis === 0 ? 'x' : axis === 1 ? 'y' : 'z';
    const origin = start[key];
    const delta = end[key] - origin;
    const min = box.min[axis] - radius;
    const max = box.max[axis] + radius;
    if (Math.abs(delta) < 1e-12) {
      if (origin < min || origin > max) return false;
      continue;
    }
    const a = (min - origin) / delta;
    const b = (max - origin) / delta;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return false;
  }
  return true;
}

export function createSnowCollision({ environment, tree, blockers = collectSnowBlockers(environment, tree) } = {}) {
  return {
    blockers,
    contains(position, radius = 0) {
      if (position.y <= snowGroundHeightAt(position.x, position.z) + radius) return 'ground';
      for (const box of blockers) if (insideBox(position, box, radius)) return box.kind;
      return null;
    },
    intercepts(start, end, radius = 0) {
      if (end.y <= snowGroundHeightAt(end.x, end.z) + radius) return 'ground';
      for (const box of blockers) if (crossesBox(start, end, box, radius)) return box.kind;
      return null;
    },
  };
}
