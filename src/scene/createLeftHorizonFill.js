import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box, material } from './primitives.js';

function createRetainingWall(stone, stoneDark) {
  const wall = new THREE.Group();
  wall.name = 'Left street retaining wall';
  const posts = [
    [-12.4, -0.55],
    [-13.35, -0.72],
    [-14.3, -0.88],
    [-15.25, -1.02],
    [-16.2, -1.18],
    [-17.15, -1.32],
    [-18.1, -1.48],
  ];
  posts.forEach(([x, z], index) => {
    wall.add(
      box(
        `Left retaining pier ${index + 1}`,
        [0.22, 0.62 + (index % 3) * 0.08, 0.28],
        [x, 0.28, z],
        index % 2 === 0 ? stone : stoneDark,
      ),
    );
  });
  wall.add(
    box('Left retaining run', [5.95, 0.38, 0.18], [-15.25, 0.22, -1.02], stoneDark),
    box('Left retaining cap', [6.15, 0.08, 0.26], [-15.25, 0.44, -1.02], stone),
  );
  return wall;
}

function addGroveTree(group, name, x, z, radius, height, needle, needleDark, dark, yaw = 0) {
  const canopy = box(
    `${name} canopy`,
    [radius * 3.6, height * 0.58, radius * 3.2],
    [x, height * 0.78, z],
    dark ? needleDark : needle,
  );
  canopy.rotation.y = yaw;
  const side = box(
    `${name} canopy side`,
    [radius * 2.2, height * 0.34, radius * 2.4],
    [x + radius * 1.15, height * 0.7, z + radius * 0.35],
    dark ? needle : needleDark,
  );
  side.rotation.y = yaw + 0.46;
  group.add(
    box(`${name} trunk`, [radius, height, radius], [x, height / 2, z], needleDark),
    canopy,
    side,
  );
}

function createHorizonGrove(needle, needleDark) {
  const grove = new THREE.Group();
  grove.name = 'Left horizon grove';
  const front = [
    [-13.85, -1.85, 0.2, 2.55],
    [-15.55, -2.35, 0.24, 3.35],
    [-17.35, -2.55, 0.22, 3.05],
    [-19.15, -3.05, 0.26, 3.75],
    [-14.65, -3.15, 0.18, 2.35],
    [-16.75, -3.55, 0.2, 2.85],
    [-18.55, -3.85, 0.22, 3.45],
    [-20.35, -3.45, 0.24, 3.15],
  ];
  const back = [
    [-14.35, -4.55, 0.22, 3.15],
    [-16.05, -5.05, 0.26, 3.85],
    [-17.85, -5.35, 0.24, 3.55],
    [-19.55, -5.75, 0.28, 4.15],
    [-15.45, -5.65, 0.2, 2.95],
    [-18.65, -6.25, 0.24, 3.65],
    [-16.95, -6.55, 0.22, 3.25],
  ];
  const outer = [
    [-23.4, -2.85, 0.2, 2.85],
    [-24.8, -3.55, 0.22, 3.45],
    [-26.2, -3.25, 0.18, 2.95],
    [-25.4, -4.65, 0.24, 3.65],
    [-27.1, -4.25, 0.2, 3.25],
    [-23.8, -5.15, 0.16, 2.55],
    [-26.8, -5.55, 0.22, 3.4],
    [-29.2, -3.85, 0.2, 3.15],
    [-30.4, -4.55, 0.22, 3.45],
    [-28.6, -5.85, 0.18, 2.85],
  ];
  front.forEach(([x, z, radius, height], index) => {
    addGroveTree(
      grove,
      `Front grove ${index + 1}`,
      x,
      z,
      radius,
      height,
      needle,
      needleDark,
      index % 2 === 1,
      index * 0.31,
    );
  });
  back.forEach(([x, z, radius, height], index) => {
    addGroveTree(
      grove,
      `Back grove ${index + 1}`,
      x,
      z,
      radius,
      height,
      needle,
      needleDark,
      index % 2 === 0,
      -index * 0.27,
    );
  });
  outer.forEach(([x, z, radius, height], index) => {
    addGroveTree(
      grove,
      `Outer grove ${index + 1}`,
      x,
      z,
      radius,
      height,
      needle,
      needleDark,
      index % 2 === 1,
      index * 0.22,
    );
  });
  return grove;
}

export function createLeftHorizonFill() {
  const wet = weatherIsWet();
  const earth = material(wet ? 0x4a453c : 0x5c564c, { roughness: 0.95 });
  const earthDark = material(wet ? 0x3a3731 : 0x4a453c, { roughness: 0.96 });
  const grass = material(wet ? 0x4a6354 : 0x56705c, { roughness: 0.88 });
  const stone = material(wet ? 0x7a7e76 : 0x8a8e84, { roughness: 0.88 });
  const stoneDark = material(wet ? 0x5c6058 : 0x6c7066, { roughness: 0.9 });
  const needle = material(wet ? 0x4a6756 : 0x5a7866, {
    roughness: 0.88,
    emissive: 0x1c2e24,
    emissiveIntensity: 0.12,
  });
  const needleDark = material(wet ? 0x354a3e : 0x3a4c40, {
    roughness: 0.9,
    emissive: 0x121c16,
    emissiveIntensity: 0.08,
  });

  const fill = new THREE.Group();
  fill.name = 'Left horizon neighborhood fill';

  fill.add(
    box('Left street-end earth', [11.5, 0.1, 5.4], [-16.4, 0.04, -1.55], earth),
    box('Left street-end earth shade', [6.8, 0.08, 3.2], [-18.8, 0.05, -3.15], earthDark),
    box('Left street-end grass lip', [4.6, 0.06, 1.15], [-14.2, 0.055, -0.72], grass),
    box('Left slope rise', [5.4, 0.85, 3.6], [-20.4, 0.42, -3.55], earthDark),
    box('Left slope shoulder', [3.8, 1.45, 2.8], [-21.2, 0.78, -4.35], earth),
    box('Left wooded bank', [6.8, 1.15, 3.4], [-17.4, 0.58, -5.15], earth),
    box('Left wooded bank back', [5.4, 1.65, 2.8], [-18.2, 0.82, -6.35], earthDark),
    box('Far-left covering earth', [10.8, 0.14, 6.4], [-26.2, 0.07, -3.55], earth),
    box('Far-left bank rise', [7.2, 1.35, 3.6], [-27.0, 0.68, -4.85], earthDark),
    box('Far-left grass lip', [4.2, 0.06, 1.4], [-23.6, 0.08, -2.15], grass),
    box('Far-left outer earth', [6.4, 0.12, 4.8], [-30.2, 0.08, -4.25], earthDark),
    createRetainingWall(stone, stoneDark),
    createHorizonGrove(needle, needleDark),
  );

  fill.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  return fill;
}
