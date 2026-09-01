import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';

const coolHelper = new THREE.Color();

export function applyWetMaterial(surface, kind) {
  if (!weatherIsWet() || !surface?.color) return surface;
  const spec = ART_DIRECTION.weather.surfaces[kind];
  if (!spec) return surface;
  if (spec.multiply != null) surface.color.multiplyScalar(spec.multiply);
  if (spec.coolToward != null) {
    coolHelper.set(spec.coolToward);
    surface.color.lerp(coolHelper, spec.coolMix ?? 0.22);
  }
  if (spec.roughness != null) surface.roughness = spec.roughness;
  if (spec.metalness != null) surface.metalness = spec.metalness;
  return surface;
}
