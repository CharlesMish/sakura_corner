import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { canopyDefinitions } from '../scene/createSakuraTree.js';

const ndc = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const worldSphere = new THREE.Sphere();
const hitPoint = new THREE.Vector3();
const bestPoint = new THREE.Vector3();
const bestCenter = new THREE.Vector3();
const pivotWorld = new THREE.Vector3();
const matrixHelper = new THREE.Matrix4();
const sphereHelper = new THREE.Sphere();

function zoneNameFromObject(object) {
  let current = object;
  while (current) {
    if (current.name.endsWith(' blossom spray zone')) {
      return current.name.slice(0, -' blossom spray zone'.length);
    }
    current = current.parent;
  }
  return null;
}

function nearestZoneName(localPosition, parent, zoneObjects) {
  parent.updateMatrixWorld(true);
  bestCenter.copy(localPosition).applyMatrix4(parent.matrixWorld);
  let bestName = canopyDefinitions[0].name;
  let bestDistance = Infinity;
  canopyDefinitions.forEach((definition) => {
    const zone = zoneObjects.get(definition.name);
    zone.getWorldPosition(pivotWorld);
    const distance = pivotWorld.distanceToSquared(bestCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = definition.name;
    }
  });
  return bestName;
}

function collectHitSpheres(treeGroup, zoneObjects) {
  const hits = [];
  treeGroup.updateMatrixWorld(true);
  treeGroup.traverse((object) => {
    const isTipAccent = object.name === 'Fine branch 1 tip accent';
    if (!object.isInstancedMesh && !isTipAccent) return;
    const parent = object.parent;
    if (!parent) return;
    if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
    const ownedZoneName = zoneNameFromObject(object);

    function pushSphere(localSphere) {
      hits.push({
        parent,
        zoneName:
          ownedZoneName ?? nearestZoneName(localSphere.center, parent, zoneObjects),
        sphereLocal: localSphere.clone(),
      });
    }

    object.updateMatrix();
    if (object.isInstancedMesh) {
      for (let index = 0; index < object.count; index += 1) {
        object.getMatrixAt(index, matrixHelper);
        matrixHelper.premultiply(object.matrix);
        sphereHelper.copy(object.geometry.boundingSphere);
        sphereHelper.applyMatrix4(matrixHelper);
        sphereHelper.radius *= ART_DIRECTION.treeResponse.hitRadiusScale;
        pushSphere(sphereHelper);
      }
      return;
    }

    sphereHelper.copy(object.geometry.boundingSphere);
    sphereHelper.applyMatrix4(object.matrix);
    sphereHelper.radius *= ART_DIRECTION.treeResponse.hitRadiusScale;
    pushSphere(sphereHelper);
  });
  return hits;
}

function neighborNameFor(worldPoint, primaryName, hits) {
  let bestName = null;
  let bestDistance = Infinity;
  hits.forEach((hit) => {
    if (hit.zoneName === primaryName) return;
    // This authored zone contains both far tips; using it as a neighbor can make
    // the opposite edge answer a local touch.
    if (
      primaryName !== 'trailing edge sprays' &&
      hit.zoneName === 'trailing edge sprays'
    ) return;
    worldSphere.copy(hit.sphereLocal).applyMatrix4(hit.parent.matrixWorld);
    const distance = worldSphere.center.distanceToSquared(worldPoint);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = hit.zoneName;
    }
  });
  return bestName;
}

export function createTreeInteraction({ tree, camera, domElement, onTarget }) {
  const zoneObjects = new Map(
    canopyDefinitions.map((definition) => [
      definition.name,
      tree.group.getObjectByName(`${definition.name} blossom spray zone`),
    ]),
  );
  for (const [name, zone] of zoneObjects) {
    if (!zone) throw new Error(`Missing canopy zone: ${name}`);
  }

  const hits = collectHitSpheres(tree.group, zoneObjects);
  let lastActivation = -Infinity;

  function pickFromNdc(ndcX, ndcY) {
    ndc.set(ndcX, ndcY);
    raycaster.setFromCamera(ndc, camera);
    tree.group.updateMatrixWorld(true);
    let bestDistance = Infinity;
    let bestHit = null;

    hits.forEach((hit) => {
      worldSphere.copy(hit.sphereLocal).applyMatrix4(hit.parent.matrixWorld);
      const point = raycaster.ray.intersectSphere(worldSphere, hitPoint);
      if (!point) return;
      const distance = point.distanceToSquared(raycaster.ray.origin);
      if (distance >= bestDistance) return;
      bestDistance = distance;
      bestHit = hit;
      bestPoint.copy(point);
      bestCenter.copy(worldSphere.center);
    });
    if (!bestHit) return null;

    const worldPoint = bestPoint.clone();
    const releasePoint = bestCenter.clone();
    return {
      zoneName: bestHit.zoneName,
      neighborName: neighborNameFor(releasePoint, bestHit.zoneName, hits),
      worldPoint,
      releasePoint,
      kind: 'canopy',
    };
  }

  function pickFromClient(clientX, clientY) {
    const rect = domElement.getBoundingClientRect();
    return pickFromNdc(
      ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
    );
  }

  function activateResult(result, now = performance.now() / 1000) {
    if (!result) return null;
    const { cooldown, cooldownStrength } = ART_DIRECTION.treeResponse;
    const strength = now - lastActivation >= cooldown ? 1 : cooldownStrength;
    lastActivation = now;
    const payload = { ...result, strength };
    tree.applyLocalResponse(payload);
    onTarget?.(payload);
    return payload;
  }

  function handlePointerDown(event) {
    if (event.isPrimary === false) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const result = pickFromClient(event.clientX, event.clientY);
    if (!result) return;
    event.preventDefault();
    activateResult(result);
  }

  domElement.addEventListener('pointerdown', handlePointerDown);

  return {
    pickFromNdc,
    pickFromClient,
    activateResult,
    activateAtClient(clientX, clientY) {
      return activateResult(pickFromClient(clientX, clientY));
    },
    getHitCount: () => hits.length,
    dispose() {
      domElement.removeEventListener('pointerdown', handlePointerDown);
    },
  };
}
