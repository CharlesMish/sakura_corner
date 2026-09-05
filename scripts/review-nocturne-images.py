"""Build local comparison boards from captures (requires existing Pillow)."""
from pathlib import Path
from html import escape
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1] / 'screenshots' / 'nocturne'
aspects = ['desktop', 'laptop', 'portrait', 'ultrawide']


def board(paths, output, size=(640, 400), grayscale=False):
    canvas = Image.new('RGB', (size[0] * len(paths), size[1] + 30), '#10171e')
    draw = ImageDraw.Draw(canvas)
    for index, (path, label, crop) in enumerate(paths):
        im = Image.open(root / path).convert('RGB')
        if crop:
            im = im.crop(crop)
        if grayscale:
            im = ImageOps.grayscale(im).convert('RGB')
        im.thumbnail(size, Image.Resampling.LANCZOS)
        canvas.paste(im, (size[0] * index + (size[0] - im.width) // 2, 30 + (size[1] - im.height) // 2))
        draw.text((size[0] * index + 12, 8), label, fill='#e0e5ea')
    canvas.save(root / output)


if (root / 'composition-refined-rain-desktop.png').exists():
    board([(f'{label}-rain-desktop.png', label, (1090, 380, 1280, 790))
           for label in ['baseline', 'composition', 'shadow-visible', 'composition-refined']],
          'shadow-study.png', (300, 620))

if (root / 'final-rain-desktop.png').exists():
    motion = root / 'nocturne-final-production-interaction-desktop-before.png'
    if motion.exists():
        board([(f'nocturne-final-production-interaction-desktop-{stage}.png', stage, (520, 60, 1470, 980))
               for stage in ['before', 'peel', 'midflight', 'settled', 'repeat']],
              'motion-interaction.png', (350, 400))
        board([(f'nocturne-final-production-interaction-portrait-{stage}.png', stage, None)
               for stage in ['before', 'release', 'peel']], 'motion-portrait.png', (390, 844))
        board([(f'nocturne-final-sway-crop-t{index}.png', f'{index * 2}s after first frame', None)
               for index in [0, 2, 4, 7]], 'motion-sway.png', (325, 300))
    for weather in ['rain', 'clear']:
        for aspect in aspects:
            paths = [(f'{label}-{weather}-{aspect}.png', label, None) for label in ['baseline', 'final']]
            size = (390, 844) if aspect == 'portrait' else (960, 540)
            board(paths, f'compare-{weather}-{aspect}.png', size)
            board(paths, f'gray-{weather}-{aspect}.png', size, True)
            board(paths, f'thumb-{weather}-{aspect}.png', (180, 200))
        overview = Image.new('RGB', (1280, 1120), '#10171e')
        for row, aspect in enumerate(aspects):
            for column, prefix in enumerate(['compare', 'gray']):
                im = Image.open(root / f'{prefix}-{weather}-{aspect}.png')
                im.thumbnail((640, 250), Image.Resampling.LANCZOS)
                overview.paste(im, (column * 640 + (640 - im.width) // 2, row * 280 + 25))
                ImageDraw.Draw(overview).text((column * 640 + 10, row * 280 + 5), f'{weather} / {aspect} / {prefix}', fill='#e0e5ea')
        overview.save(root / f'overview-{weather}.png')
    for label, crop in [('shop', (1080, 380, 1510, 890)), ('tree-bicycle', (660, 345, 1010, 800)),
                        ('distance', (130, 0, 740, 415)), ('street', (0, 580, 1200, 1080))]:
        board([(f'{version}-rain-desktop.png', version, crop) for version in ['baseline', 'final']],
              f'detail-{label}.png', (640, 630))
    sections = []
    for weather in ['rain', 'clear']:
        for aspect in aspects:
            images = ''.join(f'<a href="{prefix}-{weather}-{aspect}.png"><img loading="lazy" src="{prefix}-{weather}-{aspect}.png" alt="{escape(prefix)} {weather} {aspect}"></a>' for prefix in ['compare', 'gray', 'thumb'])
            sections.append(f'<section><h2>{weather.title()} / {aspect}</h2>{images}</section>')
    (root / 'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nocturne director's pass comparisons</title>
<style>body{margin:32px auto;padding:0 20px;max-width:1500px;background:#10171e;color:#dde2e5;font:16px system-ui}img{max-width:100%;height:auto}section{margin:40px 0}a{color:#efb5ca}</style>
<h1>Nocturne — director's pass</h1><p>Baseline 49ddb72 on the left; director's pass on the right. Same viewport, seeded particles, four seconds of fixed simulation. Full frames, grayscale, then thumbnails. Click images for full size.</p>
''' + ''.join(sections) + '<h2>Surface details</h2>' + ''.join(f'<p><a href="detail-{name}.png"><img src="detail-{name}.png" alt="{name} comparison"></a></p>' for name in ['shop', 'tree-bicycle', 'distance', 'street']) + '<h2>Shadow study</h2><img src="shadow-study.png" alt="Foliage shadow study"><p>The custom shadow-only variants did not improve the projected shape enough to retain. The final scene uses the actual blossom silhouette.</p><h2>Live motion samples</h2><p>Desktop tap, flight, settling and repeated taps; portrait touch; then canopy sway sampled over fourteen seconds.</p>' + ''.join(f'<p><a href="motion-{name}.png"><img src="motion-{name}.png" alt="{name} motion samples"></a></p>' for name in ['interaction', 'portrait', 'sway']), encoding='utf-8')
print(f'Comparison boards written to {root}')
