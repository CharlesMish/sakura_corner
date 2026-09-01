import * as THREE from 'three';
import { ART_DIRECTION } from '../config.js';
import { box, branchBetween, material } from './primitives.js';

function createDownspout(_surfaces) {
  const spec = ART_DIRECTION.spout;
  const pipe = material(0x6a767e, { roughness: 0.52, metalness: 0.28 });
  const group = new THREE.Group();
  group.name = 'Right-wall downspout';

  group.add(
    box('Roof gutter', spec.gutter.size, spec.gutter.position, pipe),
    box('Downspout head', [0.2, 0.14, 0.16], spec.top, pipe),
    branchBetween(
      'Downspout riser',
      spec.top,
      spec.bottom,
      spec.radius[0],
      spec.radius[1],
      pipe,
      6,
    ),
    branchBetween(
      'Downspout elbow',
      spec.bottom,
      spec.outlet,
      spec.elbowRadius,
      spec.elbowRadius,
      pipe,
      6,
    ),
    box('Downspout outlet', [0.11, 0.06, 0.12], spec.outlet, pipe),
    box('Downspout shoe', [0.2, 0.055, 0.24], spec.shoe, pipe),
  );

  spec.straps.forEach((y, index) => {
    group.add(
      box(
        `Downspout strap ${index + 1}`,
        [0.12, 0.05, 0.08],
        [spec.top[0], y, spec.top[2] + 0.02],
        pipe,
      ),
    );
  });

  return group;
}

export function createRightWallDetails(surfaces) {
  const wall = new THREE.Group();
  wall.name = 'Lived-in right continuation wall';
  const spec = ART_DIRECTION.rightWall;

  const sconceGlow = new THREE.MeshStandardMaterial({
    color: spec.sconce.color,
    emissive: spec.sconce.emissive,
    emissiveIntensity: spec.sconce.emissiveIntensity,
    roughness: 0.55,
    metalness: 0.08,
    flatShading: true,
  });

  wall.add(
    createDownspout(surfaces),
    box('Right-wall meter box', spec.meter.size, spec.meter.position, surfaces.metal),
    box('Right-wall meter inset', spec.meter.insetSize, spec.meter.insetPosition, surfaces.windowDark),
    box('Right-wall service window surround', spec.window.surroundSize, spec.window.surroundPosition, surfaces.metal),
    box('Right-wall service window', spec.window.size, spec.window.position, surfaces.windowDark),
    box('Right-wall window sill', spec.window.sillSize, spec.window.sillPosition, surfaces.plasterShade),
    box('Right-wall AC cabinet', spec.ac.size, spec.ac.position, surfaces.metal),
    box('Right-wall AC grille', spec.ac.grilleSize, spec.ac.grillePosition, surfaces.windowDark),
    box('Right-wall sconce arm', spec.sconce.armSize, spec.sconce.armPosition, surfaces.metal),
    box('Right-wall sconce', spec.sconce.size, spec.sconce.position, sconceGlow),
  );

  return wall;
}
