import { ART_DIRECTION } from '../config.js';

// One bounded envelope; individual branches retain their authored phase offsets.
export function sampleWind(elapsed) {
  const { gustBase, gustAmplitude, gustFrequency } = ART_DIRECTION.motion;
  return gustBase + gustAmplitude * (
    Math.sin(elapsed * gustFrequency) * 0.7 +
    Math.sin(elapsed * gustFrequency * 0.43 + 1.3) * 0.3
  );
}
