// Hustle Empire — endless Lagos streets (Three.js r187)
// The road is a chain of pieces: straights, curves and junctions (crossroads,
// T-junctions and corners). Each piece has a path; the camera follows the chain
// and new pieces are generated ahead while old ones are removed behind, so the
// streets never end. Everything is solid geometry, merged per piece into one
// mesh per material to stay fast on phones.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import carsGlb from './models/cars.glb';
import guardGlb from './models/guard.glb';
import bizmanGlb from './models/bizman.glb';
import claudiaGlb from './models/claudia.glb';
import nathanGlb from './models/nathan.glb';
import ericGlb from './models/eric.glb';
import sophiaGlb from './models/sophia.glb';
import carlaGlb from './models/carla.glb';
import mixamoAnimsGlb from './models/mixamo_anims.glb';

/* ---------------- constants ---------------- */
const SEG_LEN = 40;
const VIEW_AHEAD = 280;      // metres of road kept in front of the camera
const PIECES_PER_DISTRICT = 7;
const ROAD_HALF = 6.5;       // four lanes
const GUTTER_W = 0.7;
const FRONT_X = ROAD_HALF + GUTTER_W + 3.6; // building line (10.8)
const F = FRONT_X;
const STUB_LEN = 56;         // length of a side street you can see down
const SIDE_LOT_START = 15;   // side streets leave the corner plot to the main road
const CAM_SPEED = 6;

const DISTRICTS = [
  { types: { modern: 0.34, apt: 0.14, shop: 0.18, uncompleted: 0.13, office: 0.08, terrace: 0.08, plot: 0.05 }, apt: [3, 5], off: [6, 9], glass: [12, 16], trees: 0.5, plants: { shade: 0.45, slender: 0.2, banana: 0.17, bamboo: 0.12, palm: 0.06 }, stalls: 0.5 },
  { residential: true, types: { terrace: 0.42, modern: 0.25, duplex: 0.07, bungalow: 0.1, uncompleted: 0.1, plot: 0.06 }, apt: [3, 4], trees: 0.8, plants: { shade: 0.35, palm: 0.3, slender: 0.15, banana: 0.2 }, stalls: 0.04 },
  { types: { modern: 0.34, office: 0.28, apt: 0.1, glass: 0.08, uncompleted: 0.1, shop: 0.05, plot: 0.05 }, apt: [4, 6], off: [8, 14], glass: [12, 18], trees: 0.5, plants: { shade: 0.5, slender: 0.3, palm: 0.1, banana: 0.05, bamboo: 0.05 }, stalls: 0.3, church: true },
  { types: { glass: 0.28, office: 0.24, modern: 0.33, uncompleted: 0.08, plot: 0.07 }, apt: [4, 6], off: [10, 16], glass: [14, 24], trees: 0.6, plants: { palm: 0.33, shade: 0.32, slender: 0.25, bamboo: 0.1 }, stalls: 0.05 },
];
const WIDTHS = { uncompleted: [10, 16], terrace: [9.5, 12], modern: [14, 20], duplex: [12, 16], bungalow: [8, 11], apt: [9, 15], shop: [7, 11], office: [13, 18], glass: [14, 20], plot: [6, 10] };

// paint colours seen on Lagos buildings
const PAINT = ['#e8d9a8', '#e3b23c', '#d99a2b', '#d9772b', '#e9b48a', '#b9c9a0', '#d9a39a', '#e9e4d4', '#a9c4d4', '#c9b48a', '#f0e2b6', '#cf8f5a'];
const TRIM = ['#f1ede2', '#f1ede2', '#7a4a2a', '#8c2f1e', '#3f5b4a', '#d8d0bc'];
const CONC = ['#d8d3c6', '#c9c4b8', '#e6e1d6', '#b8b2a6', '#cfc6b2'];
const ACCENT = ['#d9772b', '#b03a2e', '#1f618d', '#c9a227', '#2e7d5b'];
const AWNING = ['#b3261e', '#b3261e', '#1f5fa8', '#1e8449', '#d68910'];
const ROOFS = ['#8a3b2a', '#6e3b2a', '#3f6b5a', '#7b7f85', '#9a4a32'];
const GREENS = ['#235427', '#2c6631', '#37793a', '#479043', '#5aa24c']; // dark (inside) to light (sunlit)
const ROAD_C = '#3d3f42', WALK_C = '#bdb6a8', STEEL = '#8e979c';

const SHOP_SIGNS = [
  ['MAMA CHIOMA KITCHEN', '#c0392b'], ['IYA BASIRAT BUKKA', '#1e8449'], ["GOD'S TIME PHARMACY", '#16a085'],
  ['BLESSED HANDS BARBING SALON', '#2c3e50'], ['POS • TRANSFER • WITHDRAWAL', '#0b5345'], ['PHONE & LAPTOP REPAIRS', '#1f618d'],
  ['MAI SHAI TEA & BREAD', '#784212'], ['SUYA SPOT', '#a04000'], ['ALHAJI PROVISIONS', '#145a32'],
  ['EXCEL TUTORIAL CENTRE', '#4a235a'], ['FAVOUR FASHION DESIGNS', '#922b21'], ['NO WAHALA ELECTRICALS', '#b7950b'],
  ['AUNTY NGOZI SUPERMARKET', '#1a5276'], ['GOD DEY VULCANIZER', '#212f3d'], ['FAITH BUILDING MATERIALS', '#6e2c00'],
  ['24/7 GAS REFILL', '#cb4335'], ['MERCY CHEMIST', '#117864'], ['UNITY BUSINESS CENTRE', '#283747'],
];

/* ---------------- utilities ---------------- */
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const irange = (r, [a, b]) => a + Math.floor(r() * (b - a + 1));
function weighted(r, table) {
  let total = 0; for (const k in table) total += table[k];
  let x = r() * total; for (const k in table) { x -= table[k]; if (x <= 0) return k; }
  return Object.keys(table)[0];
}
const districtOf = (i) => DISTRICTS[Math.floor(i / PIECES_PER_DISTRICT) % DISTRICTS.length];

/* ---------------- renderer / scene (always daytime) ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); // phones: a touch below full sharpness, far fewer pixels to shade
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe3f1, 60, 150);
scene.background = new THREE.Color(0xcfe3f1);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.4, 700);
function fitCamera() {
  const a = window.innerWidth / window.innerHeight;
  camera.aspect = a; camera.fov = a < 1 ? 80 : 62; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', fitCamera); fitCamera();
scene.add(new THREE.HemisphereLight(0xdfefff, 0x8a6a4a, 1.25));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.1);
scene.add(sun); scene.add(sun.target);
const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#9a6a4a' }));
groundMesh.position.y = -0.15; scene.add(groundMesh);

/* ---------------- sky ---------------- */
// A dome around the camera, drawn by a shader: deep blue overhead, white haze
// at the horizon, heaped cumulus clouds with bright tops and grey-blue shading,
// and thin streaky clouds higher up. The clouds drift and slowly change shape.
const skyU = { value: 0 };
const sky = (() => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uTime: skyU }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec3 vDir; uniform float uTime;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return s; }
      float fbm3(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return s; }
      float heap(vec2 p){ return 0.62 * fbm(p * 0.55) + 0.38 * fbm(p * 1.9 + 7.0); }
      void main(){
        vec3 d = normalize(vDir); float e = max(d.y, 0.0);
        vec3 haze = vec3(0.812, 0.890, 0.945);
        vec3 col = mix(vec3(0.42, 0.63, 0.90), vec3(0.16, 0.42, 0.80), pow(e, 0.55));
        // high streaky clouds
        vec2 c = d.xz / (d.y + 0.35) * 1.1; c = vec2(c.x * 0.6 + c.y * 0.8, c.y * 0.6 - c.x * 0.8);
        float wisp = smoothstep(0.42, 0.78, fbm(vec2(c.x * 0.8, c.y * 2.4) + uTime * 0.004));
        col = mix(col, vec3(1.0), wisp * 0.38);
        // heaped cumulus
        vec2 uv = d.xz / (d.y + 0.16) * 1.5 + uTime * vec2(0.014, 0.005);
        float v = heap(uv), dens = smoothstep(0.445, 0.545, v);
        float lit = clamp(0.80 + (v - (0.62 * fbm3((uv + vec2(0.16, 0.10)) * 0.55) + 0.38 * fbm3((uv + vec2(0.16, 0.10)) * 1.9 + 7.0))) * 3.2, 0.0, 1.0);
        float core = smoothstep(0.54, 0.72, v);                       // thick middles are a little greyer underneath
        vec3 cloud = mix(vec3(0.60, 0.67, 0.78), vec3(1.0), lit) * (1.0 - core * 0.14);
        col = mix(col, cloud, dens);
        col = mix(col, haze, 1.0 - smoothstep(0.02, 0.30, d.y));     // white haze low down, matching the fog
        gl_FragColor = vec4(col, 1.0);
      }` }));
  m.renderOrder = -1; scene.add(m); return m;
})();

/* ---------------- materials ---------------- */
const matCache = new Map();
const PLAIN = new THREE.MeshLambertMaterial({ vertexColors: true }); // one material for all plain-coloured parts
function mat(color) {
  let m = matCache.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); matCache.set(color, m); }
  return m;
}
const WINS = [mat('#27323c'), mat('#27323c'), mat('#31424f'), mat('#3f5566')];
const DARK_WIN = WINS[0];
const win = (r) => pick(r, WINS);
const GLASS = [mat('#4f86ad'), mat('#3f6f96'), mat('#6fa3bf'), mat('#a8905a')];

/* ---------------- geometry templates + batching ---------------- */
const flat = (g) => { const n = g.index ? g.toNonIndexed() : g; n.computeVertexNormals(); return n; };
const ni = (g) => (g.index ? g.toNonIndexed() : g);
const sprigGeo = (() => { // two crossed cards standing on their base, 1 x 1
  const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0).toNonIndexed(), b = a.clone().rotateY(Math.PI / 2), g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) g.setAttribute(k, new THREE.Float32BufferAttribute([...a.attributes[k].array, ...b.attributes[k].array], k === 'uv' ? 2 : 3));
  return g;
})();
const T = {
  box: ni(new THREE.BoxGeometry(1, 1, 1)),
  cyl: ni(new THREE.CylinderGeometry(0.5, 0.5, 1, 10)),
  taper: ni(new THREE.CylinderGeometry(0.3, 0.5, 1, 8)),
  cone: ni(new THREE.ConeGeometry(0.5, 1, 8)),
  prism: flat(new THREE.CylinderGeometry(1, 1, 1, 3).rotateX(-Math.PI / 2).scale(1 / 1.7320508, 1 / 1.5, 1).translate(0, 1 / 3, 0)), // gable roof
  pyr: flat(new THREE.ConeGeometry(0.70711, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0)),
  blob: flat(new THREE.IcosahedronGeometry(0.5, 1)),
  disc: ni(new THREE.CircleGeometry(0.5, 14).rotateX(-Math.PI / 2)),
  sprig: sprigGeo,
};
const _m = new THREE.Matrix4(), _fm = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();
const _nm = new THREE.Matrix3(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
function M(x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _q.setFromEuler(_e.set(rx, ry, rz)); return _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
function MD(pos, dir, sx, sy, sz) { // unit shape with its Y axis pointed along dir
  _q.setFromUnitVectors(UP, dir); return _m.compose(pos, _q, _s.set(sx, sy, sz));
}
class Batch {
  constructor() { this.m = new Map(); this.frame = new THREE.Matrix4(); this.obstacles = []; }
  obst(x, z, r) { _v.set(x, 0, z).applyMatrix4(this.frame); this.obstacles.push({ x: _v.x, z: _v.z, r }); } // something solid people must walk round
  get(material) {
    if (typeof material === 'string') material = mat(material);
    let b = this.m.get(material); if (!b) { b = { p: [], n: [], uv: material.map ? [] : null }; this.m.set(material, b); } return b;
  }
  add(tpl, material, m4, dims) { // m4 is relative to this.frame; dims = box size, for tiling a texture
    const b = this.get(material), pos = tpl.attributes.position.array, nor = tpl.attributes.normal.array;
    if (typeof material === 'string') material = mat(material);
    _fm.multiplyMatrices(this.frame, m4); _nm.getNormalMatrix(_fm);
    for (let i = 0; i < pos.length; i += 3) {
      _v.set(pos[i], pos[i + 1], pos[i + 2]).applyMatrix4(_fm); b.p.push(_v.x, _v.y, _v.z);
      _v.set(nor[i], nor[i + 1], nor[i + 2]).applyMatrix3(_nm).normalize(); b.n.push(_v.x, _v.y, _v.z);
    }
    if (b.uv) {
      const uv = tpl.attributes.uv.array;
      if (!dims) for (let i = 0; i < uv.length; i++) b.uv.push(uv[i]);
      else { // repeat the texture at its real-world size on each face of the box (+x, -x, +y, -y, +z, -z)
        const t = material.userData.tile || 1, [w, h, d] = dims;
        for (let i = 0; i < uv.length; i += 2) { const f = Math.floor(i / 12); b.uv.push(uv[i] * (f < 2 ? d : w) / t, uv[i + 1] * (f === 2 || f === 3 ? d : h) / t); }
      }
    }
  }
  triF(material, a, b, c) { // flat triangle in frame coordinates, lit from above
    const bb = this.get(material), P = [a, b, c].map((q) => q.clone().applyMatrix4(this.frame));
    _v.subVectors(P[1], P[0]); _v2.subVectors(P[2], P[0]); _v.cross(_v2).normalize(); if (_v.y < 0) _v.negate();
    for (const q of P) { bb.p.push(q.x, q.y, q.z); bb.n.push(_v.x, _v.y, _v.z); }
  }
  triUV(material, pts, uv) { // textured triangle in frame coordinates, lit from above (roofs)
    const bb = this.get(material), P = pts.map((q) => q.clone().applyMatrix4(this.frame));
    _v.subVectors(P[1], P[0]); _v2.subVectors(P[2], P[0]); _v.cross(_v2).normalize(); if (_v.y < 0) _v.negate();
    for (const q of P) { bb.p.push(q.x, q.y, q.z); bb.n.push(_v.x, _v.y, _v.z); }
    bb.uv.push(...uv);
  }
  quadF(material, a, b, c, d, v0, v1, u0 = 0, u1 = 1) { // textured quad in frame coordinates, v runs a->d
    const bb = this.get(material), P = [a, b, c, d].map((q) => q.clone().applyMatrix4(this.frame));
    _v.subVectors(P[1], P[0]); _v2.subVectors(P[2], P[0]); _v.cross(_v2).normalize();
    for (const i of [0, 1, 2, 0, 2, 3]) { bb.p.push(P[i].x, P[i].y, P[i].z); bb.n.push(_v.x, _v.y, _v.z); }
    bb.uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
  }
  box(material, w, h, d, x, y, z) { this.add(T.box, material, M(x, y, z, w, h, d), [w, h, d]); } // y = centre
  quad(material, a, b, c, d) { // piece coordinates (ignores frame)
    const bb = this.get(material); _v.subVectors(b, a); _v2.subVectors(c, a); _v.cross(_v2).normalize();
    bb.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
    for (let i = 0; i < 6; i++) bb.n.push(_v.x, _v.y, _v.z);
  }
  build(group) {
    // Every plain-coloured, untextured part of a block is merged into one piece carrying its colours per vertex,
    // so a block is a handful of draw calls instead of fifty.
    const P = [], N = [], C = [];
    for (const [material, b] of this.m) {
      if (material.map || material.side !== THREE.FrontSide || material.transparent || material.alphaTest || material.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || !material.isMeshLambertMaterial || material.emissive.getHex()) continue;
      const { r, g, b: bl } = material.color; for (let i = 0; i < b.p.length; i += 3) C.push(r, g, bl);
      for (let i = 0; i < b.p.length; i++) { P.push(b.p[i]); N.push(b.n[i]); }
      this.m.delete(material);
    }
    if (P.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      const mesh = new THREE.Mesh(g, PLAIN); mesh.userData.own = true; group.add(mesh);
    }
    for (const [material, b] of this.m) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      if (b.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      const mesh = new THREE.Mesh(g, material); mesh.userData.own = true; group.add(mesh);
    }
  }
}

/* ---------------- paths ---------------- */
// A path maps distance t along the road to a position and heading in the
// piece's own space. Forward is -z; a positive heading turns left.
function straightPath(L) { return { L, k: 0, pose(t, o) { o.x = 0; o.z = -t; o.h = 0; return o; } }; }
function arcPath(R, ang) {
  const k = Math.sign(ang);
  return { L: R * Math.abs(ang), k, R, pose(t, o) { const a = t / R; o.x = -k * R * (1 - Math.cos(a)); o.z = -R * Math.sin(a); o.h = k * a; return o; } };
}
const _o = { x: 0, z: 0, h: 0 };
function pt(pc, t, u, y, out) { pc.pose(t, _o); return out.set(_o.x + u * Math.cos(_o.h), y, _o.z - u * Math.sin(_o.h)); } // u = metres to the right
function frameAt(pc, t, out) { pc.pose(t, _o); return out.makeRotationY(_o.h).setPosition(_o.x, 0, _o.z); }
const SV = Array.from({ length: 8 }, () => new THREE.Vector3());
// a ribbon that follows the path between lateral offsets u0<u1, with optional side walls
function strip(B, mt, pc, u0, u1, yTop, yBot, t0, t1) {
  const n = pc.k ? Math.max(1, Math.ceil((t1 - t0) / 2.5)) : 1;
  for (let i = 0; i < n; i++) {
    const ta = t0 + (t1 - t0) * i / n, tb = t0 + (t1 - t0) * (i + 1) / n;
    const a0 = pt(pc, ta, u0, yTop, SV[0]), a1 = pt(pc, ta, u1, yTop, SV[1]), b1 = pt(pc, tb, u1, yTop, SV[2]), b0 = pt(pc, tb, u0, yTop, SV[3]);
    B.quad(mt, a0, a1, b1, b0);
    if (yTop - yBot > 0.03) {
      B.quad(mt, pt(pc, ta, u1, yBot, SV[4]), pt(pc, tb, u1, yBot, SV[5]), b1, a1);
      B.quad(mt, pt(pc, tb, u0, yBot, SV[6]), pt(pc, ta, u0, yBot, SV[7]), a0, b0);
    }
    if (yTop - yBot > 0.03 && (i === 0 || i === n - 1)) { // close the two ends so raised strips look solid
      if (i === 0) B.quad(mt, pt(pc, ta, u0, yBot, SV[4]), pt(pc, ta, u1, yBot, SV[5]), pt(pc, ta, u1, yTop, SV[6]), pt(pc, ta, u0, yTop, SV[7]));
      if (i === n - 1) B.quad(mt, pt(pc, tb, u1, yBot, SV[4]), pt(pc, tb, u0, yBot, SV[5]), pt(pc, tb, u0, yTop, SV[6]), pt(pc, tb, u1, yTop, SV[7]));
    }
  }
}

/* ---------------- canvas textures ---------------- */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);
const SIGN_MATS = SHOP_SIGNS.map(([text, bg]) => new THREE.MeshLambertMaterial({ map: canvasTex(512, 112, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 54; g.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
  while (g.measureText(text).width > w - 40 && size > 20) { size -= 2; g.font = `900 ${size}px "Arial Black", Impact, sans-serif`; }
  g.fillText(text, w / 2, h / 2 + 2);
}) }));
const PLOT_MAT = new THREE.MeshLambertMaterial({ map: canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#b03a2e'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 34px "Arial Black", Impact, sans-serif'; g.fillText('THIS LAND IS NOT FOR SALE', w / 2, 44);
  g.font = '800 26px "Arial Black", Impact, sans-serif'; g.fillText('BEWARE OF 419', w / 2, 88);
}) });
const CLOCK_MAT = new THREE.MeshLambertMaterial({ map: canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#6b737c'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#f4f4ee'; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
  g.strokeStyle = '#22262b'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(128 + Math.sin(a) * 88, 128 - Math.cos(a) * 88); g.lineTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104); g.stroke(); }
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(178, 98); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(108, 44); g.stroke();
}) });
const MURAL_MATS = [['#1f4e8c', '#f2c12e', '#d9462b'], ['#0e6655', '#f5e6b8', '#d9772b'], ['#7b1e3a', '#f2c12e', '#2a9d8f']].map(([bg, a, b], k) =>
  new THREE.MeshLambertMaterial({ map: canvasTex(256, 384, (g, w, h) => { // ankara-style
    const r = rng(500 + k); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      const x = r() * w, y = r() * h, R = 30 + r() * 60;
      for (let j = 0; j < 5; j++) { g.fillStyle = [a, b, bg, a, b][j]; g.beginPath(); g.arc(x, y, R * (1 - j * 0.19), 0, 7); g.fill(); }
      g.strokeStyle = a; g.lineWidth = 3;
      for (let j = 0; j < 12; j++) { const t = j * Math.PI / 6; g.beginPath(); g.moveTo(x + Math.cos(t) * R, y + Math.sin(t) * R); g.lineTo(x + Math.cos(t) * R * 1.3, y + Math.sin(t) * R * 1.3); g.stroke(); }
    }
    g.fillStyle = b; for (let y = 0; y < h; y += 24) for (let x = (y / 24 % 2) * 12; x < w; x += 24) g.fillRect(x, y, 4, 4);
  }) }));

// Cladding textures that repeat at real size: brick, stone and roof tiles
function tiledTex(draw, tile, both) {
  const t = canvasTex(256, 256, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const m = new THREE.MeshLambertMaterial({ map: t, side: both ? THREE.DoubleSide : THREE.FrontSide }); m.userData.tile = tile; return m;
}
const brickTex = ([h, sa, l], mortar, seed) => tiledTex((g) => {
  const r = rng(seed); g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 16; y++) for (let x = -1; x < 8; x++) { g.fillStyle = `hsl(${h + r() * 8 - 4},${sa + r() * 8 - 4}%,${l + r() * 12 - 6}%)`; g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); }
}, 1.9);
const roofTex = (col, seed) => tiledTex((g) => {
  const r = rng(seed); g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = -1; x < 8; x++) { // courses of tiles, each casting a shadow on the one below
    const px = x * 32 + (y % 2) * 16, py = y * 32;
    g.fillStyle = `rgba(255,255,255,${r() * 0.07})`; g.fillRect(px + 1, py, 30, 32);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(px, py, 1.5, 32);
  }
  for (let y = 0; y < 8; y++) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, y * 32 + 27, 256, 5); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y * 32, 256, 3); }
}, 1.7, true);
const TEX = {
  brickRed: brickTex([12, 48, 36], '#56382f', 21), brickGrey: brickTex([220, 6, 44], '#2f3236', 22),
  stone: tiledTex((g) => {
    const r = rng(23); g.fillStyle = '#2e2a26'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 16; y++) for (let x = -r() * 30; x < 256;) { const wd = 22 + r() * 52; g.fillStyle = `hsl(${24 + r() * 16},${8 + r() * 10}%,${36 + r() * 24}%)`; g.fillRect(x + 1, y * 16 + 1, wd - 2, 14); x += wd; }
  }, 2.2),
  roofDark: roofTex('#3a3d42', 31), roofBrown: roofTex('#5b3b2f', 32),
  brickTan: brickTex([32, 34, 56], '#8a7a62', 24),
  block: tiledTex((g) => { // bare sandcrete blocks, as on a building that is not plastered yet
    const r = rng(25); g.fillStyle = '#77736b'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 4; x++) { g.fillStyle = `hsl(${38 + r() * 8},${5 + r() * 5}%,${52 + r() * 12}%)`; g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28); }
  }, 1.8),
};

// Street names (real Lagos streets) and house numbers
const NAMES_Z = ['ADEOLA ODEKU ST', 'AWOLOWO RD', 'ALLEN AVE', 'BROAD ST', 'OPEBI RD', 'TOYIN ST', 'HERBERT MACAULAY WAY', 'IKORODU RD', 'BODE THOMAS ST', 'ADENIRAN OGUNSANYA ST', 'AKIN ADESOLA ST', 'ADETOKUNBO ADEMOLA ST', 'OZUMBA MBADIWE AVE', 'SANUSI FAFUNWA ST', 'KOFO ABAYOMI ST', 'AJOSE ADEOGUN ST'];
const NAMES_X = ['MARINA RD', 'ADMIRALTY WAY', 'KINGSWAY RD', 'ISAAC JOHN ST', 'OBA AKRAN AVE', 'MOBOLAJI BANK ANTHONY WAY', 'ADEKUNLE FAJUYI WAY', 'WESTERN AVE', 'OGUNLANA DR', 'ADELABU ST', 'MASHA RD', 'AGUDA RD', 'BOURDILLON RD', 'GERRARD RD', 'ALFRED REWANE RD', 'GLOVER RD'];
const NAMES_IN = ['ADEBAYO', 'OLUWASEUN', 'CHUKWUMA', 'EMEKA', 'FOLASADE', 'NGOZI', 'BABATUNDE', 'IFEANYI', 'YETUNDE', 'OBINNA', 'TEMITOPE', 'KELECHI', 'ABIODUN', 'CHIAMAKA', 'OLUMIDE', 'NNAMDI'], KINDS_IN = ['CLOSE', 'CRESCENT', 'LANE', 'AVENUE'];
const wrap = (a, n) => ((a % n) + n) % n;
const signCache = new Map();
function signMat(name) { // green blade with a white border, the name in white and ST / RD / AVE small and raised
  let m = signCache.get(name); if (m) return m;
  const cut = name.lastIndexOf(' '), main = name.slice(0, cut), kind = name.slice(cut + 1);
  m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = '#0b7a3b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#fff'; g.textBaseline = 'middle';
    let size = 54; const fit = () => { g.font = `700 ${size}px "Helvetica Neue", Arial, sans-serif`; return g.measureText(main).width; };
    while (fit() > w - 120 && size > 22) size -= 2;
    const mw = fit(), x0 = (w - mw - 54) / 2;
    g.textAlign = 'left'; g.fillText(main, x0, h / 2 + 3);
    g.font = '700 24px "Helvetica Neue", Arial, sans-serif'; g.fillText(kind, x0 + mw + 12, h / 2 - 12);
  }) });
  signCache.set(name, m); return m;
}
const DIGITS = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: canvasTex(320, 48, (g) => { // 0-9 in white on a blue enamel plate
  g.fillStyle = '#12356b'; g.fillRect(0, 0, 320, 48); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 40px "Helvetica Neue", Arial, sans-serif';
  for (let d = 0; d < 10; d++) g.fillText(String(d), d * 32 + 16, 26);
}) });
// Street-name sign like the classic black post: flared base, slim post with a
// finial, and a framed green blade for each street, at two heights
function streetSign(B, x, z, blades, tall) {
  const black = '#111315', top = tall || 3.9;
  B.frame.makeTranslation(x, 0.28, z);
  B.add(T.taper, black, M(0, 0.4, 0, 0.36, 0.8, 0.36)); B.add(T.cyl, black, M(0, 0.06, 0, 0.44, 0.12, 0.44)); B.add(T.cyl, black, M(0, 0.84, 0, 0.3, 0.08, 0.3));
  B.add(T.cyl, black, M(0, top / 2, 0, 0.11, top, 0.11)); B.add(T.cyl, black, M(0, top, 0, 0.17, 0.08, 0.17));
  B.add(T.blob, black, M(0, top + 0.13, 0, 0.2, 0.26, 0.2)); B.add(T.cone, black, M(0, top + 0.3, 0, 0.1, 0.14, 0.1)); // finial
  for (const { name, dx, dz, y } of blades) {
    const mt = signMat(name), len = 1.7, hh = 0.16, px = -dz * 0.014, pz = dx * 0.014, a0 = 0.1, a1 = a0 + len;
    const C = (a, yy, k) => V3(dx * a + px * k, yy, dz * a + pz * k);
    B.quadF(mt, C(a0, y - hh, 1), C(a1, y - hh, 1), C(a1, y + hh, 1), C(a0, y + hh, 1), 0, 1);   // reads correctly from one side...
    B.quadF(mt, C(a1, y - hh, -1), C(a0, y - hh, -1), C(a0, y + hh, -1), C(a1, y + hh, -1), 0, 1); // ...and from the other
    B.add(T.box, black, M(dx * (a0 + len / 2), y, dz * (a0 + len / 2), len + 0.07, 2 * hh + 0.07, 0.018, 0, Math.atan2(-dz, dx), 0)); // frame
    B.add(T.box, black, M(dx * 0.45, y - hh - 0.1, dz * 0.45, 0.6, 0.03, 0.03, 0, Math.atan2(-dz, dx), 0));                           // bracket
  }
  B.frame.identity();
}
// House number on a blue plate, fixed to a short pier at the edge of the lot
function numberPlate(c, n) {
  const { P, B, s, w } = c, str = String(n), dw = 0.2, dh = 0.32, y0 = 1.42, lat0 = -w / 2 + 0.32, x = s * (F - 0.176); // digits sit just proud of the plate
  P('#f1ede2', 0, 0, lat0, 0.3, 2.0, 0.56); P('#12356b', -0.155, y0 - 0.05, lat0, 0.02, dh + 0.1, str.length * dw + 0.1);
  for (let k = 0; k < str.length; k++) {
    const mid = lat0 + s * (k - (str.length - 1) / 2) * dw, l = mid - s * dw / 2, rr = mid + s * dw / 2, d = +str[k];
    B.quadF(DIGITS, V3(x, y0, l), V3(x, y0, rr), V3(x, y0 + dh, rr), V3(x, y0 + dh, l), 0, 1, d / 10, (d + 1) / 10);
  }
}

// Interlocking paving stones for the inner streets (the main road stays tarred)
const INTERLOCK = (() => {
  const t = canvasTex(256, 256, (g) => {
    const r = rng(909); g.fillStyle = '#6a4636'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 4; x++) { // rows of 44 x 22 cm pavers, each row offset by half a stone
      g.fillStyle = `hsl(${13 + r() * 9},${30 + r() * 12}%,${40 + r() * 13}%)`; g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1);
  return new THREE.MeshLambertMaterial({ map: t });
})();

/* ---------------- foliage: leaf textures that sway in the wind ---------------- */
const windU = { value: 0 };
const SWAY = `
  float wph = transformed.x * 0.06 + transformed.z * 0.05;
  float gust = 0.5 + 0.5 * sin(uTime * 0.6 + wph * 0.5);
  float whw = pow(clamp((transformed.y - 1.2) / 6.0, 0.0, 1.3), 1.5);
  float lean = 0.15 + 0.60 * gust + 0.30 * sin(uTime * 1.9 + wph * 2.0) * (0.4 + gust);
  transformed.x += lean * whw * 0.9;
  transformed.z += (lean * 0.45 + 0.15 * sin(uTime * 1.3 + wph * 3.0)) * whw;`;
const FLUTTER = `
  float fph = transformed.x * 2.9 + transformed.z * 2.3 + transformed.y * 2.0;
  float fa = 0.04 + 0.085 * gust;
  transformed.x += sin(uTime * 5.5 + fph) * fa;
  transformed.z += cos(uTime * 4.6 + fph * 0.9) * fa;
  transformed.y += sin(uTime * 6.3 + fph * 1.3) * fa * 0.7;`;
function windy(m, flutter = true) { // trunks and branches bend with the gusts; leaves also flutter
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = windU;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + SWAY + (flutter ? FLUTTER : ''));
  };
  m.customProgramCacheKey = () => (flutter ? 'wind-leaf' : 'wind-wood');
  return m;
}
const woodCache = new Map();
function WOOD(color) { // trunk, branch and cane colours that bend with the wind
  let m = woodCache.get(color);
  if (!m) { m = windy(new THREE.MeshLambertMaterial({ color }), false); woodCache.set(color, m); }
  return m;
}
const foliage = (map, tint) => windy(new THREE.MeshLambertMaterial({ map, color: tint, side: THREE.DoubleSide, alphaTest: 0.4 }));
function drawLeaf(g, x, y, ang, len, wid, col, rib) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.3, -wid, len * 0.75, -wid * 0.8, len, 0); g.bezierCurveTo(len * 0.75, wid * 0.8, len * 0.3, wid, 0, 0);
  g.fillStyle = col; g.fill();
  g.strokeStyle = rib; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * 0.95, 0); g.stroke();
  g.restore();
}
// a twig carrying many leaves, drawn once and reused on every branch
function sprigTex(kind, seed) {
  return canvasTex(256, 256, (g) => {
    const r = rng(seed);
    g.strokeStyle = kind === 'bamboo' ? '#8a9a4a' : '#5b4a2e'; g.lineWidth = kind === 'bamboo' ? 3 : 4;
    g.beginPath(); g.moveTo(128, 256); g.quadraticCurveTo(122 + r() * 12, 140, 128, 34); g.stroke();
    if (kind === 'bamboo') {
      for (let n = 0; n < 7; n++) for (let j = 0; j < 4; j++) {
        const side = j % 2 ? 1 : -1, light = 33 + r() * 14;
        drawLeaf(g, 128, 236 - n * 32, -Math.PI / 2 + side * (0.45 + r() * 1.0), 80 + r() * 34, 7 + r() * 3, `hsl(${98 + r() * 20},40%,${light}%)`, `hsl(100,34%,${light + 11}%)`);
      }
    } else {
      for (let i = 0; i < 17; i++) {
        const side = i % 2 ? 1 : -1, light = 32 + r() * 16;
        drawLeaf(g, 128, 238 - i * 12.5, -Math.PI / 2 + side * (0.65 + r() * 0.6), 66 + r() * 32, 19 + r() * 9, `hsl(${96 + r() * 26},${36 + r() * 12}%,${light}%)`, `hsl(100,32%,${light + 12}%)`);
      }
      drawLeaf(g, 128, 40, -Math.PI / 2, 38, 16, 'hsl(98,40%,42%)', 'hsl(100,34%,54%)');
    }
  });
}
const bananaTex = canvasTex(128, 512, (g) => { // one big banana leaf with midrib, veins and torn edges
  g.beginPath(); g.moveTo(64, 508); g.bezierCurveTo(-6, 430, 2, 120, 64, 6); g.bezierCurveTo(126, 120, 134, 430, 64, 508); g.closePath();
  g.save(); g.clip();
  const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, '#3f7a36'); gr.addColorStop(0.5, '#5c9548'); gr.addColorStop(1, '#3f7a36');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 512);
  g.strokeStyle = 'rgba(30,95,22,0.4)'; g.lineWidth = 1;
  for (let y = 20; y < 505; y += 6) for (const e of [-1, 1]) { g.beginPath(); g.moveTo(64, y); g.lineTo(64 + e * 64, y - 12); g.stroke(); }
  g.strokeStyle = '#b7c38c'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 508); g.lineTo(64, 10); g.stroke();
  g.restore();
  g.globalCompositeOperation = 'destination-out'; const r = rng(77);
  for (let i = 0; i < 11; i++) { const e = i % 2 ? 1 : -1, y = 60 + r() * 400; g.beginPath(); g.moveTo(64 + e * 66, y - 16); g.lineTo(64 + e * 66, y - 8); g.lineTo(64 + e * (10 + r() * 18), y + 2); g.fill(); }
});
const TINTS = ['#ffffff', '#e9eede', '#d6dfc8'];
const BROAD = [1, 2].flatMap((k) => { const t = sprigTex('broad', k); return TINTS.map((c) => foliage(t, c)); });
const BAMBOO = [5, 6].flatMap((k) => { const t = sprigTex('bamboo', k); return TINTS.slice(0, 2).map((c) => foliage(t, c)); });
const BANANA = [foliage(bananaTex, '#ffffff'), foliage(bananaTex, '#e2e8d2')];
// Flowering plants: a leafy stem carrying five-petalled blossoms
function flowerTex(seed, petal) {
  return canvasTex(256, 256, (g) => {
    const r = rng(seed);
    g.strokeStyle = '#4f7a34'; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 256); g.quadraticCurveTo(120 + r() * 16, 150, 128, 60); g.stroke();
    for (let i = 0; i < 12; i++) { const light = 30 + r() * 14; drawLeaf(g, 128, 244 - i * 15, -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.7 + r() * 0.6), 60 + r() * 30, 17 + r() * 8, `hsl(${100 + r() * 22},${38 + r() * 12}%,${light}%)`, `hsl(104,34%,${light + 12}%)`); }
    for (let i = 0; i < 8; i++) {
      const x = 44 + r() * 168, y = 26 + r() * 150, R = 12 + r() * 6;
      g.fillStyle = petal; for (let k = 0; k < 5; k++) { const a = k * 1.2566 + r(); g.beginPath(); g.arc(x + Math.cos(a) * R * 0.8, y + Math.sin(a) * R * 0.8, R * 0.72, 0, 7); g.fill(); }
      g.fillStyle = '#f6d03c'; g.beginPath(); g.arc(x, y, R * 0.42, 0, 7); g.fill();
    }
  });
}
const FLOWERS = ['#e23d5b', '#f2903a', '#f6f2ea', '#c85ad6', '#f4d23c', '#e8507e'].map((c, i) => foliage(flowerTex(40 + i, c), '#ffffff'));
function bush(B, r, x, y, z, size, mats, n = 9) { // a clump of leafy stems fanning up and out from one spot
  for (let i = 0; i < n; i++) {
    const yaw = r() * 6.283, tilt = 0.1 + r() * 0.8, d = V3(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw)), sc = size * (0.75 + r() * 0.45);
    B.add(T.sprig, pick(r, mats), MD(V3(x + d.x * size * 0.12, y, z + d.z * size * 0.12), d, sc, sc, sc));
  }
}
const PALM_MATS = ['#2f6b34', '#3a783c', '#28602e'].map((c) => windy(new THREE.MeshLambertMaterial({ color: c })));

/* ---------------- buildings ---------------- */
// A lot context c works in "lot coordinates" inside the current batch frame:
// dep = metres behind the building line (negative = out over the sidewalk),
// yb = bottom height, lat = offset along the street from the lot centre.
function lotCtx(B, g, s, w, r, D) {
  return { B, g, s, w, r, D,
    P: (mt, dep, yb, lat, sd, h, sl) => B.box(mt, sd, h, sl, s * (F + dep), yb + h / 2, lat),
    addMesh: (m) => { m.applyMatrix4(B.frame); g.add(m); } };
}
function groundShops(c, gh, bays, bw) {
  const { P, r, s } = c; const aw = pick(r, AWNING);
  for (let b = 0; b < bays; b++) {
    const lat = -c.w / 2 + bw * (b + 0.5);
    P(r() < 0.7 ? '#2b2b2b' : pick(r, ['#5d6d7e', '#7f8c8d', '#1f618d']), -0.04, 0.28, lat, 0.1, 2.6, bw - 0.7);
    P(aw, -0.9, 2.95, lat, 1.8, 0.1, bw - 0.3);
    P(aw, -1.78, 2.68, lat, 0.06, 0.3, bw - 0.3);
    if (r() < 0.65) {
      const len = Math.min(bw - 0.5, 3.8), sg = new THREE.Mesh(UNIT, pick(r, SIGN_MATS));
      sg.scale.set(0.08, len * 0.22, len); sg.position.set(s * (F - 1.76), 3.05 + len * 0.11, lat); c.addMesh(sg);
    }
  }
}
function roofStuff(c, H, d, tanks) {
  const { P, B, r, s, w } = c;
  for (let i = 0; i < tanks; i++) {
    const dep = 1.5 + r() * (d - 3), lat = (r() - 0.5) * (w - 3);
    P('#8d8a80', dep, H, lat, 1.5, 0.6, 1.5);
    B.add(T.cyl, r() < 0.75 ? '#1b1b1b' : '#2456a6', M(s * (F + dep), H + 1.3, lat, 1.4, 1.4, 1.4));
  }
  if (r() < 0.6) P('#b9b3a7', d - 2, H, (r() - 0.5) * (w - 4), 3, 2.4, 3); // stair tower
}
function apartment(c) {
  const { P, r, w, D } = c;
  const floors = irange(r, D.apt), gh = 3.6, fh = 3.1, H = gh + (floors - 1) * fh, d = 9 + r() * 3;
  const body = mat(pick(r, PAINT)), trim = mat(pick(r, TRIM)), style = pick(r, ['cont', 'cont', 'bays', 'hood']);
  P(body, d / 2, 0, 0, d, H, w);
  P(trim, 0.1, H, 0, 0.25, 0.7, w);
  for (const e of [-1, 1]) P(trim, d / 2, H, e * (w / 2 - 0.12), d, 0.7, 0.25);
  const bays = Math.max(2, Math.round(w / 3.2)), bw = w / bays;
  for (let f = 1; f < floors; f++) {
    const y = gh + (f - 1) * fh;
    P(trim, -0.05, y - 0.12, 0, 0.3, 0.24, w);
    if (style === 'cont') { // one long balcony across the whole front
      P('#cfc8b8', -0.75, y - 0.1, 0, 1.5, 0.16, w - 0.3);
      P(body, -1.44, y + 0.06, 0, 0.12, 0.95, w - 0.3);
      P('#3a3a3a', -1.44, y + 1.01, 0, 0.16, 0.06, w - 0.3);
      for (const e of [-1, 1]) P(body, -0.75, y + 0.06, e * (w / 2 - 0.21), 1.5, 0.95, 0.12);
    }
    for (let b = 0; b < bays; b++) {
      const lat = -w / 2 + bw * (b + 0.5);
      if (style === 'cont') {
        P(win(r), -0.04, y + 0.05, lat - bw * 0.2, 0.1, 2.2, 0.95);
        P(win(r), -0.04, y + 0.95, lat + bw * 0.2, 0.1, 1.3, 1.1);
      } else if (style === 'bays' && b % 2 === 0) { // separate balcony per bay
        P('#cfc8b8', -0.6, y - 0.1, lat, 1.2, 0.16, bw - 0.5);
        P(trim, -1.14, y + 0.06, lat, 0.12, 0.95, bw - 0.5);
        for (const e of [-1, 1]) P(trim, -0.6, y + 0.06, lat + e * (bw / 2 - 0.31), 1.2, 0.95, 0.12);
        P(win(r), -0.04, y + 0.05, lat, 0.1, 2.2, 1.3);
      } else { // window with a concrete sun hood, sill and sometimes an AC unit
        P(win(r), -0.04, y + 0.9, lat, 0.1, 1.4, 1.5);
        P(trim, -0.3, y + 2.35, lat, 0.6, 0.1, 1.9);
        P(trim, -0.12, y + 0.8, lat, 0.24, 0.08, 1.7);
        if (r() < 0.3) P('#e5e7e9', -0.3, y + 0.2, lat + 0.45, 0.45, 0.5, 0.8);
      }
    }
  }
  if (style !== 'cont' && r() < 0.7) for (let b = 0; b <= bays; b++) P(trim, -0.08, gh, clamp(-w / 2 + bw * b, -w / 2 + 0.15, w / 2 - 0.15), 0.3, H - gh, 0.3);
  if (D.residential) groundFlats(c, bays, bw); else groundShops(c, gh, bays, bw);
  roofStuff(c, H, d, r() < 0.8 ? 1 + Math.floor(r() * 3) : 0);
  if (r() < 0.3) { P('#d4ac0d', -0.5, 0.28, w / 2 - 0.8, 0.8, 0.9, 1.2); c.B.obst(c.s * (F - 0.5), w / 2 - 0.8, 0.75); } // generator on the sidewalk
  return { H, d, mural: true };
}
function shophouse(c) {
  const { P, B, r, w, s } = c;
  const floors = r() < 0.55 ? 2 : 1, gh = 3.4, H = gh + (floors - 1) * 3, d = 8;
  const body = mat(pick(r, PAINT)), trim = mat(pick(r, TRIM));
  P(body, d / 2, 0, 0, d, H, w);
  B.add(T.prism, pick(r, ROOFS), M(s * (F + d / 2 - 0.4), H, 0, d + 2, 2.3, w + 0.5));
  const bays = Math.max(2, Math.round(w / 3.2)), bw = w / bays;
  if (floors === 2) { // upstairs veranda with posts and wooden shutters
    P('#cfc8b8', -0.7, gh - 0.1, 0, 1.4, 0.16, w);
    P(trim, -1.34, gh + 0.06, 0, 0.1, 0.9, w);
    for (let b = 0; b <= bays; b++) P(trim, -1.3, gh, clamp(-w / 2 + bw * b, -w / 2 + 0.1, w / 2 - 0.1), 0.16, 3, 0.16);
    for (let b = 0; b < bays; b++) {
      const lat = -w / 2 + bw * (b + 0.5);
      P(b % 2 ? win(r) : mat(pick(r, ['#6e4a2a', '#3f5b4a', '#7a4a2a'])), -0.04, gh + (b % 2 ? 0.9 : 0.05), lat, 0.1, b % 2 ? 1.3 : 2.1, b % 2 ? 1.3 : 0.95);
    }
  }
  groundShops(c, gh, bays, bw);
  return { H: H + 2, d };
}
function office(c) {
  const { P, B, r, w, D, s } = c;
  const floors = irange(r, D.off), gh = 4.2, fh = 3.3, H = gh + (floors - 1) * fh, d = 12;
  const conc = mat(pick(r, CONC)), conc2 = mat(pick(r, CONC)), style = pick(r, ['fins', 'fins', 'grid', 'bands']);
  P(conc, d / 2, 0, 0, d, H, w);
  const segs = Math.max(3, Math.round(w / 5)), sw = (w - 0.6) / segs;
  for (let f = 1; f < floors; f++) {
    const y = gh + (f - 1) * fh;
    for (let k = 0; k < segs; k++) P(win(r), -0.03, y + 0.9, -w / 2 + 0.3 + sw * (k + 0.5), 0.1, 1.7, sw);
    P(conc2, -0.2, y - 0.15, 0, style === 'grid' ? 0.9 : 0.5, 0.3, w);
    B.box(win(r), d - 2, 1.7, 0.1, s * (F + d / 2), y + 1.75, w / 2 + 0.03); // side windows
  }
  const n = Math.round(w / (style === 'grid' ? 3.2 : 1.7));
  if (style !== 'bands') for (let i = 0; i <= n; i++) P(conc2, style === 'grid' ? -0.4 : -0.3, gh, clamp(-w / 2 + (w / n) * i, -w / 2 + 0.1, w / 2 - 0.1), style === 'grid' ? 0.9 : 0.6, H - gh, style === 'grid' ? 0.35 : 0.16);
  if (r() < 0.45) P(pick(r, ACCENT), -0.12, gh, (r() - 0.5) * (w - 4), 0.3, H - gh, 2.4); // painted accent column
  P(conc2, 0.1, H, 0, 0.3, 1, w);
  P('#3b5a72', -0.04, 0.28, 0, 0.1, 3.3, w - 2.5); // glass lobby
  P(conc2, -1.3, 3.7, 0, 2.6, 0.28, w * 0.5);
  for (const e of [-1, 1]) P(conc2, -2.3, 0.28, e * w * 0.22, 0.3, 3.42, 0.3);
  P(conc2, d / 2, H, 0, d * 0.5, 2.6, w * 0.45);
  if (r() < 0.35) for (let k = 0; k < 4; k++) P(k % 2 ? '#f1f1f1' : '#c0392b', d / 2, H + 2.6 + k * 2.5, 0, 0.3, 2.5, 0.3); // radio mast
  roofStuff(c, H, d, 0);
  return { H, d, mural: floors < 12 };
}
function glassTower(c) {
  const { P, B, r, w, D, s } = c;
  const floors = irange(r, D.glass), fh = 3.6, ph = 7.5, H = ph + floors * fh, d = 14, tw = w - 2;
  const glass = pick(r, GLASS), conc = mat(pick(r, CONC));
  P(conc, d / 2, 0, 0, d, ph, w); // podium
  P('#3b5a72', -0.04, 0.28, 0, 0.1, 4, w - 3);
  P(conc, -1.5, 4.6, 0, 3, 0.3, w * 0.55);
  P(conc, 0.2, ph, 0, 0.3, 0.9, w);
  P(glass, d / 2 + 0.5, ph, 0, d - 3, H - ph, tw); // tower, front face at dep 2
  for (let i = 0, n = Math.round(tw / 2); i <= n; i++) P('#dfe6ea', 1.96, ph, -tw / 2 + (tw / n) * i, 0.12, H - ph, 0.12);
  for (let f = 0; f < floors; f++) {
    const y = ph + f * fh;
    P('#2c4a63', 1.98, y, 0, 0.06, 0.6, tw);
    B.box('#2c4a63', d - 3, 0.6, 0.06, s * (F + d / 2 + 0.5), y + 0.3, tw / 2 + 0.02);
  }
  P(glass, d / 2 + 0.5, H, 0, (d - 3) * 0.6, 5, tw * 0.6); // crown
  P('#dfe6ea', d / 2 + 0.5, H + 5, 0, 0.3, 11, 0.3);
  return { H, d };
}
function plot(c) {
  const { P, s, w } = c;
  P('#d8d0bc', 0.2, 0, 0, 0.25, 2.3, w);
  const sign = new THREE.Mesh(UNIT, PLOT_MAT); sign.scale.set(0.05, 1.1, Math.min(w - 0.6, 4.4));
  sign.position.set(s * (F + 0.05), 1.3, 0); c.addMesh(sign);
  (c.r() < 0.5 ? banana : bamboo)(c.B, c.r, s * (F + 3.5), (c.r() - 0.5) * (w - 3));
  if (w > 8) banana(c.B, c.r, s * (F + 5.5), (c.r() - 0.5) * (w - 3));
  return { H: 0, d: 0 };
}
// Gothic-style cathedral like the one on Lagos Marina: grey walls, white trim, clock tower
function church(c) {
  const { P, B, r, s } = c;
  const grey = mat('#6b737c'), white = mat('#eef0f2'), X = (dep) => s * (F + dep);
  P('#a8502f', 2, 0.28, 0, 4, 0.04, 30); // red-paved forecourt
  P(grey, 10, 0, -4, 12, 10, 22);
  B.add(T.prism, '#2b2d31', M(X(10), 10, -4, 12.8, 5, 22));
  P(white, 3.95, 10, -4, 0.3, 0.3, 22);
  for (let lat = -14.4; lat <= 6.4; lat += 1.3) P(grey, 4.1, 10.3, lat, 0.3, 0.6, 0.65);
  for (let lat = -14.2; lat <= 4.6; lat += 3.6) {
    P(grey, 3.7, 0, lat, 0.8, 9, 0.8); P(white, 3.7, 8.8, lat, 0.9, 0.2, 0.9);
    B.add(T.pyr, grey, M(X(3.7), 9, lat, 0.9, 2.2, 0.9));
    if (lat < 3) {
      const wm = win(r);
      P(wm, 3.96, 2.4, lat + 1.8, 0.1, 4.4, 1.4); B.add(T.pyr, wm, M(X(3.96), 6.8, lat + 1.8, 0.1, 1.4, 1.4));
      P(white, 3.93, 2.2, lat + 1.8, 0.12, 0.2, 1.8);
    }
  }
  P(grey, 7.5, 0, 10.5, 7, 24, 7); // clock tower
  for (const y of [8, 16, 23.7]) P(white, 7.5, y, 10.5, 7.2, 0.3, 7.2);
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    P(grey, 7.5 + a * 3.2, 24, 10.5 + b * 3.2, 1, 1.2, 1); B.add(T.pyr, grey, M(X(7.5 + a * 3.2), 25.2, 10.5 + b * 3.2, 1.1, 3.4, 1.1));
  }
  for (let k = -2; k <= 2; k += 2) { P(grey, 4.1, 24, 10.5 + k, 0.3, 0.7, 0.7); P(grey, 7.5 + k, 24, 13.9, 0.7, 0.7, 0.3); }
  const c1 = new THREE.Mesh(UNIT, CLOCK_MAT); c1.scale.set(0.1, 3, 3); c1.position.set(X(3.97), 19.8, 10.5); c.addMesh(c1);
  const c2 = new THREE.Mesh(UNIT, CLOCK_MAT); c2.scale.set(3, 3, 0.1); c2.position.set(X(7.5), 19.8, 14.03); c.addMesh(c2);
  for (const y of [9.5, 12.5]) {
    P(DARK_WIN, 3.96, y, 10.5, 0.1, 2, 1); B.add(T.pyr, DARK_WIN, M(X(3.96), y + 2, 10.5, 0.1, 0.9, 1));
    B.box(DARK_WIN, 1, 2, 0.1, X(7.5), y + 1, 14.03);
  }
  P('#3b2a20', 3.96, 0.28, 10.5, 0.1, 3.8, 2.4); B.add(T.pyr, '#3b2a20', M(X(3.96), 4.08, 10.5, 0.1, 1.6, 2.4));
  for (const y of [0.6, 1.5]) P('#2b2d31', 0.2, y, 0, 0.08, 0.08, 30); // railing
  for (let lat = -15; lat <= 15; lat += 2) P('#2b2d31', 0.2, 0.28, lat, 0.1, 1.4, 0.1);
  palm(B, r, X(2), -8); palm(B, r, X(2), 3);
  return { H: 15, d: 16 };
}
/* ---- residential ---- */
const HOUSE = ['#e8c2a0', '#efd9b4', '#e6b8a2', '#f0e0c8', '#d9a68a', '#f2e6d0', '#e3c9a8'];
const TILE = ['#a5492f', '#8f3d28', '#b3563a', '#3a3d42', '#4a3a34'];
const IRON = '#22201e', WHITE = '#f4f1ea';
function opening(c, dep, yb, lat, h, wd, glass) { // window or glazed door with a white frame
  c.P(WHITE, dep + 0.01, yb - 0.1, lat, 0.08, h + 0.2, wd + 0.2); c.P(glass || win(c.r), dep - 0.03, yb, lat, 0.1, h, wd);
}
function groundFlats(c, bays, bw) { // ground floor of a block of flats: windows, planters and one entrance
  const { P, r } = c, door = Math.floor(bays / 2);
  for (let b = 0; b < bays; b++) {
    const lat = -c.w / 2 + bw * (b + 0.5);
    if (b === door) { P('#3b2a20', -0.04, 0.28, lat, 0.1, 2.4, 1.3); P(WHITE, -0.7, 2.85, lat, 1.4, 0.12, 2.2); }
    else { opening(c, 0, 1.2, lat, 1.4, 1.5); P('#8a8378', -0.55, 0.28, lat, 0.7, 0.35, bw - 1.2); P(pick(r, ['#6f9a3a', '#7fa53c', '#b9c93a']), -0.55, 0.63, lat, 0.6, 0.4, bw - 1.4); }
  }
}
// Front fence: stone pillars with caps, a low wall with iron railings on top and a gate
function frontFence(c, gl, gw, stone, wallc) {
  const { P, w } = c, spans = [[-w / 2 + 0.3, gl - gw / 2 - 0.25], [gl + gw / 2 + 0.25, w / 2 - 0.3]];
  for (const [a, b] of spans) {
    const len = b - a; if (len < 0.2) { continue; }
    const n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) { const lat = a + (len / n) * i; P(stone, 0.15, 0, lat, 0.5, 2.1, 0.5); P('#d8d0bc', 0.15, 2.1, lat, 0.64, 0.12, 0.64); }
    P(wallc, 0.15, 0, (a + b) / 2, 0.24, 1.15, len);
    P(IRON, 0.15, 1.85, (a + b) / 2, 0.05, 0.05, len);
    for (let lat = a + 0.45; lat < b - 0.2; lat += 0.45) P(IRON, 0.15, 1.15, lat, 0.035, 0.75, 0.035);
  }
  P('#2b2622', 0.15, 0.2, gl, 0.07, 1.75, gw); P(IRON, 0.15, 1.95, gl, 0.09, 0.06, gw);
}
// Two-storey duplex set back behind a fenced yard: tiled roof, stone-clad
// columns, upstairs balcony with iron railings, lawn, hedge and paved drive
function duplex(c) {
  const { P, B, r, w, s } = c;
  const sb = 5.5, d = 9, hw = w - 3.5, H = 6.2, wallc = pick(r, HOUSE), body = mat(pick(r, HOUSE)), roof = pick(r, TILE), stone = pick(r, ['#b08d57', '#9a7f58', '#8a6f52']);
  const side = r() < 0.5 ? -1 : 1, pw = hw * 0.46, pl = side * hw * 0.24, gl = -side * (w / 2 - 2.4); // porch on one side, gate on the other
  P('#5f9a3e', sb / 2 + 0.2, 0, 0, sb - 0.4, 0.14, w - 0.3);              // lawn
  P('#a9704f', sb / 2, 0, gl, sb + 0.4, 0.17, 3.2);                       // paved drive
  frontFence(c, gl, 3.2, stone, wallc);
  const h0 = gl < 0 ? gl + 2 : -w / 2 + 0.5, h1 = gl < 0 ? w / 2 - 0.5 : gl - 2;
  P(pick(r, ['#b9c93a', '#c8d040', '#7fa53c']), 1.0, 0.14, (h0 + h1) / 2, 0.7, 0.55, h1 - h0); // clipped hedge
  for (let i = 0; i < 4; i++) bush(B, r, s * (F + 2.2 + r() * 1.6), 0.14, h0 + (h1 - h0) * r(), i < 2 ? 1.35 : 1.0, i < 2 ? BROAD : [pick(r, FLOWERS)], i < 2 ? 10 : 8); // leafy shrubs and flowering plants on the lawn
  P(body, sb + d / 2, 0, 0, d, H, hw);
  P(WHITE, sb - 0.04, 3.0, 0, 0.1, 0.22, hw);
  P(WHITE, sb + d / 2, H - 0.02, 0, d + 0.7, 0.12, hw + 0.6);             // eaves
  B.add(T.prism, roof, M(s * (F + sb + d / 2), H, 0, d + 1.5, 2.5, hw + 1.3));
  P(body, sb - 0.9, 3.0, pl, 1.8, 0.22, pw);                              // balcony floor
  P(body, sb - 1.74, 3.22, pl, 0.12, 0.3, pw);
  P(IRON, sb - 1.74, 4.1, pl, 0.05, 0.05, pw);
  for (let x = -pw / 2 + 0.15; x < pw / 2; x += 0.3) P(IRON, sb - 1.74, 3.5, pl + x, 0.035, 0.6, 0.035);
  for (const e of [-1, 1]) { P(stone, sb - 1.6, 0.14, pl + e * (pw / 2 - 0.25), 0.5, H - 0.14, 0.5); P(IRON, sb - 0.9, 4.1, pl + e * (pw / 2 - 0.03), 1.7, 0.05, 0.05); }
  P(body, sb - 0.9, H - 0.5, pl, 1.9, 0.5, pw + 0.1);
  B.add(T.prism, roof, M(s * (F + sb + 0.4), H, pl, pw + 1.0, 1.7, 4.4, 0, Math.PI / 2, 0)); // gable over the balcony
  opening(c, sb, 0.3, pl, 2.3, pw - 1.6); opening(c, sb, 3.3, pl, 2.2, pw - 1.8);
  opening(c, sb, 1.1, -pl * 1.15, 1.4, 1.7); opening(c, sb, 4.1, -pl * 1.15, 1.4, 1.7);
  if (r() < 0.3) { // water tank on a steel stand
    const tl = -side * (hw / 2 + 1), td = sb + d - 1.5;
    for (const a of [-1, 1]) for (const b of [-1, 1]) P('#5d666b', td + a * 0.6, 0, tl + b * 0.6, 0.1, 6.5, 0.1);
    P('#5d666b', td, 6.5, tl, 1.6, 0.12, 1.6); B.add(T.cyl, '#1b1b1b', M(s * (F + td), 7.4, tl, 1.5, 1.6, 1.5));
  }
  return { H: H + 2, d: sb + d };
}
// Single-storey house close to the sidewalk: bright walls, red tile roof, low wall and flower bed
function bungalow(c) {
  const { P, B, r, w, s } = c;
  const sb = 2.6, d = 8, hw = w - 0.8, H = 3.3, body = mat(pick(r, ['#f1ede2', '#e58f86', '#6fa3d0', '#efd27a', '#f4f1ea', '#d9a68a', '#9cc6a0'])), dl = (r() - 0.5) * hw * 0.3;
  P('#cfc8ba', sb / 2, 0, 0, sb, 0.2, w - 0.2);
  P(body, sb + d / 2, 0, 0, d, H, hw);
  B.add(T.prism, pick(r, ['#b3563a', '#a5492f', '#c0603f']), M(s * (F + sb + d / 2 - 0.5), H, 0, d + 2.4, 1.9, hw + 0.6));
  P(pick(r, ['#2d6fb0', '#7a4a2a', '#1e8449', '#8c2f1e']), sb - 0.04, 0.2, dl, 0.1, 2.2, 1.0);
  for (const e of [-1, 1]) opening(c, sb, 1.1, e * hw * 0.32, 1.3, 1.5);
  for (const [a, b] of [[-w / 2 + 0.2, dl - 1], [dl + 1, w / 2 - 0.2]]) {
    if (b - a < 0.6) continue;
    P('#e3ddd0', 0.15, 0, (a + b) / 2, 0.22, 0.95, b - a); P('#5a3d28', 0.75, 0.2, (a + b) / 2, 0.6, 0.18, b - a - 0.3);
    for (let lat = a + 0.5; lat < b - 0.3; lat += 0.8) bush(B, r, s * (F + 0.75), 0.36, lat, 0.8, r() < 0.7 ? [pick(r, FLOWERS)] : BROAD, 6); // flower bed
  }
  return { H: H + 1.5, d: sb + d };
}
/* ---- detailed houses ---- */
// window set into the wall: proud frame, recessed glass, a mullion, a transom and a sill
function win3D(c, dep, yb, lat, h, wd, frame) {
  const { P, r } = c, f = frame || WHITE;
  P(f, dep - 0.06, yb - 0.08, lat, 0.14, h + 0.16, wd + 0.16); P(win(r), dep - 0.03, yb, lat, 0.08, h, wd);
  P(f, dep - 0.1, yb, lat, 0.04, h, 0.06); P(f, dep - 0.1, yb + h * 0.62, lat, 0.04, 0.05, wd);
  P(f, dep - 0.14, yb - 0.15, lat, 0.24, 0.07, wd + 0.3);
}
// iron railing: top and bottom rails with a row of thin uprights; returns run back to the wall
function railing(c, dep, yb, lat, len, h, back) {
  const { P } = c;
  P(IRON, dep, yb + h, lat, 0.05, 0.05, len); P(IRON, dep, yb + 0.06, lat, 0.04, 0.04, len);
  for (let x = -len / 2 + 0.11; x < len / 2; x += 0.22) P(IRON, dep, yb, lat + x, 0.028, h, 0.028);
  if (back) for (const e of [-1, 1]) { P(IRON, dep + back / 2, yb + h, lat + e * len / 2, back, 0.05, 0.05); for (let q = 0.2; q < back; q += 0.22) P(IRON, dep + q, yb, lat + e * len / 2, 0.028, h, 0.028); }
}
// hip roof covered in tiles: four slopes meeting at a ridge
function hipRoof(c, mt, cd, cl, sd, sl, y, h) {
  const { B, s } = c, t = mt.userData.tile, along = sl >= sd, A = along ? sl : sd, W = along ? sd : sl, ca = along ? cl : cd, cw = along ? cd : cl;
  const X = (a, w, yy) => (along ? V3(s * (F + w), yy, a) : V3(s * (F + a), yy, w)); // a = along the ridge, w = across it
  const a0 = ca - A / 2, a1 = ca + A / 2, r0 = a0 + W / 2, r1 = a1 - W / 2, w0 = cw - W / 2, w1 = cw + W / 2, sv = Math.hypot(W / 2, h) / t;
  for (const w of [w0, w1]) { // the two long slopes
    B.triUV(mt, [X(a0, w, y), X(a1, w, y), X(r1, cw, y + h)], [a0 / t, 0, a1 / t, 0, r1 / t, sv]);
    B.triUV(mt, [X(a0, w, y), X(r1, cw, y + h), X(r0, cw, y + h)], [a0 / t, 0, r1 / t, sv, r0 / t, sv]);
  }
  B.triUV(mt, [X(a0, w0, y), X(a0, w1, y), X(r0, cw, y + h)], [w0 / t, 0, w1 / t, 0, cw / t, sv]); // the two hipped ends
  B.triUV(mt, [X(a1, w0, y), X(a1, w1, y), X(r1, cw, y + h)], [w0 / t, 0, w1 / t, 0, cw / t, sv]);
}
// estate fence: white pillars with pyramid caps, a low wall and black iron bars, with a barred gate
function estateFence(c, gl, gw, wallc) {
  const { P, B, w, s } = c;
  for (const [a, b] of [[-w / 2 + 0.3, gl - gw / 2 - 0.28], [gl + gw / 2 + 0.28, w / 2 - 0.3]]) {
    const len = b - a; if (len < 0.2) continue;
    const n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) { const lat = a + (len / n) * i; P(WHITE, 0.15, 0, lat, 0.55, 1.95, 0.55); B.add(T.pyr, WHITE, M(s * (F + 0.15), 1.95, lat, 0.72, 0.36, 0.72)); }
    P(wallc, 0.15, 0, (a + b) / 2, 0.22, 0.75, len); P(WHITE, 0.15, 0.75, (a + b) / 2, 0.3, 0.07, len);
    P(IRON, 0.15, 1.72, (a + b) / 2, 0.05, 0.05, len);
    for (let lat = a + 0.4; lat < b - 0.3; lat += 0.2) P(IRON, 0.15, 0.82, lat, 0.03, 0.92, 0.03);
  }
  P(IRON, 0.15, 1.8, gl, 0.06, 0.06, gw); P(IRON, 0.15, 0.18, gl, 0.06, 0.06, gw); P(IRON, 0.15, 0.18, gl, 0.07, 1.68, 0.07);
  for (let lat = -gw / 2 + 0.1; lat < gw / 2; lat += 0.2) P(IRON, 0.15, 0.2, gl + lat, 0.035, 1.6, 0.035);
}
const TWALL = ['#e9c98a', '#f0d9a0', '#e8b96a', '#f2e2b8', '#e6d2a4'];
// Estate house: two storeys with a projecting bay and an upstairs balcony, a
// full-height brick or stone panel, framed windows and a tiled hip roof,
// behind a pillared iron fence. Every house in one inner street matches.
function terrace(c) {
  const { P, r, w, D } = c, E = D.estate || { wall: pick(r, TWALL), accent: pick(r, [TEX.brickGrey, TEX.stone, TEX.brickRed]), roof: pick(r, [TEX.roofDark, TEX.roofBrown]) };
  const sb = 4.6, d = 9, hw = w - 1.0, H = 6.4, fh = 3.2, wall = mat(E.wall), side = r() < 0.5 ? -1 : 1;
  const bayW = hw * 0.42, bl = side * (hw / 2 - bayW / 2 - 0.3), al = -side * hw * 0.24;
  P('#8d9296', sb / 2 + 0.2, 0, 0, sb - 0.2, 0.12, w - 0.2);                 // concrete forecourt
  P('#7c7468', 0.75, 0.12, bl, 0.7, 0.3, bayW); P('#6f9a3a', 0.75, 0.42, bl, 0.56, 0.36, bayW - 0.14); // planter with a hedge
  estateFence(c, -side * (w / 2 - 2.3), 3.0, E.wall);
  P(wall, sb + d / 2, 0, 0, d, H, hw);                                         // main volume
  P(E.accent, sb - 0.07, 0, al, 0.16, H, hw * 0.3);                            // full-height brick or stone panel
  P(WHITE, sb - 0.05, fh - 0.1, 0, 0.12, 0.2, hw);
  P('#2a2422', sb - 0.17, 0.12, al, 0.1, 2.25, 1.0); P(WHITE, sb - 0.75, 2.5, al, 1.3, 0.14, 2.0); // front door under a canopy
  win3D(c, sb - 0.16, fh + 0.9, al, 1.5, 1.2);
  P(wall, sb - 0.55, 0, bl, 1.1, H - 0.25, bayW);                              // projecting two-storey bay
  win3D(c, sb - 1.1, 0.7, bl, 1.9, bayW - 1.3);
  P(WHITE, sb - 1.65, fh - 0.12, bl, 1.1, 0.2, bayW + 0.1);                    // balcony
  P(win(r), sb - 1.13, fh + 0.1, bl, 0.08, 2.3, bayW - 1.5); P(WHITE, sb - 1.12, fh + 2.4, bl, 0.12, 0.12, bayW - 1.3);
  railing(c, sb - 2.15, fh + 0.08, bl, bayW + 0.1, 1.0, 1.0);
  P(WHITE, sb + d / 2 - 0.2, H, 0, d + 1.0, 0.16, hw + 0.9);                   // eaves
  hipRoof(c, E.roof, sb + d / 2 - 0.2, 0, d + 1.3, hw + 1.2, H + 0.16, 2.3);
  P(WHITE, sb - 0.6, H - 0.25, bl, 1.9, 0.14, bayW + 0.7);
  hipRoof(c, E.roof, sb - 0.2, bl, 2.9, bayW + 0.9, H - 0.11, 1.1);            // small roof over the bay
  return { H: H + 2.3, d: sb + d };
}
// Modern apartment block: solid bays stand a metre proud of the core, and
// between them are deep balconies with railings, in white render, dark panels
// with stone, or red brick with heavy dark balcony bands.
function modern(c) {
  const { P, r, w, D } = c, floors = irange(r, D.apt || [3, 4]), fh = 3.2, H = floors * fh, d = 11, shops = !D.residential, g0 = shops ? 3.05 : 0;
  const K = pick(r, [
    { wall: '#f3f3f0', slab: '#f3f3f0', frame: '#2a2d31', glassRail: true, back: '#e3e6e8', band: 0.2 },                                   // white render, glass balconies
    { wall: '#3b3e43', clad: TEX.stone, slab: '#34373c', frame: '#1c1e21', back: '#2c2f33', soffit: '#b98a5a', band: 0.2 },                // dark panels and stone
    { wall: TEX.brickRed, slab: '#2e3136', frame: '#17181a', back: '#3a2c28', band: 0.46 },                                                // red brick, heavy dark bands
    { wall: TEX.brickGrey, slab: '#ecebe6', frame: '#17181a', back: '#3a3d42', band: 0.3 },                                                // grey brick, pale bands
    { wall: '#d9c7a3', clad: TEX.brickRed, slab: '#4a3a30', frame: '#2a211c', back: '#b9a680', soffit: '#8a5a3a', band: 0.24 },            // sand render with brick sections
    { wall: TEX.brickTan, slab: '#f1ede2', frame: '#2a2d31', glassRail: true, back: '#6a5a44', band: 0.22 },                               // tan brick, white bands, glass balconies
    { wall: TEX.brickRed, clad: TEX.brickGrey, slab: '#f1ede2', frame: '#f1ede2', back: '#7a3a2c', band: 0.22 },                           // two brick colours, white frames
  ]);
  const bays = Math.max(2, Math.round(w / 4.4)), bw = w / bays, off = Math.floor(r() * 2);
  P(K.back, 1 + d / 2, 0, 0, d, H, w - 0.3); P(K.wall, 1 + d / 2, H, 0, d, 0.5, w - 0.3);  // set-back core with a parapet
  if (shops) P(K.frame, 0.5, 0, 0, 1.0, g0, w - 0.05);                                      // shop level along a main road
  let door = false;
  for (let b = 0; b < bays; b++) {
    const lat = -w / 2 + bw * (b + 0.5);
    if ((b + off) % 2 === 0) { // solid bay
      P(K.clad && b % 4 < 2 ? K.clad : K.wall, 0.5, g0, lat, 1.0, H + 0.5 - g0, bw - 0.05);
      for (let f = shops ? 1 : 0; f < floors; f++) win3D(c, 0, f * fh + 0.95, lat, 1.75, bw * 0.5, K.frame);
    } else { // balcony bay
      for (let f = 1; f < floors; f++) {
        const y = f * fh;
        P(K.slab, 0.3, y - K.band + 0.06, lat, 1.6, K.band, bw - 0.1);
        if (K.soffit) P(K.soffit, 0.3, y - K.band + 0.03, lat, 1.5, 0.03, bw - 0.2);
        P(win(r), 0.97, y + 0.08, lat, 0.08, 2.45, bw - 0.7); P(K.frame, 0.94, y + 0.08, lat, 0.06, 2.45, 0.07);
        for (const e of [-1, 1]) P(K.frame, 0.95, y + 0.08, lat + e * (bw / 2 - 0.32), 0.1, 2.5, 0.1);
        if (K.glassRail) { P('#a9c6d6', -0.46, y + 0.08, lat, 0.04, 0.95, bw - 0.2); P('#c9d1d6', -0.46, y + 1.03, lat, 0.06, 0.05, bw - 0.2); }
        else railing(c, -0.46, y + 0.08, lat, bw - 0.2, 1.0, 0);
      }
      P(K.slab, 0.4, H - 0.12, lat, 1.4, 0.25, bw - 0.1);                      // roof over the top balcony
      if (shops) continue;
      P(win(r), 0.97, 0.3, lat, 0.08, 2.5, bw - 0.7);                          // ground-floor glazing
      if (!door) { door = true; P('#1c1e21', 0.9, 0.28, lat, 0.12, 2.35, 1.15); P(K.slab, 0.2, 2.75, lat, 1.6, 0.14, 2.4); }
      else { P('#7c7468', 0.35, 0.28, lat, 0.7, 0.4, bw - 1.2); P('#6f9a3a', 0.35, 0.68, lat, 0.56, 0.36, bw - 1.34); }
    }
  }
  if (shops) groundShops(c, 3.2, bays, bw);
  return { H: H + 0.5, d: d + 1 };
}
// Uncompleted building: concrete columns and floor slabs with bare block walls
// only partly built, empty window openings, rebar sticking out of the columns,
// bamboo scaffolding on the front, and a sand heap and stacked blocks outside.
function uncompleted(c) {
  const { P, B, r, w, s } = c, floors = 2 + Math.floor(r() * 3), fh = 3.1, d = 9, sb = 1.6, top = floors * fh, done = Math.floor(r() * (floors + 0.99));
  const bays = Math.max(2, Math.round(w / 3.6)), bw = (w - 0.6) / bays, conc = '#9c9a94', blk = TEX.block, bamboo = '#b08d4f';
  P('#b79a6a', sb / 2, 0, 0, sb + 0.2, 0.1, w);                                                                  // bare sandy ground
  for (let f = 1; f <= floors; f++) P(conc, sb + d / 2, f * fh - 0.18, 0, d + 0.5, 0.18, w - 0.2);               // floor slabs
  for (let b = 0; b <= bays; b++) for (const dep of [sb + 0.15, sb + d - 0.15]) {                                // columns, with starter bars on top
    const lat = -(w - 0.6) / 2 + bw * b;
    P(conc, dep, 0, lat, 0.3, top + 0.55, 0.3);
    for (const a of [-1, 1]) for (const e of [-1, 1]) P('#4a3326', dep + a * 0.09, top + 0.55, lat + e * 0.09, 0.025, 0.85, 0.025);
  }
  for (let f = 0; f < floors; f++) {
    const y = f * fh, hgt = fh - 0.18;
    if (f < done) { // walls are up on this floor, with openings left for windows and the door
      for (let b = 0; b < bays; b++) {
        const lat = -(w - 0.6) / 2 + bw * (b + 0.5), isDoor = f === 0 && b === Math.floor(bays / 2);
        if (!isDoor) P(blk, sb + 0.13, y, lat, 0.22, 0.95, bw - 0.3);
        P(blk, sb + 0.13, y + 2.2, lat, 0.22, hgt - 2.2, bw - 0.3);
        for (const e of [-1, 1]) P(blk, sb + 0.13, y + (isDoor ? 0 : 0.95), lat + e * (bw / 2 - 0.42), 0.22, isDoor ? 2.2 : 1.25, 0.55);
      }
      for (const e of [-1, 1]) P(blk, sb + d / 2, y, e * (w / 2 - 0.42), d - 0.6, hgt, 0.22);
      P(blk, sb + d - 0.13, y, 0, 0.22, hgt, w - 0.9);
    } else for (let b = 0; b < bays; b++) if (r() < 0.6) P(blk, sb + 0.13, y, -(w - 0.6) / 2 + bw * (b + 0.5), 0.22, 0.45 + Math.floor(r() * 5) * 0.225, bw - 0.3); // walls in progress
  }
  for (let lat = -w / 2 + 0.5; lat <= w / 2 - 0.4; lat += 2.4) P(bamboo, sb - 0.55, 0, lat, 0.09, top + 0.8, 0.09); // bamboo scaffolding
  for (let f = 0; f < floors; f++) { P(bamboo, sb - 0.55, f * fh + 1.1, 0, 0.07, 0.07, w - 0.6); P(bamboo, sb - 0.55, f * fh + 2.5, 0, 0.07, 0.07, w - 0.6); if (f) P('#8a6a46', sb - 0.4, f * fh + 1.16, (r() - 0.5) * (w - 4), 0.55, 0.05, 2.6); }
  B.add(T.cone, '#d2b477', M(s * (F + 0.75), 0.5, w / 2 - 2.2, 2.3, 0.9, 2.3));                                  // sand heap
  P(blk, 0.75, 0, -w / 2 + 1.6, 1.0, 0.68, 1.8); P(blk, 0.75, 0.68, -w / 2 + 1.4, 1.0, 0.45, 1.3);               // stacked blocks
  return { H: top + 1, d: sb + d };
}
const BUILD = { apt: apartment, shop: shophouse, office, glass: glassTower, plot, church, duplex, bungalow, terrace, modern, uncompleted };
function runLot(c, type, prevH, num) {
  if (num) numberPlate(c, num);
  if (location.hash.includes('dbg')) (window.__lots = window.__lots || []).push({ type, s: c.s, w: c.w, g: c.g, m: c.B.frame.clone() }); // testing only
  const out = BUILD[type](c), r = c.r;
  if (out.mural && out.H > prevH + 6 && out.H > 11 && r() < 0.55) { // mural on the exposed side wall
    const mw = Math.min(out.d - 1.5, 7), mh = Math.min(out.H - prevH - 1.5, 10);
    const m = new THREE.Mesh(PLANE, pick(r, MURAL_MATS)); m.scale.set(mw, mh, 1);
    m.position.set(c.s * (F + out.d / 2), out.H - mh / 2 - 1, c.w / 2 + 0.05); c.addMesh(m);
  }
  return out.H;
}

/* ---------------- trees, palms, street furniture ---------------- */
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3();
const _t1 = new THREE.Matrix4(), _t2 = new THREE.Matrix4(), _t3 = new THREE.Matrix4();
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function limb(B, bark, a, d, len, r0) { // a branch from a along d; returns its tip
  B.add(T.taper, bark, MD(a.clone().addScaledVector(d, len / 2), d, r0, len, r0)); return a.clone().addScaledVector(d, len);
}
function sprigs(B, r, a, d, len, n, size, mats, from) { // leafy twigs scattered along a branch
  for (let i = 0; i < n; i++) {
    const p = a.clone().addScaledVector(d, len * (from + (1 - from) * r()));
    const o = V3(r() - 0.5, r() - 0.2, r() - 0.5).multiplyScalar(1.6).addScaledVector(d, 0.6).normalize();
    const sc = size * (0.75 + r() * 0.5);
    B.add(T.sprig, pick(r, mats), MD(p, o, sc, sc, sc));
  }
}
// Wide shade tree: short trunk, spreading boughs, each carrying hundreds of leaves
function tree(B, r, x, z) {
  B.obst(x, z, 0.5);
  const h = 3.4 + r() * 1.2, bark = WOOD(pick(r, ['#5b4630', '#4f3f2c', '#6a5038']));
  B.add(T.taper, bark, M(x, h / 2, z, 0.7, h, 0.7));
  B.add(T.taper, bark, M(x, 0.25, z, 1.15, 0.5, 1.15));
  const top = V3(x, h - 0.2, z), n = 5 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const yaw = (i / n) * 6.283 + r() * 0.6, tilt = 0.75 + r() * 0.4, len = 3 + r() * 1.4;
    const d = V3(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw));
    limb(B, bark, top, d, len, 0.34); sprigs(B, r, top, d, len, 12, 1.9, BROAD, 0.4);
    for (let j = 0; j < 2; j++) {
      const d2 = d.clone().add(V3((r() - 0.5) * 1.4, (r() - 0.3) * 0.8, (r() - 0.5) * 1.4)).normalize();
      const st = top.clone().addScaledVector(d, len * (0.5 + 0.2 * j)), l2 = 1.8 + r();
      limb(B, bark, st, d2, l2, 0.18); sprigs(B, r, st, d2, l2, 11, 1.8, BROAD, 0.2);
    }
  }
  const up = V3((r() - 0.5) * 0.3, 1, (r() - 0.5) * 0.3).normalize();
  limb(B, bark, top, up, 3, 0.3); sprigs(B, r, top, up, 3.2, 16, 2, BROAD, 0.3);
}
// Tall slender tree: straight trunk with rings of short branches, widest in the lower middle
function slender(B, r, x, z) {
  B.obst(x, z, 0.4);
  const h = 9 + r() * 3, bark = WOOD(pick(r, ['#4a3b2a', '#3f3426']));
  B.add(T.taper, bark, M(x, h / 2, z, 0.5, h, 0.5));
  for (let y = 3; y < h - 0.3; y += 0.75) {
    const k = (y - 3) / (h - 3), len = lerp(2.7, 0.5, k) * (k < 0.15 ? 0.6 + k * 2.7 : 1);
    for (let i = 0; i < 4; i++) {
      const yaw = i * 1.571 + y * 1.7 + r() * 0.5, d = V3(Math.cos(yaw) * 0.92, 0.3 + r() * 0.25, Math.sin(yaw) * 0.92).normalize(), a = V3(x, y, z);
      limb(B, bark, a, d, len, 0.1); sprigs(B, r, a, d, len, Math.ceil(len * 2.3), 1.35, BROAD, 0.25);
    }
  }
  sprigs(B, r, V3(x, h - 1, z), UP, 1.5, 7, 1.3, BROAD, 0);
}
// Bamboo clump: many thin green canes leaning outward, leafy along the upper part
function bamboo(B, r, x, z) {
  B.obst(x, z, 0.9);
  for (let i = 0, n = 12 + Math.floor(r() * 6); i < n; i++) {
    const ang = r() * 6.283, rad = r() * 0.55, lean = 0.05 + r() * 0.2, h = 6.5 + r() * 3;
    const d = V3(Math.cos(ang) * Math.sin(lean), Math.cos(lean), Math.sin(ang) * Math.sin(lean)), a = V3(x + Math.cos(ang) * rad, 0.28, z + Math.sin(ang) * rad);
    B.add(T.cyl, WOOD(pick(r, ['#78924a', '#6b8846', '#829a52'])), MD(a.clone().addScaledVector(d, h / 2), d, 0.13, h, 0.13));
    for (let y = 1; y < h; y += 0.9) B.add(T.cyl, WOOD('#5f7540'), MD(a.clone().addScaledVector(d, y), d, 0.16, 0.05, 0.16)); // nodes
    sprigs(B, r, a, d, h, 10, 1.7, BAMBOO, 0.35);
  }
}
// Banana plant: thick layered stem and big arching leaves, young ones upright, old ones drooping
function banana(B, r, x, z) {
  B.obst(x, z, 0.6);
  const h = 2.2 + r() * 0.8, sh = h / 4;
  for (let i = 0; i < 4; i++) B.add(T.taper, WOOD(i % 2 ? '#7a6a3a' : '#84904c'), M(x, 0.28 + i * sh + sh / 2, z, 0.8 - i * 0.1, sh + 0.06, 0.8 - i * 0.1));
  const n = 9 + Math.floor(r() * 3), top = V3(x, h + 0.2, z);
  for (let i = 0; i < n; i++) {
    const yaw = i * 2.4 + r() * 0.5, k = i / (n - 1), seg = 0.36 + r() * 0.1, w = 0.4 + r() * 0.08, mt = pick(r, BANANA);
    const f = V3(Math.cos(yaw), 0, Math.sin(yaw)), side = V3(-Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(w);
    let ang = lerp(1.35, 0.25, k);
    let cur = limb(B, WOOD('#869c56'), top, f.clone().multiplyScalar(Math.cos(ang)).addScaledVector(UP, Math.sin(ang)), 0.6, 0.09);
    for (let q = 0; q < 7; q++) {
      const nxt = cur.clone().addScaledVector(f, Math.cos(ang) * seg).addScaledVector(UP, Math.sin(ang) * seg);
      B.quadF(mt, cur.clone().sub(side), cur.clone().add(side), nxt.clone().add(side), nxt.clone().sub(side), q / 7, (q + 1) / 7);
      cur = nxt; ang -= 0.1 + k * 0.14 + q * 0.03;
    }
  }
}
// Coconut palm: ringed, slightly leaning trunk and arching fronds made of paired leaflets
function palm(B, r, x, z) {
  B.obst(x, z, 0.4);
  const h = 6.5 + r() * 4, segs = 8, lean = (r() - 0.5) * 0.9, ldir = r() * 6.28, sh = h / segs;
  let px = x, pz = z;
  for (let i = 0; i < segs; i++) {
    const k = (i + 0.5) / segs, off = lean * k * k;
    px = x + Math.cos(ldir) * off * 2; pz = z + Math.sin(ldir) * off * 2;
    B.add(T.taper, WOOD(i % 2 ? '#7a5c3e' : '#6a4f35'), M(px, i * sh + sh / 2, pz, 0.5 - k * 0.12, sh + 0.06, 0.5 - k * 0.12));
  }
  B.add(T.blob, WOOD('#5a4a2c'), M(px, h, pz, 0.9, 0.8, 0.9));
  for (let i = 0; i < 4; i++) B.add(T.blob, WOOD('#3d2f1c'), M(px + Math.cos(i * 1.7) * 0.4, h - 0.4, pz + Math.sin(i * 1.7) * 0.4, 0.42, 0.48, 0.42)); // coconuts
  const fronds = 11;
  for (let i = 0; i < fronds; i++) {
    const yaw = (i / fronds) * 6.283 + r() * 0.4, lift = i % 3 === 0 ? -1.0 : (i % 3 === 1 ? -0.55 : -0.15), droop = 0.2 + r() * 0.07;
    const green = pick(r, PALM_MATS);
    _t1.makeRotationY(yaw).setPosition(px, h + 0.1, pz); _t1.multiply(_t2.makeRotationX(lift + (r() - 0.5) * 0.2));
    const n = 8, sl = 0.55;
    for (let k = 0; k < n; k++) {
      const wdt = 1.25 * Math.sin((k + 0.8) / (n + 0.6) * Math.PI) + 0.15; // widest in the middle, pointed tip
      B.add(T.box, WOOD('#6b7440'), _t3.copy(_t1).multiply(M(0, 0, sl / 2, 0.07, 0.05, sl)));                       // midrib
      for (const e of [-1, 1]) B.add(T.box, green, _t3.copy(_t1).multiply(M(e * wdt / 4, -0.06, sl / 2, wdt / 2, 0.025, sl * 0.8, 0, 0, e * -0.45))); // leaflets hang in a V
      _t1.multiply(_t2.makeTranslation(0, 0, sl)).multiply(_t2.makeRotationX(droop));
    }
  }
}
// Umbrella: eight fabric panels stretched over curved ribs, with a centre pole,
// a tip on top, rib ends poking past the edge and struts from the pole to each rib.
const UMB_COLORS = ['#d7302a', '#f2b01e', '#ef7d22', '#1f6fb5', '#2a8a4a', '#e8e2d0', '#1c3f73', '#d9567a', '#7a3fa0', '#2aa3b8'];
const umbCache = new Map();
function UMB(color) {
  let m = umbCache.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }); umbCache.set(color, m); }
  return m;
}
function rod(B, mt, a, b, rad) { const d = b.clone().sub(a), len = d.length(); B.add(T.cyl, mt, MD(a.clone().addScaledVector(d, 0.5), d.normalize(), rad, len, rad)); }
function umbrella(B, r, x, z) {
  const R = 1.4 + r() * 0.3, H = R * 0.52, edgeY = 2.35, n = 8, style = pick(r, ['rainbow', 'solid', 'solid', 'two', 'two']);
  const c1 = pick(r, UMB_COLORS), c2 = pick(r, UMB_COLORS), off = Math.floor(r() * 4), rainbow = ['#d7302a', '#f2b01e', '#ef7d22', '#1f6fb5'];
  const panel = (k) => UMB(style === 'rainbow' ? rainbow[(k + off) % 4] : (style === 'two' && k % 2 ? c2 : c1));
  const tilt = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((r() - 0.5) * 0.16, r() * 6.283, (r() - 0.5) * 0.16));
  const P = (rad, ang, y) => V3(Math.cos(ang) * rad, y, Math.sin(ang) * rad).applyMatrix4(tilt).add(V3(x, 0, z));
  const rings = [[0, edgeY + H], [R * 0.42, edgeY + H * 0.9], [R * 0.76, edgeY + H * 0.6], [R, edgeY]]; // dome profile, apex to edge
  const metal = '#1b1b1b';
  for (let k = 0; k < n; k++) {
    const a0 = k * 6.2832 / n, a1 = (k + 1) * 6.2832 / n, mt = panel(k);
    for (let j = 0; j < 3; j++) {
      const p00 = P(rings[j][0], a0, rings[j][1]), p01 = P(rings[j][0], a1, rings[j][1]), p10 = P(rings[j + 1][0], a0, rings[j + 1][1]), p11 = P(rings[j + 1][0], a1, rings[j + 1][1]);
      if (j > 0) B.triF(mt, p00, p01, p11);
      B.triF(mt, p00, p11, p10);
      rod(B, metal, P(rings[j][0], a0, rings[j][1] - 0.025), P(rings[j + 1][0], a0, rings[j + 1][1] - 0.025), 0.03); // rib under the seam
    }
    rod(B, metal, P(R, a0, edgeY), P(R + 0.09, a0, edgeY - 0.04), 0.035);                         // rib end past the fabric
    rod(B, metal, P(0, 0, edgeY + 0.12), P(R * 0.76, a0, edgeY + H * 0.6 - 0.04), 0.022);         // strut from the runner
  }
  rod(B, r() < 0.5 ? '#2a2a2a' : '#8a5a33', P(0, 0, 0.28), P(0, 0, edgeY + H + 0.03), 0.06);       // pole
  rod(B, metal, P(0, 0, edgeY + H), P(0, 0, edgeY + H + 0.2), 0.035);                              // tip
  rod(B, metal, P(0, 0, edgeY + 0.06), P(0, 0, edgeY + 0.18), 0.11);                               // runner
}
const PLANTS = { shade: tree, slender, palm, banana, bamboo };
function stall(B, r, x, z) {
  B.obst(x, z, 0.85);
  umbrella(B, r, x, z);
  B.box(pick(r, ['#7e5109', '#935116', '#6e2c00']), 1.4, 0.8, 0.9, x, 0.68, z);
  B.box(pick(r, ['#c0392b', '#f39c12', '#27ae60', '#ecf0f1']), 1.2, 0.18, 0.7, x, 1.17, z);
}
// Street light: concrete footing, tapered steel column with a service door,
// a swept arm reaching over the road and a cobra-head lamp. Some carry a solar panel.
function streetLight(B, r, s, x0) {
  const x = s * (x0 || ROAD_HALF + GUTTER_W + 0.6); B.obst(x, 0, 0.42);
  B.box('#9c978c', 0.62, 0.42, 0.62, x, 0.49, 0);
  B.add(T.cyl, '#6f777c', M(x, 0.74, 0, 0.36, 0.08, 0.36));                 // base flange
  for (const a of [-1, 1]) for (const b of [-1, 1]) B.add(T.cyl, '#3a3f42', M(x + a * 0.13, 0.8, b * 0.13, 0.05, 0.06, 0.05)); // anchor bolts
  B.add(T.taper, STEEL, M(x, 0.78 + 4.1, 0, 0.26, 8.2, 0.26));
  B.box('#6f777c', 0.05, 0.42, 0.13, x - s * 0.115, 1.7, 0);                // service door
  B.add(T.cyl, STEEL, M(x, 8.98, 0, 0.2, 0.12, 0.2));                        // collar
  let px = x, py = 8.98; const n = 7, seg = 0.42, sweep = 1.36;
  for (let i = 0; i < n; i++) { // arm curves from vertical to almost horizontal
    const a = (i + 0.5) / n * sweep, dx = -s * Math.sin(a) * seg, dy = Math.cos(a) * seg;
    B.add(T.cyl, STEEL, M(px + dx / 2, py + dy / 2, 0, 0.1 - i * 0.004, seg + 0.03, 0.1 - i * 0.004, 0, 0, s * a));
    px += dx; py += dy;
  }
  const tilt = s * (sweep - Math.PI / 2); // lamp head continues the arm, tipped slightly up
  B.add(T.box, '#596267', M(px - s * 0.5, py + 0.03, 0, 1.05, 0.13, 0.36, 0, 0, tilt));   // housing
  B.add(T.box, '#596267', M(px - s * 0.2, py + 0.09, 0, 0.5, 0.1, 0.3, 0, 0, tilt));       // driver hump
  B.add(T.box, '#f6efd2', M(px - s * 0.62, py - 0.055, 0, 0.66, 0.05, 0.26, 0, 0, tilt));  // lens
  if (r() < 0.45) { // solar kit
    B.add(T.cyl, STEEL, M(x, 9.35, 0, 0.07, 0.7, 0.07));
    B.add(T.box, '#1b2a3a', M(x, 9.75, 0, 1.5, 0.05, 0.85, 0.42, 0, 0));
    B.add(T.box, '#c9d1d6', M(x, 9.72, 0, 1.56, 0.03, 0.9, 0.42, 0, 0));
    B.box('#5d666b', 0.34, 0.5, 0.3, x + s * 0.2, 7.6, 0); // battery box
  }
}
const WIRE_MAT = new THREE.LineBasicMaterial({ color: '#141414' });
function addWire(group, a, b, sag) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= Math.sin(Math.PI * t) * sag; pts.push(p); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), WIRE_MAT);
  line.userData.own = true; group.add(line);
}

/* ---------------- road pieces ---------------- */
// Builds everything that runs along a path: road surface, markings, gutters,
// kerbs, sidewalks, poles, lights and the buildings on both sides.
// An inner street: a narrow interlock-paved lane that leaves the main road
// between two buildings, runs between compound walls and then between houses,
// and is closed at the far end by another house.
const LANE_LEN = 44, LANE_HALF = 3.5, LANE_Y = 0.2;
const LANE_D = { residential: true, types: { terrace: 0.84, bungalow: 0.1, plot: 0.06 }, apt: [3, 4], trees: 0, stalls: 0, plants: { shade: 1 } };
function buildLane(g, B, r) { // in the group's own space the lane runs along -z from 0 to -BLOCK, centred on x = 0
  const L = BLOCK, Hf = LANE_HALF, wallc = '#d8d0bc';
  const laneD = { ...LANE_D, estate: { wall: pick(r, TWALL), accent: pick(r, [TEX.brickGrey, TEX.stone, TEX.brickRed, TEX.brickTan]), roof: pick(r, [TEX.roofDark, TEX.roofBrown]) } }; // one matching look per street
  B.quadF(INTERLOCK, V3(-Hf, LANE_Y, 0), V3(Hf, LANE_Y, 0), V3(Hf, LANE_Y, -L), V3(-Hf, LANE_Y, -L), 0, L / 1.75);
  for (const z of [(F - 7.45) / 2, -L - (F - 7.45) / 2]) B.box('#8e5a40', 2 * Hf, 0.3, F - 7.45, 0, 0.146, z); // paved crossing over the sidewalk at each end
  for (const e of [-1, 1]) {
    for (const z of [-7.5, -L + 7.5]) B.box(wallc, 0.25, 2.4, 15, e * (Hf + 0.13), 1.2, z);                    // compound walls behind the corner buildings
    B.box('#b9b3a7', 0.3, LANE_Y + 0.06, L - 30, e * (Hf - 0.15), (LANE_Y + 0.06) / 2, -L / 2);                // edging
    let q = 15, count = 0; const end = L - 15;
    while (end - q > 7) { // houses down both sides
      let type = weighted(r, LANE_D.types); const w = Math.min(lerp(WIDTHS[type][0], WIDTHS[type][1], r()), end - q - 0.3);
      if (w < 8.6 && type === 'terrace') type = 'bungalow';
      B.frame.makeTranslation(-e * (F - Hf), 0, -(q + w / 2));
      runLot(lotCtx(B, g, e, w, r, laneD), type, 0, 2 * count + (e > 0 ? 1 : 2)); count++;
      q += w + 0.3;
    }
    B.frame.identity();
    if (end - q > 0.6) B.box(wallc, 0.25, 2.4, end - q, e * (Hf + 0.13), 1.2, -(q + end) / 2);                 // wall across any leftover gap
  }
}
function buildRoad(g, B, pc, r, D, opt) {
  const L = pc.L, res = !!D.residential && !opt.wide, a = res ? 4.2 : ROAD_HALF, b = res ? 7.15 : a + GUTTER_W, c = b + 0.25, V = () => new THREE.Vector3();
  strip(B, ROAD_C, pc, -a, a, 0, 0, 0, L);
  for (const s of [-1, 1]) {
    const S = (mt, ua, ub, yt, yb, t0, t1) => strip(B, mt, pc, Math.min(s * ua, s * ub), Math.max(s * ua, s * ub), yt, yb, t0, t1);
    if (res) { S('#c9c5bb', a, a + 0.25, 0.22, 0, 0, L); S('#6a9a45', a + 0.25, c, 0.2, 0, 0, L); } else S('#26301f', a, b, 0, 0, 0, L);                                           // open gutter
    if (!res) for (let t = 0; t < L; t += 1) S(Math.floor(t) % 2 ? '#141414' : '#f2c12e', b, c, 0.32, 0, t, Math.min(t + 1, L)); // painted kerb
    S(res ? '#d2cbbd' : WALK_C, c, F, 0.28, 0, 0, L);                                           // sidewalk
    S('#e8e8e8', a - 0.37, a - 0.23, 0.02, 0.02, 0, L);                       // edge line
    if (!res) S('#e0b21c', 0.1, 0.23, 0.02, 0.02, 0, L);                                // double yellow centre
    for (let t = 2; t + 3 < L; t += 8) S('#e8e8e8', (res ? 0 : a / 2) - 0.07, (res ? 0 : a / 2) + 0.07, 0.02, 0.02, t, t + 3); // lane dashes
    if (!res) for (let i = 0; i < 3; i++) if (r() < 0.6) { const t = r() * (L - 1.5); S('#a59f93', a - 0.05, b + 0.05, 0.12, 0, t, t + 1.2); } // slabs over the gutter
  }
  if (L > 30 && r() < 0.3) { // zebra crossing
    const tz = 6 + r() * (L - 16);
    for (let x = -a + 0.9; x < a - 0.5; x += 1.15) strip(B, '#f2f2f2', pc, x - 0.3, x + 0.3, 0.022, 0.022, tz, tz + 3.4);
  }
  for (let i = 0, n = Math.floor(r() * 3.2 * L / 40); i < n; i++) { // potholes
    frameAt(pc, r() * L, B.frame); B.add(T.disc, '#26282a', M((r() - 0.5) * a * 1.7, 0.024, 0, 0.8 + r() * 1.4, 1, 0.6 + r() * 1.2));
  }
  const lanes = opt.slots || []; // openings where inner streets meet this road

  // power poles on the left, wires run pole to pole and across to buildings
  const poleX = -(b + 0.5), poleH = 9, ts = [];
  for (let tt = 5; tt < L - 1; tt += 10) {
    const t = lanes.some((l) => l.side === -1 && Math.abs(tt - l.t0) < 4.2) ? tt + 4.6 : tt; // keep poles out of the mouth of an inner street
    ts.push(t); frameAt(pc, t, B.frame);
    B.add(T.cyl, '#7d7468', M(poleX, poleH / 2, 0, 0.28, poleH, 0.28)); B.obst(poleX, 0, 0.28);
    B.box('#5b4a3a', 2.2, 0.15, 0.15, poleX, poleH - 0.4, 0);
    for (const dx of [-0.9, 0, 0.9]) B.add(T.cyl, '#d9d4c8', M(poleX + dx, poleH - 0.24, 0, 0.12, 0.2, 0.12)); // insulators
    if (r() < 0.2) B.box('#5d6d7e', 0.9, 1.2, 0.8, poleX + 0.4, poleH - 2, 0);
    if (r() < 0.4) addWire(g, pt(pc, t, poleX, poleH - 0.6, V()), pt(pc, t + 3 + r() * 4, F, 5 + r() * 3, V()), 1.3);
    if (r() < 0.3) addWire(g, pt(pc, t, poleX, poleH - 0.6, V()), pt(pc, t + 2 + r() * 4, -F, 4 + r() * 4, V()), 0.5);
  }
  const stops = [0, ...ts, L];
  for (let i = 0; i + 1 < stops.length; i++) for (const dx of [-0.9, 0, 0.9])
    addWire(g, pt(pc, stops[i], poleX + dx, poleH - 0.1, V()), pt(pc, stops[i + 1], poleX + dx, poleH - 0.1, V()), 0.25 + r() * 0.3);
  for (let t = 8; t < L - 2; t += 22) { frameAt(pc, t, B.frame); streetLight(B, r, 1, res ? a + 0.9 : 0); }

  // buildings, lot by lot. On a bend the inside has less room and the outside more.
  for (const s of [-1, 1]) {
    const f = pc.k ? (s * pc.k < 0 ? (pc.R - F - 6) / pc.R : (pc.R + F) / pc.R) : 1;
    let t = (opt.lotStart || 0) + (0.4 + r() * 1.2) / f, prevH = 0, count = 0; const Lend = L - (opt.lotEnd || 0);
    const lot = (type, w) => {
      const span = w / f; frameAt(pc, t + span / 2, B.frame);
      prevH = runLot(lotCtx(B, g, s, w, r, D), type, prevH, (opt.numBase || 0) + 2 * (opt.numRev ? Math.max(0, 11 - count) : count) + (s > 0 ? 1 : 2)); count++; // odd numbers on one side, even on the other
      const sx = s * (res ? 5.8 : b + 1.3);
      if (type !== 'church' && r() < D.stalls) stall(B, r, s * (F - 2.3 + r() * 0.6), (r() - 0.5) * Math.max(w - 7, 0));
      if (r() < D.trees) PLANTS[weighted(r, D.plants)](B, r, sx, (r() < 0.5 ? -1 : 1) * (w / 2 - 0.6)); // at the lot edge, clear of any stall
      t += span + (0.2 + r() * 1.2) / f;
    };
    const lane = lanes.find((l) => l.side === s), a0 = lane ? lane.t0 - LANE_HALF - 0.2 : 0, b0 = lane ? lane.t0 + LANE_HALF + 0.2 : 0;
    if (!lane && !pc.k && D.church && s === 1 && Lend - t > 31 && r() < 0.2) lot('church', 30);
    while ((Lend - t) * f > 6.5) {
      if (lane && t < b0 && a0 - t < 6.5) { if (a0 - t > 3) lot('plot', a0 - t - 0.3); t = b0; continue; } // leave the mouth of the inner street open
      let type = weighted(r, D.types);
      let w = Math.min(lerp(WIDTHS[type][0], WIDTHS[type][1], r()), (Lend - t) * f - 0.3);
      if (lane && t < a0) w = Math.min(w, a0 - t - 0.1);
      if (w < 11 && (type === 'office' || type === 'glass')) type = 'apt';
      if (w < 13 && type === 'modern') type = D.residential ? 'terrace' : 'apt';
      if (w < 11.5 && type === 'duplex') type = 'bungalow';
      if (w < 8.6 && type === 'terrace') type = 'bungalow';
      lot(type, w);
    }
    if ((Lend - t) * f > 1.6) lot('plot', (Lend - t) * f - 0.2); // close any leftover gap with a fenced plot, so nothing looks like an opening
  }
  B.frame.identity();
  return lanes;
}
// A long building that closes the view at the end of a road
function endcap(g, B, r, D, originZ) {
  B.frame.makeRotationY(Math.PI / 2).setPosition(0, 0, originZ);
  runLot(lotCtx(B, g, 1, 2 * F + 28, r, D), D.residential ? 'modern' : (r() < 0.5 ? 'apt' : 'office'), 99);
  B.frame.identity();
}
// A junction is a square where two streets cross. Side streets are built far
// enough to see down, then closed by a building. go: 0 straight on, 1 turn left, -1 turn right.
function buildJunction(g, B, r, D, go, aheadOpen) {
  B.box(ROAD_C, 2 * F, 0.1, 2 * F, 0, -0.05, -F);
  for (const sx of [-1, 1]) for (const far of [0, 1]) { // sidewalk corners with painted kerbs
    const zc = far ? -2 * F + 1.8 : -1.8, zin = far ? -2 * F + 3.72 : -3.72;
    B.box(WALK_C, 3.6, 0.28, 3.6, sx * 9, 0.14, zc);
    B.box('#f2c12e', 0.25, 0.32, 3.6, sx * 7.08, 0.16, zc);
    B.box('#141414', 3.85, 0.32, 0.25, sx * 8.88, 0.16, zin);
  }
  for (let x = -ROAD_HALF + 0.9; x < ROAD_HALF - 0.5; x += 1.15) { // zebra crossings on all four sides
    B.box('#f2f2f2', 0.6, 0.02, 2.6, x, 0.012, -1.8); B.box('#f2f2f2', 0.6, 0.02, 2.6, x, 0.012, -2 * F + 1.8);
    for (const sx of [-1, 1]) B.box('#f2f2f2', 2.6, 0.02, 0.6, sx * (F - 1.8), 0.012, -F + x);
  }
  const arms = [];
  if (go !== 1) arms.push({ x: -F, z: -F, h: Math.PI / 2, side: true });
  if (go !== -1) arms.push({ x: F, z: -F, h: -Math.PI / 2, side: true });
  if (go !== 0 && aheadOpen) arms.push({ x: 0, z: -2 * F, h: 0, side: false });
  for (const arm of arms) {
    const sub = new THREE.Group(), SB = new Batch(), pc = straightPath(STUB_LEN);
    buildRoad(sub, SB, pc, r, D, { lotStart: arm.side ? SIDE_LOT_START : 0 });
    SB.box(WALK_C, 2 * F, 0.28, 3.6, 0, 0.14, -STUB_LEN + 1.8);
    endcap(sub, SB, r, D, -STUB_LEN + F);
    SB.build(sub); sub.position.set(arm.x, 0, arm.z); sub.rotation.y = arm.h; g.add(sub);
    const ch = Math.cos(arm.h), sh = Math.sin(arm.h); // side-street obstacles, moved into the junction's own space
    for (const o of SB.obstacles) B.obstacles.push({ x: arm.x + o.x * ch + o.z * sh, z: arm.z - o.x * sh + o.z * ch, r: o.r });
  }
  if (go !== 0 && !aheadOpen) { // T-junction or corner: the far side is closed by a building
    B.box(WALK_C, 2 * (ROAD_HALF + GUTTER_W), 0.28, 3.6, 0, 0.14, -2 * F + 1.8);
    B.box('#f2c12e', 2 * (ROAD_HALF + GUTTER_W), 0.32, 0.25, 0, 0.16, -2 * F + 3.72);
    endcap(g, B, r, D, -F);
  }
  return { arms, closed: go !== 0 && !aheadOpen };
}

/* ---------------- people ---------------- */
// Three free Quaternius characters (CC0): a man, a woman in trousers and a
// woman in a dress. Each is recoloured into many outfits, 100 in total, and
// copies walk up and down the sidewalks.
const SKIN = ['#2f1c12', '#3b2417', '#4a2e1d', '#5a3825', '#6b4530', '#7a5236', '#8a5c3a', '#9c6b45', '#b07d55', '#c4946a', '#d2a67c']; // from deep brown to fair
const HAIR = ['#0d0b0a', '#16100c', '#1f1611', '#2a1c14'];
const TOPS = ['#f4f4f0', '#ffffff', '#c0392b', '#1f5fa8', '#e3b23c', '#1e8449', '#6c3483', '#e67e22', '#16a085', '#2c3e50', '#d98880', '#f7dc6f', '#117864', '#884ea0', '#0b5345', '#d35400', '#a93226', '#5dade2', '#f5b7b1', '#7dcea0'];
const BOTTOMS = ['#1b2631', '#2c3e50', '#3b3b3b', '#5d4037', '#1a5276', '#784212', '#212121', '#566573', '#7d6608', '#34495e', '#b9a27a'];
const SHOES = ['#141414', '#2b1d14', '#f0f0f0', '#7b241c', '#3b3b3b'];
const PEOPLE_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const kinds = [], people = [];
let frameNo = 0;
// The street walkers: seven realistic characters from Sketchfab (credits in models/CREDITS.txt).
// Five are 3D scans of real models by Renderpeople (Nathan, Eric, Sophia, Carla, Claudia); two use
// the Mixamo skeleton (a security guard and a business man).
// Characters on the same skeleton share animations: the Renderpeople four use Nathan's walk and
// Sophia's idle; the Mixamo three use a standard Mixamo walk and idle.
const KINDS = 7;
const toHsl = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l];
  const sa = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, sa, l]; };
const fromHsl = (h, sa, l) => { const c = (1 - Math.abs(2 * l - 1)) * sa, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
const parseGlb = (u8) => new Promise((res, rej) => new GLTFLoader().parse(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength), '', res, rej));
// the same bone under its different names: "mixamorig:Hips_01", "mixamorigHips", "rp_nathan_animated_003_walking_hip_02", "hip_02"
const boneKey = (n) => n.replace(/^.*mixamorig:?/, '').replace(/^rp_[a-z]+_animated_\d+_(walking|idling)_/, '').replace(/_\d+$/, '').toLowerCase();
function retarget(clip, src, dst) { // re-address an animation to another character on the same kind of skeleton
  const to = new Map(), from = new Map(), tracks = []; let speed = 0;
  dst.traverse((o) => { if (o.isBone && !to.has(boneKey(o.name))) to.set(boneKey(o.name), o); });
  src.traverse((o) => { if (o.isBone) from.set(o.name, o); });
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.'), node = t.name.slice(0, dot), prop = t.name.slice(dot + 1), key = boneKey(node), b = to.get(key), sb = from.get(node);
    if (!b) continue;
    if (prop === 'quaternion') tracks.push(new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', t.times, t.values));
    else if (prop === 'position' && (key === 'hips' || key === 'hip') && sb) { // the hips carry the bob of the walk: fit it to this body, and take out any travel so they walk on the spot
      const k = b.position.length() / (sb.position.length() || 1), n = t.times.length, v = Float32Array.from(t.values, (x) => x * k), T = t.times[n - 1] - t.times[0] || 1;
      const drift = [0, 1, 2].map((c) => v[(n - 1) * 3 + c] - v[c]); speed = Math.max(speed, Math.hypot(...drift) / T);
      for (let q = 0; q < n; q++) for (let c = 0; c < 3; c++) v[q * 3 + c] -= drift[c] * (t.times[q] - t.times[0]) / T;
      tracks.push(new THREE.VectorKeyframeTrack(b.name + '.position', t.times, v));
    }
  }
  return { clip: new THREE.AnimationClip(clip.name, clip.duration, tracks), speed };
}
// Convert an animation between skeletons whose bones point different ways: every bone is given the
// same turn away from the T-pose, measured in the world, and the result is written out 30 times a second.
const ALIAS = { hip: 'hips', spine_01: 'spine', spine_02: 'spine1', spine_03: 'spine2' }; // Renderpeople bone names in Mixamo terms
for (const [e, E] of [['l', 'left'], ['r', 'right']]) Object.assign(ALIAS, { ['shoulder_' + e]: E + 'shoulder', ['upperarm_' + e]: E + 'arm', ['lowerarm_' + e]: E + 'forearm', ['hand_' + e]: E + 'hand', ['middle_01_' + e]: E + 'handmiddle1', ['upperleg_' + e]: E + 'upleg', ['lowerleg_' + e]: E + 'leg', ['foot_' + e]: E + 'foot', ['ball_' + e]: E + 'toebase' });
const mixKey = (n) => ALIAS[boneKey(n)] || boneKey(n);
function bake(clip, src, dst, tuck = 1) { // tuck below 1 brings the arms and legs in closer to the body
  const S = new Map(), list = [], Q = () => new THREE.Quaternion(), V = () => new THREE.Vector3();
  src.updateMatrixWorld(true); dst.updateMatrixWorld(true);
  src.traverse((o) => { const k = boneKey(o.name); if (!S.has(k)) S.set(k, { o, restW: o.getWorldQuaternion(Q()), restQ: o.quaternion.clone(), restP: o.position.clone() }); });
  dst.traverse((o) => { if (o.isBone) list.push({ o, s: S.get(mixKey(o.name)), restW: o.getWorldQuaternion(Q()), parentRestW: o.parent.getWorldQuaternion(Q()), restLocal: o.quaternion.clone(), vals: [], curW: Q() }); });
  const byObj = new Map(list.map((b) => [b.o, b])), hips = list.find((b) => mixKey(b.o.name) === 'hips'), sh = hips.s;
  // Arms and legs are also aimed exactly where the animation points them, so a character whose
  // arms start a little lower or higher than the animation's T-pose does not end up with them twisted behind.
  const NEXT = { leftarm: 'leftforearm', leftforearm: 'lefthand', lefthand: 'lefthandmiddle1', righthand: 'righthandmiddle1', rightarm: 'rightforearm', rightforearm: 'righthand', leftupleg: 'leftleg', leftleg: 'leftfoot', rightupleg: 'rightleg', rightleg: 'rightfoot' };
  for (const b of list) {
    const ck = NEXT[mixKey(b.o.name)], c = ck && list.find((x) => mixKey(x.o.name) === ck);
    if (!c || !b.s || !c.s) continue;
    b.aim = c.o.getWorldPosition(V()).sub(b.o.getWorldPosition(V())).normalize().applyQuaternion(b.restW.clone().invert()); b.sc = c.s;
  }
  const a0 = V(), a1 = V(), fix = Q();
  const srcRest = sh.o.getWorldPosition(V()), dstRest = hips.o.getWorldPosition(V()), ratio = dstRest.y / srcRest.y, parentInv = hips.o.parent.matrixWorld.clone().invert();
  const mixer = new THREE.AnimationMixer(src); mixer.clipAction(clip).play();
  const n = Math.max(2, Math.round(clip.duration * 30) + 1), times = new Float32Array(n), tmp = Q(), inv = Q(), p = V(), pos = [];
  for (let f = 0; f < n; f++) {
    times[f] = clip.duration * f / (n - 1); mixer.setTime(Math.min(times[f], clip.duration - 1e-4)); src.updateMatrixWorld(true);
    for (const b of list) {
      const pb = byObj.get(b.o.parent), parentW = pb ? pb.curW : b.parentRestW;
      if (b.s) b.curW.copy(b.s.o.getWorldQuaternion(tmp)).multiply(inv.copy(b.s.restW).invert()).multiply(b.restW); else b.curW.copy(parentW).multiply(b.restLocal);
      if (b.aim) { a0.copy(b.aim).applyQuaternion(b.curW); b.sc.o.getWorldPosition(a1).sub(b.s.o.getWorldPosition(p)); a1.x *= tuck; a1.normalize(); b.curW.premultiply(fix.setFromUnitVectors(a0, a1)); }
      tmp.copy(parentW).invert().multiply(b.curW); b.vals.push(tmp.x, tmp.y, tmp.z, tmp.w);
    }
    sh.o.getWorldPosition(p).sub(srcRest).multiplyScalar(ratio); pos.push(p.x, p.y, p.z);
  }
  const dx = pos[(n - 1) * 3] - pos[0], dz = pos[(n - 1) * 3 + 2] - pos[2], out = new Float32Array(n * 3); // take out any travel so they walk on the spot
  for (let f = 0; f < n; f++) { p.set(pos[f * 3] - dx * f / (n - 1), pos[f * 3 + 1], pos[f * 3 + 2] - dz * f / (n - 1)).add(dstRest).applyMatrix4(parentInv); out[f * 3] = p.x; out[f * 3 + 1] = p.y; out[f * 3 + 2] = p.z; }
  mixer.stopAllAction(); mixer.uncacheRoot(src); for (const e of S.values()) { e.o.quaternion.copy(e.restQ); e.o.position.copy(e.restP); } // put the source back in its rest pose
  const tracks = list.filter((b) => b.s).map((b) => new THREE.QuaternionKeyframeTrack(b.o.name + '.quaternion', times, b.vals));
  tracks.push(new THREE.VectorKeyframeTrack(hips.o.name + '.position', times, out));
  return { clip: new THREE.AnimationClip(clip.name, clip.duration, tracks), speed: Math.hypot(dx, dz) / clip.duration };
}
function skinTone(map, f) { // a copy of a scanned person's texture with the skin (and hair) made deeper by the factor f
  const img = map.image, cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const [h, sa, l] = toHsl(a[i] / 255, a[i + 1] / 255, a[i + 2] / 255);
    if ((h < 48 || h > 345) && sa > 0.14 && sa < 0.8 && l > 0.1 && l < 0.9) { const [r, gg, b] = fromHsl(h, Math.min(1, sa * 1.08), l * f); a[i] = r; a[i + 1] = gg; a[i + 2] = b; }
  }
  g.putImageData(d, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
// Outfits: each person keeps one texture, and the material recolours it as it is drawn.
// Skin and hair are made lighter or deeper, white and grey cloth takes a colour, and denim can change shade.
const CLOTH = ['#ffffff', '#ffffff', '#f2c94c', '#6fb1e8', '#e87f7f', '#7fd19a', '#c79be8', '#f2a35c', '#3f6fd0', '#d8485a', '#2f9e8f', '#f0e2b6', '#9aa7b4', '#e9a0c0'];
const JEANS = [[1, 1, 1, 0], [1, 1, 1, 0], [0.5, 0.5, 0.55, 0.92], [2.3, 1.95, 1.3, 0.9], [1.5, 1.5, 1.5, 0.9], [0.55, 0.7, 1.2, 0.5]].map((a) => new THREE.Vector4(...a)); // denim, charcoal, khaki, grey, deep blue
const TINT_GLSL = `{
  vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = mx > 0.001 ? (mx - mn) / mx : 0.0, lum = dot(c, vec3(0.3, 0.6, 0.1));
  if (c.r > c.g * 1.08 && c.g > c.b * 1.02 && sat > 0.22 && sat < 0.92 && mx > 0.02) c *= uSkin;
  else if (sat < 0.3 && mx > 0.1) c *= uTint;
  else if (c.b > c.r * 1.12 && sat > 0.2) c = mix(c, vec3(lum) * uJeans.rgb, uJeans.a);
  diffuseColor.rgb = c; }`;
function tinted(m, P) {
  const c = m.clone(); c.name = m.name;
  c.onBeforeCompile = (sh) => {
    sh.uniforms.uSkin = { value: P.skin }; sh.uniforms.uTint = { value: P.tint }; sh.uniforms.uJeans = { value: P.jeans };
    sh.fragmentShader = 'uniform float uSkin; uniform vec3 uTint; uniform vec4 uJeans;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + TINT_GLSL);
  };
  c.customProgramCacheKey = () => 'people-tint'; return c;
}
// Shadows: every person is drawn a second time, flattened onto the ground along the sun's rays,
// so the shadow is their real outline and moves with every step. The stencil stops overlapping
// parts of a shadow from darkening twice.
const SUN_DIR = new THREE.Vector3(60, 110, 45).normalize();
const SHADOW_MAT = new THREE.ShaderMaterial({
  uniforms: { uY: { value: 0 }, uSun: { value: SUN_DIR } },
  vertexShader: `#include <common>
#include <skinning_pars_vertex>
uniform float uY; uniform vec3 uSun; varying float vD;
void main() {
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  float h = max(wp.y - uY, 0.0);
  wp.xz -= uSun.xz * (h / uSun.y); wp.y = uY + 0.025;
  vec4 mv = viewMatrix * wp; vD = -mv.z; gl_Position = projectionMatrix * mv;
}`,
  fragmentShader: `varying float vD; void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.42 * (1.0 - smoothstep(45.0, 70.0, vD))); }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
});
function addShadow(model, holder) { // holder is the person as a whole: its height is the ground they stand on; returns the shadow meshes
  const list = [], out = []; model.traverse((o) => { if (o.isSkinnedMesh) list.push(o); });
  for (const o of list) {
    const m = SHADOW_MAT.clone(), sh = new THREE.SkinnedMesh(o.geometry, m);
    sh.bind(o.skeleton, o.bindMatrix); sh.position.copy(o.position); sh.quaternion.copy(o.quaternion); sh.scale.copy(o.scale);
    sh.boundingSphere = o.boundingSphere.clone(); sh.boundingSphere.radius *= 1.4; sh.renderOrder = 5; sh.onBeforeRender = () => { m.uniforms.uY.value = holder.matrixWorld.elements[13]; };
    o.parent.add(sh); out.push(sh);
  }
  return out;
}
function makeKind(gltf, height, walk, idle, skins) {
  const root = gltf.scene, mats = new Map(); let lo = Infinity, hi = -Infinity; const v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (o.isBone) { o.getWorldPosition(v); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); }
    if (o.isMesh) { // simple, cheap materials
      o.geometry.computeBoundingSphere(); o.boundingSphere = o.geometry.boundingSphere.clone(); o.boundingSphere.radius *= 1.6; // a generous fixed bound, so off-screen people are skipped cheaply
      const m = o.material;
      if (!mats.has(m)) mats.set(m, Object.assign(new THREE.MeshLambertMaterial({ map: m.map, color: m.map ? '#ffffff' : m.color, alphaTest: m.transparent || m.alphaTest ? 0.5 : 0, side: m.transparent ? THREE.DoubleSide : m.side }), { name: m.name })); // keep two-sided parts two-sided, or hands and cuffs modelled inside-out vanish
      o.material = mats.get(m);
    }
  });
  const base = [...mats.values()], scale = height / (hi - lo), conv = walk.bake ? bake : retarget, W = conv(walk.clip, walk.root, root), I = conv(idle.clip, idle.root, root);
  const r = rng(kinds.length * 97 + 13), makeLook = (P) => { const look = new Map(); for (const m of base) look.set(m, tinted(m, P)); return look; };
  const looks = []; for (let n = 0; n < 9; n++) looks.push(makeLook({ skin: skins[n % skins.length], tint: new THREE.Color(pick(r, CLOTH)), jeans: pick(r, JEANS) })); // nine outfits each
  kinds.push({ root, walk: W.clip, idle: I.clip, scale, lift: -lo * scale, looks, makeLook, stride: (W.speed > 0.3 ? W.speed * scale : 1.5 * height / 1.8) });
}
Promise.all([mixamoAnimsGlb, guardGlb, bizmanGlb, claudiaGlb, nathanGlb, ericGlb, sophiaGlb, carlaGlb].map(parseGlb)).then(([anim, guard, bizman, claudia, nathan, eric, sophia, carla]) => {
  const clip = (g, name) => ({ clip: g.animations.find((a) => a.name === name) || g.animations[0], root: g.scene });
  const mWalk = { ...clip(anim, 'walk'), bake: true }, mIdle = { ...clip(anim, 'idle'), bake: true }, rWalk = clip(nathan), womanIdle = clip(sophia);
  // Men stand in a plain, relaxed pose: the standard idle, converted once onto Eric's clean skeleton and shared with the other men.
  const manIdle = { clip: bake(mIdle.clip, anim.scene, eric.scene, 0.4).clip, root: eric.scene };
  // skin: how much lighter or deeper than the scan each outfit is, so every character appears fair, brown and dark
  makeKind(guard, 2.1, mWalk, mIdle, [1, 1.5, 2.1]);
  makeKind(bizman, 2.08, mWalk, mIdle, [1, 0.6, 0.38]);
  makeKind(claudia, 1.98, rWalk, womanIdle, [0.5, 0.32, 0.9, 0.22]);
  makeKind(nathan, 2.1, rWalk, manIdle, [1, 0.5, 0.3, 0.22]);
  { // the main character: Nathan with brown skin, in his own white T-shirt and jeans
    const k = kinds[kinds.length - 1], look = k.makeLook({ skin: 0.34, tint: new THREE.Color('#ffffff'), jeans: JEANS[0] }), m = SkeletonUtils.clone(k.root);
    m.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.boundingSphere = o.boundingSphere && o.boundingSphere.clone(); } });
    m.scale.multiplyScalar(k.scale * 1.01); m.position.y += k.lift; hero.obj.add(m); addShadow(m, hero.obj); hero.mixer = new THREE.AnimationMixer(m);
    const run = retarget(bake(clip(anim, 'run').clip, anim.scene, eric.scene, 0.8).clip, eric.scene, k.root).clip; // a real running animation, fitted to him
    hero.acts = [k.idle, k.walk, run].map((c, n) => { const a = hero.mixer.clipAction(c); a.play(); a.setEffectiveWeight(n ? 0 : 1); return a; });
    hero.stride = k.stride;
  }
  makeKind(eric, 2.1, rWalk, manIdle, [1, 0.5, 0.3, 0.2]);
  makeKind(sophia, 1.98, rWalk, womanIdle, [1, 0.55, 0.34, 0.24]);
  makeKind(carla, 2.0, rWalk, womanIdle, [1, 1.5, 0.6, 2.1]);
}, (e) => console.error('walkers failed to load', e));
function populate(piece) { // put walkers on both sidewalks of a road piece
  if (piece.junction || kinds.length < KINDS) return;
  const r = rng(piece.seed * 7919 + 5), L = piece.pc.L;
  for (let i = 0, n = Math.round(L / 40 * piece.crowd); i < n; i++) {
    const k = kinds[Math.floor(r() * kinds.length)], obj = new THREE.Group(), inner = SkeletonUtils.clone(k.root), look = pick(r, k.looks);
    inner.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.boundingSphere = o.boundingSphere && o.boundingSphere.clone(); } });
    inner.scale.multiplyScalar(k.scale * (0.95 + r() * 0.09)); inner.position.y += k.lift; obj.add(inner); const shadows = addShadow(inner, obj);
    const mixer = new THREE.AnimationMixer(inner), speed = 1.0 + r() * 0.5, dir0 = r() < 0.5 ? 1 : -1;
    const walk = mixer.clipAction(k.walk), idle = mixer.clipAction(k.idle || k.walk); walk.play(); idle.play(); idle.setEffectiveWeight(0); mixer.update(r() * 2);
    people.push({ obj, shadows,  mixer, walk, idle, stride: k.stride || 1.45, wWalk: 1, v: dir0 * speed, face: dir0 > 0 ? Math.PI : 0, piece, pc: piece.pc, t: 1 + r() * (L - 2), u: 0, u0: (r() < 0.5 ? -1 : 1) * (piece.lo + 0.45 + r() * (piece.hi - piece.lo - 0.6)), dir: dir0, speed, stuck: 0, id: people.length });
    const me = people[people.length - 1], mine = people.filter((q) => q.piece === piece && q !== me);
    for (let tries = 0; tries < 14; tries++) { // start in a clear spot: not inside an object or another person
      const au = Math.abs(me.u0), sg = Math.sign(me.u0);
      const clash = piece.obstTU.some((o) => Math.sign(o.u) === sg && Math.hypot(o.t - me.t, Math.abs(o.u) - au) < o.r + 0.5) || mine.some((q) => Math.hypot(q.t - me.t, q.u0 - me.u0) < 0.9);
      if (!clash) break;
      me.t = 1 + r() * (L - 2); me.u0 = (r() < 0.5 ? -1 : 1) * (piece.lo + 0.45 + r() * (piece.hi - piece.lo - 0.6));
    }
    me.u = me.u0;
    piece.grp.add(obj);
  }
  for (const l of piece.lanePieces) populate(l);
}
function dropPeople(piece) {
  for (let i = people.length - 1; i >= 0; i--) {
    const q = people[i]; if (q.piece !== piece && q.piece.parent !== piece) continue;
    q.mixer.stopAllAction(); q.mixer.uncacheRoot(q.mixer.getRoot());
    if (q.obj.parent) q.obj.parent.remove(q.obj); // take them out of the scene too, or they are left standing there frozen
    people.splice(i, 1);
  }
}
function tuOf(pc, lx, lz, out) { // piece-local position -> distance along the road (t) and metres to the right (u)
  if (!pc.k) { out.t = -lz; out.u = lx; }
  else { const dx = lx + pc.k * pc.R; out.t = Math.atan2(-lz, pc.k * dx) * pc.R; out.u = pc.k * (Math.hypot(dx, lz) - pc.R); }
  return out;
}
// Walkers keep to the sidewalk and steer round trees, stalls, poles, each other
// and you. They ease up to walking speed and back down, turn to face the way
// they are actually moving, stand idle while waiting for a gap, and turn round
// smoothly at the end of a street. Their steps are timed to their real speed.
function updatePeople(dt, cam) {
  frameNo++;
  const heroTU = new Map();
  for (const p of people) {
    const pc = p.pc, piece = p.piece, sgn = Math.sign(p.u0), au = Math.abs(p.u), LO = piece.lo, HI = piece.hi;
    if (!heroTU.has(piece)) { _v.set(hero.x, 0, hero.z).applyMatrix4(piece.inv); heroTU.set(piece, tuOf(pc, _v.x, _v.z, {})); }
    // Look ahead and react only to the nearest thing in the way: drift to one side of it in good time,
    // and ease off behind a person who is directly ahead. No sudden stops, no pushing back and forth.
    let goal = Math.abs(p.u0), slow = 1, nearest = 4.5;
    const consider = (ot, ou, or, person) => {
      const ahead = (ot - p.t) * p.dir, gap = Math.abs(ou - au), need = or + 0.36;
      if (ahead < -0.2 || ahead > 4.5 || gap > need + 0.3) return;
      if (ahead < nearest) {
        nearest = ahead;
        const side = person ? p.dir * sgn : (au >= ou ? 1 : -1); // people pass each other on the right; objects on whichever side is nearer
        let g = ou + side * (need + 0.22); if (g < LO || g > HI) g = ou - side * (need + 0.22);
        goal = g >= LO && g <= HI ? g : Math.abs(p.u0);
      }
      if (person && gap < need * 0.75) slow = Math.min(slow, clamp((ahead - need) / 1.4, 0, 1));
    };
    const h = heroTU.get(piece), heroNear = h.t > -1 && h.t < pc.L + 1 && Math.sign(h.u) === sgn && Math.abs(h.u) > LO - 0.9;
    for (const o of piece.obstTU) if (Math.sign(o.u) === sgn) consider(o.t, Math.abs(o.u), o.r, false);
    for (const q of people) if (q !== p && q.piece === piece && Math.sign(q.u) === sgn) consider(q.t, Math.abs(q.u), 0.3, true);
    if (heroNear) consider(h.t, Math.abs(h.u), 0.36, true);
    if (p.gu === undefined) { p.gu = au; p.lat = 0; }
    p.gu += (goal - p.gu) * Math.min(1, dt * 2.5);                              // the side they are aiming for changes smoothly
    p.v += clamp(p.dir * p.speed * slow - p.v, -2.2 * dt, 2.2 * dt);            // speed eases up and down
    const step = clamp(p.gu - au, -0.9 * dt, 0.9 * dt);
    let nt = p.t + p.v * dt, nu = au + step;
    const apart = (ot, ou, R) => { // a last resort if two still end up overlapping: ease apart slowly
      const dT = nt - ot, dU = nu - ou, d = Math.hypot(dT, dU); if (d >= R || d < 1e-3) return;
      const k = Math.min(R - d, 1.3 * dt) / d; nt += dT * k; nu = clamp(nu + dU * k, LO, HI);
    };
    for (const o of piece.obstTU) if (Math.sign(o.u) === sgn) apart(o.t, Math.abs(o.u), o.r + 0.3);
    for (const q of people) if (q !== p && q.piece === piece && Math.sign(q.u) === sgn) apart(q.t, Math.abs(q.u), 0.6);
    if (heroNear) apart(h.t, Math.abs(h.u), 0.66);
    p.t = clamp(nt, 0.5, pc.L - 0.5); p.u = sgn * nu;
    if (slow < 0.05) { p.stuck += dt; if (p.stuck > 4) { p.dir = -p.dir; p.stuck = 0; } } else p.stuck = 0;
    if (p.t > pc.L - 1.6) p.dir = -1; else if (p.t < 1.6) p.dir = 1;
    // They face the way they are walking, turning gently; small sideways corrections do not swing the body about.
    p.lat += (step / dt * sgn - p.lat) * Math.min(1, dt * 3);
    if (Math.abs(p.v) > 0.3) p.face += angDiff(Math.atan2(p.lat * 0.6, -p.v), p.face) * Math.min(1, dt * 3.5);
    pt(pc, p.t, p.u, piece.y, p.obj.position);
    p.obj.rotation.y = _o.h + p.face;
    const sp = Math.abs(p.v);
    p.wWalk += (Math.min(1, sp / 0.5) - p.wWalk) * Math.min(1, dt * 4);        // blend between standing and walking
    p.walk.setEffectiveWeight(p.wWalk); p.idle.setEffectiveWeight(1 - p.wWalk);
    p.walk.timeScale = clamp(sp / p.stride, 0.45, 1.4);                         // steps match ground speed, so feet do not slide
    _v.copy(p.obj.position).applyMatrix4(piece.g.matrix);
    const d2 = (_v.x - cam.x) ** 2 + (_v.z - cam.z) ** 2;
    p.obj.visible = d2 < 70 * 70; // beyond this they are lost in the haze anyway
    const shadowOn = d2 < 30 * 30; if (shadowOn !== p.shadowOn) { p.shadowOn = shadowOn; for (const sh of p.shadows) sh.visible = shadowOn; } // shadows only close by
    if (!p.obj.visible) continue;
    if (d2 < 28 * 28) p.mixer.update(dt);                                        // near: animate every frame
    else if ((frameNo + p.id) % 2 === 0) p.mixer.update(dt * 2);               // farther: every other frame
  }
}
// Moves the player out of anything solid they have stepped into
function pushOut() {
  for (const p of zones) {
    if ((p.cx - hero.x) ** 2 + (p.cz - hero.z) ** 2 > 60 * 60) continue;
    _v.set(hero.x, 0, hero.z).applyMatrix4(p.inv); let lx = _v.x, lz = _v.z, hit = false;
    const test = (ox, oz, R) => { const dx = lx - ox, dz = lz - oz, d = Math.hypot(dx, dz); if (d < R && d > 1e-4) { lx = ox + dx / d * R; lz = oz + dz / d * R; hit = true; } };
    for (const o of p.obst) test(o.x, o.z, o.r + 0.33);
    for (const q of people) if (q.piece === p) test(q.obj.position.x, q.obj.position.z, 0.62);
    if (hit) { _v.set(lx, 0, lz).applyMatrix4(p.g.matrix); hero.x = _v.x; hero.z = _v.z; }
  }
}

/* ---------------- sound ---------------- */
// All sound is made in code (no audio files): a low city rumble, the rush of passing cars,
// footsteps in time with the main character's walk, and a horn from a driver kept waiting.
// Phones only allow sound after a touch, so it starts on the first tap.
const sfx = { ctx: null, traffic: null, phase: 0, hornAt: 0 };
function startSound() {
  if (sfx.ctx) { if (sfx.ctx.state !== 'running') sfx.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = sfx.ctx = new AC(), out = sfx.out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
  const buf = sfx.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const loop = (type, freq, q, gain) => { const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = gain; n.connect(f); f.connect(g); g.connect(out); n.start(); return g; };
  loop('lowpass', 320, 0.5, 0.11);                 // the city: a constant low rumble
  loop('bandpass', 1500, 0.4, 0.012);              // distant hiss of the streets
  sfx.traffic = loop('bandpass', 260, 0.8, 0);     // nearby cars; loudness follows how close and fast they are
  ctx.resume();
}
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown']) window.addEventListener(ev, startSound, { passive: true });
function footstep(loud) { // a short scuff and a soft thud
  const ctx = sfx.ctx; if (!ctx || ctx.state !== 'running') return; const t = ctx.currentTime;
  const n = ctx.createBufferSource(); n.buffer = sfx.noise; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700 + Math.random() * 500; f.Q.value = 1.2;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16 * loud, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  n.connect(f); f.connect(g); g.connect(sfx.out); n.start(t, Math.random() * 1.5, 0.1);
  const o = ctx.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.07);
  const og = ctx.createGain(); og.gain.setValueAtTime(0.2 * loud, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o.connect(og); og.connect(sfx.out); o.start(t); o.stop(t + 0.09);
}
function horn(loud) {
  const ctx = sfx.ctx; if (!ctx || ctx.state !== 'running' || ctx.currentTime < sfx.hornAt) return; const t = ctx.currentTime; sfx.hornAt = t + 5;
  for (const [fr, at] of [[415, 0], [520, 0], [415, 0.32], [520, 0.32]]) {
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = fr; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1600;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(0.07 * loud, t + at + 0.02); g.gain.setValueAtTime(0.07 * loud, t + at + 0.2); g.gain.linearRampToValueAtTime(0, t + at + 0.25);
    o.connect(f); f.connect(g); g.connect(sfx.out); o.start(t + at); o.stop(t + at + 0.27);
  }
}
function updateSound(dt) {
  if (!sfx.ctx || sfx.ctx.state !== 'running') return;
  if (hero.speed > 0.4) { // one footstep per stride length covered
    sfx.phase += hero.speed * dt / (hero.speed > 2.5 ? 1.7 : 0.78);
    if (sfx.phase >= 1) { sfx.phase -= 1; footstep(hero.speed > 2.5 ? 1 : 0.7); }
  } else sfx.phase = 0.6;
  let near = 0; for (const c of cars) { const [x, z] = carPos(c), d2 = (x - hero.x) ** 2 + (z - hero.z) ** 2; near += (0.25 + c.v / 9) / (1 + d2 / 90); }
  sfx.traffic.gain.setTargetAtTime(Math.min(0.3, near * 0.11), sfx.ctx.currentTime, 0.15);
}

/* ---------------- traffic lights ---------------- */
// Every junction has a light for each of its four approaches. The lights run on one shared
// clock: the roads along z get green, then amber, then everything is red for a moment, then
// the roads along x get their turn.
const CYCLE = 26, lampOn = ['#ff2a1f', '#ffb21f', '#22e06a'], lampOff = ['#3a0d0a', '#3a2a08', '#0a3018'];
const LAMPS = { z: lampOn.map((c) => new THREE.MeshBasicMaterial({ color: c })), x: lampOn.map((c) => new THREE.MeshBasicMaterial({ color: c })) };
function signal(axis) { // 0 red, 1 amber, 2 green
  const t = (performance.now() / 1000 + (axis === 'x' ? CYCLE / 2 : 0)) % CYCLE;
  return t < 10 ? 2 : t < 12 ? 1 : 0;
}
function updateSignals() { for (const ax of ['z', 'x']) { const st = signal(ax); LAMPS[ax].forEach((m, i) => m.color.set(i === st ? lampOn[i] : lampOff[i])); } }
function trafficLight(B, x, z, yaw, axis) { // post, hooded head and three lamps facing the traffic it controls
  B.frame.makeRotationY(yaw).setPosition(x, 0.28, z);
  B.add(T.taper, '#2b2f33', M(0, 0.2, 0, 0.4, 0.4, 0.4)); B.add(T.cyl, '#3b4146', M(0, 1.9, 0, 0.14, 3.4, 0.14));
  B.box('#16181a', 0.42, 1.2, 0.3, 0, 4.1, 0); B.box('#f2c12e', 0.5, 1.3, 0.04, 0, 4.1, -0.17);                 // head with a yellow backing board
  LAMPS[axis].forEach((m, i) => { B.add(T.cyl, m, M(0, 4.48 - i * 0.38, 0.16, 0.26, 0.04, 0.26, Math.PI / 2, 0, 0)); B.box('#16181a', 0.32, 0.04, 0.16, 0, 4.63 - i * 0.38, 0.22); });
  B.frame.identity();
}

/* ---------------- traffic ---------------- */
// Cars from "Generic passenger car pack" by Comrade1280 (CC Attribution 4.0).
// They drive on the right, two lanes each way, along the main roads. They keep
// their distance, give way at junctions and stop for anyone standing in the road.
const carKinds = [], cars = [], CAR_MAX = 36, LANES = [1.65, 4.75];
new GLTFLoader().parse(carsGlb.buffer.slice(carsGlb.byteOffset, carsGlb.byteOffset + carsGlb.byteLength), '', (gltf) => {
  const root = gltf.scene, bodies = [], wheels = [], box = new THREE.Box3(), wb = new THREE.Box3(), c = new THREE.Vector3(), size = new THREE.Vector3(), ctr = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.isMesh || !o.children.some((k) => k.isMesh)) return; if (/wheel/i.test(o.name)) wheels.push(o); else if (/body/i.test(o.name)) bodies.push(o); });
  const matOf = new Map(), light = (m) => { // simple, cheap materials: paint and lights keep their texture, glass is dark
    if (!matOf.has(m)) matOf.set(m, /glass/i.test(m.name) ? new THREE.MeshLambertMaterial({ color: '#1b2530' }) : Object.assign(new THREE.MeshLambertMaterial({ map: m.map, color: m.map ? '#ffffff' : m.color }), { name: m.name }));
    return matOf.get(m);
  };
  const made = [], v3 = new THREE.Vector3();
  const turn = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)]; // a point as seen after turning by a about the vertical
  for (const b of bodies) { // the pack is one file with the cars parked at angles: square each car up, then match it with the wheels under it
    const pts = [];
    b.traverse((o) => { if (!o.isMesh) return; const pa = o.geometry.attributes.position; for (let q = 0; q < pa.count; q += 3) { v3.fromBufferAttribute(pa, q).applyMatrix4(o.matrixWorld); pts.push(v3.x, v3.z); } });
    let best = 0, area = Infinity, ext = null;
    for (let a = 0; a < Math.PI / 2; a += Math.PI / 180) { // the angle at which its footprint is smallest is the car's own direction
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let q = 0; q < pts.length; q += 2) { const [x, z] = turn(pts[q], pts[q + 1], a); if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      if ((x1 - x0) * (z1 - z0) < area) { area = (x1 - x0) * (z1 - z0); best = a; ext = [x0, x1, z0, z1]; }
    }
    const [x0, x1, z0, z1] = ext, mx = (x1 - x0) * 0.1, mz = (z1 - z0) * 0.1;
    const mine = wheels.filter((w) => { wb.setFromObject(w).getCenter(c); const [x, z] = turn(c.x, c.z, best); return x > x0 - mx && x < x1 + mx && z > z0 - mz && z < z1 + mz; });
    const holder = new THREE.Group(); holder.rotation.y = best;
    const bring = (src, at) => { const q = src.clone(); src.matrixWorld.decompose(q.position, q.quaternion, q.scale); if (at) q.position.sub(at); q.traverse((o) => { if (o.isMesh) o.material = light(o.material); }); return q; };
    holder.add(bring(b));
    let rad = 0.3;
    for (const w of mine) { wb.setFromObject(w).getCenter(c); rad = (wb.max.y - wb.min.y) / 2; const pivot = new THREE.Group(); pivot.name = 'wheel'; pivot.position.copy(c); pivot.add(bring(w, c)); holder.add(pivot); }
    holder.updateMatrixWorld(true); box.setFromObject(holder); box.getSize(size); box.getCenter(ctr);
    holder.position.set(-ctr.x, -box.min.y, -ctr.z); // stand it on the ground, centred
    const inner = new THREE.Group(); inner.add(holder);
    // which of the body's own modelling axes ends up pointing along the car's length (used to tell front from back)
    const e = b.matrixWorld.elements, yaw = best + (size.x > size.z ? -Math.PI / 2 : 0); let sig = null, top = 0;
    for (let ax = 0; ax < 3; ax++) { const n = Math.hypot(e[ax * 4], e[ax * 4 + 1], e[ax * 4 + 2]), fz = turn(e[ax * 4] / n, e[ax * 4 + 2] / n, yaw)[1]; if (Math.abs(fz) > Math.abs(top)) { top = fz; sig = { ax, sign: Math.sign(fz) }; } }
    made.push({ name: b.name, best, inner, len: Math.max(size.x, size.z), wid: Math.min(size.x, size.z), alongX: size.x > size.z, rad, wheels: mine.length, sig });
  }
  const sedan = made.find((m) => /sedan/i.test(m.name)) || made[0], k = 4.7 / sedan.len; // one scale for all, so they keep their relative sizes
  for (const m of made) {
    if (m.wid * k > 2.7 || m.wheels !== 4) continue; // skip anything that did not square up into a normal car
    m.inner.scale.setScalar(k); m.inner.rotation.y = (m.alongX ? -Math.PI / 2 : 0) + (m.sig.sign > 0 ? Math.PI : 0); // length along +z, bonnet first (the pack models every car nose-down its own -y axis)
    const tpl = new THREE.Group(); tpl.add(m.inner);
    const paints = []; m.inner.traverse((o) => { if (o.isMesh && /^body/i.test(o.material.name) && !paints.length) for (const t of ['#ffffff', '#d9d9d9', '#b7c2cf', '#e3d3a4', '#a9b0b8', '#d6b9b0', '#f2c12e']) paints.push(Object.assign(o.material.clone(), { color: new THREE.Color(t), name: o.material.name })); });
    const th = (m.alongX ? -Math.PI / 2 : 0) + (m.sig.sign > 0 ? Math.PI : 0), ap = turn(1, 0, -th), al = turn(ap[0], ap[1], -m.best); // the axle (the car's own left-right line) as the wheels see it
    carKinds.push({ axleVec: new THREE.Vector3(al[0], 0, al[1]).normalize(), name: m.name, sig: m.sig, tpl, paints, half: m.len * k / 2, halfW: m.wid * k / 2, rad: m.rad * k, axle: m.alongX ? 'z' : 'x' });
  }
}, (e) => console.error('cars failed to load', e));
const carPos = (c) => (c.axis === 'z' ? [c.line * PITCH + F - c.dir * c.lane, c.s] : [c.s, c.line * PITCH + F + c.dir * c.lane]); // keep right
function spawnCar() {
  const axis = Math.random() < 0.5 ? 'z' : 'x', hi = Math.floor(hero.x / PITCH), hj = Math.floor(hero.z / PITCH), along = axis === 'z' ? hero.z : hero.x;
  const c = { axis, line: (axis === 'z' ? hi : hj) + Math.floor(Math.random() * 4) - 1, dir: Math.random() < 0.5 ? 1 : -1, lane: LANES[Math.floor(Math.random() * 2)], s: along + (Math.random() * 2 - 1) * 120, v: 0, vmax: 6.5 + Math.random() * 4.5 };
  const [x, z] = carPos(c), off = c.s - Math.floor(c.s / PITCH) * PITCH;
  if (Math.hypot(x - hero.x, z - hero.z) < 38 || off < RW + 4) return;                                                   // not right beside you, not inside a junction
  if (cars.some((o) => o.axis === c.axis && o.line === c.line && o.dir === c.dir && o.lane === c.lane && Math.abs(o.s - c.s) < 11)) return;
  const kind = carKinds[Math.floor(Math.random() * carKinds.length)], paint = kind.paints[Math.floor(Math.random() * kind.paints.length)];
  c.kind = kind; c.obj = kind.tpl.clone(true); c.wheels = [];
  c.obj.traverse((o) => { if (o.name === 'wheel') c.wheels.push(o); if (o.isMesh && paint && /^body/i.test(o.material.name)) o.material = paint; });
  c.v = c.vmax; c.obj.rotation.y = c.axis === 'z' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  scene.add(c.obj); cars.push(c);
}
function updateTraffic(dt) {
  if (!carKinds.length) return;
  for (let n = 0; n < 5 && cars.length < CAR_MAX; n++) spawnCar();
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i], half = c.kind.half, [x, z] = carPos(c);
    const far = Math.hypot(x - hero.x, z - hero.z); if (far > 140) { scene.remove(c.obj); cars.splice(i, 1); continue; } // left the area
    c.obj.visible = far < 110;
    let want = c.vmax;
    for (const o of cars) { // the car in front, in the same lane
      if (o === c || o.axis !== c.axis || o.line !== c.line || o.dir !== c.dir || o.lane !== c.lane) continue;
      const gap = (o.s - c.s) * c.dir - half - o.kind.half;
      if (gap > -1 && gap < 16) want = Math.min(want, gap < 3.5 ? 0 : o.v + (gap - 3.5) * 0.7);
    }
    // the junction ahead: give way to cars already crossing it, and cars on the road along x give way to the road along z
    const k = Math.floor(c.s / PITCH), off = c.s - k * PITCH, inside = off > -half && off < RW + half;
    if (!inside) {
      const kb = c.dir > 0 ? k + 1 : k, dist = c.dir > 0 ? kb * PITCH - c.s - half : c.s - half - (kb * PITCH + RW);
      const st = signal(c.axis);
      if (st === 2) c.through = kb; else if (c.through === kb && dist > c.v * 0.8 + 0.5) c.through = null; // when the light changes, only a car about to cross anyway carries on
      if (dist < 16 && st !== 2 && c.through !== kb) want = Math.min(want, Math.max(0, (dist - 1.2) * 1.2)); // red or amber: pull up at the line
      else if (dist < 11) { // green: still wait for anything left crossing the junction
        const mid = c.line * PITCH + F;
        if (cars.some((o) => o.axis !== c.axis && o.line === kb && Math.abs(o.s - mid) < F + o.kind.half + 1)) want = Math.min(want, dist > 0.6 ? Math.max(0, (dist - 0.6) * 1.2) : want);
      }
    }
    const ha = (c.axis === 'z' ? hero.z - z : hero.x - x) * c.dir - half, hl = Math.abs(c.axis === 'z' ? hero.x - x : hero.z - z); // you, standing in the lane
    if (ha > -1 && ha < 14 && hl < c.kind.halfW + 0.9) { want = Math.min(want, Math.max(0, (ha - 2.5) * 1.3)); c.held = c.v < 0.3 ? (c.held || 0) + dt : 0; if (c.held > 2) { horn(1); c.held = 0; } } // a driver you keep waiting sounds the horn
    c.v += clamp(want - c.v, -11 * dt, 3.2 * dt);
    c.s += c.dir * c.v * dt;
    const [nx, nz] = carPos(c); c.obj.position.set(nx, 0, nz);
    for (const w of c.wheels) w.rotateOnAxis(c.kind.axleVec, c.v * dt / c.kind.rad); // roll forwards about the axle, so the wheels do not wobble
  }
}
function pushOffCars() { // cars are solid: step round them
  for (const c of cars) {
    const [x, z] = carPos(c), a = c.axis === 'z' ? hero.z - z : hero.x - x, l = c.axis === 'z' ? hero.x - x : hero.z - z, pa = c.kind.half + 0.35 - Math.abs(a), pl = c.kind.halfW + 0.35 - Math.abs(l);
    if (pa <= 0 || pl <= 0) continue;
    const da = pa < pl ? Math.sign(a || 1) * pa : 0, dl = pa < pl ? 0 : Math.sign(l || 1) * pl;
    if (c.axis === 'z') { hero.z += da; hero.x += dl; } else { hero.x += da; hero.z += dl; }
  }
}

/* ---------------- the endless city grid ---------------- */
// The city is a grid of square blocks that goes on for ever in every
// direction. Tarred main roads run between the blocks and cross at junctions.
// Every block has an interlock inner street running right through it from one
// main road to the one on the far side, so no road is a dead end.
// Cell (i, j) covers one junction, one road along z, one road along x and one block.
const BLOCK = 72, RW = 2 * F, PITCH = BLOCK + RW, MID = BLOCK / 2, VIEW = 150;
const cells = new Map(), zones = [], jobs = [];
const hash2 = (i, j, k) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const laneDir = (i, j) => (hash2(i, j, 1) < 0.5 ? 'z' : 'x');                                             // which way the inner street crosses block (i, j)
const districtAt = (i, j) => DISTRICTS[Math.floor(hash2(Math.floor(i / 2), Math.floor(j / 2), 2) * DISTRICTS.length)]; // districts come in clusters of 2 x 2 blocks
function disposeGroup(g) { g.traverse((o) => { if (o.userData.own && o.geometry) o.geometry.dispose(); }); scene.remove(g); }
function drawCross(B) { // junction: tarred square, sidewalk corners with painted kerbs, zebra crossings on all four sides
  B.box(ROAD_C, 2 * F, 0.1, 2 * F, 0, -0.05, -F);
  for (const sx of [-1, 1]) for (const far of [0, 1]) {
    const zc = far ? -2 * F + 1.8 : -1.8, zin = far ? -2 * F + 3.72 : -3.72;
    B.box(WALK_C, 3.6, 0.28, 3.6, sx * 9, 0.14, zc); B.box('#f2c12e', 0.25, 0.32, 3.6, sx * 7.08, 0.16, zc); B.box('#141414', 3.85, 0.32, 0.25, sx * 8.88, 0.16, zin);
  }
  for (let x = -ROAD_HALF + 0.9; x < ROAD_HALF - 0.5; x += 1.15) {
    B.box('#f2f2f2', 0.6, 0.02, 2.6, x, 0.012, -1.8); B.box('#f2f2f2', 0.6, 0.02, 2.6, x, 0.012, -2 * F + 1.8);
    for (const sx of [-1, 1]) B.box('#f2f2f2', 2.6, 0.02, 0.6, sx * (F - 1.8), 0.012, -F + x);
  }
}
function addZone(cell, grp, pc, B, o) { // a stretch of street that walkers use
  grp.updateMatrix(); pt(pc, pc.L / 2, 0, 0, _v2).applyMatrix4(grp.matrix);
  const z = { pc, g: grp, grp, inv: grp.matrix.clone().invert(), obst: B.obstacles, obstTU: B.obstacles.map((q) => ({ ...tuOf(pc, q.x, q.z, {}), r: q.r })), junction: false, lanePieces: [], cx: _v2.x, cz: _v2.z, pop: false, ...o };
  zones.push(z); cell.zones.push(z);
}
function buildCell(cell, part) {
  const { i, j } = cell, X = i * PITCH, Z = j * PITCH, D = districtAt(i, j), g = new THREE.Group(), B = new Batch(), seed = Math.floor(hash2(i, j, 10 + part) * 1e9), r = rng(seed), pc = straightPath(BLOCK);
  if (part === 0) {
    drawCross(B); g.position.set(X + F, 0, Z + RW);
    trafficLight(B, -7.75, -2 * F + 0.55, Math.PI, 'z'); trafficLight(B, 7.75, -0.55, 0, 'z');                       // for the road along z, on the driver's right as they arrive
    trafficLight(B, -F + 0.55, -3.05, -Math.PI / 2, 'x'); trafficLight(B, F - 0.55, -2 * F + 3.05, Math.PI / 2, 'x'); // for the road along x
    const nz = NAMES_Z[wrap(i, NAMES_Z.length)], nx = NAMES_X[wrap(j, NAMES_X.length)]; // the two streets that cross here
    streetSign(B, 7.95, -2.95, [{ name: nz, dx: 0, dz: 1, y: 3.62 }, { name: nx, dx: 1, dz: 0, y: 3.2 }]);
    streetSign(B, -7.95, -2 * F + 2.95, [{ name: nz, dx: 0, dz: -1, y: 3.62 }, { name: nx, dx: -1, dz: 0, y: 3.2 }]);
  }
  else if (part === 1 || part === 2) { // 1 = the road along z, 2 = the road along x; inner streets open onto them halfway along
    const slots = [], want = part === 1 ? 'x' : 'z';
    if (laneDir(i, j) === want) slots.push({ t0: MID, side: 1 });
    if (laneDir(part === 1 ? i - 1 : i, part === 1 ? j : j - 1) === want) slots.push({ t0: MID, side: -1 });
    if (part === 1) g.position.set(X + F, 0, Z + PITCH); else { g.position.set(X + RW, 0, Z + F); g.rotation.y = -Math.PI / 2; }
    // corner plots belong to the buildings on the road along x, so the road along z starts its buildings a little way in
    buildRoad(g, B, pc, r, D, { slots, wide: true, lotStart: part === 1 ? 14.6 : 0, lotEnd: part === 1 ? 14.6 : 0, numBase: wrap(part === 1 ? j : i, 40) * 24, numRev: part === 1 }); // numbers carry on along the street from block to block
    if (part === 1) for (const s of [-1, 1]) for (const z of [-7.3, -BLOCK + 7.3]) B.box('#d8d0bc', 0.2, 2.3, 14.4, s * (F + 0.12), 1.15, z); // wall along the side of each corner plot
    addZone(cell, g, pc, B, { lo: 7.85, hi: 10.45, y: 0.28, crowd: 4, seed });
  } else { // the inner street through this block
    if (laneDir(i, j) === 'z') { g.position.set(X + RW + MID, 0, Z + RW); g.rotation.y = Math.PI; } else { g.position.set(X + RW, 0, Z + RW + MID); g.rotation.y = -Math.PI / 2; }
    const nm = NAMES_IN[Math.floor(hash2(i, j, 5) * NAMES_IN.length)] + ' ' + KINDS_IN[Math.floor(hash2(i, j, 6) * KINDS_IN.length)];
    buildLane(g, B, r);
    streetSign(B, LANE_HALF + 0.7, 1.0, [{ name: nm, dx: 0, dz: -1, y: 2.75 }], 3.2); streetSign(B, -LANE_HALF - 0.7, -BLOCK - 1.0, [{ name: nm, dx: 0, dz: 1, y: 2.75 }], 3.2); // its name at both ends
    addZone(cell, g, pc, B, { lo: 0.45, hi: LANE_HALF - 0.75, y: LANE_Y, crowd: 3, seed, obst: [], obstTU: [] });
  }
  B.build(g); g.updateMatrix(); scene.add(g); cell.groups.push(g);
}
const cellDist = (i, j) => Math.hypot(Math.max(i * PITCH - hero.x, 0, hero.x - (i + 1) * PITCH), Math.max(j * PITCH - hero.z, 0, hero.z - (j + 1) * PITCH));
function updateCells() { // build the city around you as you move, and let go of what is far behind
  const ci = Math.floor(hero.x / PITCH), cj = Math.floor(hero.z / PITCH);
  for (let i = ci - 2; i <= ci + 2; i++) for (let j = cj - 2; j <= cj + 2; j++) {
    const k = i + ',' + j; if (cells.has(k) || cellDist(i, j) > VIEW) continue;
    const cell = { i, j, groups: [], zones: [], dead: false }; cells.set(k, cell);
    for (let part = 0; part < 4; part++) jobs.push({ cell, part });
  }
  for (const job of jobs) job.d = cellDist(job.cell.i, job.cell.j);
  jobs.sort((a, b) => a.d - b.d);
  let n = 0; while (jobs.length && (n++ < 1 || jobs[0].d < 30)) { const job = jobs.shift(); if (!job.cell.dead) buildCell(job.cell, job.part); } // nearest first; anything right beside you at once
  for (const [k, cell] of cells) if (cellDist(cell.i, cell.j) > VIEW + 45) {
    cell.dead = true; cells.delete(k);
    for (const g of cell.groups) disposeGroup(g);
    for (const z of cell.zones) { dropPeople(z); zones.splice(zones.indexOf(z), 1); }
  }
  let budget = 1; // walkers appear on streets near you and leave the ones you have left behind
  for (const z of zones) {
    const d2 = (z.cx - hero.x) ** 2 + (z.cz - hero.z) ** 2;
    if (!z.pop && d2 < 85 * 85 && budget && kinds.length === KINDS) { populate(z); z.pop = true; budget--; }
    else if (z.pop && d2 > 112 * 112) { dropPeople(z); z.pop = false; }
  }
}

/* ---------------- where you can walk ---------------- */
// Every main road, junction and inner street is open. Only buildings, walls
// and fences (the edges of the streets) and solid objects stop you.
function locate(x, z, lim, slack = 0) {
  const ci = Math.floor(x / PITCH), cj = Math.floor(z / PITCH), lx = x - ci * PITCH, lz = z - cj * PITCH, inZ = lx < RW, inX = lz < RW, half = LANE_HALF - 0.45;
  if (inZ && inX) return { y: Math.abs(lx - F) > ROAD_HALF + GUTTER_W && Math.abs(lz - F) > ROAD_HALF + GUTTER_W ? 0.28 : 0 }; // junction
  if (inZ || inX) { // main road: u = metres from its centre line, t = metres along the block
    const u = (inZ ? lx : lz) - F, t = (inZ ? lz : lx) - RW;
    if (Math.abs(u) <= lim) return { y: Math.abs(u) > ROAD_HALF + GUTTER_W ? 0.28 : 0 };
    const bi = inZ ? (u > 0 ? ci : ci - 1) : ci, bj = inZ ? cj : (u > 0 ? cj : cj - 1);            // the block on that side of the road
    if (laneDir(bi, bj) === (inZ ? 'x' : 'z') && Math.abs(t - MID) <= half) return { y: 0.28 };   // the mouth of its inner street
    return null;
  }
  const bx = lx - RW, bz = lz - RW, along = laneDir(ci, cj) === 'z', off = Math.abs((along ? bx : bz) - MID), q = along ? bz : bx; // inside a block: only its inner street
  if (off <= half + (slack && q > 15 && q < BLOCK - 15 ? 2.6 : 0)) return { y: LANE_Y, over: off > half };                         // the camera (slack) may float out over the front yards
  return null;
}

/* ---------------- player ---------------- */
// The main character: a young man in a dark zip jacket over a white T-shirt, blue
// jeans and white trainers. Push the stick to walk, push it all the way to run.
const hero = { obj: new THREE.Group(), x: 0, z: 0, y: 0.28, heading: Math.PI, speed: 0, mixer: null, acts: null, stride: 1.75, w: [1, 0, 0], placed: false, dist: 0 };
scene.add(hero.obj);
// (the main character is set up with the walkers, from the same realistic models)


/* ---------------- input: joystick to walk, drag to look ---------------- */
const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 }, keys = {};
let camYaw = Math.PI, camPitch = 0.18;
const canvas = renderer.domElement, joyEl = document.getElementById('joy'), knobEl = document.getElementById('knob');
function placeJoy(x, y, kx, ky) { joyEl.style.left = x + 'px'; joyEl.style.top = y + 'px'; knobEl.style.transform = `translate(${kx}px, ${ky}px)`; }
function restJoy() { joyEl.classList.remove('on'); placeJoy(66, window.innerHeight - 96, 0, 0); }
restJoy(); window.addEventListener('resize', restJoy);
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  if (joy.id === null && e.clientX < window.innerWidth * 0.5 && e.clientY > window.innerHeight * 0.4) { // left thumb: walk
    joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joyEl.classList.add('on'); placeJoy(joy.ox, joy.oy, 0, 0);
  } else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }   // anywhere else: look around
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === joy.id) {
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy), R = 36;
    if (d > R) { dx *= R / d; dy *= R / d; }
    joy.x = dx / R; joy.y = -dy / R; placeJoy(joy.ox, joy.oy, dx, dy);
  } else if (e.pointerId === look.id) {
    camYaw -= (e.clientX - look.x) * 0.006; camPitch = clamp(camPitch + (e.clientY - look.y) * 0.004, 0.02, 0.9);
    look.x = e.clientX; look.y = e.clientY;
  }
});
const endTouch = (e) => {
  if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; restJoy(); }
  if (e.pointerId === look.id) look.id = null;
};
canvas.addEventListener('pointerup', endTouch); canvas.addEventListener('pointercancel', endTouch);
window.addEventListener('keydown', (e) => { keys[e.code] = 1; }); window.addEventListener('keyup', (e) => { keys[e.code] = 0; });
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/* ---------------- main loop ---------------- */
const clock = new THREE.Clock(), camGoal = new THREE.Vector3(), camAim = new THREE.Vector3();
let camReady = false;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!hero.placed) { hero.x = RW + 10; hero.z = F + 5.6; hero.heading = camYaw = Math.PI / 2; hero.placed = true; } // start on a main road
  updateCells();

  // walk: the stick is relative to where the camera looks
  let mx = joy.x + (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = joy.y + (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const mag = Math.min(1, Math.hypot(mx, my)), fx = Math.sin(camYaw), fz = Math.cos(camYaw);
  let speed = 0;
  if (mag > 0.1) {
    const run = mag > 0.85 && (joy.id !== null || keys.ShiftLeft || keys.ShiftRight); // stick pushed right to the edge: run
    speed = run ? 5.2 : 1.75 * Math.min(1, mag / 0.8);
    let dx = fx * my - fz * mx, dz = fz * my + fx * mx; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
    hero.heading += angDiff(Math.atan2(dx, dz), hero.heading) * Math.min(1, dt * 9);
    const nx = hero.x + dx * speed * dt, nz = hero.z + dz * speed * dt, lim = F - 0.45, ox = hero.x, oz = hero.z;
    if (locate(nx, nz, lim)) { hero.x = nx; hero.z = nz; }            // free to go
    else if (locate(nx, hero.z, lim)) hero.x = nx;                    // slide along a wall
    else if (locate(hero.x, nz, lim)) hero.z = nz;
    else speed = 0;
    pushOut(); pushOffCars();                                         // step round trees, poles, stalls, people and cars
    if (!locate(hero.x, hero.z, lim)) { hero.x = ox; hero.z = oz; speed = 0; }
    if (look.id === null) camYaw += angDiff(hero.heading, camYaw) * Math.min(1, dt * 1.3); // camera swings round behind you
  }
  hero.speed += (speed - hero.speed) * Math.min(1, dt * 8);
  const here = locate(hero.x, hero.z, F);
  if (here) { hero.y += (here.y - hero.y) * Math.min(1, dt * 12); }
  hero.obj.position.set(hero.x, hero.y, hero.z); hero.obj.rotation.y = hero.heading;
  if (hero.mixer) { // blend idle, walk and run by speed
    const v = hero.speed, goal = [v < 0.15 ? 1 : 0, v >= 0.15 && v < 2.5 ? 1 : 0, v >= 2.5 ? 1 : 0];
    for (let i = 0; i < 3; i++) { hero.w[i] += (goal[i] - hero.w[i]) * Math.min(1, dt * 7); hero.acts[i].setEffectiveWeight(hero.w[i]); }
    hero.acts[1].timeScale = clamp(v / hero.stride, 0.5, 1.5); hero.acts[2].timeScale = clamp(v / 5.2, 0.75, 1.15);
    hero.mixer.update(dt);
  }

  // camera follows from behind and above; it pulls in rather than pass through a building
  const cfx = Math.sin(camYaw), cfz = Math.cos(camYaw), cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  for (const d of [5.4, 4.2, 3.2, 2.4, 1.6, 1.0, 0.55]) {
    camGoal.set(hero.x - cfx * d * cp, hero.y + 1.7 + d * sp, hero.z - cfz * d * cp); // low enough to stay under shop awnings
    const spot = locate(camGoal.x, camGoal.z, F - 0.15, 0.6);
    if (spot) { if (spot.over) camGoal.y += 1.8; break; } // over a front yard: rise clear of the fence
  }
  if (!camReady) { camera.position.copy(camGoal); camReady = true; } else camera.position.lerp(camGoal, Math.min(1, dt * 10));
  camAim.set(hero.x, hero.y + 1.75, hero.z); camera.lookAt(camAim);

  groundMesh.position.x = hero.x; groundMesh.position.z = hero.z;
  sky.position.set(camera.position.x, -20, camera.position.z); skyU.value = performance.now() / 1000;
  sun.position.set(hero.x + 60, 110, hero.z + 45); sun.target.position.set(hero.x, 0, hero.z);
  updatePeople(dt, camera.position);
  updateSignals(); updateTraffic(dt); updateSound(dt);
  windU.value = performance.now() / 1000;
  renderer.render(scene, camera);
}
function loop() { frame(); requestAnimationFrame(loop); }
if (location.hash.includes('dbg')) window.__dbg = { sfx, signal, THREE, SkeletonUtils, scene, kinds, hero, people, cars, carKinds, zones, cells, jobs, camera, renderer, locate, PITCH, RW, F, MID, laneDir, frame, step: (dt) => updatePeople(dt, camera.position), look: (y) => { camYaw = y; hero.heading = y; } }; // testing only
requestAnimationFrame(loop);
