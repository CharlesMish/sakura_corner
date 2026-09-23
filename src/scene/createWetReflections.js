import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ART_DIRECTION } from '../config.js';
import { hasLiquidWater } from '../weatherMode.js';

// Wet ground reflects light; it never darkens. So the reflection is added on top
// of the existing asphalt/pavement: dark sky adds a faint sheen, while the shop
// window, lamp and blossoms leave soft rippled streaks. Patchy "puddle" noise
// keeps it from reading as a mirror floor.
const WetReflectionShader = {
  name: 'WetReflectionShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    time: { value: 0 },
    strength: { value: 0.5 },
    ripple: { value: 0.006 },
    streak: { value: 0.012 },
    puddleScale: { value: 0.8 },
    fogRange: { value: new THREE.Vector2(22, 40) },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float strength;
    uniform float ripple;
    uniform float streak;
    uniform float puddleScale;
    uniform vec2 fogRange;
    varying vec4 vUv;
    varying vec3 vWorld;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    void main() {
      vec2 uv = vUv.xy / vUv.w;
      vec2 w = vWorld.xz;
      vec2 wobble = vec2(
        noise(w * 3.1 + vec2(time * 0.7, 0.0)),
        noise(w * 3.1 + vec2(0.0, time * 0.9) + 7.3)
      ) - 0.5;
      uv += wobble * ripple;

      // Vertical smear: wet asphalt stretches highlights toward the viewer.
      vec3 sum = vec3(0.0);
      float weight = 0.0;
      for (int i = -4; i <= 4; i++) {
        float fi = float(i);
        float k = exp(-fi * fi * 0.18);
        sum += texture2D(tDiffuse, uv + vec2(0.0, fi * streak)).rgb * k;
        weight += k;
      }
      vec3 reflection = sum / weight;

      float puddle = noise(w * puddleScale) * 0.65 + noise(w * puddleScale * 3.4 + 11.0) * 0.35;
      puddle = smoothstep(0.38, 0.72, puddle);
      float amount = strength * mix(0.3, 1.0, puddle);
      float fade = 1.0 - smoothstep(fogRange.x, fogRange.y, distance(cameraPosition, vWorld));

      gl_FragColor = vec4(reflection * color * amount * fade, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

function createSurface(name, surface, shared) {
  const reflector = new Reflector(new THREE.PlaneGeometry(...surface.size), {
    shader: WetReflectionShader,
    textureWidth: surface.textureSize[0],
    textureHeight: surface.textureSize[1],
    multisample: 0,
    color: 0xffffff,
  });
  reflector.name = name;
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(0, surface.y, surface.centerZ);
  reflector.renderOrder = 1;

  const { material } = reflector;
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;
  material.uniforms.strength.value = surface.strength;
  material.uniforms.ripple.value = shared.ripple;
  material.uniforms.streak.value = shared.streak;
  material.uniforms.puddleScale.value = shared.puddleScale;
  const sky = ART_DIRECTION.atmosphere.wet;
  material.uniforms.fogRange.value.set(sky.fogNear, sky.fogFar);

  // The camera is a fixed composition, so a reflection can be re-used for a
  // few frames; only rain, petals and sway change it.
  const renderReflection = reflector.onBeforeRender;
  let frame = 0;
  reflector.onBeforeRender = function onBeforeRender(...args) {
    if (frame % shared.updateEvery === 0) renderReflection.apply(this, args);
    frame += 1;
  };

  return reflector;
}

export function createWetReflections() {
  const spec = ART_DIRECTION.wetReflections;
  if (!spec || !hasLiquidWater()) return null;

  const surfaces = [];
  // Asphalt sits at y≈-0.525; the tree and sky reflect into the open road.
  if (spec.road?.enabled) surfaces.push(createSurface('Wet road reflection', spec.road, spec));
  // Sidewalk slab top sits at y≈-0.02; the shop window pools here.
  if (spec.pavement?.enabled) surfaces.push(createSurface('Wet pavement reflection', spec.pavement, spec));
  if (!surfaces.length) return null;

  const group = new THREE.Group();
  group.name = 'Wet ground reflections';
  group.add(...surfaces);

  function update(elapsed) {
    for (const surface of surfaces) surface.material.uniforms.time.value = elapsed;
  }

  return { group, update };
}
