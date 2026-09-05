"""Measure decoration capture and assemble samples; not continuous viewing."""
from pathlib import Path
import json, statistics, hashlib, gzip
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
p = root / 'screenshots/nocturne-everyday/temporal'
data = json.loads((p/'telemetry.json').read_bytes())
ref = json.loads((p/'detail-reference.json').read_bytes())
frames = data['frames']
times = [b[0]-a[0] for a,b in zip(frames,frames[1:])]
camera_error = max(abs(a-b) for s in data['samples'] for a,b in zip(s['camera'],ref['camera']['matrixWorld']))
light_error = max(abs(a-b) for s in data['samples'] for light,original in zip(s['lightPositions'],ref['lights']) for a,b in zip(light,original['position']))
summary = {'renderedFrames':len(frames),'sceneSeconds':frames[-1][1]-frames[0][1],
    'integratedParticleSeconds':sum(f[2] for f in frames[1:]),'meanFrameMs':statistics.mean(times),
    'p95FrameMs':sorted(times)[int(len(times)*.95)],'visibilityEvents':data['visibility'],
    'cameraMatrixChange':camera_error,'lightPositionChange':light_error,
    'review':'Normal-speed recording and sampled still-frame inspection; no continuous visual feed was available.'}
assert summary['sceneSeconds'] >= 60 and summary['integratedParticleSeconds'] >= 60
assert camera_error == light_error == 0 and not data['visibility']
summary['detailAssetHashes'] = {str(f.relative_to(root)):hashlib.sha256(f.read_bytes()).hexdigest() for f in [root/'src/scene/createEverydayDetails.js',*sorted((root/'src/assets/everyday').glob('*.png'))]}
(p/'measured-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(p/'telemetry.json.gz').write_bytes(gzip.compress((p/'telemetry.json').read_bytes(),mtime=0))
samples = sorted(p.glob('sample-*.png'))
board = Image.new('RGB',(1280,((len(samples)+3)//4)*230),'#10171e')
d = ImageDraw.Draw(board)
detail = Image.new('RGB',(1280,((len(samples)+3)//4)*160),'#10171e')
dd = ImageDraw.Draw(detail)
for i,f in enumerate(samples):
    im = Image.open(f).convert('RGB')
    x,y = (i%4)*320,(i//4)*230
    small = im.copy(); small.thumbnail((320,200))
    board.paste(small,(x,y+25)); d.text((x+8,y+8),f'{2.5+i*5:g}s',fill='white')
    roof = im.crop((238,169,344,198)).resize((318,87))
    detail.paste(roof,(x,(i//4)*160+25))
    dd.text((x+8,(i//4)*160+8),f'Roof / {2.5+i*5:g}s / 3x',fill='white')
board.save(p/'representative-frames.png')
detail.save(p/'roof-samples.png')
print(json.dumps(summary,indent=2))
