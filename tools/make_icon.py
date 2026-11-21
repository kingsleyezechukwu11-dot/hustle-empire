# The home-screen icon: the game's mint-to-blue-to-pink gradient with a soft white house, drawn large and shrunk for smooth edges.
import sys
from PIL import Image, ImageDraw, ImageFilter
out = sys.argv[1]
N = 1024
g = Image.new('RGB', (N, N))
px = g.load()
stops = [(0, (143, 245, 207)), (0.5, (79, 154, 184)), (1, (214, 74, 154))]
def col(t):
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if t <= b:
            k = (t - a) / (b - a); return tuple(round(ca[i] + (cb[i] - ca[i]) * k) for i in range(3))
    return stops[-1][1]
for y in range(N):
    for x in range(N):
        px[x, y] = col(min(1, (x * 0.45 + y) / (N * 1.45)))
shadow = Image.new('L', (N, N), 0); d = ImageDraw.Draw(shadow)
house = [(512, 250), (790, 490), (720, 490), (720, 770), (304, 770), (304, 490), (234, 490)]
d.polygon([(x, y + 26) for x, y in house], fill=110); shadow = shadow.filter(ImageFilter.GaussianBlur(28))
g.paste((40, 60, 90), (0, 0), shadow)
d = ImageDraw.Draw(g); d.polygon(house, fill=(255, 255, 255))
d.rounded_rectangle((452, 590, 572, 770), radius=18, fill=(79, 154, 184))
for s in (512, 192, 180):
    g.resize((s, s), Image.LANCZOS).save(f'{out}/icon-{s}.png', optimize=True)
print('icons written')
