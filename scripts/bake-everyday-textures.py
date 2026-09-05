"""Bake local painted type and low-frequency felt; no runtime font dependency."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

out = Path(__file__).resolve().parents[1] / 'src/assets/everyday'
out.mkdir(parents=True, exist_ok=True)
font = 'C:/Windows/Fonts/YuGothM.ttc'
sign = Image.new('RGBA', (512, 128))
d = ImageDraw.Draw(sign)
f = ImageFont.truetype(font, 72)
for i, char in enumerate('こかげ商店'):
    d.text((20 + i * 98, 12), char, font=f, fill=(75, 72, 61, 235))
sign.save(out / 'shop-lettering.png')
notice = Image.new('RGB', (128, 160), '#b9b099')
d = ImageDraw.Draw(notice)
d.rectangle((8, 8, 119, 151), outline='#aaa28e', width=2)
d.text((16, 19), '配達のご案内', font=ImageFont.truetype(font, 15), fill='#56574f')
d.rectangle((16, 44, 110, 48), fill='#827960')
for y, s in [(61, 'いつもありがとう'), (80, 'ございます。'), (106, 'お届けは裏口へ')]:
    d.text((16, y), s, font=ImageFont.truetype(font, 11), fill='#747465')
notice.save(out / 'delivery-notice.png')
# Broad correlated wear dominates the restrained grain. Smooth before mipmapping.
roof = Image.new('RGB', (256, 256))
for y in range(256):
    for x in range(256):
        wear = 3*math.sin(x/38 + math.sin(y/46)) + 2*math.cos(y/29+x/71)
        grain = math.sin(x*1.7+y*2.3)*0.8
        v = round(245 + wear + grain)
        roof.putpixel((x, y), (v, v, v))
roof = roof.filter(ImageFilter.GaussianBlur(0.8))
d = ImageDraw.Draw(roof)
for x in [85, 172]:
    d.line([(x, 0), (x+1, 74), (x-1, 173), (x, 255)], fill=(200,200,200), width=3)
d.polygon([(181,181),(208,177),(212,202),(184,207)], fill=(226,226,226))
roof.save(out / 'roof-felt.png')
