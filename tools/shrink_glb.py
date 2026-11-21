# Makes phone-sized copies of every .glb model: each picture inside is shrunk so the whole game fits in a phone's memory.
# usage: python3 tools/shrink_glb.py SRC_DIR DST_DIR
# Pictures go to at most 512 px; a model whose pictures would still take more than BUDGET of graphics memory goes to 256 px.
import json, struct, sys, os, io, glob
from PIL import Image

SRC, DST = sys.argv[1], sys.argv[2]
BUDGET = 12e6  # bytes of graphics memory per model, after shrinking
os.makedirs(DST, exist_ok=True)

def read(path):
    d = open(path, 'rb').read()
    jl = struct.unpack('<I', d[12:16])[0]
    J = json.loads(d[20:20 + jl])
    bo = 20 + jl + 8
    bl = struct.unpack('<I', d[20 + jl:24 + jl])[0]
    return J, d[bo:bo + bl]

def gpu(sizes):
    return sum(w * h * 4 * 4 / 3 for w, h in sizes)

def shrink(path, out):
    J, BIN = read(path)
    imgs = {}
    for i, im in enumerate(J.get('images', [])):
        if 'bufferView' not in im: continue
        bv = J['bufferViews'][im['bufferView']]; s = bv.get('byteOffset', 0)
        imgs[im['bufferView']] = (i, Image.open(io.BytesIO(BIN[s:s + bv['byteLength']])))
    def fit(img, lim):
        w, h = img.size; k = min(1, lim / max(w, h)); return (max(1, round(w * k)), max(1, round(h * k)))
    lim = 512
    if gpu(fit(im, 512) for _, im in imgs.values()) > BUDGET: lim = 256
    new = bytearray(); views = J['bufferViews']
    for vi, bv in enumerate(views):
        while len(new) % 4: new.append(0)
        s = bv.get('byteOffset', 0); chunk = BIN[s:s + bv['byteLength']]
        if vi in imgs:
            i, img = imgs[vi]
            if max(img.size) > lim:
                mime = J['images'][i].get('mimeType', 'image/png')
                img = img.resize(fit(img, lim), Image.LANCZOS)
                b = io.BytesIO()
                if mime == 'image/jpeg': img.convert('RGB').save(b, 'JPEG', quality=82)
                else: img.save(b, 'PNG', optimize=True)
                chunk = b.getvalue()
        bv['byteOffset'] = len(new); bv['byteLength'] = len(chunk); bv['buffer'] = 0
        new += chunk
    while len(new) % 4: new.append(0)
    J['buffers'] = [{'byteLength': len(new)}]
    js = json.dumps(J, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    data = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(new)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(new), 0x004E4942) + new
    open(out, 'wb').write(data)
    return lim, gpu(im.size for _, im in imgs.values()), gpu(fit(im, lim) for _, im in imgs.values())

before = after = 0
for f in sorted(glob.glob(os.path.join(SRC, '*.glb'))):
    J, _ = read(f)
    if len(J.get('buffers', [])) != 1: raise SystemExit(f'{f}: more than one buffer')
    lim, a, b = shrink(f, os.path.join(DST, os.path.basename(f)))
    before += a; after += b
print(f'graphics memory for pictures: {before/1e6:.0f} MB -> {after/1e6:.0f} MB')
