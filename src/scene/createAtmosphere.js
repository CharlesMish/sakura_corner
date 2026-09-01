import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';

function channels(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function blend(a, b, amount) {
  return a.map((value, index) => Math.round(THREE.MathUtils.lerp(value, b[index], amount)));
}

export function createAtmosphericBackground() {
  const { atmosphere } = ART_DIRECTION;
  const sky = weatherIsWet() ? atmosphere.wet : atmosphere.clear;
  const horizon = channels(sky.skyHorizon);
  const middle = channels(sky.skyMiddle);
  const top = channels(sky.skyTop);
  const data = new Uint8Array(atmosphere.gradientResolution * 4);

  for (let row = 0; row < atmosphere.gradientResolution; row += 1) {
    const vertical = row / (atmosphere.gradientResolution - 1);
    const horizonBlend = sky.horizonBlend ?? 0.42;
    const color = vertical < horizonBlend
      ? blend(horizon, middle, vertical / horizonBlend)
      : blend(middle, top, (vertical - horizonBlend) / (1 - horizonBlend));
    const offset = row * 4;
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = 255;
  }

  const texture = new THREE.DataTexture(
    data,
    1,
    atmosphere.gradientResolution,
    THREE.RGBAFormat,
  );
  texture.name = weatherIsWet()
    ? 'Cool rain night sky gradient'
    : 'Warm-to-cool atmospheric sky gradient';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
