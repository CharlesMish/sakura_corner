import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { weatherIsWet } from '../weatherMode.js';
import { createRightWallDetails } from './createDownspout.js';
import { createBackgroundGround } from './createBackgroundGround.js';
import { createDistantHills } from './createDistantHills.js';
import { createLeftHorizonFill } from './createLeftHorizonFill.js';
import { createLeftBackgroundExtension } from './createLeftBackgroundExtension.js';
import { box, branchBetween, material } from './primitives.js';
import { createRightBackgroundExtension } from './createRightBackgroundExtension.js';
import { createSleepNods } from './createSleepNods.js';
import { applyWetMaterial } from './wetSurfaces.js';
import { createRainContact } from './createRainContact.js';

const { palette } = ART_DIRECTION;
const transform = new THREE.Object3D();

function createHorizontalPatch(name, points, y, surface) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(points.flatMap(([x, z]) => [x, y, z]), 3),
  );
  const indices = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    indices.push(0, index, index + 1);
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const patch = new THREE.Mesh(geometry, surface);
  patch.name = name;
  patch.receiveShadow = true;
  return patch;
}

function createDrainGrates(surface) {
  const geometry = new THREE.BoxGeometry(0.38, 0.035, 0.29);
  const grates = new THREE.InstancedMesh(geometry, surface, 60);
  grates.name = 'Repeated drain covers';
  grates.receiveShadow = true;

  for (let index = 0; index < 60; index += 1) {
    const spacingOffset = [0, 0.012, -0.008, 0.018, -0.014][index % 5];
    transform.position.set(-15.2 + index * 0.51 + spacingOffset, -0.405, 3.77);
    transform.rotation.set(0, 0, 0);
    transform.scale.set(index % 11 === 0 ? 0.86 : 1, 1, index % 4 === 0 ? 0.78 : 1);
    transform.updateMatrix();
    grates.setMatrixAt(index, transform.matrix);
  }
  grates.instanceMatrix.needsUpdate = true;
  return grates;
}

function createCurbJoints(surface) {
  const positions = [-14.7, -11.35, -7.92, -4.2, -0.55, 3.28, 6.72, 10.38, 13.85];
  const joints = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.045, 0.035, 0.45),
    surface,
    positions.length,
  );
  joints.name = 'Irregular curb joints';
  joints.receiveShadow = true;
  positions.forEach((x, index) => {
    transform.position.set(x, -0.075, 3.35);
    transform.rotation.set(0, index % 3 === 0 ? 0.025 : -0.012, 0);
    transform.scale.set(index % 4 === 0 ? 1.3 : 1, 1, 1);
    transform.updateMatrix();
    joints.setMatrixAt(index, transform.matrix);
  });
  joints.instanceMatrix.needsUpdate = true;
  return joints;
}

function createSmallDebris(surface) {
  const placements = [
    [-2.62, 0.018, 1.72, 0.07],
    [-2.38, 0.012, 1.83, 0.045],
    [-0.32, 0.012, 2.55, 0.052],
    [0.12, 0.014, 2.61, 0.035],
    [1.76, 0.015, -0.64, 0.055],
    [2.02, 0.012, -0.72, 0.034],
    [-4.76, 0.014, -1.55, 0.048],
  ];
  const debris = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    surface,
    placements.length,
  );
  debris.name = 'Sparse pavement stones';
  debris.castShadow = true;
  placements.forEach(([x, y, z, scale], index) => {
    transform.position.set(x, y, z);
    transform.rotation.set(index * 0.71, index * 1.13, index * 0.37);
    transform.scale.set(scale, scale * 0.55, scale * 0.82);
    transform.updateMatrix();
    debris.setMatrixAt(index, transform.matrix);
  });
  debris.instanceMatrix.needsUpdate = true;
  return debris;
}

function createWeeds(surface) {
  const geometry = new THREE.ConeGeometry(0.055, 0.48, 3);
  const placements = [
    [-6.05, 0.2, 2.58, -0.18, 0.92],
    [-4.55, 0.16, 2.64, 0.16, 0.72],
    [-3.15, 0.18, 2.52, -0.14, 0.8],
    [-1.55, 0.15, 2.6, 0.2, 0.66],
    [-9.58, 0.16, 2.8, 0.16, 0.78],
    [-7.42, 0.2, 2.68, -0.12, 0.88],
    [-7.18, 0.15, 2.78, 0.2, 0.68],
    [-5.55, 0.18, 2.7, -0.18, 0.82],
    [-4.22, 0.14, 1.18, 0.14, 0.62],
    [-6.85, 0.16, 0.42, -0.2, 0.7],
    [-8.15, 0.2, -0.22, 0.22, 0.9],
    [-0.88, 0.16, 2.62, -0.16, 0.74],
    [0.42, 0.15, 2.58, 0.18, 0.64],
    [-3.02, 0.2, 2.42, -0.24, 0.92],
    [-2.82, 0.15, 2.5, 0.18, 0.72],
    [-2.67, 0.12, 2.39, -0.08, 0.58],
    [-3.85, 0.22, -1.62, 0.2, 0.95],
    [-3.55, 0.16, -1.48, -0.16, 0.72],
    [-4.55, 0.18, -1.72, 0.12, 0.8],
    [-2.95, 0.14, -0.55, 0.18, 0.62],
    [-2.15, 0.12, -0.22, -0.2, 0.55],
    [-4.96, 0.13, -1.88, -0.18, 0.58],
    [-0.42, 0.13, -2.03, -0.1, 0.62],
    [-0.22, 0.17, -1.96, 0.25, 0.78],
    [0.02, 0.11, -2.08, -0.15, 0.5],
    [-2.07, 0.12, 0.74, 0.34, 0.48],
    [-0.66, 0.1, -0.38, -0.28, 0.42],
  ];
  const weeds = new THREE.InstancedMesh(geometry, surface, placements.length);
  weeds.name = 'Sparse weed tufts';
  weeds.castShadow = true;

  function update(elapsed = 0) {
    const { weedSwayAmplitude, weedSwayFrequency, windStrength } = ART_DIRECTION.motion;
    placements.forEach(([x, y, z, lean, scale], index) => {
      const sway =
        Math.sin(elapsed * weedSwayFrequency + index * 1.83) *
        weedSwayAmplitude * windStrength * scale;
      transform.position.set(x, y, z);
      transform.rotation.set(lean + sway, index * 1.7, lean * 0.45 + sway * 0.35);
      transform.scale.set(scale, scale, scale);
      transform.updateMatrix();
      weeds.setMatrixAt(index, transform.matrix);
    });
    weeds.instanceMatrix.needsUpdate = true;
  }
  update();
  return { mesh: weeds, update };
}

function createSaggingWire(name, start, end, slack, surfaces) {
  const p0 = new THREE.Vector3(...start);
  const p2 = new THREE.Vector3(...end);
  const p1 = new THREE.Vector3(
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 - slack * 2,
    (start[2] + end[2]) / 2,
  );
  const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
  const wire = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 32, 0.02, 5, false),
    surfaces.utilityWire,
  );
  wire.name = name;
  wire.castShadow = true;
  return wire;
}

function createUtilityFraming(surfaces) {
  const utility = new THREE.Group();
  utility.name = 'Utility framing';

  utility.add(
    branchBetween(
      'Tapered utility pole',
      [6.3, -0.02, -0.9],
      [6.15, 8.72, -1.05],
      0.2,
      0.125,
      surfaces.utilityPole,
      9,
    ),
    box('Simple crossarm', [1.25, 0.13, 0.16], [6.15, 8.38, -1.02], surfaces.utilityPole),
  );

  const farPole = branchBetween(
    'Far neighborhood utility pole',
    [-12.68, -0.02, -3.12],
    [-12.76, 8.55, -3.22],
    0.15,
    0.1,
    surfaces.utilityPole,
    8,
  );
  farPole.castShadow = false;
  utility.add(farPole);

  const insulatorGeometry = new THREE.CylinderGeometry(0.065, 0.08, 0.18, 8);
  const nearInsulators = [
    [5.73, 8.48, -1.02],
    [6.57, 8.48, -1.02],
  ];
  nearInsulators.forEach((position, index) => {
    const insulator = new THREE.Mesh(insulatorGeometry, surfaces.insulator);
    insulator.name = `Pole insulator ${index + 1}`;
    insulator.position.set(...position);
    insulator.castShadow = true;
    utility.add(insulator);
  });

  utility.add(
    createSaggingWire(
      'Street-side overhead wire',
      [6.57, 8.48, -1.02],
      [-12.4, 8.42, -3.2],
      0.12,
      surfaces,
    ),
  );

  return utility;
}

function createSecondaryBackground(surfaces) {
  const background = new THREE.Group();
  background.name = 'Restrained secondary architecture behind tree';

  const plots = [
    {
      name: 'Behind-tree plot left',
      size: [3.45, 3.35, 2.25],
      position: [-6.85, 1.525, -5.78],
      capSize: [3.62, 0.16, 2.42],
    },
    {
      name: 'Behind-tree plot middle',
      size: [3.15, 2.55, 2.15],
      position: [-3.35, 1.125, -5.82],
      capSize: [3.3, 0.14, 2.32],
    },
    {
      name: 'Behind-tree plot right',
      size: [3.55, 2.92, 2.2],
      position: [0.05, 1.31, -5.76],
      capSize: [3.72, 0.15, 2.38],
    },
  ];

  plots.forEach((plot) => {
    const capPosition = [
      plot.position[0],
      plot.position[1] + plot.size[1] / 2 + plot.capSize[1] / 2,
      plot.position[2],
    ];
    background.add(
      box(`${plot.name} body`, plot.size, plot.position, surfaces.distantArchitecture),
      box(`${plot.name} roof`, plot.capSize, capPosition, surfaces.distantArchitectureShade),
    );
  });

  background.add(
    box(
      'Distant building shaded return',
      [0.55, 3.42, 2.7],
      [-8.65, 1.56, -5.55],
      surfaces.distantArchitectureShade,
    ),
  );

  const windows = [
    [-7.42, 2.05, 0.7, 0.58],
    [-6.38, 1.45, 1.14, 0.74],
    [-3.82, 1.36, 0.92, 0.62],
    [-1.28, 1.5, 1.22, 0.7],
    [0.72, 1.62, 0.78, 0.52],
  ];
  windows.forEach(([x, y, width, height], index) => {
    background.add(
      box(
        `Distant window surround ${index + 1}`,
        [width + 0.18, height + 0.16, 0.09],
        [x, y, -4.63],
        surfaces.distantTrim,
      ),
      box(
        `Distant inset window ${index + 1}`,
        [width, height, 0.045],
        [x, y, -4.56],
        surfaces.distantWindow,
      ),
      box(
        `Distant window sill ${index + 1}`,
        [width + 0.22, 0.07, 0.16],
        [x, y - height * 0.52, -4.53],
        surfaces.distantArchitectureShade,
      ),
    );
  });

  background.add(
    box('Distant facade seam left', [0.06, 2.85, 0.07], [-5.15, 1.35, -4.65], surfaces.distantArchitectureShade),
    box('Distant facade seam right', [0.05, 2.55, 0.07], [-1.75, 1.22, -4.65], surfaces.distantArchitectureShade),
    branchBetween(
      'Distant drainpipe',
      [0.82, 0.03, -4.58],
      [0.82, 2.72, -4.58],
      0.052,
      0.045,
      surfaces.distantTrim,
      8,
    ),
    box('Distant restrained vent', [0.58, 0.34, 0.09], [-7.72, 0.7, -4.58], surfaces.distantArchitectureShade),
    box('Distant vent inset', [0.38, 0.08, 0.045], [-7.72, 0.7, -4.51], surfaces.distantWindow),
    box('Rooftop stairwell fragment', [1.58, 1.04, 1.28], [-5.72, 3.18, -6.35], surfaces.distantArchitectureShade),
    box('Rooftop stairwell cap', [1.76, 0.12, 1.42], [-5.7, 3.75, -6.34], surfaces.distantTrim),
    box('Short rooftop rail', [2.15, 0.055, 0.055], [-3.55, 3.02, -4.62], surfaces.distantTrim),
    box('Rooftop rail post left', [0.05, 0.52, 0.05], [-4.48, 2.78, -4.62], surfaces.distantTrim),
    box('Rooftop rail post center', [0.05, 0.44, 0.05], [-3.55, 2.82, -4.62], surfaces.distantTrim),
    box('Rooftop rail post right', [0.05, 0.5, 0.05], [-2.62, 2.79, -4.62], surfaces.distantTrim),
  );

  const condenser = new THREE.Group();
  condenser.name = 'Muted background AC condenser';
  condenser.add(
    box('Condenser cabinet', [0.76, 0.52, 0.25], [-2.45, 0.78, -4.47], surfaces.distantTrim),
    box('Condenser shadow recess', [0.48, 0.3, 0.04], [-2.45, 0.78, -4.31], surfaces.distantArchitectureShade),
    box('Condenser grille bar upper', [0.38, 0.035, 0.035], [-2.45, 0.85, -4.27], surfaces.distantWindow),
    box('Condenser grille bar lower', [0.38, 0.035, 0.035], [-2.45, 0.7, -4.27], surfaces.distantWindow),
  );
  background.add(condenser);
  return background;
}

function createFarNeighborhood(surfaces) {
  const far = new THREE.Group();
  far.name = 'Far hazed neighborhood silhouette';
  far.add(
    box('Far left facade crop', [4.6, 3.05, 2.1], [-11.15, 1.38, -7.92], surfaces.farArchitecture),
    box('Far left roofline', [4.85, 0.12, 2.26], [-11.12, 2.96, -7.91], surfaces.farArchitectureShade),
    box('Far stair tower', [1.85, 3.15, 1.85], [-8.55, 1.42, -9.05], surfaces.farArchitectureShade),
    box('Far stair tower cap', [2.08, 0.12, 2.02], [-8.53, 3.06, -9.04], surfaces.farArchitecture),
    box('Far stair tower window', [0.38, 0.52, 0.05], [-8.55, 2.12, -8.1], surfaces.farWindow),
    box('Far low roof mass', [5.2, 2.15, 2], [-5.45, 0.94, -9.55], surfaces.farArchitecture),
    box('Far low parapet', [5.4, 0.13, 2.14], [-5.43, 2.08, -9.54], surfaces.farArchitectureShade),
    box('Far rooftop utility mass', [1.08, 0.62, 0.9], [-12.15, 3.55, -7.72], surfaces.farArchitectureShade),
    box('Far window grouping left', [1.35, 0.44, 0.05], [-11.35, 1.55, -6.77], surfaces.farWindow),
    box('Far window grouping right', [1.18, 0.38, 0.05], [-9.55, 1.45, -6.77], surfaces.farWindow),
    box('Far street-end house', [3.15, 2.85, 1.95], [-16.15, 1.28, -7.55], surfaces.farArchitecture),
    box('Far street-end roof', [3.35, 0.12, 2.12], [-16.12, 2.76, -7.54], surfaces.farArchitectureShade),
    box('Far street-end window', [0.72, 0.4, 0.05], [-15.95, 1.55, -6.55], surfaces.farWindow),
    box('Far left workshop', [2.35, 1.55, 1.7], [-17.85, 0.68, -6.45], surfaces.farArchitectureShade),
    box('Far left workshop roof', [2.7, 0.12, 1.95], [-17.82, 1.52, -6.44], surfaces.farArchitecture),
    box('Far left street house', [2.7, 2.15, 1.7], [-18.15, 0.98, -5.15], surfaces.farArchitecture),
    box('Far left street window', [0.55, 0.38, 0.05], [-17.85, 1.18, -4.28], surfaces.farWindow),
    box('Far left ridge apartment', [3.2, 2.25, 1.85], [-13.85, 1.02, -10.05], surfaces.farArchitectureShade),
    box('Far left ridge cap', [3.4, 0.12, 2.0], [-13.82, 2.2, -10.04], surfaces.farArchitecture),
    box('Far left ridge window', [0.52, 0.36, 0.05], [-13.45, 1.28, -8.95], surfaces.farWindow),
  );
  const houseRoofLeft = box(
    'Far left street roof left',
    [1.65, 0.1, 1.95],
    [-18.78, 2.28, -5.14],
    surfaces.farArchitectureShade,
  );
  houseRoofLeft.rotation.z = 0.34;
  const houseRoofRight = box(
    'Far left street roof right',
    [1.65, 0.1, 1.95],
    [-17.52, 2.28, -5.14],
    surfaces.farArchitectureShade,
  );
  houseRoofRight.rotation.z = -0.34;
  far.add(
    houseRoofLeft,
    houseRoofRight,
    box('Far left street roof ridge', [0.14, 0.12, 2.02], [-18.15, 2.52, -5.14], surfaces.farArchitecture),
  );
  far.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });
  return far;
}

function createTuckedBicycle(surfaces) {
  const bicycle = new THREE.Group();
  bicycle.name = 'Tucked partial bicycle silhouette';
  const rearHub = [-4.76, 0.43, -1.67];
  const frontHub = [-3.82, 0.43, -1.67];
  const crank = [-4.28, 0.43, -1.64];
  const seatJoint = [-4.45, 0.86, -1.64];
  const handleJoint = [-3.98, 0.9, -1.64];

  [rearHub, frontHub].forEach((position, index) => {
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.034, 6, 14),
      surfaces.wire,
    );
    wheel.name = `Bicycle wheel ${index + 1}`;
    wheel.position.set(...position);
    wheel.rotation.y = -0.05;
    wheel.castShadow = true;
    bicycle.add(wheel);
  });

  [
    [rearHub, crank],
    [rearHub, seatJoint],
    [crank, seatJoint],
    [crank, handleJoint],
    [handleJoint, frontHub],
    [seatJoint, handleJoint],
  ].forEach(([start, end], index) => {
    bicycle.add(
      branchBetween(
        `Bicycle frame tube ${index + 1}`,
        start,
        end,
        0.026,
        0.023,
        surfaces.bicycle,
        6,
      ),
    );
  });

  bicycle.add(
    branchBetween('Bicycle seat post', seatJoint, [-4.48, 1.01, -1.64], 0.026, 0.021, surfaces.bicycle, 6),
    branchBetween('Bicycle handle stem', handleJoint, [-3.91, 1.08, -1.64], 0.025, 0.02, surfaces.bicycle, 6),
    box('Bicycle saddle', [0.24, 0.065, 0.12], [-4.51, 1.04, -1.64], surfaces.windowDark),
    box('Bicycle handlebar', [0.3, 0.045, 0.055], [-3.88, 1.09, -1.64], surfaces.bicycle),
  );
  return bicycle;
}

export function createEnvironment() {
  const world = new THREE.Group();
  world.name = 'Urban world slice';

  const surfaces = {
    pavement: material(palette.pavement),
    pavementLight: material(palette.pavementLight),
    pavementCool: material(palette.pavementCool),
    pavementShade: material(palette.pavementShade),
    pavementEdge: material(palette.pavementEdge),
    road: material(palette.road),
    roadLight: material(palette.roadLight),
    roadShade: material(palette.roadShade),
    marking: material(palette.roadMarking, {
      emissive: palette.roadMarking,
      emissiveIntensity: weatherIsWet() ? 0.07 : 0.02,
    }),
    plaster: material(palette.plaster),
    plasterShade: material(palette.plasterShade),
    plasterRoof: material(
      ART_DIRECTION.shopMass.useSeparatedPlanes ? palette.plasterRoof : palette.plasterShade,
    ),
    plasterContinuation: material(
      ART_DIRECTION.shopMass.useSeparatedPlanes
        ? palette.plasterContinuation
        : palette.plasterShade,
    ),
    distantArchitecture: material(palette.distantArchitecture),
    distantArchitectureShade: material(palette.distantArchitectureShade),
    distantTrim: material(palette.distantTrim, { roughness: 0.86 }),
    distantWindow: material(palette.distantWindow, { roughness: 0.82 }),
    farArchitecture: material(palette.farArchitecture, { roughness: 0.94 }),
    farArchitectureShade: material(palette.farArchitectureShade, { roughness: 0.94 }),
    farWindow: material(palette.farWindow, { roughness: 0.9 }),
    window: material(palette.window, {
      roughness: 0.24,
      metalness: 0.04,
      transparent: true,
      opacity: 0.72,
    }),
    windowDark: material(palette.windowDark, { roughness: 0.38 }),
    glow: material(palette.windowGlow, {
      emissive: palette.windowGlow,
      emissiveIntensity: ART_DIRECTION.lighting.windowEmissiveIntensity,
      roughness: 0.45,
    }),
    signFace: material(palette.signFace, {
      emissive: palette.signFace,
      emissiveIntensity: 0.1,
    }),
    signAccent: material(palette.signAccent),
    metal: material(palette.metal, { roughness: 0.68, metalness: 0.16 }),
    wire: material(0x22282c, { roughness: 0.78, metalness: 0.08 }),
    utilityPole: material(weatherIsWet() ? palette.metal : 0x6c6862, {
      roughness: weatherIsWet() ? 0.68 : 0.76,
      metalness: weatherIsWet() ? 0.16 : 0.08,
    }),
    utilityWire: material(weatherIsWet() ? 0x22282c : 0x7a7670, {
      roughness: weatherIsWet() ? 0.78 : 0.88,
      metalness: weatherIsWet() ? 0.08 : 0.03,
    }),
    bicycle: material(0x465156, { roughness: 0.72, metalness: 0.14 }),
    insulator: material(0xb6b0a2, { roughness: 0.55 }),
    soil: material(0x4a4139),
    grass: material(palette.grass),
    debris: material(0x716e68),
  };

  if (weatherIsWet()) {
    applyWetMaterial(surfaces.pavement, 'pavement');
    applyWetMaterial(surfaces.pavementLight, 'pavement');
    applyWetMaterial(surfaces.pavementCool, 'pavement');
    applyWetMaterial(surfaces.pavementShade, 'pavement');
    applyWetMaterial(surfaces.pavementEdge, 'pavement');
    applyWetMaterial(surfaces.road, 'road');
    applyWetMaterial(surfaces.roadLight, 'road');
    applyWetMaterial(surfaces.roadShade, 'road');
    applyWetMaterial(surfaces.plaster, 'mass');
    applyWetMaterial(surfaces.plasterShade, 'mass');
    applyWetMaterial(surfaces.plasterRoof, 'mass');
    applyWetMaterial(surfaces.plasterContinuation, 'mass');
    applyWetMaterial(surfaces.window, 'window');
    applyWetMaterial(surfaces.metal, 'metal');
    applyWetMaterial(surfaces.wire, 'metal');
    applyWetMaterial(surfaces.utilityPole, 'metal');
    applyWetMaterial(surfaces.utilityWire, 'metal');
    applyWetMaterial(surfaces.bicycle, 'metal');
    applyWetMaterial(surfaces.soil, 'soil');
    applyWetMaterial(surfaces.grass, 'grass');
    applyWetMaterial(surfaces.debris, 'mass');
    surfaces.glow.emissiveIntensity = ART_DIRECTION.lighting.wet.windowEmissiveIntensity;
    surfaces.window.opacity = 0.58;
  }

  world.add(
    box('Sidewalk slab', [70, 0.32, 55], [0, -0.18, -21.5], surfaces.pavement),
    box('Curb', [36, 0.5, 0.42], [0, -0.34, 3.35], surfaces.pavementEdge),
    createCurbJoints(surfaces.pavementShade),
    box('Drain channel', [36, 0.18, 0.5], [0, -0.51, 3.78], surfaces.metal),
    createDrainGrates(surfaces.pavementShade),
    box('Road', [70, 0.35, 45], [0, -0.7, 24], surfaces.road),
    createHorizontalPatch(
      'Broad sun-worn asphalt variation',
      [[-14, 4.05], [-9.2, 11.5], [6.4, 10.2], [-1.1, 4.2]],
      -0.518,
      surfaces.roadLight,
    ),
    createHorizontalPatch(
      'Distant asphalt value band',
      [[2.1, 10.2], [-2.2, 18.5], [13.4, 17.4], [15.2, 9.2]],
      -0.517,
      surfaces.roadShade,
    ),
    box('Road curb groove', [22, 0.02, 0.08], [-1.2, -0.5, 4.12], surfaces.pavementShade),
  );

  const pavementDetails = new THREE.Group();
  pavementDetails.name = 'Quiet pavement variation';
  pavementDetails.add(
    box('Cool left pavement slab', [3.15, 0.018, 2.05], [-4.86, -0.008, 0.72], surfaces.pavementCool),
    box('Far left pavement slab', [3.8, 0.016, 2.2], [-8.65, -0.007, 0.85], surfaces.pavementShade),
    box('Faded central pavement slab', [2.55, 0.016, 1.62], [-1.47, -0.007, -1.18], surfaces.pavementLight),
    box('Shop threshold pavement slab', [3.65, 0.018, 1.12], [3.6, -0.008, -0.87], surfaces.pavementCool),
    box('Lighter pavement repair', [2.8, 0.018, 1.55], [1.28, -0.008, 1.22], surfaces.pavementLight),
    box('Long pavement seam', [0.05, 0.028, 5.65], [-3.35, 0.004, 0.32], surfaces.pavementShade),
    box('Left sidewalk long joint', [10.2, 0.03, 0.055], [-7.85, 0.005, 1.62], surfaces.pavementShade),
    box('Left sidewalk paint line', [9.4, 0.016, 0.07], [-6.85, 0.01, 2.72], surfaces.marking),
    box('Left sidewalk outer joint', [9.1, 0.028, 0.05], [-8.45, 0.005, 2.52], surfaces.pavementEdge),
    box('Left sidewalk cross joint', [0.055, 0.028, 3.65], [-5.92, 0.005, 1.28], surfaces.pavementShade),
    box('Far left sidewalk cross joint', [0.05, 0.028, 3.3], [-9.35, 0.005, 1.15], surfaces.pavementShade),
    box('Mid-left sidewalk joint', [0.048, 0.028, 3.05], [-7.62, 0.005, 0.22], surfaces.pavementShade),
    box('Mid sidewalk joint by wall', [3.4, 0.026, 0.045], [-3.15, 0.004, -0.85], surfaces.pavementShade),
    box('Store utility access cover', [0.86, 0.026, 0.62], [4.25, 0.004, 0.15], surfaces.metal),
    box('Left sidewalk cover', [0.62, 0.024, 0.48], [-6.85, 0.004, 0.92], surfaces.metal),
    box('Left sidewalk cover inset', [0.4, 0.028, 0.04], [-6.85, 0.01, 0.92], surfaces.pavementShade),
    box('Access cover inset', [0.58, 0.029, 0.045], [4.25, 0.011, 0.15], surfaces.pavementShade),
    box('Faded curb wear left', [1.15, 0.028, 0.09], [-4.95, -0.075, 3.13], surfaces.pavementShade),
    box('Faded curb wear far left', [1.55, 0.026, 0.085], [-9.15, -0.074, 3.13], surfaces.pavementShade),
    box('Faded curb wear center', [0.72, 0.026, 0.085], [0.62, -0.074, 3.13], surfaces.pavementShade),
    box('Faded curb wear right', [1.38, 0.027, 0.09], [5.46, -0.075, 3.13], surfaces.pavementShade),
  );
  const crackA = box('Small pavement crack', [1.05, 0.026, 0.035], [-2.05, 0.012, 1.12], surfaces.pavementShade);
  crackA.rotation.y = 0.42;
  const crackB = box('Fine pavement crack', [0.72, 0.024, 0.03], [0.08, 0.012, -0.72], surfaces.pavementShade);
  crackB.rotation.y = -0.68;
  pavementDetails.add(crackA, crackB);
  world.add(pavementDetails, createSmallDebris(surfaces.debris));

  const treeCutout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.02, 0.12, 9),
    surfaces.soil,
  );
  treeCutout.name = 'Irregular tree pavement cutout';
  treeCutout.position.set(-1.35, 0.025, 0.15);
  treeCutout.scale.z = 0.76;
  treeCutout.receiveShadow = true;
  world.add(treeCutout);

  const soilVariation = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.62, 0.035, 7),
    material(0x55483e),
  );
  soilVariation.name = 'Subtle disturbed soil around trunk';
  soilVariation.position.set(-1.48, 0.095, 0.12);
  soilVariation.scale.z = 0.68;
  soilVariation.receiveShadow = true;
  world.add(soilVariation);

  const building = new THREE.Group();
  building.name = 'Small fictional neighborhood shop edge';
  building.add(
    box('Building body', [5.65, 5.45, 3.1], [3.8, 2.33, -3.25], surfaces.plaster),
    box('Building side return', [0.55, 5.68, 4.4], [6.55, 2.42, -2.7], surfaces.plasterShade),
    box('Building cap', [5.95, 0.25, 3.38], [3.76, 5.16, -3.23], surfaces.plasterRoof),
    box('Recessed shop window', [2.62, 2.08, 0.13], [3.36, 1.5, -1.61], surfaces.windowDark),
    box('Warm interior plane', [1.17, 1.7, 0.045], [2.86, 1.52, -1.53], surfaces.glow),
    box('Warm window glass', [1.16, 1.68, 0.035], [2.86, 1.52, -1.43], surfaces.window),
    box('Interior counter silhouette', [1.02, 0.18, 0.055], [2.86, 1.05, -1.48], surfaces.windowDark),
    box('Interior shelf silhouette', [0.82, 0.065, 0.052], [2.92, 1.52, -1.48], surfaces.windowDark),
    box('Interior shelf upright', [0.065, 0.72, 0.052], [2.61, 1.43, -1.48], surfaces.windowDark),
    box('Cool window plane', [1.04, 1.7, 0.05], [4.02, 1.52, -1.52], surfaces.window),
    box('Window left reveal', [0.13, 2.28, 0.32], [1.98, 1.5, -1.47], surfaces.plasterShade),
    box('Window right reveal', [0.13, 2.28, 0.32], [4.73, 1.5, -1.47], surfaces.plasterShade),
    box('Window upper reveal', [2.86, 0.13, 0.32], [3.35, 2.62, -1.47], surfaces.plasterShade),
    box('Window left frame', [0.11, 2.24, 0.19], [2.01, 1.51, -1.49], surfaces.metal),
    box('Window center frame', [0.09, 2.15, 0.19], [3.46, 1.51, -1.48], surfaces.metal),
    box('Window right frame', [0.11, 2.24, 0.19], [4.7, 1.51, -1.49], surfaces.metal),
    box('Window top frame', [2.8, 0.11, 0.19], [3.36, 2.58, -1.49], surfaces.metal),
    box('Window sill', [2.8, 0.14, 0.23], [3.36, 0.43, -1.47], surfaces.plasterShade),
    box('Glass entry door', [1.02, 2.17, 0.12], [5.34, 1.47, -1.58], surfaces.window),
    box('Door lower panel', [1.03, 0.6, 0.18], [5.34, 0.67, -1.49], surfaces.metal),
    box('Door interior shadow', [0.86, 1.42, 0.05], [5.34, 1.59, -1.65], surfaces.windowDark),
    box('Door pull', [0.055, 0.55, 0.08], [5.02, 1.55, -1.42], surfaces.signFace),
    box('Unbranded door notice', [0.27, 0.35, 0.025], [5.51, 1.78, -1.38], surfaces.signFace),
    box('Door notice color tab', [0.18, 0.045, 0.03], [5.51, 1.84, -1.35], surfaces.signAccent),
    box('Shop entry threshold', [1.22, 0.09, 0.58], [5.33, 0.025, -1.13], surfaces.pavementLight),
    box('Storefront base trim', [4.72, 0.24, 0.16], [3.84, 0.11, -1.53], surfaces.plasterShade),
    box('Fascia underside shadow', [4.8, 0.12, 0.62], [3.84, 2.78, -1.57], surfaces.plasterShade),
    box('Shop fascia', [4.62, 0.52, 0.42], [3.83, 3.03, -1.5], surfaces.signFace),
    box('Fictional fascia accent', [4.68, 0.12, 0.46], [3.83, 3.16, -1.47], surfaces.signAccent),
    box('Building continuation beyond frame', [4.3, 5.45, 4.2], [8.25, 2.33, -3.8], surfaces.plasterContinuation),
    box('Continuation roof cap', [4.55, 0.25, 4.48], [8.2, 5.16, -3.78], surfaces.plasterRoof),
    box('Small wall utility plate', [0.44, 0.34, 0.12], [5.97, 2.38, -1.5], surfaces.metal),
    box('Utility plate inset', [0.24, 0.07, 0.05], [5.97, 2.38, -1.42], surfaces.windowDark),
    box('Wall utility conduit', [0.065, 1.78, 0.07], [5.97, 1.32, -1.43], surfaces.metal),
    createRightWallDetails(surfaces),
  );
  if (weatherIsWet()) {
    [
      box('Warm glass rain streak left', [0.035, 0.82, 0.02], [2.58, 1.62, -1.4], surfaces.windowDark),
      box('Warm glass rain streak right', [0.028, 0.54, 0.02], [3.08, 1.38, -1.4], surfaces.windowDark),
      box('Cool glass rain streak', [0.03, 0.7, 0.02], [4.18, 1.55, -1.49], surfaces.windowDark),
      box('Door glass rain streak', [0.028, 0.62, 0.02], [5.18, 1.72, -1.5], surfaces.windowDark),
    ].forEach((streak) => {
      streak.castShadow = false;
      building.add(streak);
    });
  }
  world.add(building);

  const sign = new THREE.Group();
  sign.name = 'Restrained neighborhood signboard';
  sign.add(
    box('Sign wall bracket', [0.92, 0.1, 0.12], [5.77, 4.03, -1.45], surfaces.metal),
    box('Sign hanger', [0.1, 0.58, 0.1], [5.36, 3.78, -1.43], surfaces.metal),
    box('Sign face', [0.86, 1.05, 0.16], [5.36, 3.45, -1.36], surfaces.signFace),
    box('Sign color block', [0.6, 0.18, 0.19], [5.36, 3.58, -1.26], surfaces.signAccent),
  );
  world.add(sign);

  const lowWall = new THREE.Group();
  lowWall.name = 'Low boundary wall';
  lowWall.add(
    box('Low wall', [3.8, 1.18, 0.42], [-4.2, 0.42, -2.15], surfaces.plasterShade),
    box('Wall cap', [4.05, 0.17, 0.57], [-4.2, 1.08, -2.15], surfaces.pavementLight),
    box('Small utility cabinet', [0.62, 0.82, 0.38], [-2.55, 0.39, -1.88], surfaces.metal),
  );
  const weeds = createWeeds(surfaces.grass);
  const sleepNods = createSleepNods();
  world.add(
    createBackgroundGround(),
    createDistantHills(),
    createLeftHorizonFill(),
    createFarNeighborhood(surfaces),
    createSecondaryBackground(surfaces),
    createLeftBackgroundExtension({ surfaces }),
    createRightBackgroundExtension({ surfaces }),
    lowWall,
    createTuckedBicycle(surfaces),
    createUtilityFraming(surfaces),
    weeds.mesh,
  );
  if (sleepNods) world.add(sleepNods.group);

  const rainContact = createRainContact();
  if (rainContact) world.add(rainContact);

  return {
    group: world,
    update(elapsed) {
      weeds.update(elapsed);
      sleepNods?.update(elapsed);
    },
  };
}
