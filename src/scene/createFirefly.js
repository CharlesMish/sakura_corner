import * as THREE from 'three';

// A private deterministic stream leaves the accepted tree and weather RNGs alone.
function glowRandom() {
  let seed = 0x6b6f6b61;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function createFirefly() {
  const group = new THREE.Group();
  group.name = 'Optional solitary firefly';
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  const surface = new THREE.PointsMaterial({
    color: 0x888d45,
    size: 1.15,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  const insect = new THREE.Points(geometry, surface);
  insect.name = 'One muted olive-gold firefly';
  insect.visible = false;
  group.add(insect);

  let random = glowRandom();
  let darkInterval = 6 + random() * 6;
  let glowStart = darkInterval;
  let glowDuration = 1.9 + random() * 1.3;
  let peakOpacity = 0.64 + random() * 0.1;
  let previousElapsed = 0;

  function update(elapsed = 0) {
    if (!Number.isFinite(elapsed)) return;
    elapsed = Math.max(0, elapsed);
    if (elapsed < previousElapsed) {
      random = glowRandom();
      darkInterval = 6 + random() * 6;
      glowStart = darkInterval;
      glowDuration = 1.9 + random() * 1.3;
      peakOpacity = 0.64 + random() * 0.1;
    }
    previousElapsed = elapsed;
    while (elapsed >= glowStart + glowDuration) {
      darkInterval = 6 + random() * 6;
      glowStart += glowDuration + darkInterval;
      glowDuration = 1.9 + random() * 1.3;
      peakOpacity = 0.64 + random() * 0.1;
    }

    // Smooth, bounded movement stays close to the low tree-base vegetation.
    insect.position.set(
      -2.3 + Math.sin(elapsed * 0.27) * 0.22 + Math.sin(elapsed * 0.43 + 0.6) * 0.08,
      0.65 + Math.sin(elapsed * 0.31 + 1.3) * 0.085 + Math.sin(elapsed * 0.17) * 0.035,
      0.6 + Math.sin(elapsed * 0.23 + 0.9) * 0.16 + Math.sin(elapsed * 0.37) * 0.045,
    );
    const phase = (elapsed - glowStart) / glowDuration;
    const glow = phase < 0 ? 0
      : THREE.MathUtils.smoothstep(phase, 0, 0.45)
        * (1 - THREE.MathUtils.smoothstep(phase, 0.45, 1));
    surface.opacity = peakOpacity * glow;
    insect.visible = surface.opacity > 0.001;
  }

  function getTelemetry() {
    return {
      capacity: 1,
      active: insect.visible,
      position: insect.position.toArray(),
      opacity: surface.opacity,
      darkInterval,
      glowDuration,
      glowStart,
    };
  }

  update(0);
  return { group, update, getTelemetry };
}
