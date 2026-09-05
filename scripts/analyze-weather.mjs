import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (!process.argv[2]) {
  for (const mode of ['clear', 'wet', 'rain', 'dash', 'pixel', 'invalid']) {
    console.log(execFileSync(process.execPath, [fileURLToPath(import.meta.url), mode], { encoding: 'utf8' }).trim());
  }
} else {
  const mode = process.argv[2];
  globalThis.window = { location: { search: ['dash', 'pixel'].includes(mode) ? `?rain=${mode}` : `?weather=${mode}` } };
  const { createWeatherEffects } = await import('../src/scene/createWeatherEffects.js');
  const { sampleWind } = await import('../src/scene/sampleWind.js');
  const { ART_DIRECTION } = await import('../src/config.js');
  const effects = createWeatherEffects();
  const meshes = effects.group.children;
  const capacities = meshes.map(mesh => mesh.count);
  const splashes = effects.group.getObjectByName('Pooled pavement rain contacts');
  const streaks = effects.group.getObjectByName('Bounded rain streaks');
  const accents = effects.group.getObjectByName('Sparse tapered raindrops');
  if (streaks) {
    const style = ['dash', 'pixel'].includes(mode) ? mode : 'dense';
    assert.equal(streaks.count + accents.count, ART_DIRECTION.weather.rain[style].count);
    assert.ok(accents.count > 0 && accents.count < streaks.count);
  }
  assert.equal(Boolean(splashes), !['clear', 'wet'].includes(mode));
  let sawContact = false;
  for (let frame = 0; frame < 180 * 60; frame += 1) {
    const wind = sampleWind(frame / 60);
    assert.ok(Number.isFinite(wind) && wind >= 0.68 - 1e-8 && wind <= 1 + 1e-8);
    effects.update(1 / 60, wind);
    if (frame % 60 === 0) {
      meshes.forEach((mesh, index) => {
        assert.equal(mesh.count, capacities[index]);
        assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
      });
      if (splashes) {
        assert.equal(splashes.count, ART_DIRECTION.weather.splashes.count);
        const a = splashes.instanceMatrix.array;
        for (let index = 0; index < splashes.count; index += 1) {
          const offset = index * 16;
          if (a[offset] === 0) continue;
          sawContact = true;
          assert.ok(a[offset + 12] >= 2.7 && a[offset + 12] <= 6.2);
          assert.ok(a[offset + 14] >= 0.35 && a[offset + 14] <= 2.85);
        }
      }
    }
  }
  if (splashes) assert.ok(sawContact);
  console.log(`${mode}: 180 seconds, finite wind/transforms, fixed particle capacity, correct contact visibility`);
}
