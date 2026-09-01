import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';

function activeLighting() {
  const { lighting } = ART_DIRECTION;
  if (!weatherIsWet()) return lighting;
  return { ...lighting, ...lighting.wet };
}

export function createLighting() {
  const lighting = activeLighting();
  const lights = new THREE.Group();
  lights.name = weatherIsWet() ? 'Wet evening lighting' : 'Late afternoon lighting';

  const hemisphere = new THREE.HemisphereLight(
    lighting.skyColor,
    lighting.groundColor,
    lighting.hemisphereIntensity,
  );
  hemisphere.name = 'Ambient sky fill';

  const sun = new THREE.DirectionalLight(lighting.sunColor, lighting.sunIntensity);
  sun.name = weatherIsWet() ? 'Cool wet key' : 'Late afternoon key';
  sun.position.set(...lighting.sunPosition);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lighting.shadowMapSize, lighting.shadowMapSize);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 11;
  sun.shadow.camera.bottom = -4;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;

  const shopGlow = new THREE.PointLight(
    lighting.shopLightColor,
    lighting.shopLightIntensity,
    lighting.shopLightDistance,
    2,
  );
  shopGlow.name = 'Restrained shop window glow';
  shopGlow.position.set(3.25, 1.75, -1.25);

  lights.add(hemisphere, sun, shopGlow);

  function update(elapsed) {
    const slowInteriorVariation =
      Math.sin(elapsed * 0.31) * 0.62 +
      Math.sin(elapsed * 0.13 + 1.8) * 0.38;
    shopGlow.intensity =
      lighting.shopLightIntensity *
      (1 + slowInteriorVariation * lighting.shopGlowVariation);
  }

  return { group: lights, update };
}
