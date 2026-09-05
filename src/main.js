import * as THREE from 'three';
import './styles.css';
import { ART_DIRECTION } from './config.js';
import { createAtmosphericBackground } from './scene/createAtmosphere.js';
import { createEnvironment } from './scene/createEnvironment.js';
import { createTreeInteraction } from './interaction/createTreeInteraction.js';
import { createLighting } from './scene/createLighting.js';
import { createPetalSystem } from './scene/createPetalSystem.js';
import { createRainClouds } from './scene/createRainClouds.js';
import { createSakuraTree } from './scene/createSakuraTree.js';
import { createWeatherEffects } from './scene/createWeatherEffects.js';
import { fireflyIsEnabled, getWeatherMode, weatherIsWet } from './weatherMode.js';
import { sampleWind } from './scene/sampleWind.js';
import { createWeatherControls } from './weatherControls.js';
import { createSnowfall } from './scene/createSnowfall.js';
import { createFirefly } from './scene/createFirefly.js';

const weather = getWeatherMode();
document.documentElement.dataset.weather = weather;
const weatherControls = createWeatherControls({ weather });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let assetsReady = false;
let sceneRevealed = false;
THREE.DefaultLoadingManager.itemStart('scene-initialization');
THREE.DefaultLoadingManager.onLoad = () => { assetsReady = true; };

const container = document.querySelector('#app');
const scene = new THREE.Scene();
const sky = weatherIsWet() ? ART_DIRECTION.atmosphere.wet : ART_DIRECTION.atmosphere.clear;
scene.background = createAtmosphericBackground();
scene.fog = new THREE.Fog(
  weatherIsWet() ? ART_DIRECTION.palette.wetHaze : ART_DIRECTION.palette.haze,
  sky.fogNear,
  sky.fogFar,
);

const camera = new THREE.PerspectiveCamera(ART_DIRECTION.camera.fieldOfView, 1, 0.1, 120);
camera.name = 'Fixed composition camera';

const renderer = new THREE.WebGLRenderer({
  antialias: ART_DIRECTION.render.antialias,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = weatherIsWet()
  ? ART_DIRECTION.lighting.wet.exposure
  : ART_DIRECTION.render.exposure;
container.append(renderer.domElement);

const environment = createEnvironment();
const lighting = createLighting();
const tree = createSakuraTree();
const petalSystem = createPetalSystem();
const weatherEffects = createWeatherEffects({ camera });
const rainClouds = createRainClouds();
const snowfall = weather === 'snow'
  ? createSnowfall({ camera, environment: environment.group, tree: tree.group }) : null;
const firefly = fireflyIsEnabled() ? createFirefly() : null;
scene.add(
  environment.group,
  tree.group,
  petalSystem.group,
  weatherEffects.group,
  lighting.group,
);
if (rainClouds) scene.add(rainClouds);
if (snowfall) scene.add(snowfall.group);
if (firefly) scene.add(firefly.group);

const releaseDirection = new THREE.Vector3();
const interaction = ART_DIRECTION.interaction.enabled
  ? createTreeInteraction({
      tree,
      camera,
      domElement: renderer.domElement,
      onTarget(result) {
        releaseDirection.set(
          result.releasePoint.x - ART_DIRECTION.world.treePosition[0],
          0,
          result.releasePoint.z - ART_DIRECTION.world.treePosition[2],
        );
        releaseDirection.multiplyScalar(0.55);
        releaseDirection.x += (weatherIsWet()
          ? ART_DIRECTION.weather.petals.wind[0]
          : ART_DIRECTION.petals.wind[0]);
        releaseDirection.z += (weatherIsWet()
          ? ART_DIRECTION.weather.petals.wind[2]
          : ART_DIRECTION.petals.wind[2]);
        petalSystem.releaseInteractive(result.releasePoint, {
          direction: releaseDirection,
          strength: result.strength,
        });
      },
    })
  : null;

function updateComposition() {
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);
  const aspect = width / height;
  const narrow = aspect < ART_DIRECTION.camera.narrowBreakpoint;
  const ultrawide = aspect > ART_DIRECTION.camera.ultrawideBreakpoint;
  const useFrameCompletionVariant =
    !narrow && ART_DIRECTION.camera.useFrameCompletionVariant;
  const position = narrow
    ? ART_DIRECTION.camera.narrowPosition
    : useFrameCompletionVariant
      ? ART_DIRECTION.camera.frameCompletionPosition
      : ART_DIRECTION.camera.desktopPosition;
  const target = narrow
    ? ART_DIRECTION.camera.narrowTarget
    : ultrawide
      ? ART_DIRECTION.camera.ultrawideTarget
      : useFrameCompletionVariant
        ? ART_DIRECTION.camera.frameCompletionTarget
        : ART_DIRECTION.camera.desktopTarget;

  camera.aspect = aspect;
  const standardFieldOfView = useFrameCompletionVariant
    ? ART_DIRECTION.camera.frameCompletionFieldOfView
    : ART_DIRECTION.camera.fieldOfView;
  camera.fov = narrow
    ? ART_DIRECTION.camera.narrowFieldOfView
    : ultrawide
      ? ART_DIRECTION.camera.ultrawideFieldOfView
      : standardFieldOfView;
  camera.position.set(...position);
  camera.lookAt(...target);
  camera.updateProjectionMatrix();

  const pixelSize = narrow
    ? ART_DIRECTION.render.narrowPixelSize
    : ART_DIRECTION.render.pixelSize;
  const renderWidth = Math.max(1, Math.round(width / pixelSize));
  const renderHeight = Math.max(1, Math.round(height / pixelSize));
  renderer.setSize(renderWidth, renderHeight, false);
}

const resizeObserver = new ResizeObserver(updateComposition);
resizeObserver.observe(container);
updateComposition();

const timer = new THREE.Timer();
timer.connect(document);

function render(timestamp) {
  timer.update(timestamp);
  const delta = Math.min(timer.getDelta(), 0.05);
  const elapsed = timer.getElapsed();
  environment.update(elapsed);
  lighting.update(elapsed);
  const wind = sampleWind(elapsed);
  tree.update(elapsed, wind);
  petalSystem.update(delta, elapsed, wind);
  weatherEffects.update(delta, wind);
  if (snowfall) {
    snowfall.group.visible = !reducedMotion.matches;
    if (!reducedMotion.matches) snowfall.update(delta, wind);
  }
  if (firefly) {
    firefly.group.visible = !reducedMotion.matches;
    if (!reducedMotion.matches) firefly.update(elapsed);
  }
  renderer.render(scene, camera);
  if (assetsReady && !sceneRevealed) {
    weatherControls.reveal();
    sceneRevealed = true;
  }
}

renderer.setAnimationLoop(render);
THREE.DefaultLoadingManager.itemEnd('scene-initialization');

window.addEventListener('pagehide', () => interaction?.dispose(), { once: true });
