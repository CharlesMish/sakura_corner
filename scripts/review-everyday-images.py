"""Separate everyday comparison gallery; original captures stay untouched."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
root = Path(__file__).resolve().parents[1] / 'screenshots/nocturne-everyday'
aspects = ['desktop', 'laptop', 'portrait', 'ultrawide']

def board(inputs, filename, size, gray=False):
    canvas = Image.new('RGB', (size[0]*len(inputs),size[1]+28), '#10171e')
    d = ImageDraw.Draw(canvas)
    for i,(label,path,crop) in enumerate(inputs):
        im = Image.open(root/path).convert('RGB')
        if crop: im = im.crop(crop)
        if gray: im = ImageOps.grayscale(im).convert('RGB')
        im.thumbnail(size, Image.Resampling.LANCZOS)
        canvas.paste(im,(i*size[0]+(size[0]-im.width)//2,28+(size[1]-im.height)//2))
        d.text((i*size[0]+8,8), label, fill='#dde2e5')
    canvas.save(root/filename)

sections = []
for weather in ['rain','clear']:
    for aspect in aspects:
        inputs = [(v, f'{v}-{weather}-{aspect}.png', None) for v in ['baseline','final']]
        for prefix,size,gray in [('compare',(390,844) if aspect=='portrait' else (960,540),False),('gray',(480,422),True),('thumb',(180,200),False)]:
            board(inputs,f'{prefix}-{weather}-{aspect}.png',size,gray)
        sections.append(f'<h2>{weather} / {aspect}</h2>'+''.join(f'<p><a href="{p}-{weather}-{aspect}.png"><img src="{p}-{weather}-{aspect}.png" alt="{p} {weather} {aspect}"></a></p>' for p in ['compare','gray','thumb']))
    crops = {'identity':(1100,510,1450,650),'notice':(1380,680,1490,800),'crate':(1370,800,1570,980),'roof':(470,335,690,425),'plant':(530,425,590,505)}
    for name,crop in crops.items():
        board([(v,f'{v}-{weather}-desktop.png',crop) for v in ['baseline',name,'final']],f'detail-{name}-{weather}.png',(400,300))
        sections.append(f'<h2>{name} / {weather}</h2><img src="detail-{name}-{weather}.png" alt="Canonical, isolated detail, combined result">')
    board([(a,f'thumb-{weather}-{a}.png',None) for a in aspects],f'thumbnails-{weather}.png',(360,230))
(root/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nocturne everyday details</title><style>body{max-width:1500px;margin:32px auto;padding:0 20px;background:#10171e;color:#dde2e5;font:16px system-ui}img,video{max-width:100%;height:auto}h2{margin-top:40px}a{color:#efb5ca}</style><h1>Nocturne — everyday details</h1><p>Canonical on the left, local detail pass on the right. Fixed camera, seeded particles and four seconds of simulation for still comparisons. Individual details are also compared separately below. No light, exposure, weather or animation edits.</p><h2>65 seconds at normal speed</h2><video controls preload="metadata" src="temporal/detail-65s.mp4"></video><p>Recorded at normal playback speed. Sampled frame inspection was available; continuous visual playback review was not.</p>'''+''.join(sections),encoding='utf-8')
print(root/'index.html')
