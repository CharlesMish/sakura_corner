from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageStat

root = Path(__file__).resolve().parents[1] / 'screenshots/nocturne-life'
views = ['desktop', 'laptop', 'portrait', 'ultrawide']
modes = ['rain', 'wet', 'clear', 'snow']
sections = []
for mode in modes:
    for view in views:
        images = [Image.open(root / f'{label}-{mode}-{view}.png').convert('RGB') for label in ['baseline','final']]
        assert all(max(ImageStat.Stat(im).stddev)>5 for im in images), f'Blank capture: {mode}/{view}'
        width, height = ((390,844) if view == 'portrait' else (960,540))
        board = Image.new('RGB', (width*2,height+28), '#15212b')
        draw = ImageDraw.Draw(board)
        for index, im in enumerate(images):
            im.thumbnail((width,height), Image.Resampling.LANCZOS)
            board.paste(im, (index*width+(width-im.width)//2,28+(height-im.height)//2))
            draw.text((index*width+10,8), ['Published baseline','Small lives candidate'][index], fill='#dbdcd7')
        board.save(root/f'compare-{mode}-{view}.png')
        gray=ImageOps.grayscale(board); gray.save(root/f'gray-{mode}-{view}.png')
        board.thumbnail((480,250),Image.Resampling.LANCZOS)
        board.save(root/f'thumb-{mode}-{view}.png')
        sections.append(f'<h2>{mode} / {view}</h2><a href="compare-{mode}-{view}.png"><img loading="lazy" src="compare-{mode}-{view}.png" alt="Baseline and candidate in {mode}, {view}"></a><p><a href="gray-{mode}-{view}.png">Grayscale</a> · <a href="thumb-{mode}-{view}.png">Thumbnail</a></p>')
for mode, crop in [('rain',(1160,660,1300,755)),('snow',(1160,660,1300,755)),('wet',(820,820,935,940)),('clear',(100,90,720,235))]:
    im=Image.open(root/f'final-{mode}-desktop.png').crop(crop)
    im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST).save(root/f'detail-{mode}.png')
root.joinpath('index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nocturne — small lives review</title><style>body{max-width:1600px;margin:32px auto;padding:0 20px;background:#15212b;color:#dbdcd7;font:16px system-ui;line-height:1.5}img,video{max-width:100%;height:auto}a{color:#ecc2be}h2{margin-top:40px}</style><h1>Nocturne — small lives</h1><p>Published Pages baseline 1207ccd versus the candidate, at 24 seconds. Camera, lighting, architecture, snow and existing animation remain unchanged. Tiny birds can disappear behind the canopy and in portrait crops.</p><p>Rain and Snow: a sheltered orange-and-white sleeper. After rain: one foraging bird. Clear: a brief distant flock, followed by a long quiet interval.</p><h2>Detail crops</h2>'''+''.join(f'<h3>{mode}</h3><img src="detail-{mode}.png" alt="Enlarged {mode} detail">' for mode in modes)+'''<h2>Normal-speed recordings</h2><p>Recordings and sampled-frame inspection; continuous visual playback review was unavailable.</p><h3>Foraging after rain — 90 seconds</h3><video controls preload="metadata" src="wet-90s.mp4"></video><h3>Distant flock — 90 seconds</h3><video controls preload="metadata" src="clear-90s.mp4"></video>'''+''.join(sections),encoding='utf-8')
print(root/'index.html')

overview=Image.new('RGB',(1920,1120),'#15212b'); d=ImageDraw.Draw(overview)
for row,mode in enumerate(modes):
    for col,view in enumerate(views):
        im=Image.open(root/f'thumb-{mode}-{view}.png')
        overview.paste(im,(col*480,row*280+25))
        d.text((col*480+8,row*280+6),f'{mode} / {view}',fill='#dbdcd7')
overview.save(root/'overview.png')
ImageOps.grayscale(overview).save(root/'overview-gray.png')
with (root/'index.html').open('a',encoding='utf-8') as page:
    page.write('<h2>Checks and motion samples</h2><p><a href="performance-comparison.json">Same-device performance</a> · <a href="browser-checks.json">Browser checks</a> · <a href="recording-summary.json">Recording measurements</a></p><p><a href="bird-motion-details.png">Enlarged foraging sequence</a> · <a href="clear-frames.png">Flock frame board</a> · <a href="overview-gray.png">Grayscale overview</a></p>')
