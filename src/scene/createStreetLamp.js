import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';
import { box, branchBetween, material } from './primitives.js';

// Yozakura: at night the blossoms should glow because something lights them,
// not only because they are emissive. A cool LED security lamp on a slim post
// by the curb gives the tree its own pool of light, opposite the warm shop.

function createHaloTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'Street lamp halo';
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStreetLamp() {
  const spec = ART_DIRECTION.streetLamp;
  if (!spec?.enabled) return null;

  const night = weatherIsWet();
  const { base, head } = spec;
  const group = new THREE.Group();
  group.name = 'Curbside street lamp';

  const pole = material(night ? 0x3a4348 : 0x6c6862, { roughness: 0.6, metalness: 0.2 });
  const lens = material(0xeef3ff, {
    emissive: 0xeef3ff,
    emissiveIntensity: night ? spec.lensIntensity : 0,
    roughness: 0.3,
  });
  const armStart = [base[0], head[1] - 0.18, base[2]];

  group.add(
    branchBetween('Lamp post', base, [base[0], head[1] - 0.1, base[2]], 0.07, 0.052, pole, 8),
    branchBetween('Lamp arm', armStart, [head[0] - 0.12, head[1] + 0.03, head[2]], 0.035, 0.03, pole, 6),
    box('Lamp housing', [0.44, 0.1, 0.2], head, pole),
    box('Lamp lens', [0.36, 0.025, 0.14], [head[0], head[1] - 0.06, head[2]], lens),
  );
  // Only the post throws a shadow in the key light; the head must never block its own lamp.
  group.traverse((child) => {
    if (child.isMesh && child.name !== 'Lamp post') child.castShadow = false;
  });

  if (!night) return { group, update() {} };

  const spot = new THREE.SpotLight(
    spec.color,
    spec.intensity,
    spec.distance,
    THREE.MathUtils.degToRad(spec.angle),
    spec.penumbra,
    spec.decay,
  );
  spot.name = 'Lamp cone on the sakura';
  spot.position.set(head[0], head[1] - 0.1, head[2]);
  spot.target.position.set(...spec.target);
  spot.castShadow = spec.castShadow;
  if (spec.castShadow) {
    spot.shadow.mapSize.set(spec.shadowMapSize, spec.shadowMapSize);
    spot.shadow.bias = -0.0006;
    spot.shadow.normalBias = 0.03;
    spot.shadow.camera.near = 0.5;
    spot.shadow.camera.far = spec.distance;
  }

  // A faint omni spill so the lamp head and nearby canopy edge don't read as black.
  const spill = new THREE.PointLight(spec.spill.color, spec.spill.intensity, spec.spill.distance, 2);
  spill.name = 'Lamp head spill';
  spill.position.set(head[0], head[1] - 0.3, head[2]);

  // Damp air catches the light at the head.
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createHaloTexture(),
    color: spec.halo.color,
    transparent: true,
    opacity: spec.halo.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
  halo.name = 'Lamp halo';
  halo.position.set(head[0], head[1] - 0.08, head[2]);
  halo.scale.setScalar(spec.halo.size);

  group.add(spot, spot.target, spill, halo);

  function update(elapsed) {
    // LED fixtures hum rather than flicker; keep it almost imperceptible.
    spot.intensity = spec.intensity * (1 + Math.sin(elapsed * 9.1) * 0.004);
  }

  return { group, update };
}
