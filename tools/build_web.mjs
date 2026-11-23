// Builds the version of the game that goes online (build/web/), for phones and computers:
//   index.html  - picks the right version for the device
//   full.html   - the computer version, exactly what the preview shows
//   m.html + m.js + m/*.glb - the phone version: models with smaller pictures (tools/shrink_glb.py),
//                 downloaded as separate files instead of being written into the page, so a phone's memory is not filled twice.
// usage: node tools/build_web.mjs   (after sh build_street.sh and python3 tools/shrink_glb.py street_src/models build/mobile_src/models)
import { build } from '../street_src/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'build/web'), small = path.join(root, 'build/mobile_src/models');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'm'), { recursive: true });

const names = new Set();
const glbFromFiles = {
  name: 'glb-from-files',
  setup(b) {
    b.onLoad({ filter: /\.glb$/ }, (a) => {
      const n = path.basename(a.path); names.add(n);
      if (!fs.existsSync(path.join(small, n))) throw new Error('no phone copy of ' + n);
      return { contents: `export default globalThis.__GLB[${JSON.stringify(n)}];`, loader: 'js' };
    });
  },
};
await build({
  entryPoints: [path.join(root, 'street_src/main.js')], bundle: true, minify: true, format: 'iife', target: ['es2020', 'safari15'],
  loader: { '.jpg': 'binary' }, plugins: [glbFromFiles], outfile: path.join(out, 'm.js'), logLevel: 'warning',
});
fs.mkdirSync(path.join(out, 'd'), { recursive: true });
for (const n of names) { fs.copyFileSync(path.join(small, n), path.join(out, 'm', n)); fs.copyFileSync(path.join(root, 'street_src/models', n), path.join(out, 'd', n)); } // d/: the computer's full-detail models
// Faster loading: every model also goes up squeezed (gzip; the site does not squeeze models by itself), which is about a third less to
// download, and each is named with a short fingerprint of its contents so that a phone keeps it and never asks for it again until it changes.
const H = { m: {}, d: {} };
for (const dir of ['m', 'd']) for (const n of names) { const f = path.join(out, dir, n), buf = fs.readFileSync(f);
  H[dir][n] = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10); fs.writeFileSync(f + '.gz', zlib.gzipSync(buf, { level: 9 })); }

// Both pages share one game script; the phone page fetches the small models (m/), the computer page the full ones (d/).
// Each page downloads every model first (showing how far along it is), then starts the game.
const list = JSON.stringify([...names]), JSH = crypto.createHash('sha1').update(fs.readFileSync(path.join(out, 'm.js'))).digest('hex').slice(0, 10);
const loader = (dir) => `(async () => {
  const L = ${list}, H = ${JSON.stringify(H[dir])}, G = globalThis.__GLB = {}, gz = typeof DecompressionStream === 'function'; let done = 0;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:#0d1219;color:#fff;font:600 15px -apple-system,system-ui,sans-serif';
  document.body.appendChild(bar); const show = () => { bar.textContent = 'Loading the street… ' + Math.round(done / L.length * 100) + '%'; }; show();
  // the squeezed copy is unpacked here as it arrives; a browser that cannot unpack, or anything odd about the answer, falls back to the plain file
  const get = async (n, tries = 3, plain = !gz) => { try { const r = await fetch('${dir}/' + n + (plain ? '' : '.gz') + '?h=' + H[n]); if (!r.ok) throw new Error(r.status);
      const u = plain ? new Uint8Array(await r.arrayBuffer()) : new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
      if (u[0] !== 0x67 || u[1] !== 0x6c || u[2] !== 0x54 || u[3] !== 0x46) throw new Error('not a model'); return u; }   /* every model starts with the letters glTF */
    catch (e) { if (!plain) return get(n, tries, true); if (tries > 1) return get(n, tries - 1, true); throw e; } };
  let next = 0; const worker = async () => { while (next < L.length) { const n = L[next++]; G[n] = await get(n); done++; show(); } };
  try { await Promise.all(Array.from({ length: 8 }, worker)); } catch (e) { bar.textContent = 'Could not load the street. Check your connection and reload.'; return; }
  const s = document.createElement('script'); s.src = 'm.js?h=${JSH}'; s.onload = () => bar.remove(); document.body.appendChild(s);
})();`;
const page = fs.readFileSync(path.join(root, 'street_src/index.html'), 'utf8');
if (!page.includes('/*BUNDLE*/')) throw new Error('no /*BUNDLE*/ in index.html');
fs.writeFileSync(path.join(out, 'm.html'), page.replace('/*BUNDLE*/', loader('m')));
fs.writeFileSync(path.join(out, 'full.html'), page.replace('/*BUNDLE*/', loader('d')));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blocktown</title><meta name="apple-mobile-web-app-title" content="Blocktown"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><style>html{background:#0d1219}</style>
<script>var h = /(^#|&)(id_token|error)=/.test(location.hash) ? '' : location.hash, phone = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || h.includes('phone');
location.replace((phone && !h.includes('full') ? 'm.html' : 'full.html') + location.hash);</script>`);
// Full screen when added to a phone's home screen: the app settings file and its icons.
for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png']) fs.copyFileSync(path.join(root, 'street_src/web', f), path.join(out, f));
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({ name: 'Blocktown', short_name: 'Blocktown', start_url: './', scope: './', display: 'fullscreen', orientation: 'any', background_color: '#0d1219', theme_color: '#86a9d6',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, null, 1));
// How long browsers may keep each file: models and the game script are fingerprinted (see above), so they are kept for a year; the pages are always checked.
fs.writeFileSync(path.join(out, '_headers'), ['/m/*', '/d/*', '/m.js'].map((p) => p + '\n  Cache-Control: public, max-age=31536000, immutable\n').join('') + '/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n');
fs.writeFileSync(path.join(out, 'netlify.toml'), '[build]\n  publish = "."\n  command = ""\n');
const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(1);
let models = 0; for (const n of names) models += fs.statSync(path.join(out, 'm', n)).size;
let big = 0; for (const n of names) big = Math.max(big, fs.statSync(path.join(out, 'd', n)).size);
let squeezed = 0; for (const n of names) squeezed += fs.statSync(path.join(out, 'm', n + '.gz')).size;
console.log(`build/web ready: m.js ${mb(path.join(out, 'm.js'))} MB + ${names.size} models ${(models / 1e6).toFixed(1)} MB (${(squeezed / 1e6).toFixed(1)} MB to download squeezed); largest file ${(big / 1e6).toFixed(1)} MB`);
