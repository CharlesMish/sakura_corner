from pathlib import Path
from PIL import Image, ImageDraw
import json, gzip, subprocess, os

root=Path(__file__).resolve().parents[1]/'screenshots/nocturne-life'
summary_path=root/'recording-summary.json'
summary=json.loads(summary_path.read_text()) if os.getenv('RECORD_ONLY') and summary_path.exists() else {}
for mode in ['wet','clear']:
    if os.getenv('RECORD_ONLY') and mode!=os.getenv('RECORD_ONLY'): continue
    raw=(root/f'{mode}-telemetry.json').read_bytes()
    data=json.loads(raw)
    frames=data['frames']; samples=data['samples']
    intervals=sorted((b[0]-a[0])*1000 for a,b in zip(frames,frames[1:]))
    assert frames[-1][0]-frames[0][0]>85 and not data['visibility']
    assert all(s['camera']==data['cameraMatrix'] for s in samples)
    assert all(s['lights']==samples[0]['lights'] for s in samples)
    assert all(s['life']['weather']==mode for s in samples)
    summary[mode]={'frames':len(frames),'wallSeconds':frames[-1][0]-frames[0][0],
        'lifeSeconds':samples[-1]['life']['time']-samples[0]['life']['time'],
        'meanFrameMs':sum(intervals)/len(intervals),'p95FrameMs':intervals[int(len(intervals)*.95)],
        'maxFrameMs':max(intervals),'visibilityChanges':data['visibility'],
        'cameraAndLightPositions':'unchanged'}
    (root/f'{mode}-telemetry.json.gz').write_bytes(gzip.compress(raw,mtime=0))
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(root/f'{mode}-90s.webm'),
        '-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(root/f'{mode}-90s.mp4')],check=True)
    times=[.5,4.8,6.4,13.2,18.8,24,28.8,35,50,70,85] if mode=='wet' else [4,10,16,20,26,32,40,44,50,62,85]
    board=Image.new('RGB',(1280,630),'#15212b'); draw=ImageDraw.Draw(board)
    details=Image.new('RGB',(len(times)*220,225),'#15212b') if mode=='wet' else None
    for i,time in enumerate(times):
        path=root/f'{mode}-sample-{i:02d}.png'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(time),'-i',str(root/f'{mode}-90s.mp4'),'-frames:v','1',str(path)],check=True)
        frame=Image.open(path).convert('RGB')
        if details is not None:
            crop=frame.crop((410,408,470,468)).resize((220,216),Image.Resampling.NEAREST)
            details.paste(crop,(i*220,9))
        frame.thumbnail((320,180),Image.Resampling.LANCZOS)
        x,y=(i%4)*320,(i//4)*210
        board.paste(frame,(x,y+25));draw.text((x+8,y+5),f'{mode} / {time:g}s',fill='#dddcd7')
    board.save(root/f'{mode}-frames.png')
    if details is not None: details.save(root/'bird-motion-details.png')
summary['review']='Normal-speed recordings and sampled frames; continuous visual playback review unavailable.'
(root/'recording-summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,indent=2))
