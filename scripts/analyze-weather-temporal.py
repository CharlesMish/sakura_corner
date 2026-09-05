"""Measured recording evidence and frame boards, not continuous visual review."""
from pathlib import Path
import json, gzip, math, statistics, subprocess
from PIL import Image, ImageDraw
p=Path(__file__).resolve().parents[1]/'screenshots/nocturne-weather/temporal'
summary={}
for name in ['snow','firefly']:
    raw=p/f'{name}-telemetry.json'
    data=json.loads(raw.read_bytes())
    frames,samples=data['frames'],data['samples']
    intervals=[(b[0]-a[0])*1000 for a,b in zip(frames,frames[1:])]
    camera_error=max(abs(a-b) for s in samples for a,b in zip(s['camera'],data['cameraMatrix']))
    light_error=max(abs(a-b) for s in samples for light,original in zip(s['lights'],samples[0]['lights']) for a,b in zip(light,original))
    assert frames[-1][0]-frames[0][0]>=60 and not data['visibility']
    assert all(math.isfinite(v) for f in frames for v in f)
    assert camera_error==light_error==0
    stats={'renderedFrames':len(frames),'wallSeconds':frames[-1][0]-frames[0][0],
           'sceneSeconds':frames[-1][1]-frames[0][1],'meanFrameMs':statistics.mean(intervals),
           'p95FrameMs':sorted(intervals)[int(len(intervals)*.95)],
           'cameraMatrixChange':camera_error,'lightPositionChange':light_error,'visibilityEvents':data['visibility']}
    if name=='snow':
        assert all(s['snow']['capacity']==64 and s['snow']['boundsCount']>100 for s in samples)
        stats['snowStart']=samples[0]['snow']; stats['snowEnd']=samples[-1]['snow']
    else:
        assert all(s['firefly']['capacity']==1 and 0<=s['firefly']['opacity']<=.74 for s in samples)
        assert all(6<=s['firefly']['darkInterval']<=12 for s in samples)
        stats['activeSamples']=sum(s['firefly']['active'] for s in samples)
        stats['samples']=len(samples)
        stats['peakOpacity']=max(s['firefly']['opacity'] for s in samples)
        glow_peaks={}
        for s in samples:
            f=s['firefly']; key=f['glowStart']
            if f['active'] and (key not in glow_peaks or f['opacity']>glow_peaks[key]['firefly']['opacity']): glow_peaks[key]=s
        stats['glowPeakTimes']=[s['time'] for s in glow_peaks.values()]
        for i,s in enumerate(glow_peaks.values()):
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(s['time']),'-i',str(p/'firefly-65s.mp4'),'-frames:v','1',str(p/f'firefly-peak-{i+1:02d}.png')],check=True)
    (p/f'{name}-telemetry.json.gz').write_bytes(gzip.compress(raw.read_bytes(),mtime=0))
    summary[name]=stats
    files=sorted(p.glob(f'{name}-sample-*.png'))
    board=Image.new('RGB',(1280,((len(files)+3)//4)*210),'#10171e'); d=ImageDraw.Draw(board)
    for i,file in enumerate(files):
        im=Image.open(file).convert('RGB'); im.thumbnail((320,180))
        x,y=i%4*320,i//4*210
        board.paste(im,(x,y+25));d.text((x+8,y+8),f'{name} / {2.5+i*5:g}s',fill='white')
    board.save(p/f'{name}-frames.png')
peaks=sorted(p.glob('firefly-peak-*.png'))
board=Image.new('RGB',(320*len(peaks),260),'#10171e'); d=ImageDraw.Draw(board)
for i,file in enumerate(peaks):
    im=Image.open(file).crop((340,295,500,415)).resize((320,240),Image.Resampling.NEAREST)
    board.paste(im,(i*320,20)); d.text((i*320+8,5),f'Glow {i+1} / 2x native',fill='white')
board.save(p/'firefly-peaks.png')
summary['review']='Normal-speed recordings plus representative frame inspection. Continuous playback review unavailable.'
(p/'measured-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
