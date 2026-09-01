import * as THREE from 'three';
import { weatherIsWet } from '../weatherMode.js';
import { box, material } from './primitives.js';

function createPrecinctGround(gravel, gravelShade, pebble) {
  const ground = new THREE.Group();
  ground.name = 'Shrine precinct ground';

  ground.add(
    box('Shrine gravel plot', [5.4, 0.06, 2.55], [-16.85, 0.022, -4.72], gravel),
    box('Shrine gravel left run', [2.15, 0.055, 2.15], [-19.05, 0.02, -4.55], gravelShade),
    box('Shrine gravel street lip', [3.35, 0.05, 0.72], [-17.35, 0.024, -3.72], gravel),
    box('Shrine gravel back patch', [3.8, 0.05, 0.7], [-16.55, 0.02, -5.72], gravelShade),
  );

  const pebbles = [
    [-15.05, 0.055, -3.95, 0.12, 0.04, 0.09],
    [-16.42, 0.052, -4.15, 0.09, 0.035, 0.07],
    [-17.28, 0.05, -3.88, 0.14, 0.04, 0.1],
    [-18.15, 0.052, -4.85, 0.11, 0.035, 0.08],
    [-16.05, 0.05, -5.45, 0.1, 0.035, 0.08],
    [-19.35, 0.048, -4.22, 0.13, 0.038, 0.09],
  ];
  pebbles.forEach(([x, y, z, w, h, d], index) => {
    ground.add(box(`Shrine gravel pebble ${index + 1}`, [w, h, d], [x, y, z], pebble));
  });

  return ground;
}

function createShrineGrove(needle, needleDark) {
  const grove = new THREE.Group();
  grove.name = 'Quiet shrine grove';

  const trunks = [
    [-16.85, -5.35, 0.18, 3.15],
    [-17.65, -5.75, 0.22, 3.85],
    [-16.25, -6.05, 0.16, 2.75],
    [-18.25, -6.25, 0.2, 3.45],
    [-16.55, -6.55, 0.17, 3.0],
  ];
  trunks.forEach(([x, z, radius, height], index) => {
    grove.add(
      box(
        `Shrine grove trunk ${index + 1}`,
        [radius, height, radius],
        [x, height / 2, z],
        needleDark,
      ),
      box(
        `Shrine grove canopy ${index + 1}`,
        [radius * 3.4, height * 0.55, radius * 3.1],
        [x, height * 0.78, z],
        index % 2 === 0 ? needle : needleDark,
      ),
    );
  });

  return grove;
}

function createPrecinctFence(wood, woodDark) {
  const fence = new THREE.Group();
  fence.name = 'Shrine precinct fence';

  const posts = [
    [-16.22, -3.52],
    [-16.92, -3.52],
    [-17.62, -3.52],
    [-18.32, -3.52],
    [-19.02, -3.52],
    [-19.18, -4.18],
    [-19.18, -4.88],
    [-19.18, -5.55],
    [-18.45, -5.82],
    [-17.65, -5.82],
    [-16.85, -5.82],
    [-16.05, -5.82],
    [-15.28, -5.82],
  ];
  posts.forEach(([x, z], index) => {
    fence.add(box(`Shrine fence post ${index + 1}`, [0.075, 0.82, 0.075], [x, 0.43, z], wood));
  });

  fence.add(
    box('Shrine fence street rail low', [2.92, 0.05, 0.045], [-17.62, 0.38, -3.52], woodDark),
    box('Shrine fence street rail high', [2.92, 0.05, 0.045], [-17.62, 0.68, -3.52], woodDark),
    box('Shrine fence street cap', [3.02, 0.05, 0.11], [-17.62, 0.86, -3.52], wood),
    box('Shrine fence left rail low', [0.045, 0.05, 2.18], [-19.18, 0.38, -4.67], woodDark),
    box('Shrine fence left rail high', [0.045, 0.05, 2.18], [-19.18, 0.68, -4.67], woodDark),
    box('Shrine fence left cap', [0.11, 0.05, 2.28], [-19.18, 0.86, -4.67], wood),
    box('Shrine fence back rail low', [3.82, 0.05, 0.045], [-17.23, 0.38, -5.82], woodDark),
    box('Shrine fence back rail high', [3.82, 0.05, 0.045], [-17.23, 0.68, -5.82], woodDark),
    box('Shrine fence back cap', [3.92, 0.05, 0.11], [-17.23, 0.86, -5.82], wood),
  );

  return fence;
}

export function createFarLeftShrineHint() {
  const wood = material(0x6e4238, { roughness: 0.78 });
  const woodDark = material(0x4c2c2a, { roughness: 0.82 });
  const roof = material(0x3a4146, { roughness: 0.88 });
  const stone = material(0x5c5e5c, { roughness: 0.92 });
  const gravel = material(weatherIsWet() ? 0x5e5952 : 0x7a7468, { roughness: 0.94 });
  const gravelShade = material(weatherIsWet() ? 0x4a4641 : 0x5c574f, { roughness: 0.95 });
  const pebble = material(weatherIsWet() ? 0x6a6560 : 0x827c72, { roughness: 0.9 });
  const ember = material(0xc49a62, {
    emissive: 0xc49a62,
    emissiveIntensity: 0.22,
    roughness: 0.7,
  });
  const needle = material(weatherIsWet() ? 0x4a6756 : 0x5a7866, {
    roughness: 0.88,
    emissive: 0x1c2e24,
    emissiveIntensity: 0.12,
  });
  const needleDark = material(weatherIsWet() ? 0x354a3e : 0x3a4c40, {
    roughness: 0.9,
    emissive: 0x121c16,
    emissiveIntensity: 0.08,
  });

  const shrine = new THREE.Group();
  shrine.name = 'Far left shrine hint';

  const kasagiLeft = box('Torii kasagi left lift', [0.3, 0.08, 0.16], [-16.14, 2.4, -3.94], wood);
  kasagiLeft.rotation.z = 0.22;
  const kasagiRight = box('Torii kasagi right lift', [0.3, 0.08, 0.16], [-14.36, 2.4, -3.94], wood);
  kasagiRight.rotation.z = -0.22;

  const roofLeft = box('Shrine roof left slope', [1.05, 0.08, 1.38], [-15.92, 1.32, -4.86], roof);
  roofLeft.rotation.z = 0.3;
  const roofRight = box('Shrine roof right slope', [1.05, 0.08, 1.38], [-14.98, 1.32, -4.86], roof);
  roofRight.rotation.z = -0.3;

  shrine.add(
    createPrecinctGround(gravel, gravelShade, pebble),
    createPrecinctFence(wood, woodDark),
    box('Torii left post', [0.12, 2.22, 0.12], [-15.8, 1.09, -3.94], wood),
    box('Torii right post', [0.12, 2.22, 0.12], [-14.7, 1.09, -3.94], wood),
    box('Torii nuki', [1.28, 0.07, 0.08], [-15.25, 1.58, -3.94], woodDark),
    box('Torii shimaki', [1.42, 0.06, 0.09], [-15.25, 2.1, -3.94], woodDark),
    box('Torii gakuzuka', [0.08, 0.22, 0.08], [-15.25, 2.22, -3.94], woodDark),
    box('Torii kasagi', [1.72, 0.12, 0.17], [-15.25, 2.28, -3.94], wood),
    kasagiLeft,
    kasagiRight,
    createShrineGrove(needle, needleDark),
    box('Shrine approach stone near', [0.62, 0.045, 0.48], [-13.72, 0.03, -2.58], stone),
    box('Shrine approach stone mid', [0.58, 0.045, 0.42], [-14.42, 0.032, -3.18], stone),
    box('Shrine approach stone far', [0.64, 0.05, 0.46], [-14.95, 0.034, -3.62], stone),
    box('Shrine stone path', [0.72, 0.05, 0.7], [-15.25, 0.055, -4.38], stone),
    box('Shrine stone base', [1.38, 0.14, 1.12], [-15.45, 0.08, -4.86], stone),
    box('Shrine hall', [1.02, 0.88, 0.92], [-15.45, 0.58, -4.86], woodDark),
    roofLeft,
    roofRight,
    box('Shrine roof ridge', [0.16, 0.1, 1.46], [-15.45, 1.46, -4.86], woodDark),
    box('Stone lantern post', [0.09, 0.48, 0.09], [-14.22, 0.25, -3.62], stone),
    box('Stone lantern firebox', [0.2, 0.16, 0.2], [-14.22, 0.54, -3.62], stone),
    box('Stone lantern ember', [0.07, 0.06, 0.07], [-14.22, 0.54, -3.52], ember),
    box('Stone lantern roof', [0.26, 0.06, 0.26], [-14.22, 0.66, -3.62], stone),
  );

  shrine.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  return shrine;
}
