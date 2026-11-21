// Turns a downloaded vehicle (.glb) into a game-sized one: in metres, wheels on y = 0, nose to +z, centred.
// Every part is baked into place, the wheels are split off as their own nodes (centred on their axles, so the game can spin
// them), only the colour pictures are kept (shrunk), and the shapes are thinned down to a triangle budget.
//   node tools/slim_vehicle.mjs SRC DST --len 4.6 [--yaw 90] [--kind car|two] [--tris 14000] [--tex 512] [--drop name,name] [--flip]
// --len: its length in metres. --yaw: degrees to turn it (about the vertical) so its nose points to +z. --kind two = two wheels.
// --drop: materials (or node names) to leave out, by a part of their name. --up z: the model's up is its +z.
// Needs @gltf-transform/core, @gltf-transform/functions, meshoptimizer and sharp (npm install them in any folder and run from there
// with NODE_PATH, or see CLAUDE.md). Output nodes: 'body', and 'wheel' x4 (car) or 'wheelF' + 'wheelR' (two wheels); each wheel's
// extras.rad is its radius.
import { createRequire } from 'module'; import path from 'path';
const require = createRequire(path.join(process.cwd(), 'x.js'));
const { NodeIO, Document } = require('@gltf-transform/core'), { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { weld, simplify, prune, dedup } = require('@gltf-transform/functions'), { MeshoptSimplifier } = require('meshoptimizer'), sharp = require('sharp');
const A = process.argv.slice(2), src = A[0], dst = A[1], opt = (k, d) => (A.includes(k) ? (typeof d === 'number' ? +A[A.indexOf(k) + 1] : A[A.indexOf(k) + 1]) : d);
const LEN = opt('--len', 4.5), YAW = opt('--yaw', 0) * Math.PI / 180, KIND = opt('--kind', 'car'), TRIS = opt('--tris', 14000), TEX = opt('--tex', 512), DROP = opt('--drop', '').split(',').filter(Boolean), UP = opt('--up', 'y'), NOWHEEL = A.includes('--nowheels'), SOLID = opt('--solid', '').split(',').filter(Boolean), OPAQUE = A.includes('--opaque'), ERR = opt('--err', 0.03), WPAD = opt('--wpad', 1.04);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.simplifier': MeshoptSimplifier });
const doc = await io.read(src), root = doc.getRoot();
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; };
const inv3 = (m) => { const [a, b, c, , d, e, f, , g, h, i] = m, A2 = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A2 + b * B + c * C; return [A2 / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det]; };
// --turn Name,axis,degrees : turn one named part about its own x, y or z first (a model posed with its handlebars turned)
if (A.includes('--turn')) { const [nm, ax, deg] = opt('--turn', '').split(','), h = +deg * Math.PI / 360, q2 = [ax === 'x' ? Math.sin(h) : 0, ax === 'y' ? Math.sin(h) : 0, ax === 'z' ? Math.sin(h) : 0, Math.cos(h)];
  for (const n of root.listNodes()) if ((n.getName() || '') === nm) { const [x1, y1, z1, w1] = n.getRotation(), [x2, y2, z2, w2] = q2; n.setRotation([w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2, w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2, w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2]); console.log('  turned', n.getName()); } }
const under = (node) => { for (let n = node; n && n.getName; n = n.getParentNode ? n.getParentNode() : null) if (DROP.some((d) => (n.getName() || '').includes(d))) return true; return false; };
// 1. every triangle, baked into the world, grouped by material
const groups = new Map(); let total = 0;
const groupOf = (mat) => { if (!groups.has(mat)) groups.set(mat, { mat, pos: [], nor: [], uv: [], idx: [] }); return groups.get(mat); };
for (const scene of root.listScenes()) scene.traverse((node) => {
  const mesh = node.getMesh(); if (!mesh) return; if (under(node)) return;
  const W = node.getWorldMatrix(), skin = A.includes('--bindpose') ? null : node.getSkin(), joints = skin ? skin.listJoints().map((j) => j.getWorldMatrix()) : null, ibm = skin && skin.getInverseBindMatrices();
  const JM = joints ? joints.map((jw, k) => mul(jw, ibm ? ibm.getElement(k, []) : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])) : null;
  for (const prim of mesh.listPrimitives()) {
    if (prim.getMode() !== 4) continue; const mat = prim.getMaterial(); if (mat && DROP.some((d) => (mat.getName() || '').includes(d))) continue;
    const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'), bt = mat && mat.getBaseColorTextureInfo(), tc = bt ? bt.getTexCoord() : 0, U = prim.getAttribute('TEXCOORD_' + tc) || prim.getAttribute('TEXCOORD_0');
    const J = prim.getAttribute('JOINTS_0'), Wt = prim.getAttribute('WEIGHTS_0'), I = prim.getIndices(), g = groupOf(mat), base = g.pos.length / 3, n = P.getCount(), e = [], j4 = [], w4 = [];
    let tr = null; if (bt && mat.getExtension('KHR_texture_transform')) tr = null; // (none of these models use it on the colour picture)
    for (let v = 0; v < n; v++) {
      P.getElement(v, e); let M = W;
      if (JM && J && Wt) { J.getElement(v, j4); Wt.getElement(v, w4); M = new Array(16).fill(0); let s = 0; for (let k = 0; k < 4; k++) { if (!w4[k]) continue; s += w4[k]; const m = JM[j4[k]]; for (let q = 0; q < 16; q++) M[q] += m[q] * w4[k]; } if (s > 0) for (let q = 0; q < 16; q++) M[q] /= s; else M = W; }
      g.pos.push(M[0] * e[0] + M[4] * e[1] + M[8] * e[2] + M[12], M[1] * e[0] + M[5] * e[1] + M[9] * e[2] + M[13], M[2] * e[0] + M[6] * e[1] + M[10] * e[2] + M[14]);
      if (N) { N.getElement(v, e); const t = inv3(M); let x = t[0] * e[0] + t[1] * e[1] + t[2] * e[2], y = t[3] * e[0] + t[4] * e[1] + t[5] * e[2], z = t[6] * e[0] + t[7] * e[1] + t[8] * e[2]; const l = Math.hypot(x, y, z) || 1; g.nor.push(x / l, y / l, z / l); } else g.nor.push(0, 1, 0);
      if (U) { U.getElement(v, e); g.uv.push(e[0], e[1]); } else g.uv.push(0, 0);
    }
    const cnt = I ? I.getCount() : n, flip = W[0] * (W[5] * W[10] - W[6] * W[9]) - W[4] * (W[1] * W[10] - W[2] * W[9]) + W[8] * (W[1] * W[6] - W[2] * W[5]) < 0; /* a mirrored part: its triangles must be turned over to face outwards again */
    for (let k = 0; k + 2 < cnt; k += 3) { g.idx.push(base + (I ? I.getScalar(k) : k), base + (I ? I.getScalar(k + (flip ? 2 : 1)) : k + (flip ? 2 : 1)), base + (I ? I.getScalar(k + (flip ? 1 : 2)) : k + (flip ? 1 : 2))); total++; }
  }
});
// 2. stand it up, turn its nose to +z, scale to its real length, centre it, wheels on the ground
const each = (fn) => { for (const g of groups.values()) for (let k = 0; k < g.pos.length; k += 3) fn(g, k); };
if (UP === 'z') each((g, k) => { for (const a of [g.pos, g.nor]) { const y = a[k + 1], z = a[k + 2]; a[k + 1] = z; a[k + 2] = -y; } });
const cs = Math.cos(YAW), sn = Math.sin(YAW); each((g, k) => { for (const a of [g.pos, g.nor]) { const x = a[k], z = a[k + 2]; a[k] = x * cs + z * sn; a[k + 2] = -x * sn + z * cs; } });
const box = () => { const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]; each((g, k) => { for (let a = 0; a < 3; a++) { const v = g.pos[k + a]; if (v < b[a]) b[a] = v; if (v > b[a + 3]) b[a + 3] = v; } }); return b; };
let b = box(); const S = LEN / (b[5] - b[2]), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, y0 = b[1];
each((g, k) => { g.pos[k] = (g.pos[k] - cx) * S; g.pos[k + 1] = (g.pos[k + 1] - y0) * S; g.pos[k + 2] = (g.pos[k + 2] - cz) * S; }); b = box();
console.log(path.basename(src), total, 'triangles;', 'size', (b[3] - b[0]).toFixed(2), (b[4] - b[1]).toFixed(2), (b[5] - b[2]).toFixed(2));
// 3. the separate shells of the model (triangles joined through shared points), across all materials
const G = [...groups.values()], off = []; let nv = 0; for (const g of G) { off.push(nv); nv += g.pos.length / 3; }
const par = new Int32Array(nv).map((_, i) => i), find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, join = (a, c) => { a = find(a); c = find(c); if (a !== c) par[a] = c; };
{ const seen = new Map(); G.forEach((g, gi) => { for (let v = 0; v < g.pos.length / 3; v++) { const key = Math.round(g.pos[v * 3] * 2000) + ',' + Math.round(g.pos[v * 3 + 1] * 2000) + ',' + Math.round(g.pos[v * 3 + 2] * 2000), o = seen.get(key); if (o === undefined) seen.set(key, off[gi] + v); else join(off[gi] + v, o); }
  for (let k = 0; k < g.idx.length; k += 3) { join(off[gi] + g.idx[k], off[gi] + g.idx[k + 1]); join(off[gi] + g.idx[k], off[gi] + g.idx[k + 2]); } }); }
const comp = new Map(); G.forEach((g, gi) => { for (let v = 0; v < g.pos.length / 3; v++) { const r = find(off[gi] + v); let c = comp.get(r); if (!c) comp.set(r, c = { b: [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity], n: 0 }); c.n++; for (let a = 0; a < 3; a++) { const p = g.pos[v * 3 + a]; if (p < c.b[a]) c.b[a] = p; if (p > c.b[a + 3]) c.b[a + 3] = p; } } });
// 4. the wheels: a tyre is a round shell standing on the ground; everything round and centred on its axle inside it turns with it
const wheels = [];
if (!NOWHEEL) {
  const tyres = [...comp.values()].filter((c) => c.b[1] < 0.03 && c.n > 20).map((c) => ({ h: c.b[4] - c.b[1], d: c.b[5] - c.b[2], w: c.b[3] - c.b[0], x: (c.b[0] + c.b[3]) / 2, y: (c.b[1] + c.b[4]) / 2, z: (c.b[2] + c.b[5]) / 2, c }))
    .filter((t) => Math.abs(t.h - t.d) < 0.12 * t.h && t.w < t.h * 0.8 && t.h > LEN * 0.08 && t.h < LEN * 0.5);
  const slots = KIND === 'two' ? [[0, 1], [0, -1]] : [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  for (const [sx, sz] of slots) { const mine = tyres.filter((t) => Math.sign(t.z) === sz && (sx === 0 || Math.sign(t.x) === sx)).sort((p, q) => q.h - p.h)[0]; if (!mine) { console.log('  no tyre found at', sx, sz); continue; }
    wheels.push({ sx, sz, x: mine.x, y: mine.y, z: mine.z, r: mine.h / 2, w: mine.w, name: KIND === 'two' ? (sz > 0 ? 'wheelF' : 'wheelR') : 'wheel' }); }
  for (const w of wheels) console.log('  ' + w.name, 'at', w.x.toFixed(2), w.y.toFixed(2), w.z.toFixed(2), 'radius', w.r.toFixed(3), 'wide', w.w.toFixed(2));
}
const wheelOf = (c) => { for (let i = 0; i < wheels.length; i++) { const w = wheels[i], h = c.b[4] - c.b[1], d = c.b[5] - c.b[2], my = (c.b[1] + c.b[4]) / 2, mz = (c.b[2] + c.b[5]) / 2, pad = KIND === 'two' ? Math.max(0.09, w.w) : w.w * 0.45;
  if (h > w.r * 2 * WPAD || d > w.r * 2 * WPAD || Math.abs(h - d) > 0.2 * Math.max(h, d) + 0.01) continue; if (Math.hypot(my - w.y, mz - w.z) > 0.12 * w.r + 0.005) continue;
  if (c.b[0] < w.x - w.w / 2 - pad || c.b[3] > w.x + w.w / 2 + pad) continue; return i; } return -1; };
for (const c of comp.values()) c.wheel = wheelOf(c);
// 5. the new file
const out = new Document(), buf = out.createBuffer(), scene = out.createScene('vehicle'), mats = new Map(), texs = new Map();
async function matOf(m) {
  if (mats.has(m)) return mats.get(m); const OPAQUE = A.includes('--opaque') || (m && SOLID.some((d) => (m.getName() || '') === d)); const n = out.createMaterial(m ? m.getName() : 'plain'); mats.set(m, n); if (!m) return n;
  n.setBaseColorFactor(m.getBaseColorFactor()).setMetallicFactor(m.getMetallicRoughnessTexture() ? 0.1 : m.getMetallicFactor()).setRoughnessFactor(m.getMetallicRoughnessTexture() ? 0.5 : m.getRoughnessFactor())   /* (the picture that said where it is metal is not kept: without it 'all metal' would show as black) */
   .setAlphaMode(OPAQUE ? 'OPAQUE' : m.getAlphaMode()).setAlphaCutoff(m.getAlphaCutoff()).setDoubleSided(m.getDoubleSided());
  const e = m.getEmissiveFactor(); if (e[0] + e[1] + e[2] > 0 && !m.getEmissiveTexture()) n.setEmissiveFactor(e);
  const t = m.getBaseColorTexture(); if (t) { if (!texs.has(t)) { const im = sharp(Buffer.from(t.getImage())), meta = await im.metadata(), alpha = !OPAQUE && meta.hasAlpha && m.getAlphaMode() !== 'OPAQUE';
      const data = await (alpha ? im.resize(TEX, TEX, { fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9, palette: false }) : im.removeAlpha().resize(TEX, TEX, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 })).toBuffer();
      texs.set(t, out.createTexture(t.getName() || 'colour').setImage(new Uint8Array(data)).setMimeType(alpha ? 'image/png' : 'image/jpeg')); }
    n.setBaseColorTexture(texs.get(t)); const si = m.getBaseColorTextureInfo(), di = n.getBaseColorTextureInfo(); di.setWrapS(si.getWrapS()).setWrapT(si.getWrapT()); }
  return n;
}
const parts = [{ name: 'body', at: [0, 0, 0] }, ...wheels.map((w) => ({ name: w.name, at: [w.x, w.y, w.z], rad: w.r }))], meshes = parts.map((p) => out.createMesh(p.name));
let kept = 0;
await MeshoptSimplifier.ready;
const allPos = new Float32Array(nv * 3), grpOf = new Int32Array(nv); G.forEach((g, gi) => { allPos.set(g.pos, off[gi] * 3); grpOf.fill(gi, off[gi], off[gi] + g.pos.length / 3); });
const snapPos = allPos.map((v) => Math.round(v * 4000) / 4000);   /* points that should meet, made to meet exactly, so the thinning sees one surface */
const pid = new Int32Array(nv), twin = new Set(); { const seen = new Map(); for (let v = 0; v < nv; v++) { const key = snapPos[v * 3] + ',' + snapPos[v * 3 + 1] + ',' + snapPos[v * 3 + 2]; let o = seen.get(key); if (o === undefined) seen.set(key, o = seen.size); pid[v] = o; } }
// corners that are the same point with (nearly) the same facing and the same place on the picture become one corner: a model saved as loose triangles cannot be thinned
const rep = new Int32Array(nv); { const seen = new Map(), sum = new Map(); G.forEach((g, gi) => { for (let v = 0; v < g.pos.length / 3; v++) { const gv = off[gi] + v, tex = !!(g.mat && g.mat.getBaseColorTexture()), key = gi + '|' + pid[gv] + (tex ? '|' + Math.round(g.nor[v * 3] * 3) + ',' + Math.round(g.nor[v * 3 + 1] * 3) + ',' + Math.round(g.nor[v * 3 + 2] * 3) + '|' + Math.round(g.uv[v * 2] * 4096) + ',' + Math.round(g.uv[v * 2 + 1] * 4096) : ''); /* (a plain paint: one corner per point, its shading is worked out again below) */
    let o = seen.get(key); if (o === undefined) { seen.set(key, o = gv); sum.set(o, [0, 0, 0]); } rep[gv] = o; const t = sum.get(o); t[0] += g.nor[v * 3]; t[1] += g.nor[v * 3 + 1]; t[2] += g.nor[v * 3 + 2]; } });
  for (const [gv, t] of sum) { const gi = grpOf[gv], v = gv - off[gi], l = Math.hypot(t[0], t[1], t[2]) || 1; G[gi].nor[v * 3] = t[0] / l; G[gi].nor[v * 3 + 1] = t[1] / l; G[gi].nor[v * 3 + 2] = t[2] / l; } }
let twins = 0;   /* a face modelled twice (often once for each side) is kept once and shown from both sides: doubled faces also stop the thinning */
const tri = parts.map(() => []); G.forEach((g, gi) => { for (let k = 0; k < g.idx.length; k += 3) { const a2 = rep[off[gi] + g.idx[k]], b2 = rep[off[gi] + g.idx[k + 1]], c2 = rep[off[gi] + g.idx[k + 2]], key = [pid[a2], pid[b2], pid[c2]].sort((x, y) => x - y).join(',');
  if (pid[a2] === pid[b2] || pid[b2] === pid[c2] || pid[a2] === pid[c2]) continue; if (twin.has(key)) { twins++; g.two = true; continue; } twin.add(key); const pi = comp.get(find(a2)).wheel + 1; tri[pi].push(a2, b2, c2); } });
if (twins) console.log('  ' + twins + ' doubled faces removed');
const all = tri.reduce((s2, t) => s2 + t.length / 3, 0), share = Math.min(1, TRIS / all);
for (let pi = 0; pi < parts.length; pi++) { let idx = new Uint32Array(tri[pi]); if (!idx.length) continue; const at = parts[pi].at;
  // a wheel modelled turned (steered, or simply not square to the car) would wobble as it spins: find which way its disc really faces
  // (the direction it is thinnest in, seen from above) and square it up, so its axle lies exactly across the car
  let wc = 1, ws = 0; if (pi > 0) { let sxx = 0, szz = 0, sxz = 0, n = 0; const seenV = new Set(); for (const gv of idx) { if (seenV.has(gv)) continue; seenV.add(gv); const x = allPos[gv * 3] - at[0], z = allPos[gv * 3 + 2] - at[2]; sxx += x * x; szz += z * z; sxz += x * z; n++; }
    let turn = Math.PI / 2 - 0.5 * Math.atan2(2 * sxz, sxx - szz); while (turn > Math.PI / 2) turn -= Math.PI; while (turn <= -Math.PI / 2) turn += Math.PI;
    if (Math.abs(turn) > 0.004 && Math.abs(turn) < 0.8) { wc = Math.cos(turn); ws = Math.sin(turn); console.log('  ' + parts[pi].name + ' squared up by ' + (turn * 180 / Math.PI).toFixed(1) + ' degrees'); } }
  const sq = (x, z) => [x * wc - z * ws, x * ws + z * wc];
  if (share < 1) { const want = Math.max(pi ? 300 : 600, Math.round(idx.length / 3 * (pi ? Math.min(1, share * 1.6) : share))) * 3; if (want < idx.length) { const loc = new Map(), back = [], lp = []; const li = idx.map((gv) => { let o = loc.get(gv); if (o === undefined) { loc.set(gv, o = back.length); back.push(gv); lp.push(snapPos[gv * 3], snapPos[gv * 3 + 1], snapPos[gv * 3 + 2]); } return o; }), lpos = new Float32Array(lp); /* only the corners in use: spare copies of a point would each count as a seam and freeze it */
      let cur = li; for (const e of [ERR, ERR * 2]) { const got = MeshoptSimplifier.simplify(cur, lpos, 3, want, e, [])[0]; if (got.length < cur.length) cur = got; if (cur.length <= want * 1.25) break; } idx = cur.map((o) => back[o]);
      if (idx.length > want * 1.5 && A.includes('--sloppy')) idx = MeshoptSimplifier.simplifySloppy(idx, allPos, 3, null, want, 0.05)[0]; } }
  kept += idx.length / 3; const per = new Map();   /* triangles back to their paints (a triangle goes with its first corner's paint) */
  for (let k = 0; k < idx.length; k += 3) { const gi = grpOf[idx[k]]; let o = per.get(gi); if (!o) per.set(gi, o = { map: new Map(), pos: [], nor: [], uv: [], idx: [] });
    for (let q = 0; q < 3; q++) { const gv = idx[k + q], g2 = G[grpOf[gv]], v = gv - off[grpOf[gv]]; let nvi = o.map.get(gv); if (nvi === undefined) { nvi = o.pos.length / 3; o.map.set(gv, nvi); const [px2, pz2] = sq(g2.pos[v * 3] - at[0], g2.pos[v * 3 + 2] - at[2]), [nx2, nz2] = sq(g2.nor[v * 3], g2.nor[v * 3 + 2]); o.pos.push(px2, g2.pos[v * 3 + 1] - at[1], pz2); o.nor.push(nx2, g2.nor[v * 3 + 1], nz2); o.uv.push(g2.uv[v * 2], g2.uv[v * 2 + 1]); } o.idx.push(nvi); } }
  for (const [gi, o] of per) { if (G[gi].mat && G[gi].mat.getBaseColorTexture()) continue;   /* plain paints: smooth where the surface is smooth, a sharp edge where it folds by more than about 40 degrees */
    const nt = o.idx.length / 3, fn = new Float32Array(nt * 3), at2 = new Map(); for (let t = 0; t < nt; t++) { const [a2, b2, c2] = [o.idx[t * 3] * 3, o.idx[t * 3 + 1] * 3, o.idx[t * 3 + 2] * 3], ux = o.pos[b2] - o.pos[a2], uy = o.pos[b2 + 1] - o.pos[a2 + 1], uz = o.pos[b2 + 2] - o.pos[a2 + 2], vx = o.pos[c2] - o.pos[a2], vy = o.pos[c2 + 1] - o.pos[a2 + 1], vz = o.pos[c2 + 2] - o.pos[a2 + 2];
      fn[t * 3] = uy * vz - uz * vy; fn[t * 3 + 1] = uz * vx - ux * vz; fn[t * 3 + 2] = ux * vy - uy * vx; for (let q = 0; q < 3; q++) { const v = o.idx[t * 3 + q]; if (!at2.has(v)) at2.set(v, []); at2.get(v).push(t * 3 + q); } }
    const pos = [], nor = [], uv = [], idx = new Array(o.idx.length);
    for (const [v, corners] of at2) { const cl = []; for (const c of corners) { const t = Math.floor(c / 3), x = fn[t * 3], y = fn[t * 3 + 1], z = fn[t * 3 + 2], l = Math.hypot(x, y, z); if (!l) { (cl[0] || (cl[0] = { n: [0, 0, 0], c: [] })).c.push(c); continue; }
        let hit = null; for (const k of cl) { const kl = Math.hypot(k.n[0], k.n[1], k.n[2]); if (kl && (k.n[0] * x + k.n[1] * y + k.n[2] * z) / (kl * l) > 0.77) { hit = k; break; } } if (!hit) cl.push(hit = { n: [0, 0, 0], c: [] }); hit.n[0] += x; hit.n[1] += y; hit.n[2] += z; hit.c.push(c); }
      for (const k of cl) { const l = Math.hypot(k.n[0], k.n[1], k.n[2]) || 1, ni = pos.length / 3; pos.push(o.pos[v * 3], o.pos[v * 3 + 1], o.pos[v * 3 + 2]); nor.push(k.n[0] / l, k.n[1] / l, k.n[2] / l); uv.push(0, 0); for (const c of k.c) idx[c] = ni; } }
    o.pos = pos; o.nor = nor; o.uv = uv; o.idx = idx; }
  for (const [gi, o] of per) meshes[pi].addPrimitive(out.createPrimitive().setMaterial((await matOf(G[gi].mat)).setDoubleSided(!!G[gi].two || (G[gi].mat ? G[gi].mat.getDoubleSided() : false))).setAttribute('POSITION', out.createAccessor().setType('VEC3').setArray(new Float32Array(o.pos)).setBuffer(buf)).setAttribute('NORMAL', out.createAccessor().setType('VEC3').setArray(new Float32Array(o.nor)).setBuffer(buf))
    .setAttribute('TEXCOORD_0', out.createAccessor().setType('VEC2').setArray(new Float32Array(o.uv)).setBuffer(buf)).setIndices(out.createAccessor().setType('SCALAR').setArray(new Uint32Array(o.idx)).setBuffer(buf))); }
parts.forEach((p, i) => { if (!meshes[i].listPrimitives().length) return; const n = out.createNode(p.name).setMesh(meshes[i]).setTranslation(p.at); if (p.rad) n.setExtras({ rad: +p.rad.toFixed(4) }); scene.addChild(n); });
out.getRoot().getAsset().generator = 'tools/slim_vehicle.mjs';
await out.transform(weld({}), prune(), dedup());
let after = 0; for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) after += p.getIndices().getCount() / 3;
await io.write(dst, out); console.log('  ->', path.basename(dst), Math.round(after), 'triangles,', out.getRoot().listMaterials().length, 'paints,', Math.round((await import('fs')).statSync(dst).size / 1024), 'KB');
