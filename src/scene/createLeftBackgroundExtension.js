import * as THREE from 'three';
import { createFarLeftShrineHint } from './createFarLeftShrineHint.js';
import { box, branchBetween, material } from './primitives.js';

const VOLUMES = [
  {
    name: 'Left neighborhood near residence',
    bodySize: [2.9, 3.15, 2.1],
    bodyPosition: [-10.42, 1.425, -4],
    capSize: [3.05, 0.14, 2.25],
    tone: 'near',
  },
  {
    name: 'Left neighborhood middle residence',
    bodySize: [2.45, 3.38, 2.4],
    bodyPosition: [-13.22, 1.55, -5.22],
    capSize: [2.62, 0.13, 2.55],
    tone: 'far',
  },
];

const WINDOWS = [
  { name: 'upper', position: [-10.02, 1.87, -2.91], size: [0.72, 0.78] },
  { name: 'lower', position: [-10.8, 0.78, -2.91], size: [0.48, 0.55] },
];

function createVolume(definition, surfaces, integratedSurfaces) {
  const group = new THREE.Group();
  group.name = definition.name;
  const bodySurface = definition.tone === 'near'
    ? integratedSurfaces.nearBody
    : surfaces.farArchitecture;
  const capSurface = definition.tone === 'near'
    ? integratedSurfaces.nearCap
    : surfaces.farArchitectureShade;
  const capPosition = [
    definition.bodyPosition[0],
    definition.bodyPosition[1] + definition.bodySize[1] / 2 + definition.capSize[1] / 2,
    definition.bodyPosition[2],
  ];

  group.add(
    box(`${definition.name} body`, definition.bodySize, definition.bodyPosition, bodySurface),
    box(`${definition.name} roofline`, definition.capSize, capPosition, capSurface),
  );
  return group;
}

function createNearFacadeDetails(surfaces) {
  const details = new THREE.Group();
  details.name = 'Restrained left residence details';
  const curtain = material(0x3a4146, { roughness: 0.88 });

  WINDOWS.forEach((window) => {
    details.add(
      box(
        `Left residence ${window.name} window surround`,
        [window.size[0] + 0.16, window.size[1] + 0.14, 0.045],
        [window.position[0], window.position[1], window.position[2] - 0.025],
        surfaces.distantTrim,
      ),
      box(
        `Left residence ${window.name} inset window`,
        [window.size[0], window.size[1], 0.04],
        window.position,
        surfaces.distantWindow,
      ),
      box(
        `Left residence ${window.name} sill`,
        [window.size[0] + 0.22, 0.06, 0.12],
        [window.position[0], window.position[1] - window.size[1] * 0.52, window.position[2] + 0.04],
        surfaces.distantArchitectureShade,
      ),
    );
  });

  details.add(
    box('Left residence upper interior shade', [0.62, 0.68, 0.03], [-10.02, 1.87, -2.94], surfaces.windowDark),
    box('Left residence upper curtain left', [0.16, 0.62, 0.025], [-10.24, 1.86, -2.89], curtain),
    box('Left residence upper curtain right', [0.14, 0.58, 0.025], [-9.82, 1.84, -2.89], curtain),
    box('Left residence upper mullion', [0.035, 0.7, 0.03], [-10.02, 1.87, -2.88], surfaces.distantTrim),
  );

  details.add(
    box(
      'Left residence side window surround',
      [0.04, 0.84, 0.82],
      [-8.94, 1.38, -3.72],
      surfaces.distantTrim,
    ),
    box(
      'Left residence side inset window',
      [0.045, 0.68, 0.66],
      [-8.91, 1.38, -3.72],
      surfaces.distantWindow,
    ),
    box('Left residence side sill', [0.1, 0.06, 0.72], [-8.86, 1.02, -3.72], surfaces.distantArchitectureShade),
    box('Left residence door surround', [0.6, 1.32, 0.05], [-9.46, 0.66, -2.96], surfaces.distantTrim),
    box('Left residence door recess', [0.52, 1.22, 0.08], [-9.46, 0.64, -2.98], surfaces.distantArchitectureShade),
    box('Left residence door', [0.44, 1.12, 0.05], [-9.46, 0.64, -2.92], surfaces.windowDark),
    box('Left residence door step', [0.56, 0.06, 0.2], [-9.46, 0.03, -2.78], surfaces.pavementShade),
    box('Left residence door pull', [0.035, 0.14, 0.04], [-9.32, 0.64, -2.88], surfaces.metal),
  );

  return details;
}

function createStreetPlot(surfaces) {
  const plot = new THREE.Group();
  plot.name = 'Left street plot';

  plot.add(
    box('Left house front verge', [6.4, 0.05, 0.62], [-11.35, 0.028, -2.48], surfaces.grass),
    box('Left house plot lip', [6.55, 0.1, 0.12], [-11.35, 0.04, -2.16], surfaces.pavementShade),
    box('Left alley packed earth', [1.85, 0.055, 2.35], [-12.15, 0.03, -2.55], surfaces.soil),
  );

  return plot;
}

function createAlleyDetails(surfaces) {
  const alley = new THREE.Group();
  alley.name = 'Left residence alley';
  alley.add(
    box('Left residence utility plate', [0.24, 0.3, 0.06], [-11.93, 1.38, -3.38], surfaces.metal),
    box('Left residence utility inset', [0.12, 0.09, 0.035], [-11.91, 1.38, -3.34], surfaces.windowDark),
  );
  return alley;
}

function createMiddleFacadeDetails(surfaces) {
  const details = new THREE.Group();
  details.name = 'Middle residence facade';

  details.add(
    box('Middle residence window surround', [0.58, 0.68, 0.06], [-13.18, 2.08, -3.98], surfaces.distantTrim),
    box('Middle residence window', [0.42, 0.5, 0.04], [-13.18, 2.08, -3.92], surfaces.distantWindow),
    box('Middle residence window sill', [0.64, 0.055, 0.1], [-13.18, 1.78, -3.88], surfaces.distantArchitectureShade),
  );

  return details;
}

export function createLeftBackgroundExtension({ surfaces }) {
  const extension = new THREE.Group();
  extension.name = 'Grounded left neighborhood continuation';

  const integratedSurfaces = {
    // Lift the camera-facing shade without flattening this residence into the
    // brighter pavement or storefront.
    nearBody: material(0x818483, {
      emissive: 0x3a3e40,
      emissiveIntensity: 0.18,
      roughness: 0.94,
    }),
    nearCap: material(0x747878, {
      emissive: 0x2e3233,
      emissiveIntensity: 0.1,
      roughness: 0.95,
    }),
  };

  VOLUMES.forEach((definition) => {
    extension.add(createVolume(definition, surfaces, integratedSurfaces));
  });

  extension.add(
    box(
      'Left neighborhood alley recess',
      [0.48, 2.72, 0.55],
      [-12.08, 1.21, -5.72],
      surfaces.distantArchitectureShade,
    ),
    createNearFacadeDetails(surfaces),
    createStreetPlot(surfaces),
    createAlleyDetails(surfaces),
    createMiddleFacadeDetails(surfaces),
    createFarLeftShrineHint(),
    branchBetween(
      'Left neighborhood drainpipe',
      [-12.28, -0.12, -3.58],
      [-12.28, 2.92, -3.58],
      0.048,
      0.04,
      surfaces.distantTrim,
      6,
    ),
    box('Left residence gutter stub', [0.52, 0.06, 0.1], [-11.72, 3.02, -3.52], surfaces.distantTrim),
  );

  extension.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = true;
    }
  });

  return extension;
}
