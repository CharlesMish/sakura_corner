"""Comparison artifacts kept apart from every previous scene checkpoint."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
root = Path(__file__).resolve().parents[1] / 'screenshots/nocturne-weather'
views = ['desktop','laptop','portrait','ultrawide']

def board(inputs, filename, size, gray=False):
    result = Image.new('RGB',(size[0]*len(inputs),size[1]+28),'#10171e')
    d = ImageDraw.Draw(result)
    for i,(label,path,crop) in enumerate(inputs):
        im=Image.open(root/path).convert('RGB')
        if crop: im=im.crop(crop)
        if gray: im=ImageOps.grayscale(im).convert('RGB')
        im.thumbnail(size,Image.Resampling.LANCZOS)
        result.paste(im,(i*size[0]+(size[0]-im.width)//2,28+(size[1]-im.height)//2))
        d.text((i*size[0]+8,8),label,fill='#d5dfdc')
    result.save(root/filename)

sections=[]
for mode in ['rain','wet','clear','snow']:
    for view in views:
        before='wet' if mode=='snow' else mode
        inputs=[('After rain baseline' if mode=='snow' else 'Everyday baseline',f'baseline-{before}-{view}.png',None),
                (mode,f'final-{mode}-{view}.png',None)]
        for prefix,size,gray in [('compare',(390,844) if view=='portrait' else (960,540),False),
                                 ('gray',(480,422),True),('thumb',(180,220),False)]:
            board(inputs,f'{prefix}-{mode}-{view}.png',size,gray)
        sections.append(f'<h2>{mode} / {view}</h2>'+''.join(f'<p><a href="{prefix}-{mode}-{view}.png"><img loading="lazy" src="{prefix}-{mode}-{view}.png" alt="{prefix} {mode} {view}"></a></p>' for prefix in ['compare','gray','thumb']))
    board([(v,f'thumb-{mode}-{v}.png',None) for v in views],f'thumbnails-{mode}.png',(360,250))
for mode in ['rain','wet','clear','snow']:
    board([('baseline',f'baseline-{"wet" if mode=="snow" else mode}-desktop.png',(1510,290,1900,440)),
           (mode,f'final-{mode}-desktop.png',(1510,290,1900,440))],f'hatch-{mode}.png',(600,240))
(root/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nocturne weather choices</title><style>body{max-width:1500px;margin:32px auto;padding:0 20px;background:#10171e;color:#d5dfdc;font:16px system-ui}img,video{max-width:100%;height:auto}h2{margin-top:40px}a{color:#edb6cc}</style><h1>Nocturne — quiet weather choices</h1><p>Everyday checkpoint 7dbae2c on the left, weather branch on the right. Snow is compared with the damp evening it inherits. Still comparisons use the same fixed camera, seeded weather and four-second simulation. Previous references remain untouched.</p><h2>Weather control</h2><img src="controls-desktop.png" alt="Expanded desktop weather control"><img src="controls-portrait.png" alt="Expanded portrait weather control"><h2>Normal-speed recordings</h2><p>65 seconds each. Recording and sampled-frame inspection were available; continuous visual playback review was unavailable.</p><h3>Snow</h3><video controls preload="metadata" src="temporal/snow-65s.mp4"></video><h3>Optional firefly after rain</h3><video controls preload="metadata" src="temporal/firefly-65s.mp4"></video><p><a href="performance-comparison.json">Performance measurements</a> · <a href="controls-checks.json">Controls verification</a></p>'''+''.join(sections)+''.join(f'<h2>Hatch / {m}</h2><img src="hatch-{m}.png" alt="Hatch comparison">' for m in ['rain','wet','clear','snow']),encoding='utf-8')
with (root/'index.html').open('a',encoding='utf-8') as page:
    page.write('<h2>Firefly at a glow peak</h2><p>The lossless detail crop is enlarged; the actual point is roughly one rendered pixel.</p><a href="temporal/firefly-lossless-peak.png"><img src="temporal/firefly-lossless-detail.png" alt="Lossless firefly detail"></a>')
print(root/'index.html')
