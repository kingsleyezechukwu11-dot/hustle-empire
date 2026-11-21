# Flattens a downloaded model into one mesh with one part per material, so the game draws it in a few calls instead of thousands.
# usage: python3 tools/merge_glb.py SRC.glb DST.glb [--drop-above Y] [--drop-node NAME,NAME]
#   --drop-above: pieces lying wholly above height Y are left out (e.g. a floating billboard); --drop-node: pieces with these names are left out
import json, struct, sys, math
from array import array

src, dst = sys.argv[1], sys.argv[2]
above = float(sys.argv[sys.argv.index('--drop-above') + 1]) if '--drop-above' in sys.argv else math.inf
drop = set(sys.argv[sys.argv.index('--drop-node') + 1].split(',')) if '--drop-node' in sys.argv else set()  # pieces left out by name, e.g. doors the game makes itself
d = open(src, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); BIN = d[28 + jl:]

def mul(A, B): return [[sum(A[i][k] * B[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
def local(n):
    if 'matrix' in n: m = n['matrix']; return [[m[c * 4 + r] for c in range(4)] for r in range(4)]
    x, y, z, w = n.get('rotation', [0, 0, 0, 1]); sx, sy, sz = n.get('scale', [1, 1, 1]); t = n.get('translation', [0, 0, 0])
    R = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]
    return [[R[r][0] * sx, R[r][1] * sy, R[r][2] * sz, t[r]] for r in range(3)] + [[0, 0, 0, 1]]

def read(ai, n):
    a = J['accessors'][ai]; bv = J['bufferViews'][a['bufferView']]; off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    code = {5126: 'f', 5125: 'I', 5123: 'H', 5121: 'B'}[a['componentType']]; size = struct.calcsize(code); stride = bv.get('byteStride', size * n)
    out = array(code)
    if stride == size * n: out.frombytes(BIN[off:off + a['count'] * n * size])
    else:
        for i in range(a['count']): out.frombytes(BIN[off + i * stride: off + i * stride + n * size])
    return out

groups = {}  # material -> [positions, normals, uvs, indices]
def walk(i, P):
    n = J['nodes'][i]; W = mul(P, local(n))
    if n.get('name') in drop: return
    if 'mesh' in n:
        N = [[W[r][c] for c in range(3)] for r in range(3)]
        for p in J['meshes'][n['mesh']]['primitives']:
            if p.get('mode', 4) != 4: continue
            pos = read(p['attributes']['POSITION'], 3)
            wp = array('f', [0.0]) * len(pos); low = math.inf
            for v in range(0, len(pos), 3):
                x, y, z = pos[v], pos[v + 1], pos[v + 2]
                for r in range(3): wp[v + r] = W[r][0] * x + W[r][1] * y + W[r][2] * z + W[r][3]
                low = min(low, wp[v + 1])
            if low > above: continue
            nor = read(p['attributes']['NORMAL'], 3) if 'NORMAL' in p['attributes'] else array('f', [0.0, 1.0, 0.0] * (len(pos) // 3))
            wn = array('f', [0.0]) * len(nor)
            for v in range(0, len(nor), 3):
                x, y, z = nor[v], nor[v + 1], nor[v + 2]; a = [N[r][0] * x + N[r][1] * y + N[r][2] * z for r in range(3)]; L = math.sqrt(sum(q * q for q in a)) or 1
                for r in range(3): wn[v + r] = a[r] / L
            uv = read(p['attributes']['TEXCOORD_0'], 2) if 'TEXCOORD_0' in p['attributes'] else array('f', [0.0, 0.0] * (len(pos) // 3))
            idx = read(p['indices'], 1) if 'indices' in p else array('I', range(len(pos) // 3))
            det = N[0][0] * (N[1][1] * N[2][2] - N[1][2] * N[2][1]) - N[0][1] * (N[1][0] * N[2][2] - N[1][2] * N[2][0]) + N[0][2] * (N[1][0] * N[2][1] - N[1][1] * N[2][0])
            if det < 0: idx = array('I', [idx[k - k % 3 + (0, 2, 1)[k % 3]] for k in range(len(idx))])  # a mirrored piece (negative scale) would face inwards: turn its triangles round
            g = groups.setdefault(p.get('material', -1), [array('f'), array('f'), array('f'), array('I')])
            base = len(g[0]) // 3; g[0].extend(wp); g[1].extend(wn); g[2].extend(uv); g[3].extend(array('I', [k + base for k in idx]))
    for c in n.get('children', []): walk(c, W)

for r in J['scenes'][J.get('scene', 0)]['nodes']: walk(r, [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])

out = bytearray(); views = []; accs = []; prims = []
def put(data, target=None):
    while len(out) % 4: out.append(0)
    views.append({'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}); out.extend(data)
    if target: views[-1]['target'] = target
    return len(views) - 1
for im in J.get('images', []):  # pictures carried over as they are
    bv = J['bufferViews'][im['bufferView']]; s = bv.get('byteOffset', 0); im['bufferView'] = put(BIN[s:s + bv['byteLength']])
for mat, (P, Nn, U, I) in groups.items():
    lo = [min(P[k::3]) for k in range(3)]; hi = [max(P[k::3]) for k in range(3)]; cnt = len(P) // 3
    accs.append({'bufferView': put(P.tobytes(), 34962), 'componentType': 5126, 'count': cnt, 'type': 'VEC3', 'min': lo, 'max': hi})
    accs.append({'bufferView': put(Nn.tobytes(), 34962), 'componentType': 5126, 'count': cnt, 'type': 'VEC3'})
    accs.append({'bufferView': put(U.tobytes(), 34962), 'componentType': 5126, 'count': cnt, 'type': 'VEC2'})
    accs.append({'bufferView': put(I.tobytes(), 34963), 'componentType': 5125, 'count': len(I), 'type': 'SCALAR'})
    a = len(accs); pr = {'attributes': {'POSITION': a - 4, 'NORMAL': a - 3, 'TEXCOORD_0': a - 2}, 'indices': a - 1}
    if mat >= 0: pr['material'] = mat
    prims.append(pr)
while len(out) % 4: out.append(0)
G = {'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}], 'meshes': [{'primitives': prims}], 'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(out)}]}
for k in ['materials', 'textures', 'images', 'samplers']:
    if k in J: G[k] = J[k]
js = json.dumps(G, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
open(dst, 'wb').write(struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + out)
tris = sum(len(g[3]) for g in groups.values()) // 3
print(f'{len(groups)} parts, {tris} triangles, {len(out) / 1e6:.1f} MB')
