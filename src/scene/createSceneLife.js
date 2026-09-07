import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Small authored performances, with a private clock and no shared random calls.
// Only the selected weather's inhabitant is constructed.
export const LIFE_SPEC = Object.freeze({
  cat: { position: [2.97, 1.14, -1.477], depthScale: 0.08 },
  bird: { position: [0.8, -0.02, 2.05], cycle: 38 },
  flock: { count: 5, cycle: 83, start: 12, duration: 42 },
});

function ellipsoid(size, at) {
  return new THREE.SphereGeometry(1, 10, 7).scale(...size).translate(...at);
}

function batch(parent, name, surface, pieces) {
  const flat = pieces.map(piece => piece.index ? piece.toNonIndexed() : piece);
  const mesh = new THREE.Mesh(mergeGeometries(flat), surface);
  mesh.name = name;
  parent.add(mesh);
  for (const geometry of new Set([...pieces, ...flat])) geometry.dispose();
  return mesh;
}

function sleepingCat(snow) {
  const group = new THREE.Group();
  group.name = 'Small life: orange-and-white cat asleep inside the shop';
  group.position.set(...LIFE_SPEC.cat.position);
  // The existing interior is a shallow stage: keep the animal between the
  // warm backing and glass, resting on the existing counter, below the shelf.
  group.scale.set(snow ? 0.94 : 1, 1, LIFE_SPEC.cat.depthScale);
  const fur = new THREE.MeshBasicMaterial({ color: 0x8e5f3b });
  const white = new THREE.MeshBasicMaterial({ color: 0xb3a38a });
  const shade = new THREE.MeshBasicMaterial({ color: 0x503d30 });
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.27, 0.1, 0.02), new THREE.Vector3(-0.22, 0.067, 0.17),
    new THREE.Vector3(-0.04, 0.047, 0.225), new THREE.Vector3(0.13, 0.05, 0.2),
    new THREE.Vector3(0.19, 0.082, 0.12),
  ]);
  const orange = [ellipsoid([0.255, 0.147, 0.205], [-0.055, 0.15, -0.025]),
    ellipsoid([0.118, 0.102, 0.11], [0.16, 0.13, 0.12]),
    new THREE.TubeGeometry(tail, 14, 0.036, 6, false)];
  for (const [x, tilt] of [[0.087, -0.22], [0.224, 0.2]]) {
    orange.push(new THREE.ConeGeometry(0.054, 0.11, 3).rotateZ(tilt).translate(x, 0.232, 0.11));
  }
  batch(group, 'Curled ginger body, tucked head, pointed ears and wrapped tail', fur, orange);
  batch(group, 'Soft white chest and tucked white paws', white, [
    ellipsoid([0.075, 0.068, 0.015], [0.125, 0.07, 0.204]),
    ellipsoid([0.057, 0.027, 0.047], [0.21, 0.027, 0.19]),
    ellipsoid([0.048, 0.025, 0.045], [0.125, 0.025, 0.222]),
  ]);
  batch(group, 'Closed eyelids and small nose', shade, [
    new THREE.BoxGeometry(0.042, 0.008, 0.006).rotateZ(-0.13).translate(0.115, 0.143, 0.221),
    new THREE.BoxGeometry(0.035, 0.008, 0.006).rotateZ(0.16).translate(0.193, 0.135, 0.227),
    ellipsoid([0.012, 0.009, 0.005], [0.17, 0.11, 0.233]),
  ]);
  return { group, update(time) { group.scale.y = 1 + Math.sin(time * Math.PI * 2 / 7.8) * 0.012; } };
}

function groundBird() {
  const group = new THREE.Group();
  group.name = 'Small life: solitary bird foraging after rain';
  group.position.set(...LIFE_SPEC.bird.position);
  const feathers = new THREE.MeshStandardMaterial({ color: 0x655f50, roughness: 1, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: 0x353d3c, roughness: 1, flatShading: true });
  const breast = new THREE.MeshStandardMaterial({ color: 0x929084, roughness: 1, flatShading: true });
  const body = new THREE.Group();
  body.name = 'Resting bird body';
  group.add(body);
  batch(body, 'Small sparrow-like body', feathers, [ellipsoid([0.105, 0.107, 0.17], [0, 0.16, 0])]);
  batch(body, 'Folded wings and short tail', dark, [
    ellipsoid([0.1, 0.055, 0.133], [0, 0.185, -0.035]),
    new THREE.BoxGeometry(0.065, 0.022, 0.14).rotateX(-0.25).translate(0, 0.14, -0.17),
  ]);
  batch(body, 'Muted breast', breast, [ellipsoid([0.075, 0.075, 0.04], [0, 0.14, 0.13])]);
  const head = new THREE.Group();
  head.name = 'Bird head with brief pecks';
  head.position.set(0, 0.21, 0.1);
  body.add(head);
  batch(head, 'Bird head', feathers, [ellipsoid([0.075, 0.074, 0.077], [0, 0.022, 0.028])]);
  batch(head, 'Short dark beak and eyes', dark, [
    new THREE.ConeGeometry(0.022, 0.062, 4).rotateX(Math.PI / 2).translate(0, 0.01, 0.12),
    ellipsoid([0.006, 0.006, 0.006], [0.058, 0.035, 0.067]),
    ellipsoid([0.006, 0.006, 0.006], [-0.058, 0.035, 0.067]),
  ]);
  batch(group, 'Two small feet on the pavement', dark, [-0.04, 0.04].flatMap(x => [
    new THREE.CylinderGeometry(0.007, 0.007, 0.063, 4).translate(x, 0.032, 0.015),
    new THREE.BoxGeometry(0.022, 0.009, 0.054).translate(x, 0.0045, 0.034),
  ]));
  const smooth = t => THREE.MathUtils.smoothstep(t, 0, 1);
  function hop(time, start) {
    const phase = THREE.MathUtils.clamp((time - start) / 0.62, 0, 1);
    return { travel: smooth(phase), height: Math.sin(phase * Math.PI) * 0.085 };
  }
  function update(time) {
    const t = time % LIFE_SPEC.bird.cycle;
    const outward = [hop(t, 9), hop(t, 10.6)];
    const homeward = [hop(t, 28), hop(t, 29.6)];
    const travel = outward.reduce((sum, h) => sum + h.travel, 0) - homeward.reduce((sum, h) => sum + h.travel, 0);
    group.position.x = LIFE_SPEC.bird.position[0] - travel * 0.13;
    group.position.z = LIFE_SPEC.bird.position[2] + travel * 0.09;
    group.position.y = LIFE_SPEC.bird.position[1] + [...outward, ...homeward].reduce((sum, h) => sum + h.height, 0);
    // Turns occupy quiet pauses; the return path closes continuously.
    group.rotation.y = -0.96 + Math.PI * (smooth((t - 23) / 1.2) - smooth((t - 33) / 1.2));
    let peck = 0;
    for (const start of [4.4, 6.2, 17.3, 19.8]) {
      const phase = (t - start) / 0.9;
      if (phase > 0 && phase < 1) peck = Math.sin(phase * Math.PI) ** 2;
    }
    body.rotation.x = peck * 0.48;
    head.rotation.x = peck * 0.65;
  }
  update(0);
  return { group, update };
}

function distantFlock() {
  const group = new THREE.Group();
  group.name = 'Small life: five distant birds in clear air';
  const shape = new THREE.BufferGeometry();
  const resting = [-0.26, 0, 0, 0, 0, 0.075, 0, 0, -0.075];
  shape.setAttribute('position', new THREE.Float32BufferAttribute(resting, 3));
  shape.computeVertexNormals();
  const surface = new THREE.MeshBasicMaterial({ color: 0x444d55, side: THREE.DoubleSide });
  const birds = new THREE.InstancedMesh(shape, surface, LIFE_SPEC.flock.count * 2);
  birds.name = 'Five bounded flight silhouettes, ten individually hinged wings';
  birds.frustumCulled = false;
  birds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(birds);
  const helper = new THREE.Object3D();
  const hinge = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  const offsets = [[0, 0, 0], [-0.95, 0.2, -0.4], [-1.8, -0.16, 0.25], [-2.7, 0.09, -0.6], [-3.7, -0.04, 0.12]];
  function update(time) {
    const phase = (time % LIFE_SPEC.flock.cycle - LIFE_SPEC.flock.start) / LIFE_SPEC.flock.duration;
    group.visible = phase >= 0 && phase <= 1;
    if (!group.visible) return;
    offsets.forEach(([x, y, z], i) => {
      // Cross the distant air approximately parallel to the image plane.
      // Both ends are outside the desktop frame; depth testing supplies the
      // natural disappearance behind the canopy and distant roof silhouettes.
      const travel = -32 + phase * 64 + x;
      helper.position.set(-10 + travel * 0.78 + z * 0.625,
        5.7 + y + Math.sin(time * 0.38 + i * 1.7) * 0.18,
        -13 - travel * 0.625 + z * 0.78 + Math.sin(time * 0.2 + i) * 0.12);
      helper.rotation.set(0, 2.246, Math.sin(time * 0.54 + i) * 0.09);
      helper.scale.setScalar(0.84 + i * 0.045);
      helper.updateMatrix();
      const flap = Math.sin(time * (3.4 + i * 0.07) + i * 1.1) * 0.44;
      for (let side = 0; side < 2; side++) {
        hinge.rotation.set(0, side * Math.PI, flap);
        hinge.updateMatrix();
        birds.setMatrixAt(i * 2 + side, matrix.multiplyMatrices(helper.matrix, hinge.matrix));
      }
    });
    birds.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { group, update };
}

export function createSceneLife({ weather }) {
  const life = weather === 'rain' || weather === 'snow' ? sleepingCat(weather === 'snow')
    : weather === 'wet' ? groundBird() : weather === 'clear' ? distantFlock() : null;
  const group = new THREE.Group();
  group.name = 'Weather-specific small lives';
  if (life) group.add(life.group);
  let time = 0;
  function update(delta = 0, reducedMotion = false) {
    if (!life) return;
    if (reducedMotion) {
      if (weather === 'clear') life.group.visible = false;
      return;
    }
    time += Number.isFinite(delta) ? THREE.MathUtils.clamp(delta, 0, 0.05) : 0;
    life.update(time);
  }
  update(0);
  return { group, update, getTelemetry: () => ({ weather, time, active: Boolean(life?.group.visible) }) };
}
