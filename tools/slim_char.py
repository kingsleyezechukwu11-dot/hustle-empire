# Slims a downloaded rigged character (.glb) for the game: animations and face shapes are dropped, only colour pictures are kept (shrunk), named parts can be left out.
# usage: python3 tools/slim_char.py SRC.glb DST.glb [--size 512] [--drop word,word]   (--drop: leave out meshes whose mesh or material name contains a word)
import json, struct, sys, io
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
SIZE = int(sys.argv[sys.argv.index('--size') + 1]) if '--size' in sys.argv else 512
DROP = [w.lower() for w in sys.argv[sys.argv.index('--drop') + 1].split(',')] if '--drop' in sys.argv else []
d = open(src, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); BIN = d[28 + jl:]
J.pop('animations', None)
mats = J.get('materials', [])
def gone(mesh, p): name = (mesh.get('name', '') + ' ' + (mats[p['material']].get('name', '') if 'material' in p else '')).lower(); return any(w in name for w in DROP)
for m in J['meshes']:
    m['primitives'] = [p for p in m['primitives'] if not gone(m, p)]; m.pop('weights', None); m.pop('extras', None)
    for p in m['primitives']:
        p.pop('targets', None); p['attributes'] = {k: v for k, v in p['attributes'].items() if k in ('POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0')}
empty = {i for i, m in enumerate(J['meshes']) if not m['primitives']}
for n in J['nodes']:
    if n.get('mesh') in empty: n.pop('mesh'); n.pop('skin', None)
    n.pop('weights', None)
for i in empty: J['meshes'][i]['primitives'] = []
# glTF does not allow a mesh with no primitives: renumber the meshes that remain
remap = {}; keepm = []
for i, m in enumerate(J['meshes']):
    if i not in empty: remap[i] = len(keepm); keepm.append(m)
J['meshes'] = keepm
for n in J['nodes']:
    if 'mesh' in n: n['mesh'] = remap[n['mesh']]
used = {p['material'] for m in J['meshes'] for p in m['primitives'] if 'material' in p}
keep_img = {}
for i, m in enumerate(mats):
    for k in ('normalTexture', 'occlusionTexture', 'emissiveTexture', 'extensions'): m.pop(k, None)
    pbr = m.get('pbrMetallicRoughness', {}); pbr.pop('metallicRoughnessTexture', None)
    if 'baseColorTexture' in pbr:
        pbr['baseColorTexture'].pop('extensions', None)
        if i in used: keep_img[J['textures'][pbr['baseColorTexture']['index']]['source']] = m.get('alphaMode', 'OPAQUE') != 'OPAQUE'
        else: pbr.pop('baseColorTexture')
out = bytearray(); views = []
def put(data, target=None, stride=None):
    while len(out) % 4: out.append(0)
    v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}
    if target: v['target'] = target
    views.append(v); out.extend(data); return len(views) - 1
OV = J['bufferViews']; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}; CS = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
accs = set()
for m in J['meshes']:
    for p in m['primitives']: accs.update(p['attributes'].values()); accs.add(p['indices']) if 'indices' in p else None
for s in J.get('skins', []):
    if 'inverseBindMatrices' in s: accs.add(s['inverseBindMatrices'])
idx = {p['indices'] for m in J['meshes'] for p in m['primitives'] if 'indices' in p}
newacc = []; amap = {}
for a in sorted(accs):
    A = dict(J['accessors'][a]); bv = OV[A['bufferView']]; n = NC[A['type']] * CS[A['componentType']]; off = bv.get('byteOffset', 0) + A.get('byteOffset', 0); st = bv.get('byteStride', n)
    data = BIN[off:off + A['count'] * n] if st == n else b''.join(BIN[off + i * st: off + i * st + n] for i in range(A['count']))
    A['bufferView'] = put(data, 34963 if a in idx else (None if A['type'] == 'MAT4' else 34962)); A.pop('byteOffset', None); A.pop('sparse', None); amap[a] = len(newacc); newacc.append(A)
for m in J['meshes']:
    for p in m['primitives']:
        p['attributes'] = {k: amap[v] for k, v in p['attributes'].items()}
        if 'indices' in p: p['indices'] = amap[p['indices']]
for s in J.get('skins', []):
    if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = amap[s['inverseBindMatrices']]
J['accessors'] = newacc
for i, im in enumerate(J.get('images', [])):
    if i in keep_img:
        bv = OV[im['bufferView']]; s0 = bv.get('byteOffset', 0); pic = Image.open(io.BytesIO(BIN[s0:s0 + bv['byteLength']])); alpha = keep_img[i] and pic.mode in ('RGBA', 'LA', 'P')
        k = min(1, SIZE / max(pic.size)); pic = pic.convert('RGBA' if alpha else 'RGB').resize((max(1, round(pic.size[0] * k)), max(1, round(pic.size[1] * k))), Image.LANCZOS); b = io.BytesIO()
        if alpha: pic.save(b, 'PNG', optimize=True); im['mimeType'] = 'image/png'
        else: pic.save(b, 'JPEG', quality=84); im['mimeType'] = 'image/jpeg'
        im['bufferView'] = put(b.getvalue())
    else:
        b = io.BytesIO(); Image.new('RGB', (2, 2), (128, 128, 128)).save(b, 'PNG'); im['bufferView'] = put(b.getvalue()); im['mimeType'] = 'image/png'  # (a picture nothing uses any more: a dot in its place keeps the numbering)
    im.pop('uri', None)
while len(out) % 4: out.append(0)
J['bufferViews'] = views; J['buffers'] = [{'byteLength': len(out)}]; J.pop('extensionsUsed', None); J.pop('extensionsRequired', None)
js = json.dumps(J, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + out)
print(len(J['meshes']), 'meshes,', sum(J['accessors'][p['attributes']['POSITION']]['count'] for m in J['meshes'] for p in m['primitives']), 'points,', round((28 + len(js) + len(out)) / 1e6, 2), 'MB')
