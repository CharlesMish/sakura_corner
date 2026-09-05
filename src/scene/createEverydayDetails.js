import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import letteringUrl from '../assets/everyday/shop-lettering.png';
import noticeUrl from '../assets/everyday/delivery-notice.png';
import roofUrl from '../assets/everyday/roof-felt.png';

function texture(url) {
  const map = new THREE.TextureLoader().load(url);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.anisotropy = 4;
  return map;
}

function group(name) {
  const result = new THREE.Group();
  result.name = `Everyday: ${name}`;
  return result;
}

function batch(parent, name, material, pieces) {
  const mesh = new THREE.Mesh(mergeGeometries(pieces), material);
  pieces.forEach(piece => piece.dispose());
  mesh.name = name;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function block(size, position) {
  return new THREE.BoxGeometry(...size).translate(...position);
}

export function addShopEverydayDetails(building) {
  const identity = group('shop identity');
  const paint = new THREE.MeshStandardMaterial({ map: texture(letteringUrl), transparent: true,
    depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 0.32), paint);
  letters.position.set(3.62, 2.957, -1.288);
  letters.name = 'Faded painted こかげ商店';
  identity.add(letters);

  const notice = group('delivery notice');
  const paper = building.getObjectByName('Unbranded door notice');
  const tab = building.getObjectByName('Door notice color tab');
  tab.removeFromParent();
  notice.add(paper);
  paper.name = 'Aged delivery notice backing';
  const print = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.35),
    new THREE.MeshStandardMaterial({ map: texture(noticeUrl), roughness: 1 }));
  print.name = 'Delivery heading and short printed lines';
  print.position.set(5.51, 1.78, -1.366);
  notice.add(print);

  const crate = group('bottle return');
  // Base touches the sidewalk; service corner remains outside the threshold.
  crate.position.set(6.11, -0.018, -0.95);
  crate.scale.x = 0.65;
  const wood = new THREE.MeshStandardMaterial({ color: 0x555346, roughness: 1 });
  const boards = [block([0.48, 0.035, 0.34], [0, 0.0175, 0])];
  for (const y of [0.09, 0.2]) {
    for (const z of [-0.153, 0.153]) boards.push(block([0.48, 0.075, 0.035], [0, y, z]));
    for (const x of [-0.223, 0.223]) boards.push(block([0.035, 0.075, 0.3], [x, y, 0]));
  }
  for (const x of [-0.21, 0.21]) for (const z of [-0.14, 0.14]) boards.push(block([0.045, 0.27, 0.04], [x, 0.135, z]));
  batch(crate, 'Weathered crate slats', wood, boards);
  const bottles = [];
  for (const [x, z, h, lean] of [[-0.13, 0, 0.33, -0.06], [0.02, -0.05, 0.37, 0.04], [0.14, 0.04, 0.31, -0.04]]) {
    const profile = [[0,0],[0.047,0],[0.049,h-0.12],[0.025,h-0.075],[0.022,h],[0,h]];
    const geometry = new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 8);
    geometry.rotateZ(lean).translate(x, 0.04, z);
    bottles.push(geometry);
  }
  batch(crate, 'Three uneven opaque green return bottles', new THREE.MeshStandardMaterial({ color: 0x243b2d, roughness: 0.94 }), bottles);
  const fold = block([0.15, 0.008, 0.17], [0,0,0]).rotateX(-0.24).translate(-0.12, 0.057, 0.04);
  batch(crate, 'Folded paper liner', new THREE.MeshStandardMaterial({ color: 0x777566, roughness: 1 }), [fold]);
  building.add(identity, notice, crate);
}

export function addResidenceEverydayDetails(extension, roofSurface) {
  const roof = group('roof material history');
  const felt = roofSurface.clone();
  felt.map = texture(roofUrl);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 2.25), felt);
  top.rotation.x = -Math.PI / 2;
  top.position.set(-10.42, 3.141, -4);
  top.name = 'Two felt laps, small repair and filtered aggregate';
  top.receiveShadow = true;
  roof.add(top);

  const plant = group('upper window plant');
  // A shallow interior silhouette between the opaque inset and curtain fronts.
  const pieces = [new THREE.CylinderGeometry(0.065, 0.047, 0.105, 7).scale(1,1,0.045).translate(-10.085,1.54,-2.886)];
  pieces.push(block([0.009,0.23,0.003], [-10.08,1.7,-2.885]));
  for (const [x,y,s,r] of [[-10.135,1.69,0.075,-0.7],[-10.03,1.75,0.07,0.8],[-10.12,1.8,0.063,-0.5],[-10.065,1.87,0.053,0.4]]) {
    pieces.push(new THREE.SphereGeometry(1,6,4).scale(s,s*0.36,0.002).rotateZ(r).translate(x,y,-2.885));
  }
  batch(plant, 'Dim pot, stem and asymmetrical leaves behind curtains', new THREE.MeshBasicMaterial({ color: 0x222d2b }), pieces);
  extension.add(roof, plant);
}
