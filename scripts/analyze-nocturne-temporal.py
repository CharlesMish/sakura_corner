"""Measured evidence only; this does not certify continuous visual viewing."""
from pathlib import Path
import json
import math
import statistics
import gzip

root = Path(__file__).resolve().parents[1] / 'screenshots/nocturne-temporal'
raw = root / 'telemetry.json'
data = json.loads(raw.read_bytes() if raw.exists() else gzip.decompress((root / 'telemetry.json.gz').read_bytes()))
reference = json.loads((root / 'canonical-reference.json').read_text())
frames, samples = data['frames'], data['samples']
intervals = [b[0] - a[0] for a, b in zip(frames, frames[1:])]
camera_error = max(abs(a-b) for sample in samples for a, b in zip(sample['camera'], reference['camera']['matrixWorld']))
light_error = max(abs(a-b) for sample in samples for light, original in zip(sample['lightPositions'], reference['lights']) for a, b in zip(light, original['position']))
zone_ranges = []
for index, zone in enumerate(samples[0]['zones']):
    rotations = [sample['zones'][index]['rotation'] for sample in samples]
    ranges = [math.degrees(max(r[axis] for r in rotations) - min(r[axis] for r in rotations)) for axis in [0, 2]]
    step = max(math.dist(a, b) for a, b in zip(rotations, rotations[1:]))
    zone_ranges.append({'name': zone['name'], 'peakToPeakXDegrees': ranges[0], 'peakToPeakZDegrees': ranges[1], 'maxSampleRotationStepDegrees': math.degrees(step)})
speeds, drifts, resets = [], [], 0
repeat_states = 0
seen = set()
for sample in samples:
    state = tuple(round(v, 5) for mesh in sample['rain'] for drop in mesh['drops'] for v in drop[:3])
    repeat_states += state in seen
    seen.add(state)
for before, after in zip(samples, samples[1:]):
    dt = after['time'] - before['time']
    for first, second in zip(before['rain'], after['rain']):
        for a, b in zip(first['drops'], second['drops']):
            if b[1] > a[1]:
                resets += 1
            else:
                speeds.append((a[1] - b[1]) / dt)
                drifts.append(math.degrees(math.atan2(math.hypot(b[0]-a[0], b[2]-a[2]), a[1]-b[1])))
summary = {
    'scope': 'Read-only measurements and representative frames. Continuous visual viewing and physical-display judgment were unavailable.',
    'canonical': reference['canonical'],
    'renderedFrames': len(frames), 'observedSceneSeconds': frames[-1][1]-frames[0][1],
    'integratedParticleSeconds': sum(frame[2] for frame in frames[1:]),
    'meanFrameMs': statistics.mean(intervals), 'p95FrameMs': sorted(intervals)[int(len(intervals)*0.95)],
    'maxFrameGapMs': max(intervals), 'visibilityEvents': data['visibility'],
    'maxCameraMatrixChange': camera_error, 'maxLightPositionChange': light_error,
    'customShadowCasterCount': reference['customCasters'],
    'zoneRotationRanges': zone_ranges, 'exactRainEnsembleRepeatsAt10Hz': repeat_states,
    'observedRainResets': resets, 'verticalRainSpeedRange': [min(speeds), max(speeds)],
    'rainDriftAngleFromVerticalRange': [min(drifts), max(drifts)],
    'peakFallingPetals': max(s['petals']['fallingActive'] for s in samples),
    'shopLightIntensityRange': [min(s['shopIntensity'] for s in samples), max(s['shopIntensity'] for s in samples)],
    'limitations': ['Sampling cannot exclude perceptually obvious rain loops or brief geometry intersections.',
                    'No automated measure establishes spark-like appearance, appropriate faintness, gaze exit, or physical-display highlight structure.']
}
assert camera_error == 0
assert light_error == 0
assert summary['observedSceneSeconds'] >= 60
assert summary['integratedParticleSeconds'] >= 60
assert not data['visibility']
(root / 'measured-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
