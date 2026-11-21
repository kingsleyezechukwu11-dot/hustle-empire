// Reviewer's tests for task 1.1 (economy foundations): the acceptance criteria, stated as tests.
import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import * as logic from '../logic.js';
const { canAfford, spend, spendUpTo, earn, buyRide, rideStatus, freshGame, loadMoney } = logic;

// Reads a project file as text: jsc has readFile (run.sh runs from the project root), Node has fs. Null when neither.
const readText = (path) => {
  try { if (typeof readFile === 'function') return readFile(path); } catch (e) { return null; }
  try { if (typeof require === 'function') return require('fs').readFileSync(path, 'utf8'); } catch (e) { return null; }
  return null;
};
const snap = (v) => JSON.stringify(v);

/* ---- saves ---- */
test('review: a fresh game has exactly 100,000', () => { assertEqual(freshGame(CONFIG), 100000); assertEqual(loadMoney(undefined, CONFIG), 100000); });
test('review: an existing save of 734,000 loads as 734,000', () => { assertEqual(loadMoney(734000, CONFIG), 734000); });
test('review: the old one-million save keeps its million', () => { assertEqual(loadMoney(1000000, CONFIG), 1000000); });
test('review: a save through JSON keeps its balance', () => {
  const sv = JSON.parse(JSON.stringify({ money: 734000, curV: 1, items: [] })); assertEqual(loadMoney(sv.money, CONFIG), 734000);
  const bad = JSON.parse(JSON.stringify({ money: -2500, curV: 1, items: [] })); assertEqual(loadMoney(bad.money, CONFIG), 0);
});

/* ---- buying ---- */
test('review: every ride costs exactly its config price, once', () => {
  for (const id of Object.keys(CONFIG.transport)) {
    const price = CONFIG.transport[id].price; if (!price) continue;
    const a = buyRide({ money: price + 1234, rides: {} }, id, CONFIG);
    assert(a.ok, id + ' should be bought'); assertEqual(a.money, 1234, id + ' deducts the exact price'); assertEqual(a.rides[id], true);
    let s = a; for (let i = 0; i < 5; i++) { s = buyRide(s, id, CONFIG); assertEqual([s.ok, s.reason, s.money], [false, 'owned', 1234], id + ' again'); }
  }
});
test('review: one naira short buys nothing', () => {
  for (const id of Object.keys(CONFIG.transport)) {
    const price = CONFIG.transport[id].price; if (!price) continue;
    const r = buyRide({ money: price - 1, rides: {} }, id, CONFIG);
    assertEqual([r.ok, r.reason, r.shortfall, r.money, snap(r.rides)], [false, 'short', 1, price - 1, '{}'], id);
    assertEqual(rideStatus({ money: price - 1, rides: {} }, id, CONFIG).affordable, false, id);
    assertEqual(canAfford(price - 1, price), false);
  }
});
test('review: buying everything from a big balance adds up', () => {
  let s = { money: 1000000, rides: {} };
  for (const id of ['bicycle', 'scooter', 'car']) s = buyRide(s, id, CONFIG);
  assertEqual(s.money, 1000000 - 25000 - 60000 - 400000); assertEqual(s.rides, { bicycle: true, scooter: true, car: true });
});
test('review: an owned flag that is not true-ish does not count as owned', () => {
  const r = buyRide({ money: 30000, rides: { bicycle: false } }, 'bicycle', CONFIG); assert(r.ok); assertEqual(r.money, 5000);
});

/* ---- the game's own money paths, replayed with the config numbers ---- */
const latePenalty = (pay) => Math.round(pay * CONFIG.lateShare / 100) * 100;   // same sum as main.js latePenalty
test('review: hospital with too little money takes what is there and stops at 0', () => {
  for (const m of [0, 1, 500, CONFIG.treatFee - 1, CONFIG.treatFee, CONFIG.treatFee + 1]) {
    const t = spendUpTo(m, CONFIG.treatFee); assertEqual(t.paid, Math.min(m, CONFIG.treatFee)); assertEqual(t.money, Math.max(0, m - CONFIG.treatFee)); assert(t.money >= 0);
  }
});
test('review: a late fine, a bribe and the hospital in a row never pass 0', () => {
  for (const start of [0, 200, 1000, 2999, 5000, 100000]) for (const pay of [CONFIG.pay.min, 7300, CONFIG.pay.max]) {
    let m = start;
    for (const fee of [latePenalty(pay), 500, 1500, CONFIG.treatFee, latePenalty(pay)]) { const t = spendUpTo(m, fee); assertEqual(t.money + t.paid, m, 'nothing lost or made'); m = t.money; assert(m >= 0, 'below 0 from ' + start); }
  }
});
test('review: rent is all or nothing', () => {
  assertEqual(spend(119999, 120000), { ok: false, money: 119999, paid: 0 }); assertEqual(spend(120000, 120000), { ok: true, money: 0, paid: 120000 });
  assertEqual(canAfford(119999, 120000), false); assertEqual(canAfford(120000, 120000), true);
});
test('review: pay then fine round trip', () => { const m = earn(0, 4000); assertEqual(m, 4000); assertEqual(spendUpTo(m, latePenalty(15000)), { money: 0, paid: 4000 }); });

/* ---- purity ---- */
test('review: logic does not change what it is given', () => {
  const state = { money: 500000, rides: { bicycle: true } }, before = snap(state), cfg = snap(CONFIG);
  for (const id of ['walk', 'bicycle', 'scooter', 'car', 'nope']) { buyRide(state, id, CONFIG); rideStatus(state, id, CONFIG); }
  spend(state.money, 5); spendUpTo(state.money, 5); earn(state.money, 5); canAfford(state.money, 5); loadMoney(state.money, CONFIG); freshGame(CONFIG);
  assertEqual(snap(state), before, 'state'); assertEqual(snap(CONFIG), cfg, 'CONFIG');
});
test('review: logic gives the same answer every time', () => {
  const s = { money: 100000, rides: {} };
  assertEqual(snap(buyRide(s, 'scooter', CONFIG)), snap(buyRide(s, 'scooter', CONFIG))); assertEqual(snap(rideStatus(s, 'car', CONFIG)), snap(rideStatus(s, 'car', CONFIG)));
});
test('review: logic.js and config.js use no Three.js, DOM, globals or imports', () => {
  for (const f of ['street_src/logic.js', 'street_src/config.js']) {
    const src = readText(f); if (src === null) return;   /* no file access on this runner: skipped */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const word of ['import ', 'require(', 'window', 'document', 'globalThis', 'localStorage', 'THREE', 'performance', 'Math.random', 'Date']) assert(code.indexOf(word) < 0, f + ' uses ' + word);
  }
});

/* ---- main.js: every change to game.money goes through logic ---- */
test('review: main.js changes game.money only through logic', () => {
  const src = readText('street_src/main.js'); if (src === null) return;   /* no file access on this runner: skipped */
  assert(!/game\.money\s*(\+=|-=|\*=|\/=|\+\+|--)/.test(src), 'game.money is changed in place somewhere');
  assert(!/(\+\+|--)\s*game\.money/.test(src), 'game.money is stepped in place somewhere');
  const re = /game\.money\s*=(?!=)\s*([^;]+);/g; let m, n = 0;
  while ((m = re.exec(src))) { n++; const rhs = m[1].trim();
    assert(/^(logic\.(earn|loadMoney|freshGame)\(|took\.money$|CONFIG\.startMoney$)/.test(rhs), 'game.money is set from something else: ' + rhs.slice(0, 80)); }
  assert(n >= 6, 'expected the known writes to game.money, found ' + n);
  assert(src.indexOf('1000000') < 0, 'the old one-million start is still in main.js'); assert(src.indexOf('TREAT_FEE') < 0, 'the old TREAT_FEE is still in main.js');
});
