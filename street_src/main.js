// Blocktown — endless city streets (Three.js r187)
// The road is a chain of pieces: straights, curves and junctions (crossroads,
// T-junctions and corners). Each piece has a path; the camera follows the chain
// and new pieces are generated ahead while old ones are removed behind, so the
// streets never end. Everything is solid geometry, merged per piece into one
// mesh per material to stay fast on phones.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { CONFIG } from './config.js';
import * as logic from './logic.js';
import carsGlb from './models/cars.glb';
import rideScooterGlb from './models/ride_scooter.glb';
import cop1Glb from './models/cop1.glb';
import cop2Glb from './models/cop2.glb';
import cop3Glb from './models/cop3.glb';
import agb1Glb from './models/agb1.glb';
import agb2Glb from './models/agb2.glb';
import bizmanGlb from './models/bizman.glb';
import claudiaGlb from './models/claudia.glb';
import nathanGlb from './models/nathan.glb';
import ericGlb from './models/eric.glb';
import sophiaGlb from './models/sophia.glb';
import carlaGlb from './models/carla.glb';
import mikeGlb from './models/mike.glb';
import zoeGlb from './models/zoe.glb';
import roxyGlb from './models/roxy.glb';
import mayaGlb from './models/maya.glb';
import leoGlb from './models/leo.glb';
import mixamoAnimsGlb from './models/mixamo_anims.glb';
import tPalm from './models/t_palm.glb';
import tTree from './models/t_tree.glb';
import tTree2 from './models/t_tree2.glb';
import sShrub from './models/s_shrub.glb';
import sBush from './models/s_bush.glb';
import sFern from './models/s_fern.glb';
import sTrop from './models/s_trop.glb';
import sFlower from './models/s_flower.glb';
import bld1 from './models/b_1.glb';
import bld2 from './models/b_2.glb';
import bld3 from './models/b_3.glb';
import bld4 from './models/b_4.glb';
import bld5 from './models/b_5.glb';
import bld6 from './models/b_6.glb';
import bld7 from './models/b_7.glb';
import bld8 from './models/b_8.glb';
import bld9 from './models/b_9.glb';
import bld10 from './models/b_10.glb';
import bld11 from './models/b_11.glb';
import vGate from './models/v_gate.glb';
import vGate2 from './models/v_gate2.glb';
import vGate3 from './models/v_gate3.glb';
import wWindow from './models/w_window.glb';
import sBench from './models/s_bench.glb';
import sBusStop from './models/s_busstop.glb';
import sPatio from './models/s_patio.glb';
import stMarket from './models/st_market.glb';
import fSofa from './models/f_sofa.glb';
import fBed from './models/f_bed.glb';
import fDining from './models/f_dining.glb';
import fFridge from './models/f_fridge.glb';
import fCoffee from './models/f_coffee.glb';
import fTv from './models/f_tv.glb';
import fStand from './models/f_stand.glb';
import fLamp from './models/f_lamp.glb';
import fArt from './models/f_art.glb';
import fPlant from './models/f_plant.glb';
import { GLYPHS } from './glyphs.js';
import { FLAT_ICONS } from './flat-icons.js';
import { ART_ICONS } from './art-icons.js';
import { RIDE_ART } from './ride-art.js';
import fToilet from './models/f_toilet.glb';
import fSink from './models/f_sink.glb';
import fShower from './models/f_shower.glb';
import fChandelier from './models/f_chandelier.glb';
import fDoor from './models/f_door.glb';
import fCurtain from './models/f_curtain.glb';
import fWallLight from './models/f_walllight.glb';
import packHike from './models/pack_hike.glb';
import packTravel from './models/pack_travel.glb';
import packBlue from './models/pack_blue.glb';
import packYellow from './models/pack_yellow.glb';
import packWhite from './models/pack_white.glb';
import packBlack from './models/pack_black.glb';
// Photographed surfaces and sky from Poly Haven (CC0), shrunk to stay light: see textures/CREDITS.txt
import skyJpg from './textures/sky.jpg';
import brickRedJpg from './textures/brick_red.jpg';
import brickDarkJpg from './textures/brick_dark.jpg';
import brickTanJpg from './textures/brick_tan.jpg';
import stoneJpg from './textures/stone.jpg';
import plasterJpg from './textures/plaster.jpg';
import asphaltJpg from './textures/asphalt.jpg';
import pavingJpg from './textures/paving.jpg';
import floorWoodJpg from './textures/floor_wood.jpg';
import wallPaintJpg from './textures/wall_paint.jpg';
import rugWoolJpg from './textures/rug_wool.jpg';

/* ---------------- the curve of the world ---------------- */
// The ground falls gently away with distance, like the curve of a hill, so a long straight street runs over a brow and out
// of sight instead of fading into haze. It is done where every shape is drawn: each point is lowered by the square of its
// distance from the eye. Shadows (which are worked out from the sun) and the far skyline are left alone.
const CURVE_K = 0.00042, CURVE_GLSL = `mvPosition.xyz -= viewMatrix[1].xyz * (${'0.00042'} * dot(mvPosition.xyz, mvPosition.xyz));`;
THREE.ShaderChunk.project_vertex += `
#if !defined(DEPTH_PACKING) && !defined(NO_CURVE)
  ${CURVE_GLSL}
  gl_Position = projectionMatrix * mvPosition;
#endif
`;
THREE.ShaderLib.sprite.vertexShader = THREE.ShaderLib.sprite.vertexShader.replace('gl_Position = projectionMatrix * mvPosition;', CURVE_GLSL + ' gl_Position = projectionMatrix * mvPosition;');

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
const WIDTHS = { uncompleted: [11, 15], terrace: [9.5, 12], modern: [20, 27], duplex: [14, 19], bungalow: [8, 11], apt: [19, 26], shop: [10.5, 15], office: [20, 27], glass: [22, 30], plot: [6, 10] };

// paint colours seen on Lagos buildings
const PAINT = ['#e8d9a8', '#e3b23c', '#d99a2b', '#d9772b', '#e9b48a', '#b9c9a0', '#d9a39a', '#e9e4d4', '#a9c4d4', '#c9b48a', '#f0e2b6', '#cf8f5a'];
const TRIM = ['#f1ede2', '#f1ede2', '#7a4a2a', '#8c2f1e', '#3f5b4a', '#d8d0bc'];
const CONC = ['#d8d3c6', '#c9c4b8', '#e6e1d6', '#b8b2a6', '#cfc6b2'];
const ACCENT = ['#d9772b', '#b03a2e', '#1f618d', '#c9a227', '#2e7d5b'];
const AWNING = ['#b3261e', '#b3261e', '#1f5fa8', '#1e8449', '#d68910'];
const ROOFS = ['#8a3b2a', '#6e3b2a', '#3f6b5a', '#7b7f85', '#9a4a32'];
const GREENS = ['#235427', '#2c6631', '#37793a', '#479043', '#5aa24c']; // dark (inside) to light (sunlit)
const STEEL = '#8e979c', KERB_C = '#cbc6ba';

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
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; // film-like contrast and soft highlights
// Computers get real sun shadows from buildings, trees, cars and people. Phones keep the cheap look (add #hq to the address to force it).
const HQ = location.hash.includes('hq') || (!matchMedia('(pointer: coarse)').matches && !location.hash.includes('lq'));
// Phones have far less memory: there the street is built a shorter way ahead (hidden by an earlier haze) and planted with fewer small bushes.
const PHONE = !HQ;
// Phones fill the whole screen. Android: the browser's bars are hidden the first time you touch the game (it must be a touch).
// iPhone: Safari cannot do that for a page, so the first time we explain how to add the game to the home screen, where it opens without them.
if (PHONE) {
  const full = () => { const d = document.documentElement, go = d.requestFullscreen || d.webkitRequestFullscreen; if (go && !(document.fullscreenElement || document.webkitFullscreenElement)) { try { const p = go.call(d, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not allowed here */ } } };
  addEventListener('pointerup', full, true);
  const iOS = /iPhone|iPod/.test(navigator.userAgent), alone = navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  let told = false; try { told = localStorage.getItem('hustle-fullhint') === '1'; } catch (e) { /* fine */ }
  if (iOS && !alone && !told) { const el = document.getElementById('fullhint'); setTimeout(() => { el.hidden = false; }, 2500);
    el.querySelector('button').addEventListener('click', () => { el.hidden = true; try { localStorage.setItem('hustle-fullhint', '1'); } catch (e) { /* fine */ } }); }
}
if (HQ) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
const HAZE = 0x86a9d6; // the far distance fades to sky blue, not to white
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = PHONE ? new THREE.Fog(HAZE, 92, 122) : new THREE.Fog(HAZE, 128, 158);
scene.background = new THREE.Color(HAZE);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.15, 700); // a short near limit, so someone brushing past the camera is not sliced away
function fitCamera() {
  const a = window.innerWidth / window.innerHeight;
  camera.aspect = a; camera.fov = a < 1 ? 80 : 62; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', fitCamera); fitCamera();
// Depth shading (computers only). After the picture is drawn, every corner, crease and gap - where a wall meets the floor,
// under a table, between a sofa's cushions, behind a kerb - is darkened a little, the way light really fails to reach
// into such places. It is the main thing that makes a scene read as solid shapes rather than flat coloured surfaces.
let composer = null, aoPass = null;
if (HQ) {
  const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(window.innerWidth, window.innerHeight) });
  renderer.setPixelRatio(1); renderer.setSize(window.innerWidth, window.innerHeight); // the extra passes are paid for per pixel, so the picture is drawn at screen size and its edges smoothed afterwards
  composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  aoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight, { depthTexture: target.depthTexture }); aoPass.blendIntensity = 0.85; // it reads the depth of the picture just drawn, so the scene is not drawn a second time
  const fullSize = aoPass.setSize.bind(aoPass); aoPass.setSize = (w, h) => fullSize(Math.ceil(w * 0.5), Math.ceil(h * 0.5));                       // worked out at half size: soft shading does not need more
  aoPass.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.3, samples: 6, screenSpaceRadius: false });
  aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 6 });
  composer.addPass(aoPass); composer.addPass(new OutputPass()); composer.addPass(new FXAAPass());
  window.addEventListener('resize', () => composer.setSize(window.innerWidth, window.innerHeight));
}
const hemi = new THREE.HemisphereLight(0xcfe4ff, 0xb39a7c, HQ ? 1.25 : 1.45); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe3b8, HQ ? 3.2 : 2.6); // warm, lowish sun: long soft shadows across the street
const SUN_DIR = new THREE.Vector3(0.48, 0.69, 0.55).normalize(); // as high as the sun in the sky photograph
if (HQ) {
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = sc.bottom = -62; sc.right = sc.top = 62; renderer.shadowMap.autoUpdate = false; // shadows are redrawn every third frame (see where the sun follows you), which nobody can see and saves a great deal of work sc.near = 10; sc.far = 420;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
}
scene.add(sun); scene.add(sun.target);
const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 160, 160).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#9a6a4a' }));
groundMesh.position.y = -0.15; groundMesh.receiveShadow = HQ; scene.add(groundMesh);

/* ---------------- sky ---------------- */
// A dome around the camera, drawn by a shader: deep blue overhead, white haze
// at the horizon, heaped cumulus clouds with bright tops and grey-blue shading,
// and thin streaky clouds higher up. The clouds drift and slowly change shape.
const skyU = { value: 0 };
// A bundled photograph is decoded in the background and then swapped into a texture that is already in use.
function photo(bytes, tex) {
  const img = new Image();
  img.onload = () => { tex.dispose(); tex.image = img; tex.needsUpdate = true; URL.revokeObjectURL(img.src); };
  img.src = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
  return tex;
}
function flatTex(css) { // a plain colour to show until the photograph is ready
  const c = document.createElement('canvas'); c.width = c.height = 4; const g = c.getContext('2d'); g.fillStyle = css; g.fillRect(0, 0, 4, 4);
  return new THREE.CanvasTexture(c);
}
function detailTex(bytes) { // a mid-grey photograph of a surface, multiplied over the game's own colours
  const t = flatTex('#808080'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return photo(bytes, t);
}
const SKY_TEX = (() => { const t = flatTex('#7f9fd0'); t.wrapS = THREE.RepeatWrapping; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return photo(skyJpg, t); })();
const NIGHT_SIGNS = []; // shop signboards: lit from inside, brightest at night
const GLOW_BY_DAY = []; // materials that glow a little by day so their shaded sides are not black; at night that glow is turned down
const nightU = { value: 0 }; // 0 by day, 1 at night: it follows the clock of whoever is playing
const SHARED = { uNight: nightU, uTime: skyU, uSky: { value: SKY_TEX }, uPlaster: { value: detailTex(plasterJpg) }, uAsphalt: { value: detailTex(asphaltJpg) }, uPaving: { value: detailTex(pavingJpg) } };
// The sky is a real photograph of a partly cloudy afternoon, wrapped round the dome with its sun where the game's sun is.
// The same function gives the colour of the sky in any direction, so puddles and windows mirror the very same clouds.
const SKY_GLSL = `
  uniform sampler2D uSky; uniform float uNight;
  float sHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  const vec3 SUN = vec3(${SUN_DIR.x.toFixed(4)}, ${SUN_DIR.y.toFixed(4)}, ${SUN_DIR.z.toFixed(4)});
  vec3 skyColor(vec3 d, float uTime){
    vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + ${(0.5944 - Math.atan2(SUN_DIR.z, SUN_DIR.x) / (2 * Math.PI)).toFixed(4)}, asin(clamp(d.y, 0.0, 1.0)) * 0.63661977);
    vec3 col = texture2D(uSky, uv).rgb;
    col = mix(vec3(dot(col, vec3(0.3, 0.6, 0.1))), col, 1.18) * vec3(0.98, 1.0, 1.04);   // a touch richer and bluer
    col = mix(col, vec3(0.525, 0.663, 0.839), 1.0 - smoothstep(0.02, 0.2, d.y));        // pale haze low down, matching the fog
    if (uNight > 0.0) { // at night: the same clouds, dim and blue, over a dark sky with stars
      vec2 sg = d.xz / (d.y + 0.35) * 46.0; float star = step(0.9965, sHash(floor(sg))) * smoothstep(0.12, 0.45, d.y) * (0.6 + 0.4 * sin(uTime * 2.0 + sHash(floor(sg) + 3.0) * 40.0));
      vec3 nightCol = vec3(0.13, 0.17, 0.30) * (0.55 + 0.6 * dot(col, vec3(0.33))) + vec3(1.0, 0.97, 0.9) * star;
      col = mix(col, nightCol, uNight); }
    return col;
  }`;
const sky = (() => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: SHARED, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir; uniform float uTime; ${SKY_GLSL}
      void main(){ vec3 c = skyColor(normalize(vDir), uTime); ${HQ ? 'c = pow(c, vec3(2.2)); c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, 1.4) * 0.82;' : ''} gl_FragColor = vec4(max(c, 0.0), 1.0); }` }));
  m.renderOrder = -1; scene.add(m); return m;
})();
// The far city: hills and towers standing in the haze all round the horizon. It is a
// painted ring that travels with you, so there is always a skyline at the end of the street.
const skyline = (() => {
  const W = 2048, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = rng(4242);
  const ridge = (base, amp, col) => { // a line of hills
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) { const a = x / W * Math.PI * 2; g.lineTo(x, H - base - amp * (0.5 + 0.28 * Math.sin(a * 3 + 1) + 0.16 * Math.sin(a * 7 + 2) + 0.08 * Math.sin(a * 17))); }
    g.lineTo(W, H); g.fill();
  };
  ridge(34, 44, 'rgba(160,184,206,0.75)'); ridge(26, 30, 'rgba(150,176,198,0.85)');
  const towers = (n, hMin, hMax, shade, alpha) => {
    for (let i = 0; i < n; i++) {
      const cl = 0.5 + 0.5 * Math.sin(i / n * Math.PI * 2 * 3 + 0.6);               // towers gather into three downtown clusters
      const w = 14 + r() * 26, h = hMin + (hMax - hMin) * Math.pow(r(), 1.6) * (0.35 + 0.65 * cl), x = (i + r() * 0.8) / n * W, y = H - 18 - h, k = shade + r() * 14;
      const col = `rgba(${k | 0},${(k + 16) | 0},${(k + 34) | 0},${alpha})`; g.fillStyle = col;
      g.fillRect(x, y, w, h + 18);
      const top = r();
      if (top < 0.25) { g.fillRect(x + w * 0.25, y - h * 0.08, w * 0.5, h * 0.08); g.fillRect(x + w * 0.46, y - h * 0.22, w * 0.08, h * 0.15); } // stepped crown and mast
      else if (top < 0.4) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + w / 2, y - w * 0.9); g.lineTo(x + w, y); g.fill(); }                   // pointed top
      else if (top < 0.55) g.fillRect(x + w * 0.1, y - 5, w * 0.8, 5);
      g.fillStyle = 'rgba(255,255,255,0.10)'; for (let yy = y + 5; yy < H - 20; yy += 6) g.fillRect(x + 2, yy, w - 4, 2);                      // floors catching the light
      g.fillStyle = 'rgba(255,240,215,0.16)'; g.fillRect(x + w * 0.68, y, w * 0.32, h + 18);                                                   // sunlit side
    }
  };
  towers(64, 20, 120, 150, 0.8); towers(46, 30, 190, 118, 0.88);
  g.globalCompositeOperation = 'destination-out';                                    // everything melts into the haze towards the ground
  const fade = g.createLinearGradient(0, H - 78, 0, H); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.75, 'rgba(0,0,0,0.92)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fade; g.fillRect(0, H - 78, W, 78);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = 2;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(470, 470, 165, 48, 1, true), new THREE.MeshBasicMaterial({ map: t, color: '#7f9ccb', transparent: true, opacity: 0.55, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, defines: { NO_CURVE: 1 } }));
  m.renderOrder = -0.5; scene.add(m); return m;
})();

/* ---------------- materials ---------------- */
const GROUND_NOISE = `
  float gHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float gNoise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), u.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), u.x), u.y); }`;
const matCache = new Map();
const PLAIN = new THREE.MeshLambertMaterial({ vertexColors: true }); // one material for all plain-coloured parts
PLAIN.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, SHARED);
  sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = 'varying vec3 vW; uniform sampler2D uPlaster;\n' + GROUND_NOISE + '\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
    vec3 wN = abs(inverseTransformDirection(normal, viewMatrix));
    vec2 dUv = wN.y > 0.6 ? vW.xz : (wN.x > wN.z ? vW.zy : vW.xy);                       // the plaster is laid flat on whichever way the surface faces
    diffuseColor.rgb *= mix(vec3(1.0), texture2D(uPlaster, dUv / 3.4).rgb * 2.0, 0.9);
    float wallish = 1.0 - smoothstep(0.3, 0.7, wN.y);
    diffuseColor.rgb *= 1.0 - 0.24 * wallish * (1.0 - smoothstep(0.0, 1.5, vW.y - 0.28));
    diffuseColor.rgb *= 0.93 + 0.13 * gNoise(vW.xz * 0.33 + vW.y * 0.55);`);
};
PLAIN.customProgramCacheKey = () => 'plain-walls';
function mat(color) {
  let m = matCache.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color }); matCache.set(color, m); }
  return m;
}
function groundMat(color, key, pars, colour, final) {
  const m = new THREE.MeshLambertMaterial({ color });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SHARED);
    sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vW; uniform float uTime;\n' + GROUND_NOISE + pars + '\n' + sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n float gDist = length(cameraPosition - vW);\n' + colour)
      .replace('#include <opaque_fragment>', (final || '') + '\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => key;
  return m;
}
// Tarmac: fine grain, slow patchy wear, and shallow puddles that mirror the sky
const ROAD_C = groundMat('#4c4e52', 'ground-road-dry', 'uniform sampler2D uAsphalt;' + SKY_GLSL, `
  vec3 tar = texture2D(uAsphalt, vW.xz / 2.6).rgb + texture2D(uAsphalt, vW.zx / 9.7 + 0.37).rgb;   // photographed tarmac at two sizes, so it never looks tiled
  float wear = gNoise(vW.xz * 0.23 + 9.0);
  diffuseColor.rgb *= tar * (0.86 + 0.26 * wear);
  float pn = 0.6 * gNoise(vW.xz * 0.19 + 3.7) + 0.4 * gNoise(vW.xz * 0.53 + 11.0);
  float damp = 0.0, pool = 0.0; // a dry road: no damp patches and no standing water
  diffuseColor.rgb *= 1.0 - 0.42 * damp;`, `
  { // The surface is not flat: the stones in the tarmac tip the light this way and that. Work out that tilt from the
    // photograph, then let it catch the sun as a low glare and pick up a sheen of sky towards the distance, more so where damp.
    vec2 gp = vW.xz / 2.6; float ge = 0.012;
    float hx = texture2D(uAsphalt, gp + vec2(ge, 0.0)).g - texture2D(uAsphalt, gp - vec2(ge, 0.0)).g, hz = texture2D(uAsphalt, gp + vec2(0.0, ge)).g - texture2D(uAsphalt, gp - vec2(0.0, ge)).g;
    float near = 1.0 - smoothstep(14.0, 50.0, gDist);
    vec3 gN = normalize(vec3(-hx * 2.2 * near, 1.0, -hz * 2.2 * near)), gVv = normalize(cameraPosition - vW), gH = normalize(SUN + gVv);
    float lit = clamp(reflectedLight.directDiffuse.g / max(diffuseColor.g, 0.001) / 0.55, 0.0, 1.0);                   // in the sun, not in shadow
    outgoingLight *= 0.86 + 0.26 * clamp(dot(gN, SUN) / SUN.y, 0.0, 1.4) * lit + 0.14 * (1.0 - lit);
    float glare = pow(max(dot(gN, gH), 0.0), 38.0) * (0.10 + 0.5 * damp) + pow(max(dot(gN, gH), 0.0), 240.0) * (0.25 + 1.2 * damp);
    outgoingLight += vec3(1.0, 0.93, 0.82) * glare * lit;
    float graze = pow(1.0 - max(gVv.y, 0.0), 5.0);
    outgoingLight = mix(outgoingLight, pow(skyColor(normalize(reflect(-gVv, gN) * vec3(1.0, 1.0, 1.0) + vec3(0.0, 0.05, 0.0)), uTime), vec3(2.2)), graze * (0.22 + 0.4 * damp));
  }
  if (pool > 0.0) {
    vec3 gV = normalize(cameraPosition - vW), gR = reflect(-gV, vec3(0.0, 1.0, 0.0));
    gR.xz += (vec2(gNoise(vW.xz * 2.3 + uTime * 0.35), gNoise(vW.xz * 2.3 + 40.0 - uTime * 0.3)) - 0.5) * 0.035; // the faintest ripple
    vec3 mirror = pow(skyColor(normalize(gR), uTime), vec3(2.2)) * 0.62;
    float fres = 0.10 + 0.90 * pow(1.0 - max(gV.y, 0.0), 3.0);
    outgoingLight = mix(outgoingLight, mirror, pool * clamp(fres * 1.1 + 0.1, 0.0, 0.88));
  }`);
// Sidewalk: large concrete slabs with fine joints, each slab a slightly different grey
const WALK_C = groundMat('#cfc9bd', 'ground-walk', 'uniform sampler2D uPaving;', `
  diffuseColor.rgb *= texture2D(uPaving, vW.xz / 2.6).rgb * 2.0 * (0.94 + 0.12 * gNoise(vW.xz * 0.4 + 5.0));`);
// Interlocking paving stones, laid in rows: patches of terracotta and of grey, as on an estate sidewalk
const PAVE_C = groundMat('#ffffff', 'ground-pave', '', `
  vec2 pv = vW.xz / vec2(0.24, 0.12); pv.x += 0.5 * mod(floor(pv.y), 2.0);
  vec2 pf = fract(pv); float pJoint = smoothstep(0.0, 0.07, min(pf.x, 1.0 - pf.x)) * smoothstep(0.0, 0.12, min(pf.y, 1.0 - pf.y));
  pJoint = mix(pJoint, 0.9, smoothstep(14.0, 40.0, gDist));
  vec3 pTone = mix(vec3(0.70, 0.50, 0.43), vec3(0.60, 0.58, 0.55), smoothstep(0.42, 0.58, gNoise(vW.xz * 0.3)));
  diffuseColor.rgb = pTone * (0.86 + 0.26 * gHash(floor(pv))) * mix(0.6, 1.0, pJoint) * (0.92 + 0.16 * gNoise(vW.xz * 0.5 + 5.0));`);
function paneMat(color, o = {}) {
  const m = new THREE.MeshLambertMaterial({ color, map: o.map || null, emissive: o.map ? '#ffffff' : '#000000', emissiveMap: o.map || null, emissiveIntensity: o.map ? 0.3 : 0 });
  const grid = !o.map; if (grid) m.userData.pane = true; // Batch then records each face's size, so the frame can be drawn to fit
  const fc = new THREE.Color(o.frame || '#ece8de'), f3 = (v) => v.toFixed(3);
  const defs = `${grid ? '#define PANE_GRID' : ''}\n${o.curtains ? '#define CURTAINS' : ''}\n${o.band ? '#define BAND' : ''}\n${HQ ? '#define PANESKY(d) skyColor(d, uTime)' : '#define PANESKY(d) mix(vec3(0.851, 0.898, 0.933), vec3(0.20, 0.45, 0.85), pow(max(d.y, 0.0), 0.6))'}
    #define CW ${f3(o.cw || 1.0)}\n#define CH ${f3(o.ch || 1.4)}\n#define FW ${f3(o.fw || 0.05)}\n#define F0 ${f3(o.f0 || 0.3)}\n#define FRAMECOL vec3(${f3(fc.r)}, ${f3(fc.g)}, ${f3(fc.b)})\n`;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SHARED);
    sh.vertexShader = 'varying vec3 vW; varying vec2 vPane;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vPane = uv;');
    sh.fragmentShader = 'varying vec3 vW; varying vec2 vPane; uniform float uTime;\n' + defs + GROUND_NOISE + SKY_GLSL + '\n' + sh.fragmentShader
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 pN = inverseTransformDirection(normal, viewMatrix); float pFrame = 0.0;
        #ifdef PANE_GRID
          float pW = floor(vPane.x) * 0.1, pH = floor(vPane.y) * 0.1; vec2 pu = fract(vPane) / 0.999;
          if (min(pW, pH) > 0.25) {
            vec2 pSize = vec2(pW, pH), pn = max(vec2(1.0), floor(pSize / vec2(CW, CH) + 0.5)), cell = pu * pn, pid = floor(cell);
            vec2 bar = (0.5 - abs(fract(cell) - 0.5)) * pSize / pn, edge = (0.5 - abs(pu - 0.5)) * pSize;
            pFrame = max(1.0 - smoothstep(FW * 0.5, FW * 0.5 + 0.015, min(bar.x, bar.y)), 1.0 - smoothstep(FW, FW + 0.015, min(edge.x, edge.y)));
            vec3 ctr = vW - vec3(pN.z, 0.0, -pN.x) * (pu.x - 0.5) * pW; ctr.y = vW.y - (pu.y - 0.5) * pH;       // the middle of this window, the same for every pixel of it
            vec2 seed = floor(ctr.xz * 2.0 + 0.25) * 0.37 + floor(ctr.y * 2.0 + 0.25) * 1.91;
            float r1 = gHash(seed + pid * 1.7 + 0.5), r2 = gHash(seed + 7.3);
            vec3 inside = diffuseColor.rgb * (0.7 + 0.6 * r1);
            #ifdef CURTAINS
              if (r2 > 0.5) inside = mix(inside, vec3(0.62, 0.60, 0.55) * (0.75 + 0.5 * r2), 0.85 * step(1.0 - (0.2 + 0.6 * gHash(seed + 3.1)), pu.y)); // a blind pulled part of the way down
            #endif
            #ifdef BAND
              if (fract(cell.y) * pH / pn.y < 0.75) inside *= 0.55;                                               // the solid band at each floor of a glass tower
            #endif
            diffuseColor.rgb = mix(inside, FRAMECOL, pFrame);
          } else if (max(pW, pH) > 0.25) { pFrame = 1.0; diffuseColor.rgb = FRAMECOL; }                          // the thin edge of the window
        #endif`)
      .replace('#include <opaque_fragment>', `{
        vec3 gV = normalize(cameraPosition - vW), gR = reflect(-gV, pN);
        float pCol = floor(atan(gR.z, gR.x) * 5.0), pTop = 0.03 + 0.30 * gHash(vec2(pCol, 3.0));                      // the windows also mirror a made-up row of buildings across the street
        vec3 pBld = mix(vec3(0.40, 0.37, 0.34), vec3(0.78, 0.75, 0.70), gHash(vec2(pCol, 9.0))) * (0.7 + 0.3 * smoothstep(0.0, pTop, gR.y));
        pBld = mix(vec3(0.27, 0.28, 0.29), pBld, smoothstep(-0.10, 0.0, gR.y));
        vec3 refl = mix(pBld, PANESKY(normalize(vec3(gR.x, max(gR.y, 0.02), gR.z))), smoothstep(pTop - 0.012, pTop + 0.012, gR.y));
        float fres = F0 + (1.0 - F0) * pow(1.0 - max(dot(gV, pN), 0.0), 3.0);
        outgoingLight = mix(outgoingLight, pow(refl, vec3(2.2)), fres * (1.0 - pFrame)); 
        #ifdef PANE_GRID
        { float lit = step(0.52, gHash(floor(vPane) * 0.37 + floor(vW.xz / 3.7) * 1.3 + floor(vW.y / 3.05) * 7.1)); outgoingLight = mix(outgoingLight, vec3(1.0, 0.74, 0.40) * 1.25, uNight * lit * (1.0 - pFrame) * 0.9); } // lamps on indoors behind about half the windows
        #endif
        }
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'pane' + defs;
  return m;
}
const WINS = ['#33414d', '#3d4f5d', '#4a6072'].map((c) => paneMat(c, { cw: 0.85, ch: 1.5, curtains: true })); WINS.unshift(WINS[0]);
const LOBBY = paneMat('#3b5a72', { cw: 1.5, ch: 3.6, frame: '#2a2f33', fw: 0.06, f0: 0.34 });
const DOOR_GLASS = paneMat('#3c4a50', { cw: 1.0, ch: 2.6, frame: '#1f2326', fw: 0.06, f0: 0.22 });
const DARK_WIN = WINS[0];
const GLASS_DARK = paneMat('#1f2a33', { cw: 0.85, ch: 1.5, curtains: true, f0: 0.07 }); // house and flat windows: dark glass with only a faint mirror of the sky
const win = (r) => pick(r, WINS);
const GLASS = ['#4f86ad', '#3f6f96', '#6fa3bf', '#a8905a'].map((c) => paneMat(c, { cw: 1.6, ch: 3.6, frame: '#dfe6ea', fw: 0.07, f0: 0.46, band: true }));

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
    let b = this.m.get(material); if (!b) { b = { p: [], n: [], uv: material.map || material.userData.pane ? [] : null }; this.m.set(material, b); } return b;
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
      else if (material.userData.pane) { // whole part = the face's size in decimetres, fraction = where on the face (see paneMat)
        const [w, h, d] = dims;
        for (let i = 0; i < uv.length; i += 2) { const f = Math.floor(i / 12); b.uv.push(Math.floor((f < 2 ? d : w) * 10) + uv[i] * 0.999, Math.floor((f === 2 || f === 3 ? d : h) * 10) + uv[i + 1] * 0.999); }
      }
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
      lean(g); const mesh = new THREE.Mesh(g, PLAIN); mesh.userData.own = true; mesh.castShadow = mesh.receiveShadow = HQ; group.add(mesh);
    }
    for (const [material, b] of this.m) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      if (b.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
      lean(g); const mesh = new THREE.Mesh(g, material); mesh.userData.own = true; mesh.receiveShadow = HQ; mesh.castShadow = HQ && material !== ROAD_C && material !== WALK_C && !material.userData.pane && !material.transparent; group.add(mesh);
    }
  }
}

// Phones: once a street's merged shape has been handed to the graphics chip, the game's own copy is let go (nothing reads it again),
// which roughly halves the memory a street takes. Its size for culling is worked out first.
function dropArray() { this.array = null; }
function lean(g) { if (!PHONE) return; g.computeBoundingSphere(); for (const k in g.attributes) g.attributes[k].onUpload(dropArray); }
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
  const n = pc.k ? Math.max(1, Math.ceil((t1 - t0) / 2.5)) : Math.max(1, Math.ceil((t1 - t0) / 6));
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
const photoWall = (bytes, tile, tint = '#ffffff') => { const m = tiledTex((g) => { g.fillStyle = '#a08070'; g.fillRect(0, 0, 256, 256); }, tile); m.color.set(tint); photo(bytes, m.map); return m; };
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
TEX.floorWood = photoWall(floorWoodJpg, 1.8); TEX.wallPaint = photoWall(wallPaintJpg, 2.5); TEX.rugWool = photoWall(rugWoolJpg, 0.5); // indoors: oak laminate, clean painted walls, a wool rug
TEX.brickRed = photoWall(brickRedJpg, 1.5); TEX.brickGrey = photoWall(brickDarkJpg, 1.4); TEX.brickTan = photoWall(brickTanJpg, 2.0); TEX.stone = photoWall(stoneJpg, 2.6); // real brick and stone

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
const SWAY = ''; // trunks and branches stand still
const FLUTTER = `
  float fph = transformed.x * 0.55 + transformed.z * 0.45 + transformed.y * 0.5;
  float gust = 0.5 + 0.5 * sin(uTime * 0.5 + fph * 0.3);
  float fa = (0.025 + 0.055 * gust) * smoothstep(1.5, 4.5, transformed.y);
  transformed.x += sin(uTime * 1.7 + fph) * fa;
  transformed.z += cos(uTime * 1.4 + fph * 0.9) * fa;
  transformed.y += sin(uTime * 2.1 + fph * 1.3) * fa * 0.8;`;
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
  if (PHONE && Math.random() < 0.6) return; // phones: two in five bushes
  if (SHRUBS.ready === SHRUBS.all.length) { // a real plant: flowering ones where flowers were asked for, green ones elsewhere
    const q = mats === FLOWERS || FLOWERS.includes(mats[0]) ? SHRUBS.flower : pick(r, SHRUBS.green), wd = size * q.grow * (0.85 + r() * 0.3), yaw = r() * 6.283;
    for (const p of q.parts) B.add(p.tpl, p.mt, M(x, y - 0.03, z, wd, wd, wd, 0, yaw, 0));
    return;
  }
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
// Shop windows: a lit interior painted once per kind of shop, seen through glass that mirrors the street
const SHOP_GLASS = ['shelves', 'fashion', 'chemist', 'phones', 'shelves', 'food'].map((kind, k) => paneMat('#ffffff', { f0: 0.16, map: canvasTex(256, 192, (g, w, h) => {
  const r = rng(700 + k), bg = g.createLinearGradient(0, 0, 0, h);
  const [top, bot] = { shelves: ['#f6dfae', '#b98a55'], fashion: ['#f3e6d6', '#c9a98a'], chemist: ['#eef6f0', '#a9c9b4'], phones: ['#dfe9f5', '#7f93ad'], food: ['#f8d79a', '#b9703a'] }[kind];
  bg.addColorStop(0, top); bg.addColorStop(1, bot); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,250,235,0.9)'; for (let x = 28; x < w; x += 66) { g.beginPath(); g.ellipse(x, 9, 15, 4, 0, 0, 7); g.fill(); }        // ceiling lights
  g.fillStyle = 'rgba(70,45,25,0.35)'; g.fillRect(0, h - 26, w, 26);                                                                              // floor
  if (kind === 'fashion') {
    for (let i = 0; i < 4; i++) { // mannequins in bright outfits
      const x = 34 + i * 62 + r() * 8, col = pick(r, ['#c0392b', '#1f618d', '#d4a017', '#1e8449', '#7d3c98', '#e67e22', '#f4f1ea']);
      g.fillStyle = '#d9c7b2'; g.beginPath(); g.arc(x, 52, 9, 0, 7); g.fill(); g.fillRect(x - 3, 60, 6, 8);
      g.fillStyle = col; g.beginPath(); g.moveTo(x - 17, 70); g.lineTo(x + 17, 70); g.lineTo(x + 22, 150); g.lineTo(x - 22, 150); g.fill();
      g.fillStyle = '#3b3b3b'; g.fillRect(x - 2, 150, 4, 22); g.fillRect(x - 13, 170, 26, 4);
    }
  } else if (kind === 'phones') {
    for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) { const x = 14 + i * 48, y = 34 + row * 66; g.fillStyle = '#1b2430'; g.fillRect(x, y, 38, 50); g.fillStyle = pick(r, ['#4fc3f7', '#81c784', '#ffb74d', '#e57373', '#ba68c8']); g.fillRect(x + 3, y + 3, 32, 40); }
  } else {
    const cols = kind === 'chemist' ? ['#ffffff', '#2e9e6b', '#e8f3ee', '#3b8fd0', '#f2f2f2'] : kind === 'food' ? ['#e67e22', '#c0392b', '#f1c40f', '#8e5a2b', '#f4f1ea'] : ['#c0392b', '#f1c40f', '#1f618d', '#1e8449', '#f4f1ea', '#e67e22', '#7d3c98'];
    for (let row = 0; row < 4; row++) { // shelves stacked with goods
      const y = 30 + row * 36; g.fillStyle = 'rgba(80,55,35,0.75)'; g.fillRect(8, y + 26, w - 16, 4);
      for (let x = 12; x < w - 16;) { const bw = 7 + r() * 13, bh = 12 + r() * 13; g.fillStyle = pick(r, cols); g.fillRect(x, y + 26 - bh, bw, bh); x += bw + 2; }
    }
  }
  const sh = g.createLinearGradient(0, 0, 0, h); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.28)'); g.fillStyle = sh; g.fillRect(0, 0, w, h); // darker towards the floor
}) }));
// Awnings: canvas stretched on a sloping frame, striped in the shop's colour and cream, with a hanging front edge
const AWNING_MATS = [...AWNING, '#1c1c1c', '#1c1c1c', '#0e5a4a'].flatMap((col) => [true, true, false].map((striped) => {
  const t = canvasTex(64, 64, (g) => { g.fillStyle = col; g.fillRect(0, 0, 64, 64); if (striped) { g.fillStyle = '#f3eee2'; g.fillRect(32, 0, 32, 64); } g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, 0, 64, 5); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide });
}));
function groundShops(c, gh, bays, bw) {
  const { P, B, r, s } = c, aw = pick(r, AWNING_MATS), metal = pick(r, ['#1f2326', '#1f2326', '#3a3f44', '#e9e6df']), base = pick(r, ['#2b2b2b', '#4a3a2e', '#3c4650', '#6b2a22']);
  const X = (dep) => s * (F + dep), ord = (a, b) => (s > 0 ? [a, b] : [b, a]); // quads are wound so they face the street on either side of it
  for (let b = 0; b < bays; b++) {
    const lat = -c.w / 2 + bw * (b + 0.5), half = (bw - 0.5) / 2, door = bw > 2.6 ? 0.95 : 0, flip = r() < 0.5 ? 1 : -1;
    const g0 = -half * flip, g1 = (half - door) * flip, lo = Math.min(g0, g1), hi = Math.max(g0, g1), gl = pick(r, SHOP_GLASS); // the display window; the door takes the rest
    P(base, -0.07, 0.28, lat + (lo + hi) / 2, 0.16, 0.42, hi - lo);                                             // low wall under the window
    const [w0, w1] = ord(lat + lo, lat + hi);
    B.quadF(gl, V3(X(-0.07), 0.7, w0), V3(X(-0.07), 0.7, w1), V3(X(-0.07), 2.62, w1), V3(X(-0.07), 2.62, w0), 0, 1);
    P(metal, -0.09, 2.62, lat, 0.2, 0.16, bw - 0.36);                                                           // head of the frame
    for (const e of [lo, hi, -half * -flip]) P(metal, -0.09, 0.28, lat + e, 0.2, 2.34, 0.07);                   // posts
    if (hi - lo > 2.2) P(metal, -0.1, 0.7, lat + (lo + hi) / 2, 0.06, 1.92, 0.045);                             // one slim bar down the middle of a wide window
    if (door) P(DOOR_GLASS, -0.05, 0.28, lat + (half - door / 2) * flip, 0.08, 2.34, door - 0.07);
    P('#d8d3c6', -0.32, 0.28, lat + (half - door / 2) * flip, 0.5, 0.05, door + 0.2);                           // doorstep
    // awning
    const a0 = -(bw - 0.24) / 2, a1 = (bw - 0.24) / 2, n = (a1 - a0) / 0.62, yw = 3.02, yf = 2.7, out = -1.5;
    const [q0, q1] = ord(lat + a0, lat + a1);
    B.quadF(aw, V3(X(0), yw, q1), V3(X(0), yw, q0), V3(X(out), yf, q0), V3(X(out), yf, q1), 0, 1, 0, n);
    B.quadF(aw, V3(X(out), yf - 0.24, q0), V3(X(out), yf - 0.24, q1), V3(X(out), yf, q1), V3(X(out), yf, q0), 0, 0.3, 0, n);
    for (const e of [a0, a1]) B.add(T.cyl, metal, MD(V3(X(out / 2), (yw + yf) / 2 - 0.03, lat + e), V3(s * out, yf - yw, 0).normalize(), 0.035, 1.54, 0.035)); // frame arms
    if (r() < 0.65) {
      const len = Math.min(bw - 0.5, 3.8), sg = new THREE.Mesh(UNIT, pick(r, SIGN_MATS)); sg.castShadow = sg.receiveShadow = HQ;
      sg.scale.set(0.08, len * 0.22, len); sg.position.set(s * (F - 0.06), 3.1 + len * 0.11, lat); c.addMesh(sg);
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
  P(LOBBY, -0.04, 0.28, 0, 0.1, 3.3, w - 2.5); // glass lobby
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
  P(LOBBY, -0.04, 0.28, 0, 0.1, 4, w - 3);
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
function frontFence(c, gl, gw, stone, wallc, noGate) {
  const { P, w } = c, spans = [[-w / 2 + 0.3, gl - gw / 2 - 0.25], [gl + gw / 2 + 0.25, w / 2 - 0.3]];
  for (const [a, b] of spans) {
    const len = b - a; if (len < 0.2) { continue; }
    const n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) { const lat = a + (len / n) * i; P(stone, 0.15, 0, lat, 0.5, 2.1, 0.5); P('#d8d0bc', 0.15, 2.1, lat, 0.64, 0.12, 0.64); }
    P(wallc, 0.15, 0, (a + b) / 2, 0.24, 1.15, len);
    P(IRON, 0.15, 1.85, (a + b) / 2, 0.05, 0.05, len);
    for (let lat = a + 0.45; lat < b - 0.2; lat += 0.45) P(IRON, 0.15, 1.15, lat, 0.035, 0.75, 0.035);
  }
  if (!noGate) { P('#2b2622', 0.15, 0.2, gl, 0.07, 1.75, gw); P(IRON, 0.15, 1.95, gl, 0.09, 0.06, gw); }
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
const BUILD = { rental, apt: apartment, shop: shophouse, office, glass: glassTower, plot, church, duplex, bungalow, terrace, modern, uncompleted };
// Real buildings: photo-textured models (Sketchfab, see models/CREDITS.txt). Each is brought to metres, stood on the ground,
// centred, with its street front facing +z, then copied into the street's merged mesh like everything else.
// wide = how wide it really is in metres; yaw turns its front to +z; kind: mid = city block, tall = tower, small = narrow infill.
const BLD = [
  { data: bld1, wide: 23, kind: 'mid' }, { data: bld2, wide: 23, kind: 'mid' }, { data: bld3, wide: 23, kind: 'mid' }, { data: bld5, wide: 23, kind: 'mid' },
  { data: bld4, wide: 44, kind: 'long' }, { data: bld6, wide: 44, kind: 'long' }, { data: bld9, wide: 56, kind: 'long' },
  { data: bld7, wide: 26, kind: 'tall' }, { data: bld8, wide: 26, kind: 'tall' },
  { data: bld10, wide: 12, kind: 'small' }, { data: bld11, wide: 14, kind: 'small' },
  // the two shops: the supermarket and the furniture shop
  { data: stMarket, kind: 'store', id: 'grocery', size: 18 },
];
let treesLeft = BLD.length; // models still loading: buildings here, trees further down
for (const q of BLD) new GLTFLoader().parse(q.data.buffer.slice(q.data.byteOffset, q.data.byteOffset + q.data.byteLength), '', (gltf) => {
  const root = gltf.scene, box = new THREE.Box3(), meshes = []; if (q.yaw) root.rotation.y = q.yaw; root.updateMatrixWorld(true); box.setFromObject(root);
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const geos = meshes.map((o) => (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld));
  if (q.noGround || q.clip) { // drop whatever lies flat at the very bottom, and whatever stands outside the house's own footprint; then measure the house alone
    const cut = q.noGround ? box.min.y + (box.max.y - box.min.y) * q.noGround : -Infinity, cl = q.clip || [0, 1, 0, 1], bx = box.min.x, bz = box.min.z, dx = box.max.x - bx, dz = box.max.z - bz; box.makeEmpty();
    geos.forEach((g, gi) => { const P = g.attributes.position.array, U = g.attributes.uv && g.attributes.uv.array, np = [], nu = [];
      for (let i = 0; i < P.length; i += 9) {
        if (P[i + 1] < cut && P[i + 4] < cut && P[i + 7] < cut) continue;
        let outside = false; for (let j = 0; j < 9; j += 3) { const fx = (P[i + j] - bx) / dx, fz = (P[i + j + 2] - bz) / dz; if (fx < cl[0] - 0.02 || fx > cl[1] + 0.02 || fz < cl[2] - 0.02 || fz > cl[3] + 0.02) outside = true; } if (outside) continue; // a piece that reaches outside the footprint (a lawn, a road) goes too
        for (let j = 0; j < 9; j++) np.push(P[i + j]); if (U) for (let j = 0; j < 6; j++) nu.push(U[i / 3 * 2 + j]); }
      const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(np, 3)); if (U) ng.setAttribute('uv', new THREE.Float32BufferAttribute(nu, 2)); geos[gi] = ng;
      for (let i = 0; i < np.length; i += 3) box.expandByPoint(_v.set(np[i], np[i + 1], np[i + 2])); });
  }
  if (q.villa || q.kind === 'store') q.wide = q.size || (box.max.x - box.min.x);
  const k = q.wide / (box.max.x - box.min.x), fit = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2));
  q.high = (box.max.y - box.min.y) * k; q.deep = (box.max.z - box.min.z) * k;
  q.parts = meshes.map((o, gi) => {
    queueMicrotask(() => q.parts.forEach((p) => { if (!p.mt.userData.glow) { p.mt.userData.glow = p.mt.emissiveIntensity; GLOW_BY_DAY.push(p.mt); } }));
    const g = geos[gi].applyMatrix4(fit); g.computeVertexNormals();
    return { tpl: g, mt: new THREE.MeshLambertMaterial({ map: o.material.map, color: o.material.map ? new THREE.Color().setScalar(q.bright || 1) : o.material.color, emissive: o.material.map ? 0xffffff : 0x000000, emissiveMap: o.material.map, emissiveIntensity: q.glow || 0.14, alphaTest: o.material.alphaTest > 0 || o.material.transparent ? 0.5 : 0, side: o.material.side }) }; // a little of its own colour always shows by day // a little of its own colour always shows, so a wall facing away from the sun is shaded, not black
  });
  treesLeft--;
}, (e) => { treesLeft--; console.error('building failed to load', e); });
const BLD_FOR = { apt: 1, shop: 1, office: 1, glass: 1, modern: 1, uncompleted: 1, duplex: 1, terrace: 1, bungalow: 1 };
// A real wrought-iron double gate (modelled; credited in models/CREDITS.txt), brought to one unit wide and one unit tall so it can be fitted to any gateway
function unitModel(data, uniform, bright = 1, cut = 0) { // cut: on phones, a coarser shape - points closer than 1/cut of its size are joined // a model brought to one unit wide (its width laid along z) and, unless uniform, one unit tall; uniform keeps its true proportions
  const q = { parts: null }; treesLeft++;
  new GLTFLoader().parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '', (gltf) => {
    const root = gltf.scene, box = new THREE.Box3(), meshes = []; root.updateMatrixWorld(true); box.setFromObject(root); root.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const sx = box.max.x - box.min.x, sz = box.max.z - box.min.z, turn = sx > sz ? Math.PI / 2 : 0, wd = Math.max(sx, sz), hy = uniform ? wd : box.max.y - box.min.y; q.tall = (box.max.y - box.min.y) / wd;
    const fit = new THREE.Matrix4().makeScale(1 / wd, 1 / hy, 1 / wd).multiply(new THREE.Matrix4().makeRotationY(turn)).multiply(new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2));
    q.parts = meshes.map((o) => { let src = o.geometry; if (cut && PHONE) src = lowGeom(src, cut);
      const g = (src.index ? src.toNonIndexed() : src.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(fit, o.matrixWorld)); g.computeVertexNormals(); const glass = o.material.transparent && o.material.opacity < 0.9;
      return { tpl: g, mt: new THREE.MeshLambertMaterial({ map: glass ? null : o.material.map, color: glass ? new THREE.Color('#3b4d5c') : o.material.map ? new THREE.Color().setScalar(bright) : o.material.color.clone().multiplyScalar(0.9 * bright), side: THREE.DoubleSide, transparent: glass, opacity: glass ? 0.35 : 1, depthWrite: !glass, alphaTest: !glass && (o.material.alphaTest > 0 || o.material.transparent) ? 0.5 : 0 }) }; });
    treesLeft--;
  }, (e) => { treesLeft--; console.error('a model failed to load', e); });
  return q;
}
const PATIO = unitModel(sPatio, true); // a real patio umbrella over a table and two chairs
const GATES = [vGate, vGate2, vGate3].map((d) => unitModel(d)), GATE = GATES[0], WINDOW = unitModel(wWindow, false, 1, 40), BENCH = unitModel(sBench, true), BUS_STOP = unitModel(sBusStop, true, 2.6); // (the shelter is modelled in very dark steel, so it is lifted to read as grey) // three real gates, a real window, a park bench and a bus shelter
function gateLeaf() { // the same gate as a thing that can swing: hinged at one edge, 1.8 m wide
  const g = new THREE.Group(); if (!GATE.parts) return new THREE.Mesh(GATE_GEO, mat('#1d1c1b'));
  for (const p of GATE.parts) { const m = new THREE.Mesh(p.tpl, p.mt); m.scale.set(1.8, 2.05, 1.86); m.position.z = 0.9; m.castShadow = HQ; g.add(m); }
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.66, 0.09), mat('#0e0e0f')); post.position.set(0, 0.83, 0.9); g.add(post); return g;
}
const RAZOR = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, alphaTest: 0.35, map: (() => { const t = canvasTex(256, 128, (g) => { g.clearRect(0, 0, 256, 128); // a concertina coil of razor wire: each loop shaded darker behind, brighter in front, with blades along it
  const loop = (cx, front) => { const q = g.createLinearGradient(0, 8, 0, 120); q.addColorStop(0, front ? '#eef1f4' : '#7c838b'); q.addColorStop(0.5, front ? '#aab1b9' : '#5d646c'); q.addColorStop(1, front ? '#dfe3e8' : '#737a82'); g.strokeStyle = q; g.lineWidth = front ? 4.5 : 3.5; g.beginPath(); g.ellipse(cx, 64, 30, 54, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); g.stroke(); };
  for (let i = -1; i < 9; i++) loop(i * 32 + 16, false); for (let i = -1; i < 9; i++) loop(i * 32 + 16, true);
  g.fillStyle = '#f4f6f8'; for (let i = -1; i < 9; i++) for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, x = i * 32 + 16 + Math.cos(a) * 30, y = 64 + Math.sin(a) * 54; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-7, 0); g.lineTo(0, -2.6); g.lineTo(7, 0); g.lineTo(0, 2.6); g.closePath(); g.fill(); g.restore(); }
}); t.wrapS = THREE.RepeatWrapping; return t; })() });
function razorWire(c, dep0, lat0, dep1, lat1, y) { // a run of it standing on a wall, from one end to the other
  const { B, s } = c, a = V3(s * (F + dep0), y, lat0), b = V3(s * (F + dep1), y, lat1), n = a.distanceTo(b) / 0.9; if (n < 0.6) return;
  B.quadF(RAZOR, a, b, b.clone().setY(y + 0.5), a.clone().setY(y + 0.5), 0, 1, 0, n * 0.55);
  const side = V3(-(b.z - a.z), 0, b.x - a.x).normalize().multiplyScalar(0.24); // and the same coil seen end-on, crossing it, so it looks round from any angle
  B.quadF(RAZOR, a.clone().add(side).setY(y + 0.25), b.clone().add(side).setY(y + 0.25), b.clone().sub(side).setY(y + 0.25), a.clone().sub(side).setY(y + 0.25), 0, 1, 0, n * 0.55);
}
const GATE_DARK = '#25282d', GATE_SLAT = '#3a3f46';
function gatePanel(P, dep, lat, gw, h = 2.15) { // a closed sliding gate: dark steel, filled with horizontal slats
  P(GATE_DARK, dep, 0.1, lat, 0.07, h, gw);
  for (let y = 0.3; y < h - 0.1; y += 0.22) P(GATE_SLAT, dep - 0.045, y, lat, 0.03, 0.13, gw - 0.24);
  P('#b9a15a', dep - 0.07, 0.95, lat + gw * 0.06, 0.04, 0.5, 0.04);
}
function gatehouse(c, lat, wallM) { // the security post beside the gate: a small room with a window on to the street
  const { P, r } = c, d0 = 0.04, d1 = 2.0, wd = 1.9, H = 2.55, m = (d0 + d1) / 2;
  P(wallM, m, 0, lat, d1 - d0, H, wd); P(TEX.stone, m, 0, lat, d1 - d0 + 0.06, 0.85, wd + 0.06);
  P('#ece8df', m, H, lat, d1 - d0 + 0.6, 0.08, wd + 0.6); hipRoof(c, ZINC[Math.floor(r() * ZINC.length)], m, lat, d1 - d0 + 0.8, wd + 0.8, H + 0.08, 0.75); // a little zinc roof that sheds the rain on all four sides
  P(win(r), d0 - 0.02, 1.15, lat, 0.06, 0.95, 0.9); P('#f1ede2', d0 - 0.08, 1.06, lat, 0.2, 0.08, 1.16);
  if (WINDOW.parts) for (const p of WINDOW.parts) c.B.add(p.tpl, p.mt, M(c.s * (F + d0 - 0.05), 1.13, lat, 1.0, 1.0, 1.0)); else P('#f1ede2', d0 - 0.05, 2.1, lat, 0.1, 0.08, 1.06); // a real window in its frame
  P(GLOW, d0 - 0.12, H - 0.2, lat, 0.12, 0.07, 0.3);
}
function compoundFront(c, gl, gw, wallM, H = 2.3) { // the wall to the street: rendered and capped, stone piers with lamps either side of the gate
  const { P, w } = c;
  for (const [a, b] of [[-w / 2 + 0.05, gl - gw / 2 - 0.5], [gl + gw / 2 + 0.5, w / 2 - 0.05]]) if (b - a > 0.3) { P(wallM, 0.17, 0, (a + b) / 2, 0.22, H, b - a); P('#e9e4d8', 0.17, H, (a + b) / 2, 0.32, 0.08, b - a); razorWire(c, 0.17, a, 0.17, b, H + 0.08); }
  for (const e of [-1, 1]) { const lat = gl + e * (gw / 2 + 0.25); P(TEX.stone, 0.17, 0, lat, 0.5, H + 0.3, 0.5); P('#e9e4d8', 0.17, H + 0.3, lat, 0.62, 0.1, 0.62); P('#1b1b1c', -0.11, 1.72, lat, 0.06, 0.34, 0.18); P(GLOW, -0.15, 1.76, lat, 0.05, 0.24, 0.1); }
  const gi = Math.floor(c.r() * GATES.length), gm = GATES[gi].parts ? GATES[gi] : GATE; // one of three gates
  if (gm.parts) { for (const p of gm.parts) c.B.add(p.tpl, p.mt, M(c.s * (F + 0.17), 0.0, gl, gw, 2.3, gw * 1.03)); if (gm === GATE) P('#0e0e0f', 0.17, 0, gl, 0.07, 1.86, 0.11); P('#0e0e0f', 0.17, 0, gl, 0.05, 0.1, gw); } else gatePanel(P, 0.17, gl, gw);
}
function waterTank(c, dep, lat) { // a black tank up on a steel stand, as every compound has
  const { P, B, s } = c, h = 6.4, G = '#5b6166';
  for (const a of [-1, 1]) for (const b of [-1, 1]) P(G, dep + a * 0.55, 0, lat + b * 0.55, 0.07, h, 0.07);
  for (const y of [h * 0.33, h * 0.66]) { for (const a of [-1, 1]) { P(G, dep + a * 0.55, y, lat, 0.05, 0.05, 1.1); P(G, dep, y, lat + a * 0.55, 1.1, 0.05, 0.05); } }
  P(G, dep, h, lat, 1.4, 0.08, 1.4);
  B.add(T.cyl, '#17181a', M(s * (F + dep), h + 0.78, lat, 1.25, 1.4, 1.25)); B.add(T.cyl, '#17181a', M(s * (F + dep), h + 1.54, lat, 0.5, 0.12, 0.5));
}
function compound(c, sb, deep, G) { // a house's own walled yard: paved, planted along the walls, with its gate, gatehouse and water tank
  const { P, B, r, w, s, D } = c, wallM = (D.estate && D.estate.wallM) || pick(r, COMPOUND_WALLS), gw = Math.min(3.4, w * 0.3), side = r() < 0.5 ? -1 : 1, gl = side * Math.max(0, w / 2 - gw / 2 - 1.3) * 0.6;
  P(PAVE_C, sb / 2 + 0.2, 0, 0, sb - 0.1, G, w - 0.3);
  compoundFront(c, gl, gw, wallM);
  if (w > 11) gatehouse(c, gl - side * (gw / 2 + 0.5 + 0.97), wallM);
  for (const e of [-1, 1]) {
    P(wallM, (sb + deep) / 2 + 0.15, 0, e * (w / 2 - 0.09), sb + deep - 0.1, 2.1, 0.18); P('#e9e4d8', (sb + deep) / 2 + 0.15, 2.1, e * (w / 2 - 0.09), sb + deep - 0.1, 0.07, 0.26); razorWire(c, 0.3, e * (w / 2 - 0.09), sb + deep, e * (w / 2 - 0.09), 2.17);
    if (w > 9.5) { P('#4f7a3c', sb / 2 + 0.45, 0, e * (w / 2 - 0.62), sb - 1.2, G + 0.04, 0.8); for (let dp = 1.3; dp < sb - 0.6; dp += 1.1 + r() * 0.5) bush(B, r, s * (F + dp), G + 0.04, e * (w / 2 - 0.62), 0.7 + r() * 0.35, r() < 0.35 ? FLOWERS : BROAD, 6); }
  }
  if (r() < 0.7) bush(B, r, s * (F + 0.45), 2.05, -side * (w / 2 - 1.2 - r() * 1.5), 1.25, [FLOWERS[0], FLOWERS[3], FLOWERS[5]], 9); // bougainvillea spilling over the wall
  if (w > 12 && r() < 0.6) waterTank(c, sb - 0.95, -side * (w / 2 - 1.15));
}
// A house of the estate, built here piece by piece so that it has real depth: a main block and a front bay that stands
// forward, a porch on columns with a balcony over it, windows set in frames with sills, a tiled hip roof or a flat one
// with a deep overhang. Walls, stone and brick are photographed textures. Every house draws its own mix, so no two match.
// A block of flats for the estate, built here floor by floor: a brick or rendered body with a band at every floor, a stair
// tower up the middle over a glazed entrance, bays of framed windows, balconies with steel rails on alternate bays,
// rainwater pipes, and a low zinc roof. Its fence is not a house's: a low brick wall with railings, open to the road.
// Shops for the streets. Each kind has its own lit signboard, made like a real one: a coloured face with a round emblem,
// the name in heavy letters and a line of small print, in a dark metal case; a striped awning; and a window you can see into.
const SHOP_KINDS = [['FRESH MART', 'Groceries \u00b7 Open daily', '#1e7a46', '#ffffff', 5], ['CITY PHARMACY', 'Health \u00b7 Beauty \u00b7 Care', '#0f6e8c', '#ffffff', 2], ['GOLDEN CRUST', 'Bakery & Caf\u00e9', '#7a4a1e', '#ffe9b8', 5],
  ['URBAN THREAD', 'Fashion for everyone', '#18191c', '#f2d27a', 1], ['PHONE HUB', 'Phones \u00b7 Repairs \u00b7 Accessories', '#c0392b', '#ffffff', 3], ['PAGE & PEN', 'Books \u00b7 Stationery', '#3d2f6b', '#ffffff', 0],
  ['HOME & LIVING', 'Furniture \u00b7 D\u00e9cor', '#2f4b5e', '#ffffff', 4], ['GREEN BOWL', 'Fresh food \u00b7 Juice bar', '#3f7d2a', '#f6ffd9', 5], ['UNITY BANK', 'Savings \u00b7 Loans \u00b7 24h ATM', '#12355b', '#f2d27a', 0]].map(([name, tag, bg, fg, glass], ki) => {
  const sign = new THREE.MeshLambertMaterial({ emissive: '#ffffff', emissiveIntensity: 0.12, map: canvasTex(1024, 256, (g, w, hh) => {
    const q = g.createLinearGradient(0, 0, 0, hh); q.addColorStop(0, bg); q.addColorStop(1, bg); g.fillStyle = q; g.fillRect(0, 0, w, hh); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, 0, w, hh * 0.45);
    g.fillStyle = fg; g.beginPath(); g.arc(128, 128, 84, 0, 7); g.fill(); g.fillStyle = bg; g.font = '900 120px "Arial Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name[0], 128, 136);
    g.fillStyle = fg; g.textAlign = 'left'; let size = 118; do { g.font = `900 ${size}px "Arial Black", Impact, sans-serif`; size -= 4; } while (g.measureText(name).width > w - 290); g.fillText(name, 250, 108);
    g.globalAlpha = 0.88; g.font = '600 46px Arial, Helvetica, sans-serif'; g.fillText(tag, 254, 196); g.globalAlpha = 1;
  }) }); sign.emissiveMap = sign.map; NIGHT_SIGNS.push(sign);
  const awn = tiledTex((g) => { g.fillStyle = bg; g.fillRect(0, 0, 256, 256); g.fillStyle = '#f4f1ea'; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 32, 256); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 232, 256, 24); }, 1, true);
  return { sign, awn, glass, bg, type: ['grocery', 'pharmacy', 'bakery', 'fashion', 'phones', 'books', 'home', 'grocery', 'bank'][ki] };
});
// What stands on the shelves of each kind of shop: rows of goods painted at real size, lit as if by the shop's own lamps
const prodTex = (bgc, cols, w0, w1, hh) => { const m = tiledTex((g) => { const r = rng(900 + cols.length * 7 + w0); g.fillStyle = bgc; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 4; row++) { const y1 = 256 - row * 64 - 6; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y1, 256, 6); for (let x = 2; x < 252;) { const wd = w0 + r() * (w1 - w0), ht = hh * (0.7 + r() * 0.3); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y1 - ht, wd - 2, ht); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, y1 - ht, wd - 2, 3); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 2, y1 - ht * 0.6, wd - 6, ht * 0.18); x += wd; } } }, 1.68);
  m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = m.map; m.emissiveIntensity = 0.32; return m; };
const PROD = { pharmacy: prodTex('#f4f6f7', ['#ffffff', '#e8f1f5', '#2f8f5b', '#1f6fb5', '#d94b4b', '#f1f1f1', '#9bd0e8'], 12, 22, 40), grocery: prodTex('#efe9dc', ['#d7302a', '#f2b01e', '#2a8a4a', '#1f6fb5', '#ef7d22', '#7a3fa0', '#f4f1ea', '#e8507e'], 12, 26, 48),
  bakery: prodTex('#f3e6cf', ['#c98a45', '#b0702e', '#e0b070', '#8a5326', '#d9a45c'], 22, 40, 34), fashion: prodTex('#f2efe9', ['#1c2e55', '#7a1616', '#e3d3a4', '#15161a', '#c8ccd1', '#2f5d43', '#d9567a'], 30, 44, 30),
  phones: prodTex('#fafafa', ['#111315', '#1b1e22', '#2b3138', '#c9ced3', '#1f6fb5'], 16, 20, 42), books: prodTex('#5a3d28', ['#8a1c1c', '#1c2e55', '#23513a', '#c9b98a', '#d9a81e', '#3d2f6b', '#f4f1ea', '#15161a'], 6, 14, 52),
  home: prodTex('#eee9df', ['#c9b98a', '#8d7a5c', '#5f7d7a', '#d9d4c8', '#a35a3a'], 34, 52, 36) };
const SHOP_CLEAR = new THREE.MeshBasicMaterial({ color: '#cfe6f0', transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }); // shop glass you really see through
const SHOP_WALL = new THREE.MeshLambertMaterial({ color: '#f3f0ea', emissive: '#fff1d2', emissiveIntensity: 0.28 }), SHOP_FLOOR = tiledTex((g) => { g.fillStyle = '#a9a69e'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#e9e5dc' : '#dcd7cc'; g.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); } }, 1.2); SHOP_FLOOR.emissive = new THREE.Color('#fff1d2'); SHOP_FLOOR.emissiveIntensity = 0.1;
const CROSS_GREEN = new THREE.MeshLambertMaterial({ color: '#35c46a', emissive: '#22b85a', emissiveIntensity: 0.9 }), SCREEN_BLUE = new THREE.MeshLambertMaterial({ color: '#4aa8ff', emissive: '#2f8cff', emissiveIntensity: 0.9 });
const OPEN_SIGN = new THREE.MeshLambertMaterial({ emissive: '#ffffff', emissiveIntensity: 0.4, side: THREE.DoubleSide, map: canvasTex(128, 64, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 128, 64); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(4, 4, 120, 56); g.fillStyle = '#fff'; g.font = '900 34px "Arial Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OPEN', 64, 34); }) }); OPEN_SIGN.emissiveMap = OPEN_SIGN.map;
function shopStaff(c, dep, lat, y) { // someone at work inside: a real figure, standing as they would behind a counter
  if (kinds.length < KINDS) return; const k = kinds[1 + Math.floor(c.r() * 6)], look = k.looks[Math.floor(c.r() * k.looks.length)], obj = new THREE.Group(), inner = SkeletonUtils.clone(k.root);
  inner.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; if (o.isSkinnedMesh && o.geometry.userData.low) o.geometry = o.geometry.userData.low; o.frustumCulled = false; } });
  inner.scale.multiplyScalar(k.scale * 0.97); inner.position.y += k.lift; obj.add(inner); const mx = new THREE.AnimationMixer(inner); mx.clipAction(k.idle || k.walk).play(); mx.update(c.r() * 3);
  obj.position.set(c.s * (F + dep), y, lat); obj.rotation.y = -c.s * Math.PI / 2; c.addMesh(obj);
}
function builtShop(c) {
  const { P, B, r, w, s } = c, G = 0.3, sb = 3.2, k = SHOP_KINDS[Math.floor(r() * SHOP_KINDS.length)], TRIM = '#f1ede4', DARK = '#24272b';
  const body = pick(r, [TEX.brickRed, TEX.brickTan, TEX.brickGrey, TEX.render, TEX.renderGrey]), two = r() < 0.65, gh = 3.7, H = gh + (two ? 3.1 : 0.9), bw = w - 1.2, d = 9.5, mid = sb + d / 2, top = G + H;
  P(PAVE_C, sb / 2 + 0.2, 0, 0, sb - 0.1, G, w - 0.2); P('#8d8980', mid, 0, 0, d + 0.3, G, bw + 0.3);                       // an open paved forecourt: no wall between shop and street
  if (PATIO.parts && w > 11 && r() < 0.6) { const pl = (r() < 0.5 ? -1 : 1) * (w / 2 - 3.1); B.obst(s * (F + 1.7), pl, 1.2); for (const p of PATIO.parts) B.add(p.tpl, p.mt, M(s * (F + 1.7), G, pl, 2.5, 2.5, 2.5, 0, r() * 6.28, 0)); } // a table under an umbrella on the forecourt, well back from the road
  for (const e of [-1, 1]) { P('#3a3d42', 0.5, G, e * (w / 2 - 1.1), 0.7, 0.55, 0.7); bush(B, r, s * (F + 0.5), G + 0.5, e * (w / 2 - 1.1), 0.7, r() < 0.5 ? FLOWERS : BROAD, 6); } // planters
  // the building is hollow at the front: a real shop floor 3.6 m deep behind the glass, and solid behind and above it
  const ID = 3.6, ch = 3.08, iw = bw - 0.6, side = r() < 0.5 ? -1 : 1, bank = k.type === 'bank', X = (dep) => s * (F + dep);
  P(body, mid, G + ch, 0, d, H - ch, bw); P(body, sb + ID + (d - ID) / 2, G, 0, d - ID, ch, bw); for (const e of [-1, 1]) P(body, sb + ID / 2, G, e * (bw / 2 - 0.15), ID, ch, 0.3);
  P(SHOP_FLOOR, sb + ID / 2, G, 0, ID, 0.03, iw); P(SHOP_WALL, sb + ID - 0.05, G, 0, 0.1, ch, iw); for (const e of [-1, 1]) P(SHOP_WALL, sb + ID / 2, G, e * (iw / 2 - 0.02), ID, ch, 0.06);
  P('#f4f2ec', sb + ID / 2, G + ch - 0.1, 0, ID, 0.1, iw); for (let q = -iw / 2 + 1.2; q < iw / 2 - 0.6; q += 2.2) P(GLOW, sb + ID / 2, G + ch - 0.13, q, 1.3, 0.03, 0.42);      // ceiling, with lit panels
  const cl = side * (iw / 2 - 1.5);
  if (bank) { // a banking hall: a long counter with a glass screen, a queue rail, a seat, and a cash machine in the wall outside
    P('#3a2a1e', sb + ID - 1.1, G, 0, 0.7, 1.05, iw - 1.0); P('#d9d4c8', sb + ID - 1.1, G + 1.05, 0, 0.8, 0.05, iw - 0.9); P(SHOP_CLEAR, sb + ID - 1.42, G + 1.1, 0, 0.03, 1.0, iw - 1.0);
    for (let q = -iw / 2 + 1.4; q < iw / 2 - 1; q += 1.9) { P('#2b2e33', sb + ID - 1.42, G + 1.1, q - 0.95, 0.05, 1.0, 0.05); P(SCREEN_BLUE, sb + ID - 0.85, G + 1.1, q, 0.05, 0.3, 0.42); }
    shopStaff(c, sb + ID - 0.55, -cl * 0.5, G + 0.03); shopStaff(c, sb + ID - 0.55, cl * 0.6, G + 0.03);
    for (const q of [-1.2, 1.2]) { B.add(T.cyl, '#c9a54a', M(X(sb + 1.5), G + 0.5, q, 0.07, 1.0, 0.07)); } P('#7a1616', sb + 1.5, G + 0.9, 0, 0.04, 0.06, 2.4);
    P('#2f4b5e', sb + 0.9, G, -cl, 0.6, 0.45, 1.8); P('#3b5d74', sb + 1.15, G + 0.45, -cl, 0.12, 0.4, 1.8);
  } else { // shelving across the back wall, an island of goods, and a counter with a till and someone serving
    const pm = PROD[k.type] || PROD.grocery, sl = iw - 0.5;
    P(pm, sb + ID - 0.3, G + 0.25, 0, 0.34, 2.1, sl); P('#d9d4c8', sb + ID - 0.3, G, 0, 0.4, 0.25, sl); for (let y = 0.25; y < 2.4; y += 0.42) P('#e9e6df', sb + ID - 0.32, G + y, 0, 0.42, 0.03, sl); P('#e9e6df', sb + ID - 0.3, G + 2.35, 0, 0.42, 0.06, sl);
    if (iw > 8) { P(pm, sb + 1.75, G + 0.2, -cl * 0.55, 0.55, 1.26, 2.6); P('#d9d4c8', sb + 1.75, G, -cl * 0.55, 0.6, 0.2, 2.7); P('#e9e6df', sb + 1.75, G + 1.46, -cl * 0.55, 0.62, 0.04, 2.7); }
    P('#f1eee8', sb + 2.0, G, cl, 0.65, 0.95, 2.2); P(k.bg, sb + 1.66, G + 0.1, cl, 0.03, 0.75, 2.2); P('#2b2e33', sb + 2.0, G + 0.95, cl, 0.75, 0.05, 2.3);
    P('#1b1e22', sb + 2.05, G + 1.0, cl + 0.6, 0.3, 0.26, 0.36); P(SCREEN_BLUE, sb + 1.9, G + 1.12, cl + 0.6, 0.02, 0.2, 0.3); // till
    shopStaff(c, sb + 2.75, cl - 0.2, G + 0.03);
    if (k.type === 'pharmacy') { for (const [dw, dh] of [[0.9, 0.3], [0.3, 0.9]]) P(CROSS_GREEN, sb - 0.85, G + gh + 0.2 - dh / 2, s * (bw / 2 - 0.5), 0.1, dh, dw); P(CROSS_GREEN, sb + ID - 0.12, G + 2.55, cl, 0.04, 0.16, 0.5); P(CROSS_GREEN, sb + ID - 0.12, G + 2.38, cl, 0.04, 0.5, 0.16); }
    if (k.type === 'grocery' || k.type === 'bakery') for (let i = 0; i < 3; i++) { const lat = -cl + (i - 1) * 0.95; P('#8a6a48', sb + 0.75, G, lat, 0.7, 0.55, 0.8); for (let a2 = 0; a2 < 6; a2++) B.add(T.blob, pick(r, k.type === 'bakery' ? ['#c98a45', '#b0702e', '#e0b070'] : ['#d7302a', '#f2b01e', '#2a8a4a', '#ef7d22']), M(X(sb + 0.55 + (a2 % 2) * 0.38), G + 0.62, lat - 0.25 + Math.floor(a2 / 2) * 0.25, 0.24, 0.2, 0.24)); } // crates of fruit, or baskets of bread, in the window
    if (k.type === 'fashion') for (let i = 0; i < 2; i++) { const lat = -cl + (i - 0.5) * 1.3; B.add(T.cyl, '#d9c7b2', M(X(sb + 0.7), G + 1.0, lat, 0.34, 0.85, 0.22)); B.add(T.blob, '#d9c7b2', M(X(sb + 0.7), G + 1.62, lat, 0.2, 0.24, 0.2)); P(pick(r, ['#7a1616', '#1c2e55', '#e3d3a4']), sb + 0.7, G + 0.55, lat, 0.3, 0.9, 0.4); P('#2b2e33', sb + 0.7, G, lat, 0.05, 0.6, 0.05); } // mannequins
  }
  // the shopfront: a low riser, big sheets of clear glass in dark frames, and in the middle a pair of glazed doors
  const panes = Math.max(3, Math.round((bw - 1.6) / 2.4)) | 1, pwid = (bw - 1.6) / panes, mid0 = (panes - 1) / 2, STEELD = '#c9ced3';
  P(DARK, sb - 0.03, G + 3.0, 0, 0.1, 0.16, bw - 0.3); for (let i = 0; i <= panes; i++) P(DARK, sb - 0.04, G, -bw / 2 + 0.8 + i * pwid, 0.12, 3.1, 0.12);
  for (let i = 0; i < panes; i++) { const lat = -bw / 2 + 0.8 + (i + 0.5) * pwid;
    if (i !== mid0) { P(DARK, sb - 0.03, G, lat, 0.1, 0.45, pwid - 0.12); P(SHOP_CLEAR, sb - 0.01, G + 0.45, lat, 0.03, 2.55, pwid - 0.12); continue; }
    const dw = Math.min(1.9, pwid - 0.3), lw = dw / 2; P(DARK, sb - 0.03, G + 2.3, lat, 0.1, 0.1, pwid - 0.12); P(SHOP_CLEAR, sb - 0.01, G + 2.4, lat, 0.03, 0.6, pwid - 0.12);     // the transom over the doors
    for (const e of [-1, 1]) { const ll = lat + e * lw / 2; P(SHOP_CLEAR, sb - 0.01, G + 0.3, ll, 0.03, 2.0, lw - 0.1); // each leaf: glass in a steel frame, a kick plate, and a long pull handle
      for (const q of [-1, 1]) P(STEELD, sb - 0.02, G + 0.04, ll + q * (lw / 2 - 0.035), 0.06, 2.26, 0.07); P(STEELD, sb - 0.02, G + 2.24, ll, 0.06, 0.07, lw); P(STEELD, sb - 0.02, G + 0.04, ll, 0.06, 0.28, lw);
      B.add(T.cyl, STEELD, M(X(sb - 0.12), G + 1.2, lat + e * 0.14, 0.045, 0.9, 0.045)); for (const yy of [0.82, 1.58]) P(STEELD, sb - 0.08, G + yy, lat + e * 0.14, 0.1, 0.035, 0.035); }
    for (const e of [-1, 1]) if (pwid - dw > 0.5) { const sw = (pwid - dw) / 2 - 0.06, ll = lat + e * (dw / 2 + sw / 2 + 0.03); P(DARK, sb - 0.03, G, ll, 0.1, 2.3, 0.06); P(SHOP_CLEAR, sb - 0.01, G + 0.3, ll, 0.03, 2.0, sw); P(DARK, sb - 0.03, G, ll, 0.1, 0.3, sw); }
    P('#3a3d42', sb - 0.55, G, lat, 1.0, 0.025, dw + 0.2);                                                                                         // door mat
    if (!bank) { const m = new THREE.Mesh(PLANE, OPEN_SIGN); m.scale.set(0.42, 0.21, 1); m.position.set(X(sb - 0.03), G + 1.72, lat - lw / 2); m.rotation.y = -s * Math.PI / 2; c.addMesh(m); }
  }
  if (bank) { const al = -side * (bw / 2 - 1.5); P('#2b2e33', sb - 0.1, G, al, 0.2, 2.2, 1.1); P(SCREEN_BLUE, sb - 0.21, G + 1.2, al, 0.02, 0.42, 0.56); P('#c9ced3', sb - 0.22, G + 0.85, al, 0.06, 0.22, 0.6); P('#12355b', sb - 0.21, G + 1.8, al, 0.02, 0.26, 0.9); } // the cash machine
  for (const e of [-1, 1]) P(body === TEX.render || body === TEX.renderGrey ? TEX.stone : TEX.renderGrey, sb - 0.06, G, e * (bw / 2 - 0.35), 0.14, gh + 0.5, 0.72); // piers at the ends
  // the signboard: a lit face in a dark case right across the front, with small lamps over it
  { const sl = Math.min(bw - 0.8, 8.5), sh = sl * 0.25 > 1.5 ? 1.5 : Math.max(1.0, sl * 0.25), y0 = G + 3.28, a = -s * sl / 2;
    P(DARK, sb - 0.16, y0 - 0.07, 0, 0.22, sh + 0.14, sl + 0.14);
    B.quadF(k.sign, V3(X(sb - 0.275), y0, a), V3(X(sb - 0.275), y0, -a), V3(X(sb - 0.275), y0 + sh, -a), V3(X(sb - 0.275), y0 + sh, a), 0, 1);
    for (let q = -sl / 2 + 0.7; q < sl / 2; q += 1.5) { P(DARK, sb - 0.45, y0 + sh + 0.12, q, 0.5, 0.04, 0.04); P(DARK, sb - 0.7, y0 + sh + 0.02, q, 0.1, 0.14, 0.2); }
    const aw = 1.5, ay1 = G + 3.14, ay0 = ay1 - 0.5, n = Math.round(sl); // the awning
    B.quadF(k.awn, V3(X(sb - aw), ay0, a), V3(X(sb - aw), ay0, -a), V3(X(sb - 0.02), ay1, -a), V3(X(sb - 0.02), ay1, a), 0, 1, 0, n); B.quadF(k.awn, V3(X(sb - aw), ay0 - 0.22, a), V3(X(sb - aw), ay0 - 0.22, -a), V3(X(sb - aw), ay0, -a), V3(X(sb - aw), ay0, a), 0.88, 1, 0, n);
    for (const e of [-1, 1]) P(DARK, sb - aw / 2, ay0 - 0.02, e * sl / 2, aw, 0.04, 0.04);
    P(DARK, sb - 0.75, G + gh + (two ? 0.9 : 0.1), s * (bw / 2 - 0.5), 1.1, 0.05, 0.05); P(k.bg, sb - 0.75, G + gh + (two ? 0.05 : -0.75), s * (bw / 2 - 0.5), 0.9, 0.8, 0.07); }                      // a small hanging sign in the shop's colour
  if (two) { P(TRIM, mid, G + gh + 0.38, 0, d + 0.1, 0.18, bw + 0.1); // upstairs: framed windows, and a band under them
    const nw = Math.max(2, Math.round(bw / 3.4)); for (let i = 0; i < nw; i++) { const lat = -bw / 2 + bw * (i + 0.5) / nw; P(GLASS_DARK, sb - 0.005, G + gh + 1.0, lat, 0.03, 1.4, 1.3); if (WINDOW.parts) for (const p of WINDOW.parts) B.add(p.tpl, p.mt, M(X(sb - 0.03), G + gh + 0.95, lat, 1.4, 1.5, 1.4)); P(TRIM, sb - 0.12, G + gh + 0.85, lat, 0.26, 0.08, 1.7); }
    for (const e of [-1, 1]) for (const q of [-0.25, 0.25]) { P(TRIM, mid + q * d, G + gh + 0.92, e * (bw / 2 + 0.05), 1.36, 1.56, 0.14); P(GLASS_DARK, mid + q * d, G + gh + 1.0, e * (bw / 2 + 0.09), 1.2, 1.4, 0.08); } }
  P(TRIM, mid, top, 0, d + 0.3, 0.16, bw + 0.3); P(body, mid, top + 0.16, 0, d + 0.06, 0.5, bw + 0.06); P(TRIM, mid, top + 0.66, 0, d + 0.2, 0.08, bw + 0.2); // cornice and parapet
  for (const e of [-1, 1]) B.add(T.cyl, '#e7e6e0', M(X(sb + 0.5), G + H / 2, e * (bw / 2 + 0.09), 0.1, H, 0.1));
  return { H: top + 0.8, d: sb + d };
}
const DARK_BODIES = [TEX.brickGrey, photoWall(brickDarkJpg, 1.4, '#8d929b'), photoWall(brickRedJpg, 1.5, '#7d5d55'), photoWall(stoneJpg, 2.6, '#8a857d'), photoWall(brickTanJpg, 2.0, '#7f7466')]; // dark brick and stone, for the tall blocks
function builtApartment(c, bodyM) {
  const { P, B, r, w, s } = c, G = 0.3, sb = 4.4, TRIM = '#f1ede4', DARK = '#2a2d31', STEEL_R = '#cfd4d8', PIPE = '#e7e6e0';
  const body = bodyM || (c.tall ? pick(r, DARK_BODIES) : pick(r, [TEX.brickRed, TEX.brickTan, TEX.brickGrey, TEX.brickRed, TEX.brickTan, TEX.render])), core = c.tall ? pick(r, [TEX.renderGrey, TEX.stone, TEX.brickGrey]) : body === TEX.render || body === TEX.renderGrey ? pick(r, [TEX.brickRed, TEX.stone]) : pick(r, [TEX.render, TEX.renderGrey]);
  const n = c.tall ? 7 + Math.floor(r() * 4) : 4 + Math.floor(r() * 4), ST = 3.05, H = n * ST, bw = w - 2.6, d = 10.6, mid = sb + d / 2, top = G + H, frame = r() < 0.5 ? TRIM : DARK, cw = 3.2, bays = Math.max(2, Math.round((bw - cw) / 2 / 3.3)), bayW = (bw - cw) / 2 / bays;
  // forecourt, the low wall with railings along the pavement, a gate in the middle, and walls down the sides of the plot
  P(PAVE_C, sb / 2 + 0.2, 0, 0, sb - 0.1, G, w - 0.3); frontFence(c, 0, 3.4, body === TEX.render || body === TEX.renderGrey ? TEX.brickRed : body, body, true);
  { const gm = GATES[Math.floor(r() * GATES.length)]; if (gm.parts) for (const p of gm.parts) B.add(p.tpl, p.mt, M(s * (F + 0.17), 0, 0, 3.4, 2.1, 3.5)); }
  for (const e of [-1, 1]) { P(body, (sb + d) / 2 + 0.15, 0, e * (w / 2 - 0.09), sb + d - 0.1, 2.0, 0.18); bush(B, r, s * (F + 1.6), G, e * (w / 2 - 1.2), 1.0, BROAD, 7); }
  P('#8d8980', mid, 0, 0, d + 0.4, G, bw + 0.4);
  P(body, mid, G, 0, d, H, bw); P(core, sb - 0.3, G, 0, 0.8, H + 0.9, cw);                                         // the body, and the stair tower standing forward and a little taller
  for (let L = 1; L <= n; L++) P(TRIM, mid, G + L * ST - 0.12, 0, d + 0.12, 0.22, bw + 0.12);                       // a band at every floor
  P(core === TEX.stone ? TEX.stone : body, mid, G, 0, d + 0.08, 0.7, bw + 0.08);
  const aptWin = (dep, yb, lat, h, wd) => { P(GLASS_DARK, dep - 0.005, yb + 0.05, lat, 0.03, h - 0.1, wd - 0.1); if (WINDOW.parts) for (const p of WINDOW.parts) B.add(p.tpl, p.mt, M(s * (F + dep - 0.03), yb, lat, wd, h, wd)); P(frame, dep - 0.12, yb - 0.1, lat, 0.26, 0.08, wd + 0.3); P(frame, dep - 0.1, yb + h, lat, 0.22, 0.1, wd + 0.24); };
  const tube = (dep, y, lat, len, alongLat, rad) => B.add(T.cyl, STEEL_R, alongLat ? M(s * (F + dep), y, lat, rad, len, rad, Math.PI / 2, 0, 0) : M(s * (F + dep), y, lat, rad, len, rad, 0, 0, Math.PI / 2));
  for (let L = 0; L < n; L++) { const y = G + L * ST;
    P(GLASS_DARK, sb - 0.72, y + (L ? 0.5 : 2.5), 0, 0.06, L ? 2.0 : 0.4, 1.5); P(frame, sb - 0.74, y + (L ? 0.42 : 2.45), 0, 0.05, 0.08, 1.7);   // the stair windows, one to a landing
    for (const e of [-1, 1]) for (let b = 0; b < bays; b++) { const lat = e * (cw / 2 + bayW * (b + 0.5)), balc = L > 0 && (b + (e > 0 ? 1 : 0)) % 2 === 0;
      if (balc) { // a balcony: a slab, a glazed door on to it, and a rail round three sides
        const bl = bayW - 0.5, bd = 1.25; P(TRIM, sb - bd / 2, y - 0.12, lat, bd, 0.14, bl); balconyDoor(c, sb, y + 0.02, lat, frame);
        for (const yy of [0.3, 0.62]) tube(sb - bd + 0.06, y + 0.02 + yy, lat, bl - 0.08, true, 0.03); tube(sb - bd + 0.06, y + 1.0, lat, bl - 0.04, true, 0.055);
        for (const q of [-1, 1]) { B.add(T.cyl, STEEL_R, M(s * (F + sb - bd + 0.06), y + 0.5, lat + q * (bl / 2 - 0.05), 0.05, 1.0, 0.05)); tube(sb - bd / 2, y + 1.0, lat + q * (bl / 2 - 0.05), bd - 0.1, false, 0.055); tube(sb - bd / 2, y + 0.46, lat + q * (bl / 2 - 0.05), bd - 0.1, false, 0.03); }
      } else aptWin(sb, y + 0.95, lat, 1.45, Math.min(1.7, bayW - 1.1));
    }
    for (const e of [-1, 1]) for (const q of [-0.28, 0.02, 0.3]) { const dep = mid + q * d; P(frame, dep, y + 0.87, e * (bw / 2 + 0.05), 1.36, 1.56, 0.14); P(GLASS_DARK, dep, y + 0.95, e * (bw / 2 + 0.09), 1.2, 1.4, 0.08); P(frame, dep, y + 0.8, e * (bw / 2 + 0.1), 1.5, 0.07, 0.24); } // windows down each side
  }
  // the entrance: steps, glass doors under a canopy on two posts, the block's lamp over it
  P('#bdb7aa', sb - 1.5, 0, 0, 1.7, G, cw + 1.2); P(LOBBY, sb - 0.72, G, 0, 0.06, 2.3, 2.2); P(DARK, sb - 1.5, G + 2.55, 0, 2.0, 0.14, cw + 1.4);
  for (const e of [-1, 1]) P(DARK, sb - 2.3, G, e * (cw / 2 + 0.5), 0.14, 2.55, 0.14); P(GLOW, sb - 0.76, G + 2.36, 0, 0.06, 0.1, 1.2);
  for (const e of [-1, 1]) { const pl = e * (bw / 2 + 0.09), px = sb + 0.4; B.add(T.cyl, PIPE, M(s * (F + px), G + H / 2, pl, 0.11, H, 0.11)); for (let y = G + 0.8; y < top; y += 2.4) P('#b9b8b2', px, y, pl - e * 0.03, 0.16, 0.05, 0.11); }
  P('#ece8df', mid, top - 0.02, 0, d + 0.9, 0.1, bw + 0.9); P(PIPE, mid - (d + 1.1) / 2, top + 0.06, 0, 0.13, 0.1, bw + 1.2); P(PIPE, mid + (d + 1.1) / 2, top + 0.06, 0, 0.13, 0.1, bw + 1.2);
  hipRoof(c, pick(r, ZINC), mid, 0, d + 1.1, bw + 1.1, top + 0.14, 1.9);
  return { H: top + 2.1, d: sb + d };
}
const HOME_DOORS = {};
function balconyDoor(c, dep, y, lat, frame, col = '#5f3c22') { // a panelled door in its frame, with a glazed light over it, opening on to a balcony
  const { P, s } = c; P(frame, dep - 0.04, y, lat, 0.1, 2.45, 1.24); P(GLASS_DARK, dep - 0.07, y + 2.14, lat, 0.05, 0.26, 1.04);
  const m = new THREE.Mesh(PLANE, HOME_DOORS[col] || (HOME_DOORS[col] = doorMat(col))); m.scale.set(1.0, 2.1, 1); m.position.set(s * (F + dep - 0.1), y + 1.06, lat); m.rotation.y = -s * Math.PI / 2; c.addMesh(m);
}
function builtHome(c) {
  const { P, B, r, w, s } = c, G = 0.3, sb = 4.6, TRIM = '#f4f1ea', DARK = '#2a2d31';
  const wall = pick(r, COMPOUND_WALLS), accent = pick(r, [TEX.stone, TEX.brickRed, TEX.brickTan, TEX.brickGrey, TEX.stone]), roofM = pick(r, ZINC), flat = false, STEEL_R = '#cfd4d8', PIPE = '#e7e6e0';
  const hw = clamp(w - 3.4, 7.5, 12.5), d = 8.6 + r() * 1.6, ST = 3.15, H = 2 * ST, side = r() < 0.5 ? -1 : 1, bayW = hw * (0.38 + r() * 0.1), bayD = 1.5;
  const bl = side * (hw / 2 - bayW / 2), d0 = sb + bayD, mid = d0 + d / 2, pw = hw - bayW, cl = -side * bayW / 2, top = G + H, frame = r() < 0.5 ? TRIM : DARK;
  compound(c, sb, bayD + d, G);
  P('#8d8980', sb + (bayD + d) / 2, 0, 0, bayD + d + 0.4, G, hw + 0.4);                                   // the slab it stands on
  P(wall, mid, G, 0, d, H, hw); P(accent, sb + bayD / 2 + 0.05, G, bl, bayD + 0.1, H + (flat ? 0.45 : 0), bayW); // main block, and the bay that stands forward of it
  P(TRIM, mid, G + ST - 0.1, 0, d + 0.1, 0.2, hw + 0.1); P(accent, mid, G, 0, d + 0.06, 0.55, hw + 0.06);        // a band where the upper floor begins, and a base course
  const frontWin = (dep, yb, lat, h, wd) => { if (!WINDOW.parts) return win3D(c, dep, yb, lat, h, wd, frame); // a real window, with a sill under it and a hood over it
    for (const p of WINDOW.parts) B.add(p.tpl, p.mt, M(s * (F + dep - 0.03), yb, lat, wd, h, wd)); P(GLASS_DARK, dep - 0.005, yb + 0.05, lat, 0.03, h - 0.1, wd - 0.1); P(frame, dep - 0.12, yb - 0.1, lat, 0.26, 0.08, wd + 0.3); P(frame, dep - 0.1, yb + h, lat, 0.22, 0.1, wd + 0.24); };
  const sideWin = (dep, yb, e, h, wd) => { if (WINDOW.parts) { for (const p of WINDOW.parts) B.add(p.tpl, p.mt, M(s * (F + dep), yb, e * (hw / 2 + 0.03), wd, h, wd, 0, Math.PI / 2, 0)); P(GLASS_DARK, dep, yb + 0.05, e * (hw / 2 + 0.005), wd - 0.1, h - 0.1, 0.03); P(frame, dep, yb - 0.1, e * (hw / 2 + 0.1), wd + 0.3, 0.08, 0.24); return; }
    P(frame, dep, yb - 0.08, e * (hw / 2 + 0.05), wd + 0.16, h + 0.16, 0.14); P(GLASS_DARK, dep, yb, e * (hw / 2 + 0.09), wd, h, 0.08); P(frame, dep, yb - 0.15, e * (hw / 2 + 0.1), wd + 0.3, 0.07, 0.24); };
  for (let L = 0; L < 2; L++) { const y = G + L * ST; // windows: the bay's big ones, the ones beside the door and on the balcony, and two down each side
    if (L === 0 && w > 15.5 && r() < 0.45) { P('#d7d3ca', sb - 0.02, G, bl, 0.08, 2.25, bayW - 0.7); for (let q = 0.3; q < 2.2; q += 0.38) P('#bdb8ad', sb - 0.07, G + q, bl, 0.03, 0.04, bayW - 0.74); P(frame, sb - 0.03, G + 2.25, bl, 0.12, 0.14, bayW - 0.5); } // a garage door
    else frontWin(sb, y + 0.95, bl, 1.55, Math.min(2.2, bayW - 1.0));
    if (L) balconyDoor(c, d0, y + 0.02, cl - side * (pw / 2 - 1.0), frame); else frontWin(d0, y + 0.95, cl - side * (pw / 2 - 1.0), 1.45, 1.3);
    if (L) frontWin(d0, y + 0.95, cl + side * (pw / 2 - 1.1), 1.45, 1.2);
    for (const e of [-1, 1]) for (const q of [-0.26, 0.24]) sideWin(mid + q * d, y + 0.95, e, 1.4, 1.25);
  }
  // the way in: steps up to a porch on two columns, the front door in its frame with a lamp beside it, and the balcony above
  const dl = cl + side * (pw / 2 - 1.05), pd = 1.6;
  P('#bdb7aa', d0 - pd / 2, 0, cl, pd, G, pw - 0.2); P('#aaa498', d0 - pd - 0.2, 0, cl, 0.4, G * 0.5, pw - 0.8);
  for (const e of [-1, 1]) { P(TRIM, d0 - pd + 0.2, G, cl + e * (pw / 2 - 0.3), 0.26, ST - 0.14, 0.26); P(TRIM, d0 - pd + 0.2, G, cl + e * (pw / 2 - 0.3), 0.36, 0.14, 0.36); }
  P(TRIM, d0 - pd / 2, G + ST - 0.16, cl, pd + 0.1, 0.18, pw);
  { const y0 = G + ST + 0.02, fx = d0 - pd + 0.08, tube = (dep, y, lat, len, alongLat, rad = 0.045) => B.add(T.cyl, STEEL_R, alongLat ? M(s * (F + dep), y, lat, rad, len, rad, Math.PI / 2, 0, 0) : M(s * (F + dep), y, lat, rad, len, rad, 0, 0, Math.PI / 2)); // a stainless-steel handrail: posts, three rails and a round top rail, across the front and back along both sides
    for (let q = -pw / 2 + 0.05; q <= pw / 2 - 0.04; q += (pw - 0.1) / Math.max(2, Math.round(pw / 1.1))) B.add(T.cyl, STEEL_R, M(s * (F + fx), y0 + 0.5, cl + q, 0.05, 1.0, 0.05));
    for (const yy of [0.25, 0.5, 0.75]) tube(fx, y0 + yy, cl, pw - 0.1, true, 0.028); tube(fx, y0 + 1.02, cl, pw - 0.06, true, 0.06);
    for (const e of [-1, 1]) { for (const yy of [0.25, 0.5, 0.75]) tube(d0 - pd / 2, y0 + yy, cl + e * (pw / 2 - 0.05), pd - 0.1, false, 0.028); tube(d0 - pd / 2, y0 + 1.02, cl + e * (pw / 2 - 0.05), pd - 0.06, false, 0.06); } }
  P(frame, d0 - 0.04, G, dl, 0.1, 2.3, 1.3); P(GLOW, d0 - 0.12, G + 1.85, dl + side * 0.95, 0.08, 0.22, 0.14); P('#1b1b1c', d0 - 0.1, G + 2.07, dl + side * 0.95, 0.12, 0.05, 0.2);
  { const col = pick(r, ['#5f3c22', '#2d4a66', '#3d3f44', '#7a2f26']), m = new THREE.Mesh(PLANE, HOME_DOORS[col] || (HOME_DOORS[col] = doorMat(col))); m.scale.set(1.06, 2.16, 1); m.position.set(s * (F + d0 - 0.1), G + 1.1, dl); m.rotation.y = -s * Math.PI / 2; c.addMesh(m); }
  for (const e of [-1, 1]) { const px = d0 + 0.35, pl = e * (hw / 2 + 0.09); // rainwater pipes: round, clipped to the wall, with a bend at the foot, fed by a gutter under the eaves
    B.add(T.cyl, PIPE, M(s * (F + px), G + H / 2 + 0.1, pl, 0.1, H - 0.1, 0.1)); for (let y = G + 0.6; y < top; y += 1.5) P('#b9b8b2', px, y, pl - e * 0.03, 0.14, 0.05, 0.1); B.add(T.cyl, PIPE, M(s * (F + px), G + 0.14, pl + e * 0.12, 0.1, 0.3, 0.1, Math.PI / 2, 0, 0));
    P(PIPE, mid, top + 0.05, e * (hw / 2 + 0.56), d + 1.15, 0.1, 0.13); }
  P(PIPE, mid - (d + 1.1) / 2 - 0.01, top + 0.05, 0, 0.13, 0.1, hw + 1.2); P(PIPE, mid + (d + 1.1) / 2 + 0.01, top + 0.05, 0, 0.13, 0.1, hw + 1.2);
  P('#dcdcd8', mid + 1.2, G + ST + 0.5, -side * (hw / 2 + 0.2), 0.85, 0.6, 0.34); P('#b9bcbc', mid + 1.2, G + ST + 0.56, -side * (hw / 2 + 0.38), 0.6, 0.46, 0.02); // an air conditioner on the side wall
  if (flat) { // a flat roof: a low parapet, and a thin slab that reaches well out over the walls
    P(wall, mid, top, 0, d, 0.45, hw); P(TRIM, mid, top + 0.45, 0, d + 0.12, 0.07, hw + 0.12); P(DARK, mid - 0.5, top - 0.02, 0, d + 1.6, 0.14, hw + 1.1); P(DARK, sb + bayD / 2, top + 0.45, bl, bayD + 0.5, 0.1, bayW + 0.3);
    return { H: top + 0.6, d: sb + bayD + d };
  }
  P('#ece8df', mid, top - 0.03, 0, d + 0.9, 0.1, hw + 0.9); P(TRIM, mid, top + 0.07, 0, d + 1.0, 0.14, hw + 1.0); // soffit and fascia under a tiled hip roof
  hipRoof(c, roofM, mid, 0, d + 1.1, hw + 1.1, top + 0.2, 2.2 + r() * 0.5);
  P('#ece8df', sb + bayD / 2 + 0.3, top - 0.03, bl, bayD + 1.2, 0.1, bayW + 0.7); hipRoof(c, roofM, sb + bayD / 2 + 0.5, bl, bayD + 1.9, bayW + 0.9, top + 0.07, 1.3);
  return { H: top + 2.6, d: sb + bayD + d };
}
let villaTurn = 0;
const sunAt = { x: 1e9, z: 1e9, n: 0 };
function realBuilding(c, type) { // the model that best suits this lot, stretched a little sideways to fill it
  const { B, r, w, s, D } = c, homes = !!D.residential || type === 'duplex' || type === 'terrace' || type === 'bungalow', ok = BLD.filter((q) => q.parts && (q.kind === 'home') === homes && (q.villa ? Math.min((w - 1.4) / q.wide, 12.6 / q.deep) >= 0.5 : w / q.wide > (q.kind === 'small' ? 0.5 : homes ? 0.66 : 0.72) && w / q.wide < 1.4) && (q.kind !== 'tall' || type === 'glass' || type === 'office') && !(homes && q.row)); // // (the big blocks of flats are kept out of the estate) a terraced house has blank side walls, so it is not stood among detached houses
  const force = /bld=(\d+|all)/.exec(location.hash), allV = BLD.filter((q) => q.villa && q.parts); // testing only: one chosen model everywhere, or every estate house in turn
  if (!ok.length && !force) return null;
  const q = force ? (force[1] === 'all' ? allV[villaTurn++ % allV.length] : BLD[+force[1]]) : ok.some((o) => o.villa) ? (() => { let o = ok[villaTurn++ % ok.length]; if (o.heavy && villaTurn % 3) o = ok[villaTurn++ % ok.length]; return o; })() : pick(r, ok), sb = homes ? Math.max(q.yard || 0, q.villa ? 4.4 : 4.8) : q.yard || 0, G = 0.3; // houses are taken in turn, so neighbours differ
  let kw = w / q.wide, k = clamp(kw, 0.85, 1.12), deep = Math.min(q.deep * k, 17 - sb);
  if (q.villa) { kw = k = Math.min(1.1, (w - 1.4) / q.wide, (17 - sb) / q.deep); deep = q.deep * k; } // a detached house keeps its true proportions
  const H = q.high * k; // G: the building stands on the pavement, not down at road level
  const { P } = c;
  P('#8d8980', sb + deep / 2, 0, 0, deep, G, w - 0.1); // footing
  if (homes) compound(c, sb, deep, G);
  else if (sb) { // a front yard: lawn, a paved path to the door, shrubs, and a fence with a gate along the pavement
    P('#5c8443', sb / 2 + 0.1, 0, 0, sb - 0.2, G, w - 0.3);
    P('#cfc8b8', sb / 2 + 0.1, 0, 0, sb - 0.2, G + 0.02, 1.5);
    if (r() < 0.5) frontFence(c, 0, 1.7, pick(r, [TEX.stone, TEX.brickRed, TEX.brickTan]), mat(pick(r, ['#e6e1d6', '#d8d3c6', '#f1ede2'])));
    else estateFence(c, 0, 1.7, mat(pick(r, ['#e6e1d6', '#d8d3c6', '#cfc6b2'])));
    for (const e of [-1, 1]) for (let lat = 1.7; lat < w / 2 - 0.8; lat += 1.5 + r()) bush(B, r, s * (F + sb * (0.4 + r() * 0.35)), G, e * lat, 0.8 + r() * 0.3, r() < 0.4 ? FLOWERS : BROAD, 6);
  }
  for (const p of q.parts) B.add(p.tpl, p.mt, M(s * (F + sb + deep / 2), G, 0, kw, k, deep / q.deep, 0, -s * Math.PI / 2, 0));
  if (q.row) { // a terraced house is only modelled from the front: give its blank sides and back real brick walls
    const wall = q.wall || TEX.brickRed;
    for (const e of [-1, 1]) P(wall, sb + deep / 2 + 0.15, G, e * (w / 2 + 0.04), deep - 0.3, H * 0.86, 0.14);
    P(wall, sb + deep + 0.04, G, 0, 0.14, H * 0.86, w + 0.1);
  }
  return { H: H + G, d: sb + deep };
}
// A shop on the street: the real building at its true proportions on a paved forecourt, with its name on a board by the pavement
const storeSign = (text) => new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 136, (g, w, h) => { g.fillStyle = '#16202b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd24a'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 68px "Arial Black", Impact, sans-serif'; g.fillText(text, w / 2, h / 2 + 4); }) });
const STORE_AT = {}, _m4 = new THREE.Matrix4();
BUILD.store = (c) => {
  const { P, B, w, s, rent: def } = c, q = BLD.find((o) => o.id === def.store), G = 0.3, sb = 3;
  P(PAVE_C, 8.5, 0, 0, 17, G, w - 0.2);
  for (const lat of [-w / 2 + 0.7, -w / 2 + 4.9]) P('#2b2e33', 0.5, 0, lat, 0.12, 3.1, 0.12);
  const m = new THREE.Mesh(PLANE, def.sign || (def.sign = storeSign(def.label))); m.scale.set(4.4, 1.15, 1); m.position.set(s * (F + 0.5), 3.65, -w / 2 + 2.8); m.rotation.y = -s * Math.PI / 2; c.addMesh(m);
  c.g.updateMatrix(); _v.set(s * (F - 1.2), 0, 0).applyMatrix4(_m4.multiplyMatrices(c.g.matrix, B.frame)); STORE_AT[def.store] = [_v.x, _v.z];
  if (def.store === 'furniture') return builtApartment(c, TEX.brickRed); // the furniture shop is a tall brick building
  if (!q || !q.parts) return { H: 4, d: 17 };
  const k = Math.min(1.15, (w - 1) / q.wide, 13 / q.deep), deep = q.deep * k;
  for (const p of q.parts) B.add(p.tpl, p.mt, M(s * (F + sb + deep / 2), G, 0, k, k, k, 0, -s * Math.PI / 2 + (q.turn || 0), 0));
  return { H: q.high * k + G, d: sb + deep };
};
const ADDR = new Map(); // "street|number" -> where that house's front is, for errands
function noteAddress(c, type, num) {
  if (!num || !c.street || c.rent || type === 'plot' || type === 'church') return;
  c.g.updateMatrix(); const m = new THREE.Matrix4().multiplyMatrices(c.g.matrix, c.B.frame), lat = 0; // the address is the middle of the house's front
  const a = new THREE.Vector3(c.s * (F - 1.5), 0, lat).applyMatrix4(m), b = new THREE.Vector3(c.s * (F - 0.62), 0, lat).applyMatrix4(m);
  const nook = [-1, 1].map((e) => { const q = new THREE.Vector3(c.s * (F - 0.36), 0, e * (c.w / 2 - (e < 0 ? 0.95 : 0.6))).applyMatrix4(m); return [q.x, q.z]; }); // hard against the wall, at either end of the plot
  ADDR.set(c.street + '|' + num, { num, street: c.street, x: a.x, z: a.z, px: b.x, pz: b.z, nook });
}
function runLot(c, type, prevH, num) {
  noteAddress(c, type, num);
  if (BLD_FOR[type] && !c.rent) { const out = c.D.residential ? (type === 'shop' ? builtShop(c) : type === 'modern' ? builtApartment(c) : builtHome(c)) : realBuilding(c, type); if (out) { if (num) numberPlate(c, num); return out.H; } }
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
// Real trees. Three modelled trees from Sketchfab (makers credited in models/CREDITS.txt) - a date palm and two leafy
// street trees - stand in for the ones built from blocks. Each is kept as a template one unit tall; planting one adds a
// copy, turned at random and grown to its own height, into the same merged mesh as the rest of its street, so a whole
// avenue still costs a couple of draw calls. Leaves and trunks keep swaying in the wind.
// Ground plants: real shrub, fern and flower models (Sketchfab, see models/CREDITS.txt), each brought to one metre across.
const SHRUBS = { ready: 0, all: [{ data: sShrub, grow: 1.7 }, { data: sBush, grow: 1.6 }, { data: sFern, grow: 2.1 }, { data: sTrop, grow: 2.3 }, { data: sFlower, grow: 1.6, bright: 1.7 }] };
SHRUBS.green = SHRUBS.all.slice(0, 4); SHRUBS.flower = SHRUBS.all[4];
for (const q of SHRUBS.all) new GLTFLoader().parse(q.data.buffer.slice(q.data.byteOffset, q.data.byteOffset + q.data.byteLength), '', (gltf) => {
  const root = gltf.scene, box = new THREE.Box3(), meshes = []; root.updateMatrixWorld(true); box.setFromObject(root);
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const k = 1 / Math.max(box.max.x - box.min.x, box.max.z - box.min.z), fit = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2));
  q.parts = meshes.map((o) => {
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(fit, o.matrixWorld)); g.computeVertexNormals();
    return { tpl: g, mt: new THREE.MeshLambertMaterial({ map: o.material.map, color: o.material.map ? new THREE.Color().setScalar(q.bright || 1.2) : o.material.color, side: THREE.DoubleSide, alphaTest: 0.4 }) };
  });
  SHRUBS.ready++;
}, (e) => { SHRUBS.ready++; console.error('plant failed to load', e); });
const TREE_MODELS = { palm: { data: tPalm }, tree: { data: tTree }, tree2: { data: tTree2 } };
treesLeft += Object.keys(TREE_MODELS).length;
for (const q of Object.values(TREE_MODELS)) new GLTFLoader().parse(q.data.buffer.slice(q.data.byteOffset, q.data.byteOffset + q.data.byteLength), '', (gltf) => {
  const root = gltf.scene, box = new THREE.Box3(), meshes = []; root.updateMatrixWorld(true); box.setFromObject(root);
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  let bx = 0, bz = 0, bn = 0; const low = box.min.y + (box.max.y - box.min.y) * 0.06, k = 1 / (box.max.y - box.min.y); // the foot of the trunk is where the lowest points are, not the middle of the crown
  for (const o of meshes) { const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { _v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); if (_v.y < low) { bx += _v.x; bz += _v.z; bn++; } } }
  const fit = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeTranslation(-bx / bn, -box.min.y, -bz / bn));
  q.parts = meshes.map((o) => {
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(fit, o.matrixWorld)); g.computeVertexNormals();
    const leafy = o.material.alphaTest > 0 || o.material.transparent;
    return { tpl: g, mt: windy(new THREE.MeshLambertMaterial({ map: o.material.map, side: THREE.DoubleSide, alphaTest: leafy ? 0.45 : 0 }), leafy) };
  });
  treesLeft--;
}, (e) => { treesLeft--; console.error('tree failed to load', e); });
function plant(B, r, q, x, z, h, spread = 1) { const yaw = r() * 6.283; for (const p of q.parts) B.add(p.tpl, p.mt, M(x, 0, z, h * spread, h, h * spread, 0, yaw, 0)); }
// Wide shade tree: short trunk, spreading boughs, each carrying hundreds of leaves
function tree(B, r, x, z) {
  if (PHONE && Math.random() < 0.45) return;
  if (TREE_MODELS.tree.parts) { B.obst(x, z, 0.5); plant(B, r, TREE_MODELS.tree, x, z, 7.5 + r() * 2.2, 1.15); return; }
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
  if (TREE_MODELS.tree2.parts) { B.obst(x, z, 0.4); plant(B, r, TREE_MODELS.tree2, x, z, 8 + r() * 2.5); return; }
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
  if (PHONE && Math.random() < 0.45) return; // phones: a little over half the palms, each one a few thousand leaves
  if (TREE_MODELS.palm.parts) { B.obst(x, z, 0.4); plant(B, r, TREE_MODELS.palm, x, z, 8 + r() * 3.5, 1.1); return; }
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
  const m = 6, sub = 3, prof = (j, fr) => { const th = j / m * Math.PI / 2, sc = 1 - 0.07 * Math.sin(Math.PI * fr) * (j / m) ** 2; return [R * Math.sin(th) * sc, edgeY + H * Math.cos(th)]; }; // a round dome; between the ribs the rim draws in a little, as cloth does
  for (let k = 0; k < n; k++) {
    const a0 = k * 6.2832 / n, da = 6.2832 / n, mt = panel(k);
    for (let q = 0; q < sub; q++) { const f0 = q / sub, f1 = (q + 1) / sub, b0 = a0 + da * f0, b1 = a0 + da * f1;
      for (let j = 0; j < m; j++) { const [r00, y0] = prof(j, f0), [r01] = prof(j, f1), [r10, y1] = prof(j + 1, f0), [r11] = prof(j + 1, f1), p00 = P(r00, b0, y0), p01 = P(r01, b1, y0), p10 = P(r10, b0, y1), p11 = P(r11, b1, y1);
        if (j > 0) B.triF(mt, p00, p01, p11); B.triF(mt, p00, p11, p10); }
      const [re0] = prof(m, f0), [re1] = prof(m, f1), e0 = P(re0, b0, edgeY), e1 = P(re1, b1, edgeY), drop = 0.17 - 0.05 * Math.sin(Math.PI * (f0 + f1) / 2); // the valance hanging from the rim
      B.triF(mt, e0, e1, P(re1 * 1.01, b1, edgeY - drop)); B.triF(mt, e0, P(re1 * 1.01, b1, edgeY - drop), P(re0 * 1.01, b0, edgeY - drop)); }
    for (let j = 0; j < m; j++) { const [ra, ya] = prof(j, 0), [rb, yb] = prof(j + 1, 0); rod(B, metal, P(ra, a0, ya - 0.02), P(rb, a0, yb - 0.02), 0.022); } // a rib under each seam
    rod(B, metal, P(0, 0, edgeY + 0.12), P(R * 0.72, a0, edgeY + H * 0.66), 0.02);                // strut from the runner
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
const LAMP_LENS = new THREE.MeshLambertMaterial({ color: '#f6efd2', emissive: '#ffd9a0', emissiveIntensity: 0 });
const LAMP_POOL = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, map: canvasTex(128, 128, (g) => { const q = g.createRadialGradient(64, 64, 2, 64, 64, 64); q.addColorStop(0, 'rgba(255,214,150,1)'); q.addColorStop(0.45, 'rgba(255,190,110,0.42)'); q.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); }) });
const LAMP_BEAM = new THREE.MeshBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const heroLamp = new THREE.PointLight('#ffd3a0', 0, 22, 1.6); scene.add(heroLamp); // the glow of the nearest street lamp on you and the people round you
const DAY = { sky: new THREE.Color(0xcfe4ff), gnd: new THREE.Color(0xb39a7c), sun: new THREE.Color(0xffe3b8), haze: new THREE.Color(HAZE) }, NIGHT = { sky: new THREE.Color(0x4a5f9c), gnd: new THREE.Color(0x1d2030), sun: new THREE.Color(0x9fb4ff), haze: new THREE.Color(0x0c1424) };
const FOLLOW_CLOCK = false; // set to true and the game is day or night by the player's own clock; for now it is always day
function nightNow() { // how far into the night it is by the player's own clock: dusk from 6 to 7.30 in the evening, dawn from 5.30 to 7 (add #hour=22 to the address to try a time)
  const f = /hour=([\d.]+)/.exec(location.hash), now = new Date(), h = f ? +f[1] : now.getHours() + now.getMinutes() / 60, sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  if (!FOLLOW_CLOCK && !f) return 0;
  return Math.max(sm(18, 19.5, h), 1 - sm(5.5, 7, h));
}
function updateDaylight() {
  const n = nightNow(); if (Math.abs(n - nightU.value) < 0.002 && updateDaylight.done) return; updateDaylight.done = true; nightU.value = n;
  renderer.toneMappingExposure = lerp(0.82, 1.0, n); // the day is held down a little so it is not glaring
  hemi.color.lerpColors(DAY.sky, NIGHT.sky, n); hemi.groundColor.lerpColors(DAY.gnd, NIGHT.gnd, n); hemi.intensity = lerp(HQ ? 1.25 : 1.45, 0.62, n);
  sun.color.lerpColors(DAY.sun, NIGHT.sun, n); sun.intensity = lerp(HQ ? 3.2 : 2.6, 0.55, n);          // the sun gives way to a pale moon
  scene.fog.color.lerpColors(DAY.haze, NIGHT.haze, n); scene.background.copy(scene.fog.color);
  LAMP_LENS.emissiveIntensity = 2.6 * n; LAMP_POOL.opacity = 0.3 * n; LAMP_BEAM.opacity = 0; LAMP_BEAM.visible = false; heroLamp.intensity = 9 * n; FOOT_SHADE.material.opacity = 1 - n; for (const m of CAR_MATS) m.envMapIntensity = m.userData.env * (1 - 0.93 * n); TEX.ceiling.emissiveIntensity = 0.42 * (1 - 0.6 * n); CLEAR_GLASS.color.set('#cfe8f2').multiplyScalar(1 - 0.85 * n); for (const m of NIGHT_SIGNS) m.emissiveIntensity = 0.12 + 1.0 * n; for (const m of GLOW_BY_DAY) m.emissiveIntensity = m.userData.glow * (1 - 0.9 * n); // (the soft patch under people and cars belongs to daylight)
  skyline.material.color.set('#7f9ccb').multiplyScalar(1 - 0.86 * n);
}
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
  B.add(T.box, LAMP_LENS, M(px - s * 0.62, py - 0.055, 0, 0.66, 0.05, 0.26, 0, 0, tilt));  // lens
  B.add(T.disc, LAMP_POOL, M(x - s * 5.2, 0.035, 0, 9.5, 1, 13)); // its light on the road...
  { const u0 = x - s * 0.75, u1 = x + s * 2.6; B.quadF(LAMP_POOL, V3(u0, 0.3, 4.5), V3(u1, 0.3, 4.5), V3(u1, 0.3, -4.5), V3(u0, 0.3, -4.5), 0, 1); B.quadF(LAMP_POOL, V3(u0, 0.3, -4.5), V3(u1, 0.3, -4.5), V3(u1, 0.3, 4.5), V3(u0, 0.3, 4.5), 0, 1); } // ...and on the pavement beside it // at night: its pool of light on the ground and a faint cone in the air
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
const LANE_D = { residential: true, lane: true, types: { duplex: 0.46, terrace: 0.14, modern: 0.18, shop: 0.22 }, apt: [3, 4], trees: 0, stalls: 0, plants: { shade: 1 } };
function buildLane(g, B, r) { // in the group's own space the lane runs along -z from 0 to -BLOCK, centred on x = 0
  const L = BLOCK, Hf = LANE_HALF, wallc = '#d8d0bc';
  const laneD = { ...LANE_D, estate: { wall: pick(r, TWALL), accent: pick(r, [TEX.brickGrey, TEX.stone, TEX.brickRed, TEX.brickTan]), roof: pick(r, [TEX.roofDark, TEX.roofBrown]) } }; // one matching look per street
  for (let z = 0; z < L; z += 6) B.box(ROAD_C, 5, LANE_Y, 6, 0, LANE_Y / 2, -z - 3);                                                          // a quiet two-way street: tarmac, a dashed centre line, a narrow pavement each side
  for (let z = -3; z > -L + 5; z -= 6) B.box('#e8e8e8', 0.12, 0.012, 2.2, 0, LANE_Y + 0.006, z - 1.1);
  for (const e of [-1, 1]) for (let z = 0; z < L; z += 6) { B.box(PAVE_C, 1.0, LANE_Y + 0.03, 6, e * 3.0, (LANE_Y + 0.03) / 2, -z - 3); B.box(KERB_C, 0.12, LANE_Y + 0.05, 6, e * 2.5, (LANE_Y + 0.05) / 2, -z - 3); }
  for (let z = -19, n = 0; z > -L + 17; z -= 11, n++) (n % 3 ? slender : tree)(B, r, (n % 2 ? 1 : -1) * (Hf + 1.25), z);    // trees in the front gardens, leaning over the street
  for (const z of [(F - 7.45) / 2, -L - (F - 7.45) / 2]) B.box('#8e5a40', 2 * Hf, 0.3, F - 7.45, 0, 0.146, z); // paved crossing over the sidewalk at each end
  for (const e of [-1, 1]) {
    for (const z of [-7.5, -L + 7.5]) B.box(wallc, 0.25, 2.4, 15, e * (Hf + 0.13), 1.2, z);                    // compound walls behind the corner buildings
    let q = 15, count = 0; const end = L - 15;
    while (end - q > 7) { // houses down both sides
      let type = weighted(r, LANE_D.types); const w = Math.min(lerp(WIDTHS[type][0], WIDTHS[type][1], r()), end - q - 0.3);
      if (w < 8.6 && type === 'terrace') type = 'bungalow';
      if (w < 11.5 && type === 'duplex') type = 'terrace';
      if (w < 16 && type === 'modern') type = 'duplex';
      B.frame.makeTranslation(-e * (F - Hf), 0, -(q + w / 2));
      runLot(lotCtx(B, g, e, w, r, laneD), type, 0, 2 * count + (e > 0 ? 1 : 2)); count++;
      q += w + 0.3;
    }
    B.frame.identity();
    if (end - q > 0.6) B.box(wallc, 0.25, 2.4, end - q, e * (Hf + 0.13), 1.2, -(q + end) / 2);                 // wall across any leftover gap
  }
}
function buildRoad(g, B, pc, r, D, opt) {
  const L = pc.L, res = !!D.residential && !opt.wide, a = res ? 6.3 : ROAD_HALF, b = res ? 7.2 : a + GUTTER_W, c = b + 0.25, V = () => new THREE.Vector3();
  strip(B, ROAD_C, pc, -a, a, 0, 0, 0, L);
  for (const s of [-1, 1]) {
    const S = (mt, ua, ub, yt, yb, t0, t1) => strip(B, mt, pc, Math.min(s * ua, s * ub), Math.max(s * ua, s * ub), yt, yb, t0, t1);
    if (res) { // an estate street: a drain under concrete slabs between the road and the kerb, the kerb painted black and white
      S('#b7b2a6', a, b, 0.05, 0, 0, L);
      for (let t = 0.6, n = 0; t < L - 0.5; t += 1.2, n++) { S('#23282a', a + 0.1, b - 0.08, 0.056, 0.056, t, t + 0.07); if (n % 11 === 7) S('#2c3a37', a + 0.12, b - 0.1, 0.058, 0.058, t + 0.07, t + 1.2); } // the joints between slabs, and here and there a slab missing
      S('#2b2b2c', b + 0.01, c, 0.2, 0, 0, L);                                                                       // the dark joints between the kerbstones
      for (let t = 0, n = 0; t < L; t += 1, n++) { const col = n % 2 ? '#1d1d1e' : '#efefec', t0 = t + 0.014, t1 = Math.min(t + 0.986, L); // each kerbstone is its own block, rounded off towards the road
        S(col, b, c, 0.25, 0, t0, t1); S(col, b + 0.035, c, 0.3, 0.25, t0, t1); S(col, b + 0.075, c, 0.335, 0.3, t0, t1); }
    } else S('#8d8d89', a, b, 0.012, 0.012, 0, L);                                  // smooth concrete channel
    if (!res) S(KERB_C, b, c, 0.32, 0, 0, L);                                                   // clean concrete kerb
    S(res ? PAVE_C : WALK_C, c, F, 0.28, 0, 0, L);                                           // sidewalk
    S(res ? '#e0b21c' : '#e8e8e8', a - 0.37, a - 0.23, 0.02, 0.02, 0, L);                       // edge line
    if (!res) S('#e0b21c', 0.1, 0.23, 0.02, 0.02, 0, L);                                // double yellow centre
    for (let t = 2; t + 3 < L; t += 8) S('#e8e8e8', (res ? 0 : a / 2) - 0.07, (res ? 0 : a / 2) + 0.07, 0.02, 0.02, t, t + 3); // lane dashes
  }
  if (L > 30 && r() < 0.3) { // zebra crossing
    const tz = 6 + r() * (L - 16);
    for (let x = -a + 0.9; x < a - 0.5; x += 1.15) strip(B, '#f2f2f2', pc, x - 0.3, x + 0.3, 0.022, 0.022, tz, tz + 3.4);
  }
  const lanes = opt.slots || []; // openings where inner streets meet this road

  // A planted verge along both kerbs: grass, low shrubs and flowers, and an evenly spaced row of
  // street trees - palms on some streets, shade trees on others. Lights stand between the trees.
  const vu = c + 0.55, avenue = r() < 0.55 ? palm : (r() < 0.6 ? tree : slender);
  if (avenue) for (const s of [-1, 1]) {
    const lane = lanes.find((l) => l.side === s), gap0 = lane ? lane.t0 - LANE_HALF - 0.8 : -1, gap1 = lane ? lane.t0 + LANE_HALF + 0.8 : -1;
    for (let t0 = 1.5; t0 < L - 2; t0 += 12) { // one bed per tree, with a paved break between beds
      let ta = t0, tb = Math.min(t0 + 9.4, L - 1.5);
      if (lane && ta < gap1 && tb > gap0) { if (gap0 - ta > 2.5) tb = gap0; else if (tb - gap1 > 2.5) ta = gap1; else continue; } // keep the mouth of an inner street clear
      strip(B, '#5c8443', pc, Math.min(s * (c + 0.14), s * (c + 0.96)), Math.max(s * (c + 0.14), s * (c + 0.96)), 0.288, 0.27, ta, tb); // level with the paving, so nobody wades through it
      const mid = (ta + tb) / 2;
      frameAt(pc, mid, B.frame); avenue(B, r, s * vu, 0);
      for (let q = ta + 0.5; q < tb - 0.3; q += 0.9) { // shrubs and a few flowers along the bed
        if (Math.abs(q - mid) < 0.8) continue;
        frameAt(pc, q, B.frame);
        bush(B, r, s * (vu + (r() - 0.5) * 0.3), 0.3, 0, 0.62 + r() * 0.25, r() < 0.22 ? FLOWERS : BROAD, 5);
      }
    }
  }
  for (let t = 13.5, i = 0; t < L - 4; t += 12, i++) { // street lights, alternating sides, between the trees
    const s = i % 2 ? -1 : 1;
    if (lanes.some((l) => l.side === s && Math.abs(t - l.t0) < LANE_HALF + 1.2)) continue;
    frameAt(pc, t, B.frame); streetLight(B, r, s, c + 0.5);
  }

  if (res) { // things that make a street lived in: a parked car here and there, and now and then a bench and a bin in the planting strip
    if (HQ && carKinds.length) for (const sd of [-1, 1]) for (let t = 16 + r() * 8; t < L - 16; t += 15 + r() * 16) {
      if (r() < 0.45 || lanes.some((l) => l.side === sd && Math.abs(t - l.t0) < LANE_HALF + 5)) continue;
      const kind = carKinds[Math.floor(r() * carKinds.length)], paint = kind.paints[Math.floor(r() * kind.paints.length)], obj = kind.tpl.clone(true);
      obj.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = HQ; if (paint && /^body/i.test(o.material.name)) o.material = paint; } });
      pt(pc, t, sd * 5.25, 0, obj.position); obj.rotation.y = (sd > 0 ? Math.PI : 0) + (r() - 0.5) * 0.05; g.add(obj);
    }
    for (let k = 1; 12.2 + 12 * k < L - 6; k += 3) { const t = 12.2 + 12 * k, sd = k % 2 ? 1 : -1, x = sd * (c + 0.55); // in the paved gap between two flower beds, on the side with no lamp post
      if (lanes.some((l) => l.side === sd && Math.abs(t - l.t0) < LANE_HALF + 3)) continue;
      frameAt(pc, t, B.frame); B.obst(x, 0, 0.75);
      if (BENCH.parts) for (const p of BENCH.parts) B.add(p.tpl, p.mt, M(x, 0.28, 0, 1.75, 1.75, 1.75, 0, sd > 0 ? Math.PI : 0, 0)); else B.box('#7b5433', 0.44, 0.05, 1.5, x, 0.73, 0);
      B.add(T.cyl, '#2f5d43', M(x, 0.28 + 0.4, 1.25, 0.46, 0.8, 0.46)); B.add(T.cyl, '#20242a', M(x, 0.28 + 0.83, 1.25, 0.5, 0.06, 0.5));
    }
    if (false && BUS_STOP.parts && L > 60 && r() < 0.6 && // (bus shelters taken out: the owner of the game did not like them)
      !lanes.some((l) => l.side === 1 && Math.abs(48.2 - l.t0) < LANE_HALF + 5)) { // a bus shelter by the kerb on some streets
      frameAt(pc, 48.2, B.frame); const x = c + 1.35; B.obst(x, 0, 1.6);
      for (const p of BUS_STOP.parts) B.add(p.tpl, p.mt, M(x, 0.28, 0, 4.4, 4.4, 4.4)); }
    B.frame.identity();
  }
  if (res) { // power poles down one side, close to the compound walls, with the lines strung between them
    const u = -(F - 0.3);
    for (let t = 7.5; t < L - 2; t += 24) { frameAt(pc, t, B.frame); B.add(T.taper, '#8a7f72', M(u, 4.2, 0, 0.3, 8.4, 0.3)); B.box('#6e645a', 1.7, 0.1, 0.1, u + 0.2, 7.7, 0); B.box('#6e645a', 1.2, 0.08, 0.08, u + 0.2, 7.0, 0); for (const q of [-0.6, 0.1, 0.9]) B.add(T.cyl, '#d8d4c8', M(u + q, 7.83, 0, 0.07, 0.16, 0.07)); }
    B.frame.identity();
    for (const q of [-0.6, 0.1, 0.9]) strip(B, '#161616', pc, u + q - 0.012, u + q + 0.012, 7.93, 7.91, 0, L);
    strip(B, '#161616', pc, u + 0.5, u + 0.53, 7.06, 7.03, 0, L);
  }
  // buildings, lot by lot. On a bend the inside has less room and the outside more.
  for (const s of [-1, 1]) {
    const f = pc.k ? (s * pc.k < 0 ? (pc.R - F - 6) / pc.R : (pc.R + F) / pc.R) : 1;
    let t = (opt.lotStart || 0) + (0.4 + r() * 1.2) / f, prevH = 0, count = 0; const Lend = L - (opt.lotEnd || 0);
    const lot = (type, w, rent) => {
      const span = w / f; frameAt(pc, t + span / 2, B.frame);
      prevH = runLot(Object.assign(lotCtx(B, g, s, w, r, D), { rent, tall: s === 1, street: opt.street }), type, prevH, (opt.numBase || 0) + 2 * (opt.numRev ? Math.max(0, 11 - count) : count) + (s > 0 ? 1 : 2)); count++; // odd numbers on one side, even on the other
      const sx = s * (res ? 5.8 : b + 1.3);
      if (type !== 'church' && type !== 'rental' && type !== 'store' && r() < D.stalls) stall(B, r, s * (F - 2.3 + r() * 0.6), (r() - 0.5) * Math.max(w - 7, 0));
      t += span + (0.2 + r() * 1.2) / f;
    };
    const lane = lanes.find((l) => l.side === s), a0 = lane ? lane.t0 - LANE_HALF - 0.2 : 0, b0 = lane ? lane.t0 + LANE_HALF + 0.2 : 0;
    if (!lane && !pc.k && D.church && s === 1 && Lend - t > 31 && r() < 0.2) lot('church', 30);
    const forRent = (opt.rentals || []).filter((q) => q.side === s), forStore = (opt.stores || []).filter((q) => q.side === s);
    while ((Lend - t) * f > 6.5) {
      const ns = forStore[0]; if (ns && t >= ns.t && (Lend - t) * f > ns.w + 0.3 && (!lane || t >= b0 || a0 - t > ns.w + 0.2)) { forStore.shift(); lot('store', ns.w, ns); continue; } // a shop takes its place the same way
      const nr = forRent[0]; // the next house for rent takes the first clear stretch from where it is wanted
      if (nr && t >= nr.t && (Lend - t) * f > nr.w + 0.3 && (!lane || t >= b0 || a0 - t > nr.w + 0.2)) { forRent.shift(); lot('rental', nr.w, nr); continue; }
      if (lane && t < b0 && a0 - t < 6.5) { if (a0 - t > 3) lot('plot', a0 - t - 0.3); t = b0; continue; } // leave the mouth of the inner street open
      let type = weighted(r, D.types);
      if (D === ESTATE && s === 1 && type !== 'modern' && type !== 'shop' && r() < 0.6) type = 'modern'; // the right-hand side of each street is mostly tall blocks
      let w = Math.min(lerp(WIDTHS[type][0], WIDTHS[type][1], r()), (Lend - t) * f - 0.3);
      if (lane && t < a0) w = Math.min(w, a0 - t - 0.1);
      if (w < 11 && (type === 'office' || type === 'glass')) type = 'apt';
      if (w < 13 && type === 'modern') type = D.residential ? 'terrace' : 'apt';
      if (w < 11.5 && type === 'duplex') type = 'bungalow';
      if (w < 8.6 && type === 'terrace') type = 'bungalow';
      { // no odd gaps: the last building runs to the corner, or leaves room for one narrow one
        const room = lane && t < a0 ? a0 - t - 0.1 : (Lend - t) * f - 0.3, rest = room - w;
        if (rest < 10.5) { if (room < w * 1.3) w = room; else if (room - 11.5 > w * 0.75) w = room - 11.5; }
      }
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
    B.box(KERB_C, 0.25, 0.32, 3.6, sx * 7.08, 0.16, zc);
    B.box(KERB_C, 3.85, 0.32, 0.25, sx * 8.88, 0.16, zin);
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
    B.box(KERB_C, 2 * (ROAD_HALF + GUTTER_W), 0.32, 0.25, 0, 0.16, -2 * F + 3.72);
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
const KINDS = 9;
const toHsl = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l];
  const sa = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, sa, l]; };
const fromHsl = (h, sa, l) => { const c = (1 - Math.abs(2 * l - 1)) * sa, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6;
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
const parseGlb = (u8) => new Promise((res, rej) => new GLTFLoader().parse(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength), '', res, rej));
// the same bone under its different names: "mixamorig:Hips_01", "mixamorigHips", "rp_nathan_animated_003_walking_hip_02", "hip_02"
const boneKey = (n) => n.replace(/^.*mixamorig[:_]?/, '').replace(/^CC_Base_/, '').replace(/^rp_[a-z]+_animated_\d+_(walking|idling)_/, '').replace(/_\d+$/, '').toLowerCase();
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
Object.assign(ALIAS, { waist: 'spine', spine01: 'spine1', spine02: 'spine2', necktwist01: 'neck' }); // Character Creator bone names in Mixamo terms
for (const [e, E] of [['l', 'left'], ['r', 'right']]) Object.assign(ALIAS, { [e + '_clavicle']: E + 'shoulder', [e + '_upperarm']: E + 'arm', [e + '_forearm']: E + 'forearm', [e + '_hand']: E + 'hand', [e + '_mid1']: E + 'handmiddle1', [e + '_thigh']: E + 'upleg', [e + '_calf']: E + 'leg', [e + '_foot']: E + 'foot', [e + '_toebase']: E + 'toebase' });
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
  if (c.r > c.g * 1.08 && c.g > c.b * 1.02 && sat > 0.22 && sat < 0.92 && mx > 0.02) c *= mix(vec3(uSkin), uTint, smoothstep(0.34, 0.24, sat) * smoothstep(0.74, 0.86, mx)); // very pale, bright bits are the hem of a shirt, not skin
  else if ((sat < 0.3 && mx > 0.1) || (sat < 0.5 && mx > 0.6 && c.r < c.g * 1.08 && c.b < c.g * 1.02)) c *= uTint; // white and grey cloth, and the creamy highlights on it
  else if (c.b > c.r * 1.12 && sat > 0.2) c = mix(c, vec3(lum) * uJeans.rgb, uJeans.a);
  diffuseColor.rgb = c; }`;
const PEOPLE_LIGHT = `{
    vec3 pV = normalize(vViewPosition), pW = inverseTransformDirection(normal, viewMatrix);
    float pRim = pow(1.0 - clamp(dot(normal, pV), 0.0, 1.0), 3.0);
    float pLit = clamp(dot(reflectedLight.directDiffuse, vec3(0.333)) / max(dot(diffuseColor.rgb, vec3(0.333)), 0.02) * 1.6, 0.0, 1.0);
    outgoingLight += diffuseColor.rgb * vec3(0.72, 0.84, 1.0) * pRim * (0.10 + 0.20 * clamp(pW.y * 0.5 + 0.6, 0.0, 1.0));   // the sky on the edges of a body
    outgoingLight += diffuseColor.rgb * vec3(1.0, 0.9, 0.78) * 0.16 * clamp(0.6 - 0.6 * pW.y, 0.0, 1.0);                     // light thrown back up by the pavement
  }`;
function tinted(m, P) {
  const c = m.clone(); c.name = m.name;
  c.onBeforeCompile = (sh) => {
    sh.uniforms.uSkin = { value: P.skin }; sh.uniforms.uTint = { value: P.tint }; sh.uniforms.uJeans = { value: P.jeans };
    sh.fragmentShader = 'uniform float uSkin; uniform vec3 uTint; uniform vec4 uJeans;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + TINT_GLSL);
    if (HQ) sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', PEOPLE_LIGHT + '\n#include <opaque_fragment>'); // light that wraps round a body: sky on the edges, warmth from the ground, a soft sheen in the sun
  };
  c.customProgramCacheKey = () => 'people-tint-5'; return c;
}
// Shadows: every person is drawn a second time, flattened onto the ground along the sun's rays,
// so the shadow is their real outline and moves with every step. The stencil stops overlapping
// parts of a shadow from darkening twice.
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
  vec4 mvPosition = viewMatrix * wp; vD = -mvPosition.z; ${CURVE_GLSL} gl_Position = projectionMatrix * mvPosition;
}`,
  fragmentShader: `varying float vD; void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.42 * (1.0 - smoothstep(45.0, 70.0, vD))); }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
});
function addShadow(model, holder) { // holder is the person as a whole: its height is the ground they stand on; returns the shadow meshes
  if (HQ) { const patch = FOOT_SHADE.clone(); patch.position.y = 0.02; patch.renderOrder = 4; holder.add(patch); }
  if (HQ) { model.traverse((o) => { if (o.isMesh) o.castShadow = !o.userData.lod; }); return []; }
  const list = [], out = []; model.traverse((o) => { if (o.isSkinnedMesh) list.push(o); });
  for (const o of list) {
    const m = SHADOW_MAT.clone(), sh = new THREE.SkinnedMesh(o.geometry, m);
    sh.bind(o.skeleton, o.bindMatrix); sh.position.copy(o.position); sh.quaternion.copy(o.quaternion); sh.scale.copy(o.scale);
    sh.boundingSphere = o.boundingSphere.clone(); sh.boundingSphere.radius *= 1.4; sh.renderOrder = 5; sh.onBeforeRender = () => { m.uniforms.uY.value = holder.matrixWorld.elements[13]; };
    o.parent.add(sh); out.push(sh);
  }
  return out;
}
// How far to raise a model so that, all through an animation, its lower foot just rests on the ground. The walking and
// standing animations hold the hips at different heights, so each gets its own figure and the body eases between them.
function standHeight(root, scale, clip) {
  const m = SkeletonUtils.clone(root); m.scale.multiplyScalar(scale); const mx = new THREE.AnimationMixer(m); mx.clipAction(clip).play();
  let feet = []; m.traverse((o) => { if (o.isBone && /toe|ball|foot/i.test(o.name)) feet.push(o); }); if (!feet.length) m.traverse((o) => { if (o.isBone) feet.push(o); });
  let lo = Infinity; for (let i = 0; i < 20; i++) { mx.setTime(clip.duration * i / 20); m.updateMatrixWorld(true); for (const b of feet) lo = Math.min(lo, _v.setFromMatrixPosition(b.matrixWorld).y); }
  mx.stopAllAction(); mx.uncacheRoot(m); return 0.03 - lo; // the bone runs through the middle of the foot; the sole is a little below it
}
// A soft dark patch on the ground under every person. In the sun their real shadow does most of the work; in the shade
// and indoors this is what makes them stand ON the floor instead of seeming to hover over it.
const FOOT_SHADE = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
  map: canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,0.5)'); r.addColorStop(0.55, 'rgba(0,0,0,0.26)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }) }));
// A lighter body for people further away: the same vertices, but neighbouring ones are treated as one, so most of the
// small triangles fall away. Nothing extra is stored except a shorter list of triangles.
function lowGeom(g, grid = 46) {
  g.computeBoundingBox(); const pa = g.attributes.position, n = pa.count, sz = g.boundingBox.getSize(new THREE.Vector3()), cell = Math.max(sz.x, sz.y, sz.z) / grid, seen = new Map(), rep = new Uint32Array(n);
  for (let i = 0; i < n; i++) { const k = Math.round(pa.getX(i) / cell) + ',' + Math.round(pa.getY(i) / cell) + ',' + Math.round(pa.getZ(i) / cell); let j = seen.get(k); if (j === undefined) { j = i; seen.set(k, i); } rep[i] = j; }
  const idx = g.index ? g.index.array : null, m = idx ? idx.length : n, tri = [];
  for (let t = 0; t + 2 < m; t += 3) { const a = rep[idx ? idx[t] : t], b = rep[idx ? idx[t + 1] : t + 1], c = rep[idx ? idx[t + 2] : t + 2]; if (a !== b && b !== c && a !== c) tri.push(a, b, c); }
  const lo = new THREE.BufferGeometry(); for (const k in g.attributes) lo.setAttribute(k, g.attributes[k]); lo.setIndex(tri); lo.boundingSphere = g.boundingSphere; lo.boundingBox = g.boundingBox; return lo;
}
// Outfit colours, handed out in turn so people near each other are never dressed alike.
const OUTFITS = ['#ffffff', '#27477a', '#d8a531', '#c0623d', '#9fc4e8', '#2f6b4f', '#e9a7b8', '#55585e', '#7d2233', '#f3ead7', '#1f8a8a', '#ef7d62', '#b9a4dc', '#6b7b3a', '#c8a57a', '#4f79b8', '#c62f3a', '#a8d5ba', '#7a4b7c', '#f2c6a0', '#a5502a', '#c9ccd1', '#2f54c8', '#9bb09a'];
let outfitTurn = 0;
function makeKind(gltf, height, walk, idle, skins, uniform) {
  const root = gltf.scene, mats = new Map(); let lo = Infinity, hi = -Infinity; const v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (o.isBone) { o.getWorldPosition(v); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); }
    if (o.isMesh) { // simple, cheap materials
      o.geometry.computeBoundingSphere(); if (HQ && o.isSkinnedMesh) o.geometry.userData.low = lowGeom(o.geometry); o.boundingSphere = o.geometry.boundingSphere.clone(); o.boundingSphere.radius *= 1.6; // a generous fixed bound, so off-screen people are skipped cheaply
      const m = o.material;
      if (!mats.has(m)) mats.set(m, Object.assign(new THREE.MeshLambertMaterial({ map: m.map, color: m.map ? '#ffffff' : m.color, alphaTest: m.transparent || m.alphaTest ? 0.5 : 0, side: m.transparent ? THREE.DoubleSide : m.side }), { name: m.name })); // keep two-sided parts two-sided, or hands and cuffs modelled inside-out vanish
      o.material = mats.get(m);
    }
  });
  const base = [...mats.values()], scale = height / (hi - lo), conv = (q) => (q.bake ? bake(q.clip, q.root, root, q.tuck || 1) : retarget(q.clip, q.root, root)), W = conv(walk), I = conv(idle);
  const r = rng(kinds.length * 97 + 13), makeLook = (P) => { const look = new Map(); for (const m of base) look.set(m, tinted(m, P)); return look; };
  const looks = []; for (let n = 0; n < (uniform ? skins.length : OUTFITS.length); n++) looks.push(makeLook({ skin: skins[n % skins.length], tint: new THREE.Color(uniform ? '#ffffff' : OUTFITS[(n + kinds.length * 5) % OUTFITS.length]), jeans: uniform ? JEANS[0] : pick(r, JEANS) })); // one outfit per colour; people in uniform keep it and differ only in skin
  kinds.push({ uniform: !!uniform, root, walk: W.clip, idle: I.clip, scale, lift: standHeight(root, scale, I.clip), liftWalk: standHeight(root, scale, W.clip), looks, makeLook, stride: (W.speed > 0.3 ? W.speed * scale : 1.5 * height / 1.8) });
}
// People who stop you for money while you are on an errand: agberos (street touts) and police officers.
const AGB = [], POLICE = [], hz = [];
// Some downloaded characters rest with their arms down. The animations are measured from a T-pose, so each is first put back
// into the pose it was rigged in and then its arms are laid out level and its legs straight down.
function squareUp(g) {
  const root = g.scene; root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.isBone) o.name = o.name.replace(/^.*CC_Base_/, 'CC_Base_'); });
  root.traverse((o) => { if (!o.isSkinnedMesh) return; const inv = new Map(); o.skeleton.bones.forEach((b, i) => inv.set(b, o.skeleton.boneInverses[i]));
    for (const b of o.skeleton.bones) { const pi = inv.get(b.parent); if (!pi) continue; new THREE.Matrix4().multiplyMatrices(pi, inv.get(b).clone().invert()).decompose(b.position, b.quaternion, b.scale); } });
  root.updateMatrixWorld(true);
  const B = {}; root.traverse((o) => { if (o.isBone) { const k = mixKey(o.name); if (!B[k]) B[k] = o; } }); if (!B.hips) return;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Quaternion(), pq = new THREE.Quaternion();
  const lay = (bone, kid, dir) => { if (!bone || !kid) return; bone.getWorldPosition(a); kid.getWorldPosition(b); b.sub(a).normalize(); q.setFromUnitVectors(b, dir); bone.parent.getWorldQuaternion(pq); bone.quaternion.premultiply(pq.clone().invert().multiply(q).multiply(pq)); root.updateMatrixWorld(true); };
  for (const s of ['left', 'right']) { if (!B[s + 'arm']) continue; const side = new THREE.Vector3(Math.sign(B[s + 'arm'].getWorldPosition(a).x - B.hips.getWorldPosition(b).x) || 1, 0, 0), down = new THREE.Vector3(0, -1, 0);
    lay(B[s + 'arm'], B[s + 'forearm'], side); lay(B[s + 'forearm'], B[s + 'hand'], side); lay(B[s + 'upleg'], B[s + 'leg'], down); lay(B[s + 'leg'], B[s + 'foot'], down); }
}
// The characters a player can be. Whoever is chosen replaces the model inside hero.obj; the choice is saved.
const HEROES = {}, HERO_LIST = [['leo', 'Leo'], ['nathan', 'Nathan'], ['roxy', 'Roxy'], ['maya', 'Maya'], ['mike', 'Mike'], ['carla', 'Carla'], ['zoe', 'Zoe']];
function becomeHero(id) {
  const H = HEROES[id] || HEROES.leo || HEROES.nathan; if (!H) return;
  if (hero.mixer) { hero.mixer.stopAllAction(); hero.mixer.uncacheRoot(hero.model); }
  hero.obj.clear();
  const k = H.k, look = k.makeLook(H.look), m = SkeletonUtils.clone(k.root);
  m.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.boundingSphere = o.boundingSphere && o.boundingSphere.clone(); o.frustumCulled = false; } });
  hero.baseY = m.position.y; m.scale.multiplyScalar(k.scale * 1.01); m.position.y += k.lift; hero.obj.add(m); addShadow(m, hero.obj); m.traverse((o) => { if (o.isMesh) o.layers.enable(1); }); hero.mixer = new THREE.AnimationMixer(m); hero.model = m; hero.who = HEROES[id] ? id : (HEROES.leo ? 'leo' : 'nathan');
  hero.w = [1, 0, 0]; hero.acts = [k.idle, k.walk, H.run].map((c, n) => { const a = hero.mixer.clipAction(c); a.play(); a.setEffectiveWeight(n ? 0 : 1); return a; });
  hero.stride = k.stride; hero.lifts = [k.idle, k.walk, H.run].map((c) => standHeight(k.root, k.scale * 1.01, c));
  if (hero.who === 'nathan') wearBackpack();
}
Promise.all([mixamoAnimsGlb, cop1Glb, bizmanGlb, claudiaGlb, nathanGlb, ericGlb, sophiaGlb, carlaGlb, mikeGlb, zoeGlb, roxyGlb, mayaGlb, leoGlb, cop2Glb, cop3Glb, agb1Glb, agb2Glb].map(parseGlb)).then(([anim, guard, bizman, claudia, nathan, eric, sophia, carla, mike, zoe, roxy, maya, leo, cop2, cop3, agb1, agb2]) => {
  const clip = (g, name) => ({ clip: g.animations.find((a) => a.name === name) || g.animations[0], root: g.scene });
  const mWalk = { ...clip(anim, 'walk'), bake: true, tuck: 0.7 }, mIdle = { ...clip(anim, 'idle'), bake: true, tuck: 0.4 }, // tucked in: feet under the body and arms by the sides, not a wide-legged stance
     rWalk = clip(nathan), womanIdle = clip(sophia);
  // Men stand in a plain, relaxed pose: the standard idle, converted once onto Eric's clean skeleton and shared with the other men.
  const manIdle = { clip: bake(mIdle.clip, anim.scene, eric.scene, 0.4).clip, root: eric.scene };
  // skin: how much lighter or deeper than the scan each outfit is, so every character appears fair, brown and dark
  makeKind(guard, 2.1, mWalk, mIdle, [1, 0.62, 0.4], true); // police officers: three different people, each fair, brown or dark, all in their own uniform
  makeKind(bizman, 2.08, mWalk, mIdle, [1, 0.6, 0.38]);
  makeKind(claudia, 1.98, rWalk, womanIdle, [0.5, 0.32, 0.9, 0.22]);
  makeKind(nathan, 2.1, rWalk, manIdle, [1, 0.5, 0.3, 0.22]);
  const plain = { skin: 1, tint: new THREE.Color('#ffffff'), jeans: JEANS[0] }, runOn = (k) => retarget(bake(clip(anim, 'run').clip, anim.scene, eric.scene, 0.8).clip, eric.scene, k.root).clip; // a real running animation, fitted to them
  HEROES.nathan = { k: kinds[kinds.length - 1], look: { skin: 0.34, tint: new THREE.Color('#ffffff'), jeans: JEANS[0] }, run: runOn(kinds[kinds.length - 1]) }; // Nathan with brown skin, in his own white T-shirt and jeans
  makeKind(eric, 2.1, rWalk, manIdle, [1, 0.5, 0.3, 0.2]);
  makeKind(sophia, 1.98, rWalk, womanIdle, [1, 0.55, 0.34, 0.24], true); // her loose cream top takes colour unevenly, so she keeps it as it is
  makeKind(carla, 2.0, rWalk, womanIdle, [1, 1.5, 0.6, 2.1]);
  HEROES.carla = { k: kinds[kinds.length - 1], look: plain, run: runOn(kinds[kinds.length - 1]) };
  makeKind(cop2, 1.86, mWalk, mIdle, [1, 0.62, 0.4], true);
  makeKind(cop3, 1.98, mWalk, mIdle, [1, 0.62, 0.4], true);
  POLICE.push(kinds[kinds.length - 2], kinds[kinds.length - 1]); // the two officers who stop you for money
  for (const g of [agb1, agb2]) { // agberos: they are not part of the crowd, they wait for you on an errand
    try { squareUp(g); makeKind(g, 2.12, mWalk, mIdle, [1], true); AGB.push(kinds.pop()); } catch (e) { console.error('an agbero could not be set up', e); }
  }
  // Two more to choose from. They are detailed, so they are for the player only and do not join the crowd.
  for (const [id, g, h] of [['mike', mike, 2.1], ['zoe', zoe, 1.8], ['roxy', roxy, 1.8], ['maya', maya, 1.8], ['leo', leo, 2.1]]) {
    try { makeKind(g, h, mWalk, mIdle, [1]); const k = kinds.pop(); k.looks.length = 0; HEROES[id] = { k, look: plain, run: bake(clip(anim, 'run').clip, anim.scene, k.root, 0.8).clip }; }
    catch (e) { console.error(id + ' could not be set up', e); }
  }
  becomeHero(game.hero || 'leo'); makeHeroCards();
}, (e) => console.error('walkers failed to load', e));
function populate(piece) { // put walkers on both sidewalks of a road piece
  if (piece.junction || kinds.length < KINDS) return;
  const r = rng(piece.seed * 7919 + 5), L = piece.pc.L;
  for (let i = 0, n = Math.round(L / 40 * piece.crowd * (HQ ? 1 : 0.55)); i < n; i++) { // thinner crowds on phones
    const k = kinds[Math.floor(r() * kinds.length)], obj = new THREE.Group(), inner = SkeletonUtils.clone(k.root), look = k.uniform ? pick(r, k.looks) : k.looks[outfitTurn++ % k.looks.length]; // the next colour in the list, so no two people in a row match
    const hi = [], lo = [];
    inner.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.boundingSphere = o.boundingSphere && o.boundingSphere.clone(); if (o.isSkinnedMesh && o.geometry.userData.low) hi.push(o); } });
    for (const o of hi) { // the light copy shares the skeleton, so it moves exactly as the full one does
      const q = new THREE.SkinnedMesh(o.geometry.userData.low, o.material); q.bind(o.skeleton, o.bindMatrix); q.position.copy(o.position); q.quaternion.copy(o.quaternion); q.scale.copy(o.scale); q.boundingSphere = o.boundingSphere; q.visible = false; q.userData.lod = true; o.parent.add(q); lo.push(q);
    }
    const big = 0.95 + r() * 0.09, baseY = inner.position.y; inner.scale.multiplyScalar(k.scale * big); inner.position.y += k.lift * big; obj.add(inner); const shadows = addShadow(inner, obj);
    const mixer = new THREE.AnimationMixer(inner), speed = 1.0 + r() * 0.5, dir0 = r() < 0.5 ? 1 : -1;
    const walk = mixer.clipAction(k.walk), idle = mixer.clipAction(k.idle || k.walk); walk.play(); idle.play(); idle.setEffectiveWeight(0); mixer.update(r() * 2);
    people.push({ obj, shadows, inner, hi, lo, baseY, big, kind: k, mixer, walk, idle, stride: k.stride || 1.45, wWalk: 1, v: dir0 * speed, face: dir0 > 0 ? Math.PI : 0, piece, pc: piece.pc, t: 1 + r() * (L - 2), u: 0, u0: (r() < 0.5 ? -1 : 1) * (piece.lo + 0.45 + r() * (piece.hi - piece.lo - 0.6)), dir: dir0, speed, stuck: 0, id: people.length });
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
const SEE_PEOPLE = 142, camFwd = new THREE.Vector3();
function updatePeople(dt, cam) {
  frameNo++; camera.getWorldDirection(camFwd);
  const heroTU = new Map();
  for (const p of people) {
    const pc = p.pc, piece = p.piece, sgn = Math.sign(p.u0), au = Math.abs(p.u), LO = piece.lo, HI = piece.hi;
    if (!heroTU.has(piece)) { _v.set(hero.x, 0, hero.z).applyMatrix4(piece.inv); heroTU.set(piece, tuOf(pc, _v.x, _v.z, {})); }
    // Look ahead and react only to the nearest thing in the way: drift to one side of it in good time,
    // and ease off behind a person who is directly ahead. No sudden stops, no pushing back and forth.
    let goal = Math.abs(p.u0), nearest = 4.5, shut = false; const slow = 1;
    const consider = (ot, ou, or, person, solid = !person) => {
      const ahead = (ot - p.t) * p.dir, gap = Math.abs(ou - au), need = or + 0.36;
      if (ahead < -0.2 || ahead > 4.5 || gap > need + 0.3) return;
      if (ahead < nearest) {
        nearest = ahead;
        const side = person ? p.dir * sgn : (au >= ou ? 1 : -1); // people pass each other on the right; objects on whichever side is nearer
        let g = ou + side * (need + 0.22); if (g < LO || g > HI) g = ou - side * (need + 0.22);
        goal = g >= LO && g <= HI ? g : Math.abs(p.u0);
        if (solid && !(g >= LO && g <= HI) && ahead < 1.7) shut = true; // no way round something solid: turn back, rather than walk on the spot against it
      }
    };
    const h = heroTU.get(piece), heroNear = h.t > -1 && h.t < pc.L + 1 && Math.sign(h.u) === sgn && Math.abs(h.u) > LO - 0.9;
    for (const o of piece.obstTU) if (Math.sign(o.u) === sgn) consider(o.t, Math.abs(o.u), o.r, false);
    for (const q of people) if (q !== p && q.piece === piece && Math.sign(q.u) === sgn) consider(q.t, Math.abs(q.u), 0.3, true);
    if (heroNear) consider(h.t, Math.abs(h.u), 0.36, true, true);
    if (shut && !(p.turned > frameNo)) { p.dir = -p.dir; p.turned = frameNo + 200; }
    if (p.gu === undefined) { p.gu = au; p.lat = 0; }
    p.gu += (goal - p.gu) * Math.min(1, dt * 2.5);                              // the side they are aiming for changes smoothly
    p.v += clamp((p.hold ? 0 : p.dir * p.speed * slow) - p.v, -2.2 * dt, 2.2 * dt);            // speed eases up and down
    const step = clamp(p.gu - au, -0.9 * dt, 0.9 * dt);
    const nt = p.t + p.v * dt, nu = clamp(au + step, LO, HI);
    // Nobody is shoved sideways or held back: people simply steer round what is ahead in good time and keep walking.
    p.t = clamp(nt, 0.5, pc.L - 0.5); p.u = sgn * nu;
    if (p.t > pc.L - 1.6) p.dir = -1; else if (p.t < 1.6) p.dir = 1;
    // They face the way they are walking, turning gently; small sideways corrections do not swing the body about.
    p.lat += (step / dt * sgn - p.lat) * Math.min(1, dt * 3);
    if (Math.abs(p.v) > 0.3) p.face += angDiff(Math.atan2(p.lat * 0.6, -p.v), p.face) * Math.min(1, dt * 3.5);
    pt(pc, p.t, p.u, piece.y, p.obj.position);
    p.obj.rotation.y = _o.h + p.face;
    const sp = Math.abs(p.v);
    p.wWalk += (Math.min(1, sp / 0.5) - p.wWalk) * Math.min(1, dt * 4);        // blend between standing and walking
    p.walk.setEffectiveWeight(p.wWalk); p.idle.setEffectiveWeight(1 - p.wWalk);
    p.inner.position.y = p.baseY + lerp(p.kind.lift, p.kind.liftWalk, p.wWalk) * p.big;   // feet stay on the ground whether standing or striding
    p.walk.timeScale = clamp(sp / p.stride, 0.45, 1.4);                         // steps match ground speed, so feet do not slide
    _v.copy(p.obj.position).applyMatrix4(piece.g.matrix);
    const d2 = (_v.x - cam.x) ** 2 + (_v.z - cam.z) ** 2;
    p.obj.visible = d2 < SEE_PEOPLE * SEE_PEOPLE; // beyond this they are lost in the haze
    const shadowOn = d2 < 30 * 30; if (shadowOn !== p.shadowOn) { p.shadowOn = shadowOn; for (const sh of p.shadows) sh.visible = shadowOn; for (const o of p.hi) o.castShadow = shadowOn; } // shadows only close by
    const close = d2 < 16 * 16; if (close !== p.close) { p.close = close; p.inner.traverse((o) => { if (o.isMesh) o.frustumCulled = !close; }); } // anyone this near is always drawn, never dropped as they pass the edge of the view
    const fine = d2 < 26 * 26; if (fine !== p.fine && p.lo.length) { p.fine = fine; for (const o of p.hi) o.visible = fine; for (const o of p.lo) o.visible = !fine; } // full detail near you, the light body further off
    if (!p.obj.visible) continue;
    if ((_v.x - cam.x) * camFwd.x + (_v.z - cam.z) * camFwd.z < -3) continue;    // behind you: no need to move their limbs
    if (d2 < 28 * 28) p.mixer.update(dt);                                        // near: animate every frame
    else if (d2 < 70 * 70) { if ((frameNo + p.id) % 2 === 0) p.mixer.update(dt * 2); } // farther: every other frame
    else if ((frameNo + p.id) % 4 === 0) p.mixer.update(dt * 4);               // far off: every fourth
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
  sfx.traffic = loop('bandpass', 260, 0.8, 0);     // nearby cars; loudness follows how close and fast they are
  ctx.resume(); // (the music and the hum of traffic are gone: the street is quiet)
}
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown']) window.addEventListener(ev, startSound, { passive: true });
function footstep(loud) { // a soft thud, nothing more
  const ctx = sfx.ctx; if (!ctx || ctx.state !== 'running') return; const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.07);
  const og = ctx.createGain(); og.gain.setValueAtTime(0.13 * loud, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o.connect(og); og.connect(sfx.out); o.start(t); o.stop(t + 0.09);
}
// Music, also made in code: a laid-back lo-fi beat. Warm electric-piano chords (jazzy sevenths and
// ninths, strummed rather than struck all at once), a round bass that walks between them, soft drums
// with a swing and a little hand-drum pattern for a Lagos feel, and a written guitar-like tune that
// comes and goes. Every note is played slightly early or late and slightly louder or softer, like a
// person would, and the whole mix runs through a gently wobbling "tape" so it never sounds like a machine.
// It plays while you play; the button at the top turns it off and on, and the choice is remembered.
const music = { on: true, gain: null, bus: null, next: 0, step: 0, r: rng(2026) };
try { music.on = localStorage.getItem('hustle-music') !== 'off'; } catch (e) { /* private window: just start with music on */ }
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);                                       // midi number -> pitch
const BPM = 78, S16 = 60 / BPM / 4, SWING = 0.036;
const SONG = [ // one chord a bar: the notes of the chord, and the bass note under it
  { keys: [50, 53, 57, 60, 64], bass: 38 },   // D minor 9
  { keys: [53, 57, 59, 64], bass: 43 },       // G 13
  { keys: [52, 55, 59, 62], bass: 36 },       // C major 9
  { keys: [55, 59, 60, 64], bass: 33 },       // A minor 9
];
const TUNE = [ // the melody, eight bars long: [sixteenth it starts on, note, how many sixteenths it lasts]
  [2, 76, 2], [4, 74, 2], [7, 69, 3], [12, 72, 4], [18, 71, 2], [20, 74, 3], [26, 76, 2], [28, 79, 4],
  [34, 76, 2], [36, 74, 2], [39, 71, 3], [44, 67, 4], [50, 69, 2], [52, 72, 2], [55, 76, 5],
  [66, 81, 2], [68, 79, 2], [71, 76, 3], [76, 74, 4], [82, 74, 2], [84, 76, 2], [87, 79, 3], [92, 71, 4],
  [98, 72, 2], [100, 76, 2], [103, 79, 3], [106, 76, 2], [108, 74, 4], [114, 72, 3], [119, 69, 6],
];
function startMusic() {
  const ctx = sfx.ctx, g = music.gain = ctx.createGain(); g.gain.value = music.on ? 0.55 : 0;
  const bus = music.bus = ctx.createGain();
  const tape = ctx.createDelay(0.1); tape.delayTime.value = 0.014;                       // tape wobble: the pitch drifts a hair up and down
  for (const [rate, depth] of [[0.31, 0.0011], [2.1, 0.00028]]) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = rate; lg.gain.value = depth; l.connect(lg); lg.connect(tape.delayTime); l.start(); }
  const warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 3100; warm.Q.value = 0.4;
  const soft = ctx.createWaveShaper(), curve = new Float32Array(257); for (let i = 0; i < 257; i++) curve[i] = Math.tanh((i / 128 - 1) * 1.6) / Math.tanh(1.6); soft.curve = curve; // gentle saturation
  const echo = ctx.createDelay(1), back = ctx.createGain(), wet = ctx.createGain(); echo.delayTime.value = S16 * 3; back.gain.value = 0.28; wet.gain.value = 0.16;
  bus.connect(tape); tape.connect(warm); warm.connect(soft); soft.connect(g); g.connect(ctx.destination);
  warm.connect(echo); echo.connect(back); back.connect(echo); echo.connect(wet); wet.connect(g);
  music.next = ctx.currentTime + 0.3;
  setInterval(() => { // keep about half a second of notes queued up ahead
    if (!music.on || ctx.state !== 'running') { music.next = ctx.currentTime + 0.2; return; }
    while (music.next < ctx.currentTime + 0.6) { playStep(music.step++, music.next); music.next += S16; }
  }, 100);
}
function env(t, peak, attack, hold, release) { // a note's loudness over time
  const g = sfx.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release); g.connect(music.bus); return g;
}
function epiano(freq, t, vel, len) { // electric piano: a pure tone whose bright "tine" attack quickly mellows
  const ctx = sfx.ctx, car = ctx.createOscillator(), mod = ctx.createOscillator(), idx = ctx.createGain(), end = t + len + 1.3;
  car.frequency.value = freq * (1 + (music.r() - 0.5) * 0.003); mod.frequency.value = freq * 2;
  idx.gain.setValueAtTime(freq * 2.2 * vel, t); idx.gain.exponentialRampToValueAtTime(freq * 0.12, t + 0.3);
  mod.connect(idx); idx.connect(car.frequency); car.connect(env(t, 0.085 * vel, 0.006, len * 0.5, len * 0.5 + 1.1));
  car.start(t); mod.start(t); car.stop(end); mod.stop(end);
}
function pluck(freq, t, vel, len) { // the tune: a soft plucked string that opens bright and closes, with a little vibrato on held notes
  const ctx = sfx.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), end = t + len + 0.9;
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = freq; o2.frequency.value = freq * 1.002;
  f.type = 'lowpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(650, t + 0.35);
  if (len > 0.5) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 5.2; vg.gain.setValueAtTime(0, t + 0.25); vg.gain.linearRampToValueAtTime(freq * 0.006, t + 0.6); v.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency); v.start(t); v.stop(end); }
  const g = env(t, 0.06 * vel, 0.008, len * 0.4, len * 0.6 + 0.7); o.connect(f); o2.connect(f); f.connect(g); o.start(t); o2.start(t); o.stop(end); o2.stop(end);
}
function bass(freq, t, vel, len) { // round and deep, sliding up into the note
  const ctx = sfx.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), end = t + len + 0.3; o2.type = 'triangle';
  for (const [x, k] of [[o, 1], [o2, 2]]) { x.frequency.setValueAtTime(freq * k * 0.94, t); x.frequency.exponentialRampToValueAtTime(freq * k, t + 0.05); x.start(t); x.stop(end); }
  o.connect(env(t, 0.26 * vel, 0.012, len * 0.7, len * 0.3 + 0.18)); o2.connect(env(t, 0.035 * vel, 0.012, len * 0.5, 0.2));
}
function drum(kind, t, vel) {
  const ctx = sfx.ctx;
  if (kind === 'kick') { const o = ctx.createOscillator(); o.frequency.setValueAtTime(125, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.11); o.connect(env(t, 0.5 * vel, 0.003, 0.03, 0.22)); o.start(t); o.stop(t + 0.3); return; }
  if (kind === 'hand') { const o = ctx.createOscillator(); o.frequency.setValueAtTime(vel > 0.6 ? 262 : 196, t); o.frequency.exponentialRampToValueAtTime(vel > 0.6 ? 215 : 165, t + 0.09); o.connect(env(t, 0.07 * vel, 0.003, 0.01, 0.12)); o.start(t); o.stop(t + 0.2); return; } // a small hand drum
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(); n.buffer = sfx.noise;
  if (kind === 'snare') { // a short, dull rim-and-snare snap, not a hiss
    f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.9; n.connect(f); f.connect(env(t, 0.12 * vel, 0.002, 0.012, 0.085)); n.start(t, music.r() * 1.5, 0.12);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.06); o.connect(env(t, 0.12 * vel, 0.002, 0.01, 0.08)); o.start(t); o.stop(t + 0.12);
  } else { f.type = 'highpass'; f.frequency.value = 6500; n.connect(f); f.connect(env(t, 0.028 * vel, 0.001, 0.004, 0.028)); n.start(t, music.r() * 1.5, 0.05); } // hat: the faintest tick
}
function playStep(n, t0) { // one sixteenth note
  const r = music.r, s = n % 16, bar = Math.floor(n / 16), part = bar % 32, c = SONG[bar % 4], nextC = SONG[(bar + 1) % 4];
  const t = t0 + (s % 2 ? SWING : 0) + (r() - 0.5) * 0.012;                                 // swung, and never exactly on the grid
  const full = part >= 4 && !(part === 16 || part === 17), busy = bar % 2 === 1;            // drums rest for the first four bars and for a two-bar break
  // chords: a long one at the start of the bar and a short push later, strummed from the bottom up
  const strum = (vel, len) => c.keys.forEach((m, i) => epiano(NOTE(m), t + i * (0.016 + r() * 0.012), vel * (0.8 + r() * 0.3), len));
  if (s === 0) strum(0.9, S16 * 7);
  if (s === (busy ? 6 : 10)) strum(0.6, S16 * 2.5);
  if (busy && s === 11) strum(0.5, S16 * 3);
  // bass: the root, a push, the note above, and a step leading into the next chord
  if (s === 0) bass(NOTE(c.bass), t, 1, S16 * 5);
  if (s === 7) bass(NOTE(c.bass), t, 0.7, S16 * 1.6);
  if (s === 10) bass(NOTE(c.bass + (busy ? 12 : 7)), t, 0.8, S16 * 2.5);
  if (s === 14) bass(NOTE(nextC.bass + (nextC.bass > c.bass ? -1 : 1)), t, 0.7, S16 * 1.6);
  // drums
  if (full) {
    if (s === 0 || s === 10 || s === (busy ? 6 : 7)) drum('kick', t, s ? 0.75 : 1);
    if (s === 4 || s === 12) drum('snare', t, 0.85 + r() * 0.2);
    if (s === 3 || s === 9 || s === 14) drum('hand', t, s === 9 ? 0.9 : 0.5);
  }
  if (part >= 2 && (s % 2 === 0 || (s === 15 && r() < 0.4))) drum('hat', t, (s % 4 === 2 ? 1 : 0.55) * (0.8 + r() * 0.4));
  // the tune plays in the second half of every sixteen bars, the second time an octave lower and softer
  if ((part >= 8 && part < 16) || part >= 24) {
    const at = (bar % 8) * 16 + s, low = part >= 24;
    for (const [st, m, len] of TUNE) if (st === at) pluck(NOTE(m - (low ? 12 : 0)), t, (low ? 0.8 : 1) * (0.85 + r() * 0.3), len * S16);
  }
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
  sfx.traffic.gain.value = 0;
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
const carKinds = [], cars = [], CAR_MAX = 22, LANES = [2.1];
// What the cars mirror: the sky photograph above the horizon, the street's greys below it, blurred into a reflection map.
// It is ready a moment after the photograph has been decoded; every car material made before then is given it afterwards.
const CAR_MATS = []; let CAR_ENV = null;
const shiny = (m) => { m.userData.env = m.envMapIntensity; CAR_MATS.push(m); if (CAR_ENV) m.envMap = CAR_ENV; return m; };
if (HQ) { const img = new Image(); img.onload = () => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  const off = ((0.5 - (0.5944 - Math.atan2(SUN_DIR.z, SUN_DIR.x) / (2 * Math.PI))) % 1 + 1) % 1 * 1024; // turned so the sun in the mirror is where the sun is
  g.drawImage(img, off, 0, 1024, 256); g.drawImage(img, off - 1024, 0, 1024, 256);
  const gr = g.createLinearGradient(0, 256, 0, 512); gr.addColorStop(0, '#c9d2d8'); gr.addColorStop(0.12, '#8d8f8e'); gr.addColorStop(0.4, '#55565a'); gr.addColorStop(1, '#3a3b3f'); g.fillStyle = gr; g.fillRect(0, 256, 1024, 256);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer); CAR_ENV = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose(); URL.revokeObjectURL(img.src);
  for (const m of CAR_MATS) { m.envMap = CAR_ENV; m.needsUpdate = true; }
}; img.src = URL.createObjectURL(new Blob([skyJpg], { type: 'image/jpeg' })); }
new GLTFLoader().parse(carsGlb.buffer.slice(carsGlb.byteOffset, carsGlb.byteOffset + carsGlb.byteLength), '', (gltf) => {
  const root = gltf.scene, bodies = [], wheels = [], box = new THREE.Box3(), wb = new THREE.Box3(), c = new THREE.Vector3(), size = new THREE.Vector3(), ctr = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.traverse((o) => { if (o.isMesh || !o.children.some((k) => k.isMesh)) return; if (/wheel/i.test(o.name)) wheels.push(o); else if (/body/i.test(o.name)) bodies.push(o); });
  const matOf = new Map(), light = (m) => { // simple, cheap materials: paint and lights keep their texture, glass is dark
    if (!matOf.has(m)) matOf.set(m, !HQ ? (/glass/i.test(m.name) ? new THREE.MeshLambertMaterial({ color: '#1b2530' }) : Object.assign(new THREE.MeshLambertMaterial({ map: m.map, color: m.map ? '#ffffff' : m.color }), { name: m.name }))
      : /glass/i.test(m.name) ? shiny(new THREE.MeshStandardMaterial({ color: '#10161c', metalness: 0.25, roughness: 0.12, envMapIntensity: 0.3, name: m.name }))                                        // dark glass that mirrors the sky
      : /^body/i.test(m.name) ? shiny(new THREE.MeshPhysicalMaterial({ map: m.map, metalness: 0.08, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.35, envMapIntensity: 0.22, name: m.name })) // paint that shows its own colour, with only a faint gloss     // lacquered paint
      : /optic/i.test(m.name) ? shiny(new THREE.MeshStandardMaterial({ map: m.map, emissive: '#ffffff', emissiveMap: m.map, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.15, name: m.name }))  // lamps with a little glow
      : shiny(new THREE.MeshStandardMaterial({ map: m.map, color: m.map ? '#ffffff' : m.color, metalness: 0.15, roughness: 0.7, envMapIntensity: 0.2, name: m.name })));                              // tyres, rims, trim
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
    const paints = []; m.inner.traverse((o) => { if (o.isMesh && /^body/i.test(o.material.name) && !paints.length) for (const t of ['#eeeeea', '#b9bdc2', '#6f757c', '#3a3d42', '#15161a', '#15161a', '#8a1c1c', '#1c2e55', '#23513a', '#c9b98a', '#d9a81e', '#2a5d9a']) { const pm = Object.assign(o.material.clone(), { color: new THREE.Color(t), name: o.material.name }); if (HQ) shiny(pm); paints.push(pm); } });
    const th = (m.alongX ? -Math.PI / 2 : 0) + (m.sig.sign > 0 ? Math.PI : 0), ap = turn(1, 0, -th), al = turn(ap[0], ap[1], -m.best); // the axle (the car's own left-right line) as the wheels see it
    carKinds.push({ axleVec: new THREE.Vector3(al[0], 0, al[1]).normalize(), name: m.name, sig: m.sig, tpl, paints, half: m.len * k / 2, halfW: m.wid * k / 2, rad: m.rad * k, axle: m.alongX ? 'z' : 'x' });
  }
  makeRideArt();
}, (e) => console.error('cars failed to load', e));
const carPos = (c) => (c.axis === 'z' ? [c.line * PITCH + F - c.dir * c.lane, c.s] : [c.s, c.line * PITCH + F + c.dir * c.lane]); // keep right
function spawnCar() {
  const axis = Math.random() < 0.5 ? 'z' : 'x', hi = Math.floor(hero.x / PITCH), hj = Math.floor(hero.z / PITCH), along = axis === 'z' ? hero.z : hero.x;
  const c = { axis, line: (axis === 'z' ? hi : hj) + Math.floor(Math.random() * 4) - 1, dir: Math.random() < 0.5 ? 1 : -1, lane: LANES[0], s: along + (Math.random() * 2 - 1) * 148, v: 0, vmax: 6.5 + Math.random() * 4.5 };
  const [x, z] = carPos(c), off = c.s - Math.floor(c.s / PITCH) * PITCH;
  if (Math.hypot(x - hero.x, z - hero.z) < (settled ? 122 : 38) || off < RW + 4) return;                                                   // not right beside you, not inside a junction
  if (cars.some((o) => o.axis === c.axis && o.line === c.line && o.dir === c.dir && o.lane === c.lane && Math.abs(o.s - c.s) < 11)) return;
  const kind = carKinds[Math.floor(Math.random() * carKinds.length)], paint = kind.paints[Math.floor(Math.random() * kind.paints.length)];
  c.kind = kind; c.obj = kind.tpl.clone(true); c.wheels = [];
  c.obj.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = HQ; if (o.name === 'wheel') c.wheels.push(o); if (o.isMesh && paint && /^body/i.test(o.material.name)) o.material = paint; });
  c.v = c.vmax; c.obj.rotation.y = c.axis === 'z' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  if (HQ) { const patch = FOOT_SHADE.clone(); patch.scale.set(kind.halfW * 2.5, 1, kind.half * 2.25); patch.position.y = 0.025; patch.renderOrder = 4; c.obj.add(patch); } // a soft dark patch where the car meets the road
  scene.add(c.obj); cars.push(c);
}
function updateTraffic(dt) {
  if (!carKinds.length) return;
  for (let n = 0; n < 5 && cars.length < CAR_MAX; n++) spawnCar();
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i], half = c.kind.half, [x, z] = carPos(c);
    const far = Math.hypot(x - hero.x, z - hero.z); if (far > 152) { scene.remove(c.obj); cars.splice(i, 1); continue; } // left the area
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
    const inLane = ha > -1 && ha < 14 && hl < c.kind.halfW + 0.9; c.see = inLane ? (c.see || 0) + dt : 0; // a driver needs a moment to notice someone who steps out
    if (c.wait > 0) { c.wait -= dt; want = 0; }
    if (inLane && (c.see > 0.45 || ha > 9 || hero.down > 0)) { want = Math.min(want, Math.max(0, (ha - 2.5) * 1.3)); c.held = c.v < 0.3 ? (c.held || 0) + dt : 0; if (c.held > 2) { horn(1); c.held = 0; } } // a driver you keep waiting sounds the horn
    c.v += clamp(want - c.v, -11 * dt, 3.2 * dt);
    c.s += c.dir * c.v * dt;
    const [nx, nz] = carPos(c); c.obj.position.set(nx, 0, nz);
    if (c.v > 2.6 && ha > -1.1 && ha < 0.25 && hl < c.kind.halfW + 0.3) carHit(c); // its bonnet has reached you while it was still moving
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
const BLOCK = 72, RW = 2 * F, PITCH = BLOCK + RW, MID = BLOCK / 2, VIEW = PHONE ? 118 : 150;
const cells = new Map(), zones = [], jobs = [];
const hash2 = (i, j, k) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const laneDir = (i, j) => (hash2(i, j, 1) < 0.5 ? 'z' : 'x');                                             // which way the inner street crosses block (i, j)
const ESTATE = { residential: true, types: { duplex: 0.36, terrace: 0.1, modern: 0.26, shop: 0.28 }, apt: [3, 4], trees: 0.8, plants: { palm: 0.45, shade: 0.35, slender: 0.1, banana: 0.1 }, stalls: 0 }; // (no stalls: their umbrellas stood out into the road)
const districtAt = () => ESTATE; // for now the whole map is one estate of inner streets; the highway and the city come later
const districtAtOld = (i, j) => DISTRICTS[Math.floor(hash2(Math.floor(i / 2), Math.floor(j / 2), 2) * DISTRICTS.length)]; // districts come in clusters of 2 x 2 blocks
function disposeGroup(g) { g.traverse((o) => { if (o.userData.own && o.geometry) o.geometry.dispose(); }); scene.remove(g); }
function drawCross(B) { // junction: tarred square, sidewalk corners with painted kerbs, zebra crossings on all four sides
  B.box(ROAD_C, 2 * F, 0.1, 2 * F, 0, -0.05, -F);
  for (const sx of [-1, 1]) for (const far of [0, 1]) { // each corner of pavement is rounded where it meets the crossing, with its kerbstones laid round the curve
    const zs = far ? -1 : 1, ax = sx * 7.2, az = far ? -2 * F + 3.6 : -3.6, R = 2.6, n = 6, P = (dx, dz, y = 0.28) => V3(ax + sx * dx, y, az + zs * dz);
    const arc = Array.from({ length: n + 1 }, (_, i) => { const a = -Math.PI / 2 - i * Math.PI / 2 / n; return [R + R * Math.cos(a), R + R * Math.sin(a)]; }), poly = [P(3.6, 3.6), P(3.6, 0), ...arc.map(([x, z]) => P(x, z)), P(0, 3.6)];
    for (let i = 1; i < poly.length - 1; i++) { const A = poly[0], Bp = poly[i], C = poly[i + 1], up = (Bp.z - A.z) * (C.x - A.x) - (Bp.x - A.x) * (C.z - A.z) > 0; B.triF(PAVE_C, A, up ? Bp : C, up ? C : Bp); }
    const kerb = (x0, z0, x1, z1, k) => { const a = P(x0, z0, 0.167), b = P(x1, z1, 0.167), len = a.distanceTo(b); B.add(T.box, k % 2 ? '#1d1d1e' : '#efefec', M((a.x + b.x) / 2, 0.167, (a.z + b.z) / 2, len + 0.03, 0.335, 0.25, 0, -Math.atan2(b.z - a.z, b.x - a.x), 0)); };
    arc.slice(0, -1).forEach(([x, z], i) => kerb(x - 0.09, z - 0.09, arc[i + 1][0] - 0.09, arc[i + 1][1] - 0.09, i));
    kerb(R, -0.125, 3.6, -0.125, 1); kerb(-0.125, R, -0.125, 3.6, 0);
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
    buildRoad(g, B, pc, r, D, { rentals: part === 2 && i === 0 && j === 0 ? RENTALS.map((q, k) => ({ ...q, side: 1, t: 5 + k * 0.01 })) : null, stores: part === 2 && i === 0 && j === 0 ? [{ side: -1, t: 13, w: 22, store: 'furniture', label: 'FURNITURE' }, { side: -1, t: 13.01, w: 22, store: 'grocery', label: 'SUPERMARKET' }] : null, street: (part === 1 ? NAMES_Z[wrap(i, NAMES_Z.length)] : NAMES_X[wrap(j, NAMES_X.length)]).toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase()), slots, wide: false, lotStart: part === 1 ? 14.6 : 0, lotEnd: part === 1 ? 14.6 : 0, numBase: wrap(part === 1 ? j : i, 40) * 24, numRev: part === 1 }); // numbers carry on along the street from block to block
    if (part === 1) for (const s of [-1, 1]) for (const z of [-7.3, -BLOCK + 7.3]) B.box('#d8d0bc', 0.2, 2.3, 14.4, s * (F + 0.12), 1.15, z); // wall along the side of each corner plot
    addZone(cell, g, pc, B, { lo: 8.5, hi: 10.45, y: 0.28, crowd: 4, seed }); // the walking strip starts clear of the kerbside trees and lights
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
  if ((treesLeft > 0 || SHRUBS.ready < SHRUBS.all.length || !carKinds.length || kinds.length < KINDS) && performance.now() - T0 < 30000) return; // nothing is built until the trees have arrived, or a street would be planted with the old ones
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
    if (!z.pop && budget && kinds.length === KINDS) { populate(z); z.pop = true; budget--; } // nobody is ever taken away while their street is still there
  }
}

/* ---------------- where you can walk ---------------- */
// Every main road, junction and inner street is open. Only buildings, walls
// and fences (the edges of the streets) and solid objects stop you.
function locate(x, z, lim, slack = 0) {
  const hs = homeSpot(x, z); if (hs) return hs;
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
const hero = { level: 0, obj: new THREE.Group(), x: 0, z: 0, y: 0.28, heading: Math.PI, speed: 0, mixer: null, acts: null, stride: 1.75, w: [1, 0, 0], placed: false, dist: 0 };
scene.add(hero.obj);
// (the main character is set up with the walkers, from the same realistic models)


/* ---------------- input: joystick to walk, drag to look ---------------- */
const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 }, keys = {};
let camYaw = Math.PI, camPitch = 0.18;
const canvas = renderer.domElement, joyEl = document.getElementById('joy'), knobEl = document.getElementById('knob');
function placeJoy(x, y, kx, ky) { joyEl.style.left = x + 'px'; joyEl.style.top = y + 'px'; knobEl.style.transform = `translate(${kx}px, ${ky}px)`; }
function restJoy() { joyEl.classList.remove('on'); placeJoy(window.innerWidth - 62, window.innerHeight - 58, 0, 0); } // level with the menu button across the screen
restJoy(); window.addEventListener('resize', restJoy);
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  if (joy.id === null && e.clientX > window.innerWidth * 0.5 && e.clientY > window.innerHeight * 0.4) { // right thumb: walk
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
window.addEventListener('keydown', (e) => { if (e.target && e.target.tagName === 'INPUT') return; keys[e.code] = 1; uiKey(e); }); /* (typing a message moves nobody) */
window.addEventListener('keyup', (e) => { keys[e.code] = 0; });
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/* ---------------- the journey: money, a place to live, making it a home ---------------- */
// Everyone starts with a backpack and some money of their own (CONFIG.startMoney). The first thing to do is
// find somewhere to live: three houses just along the street are for rent. You walk up, knock on
// the gate, the landlord comes out and opens it, you agree the rent, and the door is yours to
// walk through. The place is empty; whatever you buy for it comes out of your million.
// Nothing here is a menu that teleports you: every place is somewhere you walk to.
const CUR = (() => { // which money to count in, from where the player's device says it is
  let tz = '', region = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* stays unknown */ }
  try { region = new Intl.Locale(navigator.language).maximize().region || ''; } catch (e) { /* stays unknown */ }
  if (true) region = 'NG'; // for now everyone counts in naira, wherever they are
  else if (/^(Canada\/|America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Moncton|Whitehorse|Yellowknife|Iqaluit|Montreal)$)/.test(tz)) region = 'CA';
  else if (tz === 'Europe/London') region = 'GB';
  const forced = /cur=([A-Z]{2})/.exec(location.hash); if (forced) region = forced[1]; // testing: #cur=NG
  const T = { NG: ['₦', 'naira'], CA: ['C$', 'Canadian dollars'], US: ['$', 'dollars'], GB: ['£', 'pounds'], GH: ['GH₵', 'cedis'], KE: ['KSh ', 'shillings'], ZA: ['R', 'rand'], IN: ['₹', 'rupees'], AU: ['A$', 'Australian dollars'] };
  const [sym, word] = T[region] || (['DE', 'FR', 'ES', 'IT', 'NL', 'IE', 'PT', 'BE', 'AT', 'FI', 'GR'].includes(region) ? ['€', 'euros'] : T.US);
  return { sym, word, region };
})();
const cash = (n) => CUR.sym + Math.round(n).toLocaleString('en-US');
const SAVE_KEY = 'hustle-save-v1';
const game = { money: logic.freshGame(CONFIG), curV: 1, home: -1, items: [], seenHome: false, pack: null, hero: 'leo', heroV: 2 };
try {
  if (location.hash.includes('new')) localStorage.removeItem(SAVE_KEY); // testing: #new starts again from nothing
  const sv = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (sv && typeof sv.money === 'number' && Array.isArray(sv.items)) { Object.assign(game, sv); if (sv.heroV !== 2) { game.hero = 'leo'; game.heroV = 2; } if (sv.curV !== 1) { game.money = CONFIG.startMoney; game.curV = 1; } game.money = logic.loadMoney(game.money, CONFIG); /* a broken save can never start below 0 */ } /* the move to naira: an older save starts again with the new game's money (CONFIG.startMoney); Leo became the main character; an older save moves over to him once */
} catch (e) { /* no saved game: start fresh */ }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) { /* not remembered, that is all */ } }

const HS = 1.2; // the houses you can enter are built a fifth larger than their plans, so the rooms suit the people who walk in
const RENTALS = [ // w = width of the plot, hw and d = the house itself (as planned, before it is enlarged), kind = which person model is the landlord
  { id: 0, w: 17, hw: 11, d: 9.5, price: 120000, name: 'Starter duplex', paint: '#e9d9b0', roof: '#a5492f', door: '#2d6fb0', who: 'Mr. Cole', kind: 1,
    about: 'Two floors, two bedrooms and plenty of light.', more: 'It is clean, the roof is new, and the street is quiet at night.' },
  { id: 1, w: 17, hw: 11, d: 9.5, price: 250000, name: 'Garden duplex', paint: '#d9a68a', roof: '#3a3d42', door: '#7a4a2a', who: 'Mrs. Bello', kind: 2,
    about: 'There is room to live and room to work.', more: 'The last tenant stayed six years. It is bigger than it looks from the road.' },
  { id: 2, w: 17, hw: 11, d: 9.5, price: 450000, name: 'Family duplex', paint: '#f1ede2', roof: '#8a3b2a', door: '#1e8449', who: 'Mr. Santos', kind: 4,
    about: 'It is the best house on this stretch.', more: 'You will not outgrow it. Space for a big sofa, a proper table, everything.' },
];
const RENT = [null, null, null]; // the three houses as they stand in the world right now (rebuilt whenever their street is)
const GATE_GEO = mergeGeometries([[0.07, 2.0, 0.07, 1.0, 0.035], [0.07, 2.0, 0.07, 1.0, 1.765], ...Array.from({ length: 9 }, (_, i) => [0.04, 0.17, 1.8, 0.14 + i * 0.215, 0.9])].map(([a, b, c, y, z]) => new THREE.BoxGeometry(a, b, c).translate(0, y, z))); // a steel gate of horizontal slats, hinged at one edge
const DOOR_H = 2.12, DOOR_GEO = new THREE.BoxGeometry(0.06, DOOR_H, 1.4).translate(0, DOOR_H / 2, 0.7);
const doorMat = (col, indoors) => new THREE.MeshLambertMaterial({ map: canvasTex(128, 256, (g, w, h) => { // a panelled front door: four sunk panels, a letterbox and a brass handle
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  for (const [x, y, pw, ph] of [[14, 14, 44, 92], [70, 14, 44, 92], [14, 142, 44, 96], [70, 142, 44, 96]]) {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, y, pw, ph); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(x + 3, y + 4, pw - 3, ph - 4); g.fillStyle = col; g.fillRect(x + 3, y + 4, pw - 7, ph - 8);
    g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x + 3, y + 4, pw - 7, ph - 8); }
  g.fillStyle = '#c9a54a'; g.fillRect(108, 112, 9, 22); if (!indoors) { g.fillRect(44, 118, 40, 9); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(48, 121, 32, 3); } // a letterbox only on the front door
}) });
TEX.render = photoWall(wallPaintJpg, 2.5, '#efe3c8'); TEX.renderGrey = photoWall(wallPaintJpg, 2.5, '#d9d6cf'); TEX.roofClay = roofTex('#a4512f', 33);
// indoors: warm plaster walls, a ceiling that is never left dark, bedroom carpet, pleated curtains, and things that glow
TEX.wallWarm = photoWall(wallPaintJpg, 2.5, '#d5cfc4'); TEX.carpet = photoWall(rugWoolJpg, 0.9, '#e4e0f0');
TEX.ceiling = photoWall(wallPaintJpg, 2.5, '#f4efe6'); Object.assign(TEX.ceiling, { emissive: new THREE.Color('#ffffff'), emissiveMap: TEX.ceiling.map, emissiveIntensity: 0.42 });
const curtainTex = (col) => tiledTex((g) => { g.fillStyle = col; g.fillRect(0, 0, 256, 256); for (let x = 0; x < 256; x += 32) { const f = g.createLinearGradient(x, 0, x + 32, 0); f.addColorStop(0, 'rgba(0,0,0,0.26)'); f.addColorStop(0.45, 'rgba(255,255,255,0.14)'); f.addColorStop(1, 'rgba(0,0,0,0.26)'); g.fillStyle = f; g.fillRect(x, 0, 32, 256); } }, 0.6);
TEX.bathTile = tiledTex((g) => { const r = rng(77); g.fillStyle = '#9aa3a8'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 222 + Math.floor(r() * 18); g.fillStyle = `rgb(${v},${v + 3},${v + 6})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); const sh = g.createLinearGradient(x * 64, y * 64, x * 64 + 64, y * 64 + 64); sh.addColorStop(0, 'rgba(255,255,255,0.35)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.08)'); g.fillStyle = sh; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } }, 1.3);
const zincTex = (col, seed) => tiledTex((g) => { // long-span sheets: ridges running down the slope, each catching the light on one side, with a lap line where two sheets meet
  const r = rng(seed); g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) { const sh = g.createLinearGradient(x, 0, x + 16, 0); sh.addColorStop(0, 'rgba(0,0,0,0.34)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.22)'); sh.addColorStop(0.7, 'rgba(255,255,255,0.02)'); sh.addColorStop(1, 'rgba(0,0,0,0.34)'); g.fillStyle = sh; g.fillRect(x, 0, 16, 256); }
  for (let y = 0; y < 256; y += 128) { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, y, 256, 3); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, y + 3, 256, 2); }
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.fillRect(r() * 256, r() * 256, 2 + r() * 10, 20 + r() * 60); }
}, 1.6, true);
const ZINC = ['#8a2f25', '#2f5a4c', '#35577f', '#9aa3a8', '#5f3a28', '#33373d'].map((c, i) => zincTex(c, 60 + i));
const CLEAR_GLASS = new THREE.MeshBasicMaterial({ color: '#cfe8f2', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }); // real glass: from indoors you see the street and the people going by
const DRAPES = ['#d8ccb6', '#93a590', '#bd9f8f'].map((c) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide, emissive: '#16130f' }));
const CURTAINS = [curtainTex('#b9a98c'), curtainTex('#7d8b78'), curtainTex('#a3877a')];
const GLOW = new THREE.MeshLambertMaterial({ color: '#fff1d4', emissive: '#ffd89a', emissiveIntensity: 1.25 }), EMBER = new THREE.MeshLambertMaterial({ color: '#ff8a2a', emissive: '#ff5a12', emissiveIntensity: 1.6 });
const DARKWOOD = photoWall(floorWoodJpg, 1.3, '#7d573c'), SMOOTH = (c) => new THREE.MeshLambertMaterial({ color: c, emissive: '#0b0b0a' }), CAB_MAT = SMOOTH('#ebe6da'), SKIRT_MAT = SMOOTH('#f3efe6'), LEAF_MAT = doorMat('#6f4526', true);
const bothSides = (m) => m.userData.both || (m.userData.both = Object.assign(m.clone(), { side: THREE.DoubleSide })); // the same wall, for a part seen from either face
const COMPOUND_WALLS = [TEX.render, TEX.renderGrey, photoWall(wallPaintJpg, 2.5, '#e6d2ae'), photoWall(wallPaintJpg, 2.5, '#ead9c4'), photoWall(wallPaintJpg, 2.5, '#d9c7a6')];
const HOUSE_LOOK = [ // the outside of each house to rent: [ground-floor wall, upper wall], roof tiles, garden wall
  { walls: [TEX.stone, COMPOUND_WALLS[0]], roof: ZINC[0], fence: COMPOUND_WALLS[0], plinth: TEX.stone },
  { walls: [TEX.brickTan, COMPOUND_WALLS[3]], roof: ZINC[2], fence: COMPOUND_WALLS[3], plinth: TEX.brickRed },
  { walls: [TEX.stone, TEX.renderGrey], roof: ZINC[1], fence: TEX.renderGrey, plinth: TEX.stone },
];
const YARD = 4.4, FLOOR = 0.4, STOREY = 3.2, CEIL = 2.9, GATE_W = 1.8, WT = 0.14; // storey: floor to floor; ceil: clear height of a room; wt: thickness of an inside wall
const RENT_PIN_MAT = (() => { // a glossy coral pin with a white key, and a FOR RENT tag under it
  const tex = canvasTex(256, 360, (g) => g.clearRect(0, 0, 256, 360)), img = new Image(), drop = 'M60 144 C60 144 14 98 14 62 A46 46 0 0 1 106 62 C106 98 60 144 60 144z';
  img.onload = () => { const g = tex.image.getContext('2d'); g.clearRect(0, 0, 256, 360); g.drawImage(img, 0, 0, 256, 360); tex.needsUpdate = true; };
  img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="360" viewBox="0 0 120 169"><defs>
    <linearGradient id="p" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset=".55" stop-color="#ff5a3c"/><stop offset="1" stop-color="#e01e5a"/></linearGradient>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffe7e0"/></linearGradient>
    <filter id="b"><feGaussianBlur stdDeviation="4"/></filter><clipPath id="c"><path d="${drop}"/></clipPath></defs>
    <path d="${drop}" fill="#a3122e" opacity=".35" filter="url(#b)" transform="translate(0 4)"/><path d="${drop}" fill="url(#p)"/>
    <g clip-path="url(#c)"><circle cx="106" cy="128" r="44" fill="#c4124a" opacity=".35"/><ellipse cx="44" cy="30" rx="34" ry="20" fill="#fff" opacity=".3"/></g>
    <circle cx="48" cy="58" r="14" fill="none" stroke="url(#w)" stroke-width="8"/><path d="M58 66 L84 88 M74 80 L68 86 M80 85 L75 90" fill="none" stroke="url(#w)" stroke-width="7" stroke-linecap="round"/>
    <path d="${drop}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.400"/>
    <rect x="18" y="148" width="84" height="20" rx="10" fill="#fff"/><text x="60" y="162.500" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="11.500" fill="#e01e5a">FOR RENT</text></svg>`);
  return new THREE.SpriteMaterial({ depthTest: false, fog: false, transparent: true, map: tex });
})();
function rentSign(def, mine) { // an estate agent's board: a white face, a red band with FOR RENT, the house and its price, and a phone number
  return new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: canvasTex(512, 384, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d7192a'; g.fillRect(0, 0, w, 128);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 70px "Arial Black", Impact, sans-serif'; g.fillText('FOR RENT', w / 2, 68);
    g.fillStyle = '#16202b'; g.font = '700 36px Arial, Helvetica, sans-serif'; g.fillText(def.name, w / 2, 170);
    g.fillStyle = '#d7192a'; g.font = '900 52px "Arial Black", Impact, sans-serif'; g.fillText(cash(def.price) + ' / yr', w / 2, 232);
    g.fillStyle = '#16202b'; g.fillRect(0, 286, w, 98); g.fillStyle = '#ffd24a'; g.font = '800 30px Arial, Helvetica, sans-serif'; g.fillText('HOMEKEY ESTATES', w / 2, 316);
    g.fillStyle = '#fff'; g.font = '700 34px Arial, Helvetica, sans-serif'; g.fillText('0803 555 0142', w / 2, 356);
    g.strokeStyle = '#c9ced6'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  }) });
}
// The inside of each house is drawn from a plan, in the house's own measure: x runs across (0 at the front door),
// z runs back from the inside of the front wall, in metres; level 0 is the ground floor, 1 is upstairs.
//   walls  [along, at, from, to, level, ...doorways]  a partition along 'x' (at a z) or along 'z' (at an x), with [from, to] gaps for doorways
//   rooms  [name, x0, x1, z0, z1, level]                the rooms themselves (you can stand anywhere in one, a step clear of its walls)
//   ways   [x0, x1, z0, z1, level]                      the doorways and open sides that join one room to the next
//   put    where each thing you can buy goes: [x, z, facing, level]; N faces the back wall, S the front, E and W the side walls
function planFor(def) {
  const w = (def.hw - 0.44) / 2, D = def.d - 0.44, m = 0.32;
  if (def.plan === 'studio') return { levels: 1, w, D, // (kept for a later, smaller house) studio flat: one big room, with a bathroom boxed off in the back corner and a kitchen along the back wall
    walls: [['x', 4.2, 1.6, w, 0], ['z', 1.6, 4.2, D, 0, [4.8, 5.7]]],
    rooms: [['living', -w, 1.6, 0, D, 0], ['living', 1.6, w, 0, 4.2, 0], ['bath', 1.6, w, 4.2, D, 0]],
    ways: [[1.1, 2.1, m, 4.2 - m, 0], [1.1, 2.1, 4.95, 5.55, 0]],
    kitchen: [[-w + 0.95, -0.85, 0]], bath: [[1.6, w, 4.2, D, 0]], doors: [['z', 1.6, 4.78, 1, 0]], fire: [4.85, 0],
    put: { sofa: [0.4, 3.0, 'N', 0], tv: [0.4, D - 0.36, 'S', 0], table: [0.4, 4.5, 'N', 0], rug: [0.4, 4.4, 'N', 0], bed: [w - 1.25, 1.75, 'W', 0], dining: [-2.6, 1.45, 'N', 0],
      fridge: [-w + 0.48, D - 0.45, 'S', 0], lamp: [-1.1, 3.0, 'S', 0], plant: [w - 0.45, 3.75, 'S', 0], art: [2.7, 4.2 - 0.09, 'S', 0] } };
  if (def.plan === 'one-bed') return { levels: 1, w, D, // (kept for a later, smaller house) one-bedroom flat: living room in front, kitchen behind it, bedroom and bathroom down the right side
    walls: [['z', 1.4, 0, 4.4, 0, [0.5, 1.4]], ['x', 4.4, 1.4, w, 0], ['z', 1.4, 4.4, D, 0, [5.3, 6.2]]],
    rooms: [['living', -w, 1.4, 0, 4.4, 0], ['kitchen', -w, 1.4, 4.4, D, 0], ['bedroom', 1.4, w, 0, 4.4, 0], ['bath', 1.4, w, 4.4, D, 0]],
    ways: [[-w + m, 1.4 - m, 3.9, 4.9, 0], [0.9, 1.9, 0.65, 1.25, 0], [0.9, 1.9, 5.45, 6.05, 0]],
    kitchen: [[-w, 0.1, 0]], bath: [[1.4, w, 4.4, D, 0]], doors: [['z', 1.4, 0.48, 1, 0], ['z', 1.4, 5.28, 1, 0]], fire: [5.7, 0],
    put: { sofa: [-2.0, 2.9, 'E', 0], tv: [1.4 - 0.43, 2.9, 'W', 0], table: [-0.6, 2.9, 'E', 0], rug: [-0.7, 2.9, 'E', 0], bed: [w - 1.25, 2.85, 'W', 0], dining: [-2.4, 5.45, 'N', 0],
      fridge: [0.85, D - 0.45, 'S', 0], lamp: [-2.0, 1.25, 'S', 0], plant: [-w + 0.45, 0.5, 'S', 0], art: [-w + 0.09, 5.7, 'E', 0] } };
  return { levels: 2, w, D, // family house: living room, kitchen and a bathroom downstairs; a hall with stairs; two bedrooms and a bathroom upstairs
    walls: [['z', 2.2, 0, 6.8, 0, [0.5, 2.0]], ['x', 6.8, 2.2, w, 0, [2.65, 3.55]], ['z', 2.2, 6.8, D, 0],
      ['z', 2.2, 0, D, 1, [2.6, 3.5], [5.0, 5.9]], ['x', 4.47, -w, 2.2, 1], ['x', 6.8, 2.2, w, 1, [2.65, 3.55]]],
    rooms: [['living', -w, 2.2, 0, 5, 0], ['kitchen', -w, 2.2, 5, D, 0], ['hall', 2.2, 3.9, 0, 6.8, 0], ['hall', 3.9, w, 0, 1.0, 0], ['bath', 2.2, w, 6.8, D, 0],
      ['landing', 2.2, w, 5.8, 6.8, 1], ['landing', 2.2, 3.9, 0, 5.8, 1], ['bedroom', -w, 2.2, 0, 4.47, 1], ['bedroom2', -w, 2.2, 4.47, D, 1], ['bath', 2.2, w, 6.8, D, 1]],
    ways: [[-w + m, 2.2 - m, 4.5, 5.5, 0], [1.7, 2.7, 0.65, 1.85, 0], [3.4, 4.4, m, 1.0 - m, 0], [2.8, 3.4, 6.3, 7.3, 0],
      [2.52, 3.58, 5.3, 6.3, 1], [1.7, 2.7, 2.75, 3.35, 1], [1.7, 2.7, 5.15, 5.75, 1], [2.8, 3.4, 6.3, 7.3, 1]],
    stairs: { x0: 3.9, x1: w, z0: 1.0, z1: 5.8, steps: 16 },
    kitchen: [[-w, 0.3, 0]], bath: [[2.2, w, 6.8, D, 0], [2.2, w, 6.8, D, 1]],
    doors: [['x', 6.8, 2.63, 1, 0], ['x', 6.8, 2.63, 1, 1], ['z', 2.2, 3.52, -1, 1], ['z', 2.2, 4.98, -1, 1]],
    put: { sofa: [-1.3, 3.5, 'E', 0], tv: [2.2 - 0.43, 3.5, 'W', 0], table: [0.1, 3.5, 'E', 0], rug: [0.0, 3.5, 'E', 0], bed: [-1.7, 4.47 - 1.3, 'S', 1], dining: [-1.9, 6.7, 'N', 0],
      fridge: [1.6, D - 0.45, 'S', 0], lamp: [-1.3, 1.85, 'S', 0], plant: [-w + 0.5, 0.5, 'S', 0], art: [-w + 0.09, 4.3, 'E', 0] } };
}
// One house for rent: a fenced front yard with a gate, and a house you can really walk into, room by room (and upstairs, in the big one).
function rental(c) {
  const { P, B, g, s, r, rent: def } = c, w = c.w / HS, frame0 = B.frame.clone();
  B.frame.multiply(new THREE.Matrix4().makeTranslation(s * F, 0, 0)).multiply(new THREE.Matrix4().makeScale(HS, HS, HS)).multiply(new THREE.Matrix4().makeTranslation(-s * F, 0, 0)); // everything below is drawn larger, about the middle of the gateway
  const sb = YARD, hw = def.hw, d = def.d, plan = planFor(def), TOP = FLOOR + plan.levels * STOREY, IN = TEX.wallWarm, look = HOUSE_LOOK[def.id], X = (dep) => s * (F + dep);
  const STONE = '#d6d0c2', TRIM = '#f4f1ea', GUT = '#2f3134'; let EX = look.walls[0];
  for (const [a, b] of [[-w / 2 + 0.3, -GATE_W / 2 - 0.25], [GATE_W / 2 + 0.25, w / 2 - 0.3]]) { // fence either side of the gate
    const len = b - a, n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) { const lat = a + (len / n) * i; P(look.fence, 0.15, 0, lat, 0.5, 2.1, 0.5); P(STONE, 0.15, 2.1, lat, 0.64, 0.12, 0.64); P(STONE, 0.15, 2.22, lat, 0.4, 0.08, 0.4); }
    P(look.fence, 0.15, 0, (a + b) / 2, 0.24, 2.0, len); P(STONE, 0.15, 2.0, (a + b) / 2, 0.32, 0.07, len); razorWire(c, 0.15, a + 0.3, 0.15, b - 0.3, 2.07);
  }
  for (const e of [-1, 1]) { P(look.fence, (sb + d) / 2 + 0.1, 0, e * (w / 2 - 0.12), sb + d - 0.2, 1.9, 0.2); P(STONE, (sb + d) / 2 + 0.1, 1.9, e * (w / 2 - 0.12), sb + d - 0.2, 0.07, 0.3); razorWire(c, 0.4, e * (w / 2 - 0.12), sb + d, e * (w / 2 - 0.12), 1.97); } // brick walls down the sides of the plot, with a stone coping
  gatehouse(c, -(GATE_W / 2 + 0.5 + 0.97), TEX.render);
  P('#7a9c55', sb / 2 + 0.15, 0, 0, sb - 0.3, 0.27, w - 0.5);                                                       // lawn
  P('#c9c3b6', sb / 2 + 0.1, 0, 0, sb - 0.1, 0.285, 1.7); P('#c9c3b6', sb - 0.7, 0, 0, 1.3, 0.29, 2.9); P(STONE, sb - 0.34, 0, 0, 0.68, FLOOR, 2.0);          // path, a paved porch and the doorstep
  for (const e of [-1, 1]) for (let lat = 1.6; lat < w / 2 - 0.9; lat += 0.9) bush(B, r, X(0.75), 0.27, e * lat, 0.75, r() < 0.5 ? [pick(r, FLOWERS)] : BROAD, 6);
  // The shell: plaster-white inside, painted outside. Each floor has two front windows and a wide one on the sunny side; the ground floor has the door.
  const front = (l0, l1, y0, y1) => { P(IN, sb + 0.11, y0, (l0 + l1) / 2, 0.22, y1 - y0, l1 - l0); P(EX, sb - 0.02, y0, (l0 + l1) / 2, 0.05, y1 - y0, l1 - l0); };
  const side = (e, d0, d1, y0, y1) => { P(IN, (d0 + d1) / 2, y0, e * (hw / 2 - 0.11), d1 - d0, y1 - y0, 0.22); P(EX, (d0 + d1) / 2, y0, e * (hw / 2 + 0.02), d1 - d0, y1 - y0, 0.05); };
  const wc = hw / 4 + 0.45, ww = 1.7, s0 = sb + 1.3, s1 = sb + 3.9;
  for (let L = 0; L < plan.levels; L++) {
    const fy = FLOOR + L * STOREY, yb = L ? fy : 0, yt = fy + STOREY, sill = fy + 0.95, head = fy + 2.35, lintel = fy + 2.6; EX = look.walls[L] || look.walls[0];
    front(-hw / 2, hw / 2, lintel, yt);
    for (const e of [-1, 1]) {
      const seg = (a, b, y0, y1) => front(Math.min(e * a, e * b), Math.max(e * a, e * b), y0, y1);
      seg(L ? 0 : 0.7, wc - ww / 2, yb, lintel); seg(wc - ww / 2, wc + ww / 2, yb, sill); seg(wc - ww / 2, wc + ww / 2, head, lintel); seg(wc + ww / 2, hw / 2, yb, lintel);
      P(CLEAR_GLASS, sb + 0.11, sill, e * wc, 0.02, head - sill, ww);
      // the window dressed as a real one: a stone sill and lintel, and a white frame with a mullion and a transom, set back in the wall
      P(STONE, sb - 0.1, sill - 0.09, e * wc, 0.22, 0.09, ww + 0.26); P(STONE, sb - 0.06, head, e * wc, 0.05, 0.25, ww + 0.34);
      for (const q of [-1, 1]) P(TRIM, sb + 0.03, sill, e * wc + q * (ww / 2 - 0.035), 0.1, head - sill, 0.07);
      P(TRIM, sb + 0.03, sill, e * wc, 0.1, 0.06, ww); P(TRIM, sb + 0.03, head - 0.06, e * wc, 0.1, 0.06, ww); P(TRIM, sb + 0.04, sill, e * wc, 0.08, head - sill, 0.05); P(TRIM, sb + 0.04, sill + (head - sill) * 0.68, e * wc, 0.08, 0.045, ww);
    }
    { const sm = (s0 + s1) / 2, sl = s1 - s0, o = -(hw / 2); // the side window, dressed the same way
      P(STONE, sm, sill - 0.09, o - 0.1, sl + 0.26, 0.09, 0.22); P(STONE, sm, head, o - 0.06, sl + 0.34, 0.25, 0.05);
      for (const q of [-1, 1]) P(TRIM, sm + q * (sl / 2 - 0.035), sill, o + 0.03, 0.07, head - sill, 0.1);
      P(TRIM, sm, sill, o + 0.03, sl, 0.06, 0.1); P(TRIM, sm, head - 0.06, o + 0.03, sl, 0.06, 0.1); P(TRIM, sm + sl / 6, sill, o + 0.04, 0.05, head - sill, 0.08); P(TRIM, sm - sl / 6, sill, o + 0.04, 0.05, head - sill, 0.08); }
    if (L) for (const e of [-1, 1]) { // upstairs: dark shutters either side of each window, and a box of flowers under it
      for (const q of [-1, 1]) { P('#2c3944', sb - 0.05, sill, e * wc + q * (ww / 2 + 0.3), 0.05, head - sill, 0.44); for (let yy = sill + 0.12; yy < head - 0.08; yy += 0.16) P('#3b4a57', sb - 0.08, yy, e * wc + q * (ww / 2 + 0.3), 0.03, 0.05, 0.36); }
      P('#4c3526', sb - 0.24, sill - 0.36, e * wc, 0.28, 0.24, ww + 0.1); for (let q = -ww / 2 + 0.25; q < ww / 2; q += 0.4) bush(B, r, X(sb - 0.24), sill - 0.14, e * wc + q, 0.34, FLOWERS, 5); }
    if (L) { P(STONE, sb - 0.06, fy - 0.12, 0, 0.05, 0.22, hw + 0.16); for (const e of [-1, 1]) P(STONE, sb + d / 2, fy - 0.12, e * (hw / 2 + 0.06), d + 0.16, 0.22, 0.05); P(STONE, sb + d + 0.06, fy - 0.12, 0, 0.05, 0.22, hw + 0.16); } // a stone band where the upper floor begins
    side(1, sb, sb + d, yb, yt); side(-1, sb, s0, yb, yt); side(-1, s0, s1, yb, sill); side(-1, s0, s1, head, yt); side(-1, s1, sb + d, yb, yt);
    P(CLEAR_GLASS, (s0 + s1) / 2, sill, -(hw / 2 - 0.11), s1 - s0, head - sill, 0.02);
    P(IN, sb + d - 0.11, yb, 0, 0.22, yt - yb, hw); P(EX, sb + d + 0.02, yb, 0, 0.05, yt - yb, hw + 0.1);                       // back wall
  }
  P(TEX.ceiling, sb + d / 2, TOP - 0.16, 0, d + 0.3, 0.16, hw + 0.3);                                             // top ceiling
  // plinth round the foot of the walls, in stone
  for (const e of [-1, 1]) { P(look.plinth, sb - 0.07, 0, e * (hw / 4 + 0.53), 0.05, FLOOR + 0.12, hw / 2 - 0.94); P(look.plinth, sb + d / 2, 0, e * (hw / 2 + 0.07), d + 0.18, FLOOR + 0.12, 0.05); }
  P(look.plinth, sb + d + 0.07, 0, 0, 0.05, FLOOR + 0.12, hw + 0.18);
  // the front door: a white surround, a glazed fanlight over it, a lantern beside it, and a tiled porch on two posts
  for (const e of [-1, 1]) P(TRIM, sb - 0.05, FLOOR, e * 0.76, 0.07, 2.66, 0.12);
  P(TRIM, sb - 0.05, FLOOR + 2.6, 0, 0.07, 0.12, 1.64); P(TRIM, sb + 0.09, FLOOR + DOOR_H, 0, 0.12, 0.07, 1.4); P(DOOR_GLASS, sb + 0.11, FLOOR + DOOR_H + 0.07, 0, 0.05, 2.6 - DOOR_H - 0.07, 1.4);
  P('#1b1b1c', sb - 0.1, FLOOR + 1.72, 1.12, 0.1, 0.05, 0.16); P('#ffe6a8', sb - 0.11, FLOOR + 1.5, 1.12, 0.09, 0.22, 0.12); P('#1b1b1c', sb - 0.1, FLOOR + 1.46, 1.12, 0.1, 0.04, 0.16);
  { // the front, in the style of the other houses: a wide porch on four columns with a balcony and a steel handrail over it, stone piers at the corners, and steps up
    const pd = 1.9, ph = Math.min(hw / 2 - 0.5, 3.4), ey = FLOOR + STOREY - 0.2, STEEL_R = '#cfd4d8', tube = (dep, y, lat, len, alongLat, rad) => B.add(T.cyl, STEEL_R, alongLat ? M(X(dep), y, lat, rad, len, rad, Math.PI / 2, 0, 0) : M(X(dep), y, lat, rad, len, rad, 0, 0, Math.PI / 2));
    P('#bdb7aa', sb - pd / 2, 0, 0, pd, FLOOR - 0.02, 2 * ph); P('#aaa498', sb - pd - 0.2, 0, 0, 0.4, FLOOR * 0.5, 2 * ph - 1.2);
    for (const q of [-ph + 0.2, -1.15, 1.15, ph - 0.2]) { P(TRIM, sb - pd + 0.2, FLOOR - 0.02, q, 0.26, ey - FLOOR + 0.02, 0.26); P(TRIM, sb - pd + 0.2, FLOOR - 0.02, q, 0.38, 0.14, 0.38); P(TRIM, sb - pd + 0.2, ey - 0.12, q, 0.38, 0.12, 0.38); }
    P(TRIM, sb - pd / 2, ey, 0, pd + 0.12, 0.2, 2 * ph + 0.1); P('#d9d4c8', sb - pd / 2, ey + 0.2, 0, pd, 0.02, 2 * ph - 0.05);
    balconyDoor(c, sb, ey + 0.21, 0, TRIM, def.door);
    const y0 = ey + 0.2, fx = sb - pd + 0.08;
    for (let q = -ph + 0.06; q <= ph - 0.05; q += (2 * ph - 0.12) / Math.round(2 * ph / 1.1)) B.add(T.cyl, STEEL_R, M(X(fx), y0 + 0.5, q, 0.05, 1.0, 0.05));
    for (const yy of [0.25, 0.5, 0.75]) tube(fx, y0 + yy, 0, 2 * ph - 0.1, true, 0.028); tube(fx, y0 + 1.02, 0, 2 * ph - 0.06, true, 0.06);
    for (const e of [-1, 1]) { for (const yy of [0.25, 0.5, 0.75]) tube(sb - pd / 2, y0 + yy, e * (ph - 0.05), pd - 0.1, false, 0.028); tube(sb - pd / 2, y0 + 1.02, e * (ph - 0.05), pd - 0.06, false, 0.06); }
    for (const e of [-1, 1]) { P(TEX.stone, sb - 0.09, 0, e * (hw / 2 - 0.3), 0.18, TOP, 0.62); P(TEX.stone, sb + 0.3, 0, e * (hw / 2 + 0.09), 0.62, TOP, 0.18); }                       // stone piers wrapping the two front corners
    for (const e of [-1, 1]) { const px = sb + 0.9, pl = e * (hw / 2 + 0.1); B.add(T.cyl, '#e7e6e0', M(X(px), TOP / 2, pl, 0.1, TOP, 0.1)); for (let y = 0.6; y < TOP; y += 1.5) P('#b9b8b2', px, y, pl - e * 0.03, 0.14, 0.05, 0.1); } // round rainwater pipes
  }
  //                                                       // a downpipe from the gutter
  // The roof: two tiled slopes with real eaves, white fascia and bargeboards, gutters, the gable ends built in the wall's own brick, and a chimney
  const half = d / 2 + 0.6, rise = half * 0.58, rw = hw / 2 + 0.45, mid = sb + d / 2, eY = TOP + 0.02, rt = look.roof.userData.tile, slope = Math.hypot(half, rise), gm = bothSides(EX), gt = gm.userData.tile || 1;
  P('#ece8df', mid, TOP - 0.12, 0, 2 * half - 0.1, 0.13, hw + 0.12);                                             // soffit under the eaves
  for (const e of [-1, 1]) {
    B.quadF(look.roof, V3(X(mid + e * half), eY, -rw), V3(X(mid + e * half), eY, rw), V3(X(mid), eY + rise, rw), V3(X(mid), eY + rise, -rw), 0, slope / rt, 0, 2 * rw / rt);
    P(TRIM, mid + e * (half - 0.03), TOP - 0.18, 0, 0.05, 0.2, 2 * rw); P(GUT, mid + e * (half + 0.06), TOP - 0.1, 0, 0.12, 0.1, 2 * rw + 0.1);
    const gl = e * (hw / 2 + 0.045), gh = rise * (d / 2 + 0.05) / half;
    B.triUV(gm, [V3(X(sb - 0.05), TOP, gl), V3(X(sb + d + 0.05), TOP, gl), V3(X(mid), TOP + gh, gl)], [0, 0, (d + 0.1) / gt, 0, (d + 0.1) / 2 / gt, gh / gt]);
    for (const q of [-1, 1]) B.add(T.box, TRIM, M(X(mid + q * half / 2), eY + rise / 2 - 0.09, e * (rw - 0.03), slope + 0.06, 0.18, 0.05, 0, 0, Math.atan2(rise, -s * q * half)));
  }
  P(GUT, mid, eY + rise - 0.05, 0, 0.26, 0.1, 2 * rw + 0.04);
  { const gg = Math.min(hw / 2 - 1.4, 2.9), gh = Math.min(1.7, rise - 0.5), fd = sb - 0.5, back = sb - 0.6 + (gh + 0.1) / 0.58, t = look.roof.userData.tile; // a gable standing forward over the balcony: its own little roof running back into the main one
    B.triUV(gm, [V3(X(sb - 0.04), TOP, -gg), V3(X(sb - 0.04), TOP, gg), V3(X(sb - 0.04), TOP + gh, 0)], [0, 0, 2 * gg / gt, 0, gg / gt, gh / gt]);
    for (const e of [-1, 1]) { B.triUV(look.roof, [V3(X(fd), TOP + 0.03, e * (gg + 0.4)), V3(X(fd), TOP + gh + 0.2, 0), V3(X(back), TOP + gh + 0.2, 0)], [0, 0, 0, Math.hypot(gg, gh) / t, (back - fd) / t, Math.hypot(gg, gh) / t]);
      B.add(T.box, TRIM, M(X(fd + 0.02), TOP + gh / 2 + 0.06, e * (gg + 0.4) / 2, 0.06, 0.16, Math.hypot(gg + 0.4, gh + 0.17) + 0.05, e * Math.atan2(gh + 0.17, gg + 0.4), 0, 0)); }
    B.add(T.cyl, TRIM, M(X(sb - 0.07), TOP + gh * 0.42, 0, 0.62, 0.06, 0.62, 0, 0, Math.PI / 2)); B.add(T.cyl, '#2c3944', M(X(sb - 0.09), TOP + gh * 0.42, 0, 0.44, 0.06, 0.44, 0, 0, Math.PI / 2)); // a round vent in the gable
  }                                                       // ridge tiles
  { const cl = hw / 4, cd = mid + half * 0.38; P(look.fence === TEX.stone ? TEX.brickRed : look.fence, cd, TOP, cl, 0.62, rise + 0.75, 0.95); P(STONE, cd, TOP + rise + 0.75, cl, 0.76, 0.09, 1.09);
    for (const q of [-1, 1]) B.add(T.cyl, '#a4512f', M(X(cd), TOP + rise + 0.99, cl + q * 0.22, 0.2, 0.3, 0.2)); }
  // The inside, from the plan. H draws a block given in the plan's own measure.
  const H = (mt, x0, x1, y0, y1, z0, z1) => P(mt, sb + 0.22 + (z0 + z1) / 2, y0, (x0 + x1) / 2, z1 - z0, y1 - y0, x1 - x0), pw = plan.w, pD = plan.D, WOOD = DARKWOOD;
  H(TEX.floorWood, -pw - 0.2, pw + 0.2, 0, FLOOR, -0.2, pD + 0.2);                                                  // ground floor: oak laminate
  for (let L = 1; L < plan.levels; L++) { // the floor of each upper storey, with an opening for the stairs to come up through
    const fy = FLOOR + L * STOREY, st = plan.stairs, slab = (x0, x1, z0, z1) => { H(TEX.ceiling, x0, x1, fy - 0.3, fy - 0.15, z0, z1); H(TEX.floorWood, x0, x1, fy - 0.15, fy, z0, z1); };
    slab(-pw - 0.2, st.x0, -0.2, pD + 0.2); slab(st.x0, pw + 0.2, -0.2, st.z0); slab(st.x0, pw + 0.2, st.z1, pD + 0.2);
    for (let z = st.z0; z <= st.z1 + 0.01; z += 0.6) H(WOOD, st.x0 - 0.03, st.x0 + 0.03, fy, fy + 0.95, z - 0.03, z + 0.03);                // a rail round the opening
    H(WOOD, st.x0 - 0.04, st.x0 + 0.04, fy + 0.95, fy + 1.01, st.z0, st.z1); H(WOOD, st.x0, pw, fy + 0.95, fy + 1.01, st.z0 - 0.04, st.z0 + 0.04);
    for (let x = st.x0; x <= pw; x += 0.46) H(WOOD, x - 0.03, x + 0.03, fy, fy + 0.95, st.z0 - 0.03, st.z0 + 0.03);
  }
  if (plan.stairs) { const st = plan.stairs, run = (st.z1 - st.z0) / st.steps, rise = STOREY / st.steps; // each step stands on the ground, so the staircase is a solid block
    for (let i = 0; i < st.steps; i++) { H('#b8a58a', st.x0, st.x1, FLOOR, FLOOR + (i + 1) * rise - 0.04, st.z0 + i * run, st.z0 + (i + 1) * run); H(TEX.floorWood, st.x0, st.x1, FLOOR + (i + 1) * rise - 0.04, FLOOR + (i + 1) * rise, st.z0 + i * run - 0.02, st.z0 + (i + 1) * run); }
    H(TEX.wallPaint, st.x0 - 0.06, st.x0, FLOOR, FLOOR + 0.9, st.z0, st.z0 + 0.1);                                             // newel at the foot
  }
  for (const [along, at, a, b, L, ...gaps] of plan.walls) { // partitions, with a doorway (and a wooden frame) wherever the plan asks for one
    const fy = FLOOR + L * STOREY, top = fy + CEIL + (L === plan.levels - 1 ? 0.14 : 0), cuts = [a, ...gaps.flat(), b];
    const part = (p0, p1, y0, y1, mt = IN, th = WT) => (along === 'x' ? H(mt, p0, p1, y0, y1, at - th / 2, at + th / 2) : H(mt, at - th / 2, at + th / 2, y0, y1, p0, p1));
    for (let i = 0; i < cuts.length; i += 2) if (cuts[i + 1] - cuts[i] > 0.02) part(cuts[i], cuts[i + 1], fy, top);
    for (const [g0, g1] of gaps) { part(g0, g1, fy + 2.25, top); part(g0 - 0.05, g0 + 0.006, fy, fy + 2.25, WOOD, WT + 0.05); part(g1 - 0.006, g1 + 0.05, fy, fy + 2.25, WOOD, WT + 0.05); part(g0 - 0.05, g1 + 0.05, fy + 2.244, fy + 2.31, WOOD, WT + 0.05); }
  }
  for (const [xa, xb, L] of plan.kitchen || []) { // fitted kitchen along the back wall: cupboards, worktop, sink, hob, tiles and wall cupboards
    const fy = FLOOR + L * STOREY, z = pD, CAB = CAB_MAT, mid = (xa + xb) / 2;
    H(CAB, xa, xb, fy + 0.1, fy + 0.86, z - 0.58, z); H('#26282b', xa + 0.02, xb - 0.02, fy, fy + 0.1, z - 0.5, z); H('#3b3e43', xa - 0.01, xb + 0.01, fy + 0.86, fy + 0.9, z - 0.62, z);
    for (let x = xa + 0.6; x < xb - 0.2; x += 0.6) H('#b5b0a4', x - 0.006, x + 0.006, fy + 0.12, fy + 0.84, z - 0.586, z - 0.578);
    for (let x = xa + 0.3; x < xb; x += 0.6) H('#8e949a', x - 0.07, x + 0.07, fy + 0.72, fy + 0.74, z - 0.605, z - 0.585);
    H('#aeb5ba', mid - 0.75, mid - 0.1, fy + 0.9, fy + 0.906, z - 0.5, z - 0.12); H('#7d858b', mid - 0.68, mid - 0.17, fy + 0.84, fy + 0.9, z - 0.45, z - 0.17); H('#c9d0d4', mid - 0.44, mid - 0.4, fy + 0.9, fy + 1.12, z - 0.12, z - 0.08); H('#c9d0d4', mid - 0.44, mid - 0.4, fy + 1.1, fy + 1.13, z - 0.3, z - 0.08);
    H('#121315', mid + 0.15, mid + 0.75, fy + 0.9, fy + 0.912, z - 0.52, z - 0.08);
    H('#dde5e8', xa, xb, fy + 0.9, fy + 1.5, z - 0.015, z); H(CAB, xa, xb, fy + 1.5, fy + 2.2, z - 0.34, z);
    for (let x = xa + 0.6; x < xb - 0.2; x += 0.6) H('#b5b0a4', x - 0.006, x + 0.006, fy + 1.52, fy + 2.18, z - 0.346, z - 0.338);
  }
  const fitted = [], showers = []; // real fittings, stood in place once the house's own moving parts exist: [piece, x, z, facing, level, height above the floor]
  for (const [x0, x1, z0, z1, L] of plan.bath || []) { // bathroom: tiled floor, a real toilet, a real basin under a mirror, and a real shower cabin
    const fy = FLOOR + L * STOREY;
    H(TEX.bathTile, x0 + WT / 2, x1, fy, fy + 0.014, z0 + WT / 2, z1);
    H(LOBBY, x1 - 0.03, x1 - 0.01, fy + 1.15, fy + 1.9, z0 + 0.42, z0 + 1.08); H(SKIRT_MAT, x1 - 0.035, x1 - 0.005, fy + 1.12, fy + 1.93, z0 + 0.39, z0 + 1.11);
    fitted.push(['toilet', x1 - 0.55, z1 - 0.42, 'S', L, 0], ['sink', x1 - 0.3, z0 + 0.75, 'W', L, 0], ['shower', x0 + 0.66, z1 - 0.62, 'S', L, 0]); showers.push([x0 + 0.66, z1 - 0.62, L]);
  }
  // ---- the finish of the rooms: skirting boards, carpet in the bedrooms, a light in every ceiling, curtains, wall lamps and a fireplace ----
  const SKIRT = SKIRT_MAT, ROD = '#33271e', CURT = DRAPES[def.id % DRAPES.length], zs0 = s0 - sb - 0.22, zs1 = s1 - sb - 0.22, stp = plan.stairs;
  for (const [name, x0, x1, z0, z1, L] of plan.rooms) {
    const fy = FLOOR + L * STOREY, lid = fy + (L === plan.levels - 1 ? STOREY - 0.16 : CEIL);
    if (name.startsWith('bedroom')) H(TEX.carpet, x0, x1, fy, fy + 0.012, z0, z1);
    if (name === 'living' && L === 0 && !fitted.some((q) => q[0] === 'chandelier')) fitted.push(['chandelier', (x0 + x1) / 2, (z0 + z1) / 2, 'S', L, lid - fy - 1.0]);
    else if ((x1 - x0) * (z1 - z0) > 2.4) { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; B.add(T.cyl, '#cfc9bb', M(X(sb + 0.22 + cz), lid - 0.02, cx, 0.46, 0.04, 0.46)); B.add(T.cyl, GLOW, M(X(sb + 0.22 + cz), lid - 0.075, cx, 0.38, 0.07, 0.38)); } // a ceiling light
    for (const [axis, c, a, b, inward] of [['x', z0, x0, x1, 1], ['x', z1, x0, x1, -1], ['z', x0, z0, z1, 1], ['z', x1, z0, z1, -1]]) { // a skirting board along each wall, left out across doorways and open sides
      const cuts = [];
      if (L === 0 && axis === 'x' && Math.abs(c) < 0.01) cuts.push([-0.86, 0.86]);
      for (const [wx0, wx1, wz0, wz1, wl] of plan.ways) if (wl === L && (axis === 'x' ? wz0 < c && c < wz1 : wx0 < c && c < wx1)) cuts.push(axis === 'x' ? [wx0 - 0.2, wx1 + 0.2] : [wz0 - 0.2, wz1 + 0.2]);
      if (stp && axis === 'x' && Math.abs(c - (L ? stp.z1 : stp.z0)) < 0.01) cuts.push([stp.x0 - 0.05, stp.x1 + 0.3]);
      cuts.sort((p, q) => p[0] - q[0]); let at = a;
      const outer = axis === 'x' ? c < 0.01 || c > pD - 0.01 : Math.abs(c) > pw - 0.01, n0 = c + inward * (outer ? 0 : WT / 2), n1 = n0 + inward * 0.022;
      const run = (p0, p1) => { if (p1 - p0 < 0.25) return; if (axis === 'x') H(SKIRT, p0, p1, fy, fy + 0.11, Math.min(n0, n1), Math.max(n0, n1)); else H(SKIRT, Math.min(n0, n1), Math.max(n0, n1), fy, fy + 0.11, p0, p1); };
      for (const [c0, c1] of cuts) { run(at, Math.min(c0, b)); at = Math.max(at, c1); } run(at, b);
    }
  }
  const drape = (a, b, y0, y1, at, along) => { // a curtain that hangs in real folds: 'x' across the front wall, 'z' along the side wall
    const n = Math.max(8, Math.round(Math.abs(b - a) / 0.045)), W = (x, y, z) => V3(X(sb + 0.22 + z), y, x).applyMatrix4(B.frame), at2 = (i) => { const t = a + (b - a) * i / n, off = at + 0.045 + 0.038 * Math.sin(i * Math.PI * 0.5); return along === 'x' ? [t, off] : [off, t]; };
    for (let i = 0; i < n; i++) { const [x0, z0] = at2(i), [x1, z1] = at2(i + 1); B.quad(CURT, W(x0, y0, z0), W(x1, y0, z1), W(x1, y1, z1), W(x0, y1, z0)); }
  };
  for (let L = 0; L < plan.levels; L++) { // curtains drawn back at every window, each pair on a dark rod
    const fy = FLOOR + L * STOREY;
    for (const e of [-1, 1]) { const xc = e * wc;
      fitted.push(['curtain', xc, 0.2, 'N', L, 0.08]);
      H(SKIRT, xc - ww / 2 - 0.1, xc + ww / 2 + 0.1, fy + 0.89, fy + 0.95, 0, 0.16); H(SKIRT, xc - ww / 2 - 0.08, xc + ww / 2 + 0.08, fy + 2.35, fy + 2.43, 0, 0.025); for (const q of [-1, 1]) H(SKIRT, xc + q * (ww / 2 + 0.04) - 0.04, xc + q * (ww / 2 + 0.04) + 0.04, fy + 0.95, fy + 2.35, 0, 0.025); }
    fitted.push(['curtain', -pw + 0.2, (zs0 + zs1) / 2, 'E', L, 0.08, 1.36]);
    H(SKIRT, -pw, -pw + 0.16, fy + 0.89, fy + 0.95, zs0 - 0.1, zs1 + 0.1); H(SKIRT, -pw, -pw + 0.025, fy + 2.35, fy + 2.43, zs0 - 0.08, zs1 + 0.08); for (const z of [zs0 - 0.04, zs1 + 0.04]) H(SKIRT, -pw, -pw + 0.025, fy + 0.95, fy + 2.35, z - 0.04, z + 0.04);
  }
  for (let L = 0; L < plan.levels; L++) for (const z of [1.3, pD - 1.6]) { const fy = FLOOR + L * STOREY; // sockets low on the wall, each a white plate with two outlets
    H(SKIRT_MAT, pw - 0.012, pw, fy + 0.27, fy + 0.36, z - 0.075, z + 0.075); for (const q of [-0.035, 0.035]) H('#2a2c2f', pw - 0.014, pw - 0.011, fy + 0.3, fy + 0.33, z + q - 0.012, z + q + 0.012); }
  H(SKIRT_MAT, 1.05, 1.13, FLOOR + 1.2, FLOOR + 1.32, 0, 0.012); H('#d9d6cf', 1.075, 1.105, FLOOR + 1.235, FLOOR + 1.285, 0.012, 0.02); // the light switch by the front door
  for (const e of [-1, 1]) fitted.push(['walllight', e * 1.25, 0.13, 'N', 0, 1.6]); // a real lamp on the wall either side of the front door
  for (let L = 0; L < plan.levels; L++) fitted.push(['walllight', pw - 0.13, pD * 0.55, 'W', L, 1.6]);
  if (plan.fire) { const [fz, fl] = plan.fire, fy = FLOOR + fl * STOREY, x = -pw; // a fireplace: a dark wood surround and mantel, a stone hearth, and logs glowing in the grate
    for (const q of [-1, 1]) H(DARKWOOD, x, x + 0.1, fy, fy + 1.0, fz + q * 0.6 - 0.1, fz + q * 0.6 + 0.1);
    H(DARKWOOD, x, x + 0.1, fy + 0.8, fy + 1.0, fz - 0.5, fz + 0.5); H(DARKWOOD, x, x + 0.24, fy + 1.0, fy + 1.06, fz - 0.82, fz + 0.82);
    H('#141211', x, x + 0.03, fy, fy + 0.8, fz - 0.5, fz + 0.5); H(TEX.brickGrey, x + 0.03, x + 0.05, fy, fy + 0.8, fz - 0.5, fz - 0.38); H(TEX.brickGrey, x + 0.03, x + 0.05, fy, fy + 0.8, fz + 0.38, fz + 0.5);
    H(TEX.stone, x, x + 0.5, fy, fy + 0.035, fz - 0.82, fz + 0.82);
    H('#2a1a10', x + 0.05, x + 0.17, fy + 0.035, fy + 0.12, fz - 0.3, fz + 0.3); H(EMBER, x + 0.06, x + 0.15, fy + 0.12, fy + 0.2, fz - 0.24, fz + 0.2); H('#2a1a10', x + 0.07, x + 0.16, fy + 0.2, fy + 0.27, fz - 0.16, fz + 0.26);
  }
  // The parts that move or change: gate, front door and the sign. They sit in the lot's own space.
  const rg = new THREE.Group(); rg.applyMatrix4(B.frame); g.add(rg); g.updateMatrix();
  const world = new THREE.Matrix4().multiplyMatrices(g.matrix, B.frame), mine = game.home === def.id;
  const gate = gateLeaf(); gate.position.set(X(0.15), 0.3, -GATE_W / 2);
  const door = new THREE.Group(); door.position.set(X(sb + 0.11), FLOOR, -0.7); // hinged at one edge of the doorway
  FMODEL.door.ready.then((q) => { const o = q.obj.clone(), hold = new THREE.Group(), bb = new THREE.Box3().setFromObject(o); o.scale.x *= 1.46 / Math.max(0.1, bb.max.x - bb.min.x); o.scale.y *= DOOR_H / 2.26; hold.rotation.y = -Math.PI / 2; hold.position.z = 0.7; hold.add(o); door.add(hold); });
  const sign = new THREE.Mesh(PLANE, rentSign(def, mine)); sign.scale.set(1.6, 1.2, 1); sign.position.set(X(-0.5), 2.15, GATE_W / 2 + 1.6); sign.rotation.y = -s * Math.PI / 2;
  for (const q of [-0.68, 0.68]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.8, 0.07), mat('#e8e9ec')); post.position.set(X(-0.4), 1.4, GATE_W / 2 + 1.6 + q); /* behind the board, not across its face */ post.castShadow = HQ; rg.add(post); if (mine) post.visible = false; sign.userData.posts = (sign.userData.posts || []).concat(post); } // the board stands on two posts at the pavement edge
  for (const m of [gate, door, sign]) { m.castShadow = m.receiveShadow = HQ; rg.add(m); } sign.visible = !mine; // once it is yours the board comes down: the green pin marks it
  const doors = [], box3 = new THREE.Box3();
  for (const [along, at, hinge, side, L, gw = 0.9] of plan.doors || []) { // the doors indoors: panelled wood, each hung on its hinge; they stand open until you close them
    let dir = 1; for (const [wa, wat, , , wl, ...gaps] of plan.walls) if (wa === along && wat === at && wl === L) for (const [g0, g1] of gaps) { if (Math.abs(hinge - g1) < 0.08) dir = -1; }
    const pivot = new THREE.Group(), leaf = new THREE.Group(); // a real panelled door, brought to the width of its doorway
    if (along === 'z') { leaf.position.set(s * dir * gw / 2, 0, 0); pivot.position.set(X(sb + 0.22 + hinge), FLOOR + L * STOREY, at); } else { leaf.position.set(0, 0, dir * gw / 2); leaf.rotation.y = Math.PI / 2; pivot.position.set(X(sb + 0.22 + at), FLOOR + L * STOREY, hinge); }
    FMODEL.door.ready.then((q) => { const o = q.obj.clone(); box3.setFromObject(o); o.scale.x *= (gw + 0.06) / Math.max(0.1, box3.max.x - box3.min.x); leaf.add(o); });
    const swing = (along === 'z' ? -side * s * dir : s * side * dir) * Math.PI / 2;
    pivot.add(leaf); pivot.rotation.y = swing; rg.add(pivot);
    doors.push({ pivot, swing, along, at, hinge, side, dir, L, gw, open: true, t: 1 });
  }
  for (const [piece, x, z, facing, L, up, wide = 1] of fitted) { const hold = new THREE.Group(); hold.scale.x = wide; hold.position.set(X(sb + 0.22 + z), FLOOR + L * STOREY + up, x); hold.rotation.y = { N: s * Math.PI / 2, S: -s * Math.PI / 2, E: 0, W: Math.PI }[facing]; rg.add(hold); FMODEL[piece].ready.then((q) => hold.add(q.obj.clone())); }
  // where you can stand indoors: every room a step in from its walls, the doorways that join them, and the stairs
  const mg = 0.32, walk = [...plan.rooms.map(([name, x0, x1, z0, z1, L]) => ({ name, x0: x0 + mg, x1: x1 - mg, z0: z0 + mg, z1: z1 - mg, L })), ...plan.ways.map(([x0, x1, z0, z1, L]) => ({ name: 'way', x0, x1, z0, z1, L }))];
  if (plan.stairs) walk.unshift({ name: 'stairs', stairs: true, x0: plan.stairs.x0 + 0.3, x1: plan.stairs.x1 - 0.3, z0: plan.stairs.z0 - mg, z1: plan.stairs.z1 + 0.3, s0: plan.stairs.z0, s1: plan.stairs.z1, steps: plan.stairs.steps });
  const rentPin = new THREE.Sprite(RENT_PIN_MAT); rentPin.scale.set(1.5 / HS, 2.1 / HS, 1); rentPin.position.set(X(sb + d / 2), TOP + rise + 2.2, 0); rentPin.renderOrder = 20; rentPin.visible = !mine; rg.add(rentPin); // a pin overhead: this house is to let
  const st = RENT[def.id] = { rentPin,  def, s, sb, d, hw, w, g, rg, world, plan, walk, inv: world.clone().invert(), gate, door, sign, gateOpen: mine ? 1 : 0, doorOpen: mine ? 1 : 0, npc: null, furn: new Map(), doors, showers, state: mine ? 'home' : 'wait' };
  _v.set(X(sb), 0, 0).applyMatrix4(world); st.cx = _v.x; st.cz = _v.z;
  { const solid = []; for (const [xa, xb, L] of plan.kitchen || []) for (let x = xa + 0.3; x < xb; x += 0.55) solid.push([x, plan.D - 0.3, 0.3, L]);
    if (plan.fire) solid.push([-plan.w + 0.15, plan.fire[0], 0.25, plan.fire[1]]);
    for (const [x0, x1, z0, z1, L] of plan.bath || []) solid.push([x1 - 0.55, z1 - 0.42, 0.24, L], [x1 - 0.27, z0 + 0.75, 0.24, L], [x0 + 0.55, z1 - 0.5, 0.42, L]);
    st.furn.set('fitted', { grp: null, obst: solid }); }
  if (mine) for (const id of game.items) addFurniture(st, id);
  B.frame.copy(frame0);
  return { H: (TOP + rise) * HS, d: (sb + d) * HS };
}
const lotOf = (st, x, z, out) => { _v.set(x, 0, z).applyMatrix4(st.inv); out.dep = st.s * _v.x - F; out.lat = _v.z; out.lx = _v.x; return out; };
const _lot = { dep: 0, lat: 0, lx: 0 };
// Where you may stand in and around the houses: through an open gate, across the yard, through an open door, and then
// from room to room through the doorways, and up and down the stairs. Which floor you are on decides which rooms count.
function homeSpot(x, z) {
  for (const st of RENT) {
    if (!st || !st.g.parent || (x - st.cx) ** 2 + (z - st.cz) ** 2 > 30 * 30) continue;
    const { dep, lat } = lotOf(st, x, z, _lot), al = Math.abs(lat), sb = st.sb, hz = dep - sb - 0.22;
    if (st.gateOpen > 0.85 && hero.level === 0) {
      if (dep > -0.6 && dep <= 0.65 && al < 0.5) return { y: 0.29 * HS, yard: st };
      if (dep > 0.65 && dep < sb - 0.45 && al < st.w / 2 - 0.6) return { y: 0.29 * HS, yard: st };
    }
    if (st.doorOpen > 0.85) {
      if (hero.level === 0 && hz >= -0.67 && hz <= 0.5 && al < 0.4) return { y: FLOOR * HS, door: st, level: 0 };
      for (const r of st.walk) {
        if (lat < r.x0 || lat > r.x1 || hz < r.z0 || hz > r.z1) continue;
        if (r.stairs) { const f = clamp((hz - r.s0) / (r.s1 - r.s0), 0, 1), y = FLOOR + (hz < r.s0 ? 0 : Math.min(STOREY, (f * r.steps + 1) * STOREY / r.steps)); return { y: y * HS, room: st, rect: r, ceil: (y + 2.5) * HS, level: f >= 0.5 ? 1 : 0 }; } // a steady climb along the front edges of the steps: feet on the stairs, never in them
        if (r.L === hero.level) return { y: (FLOOR + r.L * STOREY) * HS, room: st, rect: r, ceil: (FLOOR + r.L * STOREY + CEIL - 0.3) * HS, level: r.L };
      }
    }
  }
  return null;
}
// Water for the shower: a fall of fine drops that only shows while you are washing
const showerFx = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(150 * 6), 3)), new THREE.LineBasicMaterial({ color: '#e3f4ff', transparent: true, opacity: 0.6, depthWrite: false })); // 150 short streaks of falling water
showerFx.visible = false; showerFx.frustumCulled = false; scene.add(showerFx);
const washing = { on: false, t: 0, back: [0, 0], at: new THREE.Vector3() };
function takeShower(st, [x, z, L]) { // step into the cabin, the water runs for a few seconds, then step out again
  if (ui.busy) return; ui.busy = true; washing.on = true; washing.t = 5.5; washing.back = [hero.x, hero.z];
  washing.at.set(st.s * (F + st.sb + 0.22 + z), FLOOR + L * STOREY, x).applyMatrix4(st.world); hero.x = washing.at.x; hero.z = washing.at.z; showerFx.visible = true; washing.goal = ui.goal; setGoal('Having a shower…');
}
function updateShower(dt) {
  if (!washing.on) return; const P = showerFx.geometry.attributes.position, a = P.array, t = performance.now() / 1000;
  for (let i = 0; i < 150; i++) { const ang = i * 2.399, fall = ((t * 3.1 + i * 0.173) % 1), rad = 0.04 + (i % 10) * 0.024 + fall * 0.05, x = washing.at.x + Math.cos(ang) * rad, z = washing.at.z + Math.sin(ang) * rad, y = washing.at.y + (2.02 - fall * fall * 1.9) * HS, len = (0.05 + fall * 0.16) * HS; // faster and longer as they fall, spreading a little
    a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = z; a[i * 6 + 3] = x; a[i * 6 + 4] = y - len; a[i * 6 + 5] = z; }
  P.needsUpdate = true; hero.x = washing.at.x; hero.z = washing.at.z;
  if ((washing.t -= dt) <= 0) { washing.on = false; showerFx.visible = false; hero.x = washing.back[0]; hero.z = washing.back[1]; ui.busy = false; setGoal(washing.goal || ''); chime([660, 990]); }
}
// Things to do at home. Each is a spot in the house: walk up to it and the button offers what you can do there.
const doing = { t: 0, done: null, noteT: 0 };
function note(text, secs = 3.5) { setGoal(text); doing.noteT = secs; }
function spend(text, secs, done) { if (ui.busy) return; ui.busy = true; doing.t = secs; doing.done = done; setGoal(text); doing.noteT = 0; } // something that takes a little while: you stay put until it is finished
function updateDoing(dt) {
  if (doing.t > 0 && (doing.t -= dt) <= 0) { ui.busy = false; const f = doing.done; doing.done = null; if (f) f(); }
  if (doing.noteT > 0 && (doing.noteT -= dt) <= 0 && !ui.busy) setGoal('');
}
function homeSpots(st) { // [x, z, level, reach, label, what happens] in the house's own measure
  const pl = st.plan, has = (id) => st.furn.has(id), out = [], put = pl.put, lifeUp = (n) => { game.life = Math.min(100, (game.life || 0) + n); save(); };
  if (has('bed')) out.push([put.bed[0], put.bed[1], put.bed[3], 2.1, 'Sleep', () => { $('fade').classList.add('on'); spend('Sleeping…', 4, () => { $('fade').classList.remove('on'); chime([523, 659, 784]); note('You slept well and feel rested.'); }); }]);
  if (has('tv')) out.push([put.sofa[0], put.sofa[1], put.sofa[3], 1.9, st.tvOn ? 'Turn the TV off' : 'Watch TV', () => { st.tvOn = !st.tvOn; if (st.tvScreen) st.tvScreen.visible = st.tvOn; chime(st.tvOn ? [440, 660] : [330]); note(st.tvOn ? 'The TV is on.' : 'The TV is off.'); }]);
  if (has('fridge')) out.push([put.fridge[0], put.fridge[1] - 0.5, put.fridge[3], 1.15, 'Have a snack', () => spend('Having a snack…', 2.5, () => { lifeUp(20); chime([660, 880]); note('That was good. Life went up.'); })]);
  for (const [xa, xb, L] of pl.kitchen || []) out.push([(xa + xb) / 2, pl.D - 1.0, L, 1.5, 'Cook a meal', () => spend('Cooking…', 5, () => { lifeUp(100); chime([523, 659, 784, 1046]); note('You cooked and ate. Life is full.'); })]);
  for (const [x0, x1, z0, z1, L] of pl.bath || []) {
    out.push([x1 - 0.75, z1 - 0.75, L, 0.8, 'Use the toilet', () => spend('Using the toilet…', 3, () => { chime([180, 150, 130, 110], 'sawtooth', 0.16, 0.5, 0.05); note('Flushed.'); })]);
    out.push([x1 - 0.75, z0 + 0.75, L, 0.8, 'Wash your hands', () => spend('Washing your hands…', 2.2, () => { chime([880, 990]); note('Clean hands.'); })]);
  }
  out.push([1.1, 0.6, 0, 0.8, st.dark ? 'Switch the lights on' : 'Switch the lights off', () => { st.dark = !st.dark; chime([st.dark ? 300 : 600], 'square', 0.05, 0.06, 0.05); }]);
  return out;
}
function homePush() { // the landlord and your furniture are solid
  if (washing.on) return;
  for (const st of RENT) {
    if (!st || !st.g.parent || (hero.x - st.cx) ** 2 + (hero.z - st.cz) ** 2 > 30 * 30) continue;
    const L = lotOf(st, hero.x, hero.z, _lot); let dep = L.dep, lat = L.lat, hit = false;
    const test = (od, ol, R) => { const a = dep - od, b = lat - ol, q = Math.hypot(a, b); if (q < R && q > 1e-4) { dep = od + a / q * R; lat = ol + b / q * R; hit = true; } };
    if (st.npc && hero.level === 0) test(st.npc.dep, st.npc.lat, 0.62);
    for (const f of st.furn.values()) for (const [ox, oz, R, lv] of f.obst) if (lv === hero.level) test(st.sb + 0.22 + oz, ox, R + 0.3);
    for (const dr of st.doors) if (dr.L === hero.level) { // a shut door bars the doorway; an open one is solid along its outer half
      const pt = (al, ac, R) => (dr.along === 'z' ? test(st.sb + 0.22 + al, ac, R) : test(st.sb + 0.22 + ac, al, R));
      if (dr.t < 0.5) for (const q of [0.2, 0.45, 0.7]) pt(dr.hinge + dr.dir * q, dr.at, 0.42); else for (const q of [0.6, 0.85]) pt(dr.hinge, dr.at + dr.side * q, 0.34);
    }
    if (hit) { _v.set(st.s * (F + dep), 0, lat).applyMatrix4(st.world); const wx = _v.x, wz = _v.z; if (homeSpot(wx, wz)) { hero.x = wx; hero.z = wz; } }
  }
}

/* ---- furniture: built here from simple shapes, one piece at a time as it is bought ---- */
const TV_PICTURE = new THREE.MeshBasicMaterial({ map: canvasTex(256, 144, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#2b4a8a'); sky.addColorStop(0.55, '#f08a4b'); sky.addColorStop(1, '#3a2a4a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(w * 0.62, h * 0.56, 20, 0, 7); g.fill();
  g.fillStyle = '#1c1830'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.7); g.lineTo(60, h * 0.55); g.lineTo(120, h * 0.72); g.lineTo(190, h * 0.6); g.lineTo(w, h * 0.74); g.lineTo(w, h); g.fill();
}) });
const CATALOG = [
  { id: 'sofa', name: 'Sofa', price: 120000 }, { id: 'tv', name: 'Television', price: 180000 }, { id: 'console', name: 'Game console', price: 95000, needs: 'tv' },
  { id: 'bed', name: 'Bed', price: 150000 }, { id: 'dining', name: 'Dining table and chairs', price: 90000 }, { id: 'fridge', name: 'Fridge', price: 140000 },
  { id: 'rug', name: 'Rug', price: 30000 }, { id: 'table', name: 'Coffee table', price: 25000 }, { id: 'lamp', name: 'Floor lamp', price: 18000 },
  { id: 'art', name: 'Wall art', price: 22000 }, { id: 'plant', name: 'House plant', price: 9000 },
];
// Real furniture: modelled pieces from Sketchfab (makers credited in models/CREDITS.txt), cut down in detail for the game.
// w is how long the piece is along its longest side on the floor (or h how tall it is); yaw turns it so its front faces +z.
const FMODEL = {
  sofa: { data: fSofa, w: 2.3, yaw: 0 }, bed: { data: fBed, w: 3.0, yaw: 0 }, dining: { data: fDining, w: 1.8, yaw: 0 }, fridge: { data: fFridge, h: 1.85, yaw: 0, lift: 0.5 },
  coffee: { data: fCoffee, w: 1.2, yaw: 0 }, tv: { data: fTv, w: 1.35, yaw: Math.PI }, stand: { data: fStand, w: 1.7, yaw: 0 }, lamp: { data: fLamp, h: 1.7, yaw: 0 },
  art: { data: fArt, w: 1.7, yaw: Math.PI }, plant: { data: fPlant, h: 1.35, yaw: 0 },
  toilet: { data: fToilet, h: 0.8, yaw: 0, fixed: true }, sink: { data: fSink, h: 0.98, yaw: 0, fixed: true }, shower: { data: fShower, h: 2.1, yaw: 0, fixed: true }, chandelier: { data: fChandelier, h: 1.0, yaw: 0, fixed: true }, // fitted in every house, not bought
  door: { data: fDoor, h: 2.26, yaw: 0, fixed: true }, curtain: { data: fCurtain, w: 2.5, yaw: 0, fixed: true, tilt: true }, walllight: { data: fWallLight, w: 0.46, yaw: 0, fixed: true },
};
for (const q of Object.values(FMODEL)) q.ready = new Promise((done) => new GLTFLoader().parse(q.data.buffer.slice(q.data.byteOffset, q.data.byteOffset + q.data.byteLength), '', (gltf) => {
  const root = gltf.scene, box = new THREE.Box3(), size = new THREE.Vector3(), ctr = new THREE.Vector3(); if (q.tilt) root.rotation.x = Math.PI / 2; // (modelled lying down)
  root.traverse((o) => { if (!o.isMesh) return; o.geometry.computeVertexNormals(); const sm = o.material;
    o.material = new THREE.MeshLambertMaterial({ map: sm.map, color: q.lift ? sm.color.clone().lerp(new THREE.Color('#dfe3e6'), q.lift) : sm.color, side: THREE.DoubleSide, alphaTest: sm.alphaTest > 0 ? sm.alphaTest : 0, transparent: !!sm.transparent && sm.opacity < 0.97, opacity: sm.transparent && sm.opacity < 0.97 ? Math.max(0.25, sm.opacity) : 1, depthWrite: !(sm.transparent && sm.opacity < 0.97) }); o.castShadow = o.receiveShadow = HQ; }); // (bare steel has nothing to mirror in here and would look black, so it is lifted towards its lit colour)
  root.updateMatrixWorld(true); box.setFromObject(root); box.getSize(size); box.getCenter(ctr); root.position.set(-ctr.x, -box.min.y, -ctr.z);     // stood on the floor, centred
  const lay = new THREE.Group(); lay.add(root); lay.rotation.y = (q.fixed || size.x >= size.z ? 0 : Math.PI / 2) + q.yaw;                                    // its long side laid across
  const k = q.h ? q.h / size.y : q.w / Math.max(size.x, size.z); q.obj = new THREE.Group(); q.obj.add(lay); q.obj.scale.setScalar(k); q.high = size.y * k;
  done(q);
}, (e) => console.error('furniture failed to load', e)));
// Putting a bought thing into the house. The plan says where each thing goes and which way it faces; a real model
// stands there, turned to face that way. What it returns is the round patches of floor the thing takes up, so you walk round it.
const FOOTPRINT = { sofa: [2.3, 0.95], stand: [1.7, 0.5], coffee: [1.2, 0.6], bed: [3.0, 2.4], dining: [1.9, 1.9], fridge: [0.9, 0.75], lamp: [0.4, 0.4], plant: [0.6, 0.6] }; // length along its long side, and depth
function addFurniture(st, id) {
  const spot = st.plan.put[id === 'console' ? 'tv' : id]; if (st.furn.has(id) || !spot) return;
  const [x, z, facing, L] = spot, grp = new THREE.Group(), X = (dep) => st.s * (F + dep), fy = FLOOR + L * STOREY, obst = [];
  const turn = { N: st.s * Math.PI / 2, S: -st.s * Math.PI / 2, E: 0, W: Math.PI }[facing], side = facing === 'E' || facing === 'W'; // E and W pieces run front-to-back; N and S ones run across
  const stand = (piece, y0 = 0) => { const hold = new THREE.Group(); hold.position.set(X(st.sb + 0.22 + z), fy + y0, x); hold.rotation.y = turn; grp.add(hold); FMODEL[piece].ready.then((q) => hold.add(q.obj.clone())); return hold; };
  const solid = (piece) => { const [len, dep] = FOOTPRINT[piece], n = Math.max(1, Math.round(len / dep)), r = Math.max(dep, len / n) / 2; for (let i = 0; i < n; i++) { const o = (i + 0.5) / n * len - len / 2; obst.push(side ? [x, z + o, r, L] : [x + o, z, r, L]); } };
  const blocks = (draw) => { // plain shapes, drawn facing forwards and then turned with the piece: R(colour, across, height, forwards, width, tall, deep)
    const B = new Batch(), hold = new THREE.Group(); draw((col, ax, y0, fz, wl, h, dd) => B.box(col, wl, h, dd, ax, y0 + h / 2, fz)); B.build(hold); hold.position.set(X(st.sb + 0.22 + z), fy, x); hold.rotation.y = turn; grp.add(hold); };
  if (id === 'sofa') { stand('sofa'); solid('sofa'); }
  else if (id === 'tv') { stand('stand'); const set = stand('tv'); FMODEL.stand.ready.then((q) => { set.position.y += q.high; }); solid('stand'); }
  else if (id === 'console') blocks((R) => { const y = FMODEL.stand.high || 0.6; R('#ecedf0', 0.55, y, 0.02, 0.34, 0.07, 0.26); R('#2b7fd6', 0.55, y + 0.07, 0.14, 0.34, 0.012, 0.012); R('#23262b', -0.62, y, 0.08, 0.17, 0.045, 0.11); });
  else if (id === 'bed') { stand('bed'); solid('bed'); }
  else if (id === 'dining') { stand('dining'); solid('dining'); }
  else if (id === 'fridge') { stand('fridge'); solid('fridge'); }
  else if (id === 'table') { stand('coffee'); solid('coffee'); }
  else if (id === 'lamp') { stand('lamp'); solid('lamp'); }
  else if (id === 'plant') { stand('plant'); solid('plant'); }
  else if (id === 'art') stand('art', 1.25);
  else if (id === 'rug') blocks((R) => { R('#2f3237', 0, 0, 0, 2.9, 0.012, 2.3); R(TEX.rugWool, 0, 0.012, 0, 2.78, 0.012, 2.18); }); // grey wool with a dark bound edge
  st.rg.add(grp); st.furn.set(id, { grp, obst });
}

/* ---- backpacks: everyone arrives with one, and chooses which (all free; makers credited in models/CREDITS.txt) ---- */
// yaw turns each model so that its straps lie against the back; h is how tall it is worn.
const PACKS = [
  { id: 'hike', name: 'Orange hiking pack', data: packHike, yaw: Math.PI / 2, h: 0.56, strap: '#3b3f46' },
  { id: 'travel', name: 'Teal travel pack', data: packTravel, yaw: Math.PI, h: 0.54, square: true, strap: '#c23a2e' },
  { id: 'blue', name: 'Blue travel pack', data: packBlue, yaw: 0, h: 0.54, square: true, strap: '#2d5f9f' },
  { id: 'yellow', name: 'Yellow backpack', data: packYellow, yaw: -Math.PI / 2, h: 0.5, square: true, strap: '#aeb6bf' },
  { id: 'white', name: 'White backpack', data: packWhite, yaw: Math.PI, h: 0.5, square: true, strap: '#d2452f' },
  { id: 'black', name: 'Black backpack', data: packBlack, yaw: 0, h: 0.5, square: true, strap: '#1e2024' },
];
if (!PACKS.some((q) => q.id === game.pack)) game.pack = null; // nothing chosen yet: the chooser opens once the city has loaded
// Wearing it properly. Each model is first tidied up: stood square, its own loose straps (which hang in mid-air)
// cut away, and its flat back panel found. The character's body is then measured where a backpack sits - the line of
// the back, the top of each shoulder, the chest and the width of the ribs - and the pack is set flat against the back
// with two straps built to follow that body: over the shoulder, down the chest and round under the arm to the bottom
// corner of the pack. The pack and its straps ride on the chest bone, so they lean, turn and bob with the body.
const BACKPACKS_ON = false; // set aside for now: nobody wears one and the chooser stays shut. Everything below is kept, ready to switch back on.
const packMount = new THREE.Group();
let packsLeft = PACKS.length;
for (const q of BACKPACKS_ON ? PACKS : []) new GLTFLoader().parse(q.data.buffer.slice(q.data.byteOffset, q.data.byteOffset + q.data.byteLength), '', (gltf) => {
  const root = gltf.scene, box = new THREE.Box3(), size = new THREE.Vector3(), ctr = new THREE.Vector3(), meshes = [];
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  root.updateMatrixWorld(true); box.setFromObject(root); box.getSize(size); box.getCenter(ctr);
  // Stand the model up straight. Several were modelled leaning or turned, so work out the pack's own three directions
  // from its shape - longest is its height, next its width, shortest its depth - and line those up with up, across and back.
  const stand = new THREE.Matrix4();
  if (q.square) {
    const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], vec = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], d = [0, 0, 0];
    for (const o of meshes) { const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i += 2) { _v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); d[0] = _v.x - ctr.x; d[1] = _v.y - ctr.y; d[2] = _v.z - ctr.z; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cov[r][c] += d[r] * d[c]; } }
    const skew = 0.5 * Math.atan2(2 * cov[0][2], cov[0][0] - cov[2][2]); // (which way it is widest, seen from above: keeps left and right the way they were)
    for (let sweep = 0; sweep < 12; sweep++) for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) { // find the three directions (Jacobi rotations)
      if (Math.abs(cov[i][j]) < 1e-12) continue;
      const th = 0.5 * Math.atan2(2 * cov[i][j], cov[j][j] - cov[i][i]), c = Math.cos(th), sn = Math.sin(th);
      for (const m of [cov, vec]) for (let k = 0; k < 3; k++) { const a = m[k][i], b = m[k][j]; m[k][i] = c * a - sn * b; m[k][j] = sn * a + c * b; }
      for (let k = 0; k < 3; k++) { const a = cov[i][k], b = cov[j][k]; cov[i][k] = c * a - sn * b; cov[j][k] = sn * a + c * b; }
    }
    const order = [0, 1, 2].sort((a, b) => cov[b][b] - cov[a][a]), axis = (n) => new THREE.Vector3(vec[0][order[n]], vec[1][order[n]], vec[2][order[n]]);
    const up = axis(0), across = axis(1); if (up.y < 0) up.negate(); if (across.x * Math.cos(skew) + across.z * Math.sin(skew) < 0) across.negate();
    const out = new THREE.Vector3().crossVectors(across, up);
    stand.set(across.x, across.y, across.z, 0, up.x, up.y, up.z, 0, out.x, out.y, out.z, 0, 0, 0, 0, 1);
  }
  stand.multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
  for (const o of meshes) o.geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(stand, o.matrixWorld));
  box.makeEmpty(); for (const o of meshes) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox); } box.getSize(size); box.getCenter(ctr);
  const k = q.h / size.y, fit = new THREE.Matrix4().makeScale(k, k, k).multiply(new THREE.Matrix4().makeRotationY(q.yaw)).multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
  q.obj = new THREE.Group(); q.straps = []; let z0 = Infinity, z1 = -Infinity, x1 = 0; const A = new THREE.Vector3(), Bv = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3();
  for (const o of meshes) o.geometry.applyMatrix4(fit); // from here on the model is in worn size, its outer face towards +z and its back panel towards -z
  // The back panel is the biggest flat area facing the body. Find it, tip the whole pack so that panel stands
  // exactly upright and square to the back (some were modelled leaning), then find how deep the panel sits.
  const eachTri = (g, fn) => { const pa = g.attributes.position, ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { A.fromBufferAttribute(pa, ix[i]); Bv.fromBufferAttribute(pa, ix[i + 1]); C.fromBufferAttribute(pa, ix[i + 2]); fn(i, (A.z + Bv.z + C.z) / 3); } };
  const bins = new Float32Array(48), lean = new THREE.Vector3(); let bw = 0, peak = 0, tight = false;
  const findPanel = () => {
    z0 = Infinity; z1 = -Infinity; x1 = 0; bins.fill(0);
    for (const o of meshes) { const pa = o.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const z = pa.getZ(i); if (z < z0) z0 = z; if (z > z1) z1 = z; x1 = Math.max(x1, Math.abs(pa.getX(i))); } }
    bw = (z1 - z0) / 48;
    // Slice the pack front to back. Straps only cover two thin strips of a slice; the back panel fills nearly all of it.
    // So the panel is the first slice, coming from the body side, that is a full sheet.
    const GX = 9, GY = 13, seen = new Uint8Array(49 * GX * GY), mark = (v) => { seen[Math.min(47, Math.floor((v.z - z0) / bw)) * GX * GY + Math.min(GY - 1, Math.floor((v.y / q.h + 0.5) * GY)) * GX + Math.min(GX - 1, Math.floor((v.x / x1 * 0.5 + 0.5) * GX))] = 1; };
    for (const o of meshes) eachTri(o.geometry, () => { mark(A); mark(Bv); mark(C); mark(N.addVectors(A, Bv).add(C).multiplyScalar(1 / 3)); });
    const win = Math.max(2, Math.ceil(0.035 / bw)), full = (i) => { let n = 0; for (let c = 0; c < GX * GY; c++) for (let k = 0; k < win && i + k < 48; k++) if (seen[(i + k) * GX * GY + c]) { n++; break; } return n / (GX * GY); }; // a panel is padded and curved, so look through a few centimetres at once
    let most = 0; for (let i = 0; i < 44; i++) most = Math.max(most, full(i));
    peak = 0; for (let i = 0; i < 44; i++) if (full(i) >= most * 0.72) {
      peak = i + (win - 1) / 2;
      // Straps that were modelled lying flat on the panel sit just in front of it: within those few centimetres, the panel itself is the first thin slice that is a sheet
      const thin = (j) => { let n = 0; for (let c = 0; c < GX * GY; c++) if (seen[j * GX * GY + c] || seen[(j + 1) * GX * GY + c]) n++; return n / (GX * GY); };
      for (let j = i; j < i + win + 2 && j < 46; j++) if (thin(j) >= most * 0.55) { peak = j + 0.5; tight = true; break; }
      break;
    }
    lean.set(0, 0, 0); const zp = z0 + (peak + 0.5) * bw;
    for (const o of meshes) eachTri(o.geometry, (i, cz) => { if (Math.abs(cz - zp) > bw * 2.5) return; N.subVectors(Bv, A).cross(C.sub(A)); if (N.z < 0 && -N.z / N.length() > 0.6) lean.add(N); });
    return zp;
  };
  findPanel();
  if (lean.lengthSq() > 0) { // stand the panel upright
    const fix = new THREE.Quaternion().setFromUnitVectors(lean.normalize(), new THREE.Vector3(0, 0, -1));
    if (2 * Math.acos(Math.min(1, Math.abs(fix.w))) < 0.7) for (const o of meshes) o.geometry.applyQuaternion(fix);
  }
  const panel = findPanel();
  for (const o of meshes) {
    const g = o.geometry, keep = [], pa = g.attributes.position, ua = g.attributes.uv, ix = g.index.array, own = { '-1': { pos: [], uv: [] }, 1: { pos: [], uv: [] } };
    eachTri(g, (i, cz) => { // anything hanging behind the panel is one of the pack's own straps: lift it off, left and right apart, to be put on the wearer
      const cx = (A.x + Bv.x + C.x) / 3, cy = (A.y + Bv.y + C.y) / 3;
      if (cz > panel - (tight ? 0.007 : 0.02) || (Math.abs(cx) < 0.035 && cy > q.h / 2 - 0.14)) { keep.push(ix[i], ix[i + 1], ix[i + 2]); return; } // (the grab handle at the top stays on the pack)
      if (Math.abs(cx) < 0.035) return;
      const side = own[cx < 0 ? -1 : 1]; for (const k of [ix[i], ix[i + 1], ix[i + 2]]) { side.pos.push(pa.getX(k), pa.getY(k), pa.getZ(k) - panel); side.uv.push(ua ? ua.getX(k) : 0, ua ? ua.getY(k) : 0); }
    });
    g.setIndex(keep); g.translate(0, 0, -panel); g.computeVertexNormals();
    const look = { map: o.material.map, color: o.material.map ? '#ffffff' : o.material.color, side: THREE.DoubleSide };
    for (const sd of [-1, 1]) if (own[sd].pos.length) q.straps.push({ side: sd, pos: own[sd].pos, uv: own[sd].uv, look });
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial(look)); m.castShadow = HQ; q.obj.add(m);
  }
  q.depth = z1 - panel; q.halfW = x1;
  if (--packsLeft === 0) { wearBackpack(); makePackCards(); }
}, (e) => console.error('backpack failed to load', q.id, e));
function scanBody() { // measure the character where a backpack touches them, by feeling for the surface of the body along lines
  const skins = []; hero.model.traverse((o) => { if (o.isSkinnedMesh) { o.skeleton.update(); skins.push(o); } });
  hero.obj.updateMatrixWorld(true); const rc = new THREE.Raycaster(); rc.far = 1.6;
  const feel = (ox, oy, oz, dx, dy, dz) => { rc.set(hero.obj.localToWorld(_a.set(ox, oy, oz)), _b.set(dx, dy, dz).transformDirection(hero.obj.matrixWorld)); const hit = rc.intersectObjects(skins, false)[0]; return hit ? hero.obj.worldToLocal(hit.point.clone()) : null; };
  const b0 = feel(0, 1.5, -1, 0, 0, 1), f0 = feel(0, 1.5, 1, 0, 0, -1); if (!b0 || !f0) return null;
  const zC = (b0.z + f0.z) / 2, SX = 0.13, sides = [-1, 1].map((sd) => { // the outline of the body in a slice through each shoulder, from the chest up over the top and down the back
    const pts = []; for (let i = 0; i <= 60; i++) { const th = (-60 + i * 5) * Math.PI / 180, dz = Math.cos(th), dy = Math.sin(th), h = feel(sd * SX, 1.5 + dy * 0.7, zC + dz * 0.7, 0, -dy, -dz); if (h) pts.push(h); } return pts; });
  const back = []; for (let y = 0.9; y <= 1.8; y += 0.04) { let z = Infinity; for (const x of [-0.1, 0, 0.1]) { const h = feel(x, y, -1, 0, 0, 1); if (h) z = Math.min(z, h.z); } if (z < Infinity) back.push([y, z]); }
  let hw = 0.22; for (let x = 0.1; x < 0.34; x += 0.01) if (!feel(x, 1.3, 1, 0, 0, -1)) { hw = x; break; }                 // half the width of the ribs, to the gap before the arm
  return { zC, SX, sides, back, hw, shoulder: Math.min(...sides.map((pts) => Math.max(...pts.map((q) => q.y)))) };
}
function strapMesh(path, normals, color) { // a flat band 5 cm wide laid along a path, facing away from the body
  const pos = [], nor = [], idx = [], w = new THREE.Vector3(), t = new THREE.Vector3(), last = new THREE.Vector3();
  for (let i = 0; i < path.length; i++) {
    t.subVectors(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]).normalize(); w.crossVectors(t, normals[i]).normalize(); if (i && w.dot(last) < 0) w.negate(); last.copy(w);
    for (const e of [-1, 1]) { pos.push(path[i].x + w.x * e * 0.025, path[i].y + w.y * e * 0.025, path[i].z + w.z * e * 0.025); nor.push(normals[i].x, normals[i].y, normals[i].z); }
    if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })); m.castShadow = HQ; m.userData.strap = true; return m;
}
// The pack's own strap, as it was modelled hanging loose, is laid along the line a strap takes on the wearer. Each point
// of it keeps how far along the strap it is, how far across its width and how far through its thickness; only the line
// the strap follows changes - from a loop hanging in the air to over the shoulder, down the chest and under the arm.
function wrapStrap(q, side, path, normals) {
  const parts = q.straps.filter((k) => k.side === side); let n = 0, yTop = -Infinity, yBot = Infinity;
  for (const k of parts) for (let i = 0; i < k.pos.length; i += 3) { n++; yTop = Math.max(yTop, k.pos[i + 1]); yBot = Math.min(yBot, k.pos[i + 1]); }
  if (n < 450 || yTop - yBot < 0.15) return null;                                              // too little strap to work with
  const NB = 22, cx = new Float32Array(NB), cz = new Float32Array(NB), cn = new Float32Array(NB), bin = (y) => clamp((yTop - y) / (yTop - yBot) * (NB - 1), 0, NB - 1);
  for (const k of parts) for (let i = 0; i < k.pos.length; i += 3) { const b = Math.round(bin(k.pos[i + 1])); cx[b] += k.pos[i]; cz[b] += k.pos[i + 2]; cn[b]++; }
  let lastOk = -1; for (let b = 0; b < NB; b++) if (cn[b]) { cx[b] /= cn[b]; cz[b] /= cn[b]; lastOk = b; }  // the middle line of the hanging strap, from its top fixing to its bottom one
  for (let b = 0; b < NB; b++) if (!cn[b]) { let a = b - 1, c = b + 1; while (a >= 0 && !cn[a]) a--; while (c < NB && !cn[c]) c++; const A0 = a >= 0 ? a : c, C0 = c < NB ? c : a, f = A0 === C0 ? 0 : (b - A0) / (C0 - A0); cx[b] = lerp(cx[A0], cx[C0], f); cz[b] = lerp(cz[A0], cz[C0], f); }
  for (let pass = 0; pass < 2; pass++) for (let b = 1; b < NB - 1; b++) { cx[b] = (cx[b - 1] + 2 * cx[b] + cx[b + 1]) / 4; cz[b] = (cz[b - 1] + 2 * cz[b] + cz[b + 1]) / 4; }
  const along = new Float32Array(NB), dy = (yTop - yBot) / (NB - 1); for (let b = 1; b < NB; b++) along[b] = along[b - 1] + Math.hypot(cx[b] - cx[b - 1], dy, cz[b] - cz[b - 1]);
  // the line on the wearer: how far along it each point is, and which way is "across" and "outwards" there
  const len = [0], W = [], t = new THREE.Vector3(); for (let i = 1; i < path.length; i++) len.push(len[i - 1] + path[i].distanceTo(path[i - 1]));
  for (let i = 0; i < path.length; i++) { const w = new THREE.Vector3(); t.subVectors(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]).normalize(); w.crossVectors(t, normals[i]).normalize(); if (i ? w.dot(W[i - 1]) < 0 : w.x < 0) w.negate(); W.push(w); }
  const total = len[len.length - 1], P = new THREE.Vector3(), Nn = new THREE.Vector3(), Ww = new THREE.Vector3(), grp = new THREE.Group(); grp.userData.strap = true;
  for (const k of parts) {
    const out = new Float32Array(k.pos.length);
    for (let i = 0; i < k.pos.length; i += 3) {
      const fb = bin(k.pos[i + 1]), b0 = Math.min(NB - 2, Math.floor(fb)), fr = fb - b0, du = clamp(k.pos[i] - lerp(cx[b0], cx[b0 + 1], fr), -0.045, 0.045), dn = clamp(k.pos[i + 2] - lerp(cz[b0], cz[b0 + 1], fr), -0.05, 0.05);
      const s = lerp(along[b0], along[b0 + 1], fr) / along[NB - 1] * total; let j = 1; while (j < len.length - 1 && len[j] < s) j++;
      const f = (s - len[j - 1]) / Math.max(1e-6, len[j] - len[j - 1]);
      P.lerpVectors(path[j - 1], path[j], f); Nn.lerpVectors(normals[j - 1], normals[j], f).normalize(); Ww.lerpVectors(W[j - 1], W[j], f).normalize();
      P.addScaledVector(Ww, -du).addScaledVector(Nn, dn + 0.012);                               // (the pack is turned to face backwards when worn, so its left is the wearer's right)
      out[i] = P.x; out[i + 1] = P.y; out[i + 2] = P.z;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial(k.look)); m.castShadow = HQ; grp.add(m);
  }
  return grp;
}
function wearBackpack() { // called when the character and the backpacks are ready, and whenever another one is chosen
  if (packsLeft || !hero.model) return;
  if (!hero.body) {
    let bone = null; hero.model.traverse((o) => { if (o.isBone && boneKey(o.name) === 'spine_03') bone = o; });
    hero.body = bone && scanBody(); if (!hero.body) return;
    packMount.position.set(0, 0, 0); packMount.rotation.set(0, 0, 0); hero.obj.add(packMount); hero.obj.updateMatrixWorld(true); bone.attach(packMount); // everything inside is laid out in the character's own space, as measured
  }
  const q = PACKS.find((k) => k.id === (game.pack || PACKS[0].id)), bd = hero.body, top = bd.shoulder - 0.035, cy = top - q.h / 2, bot = cy - q.h / 2;
  for (const c of [...packMount.children]) { if (c.userData.strap) c.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); packMount.remove(c); }
  const zPanel = Math.min(...bd.back.filter(([y]) => y > bot + 0.06 && y < top).map(([, z]) => z)) - 0.004; // flat against the part of the back that sticks out furthest
  const hold = new THREE.Group(); hold.position.set(0, cy, zPanel); hold.rotation.y = Math.PI; hold.add(q.obj); packMount.add(hold);
  const made = [];
  bd.sides.forEach((pts, si) => {
    const sd = si ? 1 : -1, path = [], nrm = [], C = V3(sd * bd.SX, 1.5, bd.zC), add = (p, n) => { path.push(p); nrm.push(n); };
    add(V3(sd * 0.1, top - 0.03, zPanel - 0.02), V3(0, 0.5, -0.86).normalize());                                             // leaves the top of the pack
    for (let i = pts.length - 1; i >= 0; i--) { // up the back, over the shoulder, down the chest
      const p = pts[i]; if (p.z < bd.zC ? p.y < top - 0.02 : p.y < bd.shoulder - 0.32) continue;
      const n = V3(0, p.y - C.y, p.z - C.z).normalize(); add(p.clone().addScaledVector(n, 0.012), n);
    }
    const F = path[path.length - 1], L = V3(sd * Math.min(q.halfW - 0.02, bd.hw - 0.005), bot + 0.09, zPanel - 0.01), mid = V3(sd * (bd.hw - 0.012), (F.y + L.y) / 2 - 0.02, bd.zC + 0.03); // kept tight to the ribs, inside the arm
    const curve = new THREE.CatmullRomCurve3([path[path.length - 2], F, mid, L, V3(L.x, L.y - 0.05, L.z - 0.05)]);                 // round under the arm to the bottom corner
    const nF = nrm[nrm.length - 1].clone();
    for (let i = 1; i <= 18; i++) { const p = curve.getPoint(1 / 4 + (i / 18) * (2 / 4)); add(p, nF.clone().lerp(V3(p.x, 0, p.z - bd.zC).normalize(), Math.min(1, i / 8)).normalize()); } // the band turns gradually from facing forwards to facing sideways
    made.push({ own: wrapStrap(q, -sd, path, nrm), path, nrm });
  });
  const both = made.every((k) => k.own); // the pack's own straps, bent to fit; plain bands only if the model has no usable pair, and then on both sides so they match
  for (const k of made) packMount.add(both ? k.own : strapMesh(k.path, k.nrm, q.strap));
}
function makePackCards() { // a small picture of each backpack, drawn once from the real model, for the chooser
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(220, 220); r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 10); sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(1, 2, 2); sc.add(d);
  $('packs').replaceChildren(...PACKS.map((q) => {
    const m = q.obj.clone(); m.position.set(0, 0, 0); m.rotation.y = -0.5; sc.add(m); cam.position.set(0, q.h * 0.25, q.h * 3.1); cam.lookAt(0, 0, 0); r.render(sc, cam); sc.remove(m);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.dataset.id = q.id;
    const img = new Image(); img.src = r.domElement.toDataURL('image/png'); img.alt = ''; const t = document.createElement('span'); t.textContent = q.name; b.append(img, t);
    b.addEventListener('click', () => { game.pack = q.id; save(); wearBackpack(); markPack(); }); return b;
  }));
  r.dispose(); r.forceContextLoss(); markPack();
}
function makeHeroCards() { // a head-and-shoulders picture of each character, drawn once from the real model
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(220, 220); r.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, 0.1, 10), box = new THREE.Box3(); sc.add(new THREE.HemisphereLight(0xffffff, 0x9a8a7a, 2.4)); const d = new THREE.DirectionalLight(0xffffff, 2.0); d.position.set(1, 2, 2); sc.add(d);
  $('charlist').replaceChildren(...HERO_LIST.filter(([id]) => HEROES[id]).map(([id, name]) => {
    const H = HEROES[id], look = H.k.makeLook(H.look), m = SkeletonUtils.clone(H.k.root); m.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.frustumCulled = false; } });
    m.scale.multiplyScalar(H.k.scale); sc.add(m); m.updateMatrixWorld(true); let top = -Infinity; m.traverse((o) => { if (o.isBone) top = Math.max(top, _v.setFromMatrixPosition(o.matrixWorld).y); });
    cam.position.set(0.25, top - 0.12, 1.55); cam.lookAt(0, top - 0.2, 0); r.render(sc, cam); sc.remove(m);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.dataset.id = id;
    const img = new Image(); img.src = HERO_FACE[id] = r.domElement.toDataURL('image/png'); img.alt = ''; const t = document.createElement('span'); t.textContent = name; b.append(img, t);
    { sc.add(m); const mx = new THREE.AnimationMixer(m); mx.clipAction(H.k.walk).play(); mx.setTime(0.38); m.position.y += H.k.liftWalk || 0; m.rotation.y = 0.55; m.updateMatrixWorld(true); // the same character, whole and walking
      const c2 = new THREE.PerspectiveCamera(24, 1, 0.1, 20); c2.position.set(0, top * 0.56, top * 2.75); c2.lookAt(0, top * 0.53, 0); r.render(sc, c2); HERO_BODY[id] = r.domElement.toDataURL('image/png'); mx.stopAllAction();
      mx.clipAction(H.k.idle).play(); mx.setTime(0.2); m.position.y += (H.k.lift || 0) - (H.k.liftWalk || 0); m.rotation.y = 0.3; m.updateMatrixWorld(true); r.setSize(320, 400); // and from the waist up, for when they speak
      const c3 = new THREE.PerspectiveCamera(22, 320 / 400, 0.1, 20); c3.position.set(0.1, top * 0.8, top * 1.55); c3.lookAt(0, top * 0.775, 0); r.render(sc, c3); HERO_BUST[id] = r.domElement.toDataURL('image/png'); r.setSize(220, 220); mx.stopAllAction(); mx.uncacheRoot(m); sc.remove(m); }
    b.addEventListener('click', () => { game.hero = id; save(); becomeHero(id); markHero(); }); return b;
  }));
  [...kinds, ...AGB].forEach((k, i) => { // and a face for each kind of passer-by, for the list of people nearby (and for whoever stops you)
    const look = k.looks[0], m = SkeletonUtils.clone(k.root); m.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.frustumCulled = false; } });
    m.scale.multiplyScalar(k.scale); sc.add(m); m.updateMatrixWorld(true); let top = -Infinity; m.traverse((o) => { if (o.isBone) top = Math.max(top, _v.setFromMatrixPosition(o.matrixWorld).y); });
    cam.position.set(0.25, top - 0.12, 1.55); cam.lookAt(0, top - 0.2, 0); r.render(sc, cam); sc.remove(m); k.face = r.domElement.toDataURL('image/png'); if (i < kinds.length) KIND_FACE[i] = k.face;
  });
  r.dispose(); r.forceContextLoss(); markHero();
}
const HERO_FACE = {}, HERO_BODY = {}, HERO_BUST = {}, KIND_FACE = [];
function markHero() { for (const b of $('charlist').children) b.setAttribute('aria-pressed', String(b.dataset.id === hero.who)); if (HERO_FACE[hero.who]) $('meimg').src = HERO_FACE[hero.who]; }
function markPack() { for (const b of $('packs').children) b.setAttribute('aria-pressed', String(b.dataset.id === (game.pack || PACKS[0].id))); }
function openLook() { if (ui.busy || packsLeft) return; ui.busy = true; $('look').hidden = false; }
function closeLook() { if (!game.pack) { game.pack = PACKS[0].id; save(); } $('look').hidden = true; ui.busy = false; }

/* ---- what is on screen: money, the next thing to do, one action button, talking, the furniture list ---- */
const $ = (id) => document.getElementById(id);
const ui = { busy: false, act: null, goal: '', money: -1 }, moneyEl = $('money'), goalEl = $('goal'), actEl = $('act'), talkEl = $('talk');
$('me').addEventListener('click', () => { if (ui.busy || !$('charlist').children.length) return; ui.busy = true; $('chars').hidden = false; }); // your own picture opens the list of characters
$('charx').addEventListener('click', () => { $('chars').hidden = true; ui.busy = false; });
function showMoney() { // (ui.hold: money earned whose coins are still in the air; ui.count: money just spent, still counting down)
  let v = Math.max(0, game.money - (ui.hold || 0)); const c = ui.count; /* the figure shown is never below 0 */
  if (c) { const t = (performance.now() - c.t0) / c.dur; if (t >= 1) ui.count = null; else v = logic.countStep(c.from, v, t); }
  if (ui.money === v) return; ui.money = v; moneyEl.textContent = cash(v);
}
function moneyCount(from, dur = 800) { // after paying: the balance runs down from what it was to what it is now
  ui.count = { from: Math.max(0, from), t0: performance.now(), dur: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : dur };
  moneyEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
  const tick = () => { showMoney(); if (ui.count) setTimeout(tick, 33); }; tick(); /* (it keeps counting even while a card has the game paused) */
}
function setGoal(text) { if (ui.goal === text) return; ui.goal = text; goalEl.textContent = text; }
function setAct(a) { if ((ui.act && ui.act.label) === (a && a.label)) { ui.act = a; return; } ui.act = a; actEl.hidden = !a; if (a) actEl.textContent = a.label; }
actEl.addEventListener('click', () => { if (ui.act && !ui.busy) ui.act.run(); });
function say(who, text, opts) {
  ui.busy = true; talkEl.hidden = false; $('who').textContent = who; $('say').textContent = text;
  $('opts').replaceChildren(...opts.map(([label, fn, off], i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.disabled = !!off; b.dataset.n = i + 1; b.addEventListener('click', fn); return b; }));
}
function hush() { talkEl.hidden = true; ui.busy = false; }
/* ---- the people walking near you, shown down the right-hand side: tap one to chat ---- */
const NAMES_M = ['Daniel', 'Mateo', 'Kenji', 'Omar', 'Lucas', 'Arjun', 'Tunde', 'Noah', 'Leon', 'Ibrahim', 'Marco', 'Ethan'], NAMES_F = ['Sofia', 'Amara', 'Mei', 'Layla', 'Emma', 'Priya', 'Zara', 'Chloe', 'Ines', 'Nadia', 'Grace', 'Yuki'];
const KIND_WOMAN = [2, 5, 6, 8], KIND_POLICE = [0, 7, 8]; // which of the kinds of passer-by are women, and which are police officers
const nameOf = (p) => { const k = kinds.indexOf(p.kind); return (KIND_POLICE.includes(k) ? 'Officer ' : '') + (KIND_WOMAN.includes(k) ? NAMES_F : NAMES_M)[p.id % 12]; };
const CHAT_HELLO = ['Hello! Nice day to be out, isn\u2019t it?', 'Oh, hi there. Are you new around here?', 'Hey! I was just heading down the road.', 'Good to see a friendly face. What\u2019s up?'];
const CHAT_DAY = ['Busy, but I can\u2019t complain. The sun is out.', 'Pretty good. I just finished work, so I\u2019m taking a walk.', 'A bit tired, honestly. This city never slows down.', 'Great, thanks for asking. Hardly anyone ever does.'];
const CHAT_TIP = ['Look for the red FOR RENT signs. Knock on the gate and the owner comes out to talk.', 'Get a place of your own first. After that you can fill it with furniture.', 'The quiet streets with the small houses are the nicest part. Take a walk down one.', 'Keep an eye on your money. Rent is paid by the year here.'];
const CHAT_POLICE = ['Everything is calm today. Mind the cars when you cross.', 'Stay on the pavement and you will be fine.', 'All quiet on this street. Enjoy your day.'];
// Chats with the people you meet: each person has a thread; Back shows every conversation you have had, X closes the window.
const dm = { p: null, busy: false, threads: new Map() };
const faceOf = (p) => KIND_FACE[kinds.indexOf(p.kind)];
function thread(p) { let t = dm.threads.get(p.id); if (!t) { t = { p, name: nameOf(p), face: faceOf(p), msgs: [], at: Date.now() }; dm.threads.set(p.id, t); } return t; }
function dmRow(m, t) { const log = $('dmlog'), row = document.createElement('div'); row.className = 'row ' + (m.me ? 'me' : 'them');
  if (!m.me) { const av = new Image(); av.src = t.face; av.alt = ''; av.className = 'av'; row.append(av); }
  const b = document.createElement('div'); b.className = 'bub'; b.textContent = m.text; row.append(b); log.append(row); log.scrollTop = log.scrollHeight; }
function dmBubble(text, me) { const t = thread(dm.p), m = { text, me }; t.msgs.push(m); t.at = Date.now(); dmRow(m, t); }
function dmReply(text, then) { if (!dm.p) return; const p = dm.p, log = $('dmlog'), tp = document.createElement('div'); tp.className = 'row them typing'; tp.innerHTML = '<div class="bub"><i></i><i></i><i></i></div>'; log.append(tp); log.scrollTop = log.scrollHeight; dm.busy = true; dmQuick();
  setTimeout(() => { tp.remove(); dm.busy = false; if (dm.p !== p) { const t = thread(p); t.msgs.push({ text, me: false }); t.at = Date.now(); return; } dmBubble(text, false); dmQuick(); if (then) then(); }, 750 + text.length * 14); }
const CHAT_ELSE = ['Haha, true.', 'Really? Tell me more.', 'I hear you.', 'Interesting! I have to keep moving soon though.', 'You are funny.'];
function dmAnswer(text) { // what they say back to what you typed
  const p = dm.p, n = p.id, police = nameOf(p).startsWith('Officer'), q = text.toLowerCase();
  if (/\b(bye|later|goodnight|good night|see you)\b/.test(q)) return dmReply('See you around!', () => setTimeout(dmBack, 900));
  if (/\b(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/.test(q)) return dmReply(police ? 'Good day. Can I help you with anything?' : CHAT_HELLO[n % 4]);
  if (/how.*(you|day|going|doing)|how far/.test(q)) return dmReply((police ? CHAT_POLICE : CHAT_DAY)[n % (police ? 3 : 4)]);
  if (/\b(where|what|around|place|rent|house|shop|do here|job|work)\b/.test(q)) return dmReply(CHAT_TIP[(n >> 2) % 4]);
  if (/thank/.test(q)) return dmReply("You're welcome!");
  dmReply(CHAT_ELSE[(n + thread(p).msgs.length) % CHAT_ELSE.length]);
}
function dmQuick() { // ready-made replies, as chips above the message bar
  const q = $('dmquick'); if (!dm.p) return q.replaceChildren();
  q.replaceChildren(...['Hi \u{1F44B}', "How's your day?", "What's around here?", 'Bye \u{1F44B}'].map((label) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.disabled = dm.busy; b.addEventListener('click', () => { if (dm.busy) return; dmBubble(label, true); dmAnswer(label); }); return b; }));
}
function dmView(list) { $('dm').classList.toggle('listing', list); $('dmlist').hidden = !list; $('dmthread').hidden = list; }
function openThread(p) {
  if (dm.p && dm.p !== p) dm.p.hold = false; dm.p = p; p.hold = true; const t = thread(p);
  $('dmname').textContent = t.name; $('dmface').src = t.face; $('dmlog').replaceChildren(); dmView(false);
  const stamp = document.createElement('div'); stamp.className = 'stamp'; stamp.textContent = 'Today ' + new Date(t.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); $('dmlog').append(stamp);
  for (const m of t.msgs) dmRow(m, t); dmQuick(); setTimeout(() => $('dmin').focus(), 50);
}
function dmBack() { // to the list of everyone you have chatted with
  if ($('dm').hidden) return; if (dm.p) dm.p.hold = false; dm.p = null; dm.busy = false; dmView(true);
  const list = [...dm.threads.values()].filter((t) => t.msgs.length).sort((a, b) => b.at - a.at);
  $('dmlist').replaceChildren(...(list.length ? list.map((t) => { const b = document.createElement('button'), av = new Image(), tx = document.createElement('span'), nm = document.createElement('b'), last = document.createElement('small'), tm = document.createElement('time'), m = t.msgs[t.msgs.length - 1];
    b.type = 'button'; b.className = 'chatrow'; av.src = t.face; av.alt = ''; nm.textContent = t.name; last.textContent = (m.me ? 'You: ' : '') + m.text; tm.textContent = new Date(t.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); tx.append(nm, last); b.append(av, tx, tm);
    b.addEventListener('click', () => { if (people.includes(t.p)) openThread(t.p); else { last.textContent = t.name + ' has gone on their way.'; } }); return b; })
    : [Object.assign(document.createElement('p'), { className: 'empty', textContent: 'No chats yet. Tap someone near you to say hi.' })]));
}
function chatWith(p) { if (ui.busy) return; ui.busy = true; $('dm').hidden = false; openThread(p); }
function closeDm() { if ($('dm').hidden) return; $('dm').hidden = true; if (dm.p) dm.p.hold = false; dm.p = null; dm.busy = false; ui.busy = false; $('dmin').blur(); }
$('dmx').addEventListener('click', closeDm); $('dmback').addEventListener('click', dmBack);
$('dmform').addEventListener('submit', (e) => { e.preventDefault(); const v = $('dmin').value.trim(); if (!v || !dm.p || dm.busy) return; $('dmin').value = ''; dmBubble(v, true); dmAnswer(v); });
$('dmin').addEventListener('keydown', (e) => { if (e.code === 'Escape') closeDm(); e.stopPropagation(); });
// The people passing near you, beside your own picture: up to five faces to tap and chat with, "+3" for the rest, and how many there are in all.
let nearT = 0, nearKey = '';
function showNear(dt) {
  if ((nearT -= dt) > 0) return; nearT = 0.4;
  const all = !KIND_FACE.length ? [] : people.filter((p) => { p.obj.getWorldPosition(_v); p.far = (_v.x - hero.x) ** 2 + (_v.z - hero.z) ** 2; return p.far < 18 * 18; }).sort((a, b) => a.far - b.far);
  const list = all.slice(0, 5).sort((a, b) => a.id - b.id), key = list.map((p) => p.id).join() + '/' + all.length; if (key === nearKey) return; nearKey = key;
  const out = list.map((p) => { const b = document.createElement('button'), img = new Image(); b.type = 'button'; b.title = nameOf(p); b.setAttribute('aria-label', 'Chat with ' + nameOf(p)); img.src = KIND_FACE[kinds.indexOf(p.kind)]; img.alt = ''; b.append(img); b.addEventListener('click', () => chatWith(p)); return b; });
  while (out.length < 5) out.push(document.createElement('i'));
  if (all.length > 5) { const more = document.createElement('b'); more.textContent = '+' + (all.length - 5); out.push(more); }
  $('friends').replaceChildren(...out);
}
$('lookx').addEventListener('click', closeLook);
// The menu: a floating panel of places to go. Choose one and the map draws the way there and counts down the distance.
const PLACES = [
  { id: 'home', icon: '\u{1F3E0}', name: 'Home', at: () => (game.home >= 0 && game.homeAt ? game.homeAt : null) },
  { id: 'errands', icon: '\u{1F4E6}', name: 'Errands', errand: true, at: () => [hero.x, hero.z] }, // work: timed errands that pay
  { id: 'furniture', icon: '\u{1F6CB}\uFE0F', name: 'Furniture', at: () => STORE_AT.furniture || [46, 1.5] },
  { id: 'grocery', icon: '\u{1F6D2}', name: 'Supermarket', at: () => STORE_AT.grocery || [69, 1.5] },
  { id: 'chat', icon: '\u{1F4AC}', name: 'Chat', chat: true, at: () => [hero.x, hero.z] }, // in the middle of the row: talk to whoever is nearest
  { id: 'school', icon: '\u{1F3EB}', name: 'School', at: () => [PITCH + F + 34, PITCH + F + 8.6] },
  { id: 'work', icon: '\u{1F4BC}', name: 'Work', at: () => [-PITCH + F + 30, F + 8.6] },
  { id: 'park', icon: '\u{1F333}', name: 'Park', at: () => [F + 8.6, -PITCH + F + 40] },
  { id: 'fun', icon: '\u{1F3AF}', name: 'Activities', at: () => [2 * PITCH + F + 30, F - 8.6] },
  { id: 'gym', icon: '\u{1F3CB}\uFE0F', name: 'Gym', at: () => [PITCH + F + 50, F + 8.6] },
  { id: 'hospital', icon: '\u{1F3E5}', name: 'Hospital', at: () => [-PITCH + F + 8.6, PITCH + F + 30] },
  { id: 'bank', icon: '\u{1F3E6}', name: 'Bank', at: () => [F + 8.6, PITCH + F + 44] },
  { id: 'food', icon: '\u{1F37D}\uFE0F', name: 'Restaurant', at: () => [2 * PITCH + F + 8.6, PITCH + F + 20] },
  { id: 'cinema', icon: '\u{1F3AC}', name: 'Cinema', at: () => [PITCH + F - 8.6, -PITCH + F + 36] },
  { id: 'salon', icon: '\u{1F487}', name: 'Salon', at: () => [-PITCH + F + 40, -PITCH + F + 8.6] },
  { id: 'bus', icon: '\u{1F68C}', name: 'Bus station', at: () => [3 * PITCH + F + 20, F + 8.6] },
  { id: 'swim', icon: '\u{1F3CA}', name: 'Swimming pool', at: () => [-2 * PITCH + F + 30, F + 8.6] },
  { id: 'library', icon: '', name: 'Library', at: () => [PITCH + F + 8.6, 2 * PITCH + F + 24] },
  { id: 'beach', icon: '', name: 'Beach', at: () => [-2 * PITCH + F - 8.6, PITCH + F + 40] },
  { id: 'sports', icon: '', name: 'Sports ground', at: () => [3 * PITCH + F + 8.6, -PITCH + F + 30] },
  { id: 'hotel', icon: '', name: 'Hotel', at: () => [-PITCH + F + 46, 2 * PITCH + F + 8.6] },
];
// The cards stand round a curve and the whole band turns: drag it, roll the wheel or use the arrow keys to bring more places round.
// App-style icons for the menu: a white symbol on a tile of the place's own colour
const P24 = (...d) => d.map((q) => (q[0] === '<' ? q : `<path d="${q}"/>`)).join('');
const APP = { home: ['#34c759', P24('m3 11 9-8 9 8', 'M5 9.500V21h14V9.500', 'M10 21v-6h4v6')], furniture: ['#b07c4f', P24('M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3', 'M3 12a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z', 'M6 18v2', 'M18 18v2')],
  grocery: ['#ff9500', P24('M3 4h2.200l2.300 10.500h10.300L20 7H6.400', '<circle cx="9.500" cy="18.500" r="1.300"/>', '<circle cx="17" cy="18.500" r="1.300"/>')], chat: ['#0a84ff', P24('M4 5.500A1.500 1.500 0 0 1 5.500 4h13A1.500 1.500 0 0 1 20 5.500v9a1.500 1.500 0 0 1-1.500 1.500H10l-5 4v-4.200A1.500 1.500 0 0 1 4 14.500z', '<circle cx="8.500" cy="10" r=".9" fill="#fff"/>', '<circle cx="12" cy="10" r=".9" fill="#fff"/>', '<circle cx="15.500" cy="10" r=".9" fill="#fff"/>')],
  school: ['#5e5ce6', P24('M2 9l10-5 10 5-10 5z', 'M6 11.500V16c0 1.600 2.700 3 6 3s6-1.400 6-3v-4.500', 'M22 9v6')], work: ['#636366', P24('<rect x="3" y="7" width="18" height="13" rx="2"/>', 'M9 7V5.500A1.500 1.500 0 0 1 10.500 4h3A1.500 1.500 0 0 1 15 5.500V7', 'M3 13h18')],
  park: ['#30b85a', P24('<circle cx="12" cy="9" r="6"/>', 'M12 15v6', 'M9 21h6')], fun: ['#ff375f', P24('<circle cx="12" cy="12" r="9"/>', '<circle cx="12" cy="12" r="5"/>', '<circle cx="12" cy="12" r="1.200" fill="#fff"/>')],
  gym: ['#ff453a', P24('M6 8v8', 'M3 10v4', 'M18 8v8', 'M21 10v4', 'M6 12h12')], hospital: ['#ff3b30', P24('<rect x="3.500" y="3.500" width="17" height="17" rx="4"/>', 'M12 8v8', 'M8 12h8')],
  bank: ['#0f6e8c', P24('m3 10 9-6 9 6', 'M5 10v8', 'M9.700 10v8', 'M14.300 10v8', 'M19 10v8', 'M3 20h18')], food: ['#ff9f0a', P24('M7 3v8a2 2 0 0 0 2 2v8', 'M5 3v5a2 2 0 0 0 2 2', 'M9 3v5a2 2 0 0 1-2 2', 'M17 21V3c-2.500 1.500-3 6-1.500 9H17')],
  cinema: ['#bf5af2', P24('<rect x="3" y="9" width="18" height="11" rx="1.500"/>', 'm3 9 1.500-4.500h15L21 9', 'm8 4.500 2 4.500', 'm13 4.500 2 4.500')], salon: ['#ff2d92', P24('<circle cx="6" cy="6" r="3"/>', '<circle cx="6" cy="18" r="3"/>', 'M8.500 8 20 18', 'M8.500 16 20 6')],
  bus: ['#32ade6', P24('<rect x="4" y="4" width="16" height="13" rx="2.500"/>', 'M4 11h16', 'M7 17v2.500', 'M17 17v2.500', '<circle cx="8" cy="14" r=".8" fill="#fff"/>', '<circle cx="16" cy="14" r=".8" fill="#fff"/>')], swim: ['#30b0c7', P24('M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0', '<circle cx="16.500" cy="6" r="2"/>', 'm6 12 5-4 3 3')] };
Object.assign(APP, { library: ['#a2845e', P24('M4 5.500A1.500 1.500 0 0 1 5.500 4H11v15H5.500A1.500 1.500 0 0 0 4 20.500z', 'M20 5.500A1.500 1.500 0 0 0 18.500 4H13v15h5.500a1.500 1.500 0 0 1 1.500 1.500z')], beach: ['#ffb340', P24('<circle cx="12" cy="8" r="3.500"/>', 'M12 2v1.200', 'M5.800 4.800l.9.9', 'M18.200 4.800l-.9.9', 'M3 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M3 21c2-2 4-2 6 0s4 2 6 0 4-2 6 0')],
  sports: ['#28a060', P24('<circle cx="12" cy="12" r="9"/>', 'm12 7 4.300 3.100-1.600 5H9.300l-1.600-5z', 'M12 3v4', 'm20.500 9.500-4.200.6', 'm17.500 19-2.800-3.900', 'M6.500 19l2.800-3.900', 'm3.500 9.500 4.200.6')], hotel: ['#7d7aff', P24('M3 19V6', 'M3 15h18v4', 'M21 15v-3a3 3 0 0 0-3-3h-7v6', '<circle cx="7" cy="11" r="2"/>')] });
// Each place's app icon: one bold flat colour and one bold mark in a colour that bites against it
const APP_TILE = { home: ['#ff6a00', '#141414'], furniture: ['#e8173f', '#ffffff'], grocery: ['#1aa7ff', '#ffffff'], chat: ['#19c940', '#4dffc3'], school: ['#6a2bd9', '#ffffff'], work: ['#0a0a0a', '#ff5a1f'], park: ['#8ff0a4', '#141414'], fun: ['#ffd000', '#1d3b2a'],
  gym: ['#ff3b3b', '#ffffff'], hospital: ['#e8173f', '#ffffff'], bank: ['#1650f0', '#eaf0ff'], food: ['#ff6a00', '#ffe94d'], cinema: ['#0a0a0a', '#ffffff'], salon: ['#a78bf0', '#3b1d6e'], bus: ['#2468e8', '#4fd2ff'], swim: ['#1aa7ff', '#ffffff'],
  library: ['#16332a', '#b6f07a'], beach: ['#ffd000', '#1d3b2a'], sports: ['#19c940', '#ffffff'], hotel: ['#7445f5', '#1b0f4a'] };
// A finished app icon, drawn the way phone icons are: a smooth-cornered tile filled with a top-to-bottom gradient, a soft
// bloom of light behind the symbol, the symbol itself in white with a faint tint and its own shadow, and a hairline of light
// along the top edge. [top colour, bottom colour, symbol colour or 'w' for white]
const APP_ICON = { home: ['#5fb6ff', '#1466f0'], furniture: ['#57dcd3', '#0f9aa6'], grocery: ['#ffbe55', '#ff7a00'], chat: ['#7df088', '#12b63c'], school: ['#9a97ff', '#4a45d8'], work: ['#7a8394', '#2a2f3a'], park: ['#86e792', '#1fa046'],
  fun: ['#ff8ab6', '#ee2c68'], gym: ['#ff8a78', '#de2f27'], hospital: ['#ffffff', '#e9ecf2', '#f0343c'], bank: ['#5b7fc8', '#1a2c66'], food: ['#ffd968', '#ff961c'], cinema: ['#cb96ff', '#7630de'], salon: ['#ff93e2', '#d23ab4'],
  bus: ['#86d9ff', '#2795e6'], swim: ['#77ebf2', '#0fa3c2'], library: ['#dcb087', '#96602f'], beach: ['#ffe680', '#ffac00'], sports: ['#66d690', '#147a3b'], hotel: ['#a3afff', '#525de4'] };
function appIcon(id) {
  const [c0, c1, mark] = APP_ICON[id] || APP_ICON.home, u = 'ai-' + id, red = !!mark, sq = 'M60 0C16.800 0 0 16.800 0 60s16.800 60 60 60 60-16.800 60-60S103.200 0 60 0z';
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
    <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
    <radialGradient id="${u}g" cx="50%" cy="42%" r="46%"><stop offset="0" stop-color="#fff" stop-opacity="${red ? 0 : 0.34}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${red ? '#ff5a5f' : '#ffffff'}"/><stop offset="1" stop-color="${red ? mark : '#e4ecff'}"/></linearGradient>
    <linearGradient id="${u}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    <filter id="${u}s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3.500" stdDeviation="3.200" flood-color="${red ? '#7a0c12' : c1}" flood-opacity="${red ? 0.25 : 0.75}"/><feDropShadow dx="0" dy="1" stdDeviation=".8" flood-color="#000" flood-opacity=".18"/></filter>
    <clipPath id="${u}c"><path d="${sq}"/></clipPath></defs>
    <g clip-path="url(#${u}c)"><rect width="120" height="120" fill="url(#${u}b)"/><rect width="120" height="120" fill="url(#${u}g)"/>
      <g transform="translate(24 24) scale(.28125)" fill="url(#${u}m)" filter="url(#${u}s)">${GLYPHS[id] || ''}</g></g>
    <path d="${sq}" fill="none" stroke="url(#${u}e)" stroke-width="1.600" transform="translate(.8 .8) scale(.9867)"/></svg>`;
}
const MENU_GRADS = ['linear-gradient(140deg,#c58cf0,#6f8dfb)', 'linear-gradient(140deg,#58c8e8,#6a63e8)', 'linear-gradient(140deg,#4f8ef7,#2f55d4)', 'linear-gradient(140deg,#62d6b4,#3f8fd8)', 'linear-gradient(140deg,#8f9bff,#5b4fd6)']; // five related tones, no reds or oranges
// The menu is a wall of app icons bent gently round you, five across; drag it up and down (or roll the wheel) to see more rows.
const ring = { at: 0, cols: 5, rowH: 196, drag: null, moved: 0, v: 0, t: 0, ly: 0, snap: 0 };
function setRing() {
  const all = $('placelist').children; const W = window.innerWidth, r = W < 760 ? 520 : 900; // the bend radius, as in the CSS --r
  // Fill the screen: 4 across on a phone, 5 on anything wider, spaced out to the width but never wider than the icons look good at.
  ring.cols = W < 520 ? 4 : 5; const gap = Math.min((W - 28) * (W < 520 ? 0.95 : 0.8) / ring.cols, W < 520 ? 92 : W < 760 ? 124 : 160); // the bend makes the outer icons come forward, so leave room for that
  ring.rowH = W < 520 ? 100 : W < 760 ? 124 : 140; // (a row is an icon and its name)
  const rows = Math.ceil(all.length / ring.cols); ring.max = Math.max(0, rows - 2); if (!ring.free) ring.at = clamp(ring.at, 0, ring.max); const step = Math.asin(Math.min(0.9, gap / r)) * 180 / Math.PI;
  for (let i = 0; i < all.length; i++) { const col = i % ring.cols, pos = Math.floor(i / ring.cols) - ring.at, b = all[i], op = pos < 0 ? 1 + pos * 1.7 : pos > 1.15 ? 1 - (pos - 1.15) * 0.85 : 1;
    b.style.setProperty('--a', (-(col - (ring.cols - 1) / 2) * step).toFixed(2) + 'deg'); b.style.setProperty('--y', (pos * ring.rowH).toFixed(1) + 'px');
    b.style.opacity = clamp(op, 0, 1).toFixed(2); b.style.pointerEvents = op < 0.25 ? 'none' : ''; b.tabIndex = op < 0.25 ? -1 : 0; }
}
function nearestPerson() { let best = null; for (const p of people) { p.obj.getWorldPosition(_v); const far = (_v.x - hero.x) ** 2 + (_v.z - hero.z) ** 2; if (far < 18 * 18 && (!best || far < best.far)) best = { p, far }; } return best && best.p; }
function openPlaces() {
  if (ui.busy) return; ui.busy = true;
  $('placelist').replaceChildren(...PLACES.map((p) => { const at = p.at(), who = p.chat && nearestPerson(), b = document.createElement('button'); b.type = 'button'; b.disabled = !at;
    const ic = document.createElement('span'), app = APP[p.id] || APP.home, cc = new THREE.Color(app[0]), rgb = `${Math.round(cc.r * 255)},${Math.round(cc.g * 255)},${Math.round(cc.b * 255)}`; ic.className = 'ic'; ic.style.setProperty('--c', rgb); ic.style.setProperty('--g', MENU_GRADS[PLACES.indexOf(p) % MENU_GRADS.length]); ic.innerHTML = ART_ICONS[p.id] || FLAT_ICONS[p.id] || appIcon(p.id);
    const icw = document.createElement('span'); icw.className = 'icw'; icw.append(ic); // (the wrapper carries the shadow, since the icon itself is cut to shape)
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = p.name;
    b.append(icw, nm); // just the icon and its name
    b.addEventListener('click', () => { if (ring.moved > 8) return; closePlaces(); if (p.errand) { openErrand(); return; } if (p.id === 'hospital' && game.hurt) { treat(); return; } if (p.chat) { if (who) chatWith(who); else note('No one is near enough to chat with.'); return; } ui.dest = p.id === 'home' ? null : { name: p.name, x: at[0], z: at[1] }; }); return b; }));
  ring.at = 0; ring.v = 0; ring.free = false; $('places').classList.remove('dragging'); setRing(); $('places').hidden = false;
}
function closePlaces() { $('places').hidden = true; ui.busy = false; }
// Scrolling the menu is fluid: the rows stay under your finger, a flick carries on and eases to a stop on a row,
// and pulling past the first or last row stretches a little and springs back - all worked out frame by frame.
{ const el = $('places');
  const rubber = (x) => { const lo = 0, hi = ring.max || 0; if (x < lo) return lo - (1 - 1 / (1 + (lo - x) * 0.55)) / 0.55; if (x > hi) return hi + (1 - 1 / (1 + (x - hi) * 0.55)) / 0.55; return x; };
  let raf = 0, target = 0, last = 0;
  const run = (now) => { // a spring pulls the rows to their resting row; it starts with the speed of your flick
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
    const k = 120, damp = 2 * Math.sqrt(k) * 0.92; ring.v += (k * (target - ring.at) - damp * ring.v) * dt; ring.at += ring.v * dt; setRing();
    if (Math.abs(target - ring.at) < 0.002 && Math.abs(ring.v) < 0.01) { ring.at = target; ring.free = false; el.classList.remove('dragging'); setRing(); raf = 0; return; }
    raf = requestAnimationFrame(run); };
  const glide = (to) => { target = clamp(Math.round(to), 0, ring.max || 0); ring.free = true; el.classList.add('dragging'); if (!raf) { last = performance.now(); raf = requestAnimationFrame(run); } };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  $('menubtn').addEventListener('click', () => (el.hidden ? openPlaces() : closePlaces()));
  $('placex').addEventListener('click', (e) => { e.stopPropagation(); closePlaces(); });
  el.addEventListener('wheel', (e) => { e.preventDefault(); stop(); ring.free = true; el.classList.add('dragging'); ring.at = rubber(ring.at + e.deltaY * 0.0045); ring.v = 0; setRing(); clearTimeout(ring.snap); ring.snap = setTimeout(() => glide(ring.at), 120); }, { passive: false });
  el.addEventListener('pointerdown', (e) => { stop(); ring.drag = { y: e.clientY, at: ring.at, raw: ring.at }; ring.moved = 0; ring.v = 0; ring.samples = [[performance.now(), e.clientY]]; });
  el.addEventListener('pointermove', (e) => { if (!ring.drag) return; const dy = e.clientY - ring.drag.y; ring.moved = Math.max(ring.moved, Math.abs(dy), Math.abs(e.movementX || 0));
    const now = performance.now(); ring.samples.push([now, e.clientY]); while (ring.samples.length > 2 && now - ring.samples[0][0] > 90) ring.samples.shift(); // the last tenth of a second gives the flick its speed
    if (ring.moved > 6) { ring.free = true; el.classList.add('dragging'); ring.at = rubber(ring.drag.raw - dy / ring.rowH); setRing(); } });
  const drop = (e) => { if (!ring.drag) return; ring.drag = null;
    if (ring.moved > 6) { const s = ring.samples, a = s[0], z = s[s.length - 1], dt = Math.max(16, z[0] - a[0]) / 1000; ring.v = performance.now() - z[0] > 80 ? 0 : clamp(-(z[1] - a[1]) / ring.rowH / dt, -14, 14);
      glide(ring.at + ring.v * 0.28); } // where the flick would carry it, to the nearest row
    else { el.classList.remove('dragging'); ring.free = false; if (e.target === el) closePlaces(); } }; // a tap on the empty background closes the menu
  el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', () => { if (ring.drag) { ring.drag = null; glide(ring.at); } });
  ring.glide = glide;
  window.addEventListener('resize', () => { if (!el.hidden) setRing(); });
  window.addEventListener('keydown', (e) => { if (el.hidden) return; if (e.code === 'Escape') closePlaces(); else if (e.code === 'ArrowDown') ring.glide(Math.round(ring.at) + 1); else if (e.code === 'ArrowUp') ring.glide(Math.round(ring.at) - 1); });
}
// Life follows the time of day on the player's own clock: full at 6 in the morning, running down to about 15% by 9 at night.
// Eating at home tops it up. Add #hour=13.5 to the address to try a time of day.
const HEART = 'M12 21s-8-4.900-8-11A4.600 4.600 0 0 1 12 7.300 4.600 4.600 0 0 1 20 10c0 6.100-8 11-8 11z';
const PER_HOUR = 85 / 15;
function hourNow() { const f = /hour=([\d.]+)/.exec(location.hash), n = new Date(); return f ? +f[1] : n.getHours() + n.getMinutes() / 60; }
function dayKey() { const n = new Date(); if (hourNow() < 4) n.setDate(n.getDate() - 1); return n.toDateString(); } // the day runs until 4 am
const lifeEl = $('life'); let lifeShown = -1, lifeT = 1;
function showLife(dt) {
  if ((lifeT += dt) < 1) return; lifeT = 0; // once a second is plenty for a clock
  $('hurt').hidden = !game.hurt;
  const now = Date.now(), day = dayKey(), h = hourNow();
  if (game.day !== day) { game.day = day; game.life = 100 - (h < 4 ? h + 18 : Math.max(0, h - 6)) * PER_HOUR; game.lifeAt = now; } // a new day: where the clock says you would be
  if (typeof game.life !== 'number') game.life = 100;
  game.life = clamp(game.life - Math.min(24, Math.max(0, now - (game.lifeAt || now)) / 3.6e6) * PER_HOUR, 5, 100); game.lifeAt = now; // also counts the hours the game was closed
  const v = Math.round(game.life); if (v === lifeShown) return; lifeShown = v; save();
  { const H = $('hearts'); if (!H.children.length) H.innerHTML = Array.from({ length: 5 }, () => `<i><svg class="e" viewBox="0 0 24 24"><path d="${HEART}"/></svg><b><svg viewBox="0 0 24 24"><path d="${HEART}"/></svg></b></i>`).join('');
    [...H.children].forEach((c, i) => { c.lastChild.style.width = (clamp(v / 20 - i, 0, 1) * 100).toFixed(1) + '%'; }); } // each heart is a fifth of your life, filling from the left like a battery cell
  $('lifetxt').textContent = v + '%'; lifeEl.classList.toggle('mid', v <= 55 && v > 30); lifeEl.classList.toggle('low', v <= 30); $('hungry').hidden = v > 30;
  lifeEl.setAttribute('aria-label', 'Life ' + v + ' percent' + (v <= 30 ? '. You are hungry.' : ''));
}
// Errands: the way to earn. A card offers one (pick up here, deliver there, this pay, this long); you tap Start, the game counts
// 3-2-1 and the clock runs. Walk up to the parcel and you bend and pick it up by yourself; carry it to the address and you put
// it down at the gate and are paid. Late, and the customer cancels: you pay for it. Errands come in levels: each level is a
// run of errands, and the next level pays more over longer trips with less time to spare.
const job = { pick: 0, lookUp: 0, state: 'idle', offer: null, t: 0, total: 0, bend: 0, bendFor: '', count: 0, nextAt: 0, auto: false };
const levelOf = (L) => ({ n: 2 + L, mult: 1 + 0.5 * (L - 1), near: [75, 135 + 10 * L], far: [110 + 20 * L, 200 + 30 * L], slack: Math.max(1.12, 1.5 - 0.08 * L) });
const tripLen = (ax, az, bx, bz) => Math.abs(ax - bx) + Math.abs(az - bz); // along the streets, near enough
const clockText = (t) => Math.floor(Math.max(0, t) / 60) + ':' + String(Math.floor(Math.max(0, t) % 60)).padStart(2, '0');
const addrText = (a) => 'No. ' + a.num + ', ' + a.street;
function makeOffer() { // an errand that fits where you are standing: a pickup not far off, and a delivery a good walk from there
  game.job = game.job || { level: 1, done: 0 }; const L = levelOf(game.job.level), all = [...ADDR.values()], r = Math.random;
  const band = (list, x, z, [lo, hi]) => list.filter((a) => { const d = tripLen(a.x, a.z, x, z); return d >= lo && d <= hi; });
  let from = band(all, hero.x, hero.z, L.near); if (!from.length) from = band(all, hero.x, hero.z, [45, 220]); if (!from.length) from = band(all, hero.x, hero.z, [15, 400]); if (!from.length) return null;
  const a = from[Math.floor(r() * from.length)];
  let to = band(all, a.x, a.z, L.far).filter((b) => b !== a); if (!to.length) to = band(all, a.x, a.z, [60, 320]).filter((b) => b !== a); if (!to.length) to = band(all, a.x, a.z, [20, 500]).filter((b) => b !== a); if (!to.length) return null;
  const b = to[Math.floor(r() * to.length)], d1 = tripLen(hero.x, hero.z, a.x, a.z), d2 = tripLen(a.x, a.z, b.x, b.z);
  const nook = a.nook ? a.nook[r() < 0.5 ? 0 : 1] : [a.px, a.pz]; // the parcel waits tucked in a corner by the wall: you have to look for it
  return { from: { ...a, px: nook[0], pz: nook[1] }, to: b, d1, d2, pay: Math.round((2500 + d2 * 22 + d1 * 8) * L.mult / 100) * 100, time: Math.round(((d1 + d2) / 2.9 * L.slack + 18) / 5) * 5 };
}
const errandEl = $('errand'), bendEl = $('erbend'), numText = (a) => 'No. ' + a.num;
/* ---------------- things you ride ---------------- */
// rideModel(id) gives a new copy of the bicycle, the scooter or your car: in metres, wheels on y = 0, nose to +z. One template of
// each is made the first time it is asked for; every copy shares its shapes and paints, so a copy costs next to nothing.
// Named parts for the riding to come: wheelF, wheelR, seat, grips, and basket (bicycle) or box (scooter). The car has its 'wheel's.
const RIDE_TPL = {}, RIDE_PIC = {}, RIDE_SRC = {}, RIDE_CAR_PAINT = '#b6f02c';
const rideMat = (color, rough = 0.6, metal = 0) => (HQ ? new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal }) : new THREE.MeshLambertMaterial({ color }));
const rideSpot = (name, x, y, z) => { const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); return o; };
function buildBicycle() { // made here, part by part: frame, two spoked wheels, saddle, handlebars, pedals and a basket on the front
  const g = new THREE.Group(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), P = (y, z, x = 0) => new THREE.Vector3(x, y, z); g.name = 'bicycle';
  const tube = (a, b, r, seg = 8) => { const d = b.clone().sub(a), geo = new THREE.CylinderGeometry(r, r, d.length(), seg, 1); geo.applyQuaternion(q.setFromUnitVectors(up, d.clone().normalize())); return geo.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); };
  const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const mesh = (geos, mat, name) => { const m = new THREE.Mesh(mergeGeometries(geos), mat); geos.forEach((x) => x.dispose()); m.castShadow = HQ; if (name) m.name = name; return m; };
  const paint = rideMat('#e8492e', 0.42, 0.1), steel = rideMat('#c6cace', 0.35, 0.6), black = rideMat('#1b1d21', 0.85), wicker = rideMat('#c99b5c', 0.9);
  const R = 0.34, AR = P(R, -0.52), AF = P(R, 0.54), BB = P(0.29, -0.06), ST = P(0.8, -0.21), HT = P(0.87, 0.365), HB = P(0.7, 0.41), SM = P(1.02, 0.325), side = (v, x) => v.clone().setX(x);
  g.add(mesh([tube(BB, ST, 0.019), tube(ST, HT, 0.017), tube(BB, HB, 0.021), tube(HB, HT, 0.025), box(0.13, 0.03, 0.05, 0, HB.y - 0.01, HB.z + 0.005),
    ...[-1, 1].flatMap((s) => [tube(side(AR, s * 0.06), side(BB, s * 0.03), 0.011, 6), tube(side(AR, s * 0.06), side(ST, s * 0.02), 0.009, 6), tube(side(HB, s * 0.055), side(AF, s * 0.06), 0.012, 6)])], paint));
  const ped = [1, -1].map((s) => P(BB.y - s * 0.085, BB.z + s * 0.14, s * 0.1)); // the two pedals, one forward and down, one back and up
  g.add(mesh([tube(ST, P(0.915, -0.243), 0.012), tube(HT, SM, 0.013), tube(P(SM.y, SM.z, -0.11), P(SM.y, SM.z, 0.11), 0.012), ...[-1, 1].map((s) => tube(P(SM.y, SM.z, s * 0.11), P(SM.y + 0.02, SM.z - 0.085, s * 0.25), 0.012)),
    tube(side(BB, -0.1), side(BB, 0.1), 0.013), ...ped.map((p, i) => tube(side(BB, p.x), p, 0.011, 6)), new THREE.CylinderGeometry(0.085, 0.085, 0.006, 18).rotateZ(Math.PI / 2).translate(0.045, BB.y, BB.z),
    ...[-1, 1].map((s) => tube(P(SM.y, SM.z, s * 0.09), P(SM.y - 0.03, SM.z + 0.16, s * 0.09), 0.006, 5))], steel)); // (the last two: the arms the basket hangs on)
  g.add(mesh([new THREE.SphereGeometry(1, 12, 7).scale(0.078, 0.028, 0.135).translate(0, 0.935, -0.25), ...[-1, 1].map((s) => tube(P(SM.y + 0.02, SM.z - 0.085, s * 0.25), P(SM.y + 0.024, SM.z - 0.14, s * 0.3), 0.017)),
    ...ped.map((p) => box(0.09, 0.022, 0.065, p.x + Math.sign(p.x) * 0.045, p.y, p.z))], black));
  { const w = 0.36, h = 0.2, d = 0.25, t = 0.014, b = new THREE.Group(); b.name = 'basket'; b.position.set(0, SM.y - 0.2, SM.z + 0.14 + d / 2); b.userData = { w, h, d }; // the basket: 'basket' sits at the middle of its floor
    b.add(mesh([box(w, t, d, 0, t / 2, 0), box(w, h, t, 0, h / 2, d / 2 - t / 2), box(w, h, t, 0, h / 2, -d / 2 + t / 2), box(t, h, d, w / 2 - t / 2, h / 2, 0), box(t, h, d, -w / 2 + t / 2, h / 2, 0),
      box(w + 0.02, 0.024, 0.024, 0, h, d / 2 - t / 2), box(w + 0.02, 0.024, 0.024, 0, h, -d / 2 + t / 2), box(0.024, 0.024, d, w / 2 - t / 2, h, 0), box(0.024, 0.024, d, -w / 2 + t / 2, h, 0)], wicker)); g.add(b); }
  const tyre = new THREE.TorusGeometry(R - 0.021, 0.021, 8, 28).rotateY(Math.PI / 2), rim = [new THREE.TorusGeometry(R - 0.05, 0.011, 6, 24).rotateY(Math.PI / 2), new THREE.CylinderGeometry(0.024, 0.024, 0.11, 8).rotateZ(Math.PI / 2)];
  for (let i = 0; i < 8; i++) rim.push(new THREE.CylinderGeometry(0.0045, 0.0045, 2 * (R - 0.05), 3, 1, true).rotateX(i * Math.PI / 8 + 0.1));
  const wt = mesh([tyre], black), wr = mesh(rim, steel);
  for (const [name, at] of [['wheelR', AR], ['wheelF', AF]]) { const w = new THREE.Group(); w.name = name; w.position.copy(at); w.userData = { rad: R }; w.add(name === 'wheelR' ? wt : wt.clone(), name === 'wheelR' ? wr : wr.clone()); g.add(w); }
  const grips = rideSpot('grips', 0, SM.y + 0.022, SM.z - 0.11); grips.userData = { half: 0.275 }; g.add(rideSpot('seat', 0, 0.963, -0.25), grips);
  return g;
}
function buildScooter() { // the "Vino" scooter (models/CREDITS.txt), slimmed by tools/slim_scooter.py: body + two wheels, and a delivery box on the back
  const src = RIDE_SRC.scooter; if (!src) return null; const g = new THREE.Group(), mats = new Map(); g.name = 'scooter';
  const light = (m) => { if (!mats.has(m)) { const glass = /^Glass/.test(m.name); mats.set(m, HQ ? Object.assign(m, { envMapIntensity: 0.25 }) : new THREE.MeshLambertMaterial({ map: m.map, name: m.name, transparent: glass, opacity: glass ? 0.4 : 1, side: m.side })); if (HQ && m.name === 'Main_Body') shiny(m); } return mats.get(m); };
  for (const c of [...src.children]) { c.traverse((o) => { if (o.isMesh) { o.material = light(o.material); o.castShadow = HQ; } }); if (/^wheel/.test(c.name)) c.userData = { rad: c.position.y }; g.add(c); }
  const box = new THREE.Group(), W = 0.34, H = 0.3, D = 0.32; box.name = 'box'; box.position.set(0, 0.65, -0.65); box.userData = { w: W, h: H, d: D }; // 'box' sits at the middle of the delivery box's floor
  const shell = new THREE.Mesh(new THREE.BoxGeometry(W, H, D).translate(0, H / 2, 0), rideMat('#22262c', 0.6)), lid = new THREE.Mesh(new THREE.BoxGeometry(W + 0.016, 0.045, D + 0.016).translate(0, H + 0.008, 0), rideMat('#b6f02c', 0.5)),
    rack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.36).translate(0, -0.025, 0.04), rideMat('#2b2f35', 0.5, 0.4));
  for (const m of [shell, lid, rack]) m.castShadow = HQ; box.add(shell, lid, rack); g.add(box);
  const grips = rideSpot('grips', 0, 0.97, 0.3); grips.userData = { half: 0.28 }; g.add(rideSpot('seat', 0, 0.74, -0.2), grips);
  return g;
}
function buildCar() { // your own car: the smallest of the cars in the traffic, in a paint nobody else has
  if (!carKinds.length) return null; const kind = carKinds.reduce((a, b) => (b.half < a.half ? b : a)), g = kind.tpl.clone(true); g.name = 'car'; g.userData = { half: kind.half, halfW: kind.halfW, rad: kind.rad, kind: kind.name };
  let paint = null; g.traverse((o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = HQ;
    if (/^body/i.test(o.material.name)) { if (!paint) { paint = Object.assign(o.material.clone(), { color: new THREE.Color(RIDE_CAR_PAINT), name: o.material.name }); if (HQ) shiny(paint); } o.material = paint; } });
  return g;
}
const RIDE_BUILD = { bicycle: buildBicycle, scooter: buildScooter, car: buildCar };
function rideModel(id) { const t = RIDE_TPL[id] || (RIDE_BUILD[id] && (RIDE_TPL[id] = RIDE_BUILD[id]())); return t ? t.clone(true) : null; }
function rideTris(o) { let n = 0; o.traverse((m) => { if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); return Math.round(n); }
new GLTFLoader().parse(rideScooterGlb.buffer.slice(rideScooterGlb.byteOffset, rideScooterGlb.byteOffset + rideScooterGlb.byteLength), '', (gltf) => { RIDE_SRC.scooter = gltf.scene; }, (e) => console.error('scooter failed to load', e));
// The pictures on the travel card: each thing drawn once from its real model, by the game's own renderer into one small hidden
// picture that is thrown away afterwards. (The scooter keeps the picture made from the full-detail model, RIDE_ART.scooter.)
function makeRideArt() {
  const ids = logic.rideIds(CONFIG).filter((id) => id !== 'walk' && !RIDE_PIC[id] && !RIDE_ART[id] && (id !== 'car' || carKinds.length)); if (!ids.length) return;
  const W = 520, H = 400, keep = renderer.getRenderTarget(), col = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha(); let rt = null;
  try {
    rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(18, W / H, 0.1, 80), buf = new Uint8Array(W * H * 4), bx = new THREE.Box3(), ball = new THREE.Sphere();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x9a8a7a, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2.4); d.position.set(2, 3, 2.5); sc.add(d);
    const enc = new Uint8Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; enc[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); } // the renderer hands back linear light: this is the screen's curve
    for (const id of ids) {
      const m = rideModel(id); if (!m) continue; sc.add(m); bx.setFromObject(m).getBoundingSphere(ball);
      cam.position.set(0.66, 0.3, 0.69).normalize().multiplyScalar(ball.radius / Math.sin(cam.fov * Math.PI / 360) * 1.02).add(ball.center); cam.lookAt(ball.center);
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam); renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf); sc.remove(m);
      let x0 = W, x1 = -1, y0 = H, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < x0) continue; const w = x1 - x0 + 1, h = y1 - y0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g2 = cv.getContext('2d'), im = g2.createImageData(w, h), px = im.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((y1 - y) * W + x0 + x) * 4, t = (y * w + x) * 4, a = buf[s + 3]; // (the hidden picture is upside down, and its colours are already multiplied by how solid they are)
        if (a) { const k = 255 / a; px[t] = enc[Math.min(255, Math.round(buf[s] * k))]; px[t + 1] = enc[Math.min(255, Math.round(buf[s + 1] * k))]; px[t + 2] = enc[Math.min(255, Math.round(buf[s + 2] * k))]; px[t + 3] = a; } }
      g2.putImageData(im, 0, 0); RIDE_PIC[id] = cv.toDataURL('image/png');
    }
  } catch (e) { console.error('ride pictures failed', e); }
  renderer.setRenderTarget(keep); renderer.setClearColor(col, alpha); if (rt) rt.dispose();
}
const RIDES = logic.rideIds(CONFIG), rideOpt = (id) => logic.rideOption(game, id, CONFIG, CUR.sym), ridePic = (id) => RIDE_PIC[id] || RIDE_ART[id] || '';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ER_ICON = { // small line drawings on the card
  box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7.200v9.600L12 21l-8-4.200V7.200z M4 7.200l8 4.200 8-4.200 M12 11.400V21 M8 5.100l8 4.200" fill="none" stroke="#141a22" stroke-width="1.900" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.500-5.600-6.500-10.700a6.500 6.500 0 0 1 13 0C18.500 15.400 12 21 12 21z" fill="none" stroke="#141a22" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="10.300" r="2.300" fill="#141a22"/></svg>',
  coins: '<svg viewBox="0 0 28 24" aria-hidden="true"><g fill="none" stroke="#141a22" stroke-width="1.800" stroke-linejoin="round"><ellipse cx="17.500" cy="6.500" rx="7" ry="3"/><path d="M10.500 6.500v3.200c0 1.700 3.100 3 7 3s7-1.300 7-3V6.500 M10.500 9.700"/><ellipse cx="10.500" cy="14" rx="7" ry="3"/><path d="M3.500 14v3.400c0 1.700 3.100 3 7 3s7-1.300 7-3V14"/></g></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#141a22" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13.500" r="7.500"/><path d="M12 9.500v4.200l2.600 1.600 M9.500 2.800h5 M12 2.800V6"/></g></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#17230a"/><path d="m7 12.400 3.300 3.300L17 9" fill="none" stroke="#b6f02c" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#17230a"/><path d="M9 11.500V9.800a3 3 0 0 1 6 0v1.700" fill="none" stroke="#fff" stroke-width="1.800" stroke-linecap="round"/><rect x="7.800" y="11.300" width="8.400" height="6" rx="1.700" fill="#fff"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.200v13.600L19.200 12z" fill="#17230a" stroke="#17230a" stroke-width="4.400" stroke-linejoin="round"/></svg>' };
const CHEV = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.500 3 5.500 8l5 5" fill="none" stroke="#141a22" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const WF = { n: 24, w: 320, h: 520, cols: 6 }, WALK_SHEET = {}; let walkRaf = 0;
function walkSheet(id) { // your character walking on the spot, drawn once from the real model as a sheet of frames
  if (WALK_SHEET[id]) return WALK_SHEET[id]; const H = HEROES[id]; if (!H) return null;
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(WF.w, WF.h, false); r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x9a8a7a, 2.4)); const d = new THREE.DirectionalLight(0xffffff, 2.0); d.position.set(1, 2, 2); sc.add(d);
    const look = H.k.makeLook(H.look), m = SkeletonUtils.clone(H.k.root); m.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.frustumCulled = false; } });
    m.scale.multiplyScalar(H.k.scale); sc.add(m); m.updateMatrixWorld(true); let top = -Infinity; m.traverse((o) => { if (o.isBone) top = Math.max(top, _v.setFromMatrixPosition(o.matrixWorld).y); });
    const mx = new THREE.AnimationMixer(m), dur = H.k.walk.duration; mx.clipAction(H.k.walk).play(); m.position.y += H.k.liftWalk || 0; m.rotation.y = 0.5;
    const cam = new THREE.PerspectiveCamera(24, WF.w / WF.h, 0.1, 20); cam.position.set(0, top * 0.56, top * 2.62); cam.lookAt(0, top * 0.53, 0);
    const cv = document.createElement('canvas'); cv.width = WF.w * WF.cols; cv.height = WF.h * Math.ceil(WF.n / WF.cols); const g = cv.getContext('2d');
    for (let i = 0; i < WF.n; i++) { mx.setTime(dur * i / WF.n); m.updateMatrixWorld(true); r.render(sc, cam); g.drawImage(r.domElement, (i % WF.cols) * WF.w, Math.floor(i / WF.cols) * WF.h); }
    mx.stopAllAction(); mx.uncacheRoot(m); r.dispose(); r.forceContextLoss();
    return WALK_SHEET[id] = { cv, dur };
  } catch (e) { return null; }
}
function walkPlay() { // the character on the card keeps walking while the card is up
  cancelAnimationFrame(walkRaf); const cv = bendEl.querySelector('canvas.me'); if (!cv) return; const S = walkSheet(hero.who);
  cv.width = WF.w; cv.height = WF.h; const g = cv.getContext('2d'), t0 = performance.now(); let last = -1;
  if (!S) { const im = new Image(); im.onload = () => { const k = Math.min(WF.w / im.width, WF.h / im.height) * 1.5, w = im.width * k, h = im.height * k; g.drawImage(im, (WF.w - w) / 2, WF.h - h * 0.93, w, h); }; im.src = HERO_BODY[hero.who] || ''; return; } // (no walking frames could be drawn: a still picture stands in)
  const tick = () => { if (!cv.isConnected || job.state !== 'offer') return; const f = Math.floor((performance.now() - t0) / 1000 / (S.dur * 1.5) * WF.n) % WF.n; // (an easy stroll: half as slow again as the real walk)
    if (f !== last) { last = f; g.clearRect(0, 0, WF.w, WF.h); g.drawImage(S.cv, (f % WF.cols) * WF.w, Math.floor(f / WF.cols) * WF.h, WF.w, WF.h, 0, 0, WF.w, WF.h); }
    walkRaf = requestAnimationFrame(tick); }; tick();
}
function pickFoot(id) { // under the tiles: one short line (Owned / what you still need / the question before buying) and the one button
  const o = rideOpt(id), ask = job.ask === id && o.act === 'buy', line = ask ? o.confirm : o.need || o.tag;
  const btn = ask ? `<div class="two"><button class="no" type="button" data-act="no">Not now</button><button class="start" type="button" data-act="buy"><span>Buy</span></button></div>`
    : o.act === 'start' ? `<button class="start" type="button" data-act="start">${ER_ICON.play}<span>Start</span></button>`
    : o.act === 'buy' ? `<button class="price" type="button" data-act="ask" aria-label="Buy for ${esc(o.price)}"><i class="c"></i><span>${esc(o.price)}</span></button>`
    : `<button class="price off" type="button" data-act="locked" aria-disabled="true"><i class="c"></i><span>${esc(o.price)}</span>${ER_ICON.lock}</button>`;
  return `<p class="nt${ask ? ' ask' : o.act === 'short' ? ' need' : ''}">${o.tag && !ask ? ER_ICON.check : ''}<span>${esc(line)}</span></p>${btn}`;
}
function errandCard() { // the four ways to travel side by side on one glossy card; the one you chose stands in the middle
  const at = job.pick, id = RIDES[at], last = RIDES.length - 1, opts = RIDES.map(rideOpt);
  return `<div class="pick"><div class="hd"><h2>How do you want to run your errand?</h2><button class="x" type="button" data-act="skip" aria-label="Not now"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.500 3.500l9 9M12.500 3.500l-9 9" fill="none" stroke="#141a22" stroke-width="2.400" stroke-linecap="round"/></svg></button></div>
    <div class="rail"><div class="trk" style="--at:${at}">${opts.map((o, i) => `<span class="it${i === at ? ' on' : ''}${o.act === 'short' ? ' short' : ''}">${o.id === 'walk' ? '<canvas class="me"></canvas>' : `<img class="v ${o.id}" src="${ridePic(o.id)}" alt="">`}</span>`).join('')}</div>
      <button class="nav l" type="button" data-act="step" data-d="-1" aria-label="Back"${at ? '' : ' disabled'}>${CHEV}</button><button class="nav r" type="button" data-act="step" data-d="1" aria-label="Next"${at < last ? '' : ' disabled'}>${CHEV}</button></div>
    <h3 id="pkname">${esc(opts[at].name)}</h3>
    <div class="opts">${opts.map((o, i) => `<button type="button" class="op${i === at ? ' on' : ''}${o.owned ? '' : ' lock'}${o.act === 'short' ? ' short' : ''}" data-act="mode" data-i="${i}" aria-label="${esc(o.name + (o.tag ? ', owned' : o.need ? ', ' + o.need : o.price ? ', ' + o.price : ''))}" aria-pressed="${i === at}"><img class="${o.id === 'walk' ? 'me' : o.id}" src="${o.id === 'walk' ? HERO_BUST[hero.who] || HERO_FACE[hero.who] || '' : ridePic(o.id)}" alt="">${o.owned ? (o.tag ? `<span class="lk">${ER_ICON.check}</span>` : '') : `<span class="lk">${ER_ICON.lock}</span>`}</button>`).join('')}</div>
    <div id="pkcta">${pickFoot(id)}</div></div>`;
}
function pickStep(d) { // slide to the next one: nothing is rebuilt, so it glides
  const n = clamp(job.pick + d, 0, RIDES.length - 1); if (n === job.pick) return; job.pick = n; job.ask = null; const id = RIDES[n];
  const trk = bendEl.querySelector('.trk'); if (!trk) { bendEl.innerHTML = errandCard(); walkPlay(); return; }
  trk.style.setProperty('--at', n); [...trk.children].forEach((c, i) => c.classList.toggle('on', i === n));
  [...bendEl.querySelectorAll('.op')].forEach((c, i) => { c.classList.toggle('on', i === n); c.setAttribute('aria-pressed', String(i === n)); });
  bendEl.querySelector('.nav.l').disabled = n === 0; bendEl.querySelector('.nav.r').disabled = n === RIDES.length - 1;
  const h = $('pkname'); h.textContent = CONFIG.transport[id].name; h.classList.remove('sw'); void h.offsetWidth; h.classList.add('sw'); $('pkcta').innerHTML = pickFoot(id);
  chime([740], 'triangle', 0.04, 0.05, 0.03);
}
function pickAsk(id) { // the price was tapped: ask before any money moves
  if (rideOpt(id).act !== 'buy') return; job.ask = id; job.askAt = performance.now(); $('pkcta').innerHTML = pickFoot(id); chime([660, 880], 'triangle', 0.05, 0.08, 0.04);
}
function pickBuy(id) { // "Buy" was tapped: pay once, and it is yours for good
  if (job.ask !== id || performance.now() - job.askAt < 350) return; /* (the second half of a double tap on the price is not a yes) */
  job.ask = null; const was = game.money, took = logic.buyRide(game, id, CONFIG);
  if (took.ok) { game.money = took.money; game.rides = took.rides; save(); moneyCount(was - (ui.hold || 0)); gain(-(was - took.money), CONFIG.transport[id].name); chime([784, 1047, 1319, 1568], 'triangle', 0.07, 0.16, 0.07); }
  else chime([300, 240], 'triangle', 0.08, 0.1, 0.05);
  bendEl.innerHTML = errandCard(); walkPlay(); /* it now shows as yours, with Start (or, had the money gone meanwhile, as it really is) */
}
function pickStart(id) { // set off by the one you chose: only by something you own
  if (job.state !== 'offer' || rideOpt(id).act !== 'start') return; game.ride = id; save(); startErrand();
}
function openPicker() { // page two of an errand: how to travel
  if (job.state !== 'offer') return; job.pick = logic.ridePick(game, CONFIG); job.ask = null; ui.busy = true; makeRideArt(); errandEl.hidden = false; bendErrand();
}
function bendErrand() { // lay the card out: flat, frosted, sitting just above the bar of people at the foot of the screen
  const W = window.innerWidth, w = Math.min(W - 16, W < 760 ? 420 : 520), dock = $('dock').getBoundingClientRect();
  errandEl.style.setProperty('--w', w + 'px'); errandEl.style.setProperty('--bot', Math.round(window.innerHeight - (dock.height ? dock.top : window.innerHeight - 80) + 10) + 'px');
  bendEl.innerHTML = errandCard(); walkPlay();
}
window.addEventListener('resize', () => { if (!errandEl.hidden) bendErrand(); });
const briefEl = $('brief'); let briefFull = '', briefAt = 0, briefTimer = 0, briefGo = null, briefNo = null;
function showBrief() { // your own character, speaking: what the errand is
  const o = job.offer, W = window.innerWidth, w = Math.min(W - 20, W < 760 ? 372 : 520), dock = $('dock').getBoundingClientRect(), who = (HERO_LIST.find(([id]) => id === hero.who) || [0, 'You'])[1];
  briefEl.style.setProperty('--w', w + 'px'); briefEl.style.setProperty('--bot', Math.round(window.innerHeight - (dock.height ? dock.top : window.innerHeight - 80) + 10) + 'px');
  $('brface').src = HERO_BUST[hero.who] || HERO_FACE[hero.who] || ''; $('brname').textContent = game.name || who; $('brname').hidden = !game.name;
  if (!game.name) { briefFull = ''; briefAt = 0; clearInterval(briefTimer); $('brtext').textContent = 'Hi! What should I call you?'; $('brform').hidden = false; briefEl.classList.remove('done'); briefEl.classList.add('ask'); briefEl.hidden = false; setTimeout(() => $('brin').focus(), 350); return; }
  $('brform').hidden = true; briefEl.classList.remove('ask');
  briefFull = (game.jobs ? 'New errand! ' : 'My first errand! ') + 'Pick up a parcel at ' + numText(o.from).replace(' ', '') + ' and deliver it to ' + numText(o.to).replace(' ', '') + '. It pays ' + cash(o.pay) + ' and we have ' + clockText(o.time) + '. Let’s be quick!';
  briefGo = openPicker; briefNo = null; $('brno').hidden = true; $('brgo').textContent = 'Next'; briefEl.classList.remove('plain', 'other'); speak();
}
function speak() { // the words come out as if spoken
  briefAt = 0; $('brtext').textContent = ''; briefEl.classList.remove('done'); briefEl.hidden = false; clearInterval(briefTimer);
  briefTimer = setInterval(() => { briefAt = Math.min(briefFull.length, briefAt + 2); $('brtext').textContent = briefFull.slice(0, briefAt); if (briefAt >= briefFull.length) { clearInterval(briefTimer); briefEl.classList.add('done'); } }, 28);
}
function tell(text, btn, go, opt = {}) { // somebody tells you something: your own character by default; one button underneath, or two
  const W = window.innerWidth, w = Math.min(W - 20, W < 760 ? 372 : 520), dock = $('dock').getBoundingClientRect();
  briefEl.style.setProperty('--w', w + 'px'); briefEl.style.setProperty('--bot', Math.round(window.innerHeight - (dock.height ? dock.top : window.innerHeight - 80) + 10) + 'px');
  const name = opt.name || game.name || '';
  $('brface').src = opt.face || HERO_BUST[hero.who] || HERO_FACE[hero.who] || ''; $('brname').textContent = name; $('brname').hidden = !name; $('brform').hidden = true; briefEl.classList.remove('ask'); briefEl.classList.add('plain'); briefEl.classList.toggle('other', !!opt.face);
  briefFull = text; briefGo = go || (() => { ui.busy = false; }); briefNo = opt.no || null; $('brgo').textContent = btn || 'OK'; $('brno').textContent = opt.noBtn || ''; $('brno').hidden = !opt.no; ui.busy = true; speak();
  if (opt.no) $('brno').style.right = (16 + briefEl.querySelector('.nx').offsetWidth + 8) + 'px'; // the second button sits just left of the first
}

function nextBrief() { // a tap finishes the sentence; the next tap turns the page
  if (briefAt < briefFull.length) { clearInterval(briefTimer); briefAt = briefFull.length; $('brtext').textContent = briefFull; briefEl.classList.add('done'); return; }
  briefEl.hidden = true; if (briefGo) briefGo(); /* (after an errand's first page this opens the page for choosing how to travel) */
}
briefEl.addEventListener('click', (e) => { if (!$('brform').hidden) return; if (briefNo && e.target.closest('#brno')) { clearInterval(briefTimer); briefEl.hidden = true; const f = briefNo; briefNo = null; f(); return; } nextBrief(); });
$('brform').addEventListener('submit', (e) => { e.preventDefault(); const v = $('brin').value.trim().replace(/\s+/g, ' ').slice(0, 14); if (!v) { $('brin').focus(); return; } game.name = v; save(); $('brin').blur(); showBrief(); });
function openErrand() {
  if (job.state !== 'idle' && job.state !== 'offer') return;
  if (game.hurt) { note('Get treated first: tap the hospital in the menu.', 4); return; }
  if (ui.busy) return; const o = job.offer = makeOffer(); if (!o) { note('No errands near here just now.', 3); return; }
  job.state = 'offer'; ui.busy = true; showBrief(); chime([660, 880], 'triangle', 0.06, 0.1, 0.05);
}
const latePenalty = (o) => Math.round(o.pay * CONFIG.lateShare / 100) * 100;
function closeErrand() { errandEl.hidden = true; briefEl.hidden = true; clearInterval(briefTimer); ui.busy = false; if (job.state === 'offer') job.state = 'idle'; }
const startErrand = () => { errandEl.hidden = true; job.state = 'count'; job.count = 3.999; ui.busy = true; countShow(3); };
errandEl.addEventListener('click', (e) => { if (errandEl.dataset.swiped) return; // (a swipe is not a tap)
  const b = e.target.closest('[data-act]'); if (!b) { if (e.target === errandEl) closeErrand(); return; } // a tap on the empty background puts it away, like the menu
  const id = RIDES[job.pick]; if (b.dataset.act === 'skip') closeErrand(); else if (b.dataset.act === 'start') pickStart(id);
  else if (b.dataset.act === 'ask') pickAsk(id); else if (b.dataset.act === 'buy') pickBuy(id); else if (b.dataset.act === 'no') { job.ask = null; $('pkcta').innerHTML = pickFoot(id); }
  else if (b.dataset.act === 'mode') pickStep(+b.dataset.i - job.pick);
  else if (b.dataset.act === 'step') pickStep(+b.dataset.d);
  else if (b.dataset.act === 'locked') { chime([300, 240], 'triangle', 0.08, 0.1, 0.05); b.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '6px 0' }, { translate: '0 0' }], { duration: 260 }); }
});
{ let sx = null; errandEl.addEventListener('pointerdown', (e) => { sx = e.clientX; }); errandEl.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 34) { pickStep(e.clientX < sx ? 1 : -1); errandEl.dataset.swiped = '1'; setTimeout(() => { delete errandEl.dataset.swiped; }, 60); } sx = null; }); } // a sideways swipe moves to the next card
window.addEventListener('keydown', (e) => { // on a keyboard: Enter starts it, Escape puts it away, and so does setting off walking
  if ((errandEl.hidden && briefEl.hidden) || e.repeat || (e.target && e.target.tagName === 'INPUT')) return;
  if (!errandEl.hidden && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { pickStep(e.code === 'ArrowLeft' ? -1 : 1); return; }
  if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); if (!briefEl.hidden) nextBrief(); else { const id = RIDES[job.pick], act = rideOpt(id).act; if (act === 'start') pickStart(id); else if (act === 'buy' && job.ask !== id) pickAsk(id); } } /* (Enter never buys: Buy has to be tapped) */
  else if (!errandEl.hidden && e.code === 'Escape' && job.ask) { job.ask = null; $('pkcta').innerHTML = pickFoot(RIDES[job.pick]); }
  else if (!briefEl.classList.contains('other') && (e.code === 'Escape' || (/^(Key[WASD]|Arrow(Up|Down))$/.test(e.code) && $('brform').hidden))) closeErrand();
});
// The sheet stands over your head: its foot comes down just past the top of the head, and the head shows in front of it.
// The head is the real one: its outline is drawn alone (the character's own layer) and used to cut the same pixels out of the picture.
const topEl = $('herotop'), topG = topEl.getContext('2d'), cutCv = document.createElement('canvas'), cutG = cutCv.getContext('2d', { willReadFrequently: true }), cutCam = new THREE.PerspectiveCamera(); let cutRT = null, cutBuf = null;
function errandOverHead() { // (the card no longer stands over the head, so nothing of the character needs drawing in front of it)
  const open = !errandEl.hidden; if (!topEl.hidden) topEl.hidden = true; document.body.classList.toggle('offer', open);
}
const _cc = new THREE.Color();
function countShow(n) { const el = $('count'); el.hidden = n === null; if (n === null) return; el.textContent = n > 0 ? n : 'GO'; el.classList.toggle('go', !(n > 0)); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); chime([n > 0 ? 520 : 1040], 'triangle', 0.05, n > 0 ? 0.12 : 0.3, 0.1); }
// the parcel: a kraft cardboard box with packing tape, an address label and a barcode, a size you carry in both hands
const PARCEL = [0.38, 0.27, 0.3];
const parcelFace = (kind) => new THREE.MeshLambertMaterial({ map: canvasTex(256, 192, (g, w, h) => {
  const r = rng(71 + kind.length); g.fillStyle = '#c69a62'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,235,200,.07)' : 'rgba(90,55,20,.06)'; g.fillRect(r() * w, r() * h, 1 + r() * 26, 1); } // the grain of the card
  const edge = g.createLinearGradient(0, 0, 0, h); edge.addColorStop(0, 'rgba(60,35,10,.22)'); edge.addColorStop(0.08, 'rgba(60,35,10,0)'); edge.addColorStop(0.92, 'rgba(60,35,10,0)'); edge.addColorStop(1, 'rgba(60,35,10,.3)'); g.fillStyle = edge; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(70,40,12,.35)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  if (kind === 'top') { g.fillStyle = 'rgba(70,40,12,.4)'; g.fillRect(0, h / 2 - 1.5, w, 3); g.fillStyle = 'rgba(232,214,170,.92)'; g.fillRect(0, h / 2 - 22, w, 44); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, h / 2 - 22, w, 6); // the flaps, taped along the join
    g.fillStyle = '#fbfbf8'; g.fillRect(24, 18, 104, 62); g.fillStyle = '#b6f02c'; g.fillRect(24, 18, 104, 12); g.fillStyle = '#2a2f36'; for (let i = 0; i < 4; i++) g.fillRect(32, 38 + i * 9, 50 + (i % 2) * 28, 3.5); }
  else { g.fillStyle = 'rgba(232,214,170,.92)'; g.fillRect(w / 2 - 22, 0, 44, kind === 'side' ? 58 : h); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(w / 2 - 22, 0, 6, kind === 'side' ? 58 : h); // tape coming down over the edge
    if (kind === 'front') { g.fillStyle = '#fbfbf8'; g.fillRect(150, 112, 88, 58); g.fillStyle = '#16191d'; let x = 158; while (x < 230) { const bw = 1.5 + r() * 4; g.fillRect(x, 120, bw, 34); x += bw + 1.5 + r() * 3; } g.fillRect(158, 159, 46, 4);
      g.strokeStyle = '#3a2410'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; for (const ax of [34, 70]) { g.beginPath(); g.moveTo(ax, 168); g.lineTo(ax, 126); g.moveTo(ax - 12, 138); g.lineTo(ax, 124); g.lineTo(ax + 12, 138); g.stroke(); } } } // "this way up"
}) });
const PARCEL_MATS = (() => { const side = parcelFace('side'), front = parcelFace('front'), top = parcelFace('top'), plain = parcelFace('end'); return [side, side, top, plain, front, plain]; })(); // +x, -x, +y, -y, +z, -z
const PARCEL_GEO = new THREE.BoxGeometry(PARCEL[0], PARCEL[1], PARCEL[2]);
function makeParcel() { const g = new THREE.Group(), box = new THREE.Mesh(PARCEL_GEO, PARCEL_MATS); box.position.y = PARCEL[1] / 2; box.castShadow = true; g.add(box); return g; }
const parcel = makeParcel(); parcel.visible = false; scene.add(parcel);
const dropped = []; // parcels you have delivered, left at their gates until you are well away
// the marker over where you are headed: a blue pin with a parcel on it, in the manner of the green one over your home
const jobPin = (() => { const tex = canvasTex(256, 320, (g) => g.clearRect(0, 0, 256, 320)), img = new Image(), drop = 'M60 144 C60 144 14 98 14 62 A46 46 0 0 1 106 62 C106 98 60 144 60 144z';
  img.onload = () => { const g = tex.image.getContext('2d'); g.clearRect(0, 0, 256, 320); g.drawImage(img, 0, 0, 256, 320); tex.needsUpdate = true; };
  img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="320" viewBox="0 0 120 150"><defs>
    <linearGradient id="p" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#dcfb7a"/><stop offset=".55" stop-color="#b6f02c"/><stop offset="1" stop-color="#7fc400"/></linearGradient>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e2e8f2"/></linearGradient>
    <filter id="b"><feGaussianBlur stdDeviation="4"/></filter><clipPath id="c"><path d="${drop}"/></clipPath></defs>
    <path d="${drop}" fill="#3f6a00" opacity=".4" filter="url(#b)" transform="translate(0 4)"/><path d="${drop}" fill="url(#p)"/>
    <g clip-path="url(#c)"><circle cx="104" cy="130" r="46" fill="#5c9a00" opacity=".35"/><ellipse cx="44" cy="30" rx="34" ry="20" fill="#fff" opacity=".28"/></g>
    <rect x="38" y="46" width="44" height="34" rx="6" fill="url(#w)"/><rect x="34" y="38" width="52" height="14" rx="5" fill="url(#w)"/><rect x="55" y="38" width="10" height="42" fill="#17230a" opacity=".35"/>
    <path d="${drop}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.400"/></svg>`);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, fog: false, transparent: true, map: tex })); sp.scale.set(2.2, 2.75, 1); sp.visible = false; sp.renderOrder = 5; return sp; })();
scene.add(jobPin);
function gain(n, why) { // money going up or down, shown by your money
  const el = $('gain'); el.textContent = (n >= 0 ? '+' : '−') + cash(Math.abs(n)) + (why ? '  ' + why : ''); el.className = n >= 0 ? 'up' : 'down'; el.hidden = false; void el.offsetWidth; el.classList.add('go'); clearTimeout(gain.t); gain.t = setTimeout(() => { el.hidden = true; }, 2600);
}
// Money earned arrives as coins: they spring up from where you stand, arc across to your balance and drop into it one by one,
// each with a clink, and the balance counts up as they land.
function coinDrop(amount) {
  const n = clamp(Math.round(amount / 700), 6, 14), each = amount / n, m = moneyEl.getBoundingClientRect(), tx = m.left + Math.min(m.width, 90) * 0.5, ty = m.top + m.height / 2, W = window.innerWidth, H = window.innerHeight;
  ui.hold = (ui.hold || 0) + amount; const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i'); c.className = 'coin'; document.body.append(c);
    const x0 = W / 2 + (Math.random() - 0.5) * 70, y0 = H * 0.52 + (Math.random() - 0.5) * 30, up = 70 + Math.random() * 60, dur = calm ? 1 : 620 + Math.random() * 160, delay = calm ? 0 : i * 85;
    const land = () => { c.remove(); ui.hold = Math.max(0, ui.hold - each); if (ui.hold < 1) ui.hold = 0; chime([1975 + Math.random() * 420, 2637 + Math.random() * 300], 'triangle', 0.028, 0.085, 0.05);
      moneyEl.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }, { transform: 'scale(1)' }], { duration: 170, easing: 'ease-out' }); };
    const a = c.animate([{ transform: `translate(${x0}px,${y0}px) scale(.4) rotate(0deg)`, opacity: 0, offset: 0 }, { transform: `translate(${x0 + (Math.random() - 0.5) * 50}px,${y0 - up}px) scale(1.15) rotate(180deg)`, opacity: 1, offset: 0.3, easing: 'cubic-bezier(.5,0,.8,.5)' },
      { transform: `translate(${tx}px,${ty - 16}px) scale(.85) rotate(520deg)`, opacity: 1, offset: 0.9 }, { transform: `translate(${tx}px,${ty}px) scale(.6) rotate(540deg)`, opacity: 0.9, offset: 1 }], { duration: dur, delay, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
    a.onfinish = land; a.oncancel = land;
  }
  setTimeout(() => { ui.hold = 0; }, n * 85 + 1400); // whatever happens, the balance ends up right
}
// Agberos and police. While you are out on an errand an agbero or an officer stands on the pavement somewhere ahead. When he
// sees you he walks up to you; once he is close you stop and turn to him, he steps in front of you and puts his hand out
// (the officer holds his palm up: stop), and then he says what he wants. Running, or crossing the road early, keeps you clear.
let hzNext = 0;
const _ha = new THREE.Vector3(), _hb = new THREE.Vector3(), _hq = new THREE.Quaternion(), _hp = new THREE.Quaternion(), _hi = new THREE.Quaternion();
function aimBone(b, kid, dir, w) { // turn a bone so that it points from itself to its child along dir (in the world), by the share w
  if (!b || !kid || w <= 0) return; b.getWorldPosition(_ha); kid.getWorldPosition(_hb); _hb.sub(_ha).normalize(); _hq.setFromUnitVectors(_hb, dir); _hi.identity().slerp(_hq, w);
  b.parent.getWorldQuaternion(_hp); b.quaternion.premultiply(_hp.clone().invert().multiply(_hi).multiply(_hp)); b.updateMatrixWorld(true);
}
function hzMake(type, x, z) {
  const list = type === 'agbero' ? AGB : POLICE; if (!list.length) return; const k = list[Math.floor(Math.random() * list.length)], obj = new THREE.Group(), inner = SkeletonUtils.clone(k.root), look = k.looks[Math.floor(Math.random() * k.looks.length)];
  inner.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.boundingSphere = o.boundingSphere && o.boundingSphere.clone(); o.frustumCulled = false; } });
  const baseY = inner.position.y; inner.scale.multiplyScalar(k.scale); inner.position.y += k.lift; obj.add(inner); addShadow(inner, obj);
  const mixer = new THREE.AnimationMixer(inner), walk = mixer.clipAction(k.walk), idle = mixer.clipAction(k.idle || k.walk); walk.play(); idle.play(); walk.setEffectiveWeight(0);
  const R = rigFor(inner), under = (b, top) => { for (let q = b; q; q = q.parent) if (q === top) return true; return false; }; let arm = null;
  obj.position.set(x, locY(x, z), z); obj.updateMatrixWorld(true);
  for (const a of R.arms) { const f = R.fore.find((q) => under(q, a)), hd = R.hands.find((q) => under(q, a)); if (!f || !hd) continue; if (!arm || a.getWorldPosition(_ha).x < arm.x) arm = { up: a, fore: f, hand: hd, x: a.getWorldPosition(_ha).x }; } // one arm, the same one each time
  const L = game.job.level, fee = type === 'agbero' ? 300 + 200 * L : 1000 + 500 * L;
  scene.add(obj); hz.push({ type, k, obj, inner, baseY, mixer, walk, idle, arm, x, z, home: [x, z], state: 'wait', face: Math.random() * 6.28, w: 0, t: 0, hand: 0, fee });
}
function hzSpawn() {
  const o = job.offer, tgt = job.state === 'pickup' ? o.from : o.to, D = Math.hypot(tgt.x - hero.x, tgt.z - hero.z); if (D < 40) return;
  const live = (t) => hz.filter((h) => h.type === t && h.state !== 'done').length, type = !live('agbero') && !live('police') ? (Math.random() < 0.55 ? 'agbero' : 'police') : !live('agbero') ? 'agbero' : !live('police') ? 'police' : null; if (!type) return;
  const c = [];
  for (const a of ADDR.values()) { const d = Math.hypot(a.x - hero.x, a.z - hero.z); if (d < 30 || d > 58) continue; const dt = Math.hypot(a.x - tgt.x, a.z - tgt.z); if (dt < 14 || dt > D - 8) continue;
    if (hz.some((h) => Math.hypot(h.x - a.x, h.z - a.z) < 20) || !locate(a.x, a.z, F - 0.45)) continue; c.push([d + dt - D, a]); }
  if (!c.length) return; c.sort((p, q) => p[0] - q[0]); const a = c[Math.floor(Math.random() * Math.min(3, c.length))][1]; hzMake(type, a.x, a.z);
}
function hzSay(h) {
  const fee = logic.spendUpTo(game.money, h.fee).paid, ask = cash(fee || h.fee), btn = fee > 0 ? 'Pay ' + cash(fee) : 'I have nothing', away = () => { h.state = 'back'; ui.busy = false; hero.free = 6; },
    pay = () => { const took = logic.spendUpTo(game.money, fee); game.money = took.money; if (took.paid > 0) gain(-took.paid, h.type === 'agbero' ? 'Agbero' : 'Police'); /* nothing taken: nothing to show */ chime([392, 330], 'triangle', 0.1, 0.16, 0.07); save(); showMoney(); away(); };
  h.state = 'talk';
  if (h.type === 'agbero') tell('Oga! Nobody passes here free. Drop ' + ask + ' for the boys.', btn, pay, { face: h.k.face, name: 'Agbero' });
  else tell('Stop there! Where are you rushing to? Give me ' + ask + ' and you can go.', btn, pay, { face: h.k.face, name: 'Officer', noBtn: 'Wait', no: () => { ui.busy = false; h.state = 'hold'; h.t = 0; hero.free = 16; spend('The officer is checking you…', 9, () => { note('He lets you go.', 2.5); h.state = 'back'; }); } });
}
function hzTick(dt) {
  const on = job.state === 'pickup' || job.state === 'deliver', now = performance.now(); if (hero.free > 0) hero.free -= dt;
  if (on && !ui.busy && now > hzNext) { hzNext = now + 7000; hzSpawn(); }
  for (let i = hz.length - 1; i >= 0; i--) {
    const h = hz[i], dx = hero.x - h.x, dz = hero.z - h.z, d = Math.hypot(dx, dz) || 0.001, held = h.state === 'stop' || h.state === 'talk' || h.state === 'hold';
    if ((!on && !held) || d > 80) { if (h.state === 'stop') ui.busy = false; h.mixer.stopAllAction(); h.mixer.uncacheRoot(h.inner); scene.remove(h.obj); hz.splice(i, 1); continue; }
    let sp = 0, gx = 0, gz = 0; const ok = on && !ui.busy && !(hero.down > 0) && !(hero.free > 0) && job.bend <= 0;
    if (h.state === 'wait' && d < (h.type === 'agbero' ? 15 : 18) && ok) { h.state = 'come'; h.t = 0; if (h.type === 'police') chime([2350, 2350, 2350], 'square', 0.16, 0.13, 0.035); } // the officer blows his whistle
    if (h.state === 'come') { h.t += dt;
      if (d > 30 || h.t > 16 || !on || hero.down > 0) h.state = 'back';
      else if (d < 2.6 && ok) { h.state = 'stop'; h.t = 0; ui.busy = true; hero.speed = 0; chime([196, 233], 'square', 0.12, 0.14, 0.05); } // near enough: you stop for him
      else if (!ui.busy) { sp = h.type === 'agbero' ? 3.3 : 2.9; gx = dx / d; gz = dz / d; } }
    if (h.state === 'stop') { h.t += dt; hero.heading += angDiff(Math.atan2(-dx, -dz), hero.heading) * Math.min(1, dt * 6); // you turn to him as he steps up in front of you
      if (d > 1.25) { sp = 1.5; gx = dx / d; gz = dz / d; } else if (h.t > 1.5) hzSay(h); }
    if (held && !h.side) { const base = Math.atan2(-dx, -dz), open = (sg) => { const y = base + sg * 0.8; let n = 0; for (const r of [1.5, 3, 4.5]) if (locate(hero.x - Math.sin(y) * r, hero.z - Math.cos(y) * r, F - 0.3)) n++; return n; }; h.side = open(1) >= open(-1) ? 1 : -1; } // look from whichever side has room for the camera
    if (held && look.id === null) camYaw += angDiff(Math.atan2(-dx, -dz) + h.side * 0.8, camYaw) * Math.min(1, dt * 2.2); // the view swings round to the side, so you see the two of you
    if (h.state === 'back') { const bx = h.home[0] - h.x, bz = h.home[1] - h.z, bd = Math.hypot(bx, bz); if (bd < 0.3) h.state = 'done'; else { sp = 1.4; gx = bx / bd; gz = bz / bd; } }
    if (sp > 0) { const nx = h.x + gx * sp * dt, nz = h.z + gz * sp * dt; if (locate(nx, nz, F - 0.45)) { h.x = nx; h.z = nz; } else sp = 0; h.face += angDiff(Math.atan2(gx, gz), h.face) * Math.min(1, dt * 9); }
    else if (d < 20 && h.state !== 'done' && h.state !== 'back') h.face += angDiff(Math.atan2(dx, dz), h.face) * Math.min(1, dt * 5); // he watches you
    h.w += ((sp > 0.2 ? 1 : 0) - h.w) * Math.min(1, dt * 8); h.walk.setEffectiveWeight(h.w); h.idle.setEffectiveWeight(1 - h.w); h.walk.timeScale = clamp((sp || 1.4) / (h.k.stride || 1.45), 0.6, 2.1);
    h.inner.position.y = h.baseY + h.k.lift * (1 - h.w) + h.k.liftWalk * h.w; h.obj.position.set(h.x, locY(h.x, h.z), h.z); h.obj.rotation.y = h.face; h.mixer.update(dt);
    h.hand += ((held && sp < 0.2 ? 1 : 0) - h.hand) * Math.min(1, dt * 5);
    if (h.arm && h.hand > 0.01) { h.obj.updateMatrixWorld(true); const fx = Math.sin(h.face), fz = Math.cos(h.face), k = h.hand * h.hand * (3 - 2 * h.hand);
      if (h.type === 'police') { aimBone(h.arm.up, h.arm.fore, _v.set(fx * 0.85, 0.15, fz * 0.85).normalize(), k); aimBone(h.arm.fore, h.arm.hand, _v.set(fx * 0.45, 0.9, fz * 0.45).normalize(), k); } // palm up and out: stop
      else { aimBone(h.arm.up, h.arm.fore, _v.set(fx * 0.6, -0.75, fz * 0.6).normalize(), k); aimBone(h.arm.fore, h.arm.hand, _v.set(fx * 0.97, 0.1, fz * 0.97).normalize(), k); } }                         // hand held out for the money
  }
}
// Knocked down by a car: you are thrown back and lie in the road for a moment, the errand in hand is lost and its level starts again,
// and you are hurt (no running, no new errands) until you treat yourself from the hospital in the menu.
function carHit(c) {
  if (hero.down > 0 || hero.safe > 0 || job.state === 'offer' || job.state === 'count' || locateRoom()) return;
  const dx = c.axis === 'z' ? 0 : c.dir, dz = c.axis === 'z' ? c.dir : 0;
  c.v = 0; c.wait = 5; hero.down = 3.1; hero.push = [dx, dz, 2.2]; hero.heading = Math.atan2(-dx, -dz); hero.safe = 7; ui.busy = true; game.hurt = true;
  chime([110, 82, 61], 'sawtooth', 0.05, 0.28, 0.2); horn(1); const f = $('hitfx'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  hero.lost = job.state === 'pickup' || job.state === 'deliver'; if (hero.lost) { job.bend = 0; endErrand(false, true); job.nextAt = 0; } save(); $('hurt').hidden = !game.hurt;
}
function downTick(dt) {
  if (hero.safe > 0) hero.safe -= dt;
  if (!(hero.down > 0)) { if (hero.obj.rotation.x) { hero.obj.rotation.x = 0; } return; }
  const was = hero.down; hero.down -= dt; const t = 3.1 - hero.down, sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  if (hero.push && hero.push[2] > 0) { const d = Math.min(hero.push[2], dt * 7), nx = hero.x + hero.push[0] * d, nz = hero.z + hero.push[1] * d; hero.push[2] -= d; if (locate(nx, nz, F - 0.45)) { hero.x = nx; hero.z = nz; } } // thrown along the way the car was going
  const lie = sm(t / 0.32) * (1 - sm((t - 2.5) / 0.6)); hero.obj.rotation.order = 'YXZ'; hero.obj.rotation.x = -Math.PI / 2 * lie; hero.obj.position.y = hero.y + 0.14 * lie; hero.speed = 0;
  if (hero.down <= 0 && was > 0) { hero.obj.rotation.x = 0; const L = game.job.level;
    tell('Ouch! A car knocked me down. ' + (hero.lost ? 'I lost the parcel, so Level ' + L + ' starts again. ' : '') + 'I’m hurt. Tap the hospital in the menu to treat me.', 'OK'); }
}
function treat() { // from the hospital in the menu: pay, and you are well again
  const took = logic.spendUpTo(game.money, CONFIG.treatFee), fee = took.paid; game.money = took.money; game.hurt = false; if (fee > 0) gain(-fee, 'Treated'); chime([523, 659, 784, 1047], 'triangle', 0.09, 0.2, 0.08); save(); $('hurt').hidden = !game.hurt; showMoney();
  job.nextAt = performance.now() + 3500;
}
function aim(name, x, z) { ui.dest = { name, x, z, errand: true }; mapT = 0; }
function startBend(what) { job.bend = 1.7; job.bendFor = what; job.done = false; ui.busy = true; }
function endErrand(paid, hit) { // paid, cancelled for being late, or lost because a car knocked you down
  const o = job.offer, J = game.job, was = job.state; job.state = 'idle'; ui.dest = null; mapT = 0; jobPin.visible = false; $('job').hidden = true;
  if (paid) { game.money = logic.earn(game.money, o.pay); gain(o.pay, 'Delivered'); coinDrop(o.pay); J.done++; game.jobs = (game.jobs || 0) + 1;
    const L = levelOf(J.level); if (J.done >= L.n) { const bonus = 5000 * J.level; J.level++; J.done = 0; game.money = logic.earn(game.money, bonus); setTimeout(() => { gain(bonus, 'Bonus'); coinDrop(bonus); }, 2300); } }
  else { if (hit) J.done = 0; else { const took = logic.spendUpTo(game.money, latePenalty(o)), fine = took.paid; game.money = took.money; gain(-fine, 'Cancelled'); chime([330, 247, 196], 'sawtooth', 0.14, 0.3, 0.07); } // knocked down: no fine, but the level starts again
    if (parcel.visible) { const d = makeParcel(), held = was === 'deliver'; d.position.set(held ? hero.x + Math.sin(hero.heading) * 0.5 : parcel.position.x, held ? hero.y : parcel.position.y, held ? hero.z + Math.cos(hero.heading) * 0.5 : parcel.position.z); d.rotation.y = parcel.rotation.y; scene.add(d); dropped.push(d); parcel.visible = false; } } // the parcel is left where it is

  save(); job.offer = null; job.nextAt = performance.now() + (paid ? 3200 : 4200);
}
function errandTick(dt) {
  for (let i = dropped.length - 1; i >= 0; i--) if (Math.hypot(dropped[i].position.x - hero.x, dropped[i].position.z - hero.z) > 70) { scene.remove(dropped[i]); dropped.splice(i, 1); }
  if (job.state === 'idle') { // the next errand comes to your screen by itself: the first one soon after you arrive, the rest after each delivery
    if (!job.auto && settled && performance.now() - T0 > 9000) { job.auto = true; job.nextAt = performance.now() + 600; }
    if (job.nextAt && performance.now() > job.nextAt && !ui.busy && !game.hurt && $('places').hidden && ADDR.size > 3 && !locateRoom()) { job.nextAt = 0; openErrand(); }
    return; }
  if (job.state === 'offer') return;
  const o = job.offer;
  if (job.state === 'count') { const was = Math.floor(job.count); job.count -= dt; const now = Math.floor(job.count); if (now !== was) countShow(now > 0 ? now : now === 0 ? 0 : null);
    if (job.count < 0) { countShow(null); ui.busy = false; job.state = 'pickup'; job.t = job.total = o.time; parcel.visible = true; parcel.position.set(o.from.px, locY(o.from.px, o.from.pz), o.from.pz); parcel.rotation.set(0, Math.random() * 3, 0); aim('Pickup', o.from.x, o.from.z); $('job').hidden = false; lastJob = ''; }
    return; }
  job.t -= dt;
  const tgt = job.state === 'pickup' ? o.from : o.to, far = Math.hypot(tgt.px - hero.x, tgt.pz - hero.z);
  jobPin.visible = Math.hypot(tgt.x - hero.x, tgt.z - hero.z) > (job.state === 'pickup' ? 13 : 3); jobPin.position.set(tgt.x, 3.3 + Math.sin(performance.now() / 420) * 0.12, tgt.z);
  { const label = (job.state === 'pickup' ? 'Pick up at ' : 'Deliver to ') + numText(tgt), txt = clockText(job.t), key = txt + label + (job.t < 20);
    if (key !== lastJob) { lastJob = key; $('jobtv').textContent = txt; const pick = job.state === 'pickup'; $('jobls').textContent = pick ? 'Pick up at' : 'Deliver to'; $('joblb').textContent = numText(tgt).replace(' ', ''); $('job').classList.toggle('late', job.t < 20); } }
  if (job.t <= 0 && job.bend <= 0) { endErrand(false); return; }
  if (job.bend <= 0 && !ui.busy && far < 1.25) startBend(job.state === 'pickup' ? 'take' : 'give'); // close enough: you bend to it by yourself
}
let lastJob = '';
const locY = (x, z) => { const q = locate(x, z, F - 0.3); return q ? q.y : 0.28; };
const locateRoom = () => { const q = locate(hero.x, hero.z, F); return !!(q && q.room); };
// Bending down to pick something up or put it down: knees bend, the back leans over and the arms reach, worked out on whichever
// skeleton the character has (there is no ready-made pick-up animation for these characters, so the pose is made here).
const _ax = new THREE.Vector3(), _pq = new THREE.Quaternion(), _dq = new THREE.Quaternion(), _iq = new THREE.Quaternion(), _hw = new THREE.Vector3(), _hv = new THREE.Vector3(), _hd = new THREE.Vector3();
function rigFor(m) { // the main bones of a character, whichever skeleton it has
  const bones = []; m.traverse((b) => { if (b.isBone) bones.push(b); });
  const depth = (b) => { let d = 0; for (let q = b.parent; q; q = q.parent) d++; return d; }, small = /thumb|index|middle|ring|pinky|finger|twist|roll|toe/i;
  const pick = (re, no) => bones.filter((b) => re.test(b.name) && !small.test(b.name) && !(no && no.test(b.name))).sort((a, b) => depth(a) - depth(b));
  return { m, spine: pick(/spine/i).slice(0, 3), arms: pick(/upperarm|(left|right)arm/i, /fore|lower/i).slice(0, 2), thighs: pick(/upleg|upperleg|thigh/i).slice(0, 2),
    shins: pick(/lowerleg|calf|(left|right)leg/i, /up/i).slice(0, 2), feet: pick(/foot/i).slice(0, 2), fore: pick(/forearm|lowerarm/i).slice(0, 2), hands: pick(/hand/i).slice(0, 2) };
}
function rigOf() { return hero.rig && hero.rig.m === hero.model ? hero.rig : (hero.rig = rigFor(hero.model)); }
function turnBone(b, ang) { b.parent.getWorldQuaternion(_pq); _dq.setFromAxisAngle(_ax, ang); b.quaternion.premultiply(_pq.clone().invert().multiply(_dq).multiply(_pq)); }
function errandPose(dt) {
  const R = rigOf(), o = job.offer;
  if (job.bend > 0 && o) {
    const tgt = job.bendFor === 'take' ? o.from : o.to, p = 1 - job.bend / 1.7, sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, k = sm(p / 0.42) * (1 - sm((p - 0.58) / 0.42));
    hero.heading += angDiff(Math.atan2(tgt.px - hero.x, tgt.pz - hero.z), hero.heading) * Math.min(1, dt * 10); hero.obj.rotation.y = hero.heading;
    _ax.set(Math.cos(hero.heading), 0, -Math.sin(hero.heading)); // the character's own right-hand side: leaning about it is leaning forward
    const foot = R.feet[0], y0 = foot ? foot.getWorldPosition(_hw).y : 0, knee = 0.95 * k;
    for (const b of R.thighs) turnBone(b, -knee); for (const b of R.shins) turnBone(b, 2 * knee); for (const b of R.feet) turnBone(b, -knee);
    for (const b of R.spine) turnBone(b, 1.05 * k / Math.max(1, R.spine.length)); for (const b of R.arms) turnBone(b, -(1.05 + 0.5) * k);
    if (foot) hero.model.position.y -= foot.getWorldPosition(_hw).y - y0; // the hips come down so the feet stay on the ground
    job.bend -= dt;
    if (!job.done && p >= 0.5) { job.done = true; // the moment the hands are down
      if (job.bendFor === 'take') { job.state = 'deliver'; chime([660, 880], 'triangle', 0.06, 0.12, 0.07); aim('Deliver', o.to.x, o.to.z); }
      else { const d = makeParcel(); d.position.set(o.to.px, locY(o.to.px, o.to.pz), o.to.pz); d.rotation.y = hero.heading; scene.add(d); dropped.push(d); parcel.visible = false; } }
    if (job.bend <= 0) { ui.busy = false; if (job.bendFor === 'give') endErrand(true); }
  }
  // Carrying: each upper arm is pointed down and a little forward, each forearm forward and a little in, so the hands meet under the box.
  const carry = parcel.visible && job.state === 'deliver';
  job.hold = clamp((job.hold || 0) + (carry && job.bend <= 0 ? 1 : -1) * dt * 3.5, 0, 1);
  if (job.hold > 0.001 && R.arms.length === 2 && R.fore.length === 2) {
    const fx = Math.sin(hero.heading), fz = Math.cos(hero.heading), rx = Math.cos(hero.heading), rz = -Math.sin(hero.heading), w = job.hold * job.hold * (3 - 2 * job.hold);
    const point = (b, kid, sx, dy, df) => { b.getWorldPosition(_hw); kid.getWorldPosition(_hv); _hv.sub(_hw).normalize(); _hd.set(rx * sx + fx * df, dy, rz * sx + fz * df).normalize();
      _dq.setFromUnitVectors(_hv, _hd); _iq.identity().slerp(_dq, w); b.parent.getWorldQuaternion(_pq); b.quaternion.premultiply(_pq.clone().invert().multiply(_iq).multiply(_pq)); };
    for (const up of R.arms) { const fo = R.fore.find((f) => { for (let q = f.parent; q; q = q.parent) if (q === up) return true; return false; }), hd = fo && R.hands.find((h) => { for (let q = h.parent; q; q = q.parent) if (q === fo) return true; return false; }); if (!fo || !hd) continue;
      up.getWorldPosition(_hw); const side = Math.sign((_hw.x - hero.x) * rx + (_hw.z - hero.z) * rz) || 1; // which side of the body this arm is on
      point(up, fo, side * 0.16, -0.9, 0.3); point(fo, hd, -side * 0.34, 0.1, 0.94); }
  }
  if (carry) { // the box sits between the hands, held against the body
    if (R.hands.length === 2) { R.hands[0].getWorldPosition(_hw); R.hands[1].getWorldPosition(_hv); const fx = Math.sin(hero.heading), fz = Math.cos(hero.heading);
      parcel.position.set((_hw.x + _hv.x) / 2 + fx * 0.07, (_hw.y + _hv.y) / 2 - PARCEL[1] * 0.42, (_hw.z + _hv.z) / 2 + fz * 0.07); } else parcel.position.set(hero.x, hero.y + 0.95, hero.z);
    parcel.rotation.set(0, hero.heading, 0); }
}
// The small map, top right: the streets round you, turned the way you are facing, and a green house that shows where home is.
const mapEl = $('map'), mapG = mapEl.getContext('2d'); let mapT = 0, mapNote = '';
function wayHome(hx, hz) { // the way home along the streets: out to the nearest road, along it, and down the home street to the door
  const road = (v) => Math.round((v - F) / PITCH) * PITCH + F, zH = road(hz), zh = road(hero.z), xv = road(hero.x), pts = [[hero.x, hero.z]];
  if (Math.abs(hero.z - zH) < 12) pts.push([hero.x, zH]);                                                            // already on the home street
  else if (Math.abs(hero.z - zh) <= Math.abs(hero.x - xv)) pts.push([hero.x, zh], [xv, zh], [xv, zH]);                // on a street that runs across: along to the corner, then up or down
  else pts.push([xv, hero.z], [xv, zH]);                                                                              // on a street that runs up and down
  pts.push([hx, zH], [hx, hz]); return pts;
}
// Tap the small map to open it large in the middle of the screen; tap it again (or anywhere outside it) to put it back.
mapEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); mapEl.classList.toggle('big'); $('mapinfo').classList.toggle('big', mapEl.classList.contains('big')); mapT = 0; });
addEventListener('pointerdown', (e) => { if (mapEl.classList.contains('big') && e.target !== mapEl) { mapEl.classList.remove('big'); $('mapinfo').classList.remove('big'); mapT = 0; } }, true);
function showMap(dt, indoors) {
  if (indoors && mapEl.classList.contains('big')) { mapEl.classList.remove('big'); $('mapinfo').classList.remove('big'); }
  mapEl.hidden = $('mapinfo').hidden = !!indoors; if (indoors || (mapT -= dt) > 0) return; mapT = 0.08;
  const big = mapEl.classList.contains('big'), want = big ? 760 : 296; if (mapEl.width !== want) mapEl.width = mapEl.height = want; // tapped open, it is drawn larger and shows further
  const R = big ? 330 : 150, g = mapG, S = mapEl.width, c = S / 2, k = c / R, cs = Math.cos(camYaw), sn = Math.sin(camYaw); // R metres from the middle to the rim
  const u = S / 296 * (big ? 0.75 : 1); // the markers keep about the same size on screen however big the map is
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(c, c, c, 0, 7); g.clip();
  const bg = g.createRadialGradient(c, c, 10, c, c, c); bg.addColorStop(0, '#263445'); bg.addColorStop(1, '#17202b'); g.fillStyle = bg; g.fillRect(0, 0, S, S);
  g.setTransform(-cs * k, -sn * k, sn * k, -cs * k, c, c); g.translate(-hero.x, -hero.z); g.lineCap = 'round'; g.lineJoin = 'round';
  const reach = R * 1.6, nC = Math.ceil(2 * reach / PITCH) + 1, i0 = Math.floor((hero.x - reach) / PITCH), j0 = Math.floor((hero.z - reach) / PITCH), roads = () => { g.beginPath();
    for (let i = i0; i <= i0 + nC; i++) { g.moveTo(i * PITCH + F, hero.z - reach); g.lineTo(i * PITCH + F, hero.z + reach); }
    for (let j = j0; j <= j0 + nC; j++) { g.moveTo(hero.x - reach, j * PITCH + F); g.lineTo(hero.x + reach, j * PITCH + F); } g.stroke(); };
  g.strokeStyle = '#0f151d'; g.lineWidth = 19; roads(); g.strokeStyle = '#51647a'; g.lineWidth = 14; roads();                     // the streets, each with a dark edge
  g.strokeStyle = '#3d4d60'; g.lineWidth = 5; g.beginPath();
  for (let i = i0; i <= i0 + nC; i++) for (let j = j0; j <= j0 + nC; j++) { const X0 = i * PITCH + RW, Z0 = j * PITCH + RW; if (laneDir(i, j) === 'z') { g.moveTo(X0 + MID, Z0); g.lineTo(X0 + MID, Z0 + BLOCK); } else { g.moveTo(X0, Z0 + MID); g.lineTo(X0 + BLOCK, Z0 + MID); } }
  g.stroke();
  const hm = RENT[game.home]; if (hm) game.homeAt = [hm.cx, hm.cz];
  // Where the map leads: a place you chose from the menu; otherwise your home; and before you have one, the houses for rent.
  const lot = RENT[1] || RENT[0], toRent = !ui.dest && !(game.home >= 0 && game.homeAt) && lot ? [lot.cx, lot.cz] : null;
  const going = ui.dest, home = going ? [going.x, going.z] : (game.home >= 0 && game.homeAt) || toRent, away = home ? Math.hypot(home[0] - hero.x, home[1] - hero.z) : 0;
  const tone = going ? ['#b6f02c', '#f4ffd6', 'rgba(182,240,44,.9)', '#8fd10f'] : toRent ? ['#ffb02e', '#fff1d6', 'rgba(255,176,46,.9)', '#e08a00'] : ['#2ee58f', '#d9ffe9', 'rgba(46,229,143,.9)', '#19a35b'];
  if (going && !going.errand && away < 10) { ui.dest = null; mapNote = ''; ui.arrived = performance.now() + 3500; ui.arrivedAt = going.name; chime([660, 880, 1100]); }
  if (home && away > 14) { // the way home, drawn as a glowing green line along the streets
    const pts = wayHome(home[0], home[1]); g.beginPath(); pts.forEach(([x, z], n) => (n ? g.lineTo(x, z) : g.moveTo(x, z)));
    g.shadowColor = tone[0]; g.shadowBlur = 14 * u; g.strokeStyle = tone[0]; g.lineWidth = 6.5 * R / 150; g.stroke(); g.shadowBlur = 0; g.strokeStyle = tone[1]; g.lineWidth = 1.8 * R / 150; g.stroke();
  }
  g.restore(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.beginPath(); g.arc(c, c, c, 0, 7); g.clip(); const rim = g.createRadialGradient(c, c, c * 0.62, c, c, c); rim.addColorStop(0, 'rgba(8,12,18,0)'); rim.addColorStop(1, 'rgba(8,12,18,0.62)'); g.fillStyle = rim; g.fillRect(0, 0, S, S); g.restore(); // the map fades into its rim
  if (home) { // home: a green house, held at the rim when it is further away than the map shows
    let dx = home[0] - hero.x, dz = home[1] - hero.z, px = (-cs * dx + sn * dz) * k, py = (-sn * dx - cs * dz) * k; const far = Math.hypot(px, py), lim = c - 24 * u; if (far > lim) { px *= lim / far; py *= lim / far; }
    g.save(); g.translate(c + px, c + py); g.scale(u, u); g.shadowColor = tone[2]; g.shadowBlur = 16; g.fillStyle = tone[3]; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill(); g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    g.fillStyle = going ? '#17230a' : '#fff'; g.beginPath(); if (going) { g.arc(0, 0, 6, 0, 7); g.fill(); g.restore(); } else { g.moveTo(0, -9.5); g.lineTo(9.5, -1); g.lineTo(6.5, -1); g.lineTo(6.5, 7.5); g.lineTo(-6.5, 7.5); g.lineTo(-6.5, -1); g.lineTo(-9.5, -1); g.closePath(); g.fill(); g.restore(); }
  }
  const turn = angDiff(hero.heading, camYaw); g.save(); g.translate(c, c); g.scale(u, u); g.fillStyle = 'rgba(182,240,44,.24)'; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill(); // you: a lime arrow in a soft ring
  g.rotate(-turn); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 6; g.fillStyle = '#b6f02c'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -14); g.lineTo(10, 11); g.lineTo(0, 5.5); g.lineTo(-10, 11); g.closePath(); g.fill(); g.shadowBlur = 0; g.stroke(); g.restore();
  const note = performance.now() < (ui.arrived || 0) ? 'You have arrived: ' + ui.arrivedAt : !home ? '' : toRent && away <= 14 ? 'Houses for rent here' : !going && away <= 14 ? 'You are home' : (going ? going.name : toRent ? 'For rent' : 'Home') + ' · ' + (away < 1000 ? Math.round(away / 5) * 5 + ' m' : (away / 1000).toFixed(1) + ' km');
  if (note !== mapNote) { mapNote = note; const el = $('mapinfo'); el.replaceChildren(); if (note) { const b = document.createElement('b'); b.textContent = note; el.append(b); } }
}
// Over your own house floats a green marker with a house on it, so you can see home from down the street.
const homePin = (() => { // a glossy pin in the same layered mint-to-pink as the Home icon, with a soft white house on it
  const tex = canvasTex(256, 320, (g) => g.clearRect(0, 0, 256, 320)), img = new Image(), drop = 'M60 144 C60 144 14 98 14 62 A46 46 0 0 1 106 62 C106 98 60 144 60 144z';
  img.onload = () => { const g = tex.image.getContext('2d'); g.clearRect(0, 0, 256, 320); g.drawImage(img, 0, 0, 256, 320); tex.needsUpdate = true; };
  img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="320" viewBox="0 0 120 150"><defs>
    <linearGradient id="p" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#8ff5cf"/><stop offset=".5" stop-color="#4f9ab8"/><stop offset="1" stop-color="#d64a9a"/></linearGradient>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e2e8f2"/></linearGradient>
    <filter id="b"><feGaussianBlur stdDeviation="4"/></filter><filter id="s"><feGaussianBlur stdDeviation="2.200"/></filter><clipPath id="c"><path d="${drop}"/></clipPath></defs>
    <path d="${drop}" fill="#5b3fb8" opacity=".35" filter="url(#b)" transform="translate(0 4)"/><path d="${drop}" fill="url(#p)"/>
    <g clip-path="url(#c)"><circle cx="104" cy="130" r="46" fill="#5b3fb8" opacity=".35"/><circle cx="108" cy="134" r="32" fill="#e0458f" opacity=".5"/><ellipse cx="44" cy="30" rx="34" ry="20" fill="#fff" opacity=".28"/></g>
    <path d="M60 37 Q62.500 37 65 39 L80 52 Q83 55 83 59 V75 Q83 82 76 82 H68 V71 Q68 65 62 65 H58 Q52 65 52 71 V82 H44 Q37 82 37 75 V59 Q37 55 40 52 L55 39 Q57.500 37 60 37z" fill="#2a4a7a" opacity=".35" filter="url(#s)" transform="translate(0 3)"/>
    <path d="M60 37 Q62.500 37 65 39 L80 52 Q83 55 83 59 V75 Q83 82 76 82 H68 V71 Q68 65 62 65 H58 Q52 65 52 71 V82 H44 Q37 82 37 75 V59 Q37 55 40 52 L55 39 Q57.500 37 60 37z" fill="url(#w)"/>
    <path d="${drop}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.400"/></svg>`);
  return new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, fog: false, transparent: true, map: tex }));
})(); homePin.scale.set(1.5, 1.875, 1); homePin.renderOrder = 20; homePin.visible = false; scene.add(homePin);
function uiKey(e) {
  if (!$('dm').hidden) { if (e.code === 'Escape') closeDm(); return; }
  if (!talkEl.hidden) { const b = $('opts').querySelector(`button[data-n="${e.key}"]`); if (b && !b.disabled) b.click(); return; }
  if (!$('look').hidden) { if (e.code === 'Escape' || e.code === 'Enter') closeLook(); return; }
  if ((e.code === 'KeyE' || e.code === 'Enter') && ui.act && !e.repeat) ui.act.run();
}
function chime(freqs, type = 'sine', gap = 0.09, len = 0.25, peak = 0.12) { // small sounds: a knock, money changing hands
  const ctx = sfx.ctx; if (!ctx || ctx.state !== 'running') return;
  freqs.forEach((f, i) => { const t = ctx.currentTime + i * gap, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(g); g.connect(sfx.out); o.start(t); o.stop(t + len + 0.05); });
}

/* ---- landlords and the conversation at the gate ---- */
function makeNpc(st) {
  const k = kinds[st.def.kind], look = k.looks[(st.def.id * 3 + 1) % k.looks.length], obj = new THREE.Group(), inner = SkeletonUtils.clone(k.root);
  inner.traverse((o) => { if (o.isMesh) { o.material = look.get(o.material) || o.material; o.boundingSphere = o.boundingSphere && o.boundingSphere.clone(); } });
  inner.scale.multiplyScalar(k.scale); inner.position.y += k.lift; obj.add(inner); addShadow(inner, obj);
  const mixer = new THREE.AnimationMixer(inner), walk = mixer.clipAction(k.walk), idle = mixer.clipAction(k.idle || k.walk); walk.play(); idle.play(); walk.setEffectiveWeight(0);
  const at = npcSpot(st); obj.scale.setScalar(1 / HS); st.rg.add(obj);
  st.npc = { obj, mixer, walk, idle, stride: k.stride || 1.45, w: 0, dep: at[0], lat: at[1], face: -st.s * Math.PI / 2, arrived: true };
}
const npcSpot = (st) => (st.state === 'home' ? [2.0, 2.9] : st.state === 'wait' ? [st.sb - 1.0, 1.5] : [1.3, 0.62]); // by the door, at the gate, or standing aside once the place is yours
function knock(st) { chime([170, 150, 170], 'triangle', 0.16, 0.09, 0.3); st.state = 'coming'; }
function talkRent(st) {
  const d = st.def, rentBtn = [`Rent it for ${cash(d.price)}`, () => rentIt(st), !logic.canAfford(game.money, d.price)], no = ['Not today', () => say(d.who, 'No problem. I am here whenever you are ready.', [['Goodbye', hush]])];
  say(d.who, `Hello! Looking for a place to stay? This is a ${d.name.toLowerCase()}. ${d.about} The rent is ${cash(d.price)} for the year.`,
    [rentBtn, ['What is it like inside?', () => say(d.who, `${d.more} It comes empty, so you furnish it the way you like.`, [rentBtn, no])], no]);
}
function rentIt(st) {
  const d = st.def, took = logic.spend(game.money, d.price); if (!took.ok || game.home >= 0) return;
  game.money = took.money; game.home = d.id; save(); chime([660, 880, 1320]); showMoney();
  st.state = 'home'; st.sign.visible = false; for (const p of st.sign.userData.posts || []) p.visible = false; if (st.rentPin) st.rentPin.visible = false;
  say(d.who, 'Welcome home! Here are your keys. The door is open, so go in and make the place yours.', [['Thank you', hush]]);
}
const hero_hx = (st) => lotOf(st, hero.x, hero.z, _lot).lat, hero_hz = (st) => lotOf(st, hero.x, hero.z, _lot).dep - st.sb - 0.22;
const homeLight = new THREE.PointLight('#ffe2b8', 0, 14, 1.5); scene.add(homeLight); // the ceiling light of your home: it comes on as you walk in
let settled = false, settleAt = 0; const T0 = performance.now(); // the city fills up behind a short loading screen; after that nothing may pop into view
function updateJourney(dt) {
  if (!settled) {
    const ready = kinds.length === KINDS && carKinds.length && !jobs.length && zones.every((z) => z.pop);
    if (ready && !settleAt) settleAt = performance.now() + 900;
    if ((settleAt && performance.now() > settleAt) || performance.now() - T0 > 15000) { settled = true; $('veil').classList.add('gone'); if (!game.pack) openLook(); }
  }
  let act = null, inRoom = false;
  for (const st of RENT) {
    if (!st || !st.g.parent || (hero.x - st.cx) ** 2 + (hero.z - st.cz) ** 2 > 90 * 90) continue;
    if (!st.npc && kinds.length === KINDS && st.state !== 'home') makeNpc(st);
    if (st.npc && st.state === 'home' && !ui.busy) { st.rg.remove(st.npc.obj); st.npc = null; } // once the house is yours nobody stands at your door
    const open = st.state === 'wait' || st.state === 'coming' ? 0 : 1, ease = (v) => v * v * (3 - 2 * v);
    st.gateOpen = clamp(st.gateOpen + Math.sign(open - st.gateOpen) * dt / 0.9, 0, 1); st.doorOpen = clamp(st.doorOpen + (st.state === 'home' ? dt / 0.9 : 0), 0, 1);
    st.gate.rotation.y = st.s * 1.7 * ease(st.gateOpen);
    { const me = lotOf(st, hero.x, hero.z, _lot), by = st.state === 'home' && hero.level === 0 && Math.abs(me.lat) < 1.8 && Math.abs(me.dep - st.sb) < 2.4; // your front door opens as you come up to it, from either side, and shuts again behind you
      st.doorT = clamp((st.doorT || 0) + (by ? 1 : -1) * dt / 0.45, 0, 1); st.door.rotation.y = st.s * 1.85 * ease(st.doorT); }
    const L = lotOf(st, hero.x, hero.z, _lot), n = st.npc;
    if (n) { // the landlord walks to where they are needed, then turns to you (or to the street)
      const [gd, gl] = npcSpot(st), dx = gd - n.dep, dz = gl - n.lat, dist = Math.hypot(dx, dz); let v = 0, face = -st.s * Math.PI / 2;
      if (dist > 0.05) { v = Math.min(1.25, dist / dt); n.dep += dx / dist * v * dt; n.lat += dz / dist * v * dt; face = Math.atan2(st.s * dx, dz); }
      else if ((L.dep - n.dep) ** 2 + (L.lat - n.lat) ** 2 < 36) face = Math.atan2(st.s * (L.dep - n.dep), L.lat - n.lat);
      n.arrived = dist <= 0.05; n.face += angDiff(face, n.face) * Math.min(1, dt * 5);
      n.obj.position.set(st.s * (F + n.dep), 0.28, n.lat); n.obj.rotation.y = n.face;
      n.w += ((v > 0.2 ? 1 : 0) - n.w) * Math.min(1, dt * 6); n.walk.setEffectiveWeight(n.w); n.idle.setEffectiveWeight(1 - n.w); n.walk.timeScale = clamp(v / n.stride, 0.45, 1.4); n.mixer.update(dt);
      if (st.state === 'coming' && n.arrived) st.state = 'opening';
    }
    if (st.state === 'opening' && st.gateOpen >= 1) { st.state = 'ready'; talkRent(st); }
    if (game.home < 0 && L.dep < 1.2 && L.dep > -3.2 && Math.abs(L.lat) < 2.4) {
      if (st.state === 'wait') act = { label: 'Knock on the gate', run: () => knock(st) };
      else if (st.state === 'ready') act = { label: 'Talk to ' + st.def.who, run: () => talkRent(st) };
    }
    if (game.home === st.def.id) { const spot = homeSpot(hero.x, hero.z); if (spot && spot.room === st) { inRoom = true; } }
    if (inRoom && game.home === st.def.id) { const me = lotOf(st, hero.x, hero.z, _lot), hx = me.lat, hz = me.dep - st.sb - 0.22; // what there is to do where you are standing
      for (const [x, z, lv, reach, label, run] of homeSpots(st)) { const far = Math.hypot(hx - x, hz - z); if (lv === hero.level && far < reach && (!act || far < (act.far === undefined ? 0.6 : act.far))) act = { label, run, far }; }
      if (st.furn.has('tv') && !st.tvScreen) { const [tx, tz, tf, tl] = st.plan.put.tv, m = new THREE.Mesh(PLANE, TV_PICTURE); m.scale.set(1.16, 0.64, 1); m.rotation.y = { N: st.s * Math.PI / 2, S: -st.s * Math.PI / 2, E: 0, W: Math.PI }[tf]; // the picture on the television, lit when it is on
        const off = { N: [0, 0.07], S: [0, -0.07], E: [0.07, 0], W: [-0.07, 0] }[tf]; m.position.set(st.s * (F + st.sb + 0.22 + tz + off[1]), FLOOR + tl * STOREY + (FMODEL.stand.high || 0.6) + 0.43, tx + off[0]); m.visible = !!st.tvOn; st.rg.add(m); st.tvScreen = m; }
    }
    for (const dr of st.doors) { // doors ease open and shut; the nearest one within reach gets the button
      dr.t = clamp(dr.t + (dr.open ? 1 : -1) * dt / 0.5, 0, 1); dr.pivot.rotation.y = dr.swing * dr.t * dr.t * (3 - 2 * dr.t);
      if (dr.L !== hero.level || st.doorOpen < 0.85) continue;
      const me = lotOf(st, hero.x, hero.z, _lot), mid = dr.hinge + dr.dir * dr.gw / 2, hx = me.lat, hz = me.dep - st.sb - 0.22, far = dr.along === 'z' ? Math.hypot(hx - dr.at, hz - mid) : Math.hypot(hx - mid, hz - dr.at);
      if (dr.L === hero.level) for (const sh of st.showers) if (sh[2] === hero.level && Math.hypot(hx - sh[0], hz - sh[1]) < 1.15 && !act) act = { label: 'Take a shower', run: () => takeShower(st, sh) };
      if (far < 1.25 && far > 0.45 && (!act || !act.door || far < act.far) && !(act && act.label === 'Take a shower')) act = { label: dr.open ? 'Close the door' : 'Open the door', door: dr, far, run: () => { dr.open = !dr.open; chime(dr.open ? [520] : [330, 260], 'triangle', 0.06, 0.12, 0.08); } };
    }
  }
  if (inRoom && !game.seenHome) { game.seenHome = true; save(); }
  const hm = RENT[game.home];
  const lit = inRoom && homeSpot(hero.x, hero.z);
  if (hm && lit && lit.rect) { const r = lit.rect; _v.set(hm.s * (F + hm.sb + 0.22 + clamp((r.z0 + r.z1) / 2, hero_hz(hm) - 2.5, hero_hz(hm) + 2.5)), lit.y / HS + 2.45, clamp((r.x0 + r.x1) / 2, hero_hx(hm) - 2.5, hero_hx(hm) + 2.5)).applyMatrix4(hm.world); homeLight.position.lerp(_v, homeLight.intensity < 1 ? 1 : Math.min(1, dt * 6)); } // the light of whichever room you are standing in
  homeLight.intensity += ((inRoom && !(hm && hm.dark) ? 26 : 0) - homeLight.intensity) * Math.min(1, dt * 3);
  errandTick(dt); hzTick(dt);
  updateShower(dt); updateDoing(dt); setAct(ui.busy ? null : act); showMoney(); showNear(dt); showLife(dt); showMap(dt, inRoom);
  const mine = RENT[game.home]; homePin.visible = !!(mine && mine.g.parent && !inRoom); if (homePin.visible) homePin.position.set(mine.cx, 11.6, mine.cz); // it stays still over your house
}

/* ---------------- main loop ---------------- */
const clock = new THREE.Clock(), camGoal = new THREE.Vector3(), camAim = new THREE.Vector3();
let camReady = false;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!hero.placed) { hero.x = RW + 7; hero.z = F + 9.1; hero.heading = camYaw = Math.PI / 2; hero.placed = true; } // start on a main road
  updateCells();

  // walk: the stick is relative to where the camera looks
  let mx = joy.x + (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  if (ui.busy) { mx = 0; joy.y = 0; }
  let my = ui.busy ? 0 : joy.y + (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const mag = Math.min(1, Math.hypot(mx, my)), fx = Math.sin(camYaw), fz = Math.cos(camYaw);
  let speed = 0;
  if (mag > 0.1) {
    const run = !game.hurt && mag > 0.85 && (joy.id !== null || keys.ShiftLeft || keys.ShiftRight); // stick pushed right to the edge: run (on a keyboard, hold Shift)
    speed = run ? 5.2 : 1.75 * Math.min(1, mag / 0.8);
    let dx = fx * my - fz * mx, dz = fz * my + fx * mx; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
    hero.heading += angDiff(Math.atan2(dx, dz), hero.heading) * Math.min(1, dt * 9);
    const nx = hero.x + dx * speed * dt, nz = hero.z + dz * speed * dt, lim = F - 0.45, ox = hero.x, oz = hero.z;
    if (locate(nx, nz, lim)) { hero.x = nx; hero.z = nz; }            // free to go
    else if (locate(nx, hero.z, lim)) hero.x = nx;                    // slide along a wall
    else if (locate(hero.x, nz, lim)) hero.z = nz;
    else speed = 0;
    pushOut(); pushOffCars(); homePush();                                         // step round trees, poles, stalls, people and cars
    if (!locate(hero.x, hero.z, lim)) { hero.x = ox; hero.z = oz; speed = 0; }
    if (look.id === null) camYaw += angDiff(hero.heading, camYaw) * Math.min(1, dt * 1.3); // camera swings round behind you
  }
  hero.speed += (speed - hero.speed) * Math.min(1, dt * 8);
  const here = locate(hero.x, hero.z, F);
  hero.level = here && here.level !== undefined ? here.level : 0; // which floor of a house you are on (0 anywhere else)
  if (here) { hero.y += (here.y - hero.y) * Math.min(1, dt * 12); }
  hero.obj.position.set(hero.x, hero.y, hero.z); hero.obj.rotation.y = hero.heading;
  if (hero.mixer) { // blend idle, walk and run by speed
    const v = hero.speed, goal = [v < 0.15 ? 1 : 0, v >= 0.15 && v < 2.5 ? 1 : 0, v >= 2.5 ? 1 : 0];
    for (let i = 0; i < 3; i++) { hero.w[i] += (goal[i] - hero.w[i]) * Math.min(1, dt * 7); hero.acts[i].setEffectiveWeight(hero.w[i]); }
    hero.acts[1].timeScale = clamp(v / hero.stride, 0.5, 1.5); hero.acts[2].timeScale = clamp(v / 5.2, 0.75, 1.15);
    hero.mixer.update(dt);
    if (hero.lifts) hero.model.position.y = hero.baseY + (hero.w[0] * hero.lifts[0] + hero.w[1] * hero.lifts[1] + hero.w[2] * hero.lifts[2]) / Math.max(0.001, hero.w[0] + hero.w[1] + hero.w[2]);
    errandPose(dt);
  }
  downTick(dt);

  // camera follows from behind and above; it pulls in rather than pass through a building
  const cfx = Math.sin(camYaw), cfz = Math.cos(camYaw), cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  for (const d of [5.4, 4.2, 3.2, 2.4, 1.6, 1.0, 0.55]) {
    camGoal.set(hero.x - cfx * d * cp, hero.y + 1.7 + d * sp, hero.z - cfz * d * cp); // low enough to stay under shop awnings
    const spot = locate(camGoal.x, camGoal.z, F - 0.15, 0.6);
    if (spot && (!!spot.room === !!(here && here.room) || spot.door || (here && here.door))) { if (spot.over) camGoal.y += 1.8; break; } // over a front yard: rise clear of the fence. Indoors the camera stays indoors, so a wall never comes between it and you
  }
  if (here && here.room) { // indoors: the camera stays in the room you are in, backs off as far as its walls allow, and rises to look down over your shoulder
    const st = here.room, r = here.rect, m = 0.14; camGoal.set(hero.x - cfx * 4.2 * cp, 0, hero.z - cfz * 4.2 * cp);
    const L = lotOf(st, camGoal.x, camGoal.z, _lot), hx = clamp(L.lat, r.x0 - m, r.x1 + m), hz = clamp(L.dep - st.sb - 0.22, r.z0 - m, r.z1 + m);
    camGoal.set(st.s * (F + st.sb + 0.22 + hz), 0, hx).applyMatrix4(st.world);
    camGoal.y = Math.min(here.ceil, hero.y + 2.0 + 2.1 * sp + Math.max(0, 2.4 - Math.hypot(camGoal.x - hero.x, camGoal.z - hero.z)) * 0.7);
  }
  if (!camReady) { camera.position.copy(camGoal); camReady = true; } else camera.position.lerp(camGoal, Math.min(1, dt * 10));
  job.lookUp += ((job.state === 'offer' ? 1 : 0) - job.lookUp) * Math.min(1, dt * 5);
  camAim.set(hero.x, hero.y + (here && here.room ? 1.4 : 1.75) + job.lookUp * -2.05, hero.z); camera.lookAt(camAim);

  groundMesh.position.x = hero.x; groundMesh.position.z = hero.z;
  sky.position.set(camera.position.x, -20, camera.position.z); skyU.value = performance.now() / 1000; updateDaylight(); heroLamp.position.set(hero.x, 6.5, hero.z);
  { const gx = Math.round(hero.x / 6) * 6, gz = Math.round(hero.z / 6) * 6; renderer.shadowMap.needsUpdate = true; sunAt.x = gx; sunAt.z = gz; sun.position.set(gx + SUN_DIR.x * 200, SUN_DIR.y * 200, gz + SUN_DIR.z * 200); sun.target.position.set(gx, 0, gz); }
  skyline.position.set(camera.position.x, 62, camera.position.z);
  updatePeople(dt, camera.position); updateJourney(dt);
  updateSignals(); updateTraffic(dt); updateSound(dt);
  windU.value = performance.now() / 1000;
  if (composer) { aoPass.gtaoMaterial.uniforms.tDepth.value = aoPass.pdMaterial.uniforms.tDepth.value = composer.readBuffer.depthTexture; composer.render(); } else renderer.render(scene, camera);
  errandOverHead();
}
function loop() { frame(); requestAnimationFrame(loop); }
if (location.hash.includes('dbg')) window.__dbg = { logic, CONFIG, treat, carHit, hz, hzMake, hzSpawn, AGB, POLICE, BLD, ADDR, job, openErrand, rideModel, rideTris, makeRideArt, RIDE_PIC, RIDE_TPL, openPicker, pickAsk, pickBuy, pickStart, moneyCount, save, get rig() { return rigOf(); }, addFurniture, CATALOG, composer, aoPass, FMODEL, PACKS, packMount, game, RENT, ui, sfx, signal, THREE, SkeletonUtils, scene, kinds, hero, people, cars, carKinds, zones, cells, jobs, camera, renderer, locate, PITCH, RW, F, MID, laneDir, frame, step: (dt) => updatePeople(dt, camera.position), look: (y) => { camYaw = y; hero.heading = y; } }; // testing only
requestAnimationFrame(loop);
