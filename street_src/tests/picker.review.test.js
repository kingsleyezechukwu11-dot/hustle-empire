// Reviewer's tests for task 1.2 (choose and buy transport): the acceptance criteria, stated as tests.
import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import { buyRide, rideStatus, rideOption, ridePick, rideIds, countStep, moneyText } from '../logic.js';

// Reads a project file as text: jsc has readFile (run.sh runs from the project root), Node has fs. Null when neither.
const readText = (path) => {
  try { if (typeof readFile === 'function') return readFile(path); } catch (e) { return null; }
  try { if (typeof require === 'function') return require('fs').readFileSync(path, 'utf8'); } catch (e) { return null; }
  return null;
};
const PAID = rideIds(CONFIG).filter((id) => CONFIG.transport[id].price > 0);

/* ---- 1. buying: exact price, once, never what you cannot afford or already own ---- */
test('1.2 review: tapping Buy many times in a row pays once', () => {
  for (const id of PAID) {
    let s = { money: CONFIG.transport[id].price * 3, rides: {} }, paid = 0;
    for (let i = 0; i < 10; i++) { const r = buyRide(s, id, CONFIG); if (r.ok) paid++; s = { money: r.money, rides: r.rides }; }
    assertEqual(paid, 1, id); assertEqual(s.money, CONFIG.transport[id].price * 2, id);
  }
});
test('1.2 review: exactly the price buys and leaves 0; one naira short buys nothing', () => {
  for (const id of PAID) {
    const p = CONFIG.transport[id].price, a = buyRide({ money: p, rides: {} }, id, CONFIG), b = buyRide({ money: p - 1, rides: {} }, id, CONFIG);
    assertEqual([a.ok, a.money, a.rides[id]], [true, 0, true], id);
    assertEqual([b.ok, b.reason, b.shortfall, b.money, !!b.rides[id]], [false, 'short', 1, p - 1, false], id);
  }
});
test('1.2 review: a save whose rides is an array, null, text or a number owns nothing and can still buy', () => {
  for (const rides of [['bicycle', 'skate'], null, undefined, 'bicycle', 7, true, []]) {
    const s = { money: 30000, rides, ride: 'skate' }, tag = JSON.stringify(rides);
    assertEqual(rideStatus(s, 'bicycle', CONFIG).owned, false, tag); assertEqual(rideOption(s, 'bicycle', CONFIG).act, 'buy', tag);
    assertEqual(ridePick(s, CONFIG), 0, tag);
    const r = buyRide(s, 'bicycle', CONFIG); assertEqual([r.ok, r.money, r.rides.bicycle], [true, 5000, true], tag);
    assert(!Array.isArray(r.rides) && typeof r.rides === 'object', 'rides comes back as a plain object: ' + tag);
    assertEqual(buyRide({ money: r.money, rides: r.rides }, 'bicycle', CONFIG).reason, 'owned', tag);
  }
});
test('1.2 review: unknown ids in a save are never owned, bought, started or opened on', () => {
  const s = { money: 1e9, rides: { skate: true, bike: true, __proto__: { car: true } }, ride: 'skate' };
  for (const id of ['skate', 'bike', 'toString', 'constructor', '__proto__', '', undefined, null, 0]) {
    assertEqual(buyRide(s, id, CONFIG).ok, false, String(id)); assertEqual(buyRide(s, id, CONFIG).money, 1e9, String(id)); assertEqual(rideOption(s, id, CONFIG).act, 'short', String(id));
  }
  assertEqual(ridePick(s, CONFIG), 0);
  assertEqual(ridePick({ ride: 'car', rides: null }, CONFIG), 0); assertEqual(ridePick({ ride: 'walk' }, CONFIG), 0);
});

/* ---- 2. what the card says ---- */
test('1.2 review: owned says Owned; short says the price and "Need ₦X more" with commas', () => {
  const own = rideOption({ money: 0, rides: { car: true } }, 'car', CONFIG);
  assertEqual([own.act, own.tag, own.need, own.price], ['start', 'Owned', '', '₦400,000']);
  assertEqual(rideOption({ money: 0, rides: {} }, 'car', CONFIG).need, 'Need ₦400,000 more');
  assertEqual(rideOption({ money: 1, rides: {} }, 'car', CONFIG).need, 'Need ₦399,999 more');
  assertEqual(rideOption({ money: 399999, rides: {} }, 'car', CONFIG).need, 'Need ₦1 more');
  assertEqual(rideOption({ money: 400000, rides: {} }, 'car', CONFIG).need, '');
  assertEqual(rideOption({ money: 0, rides: {} }, 'walk', CONFIG).tag, '', 'walking is free: no Owned line');
});
test('1.2 review: the shortfall follows the money as it changes', () => {
  let s = { money: 100000, rides: {} };
  assertEqual(rideOption(s, 'car', CONFIG).need, 'Need ₦300,000 more'); assertEqual(rideOption(s, 'scooter', CONFIG).act, 'buy');
  let r = buyRide(s, 'bicycle', CONFIG); s = { money: r.money, rides: r.rides };
  assertEqual(rideOption(s, 'car', CONFIG).need, 'Need ₦325,000 more'); assertEqual(rideOption(s, 'scooter', CONFIG).act, 'buy');
  r = buyRide(s, 'scooter', CONFIG); s = { money: r.money, rides: r.rides }; assertEqual(s.money, 15000);
  assertEqual(rideOption(s, 'car', CONFIG).need, 'Need ₦385,000 more');
  s.money += 7800; assertEqual(rideOption(s, 'car', CONFIG).need, 'Need ₦377,200 more');
});
test('1.2 review: every option is exactly one of start, buy, short, and only buy has a question', () => {
  for (const money of [0, 24999, 25000, 59999, 60000, 399999, 400000]) for (const rides of [{}, { bicycle: true }, { bicycle: true, scooter: true, car: true }]) for (const id of rideIds(CONFIG)) {
    const o = rideOption({ money, rides }, id, CONFIG), st = rideStatus({ money, rides }, id, CONFIG), b = buyRide({ money, rides }, id, CONFIG);
    assert(['start', 'buy', 'short'].indexOf(o.act) >= 0); assertEqual(o.act === 'buy', b.ok, id + ' at ' + money);
    assertEqual(!!o.confirm, o.act === 'buy'); assertEqual(!!o.need, o.act === 'short'); assertEqual(o.act === 'start', st.owned);
    if (o.confirm) assertEqual(o.confirm, 'Buy the ' + CONFIG.transport[id].name + ' for ' + moneyText(CONFIG.transport[id].price) + '?');
  }
});

/* ---- 3. the balance counting down ---- */
test('1.2 review: the count lands exactly on the new balance, even when the target moves meanwhile', () => {
  assertEqual(countStep(100000, 75000, 1), 75000); assertEqual(countStep(100000, 82800, 1), 82800); assertEqual(countStep(100000, 15000, 1.0001), 15000);
  let target = 67200; const seen = [];
  for (let i = 0; i <= 10; i++) { if (i > 3 && target < 75000) target += 1300; seen.push(countStep(100000, target, i / 10)); }
  assertEqual(seen[seen.length - 1], target); assert(seen.every((v) => v >= 0 && v === Math.round(v)));
  assertEqual(countStep(5000, 0, 1), 0); assertEqual(countStep(5000, -300, 1), 0); assertEqual(countStep(5000, -300, 0.5) >= 0, true);
  assertEqual(countStep(75000, 82800, 1), 82800, 'it can also count up');
});

/* ---- 4 and 5. main.js: money and rides only through logic; no prices of its own ---- */
test('1.2 review: main.js sets game.rides only from logic.buyRide and game.ride only when starting', () => {
  const src = readText('street_src/main.js'); if (src === null) return;   /* no file access on this runner: skipped */
  const all = (re) => { const out = []; let m; while ((m = re.exec(src))) out.push(m[1].trim()); return out; };
  assertEqual(all(/game\.rides\s*=(?!=)\s*([^;]+);/g), ['took.rides']);
  assertEqual(all(/game\.ride\s*=(?!=)\s*([^;]+);/g), ['id']);
  const at = src.indexOf('function pickBuy(id)'), body = at < 0 ? '' : src.slice(at, src.indexOf('\nfunction ', at + 10));
  assert(body.indexOf('logic.buyRide(game, id, CONFIG)') > 0, 'pickBuy does not go through logic.buyRide');
  assert(/function pickStart\(id\)[^\n]*\n\s*if \(job\.state !== 'offer' \|\| rideOpt\(id\)\.act !== 'start'\) return;/.test(src), 'pickStart must refuse anything not owned');
  assert(!/game\.rides\s*\[[^\]]+\]\s*=(?!=)/.test(src) && !/game\.rides\.\w+\s*=(?!=)/.test(src), 'game.rides is changed in place somewhere');
});
test('1.2 review: transport names, prices and speeds are only in config.js', () => {
  for (const f of ['street_src/main.js', 'street_src/index.html', 'street_src/logic.js']) {
    const src = readText(f); if (src === null) return;   /* no file access on this runner: skipped */
    for (const word of ['MODES', 'MODE_IDS', 'skate', "'bike'", 'bike:', '25,000', '60,000', '400,000', '400000', '60000']) assert(src.indexOf(word) < 0, f + ' still has ' + word);
    /* 25000, 90000 and 180000 are also furniture prices (CATALOG), so those are checked next to a ride's name only */
    assert(!/(walk|bicycle|scooter|car)\s*:\s*\{[^}]*(price|speed)\s*:\s*\d/.test(src), f + ' has a ride price or speed of its own');
  }
  const cfg = readText('street_src/config.js'); if (cfg === null) return;
  assertEqual(PAID.map((id) => CONFIG.transport[id].price), [25000, 60000, 400000]); assertEqual(rideIds(CONFIG), ['walk', 'bicycle', 'scooter', 'car']);
});
test('1.2 review: on the keyboard Enter never buys', () => {
  const src = readText('street_src/main.js'); if (src === null) return;   /* no file access on this runner: skipped */
  const line = src.split('\n').filter((l) => l.indexOf("e.code === 'Enter'") >= 0 && l.indexOf('pickStart') >= 0);
  assertEqual(line.length, 1); assert(line[0].indexOf('pickBuy') < 0, 'the Enter key reaches pickBuy');
});
test('1.2 review: the keyboard lets go of keys (keyup is listened for on its own line)', () => {
  const src = readText('street_src/main.js'); if (src === null) return;   /* no file access on this runner: skipped */
  assert(/^\s*window\.addEventListener\('keyup', \(e\) => \{ keys\[e\.code\] = 0; \}\);/m.test(src), 'the keyup listener is missing or commented out');
});

/* ---- 10. credits ---- */
test('1.2 review: the scooter model is credited with its author and licence', () => {
  const src = readText('street_src/models/CREDITS.txt'); if (src === null) return;   /* no file access on this runner: skipped */
  const line = src.split('\n').filter((l) => l.indexOf('ride_scooter.glb') === 0);
  assertEqual(line.length, 1); assert(/"Vino" by minghauLoh/.test(line[0]) && /CC BY 4\.0/.test(line[0]) && /sketchfab\.com/.test(line[0]), 'author, source or licence missing');
});
