# Slims the "Vino" scooter (build/vehicles_src/scooter_vino.glb, 13 MB, 96k triangles) into a game-sized model.
# Needs nothing installed: plain Python 3, and macOS's built-in `sips` to shrink the pictures.
# usage: python3 tools/slim_scooter.py build/vehicles_src/scooter_vino.glb street_src/models/ride_scooter.glb [--tris 12000] [--size 256] [--small 0.03] [--wheel 2]
# What it does: bakes every part into metres (wheels on y = 0, nose to +z, centred), keeps only the colour pictures (shrunk),
# folds the least important edges away until the whole model is under the triangle budget, and splits the two wheels off as
# their own nodes ("wheelF", "wheelR", centred on their axles) so the game can spin them. Everything else is node "body".
import json, struct, sys, os, math, subprocess, tempfile
src, dst = sys.argv[1], sys.argv[2]
opt = lambda k, d: type(d)(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
TRIS, SIZE = opt('--tris', 12000), opt('--size', 256)
SMALL, WHEEL = opt('--small', 0.03), opt('--wheel', 2.0)
d = open(src, 'rb').read(); jl = struct.unpack('<I', d[12:16])[0]; J = json.loads(d[20:20 + jl]); BIN = d[28 + jl:]
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}; FMT = {5126: 'f', 5125: 'I', 5123: 'H', 5121: 'B'}

def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]; n = NC[a['type']]; f = FMT[a['componentType']]; sz = struct.calcsize(f) * n
    st = bv.get('byteStride') or sz; o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    if st == sz: flat = struct.unpack_from('<%d%s' % (a['count'] * n, f), BIN, o); return [flat[k:k + n] for k in range(0, len(flat), n)] if n > 1 else list(flat)
    return [struct.unpack_from('<%d%s' % (n, f), BIN, o + k * st) for k in range(a['count'])]

def mat_of(n):
    if 'matrix' in n: m = n['matrix']; return [[m[c * 4 + r] for c in range(4)] for r in range(4)]
    t = n.get('translation', [0, 0, 0]); q = n.get('rotation', [0, 0, 0, 1]); s = n.get('scale', [1, 1, 1]); x, y, z, w = q
    R = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]
    return [[R[r][0] * s[0], R[r][1] * s[1], R[r][2] * s[2], t[r]] for r in range(3)] + [[0, 0, 0, 1]]
mul = lambda A, B: [[sum(A[r][k] * B[k][c] for k in range(4)) for c in range(4)] for r in range(4)]
det3 = lambda M: M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])

# 1. every part, baked into the world: parts[material] = triangles of (position, normal, uv) points; tyres are remembered by node
soup, tyres = {}, []
def walk(i, M):
    n = J['nodes'][i]; M = mul(M, mat_of(n))
    if 'mesh' in n:
        for p in J['meshes'][n['mesh']]['primitives']:
            name = J['materials'][p['material']]['name']
            if name == 'Sticker': continue
            P, N, U, I = acc(p['attributes']['POSITION']), acc(p['attributes']['NORMAL']), acc(p['attributes']['TEXCOORD_0']), acc(p['indices'])
            W = [tuple(M[r][0] * v[0] + M[r][1] * v[1] + M[r][2] * v[2] + M[r][3] for r in range(3)) for v in P]
            Nw = []
            for v in N:   # (rotation and one even scale only, so the same matrix turns the normals)
                x = [M[r][0] * v[0] + M[r][1] * v[1] + M[r][2] * v[2] for r in range(3)]; l = math.sqrt(x[0] ** 2 + x[1] ** 2 + x[2] ** 2) or 1; Nw.append((x[0] / l, x[1] / l, x[2] / l))
            flip = det3(M) < 0; tri = []
            for k in range(0, len(I), 3):
                a, b, c = I[k], I[k + 1], I[k + 2]
                if flip: b, c = c, b
                tri.append((a, b, c))
            part = {'mat': name, 'P': W, 'N': Nw, 'U': U, 'T': tri}
            if name == 'Tire': tyres.append(part)
            soup.setdefault(name, []).append(part)
    for c in n.get('children', []): walk(c, M)
I4 = [[1 if r == c else 0 for c in range(4)] for r in range(4)]
for r in J['scenes'][J.get('scene', 0)]['nodes']: walk(r, I4)

# 2. square it up: length along z, nose (the smaller-wheel fork end is found from the two tyres) to +z, wheels on the ground, centred
allP = [v for ps in soup.values() for p in ps for v in p['P']]
lo = [min(v[k] for v in allP) for k in range(3)]; hi = [max(v[k] for v in allP) for k in range(3)]
print('raw size (m):', [round(hi[k] - lo[k], 3) for k in range(3)], 'triangles:', sum(len(p['T']) for ps in soup.values() for p in ps))
long_axis = 0 if hi[0] - lo[0] > hi[2] - lo[2] else 2
def box(P): return [min(v[k] for v in P) for k in range(3)], [max(v[k] for v in P) for k in range(3)]
tb = [box(t['P']) for t in tyres]; tc = [[(a[k] + b[k]) / 2 for k in range(3)] for a, b in tb]
# the front tyre belongs to the steering group (the second "Tire" part in the file: node Sphere001)
front, rear = tc[1], tc[0]
sgn = 1 if front[long_axis] > rear[long_axis] else -1
def fix(v):   # -> x across, y up, z forward
    if long_axis == 2: x, z = v[0] * sgn, v[2] * sgn
    else: x, z = -v[2] * sgn, v[0] * sgn
    return (x, v[1], z)
def fixn(v): return fix(v)
for ps in soup.values():
    for p in ps: p['P'] = [fix(v) for v in p['P']]; p['N'] = [fixn(v) for v in p['N']]
allP = [v for ps in soup.values() for p in ps for v in p['P']]; lo, hi = box(allP)
cx = sum(sum(v[0] for v in t['P']) / len(t['P']) for t in tyres) / len(tyres); cz = (lo[2] + hi[2]) / 2; y0 = lo[1]
for ps in soup.values():
    for p in ps: p['P'] = [(v[0] - cx, v[1] - y0, v[2] - cz) for v in p['P']]
allP = [v for ps in soup.values() for p in ps for v in p['P']]; lo, hi = box(allP)
print('size (m): wide %.3f  tall %.3f  long %.3f' % (hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]))
wheels = []
for t in tyres:
    a, b = box(t['P']); wheels.append({'c': ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), 'r': max(b[1] - a[1], b[2] - a[2]) / 2, 'w': (b[0] - a[0]) / 2})
wheels = {'wheelR': wheels[0], 'wheelF': wheels[1]}
for k, w in wheels.items(): print(k, 'centre', [round(x, 3) for x in w['c']], 'radius %.3f half-width %.3f' % (w['r'], w['w']))

# 3. which node each triangle goes to: a wheel takes its tyre and whatever sits wholly inside the tyre (rim, hub)
def home(part, tri):
    for k, w in wheels.items():
        ok = True
        for i in tri:
            v = part['P'][i]
            if part['mat'] == 'Tire': ok = abs(v[2] - w['c'][2]) < w['r'] * 1.2
            else: ok = abs(v[0] - w['c'][0]) < w['w'] * 0.92 and math.hypot(v[1] - w['c'][1], v[2] - w['c'][2]) < w['r'] * 0.8
            if not ok: break
        if ok: return k
    return 'body'
# 4. thin it out. Points that share a place are joined into one mesh; then, one at a time, the edge whose loss changes the
#    shape least is folded into one of its ends (quadric error), until the triangle budget is met. Loose bits smaller than
#    SMALL (bolts, screws) go first. The wheels count WHEEL times dearer, so they stay round.
import heapq
pos, pid, attrs, tris = [], {}, [], []   # tris: [a, b, c, attrA, attrB, attrC, node, material] (None once removed)
for name, ps in soup.items():
    for p in ps:
        base = len(attrs); attrs.extend(zip(p['N'], p['U'])); ids = []
        for v in p['P']:
            k = (round(v[0] * 20000), round(v[1] * 20000), round(v[2] * 20000)); i = pid.get(k)
            if i is None: i = pid[k] = len(pos); pos.append(v)
            ids.append(i)
        for t in p['T']:
            a, b, c = ids[t[0]], ids[t[1]], ids[t[2]]
            if a != b and b != c and a != c: tris.append([a, b, c, base + t[0], base + t[1], base + t[2], home(p, t), name])
par = list(range(len(pos)))
def find(i):
    while par[i] != i: par[i] = par[par[i]]; i = par[i]
    return i
for t in tris:
    a, b, c = find(t[0]), find(t[1]), find(t[2]); par[b] = a; par[c] = a
bb = {}
for i, v in enumerate(pos):
    r = find(i); q = bb.get(r)
    if q is None: bb[r] = [v[0], v[1], v[2], v[0], v[1], v[2]]
    else:
        for k in range(3): q[k] = min(q[k], v[k]); q[k + 3] = max(q[k + 3], v[k])
tiny = {r for r, q in bb.items() if math.sqrt(sum((q[k + 3] - q[k]) ** 2 for k in range(3))) < SMALL}
n0 = len(tris); tris = [t for t in tris if find(t[0]) not in tiny]
print('loose bits under %d mm dropped: %d parts, %d triangles' % (SMALL * 1000, len(tiny), n0 - len(tris)))
vt = [set() for _ in pos]
for i, t in enumerate(tris): vt[t[0]].add(i); vt[t[1]].add(i); vt[t[2]].add(i)
sub = lambda a, b: (a[0] - b[0], a[1] - b[1], a[2] - b[2])
cross = lambda a, b: (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
dot = lambda a, b: a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def plane_q(n, p, w):   # the quadric of one plane (unit normal n through p), weight w
    d = -dot(n, p); a, b, c = n
    return (w * a * a, w * a * b, w * a * c, w * a * d, w * b * b, w * b * c, w * b * d, w * c * c, w * c * d, w * d * d)
Q = [[0.0] * 10 for _ in pos]
def addq(i, q):
    Qi = Q[i]
    for k in range(10): Qi[k] += q[k]
edges = {}
for i, t in enumerate(tris):
    A, B, C = pos[t[0]], pos[t[1]], pos[t[2]]; n = cross(sub(B, A), sub(C, A)); l = math.sqrt(dot(n, n))
    if l < 1e-14: continue
    n = (n[0] / l, n[1] / l, n[2] / l); w = (WHEEL if t[6] != 'body' else 1.0); q = plane_q(n, A, l * 0.5 * w)
    for k in range(3): addq(t[k], q); e = (min(t[k], t[(k + 1) % 3]), max(t[k], t[(k + 1) % 3])); edges.setdefault(e, []).append((i, n, w))
for (a, b), ts in edges.items():   # an open edge (the rim of a panel, a seam between two paints) is held in place
    mats = {tris[i][7] for i, _, _ in ts}
    if len(ts) == 1 or len(mats) > 1:
        for i, n, w in ts:
            e = sub(pos[b], pos[a]); m = cross(e, n); l = math.sqrt(dot(m, m))
            if l < 1e-14: continue
            q = plane_q((m[0] / l, m[1] / l, m[2] / l), pos[a], dot(e, e) * 4 * w); addq(a, q); addq(b, q)
def err(v, u):   # what it costs to fold point v into point u
    q = [Q[v][k] + Q[u][k] for k in range(10)]; x, y, z = pos[u]
    e = q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y + 2 * q[5] * y * z + 2 * q[6] * y + q[7] * z * z + 2 * q[8] * z + q[9]
    d = sub(pos[u], pos[v]); return max(e, 0.0) + 1e-7 * dot(d, d)
ver = [0] * len(pos); heap = []
def push(v):
    seen = set()
    for i in vt[v]:
        for u in tris[i][:3]:
            if u != v and u not in seen:
                seen.add(u); heap.append((err(v, u), v, u, ver[v], ver[u])); heap.append((err(u, v), u, v, ver[u], ver[v]))
for (a, b) in edges: heap.append((err(a, b), a, b, 0, 0)); heap.append((err(b, a), b, a, 0, 0))
heapq.heapify(heap); alive = len(tris)
def tri_n(a, b, c): return cross(sub(b, a), sub(c, a))
while alive > TRIS and heap:
    c, v, u, sv, su = heapq.heappop(heap)
    if ver[v] != sv or ver[u] != su or not vt[v]: continue
    gone = [i for i in vt[v] if u in tris[i][:3]]; keep = [i for i in vt[v] if u not in tris[i][:3]]
    if not gone: continue
    ok = True; pu = pos[u]
    for i in keep:   # no triangle may flip over or go flat
        t = tris[i]; P = [pos[t[0]], pos[t[1]], pos[t[2]]]; n1 = tri_n(*P); P[t.index(v)] = pu; n2 = tri_n(*P)
        if dot(n1, n2) <= 0.15 * math.sqrt(dot(n1, n1) * dot(n2, n2)) : ok = False; break
    if not ok: continue
    amap = {}
    for i in gone: t = tris[i]; amap[t[3 + t.index(v)]] = t[3 + t.index(u)]
    ua = {t[3 + t.index(u)] for t in (tris[i] for i in vt[u])}
    for i in gone:
        for w in tris[i][:3]: vt[w].discard(i)
        tris[i] = None; alive -= 1
    have = {frozenset(tris[i][:3]) for i in vt[u]}
    for i in keep:
        t = tris[i]; k = t.index(v); old = t[3 + k]; t[k] = u
        if frozenset(t[:3]) in have:   # folded onto a triangle that is already there
            for w in t[:3]: vt[w].discard(i)
            vt[v].discard(i); tris[i] = None; alive -= 1; continue
        na = amap.get(old)
        if na is None: n0_ = attrs[old][0]; na = max(ua, key=lambda a: dot(attrs[a][0], n0_)) if ua else old; amap[old] = na
        t[3 + k] = na; vt[u].add(i); have.add(frozenset(t[:3]))
    vt[v] = set(); addq(u, Q[v]); ver[u] += 1; ver[v] += 1
    for i in vt[u]:
        for w in tris[i][:3]:
            if w != u: heapq.heappush(heap, (err(w, u), w, u, ver[w], ver[u])); heapq.heappush(heap, (err(u, w), u, w, ver[u], ver[w]))
done = {}
for t in tris:
    if t is None: continue
    V, T, ix = done.setdefault((t[6], t[7]), ([], [], {}))
    cs = []
    for k in range(3):
        key = (t[k], t[3 + k]); j = ix.get(key)
        if j is None: j = ix[key] = len(V); V.append((pos[t[k]], attrs[t[3 + k]][0], attrs[t[3 + k]][1]))
        cs.append(j)
    T.append(tuple(cs))
done = {k: (V, T) for k, (V, T, _) in done.items()}; total = sum(len(t) for _, t in done.values())
print('thinned to %d triangles, %d points' % (total, sum(len(v) for v, _ in done.values())))

# 5. the colour pictures, shrunk with sips
tmp = tempfile.mkdtemp(); pics = {}
for mi, m in enumerate(J['materials']):
    if m['name'] == 'Sticker' or m['name'] not in soup: continue
    img = J['images'][J['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]; bv = J['bufferViews'][img['bufferView']]
    raw = BIN[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]; a = os.path.join(tmp, 'in%d.%s' % (mi, 'png' if 'png' in img['mimeType'] else 'jpg')); b = os.path.join(tmp, 'out%d.jpg' % mi)
    open(a, 'wb').write(raw); subprocess.run(['sips', '-Z', str(SIZE), '-s', 'format', 'jpeg', '-s', 'formatOptions', '72', a, '--out', b], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    pics[m['name']] = open(b, 'rb').read()

# 6. write the new file
out = bytearray(); views = []; accs = []; G = {'asset': {'version': '2.0', 'generator': 'tools/slim_scooter.py'}, 'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [], 'materials': [], 'textures': [], 'images': [], 'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}], 'buffers': [{}]}
def view(data, target=None):
    while len(out) % 4: out.append(0)
    v = {'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}
    if target: v['target'] = target
    out.extend(data); views.append(v); return len(views) - 1
def accessor(data, ctype, typ, count, mn=None, mx=None, target=None, norm=False):
    a = {'bufferView': view(data, target), 'componentType': ctype, 'count': count, 'type': typ}
    if mn is not None: a['min'], a['max'] = mn, mx
    if norm: a['normalized'] = True
    accs.append(a); return len(accs) - 1
matIx = {}
for m in J['materials']:
    name = m['name']
    if name not in pics: continue
    G['images'].append({'mimeType': 'image/jpeg', 'bufferView': view(pics[name])}); G['textures'].append({'sampler': 0, 'source': len(G['images']) - 1})
    pb = {'baseColorTexture': {'index': len(G['textures']) - 1}, 'metallicFactor': 0.0, 'roughnessFactor': {'Main_Body': 0.35, 'Tire': 0.9, 'Glass': 0.15, 'Lamp__Glass': 0.25}.get(name, 0.55)}
    nm = {'name': name, 'pbrMetallicRoughness': pb}
    if name == 'Glass': pb['baseColorFactor'] = [1, 1, 1, 0.35]; nm['alphaMode'] = 'BLEND'
    if m.get('doubleSided'): nm['doubleSided'] = True
    matIx[name] = len(G['materials']); G['materials'].append(nm)
for node in ['body', 'wheelF', 'wheelR']:
    c = wheels[node]['c'] if node in wheels else (0, 0, 0); prims = []
    for (nd, name), (V, T) in done.items():
        if nd != node or not T: continue
        P = [(v[0][0] - c[0], v[0][1] - c[1], v[0][2] - c[2]) for v in V]
        pa = accessor(struct.pack('<%df' % (len(P) * 3), *[x for p in P for x in p]), 5126, 'VEC3', len(P), [min(p[k] for p in P) for k in range(3)], [max(p[k] for p in P) for k in range(3)], 34962)
        na = accessor(struct.pack('<%db' % (len(V) * 4), *[x for v in V for x in (round(v[1][0] * 127), round(v[1][1] * 127), round(v[1][2] * 127), 0)]), 5120, 'VEC3', len(V), target=34962, norm=True); views[-1]['byteStride'] = 4
        ua = accessor(struct.pack('<%dH' % (len(V) * 2), *[min(65535, max(0, round(x * 65535))) for v in V for x in v[2]]), 5123, 'VEC2', len(V), target=34962, norm=True)
        ia = accessor(struct.pack('<%dH' % (len(T) * 3), *[i for t in T for i in t]), 5123, 'SCALAR', len(T) * 3, target=34963) if len(V) < 65536 else accessor(struct.pack('<%dI' % (len(T) * 3), *[i for t in T for i in t]), 5125, 'SCALAR', len(T) * 3, target=34963)
        prims.append({'attributes': {'POSITION': pa, 'NORMAL': na, 'TEXCOORD_0': ua}, 'indices': ia, 'material': matIx[name]})
    G['meshes'].append({'name': node, 'primitives': prims}); G['nodes'].append({'name': node, 'mesh': len(G['meshes']) - 1, 'translation': [round(x, 5) for x in c]}); G['scenes'][0]['nodes'].append(len(G['nodes']) - 1)
    print(' ', node, sum(accs[p['indices']]['count'] // 3 for p in prims), 'triangles')
while len(out) % 4: out.append(0)
G['bufferViews'] = views; G['accessors'] = accs; G['buffers'][0]['byteLength'] = len(out)
js = json.dumps(G, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4)
open(dst, 'wb').write(b'glTF' + struct.pack('<II', 2, 28 + len(js) + len(out)) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(out)) + b'BIN\x00' + bytes(out))
print(dst, round(os.path.getsize(dst) / 1024), 'KB,', total, 'triangles')
