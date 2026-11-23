// Task 1.3 + 1.4: speeds, where each ride may go, packages, pay and time.
import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import { rideSpeed, footSpeed, rideTurn, mayGo, ZONES, rideStep, rideAim, routeFrom, levelRules, levelBonus, tripBands, packageFits, packagesFor, pickPackage, offerTerms, rideIds, countStep } from '../logic.js';

const RIDES = rideIds(CONFIG), PKGS = Object.keys(CONFIG.packages), near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

/* ---- speeds ---- */
test('footSpeed: walk 2, sprint 5.2', () => { assertEqual(CONFIG.walkSpeed, 2); assertEqual(footSpeed(false, CONFIG), 2); assert(near(footSpeed(true, CONFIG), 5.2)); });
test('rideSpeed: walking speed x each ride\'s multiple', () => {
  assert(near(rideSpeed('walk', CONFIG), 2)); assert(near(rideSpeed('bicycle', CONFIG), 10.8)); assert(near(rideSpeed('scooter', CONFIG), 16.4)); assert(near(rideSpeed('car', CONFIG), 21));   /* raised about 30% and then 25% more by the owner on 2026-11-23 */
  for (const id of RIDES) assert(near(rideSpeed(id, CONFIG), CONFIG.walkSpeed * CONFIG.transport[id].speed));
  assertEqual(rideSpeed('rocket', CONFIG), 0); assertEqual(rideSpeed(undefined, CONFIG), 0); assertEqual(rideSpeed('toString', CONFIG), 0);
});
test('rideSpeed: each ride is faster than the one before, and every ride beats a sprint', () => {
  for (let i = 1; i < RIDES.length; i++) assert(rideSpeed(RIDES[i], CONFIG) > rideSpeed(RIDES[i - 1], CONFIG), RIDES[i]);
  assert(rideSpeed('bicycle', CONFIG) > footSpeed(true, CONFIG));
});
test('rideTurn: the car turns clearly slower than the scooter', () => {
  assert(near(rideTurn('car', CONFIG), CONFIG.transport.car.turnRate * 0.55)); assert(rideTurn('car', CONFIG) < rideTurn('scooter', CONFIG) * 0.7);
  assert(near(rideTurn('scooter', CONFIG), CONFIG.transport.scooter.turnRate)); assertEqual(rideTurn('nope', CONFIG), 0);
});
test('config: every vehicle has accel, brake, turnRate and reverse; only a bicycle may pivot on the spot', () => {
  for (const id of RIDES.filter((r) => r !== 'walk')) { const t = CONFIG.transport[id]; for (const k of ['accel', 'brake', 'turnRate']) assert(t[k] > 0, id + '.' + k); assert(t.reverse >= 0, id + '.reverse'); }
  assert(CONFIG.transport.bicycle.pivot > 0); assertEqual(CONFIG.transport.scooter.pivot, 0); assertEqual(CONFIG.transport.car.pivot, 0);
  assertEqual(CONFIG.transport.bicycle.reverse, 0); assert(CONFIG.transport.scooter.reverse > 0 && CONFIG.transport.car.reverse > 0);
});

/* ---- where each may go ---- */
test('mayGo: every ride on every kind of ground', () => {
  const want = { walk: [1, 1, 1, 1, 1], bicycle: [1, 1, 1, 0, 0], scooter: [1, 0, 0, 0, 0], car: [1, 0, 0, 0, 0] };
  assertEqual(ZONES, ['road', 'pavement', 'alley', 'market', 'indoors']);
  for (const id of RIDES) ZONES.forEach((z, i) => assertEqual(mayGo(id, z, CONFIG), !!want[id][i], id + ' on ' + z));
});
test('mayGo: unknown rides, unknown ground and no ground are refused', () => {
  for (const z of [null, undefined, '', 'sea', 'toString', 0]) for (const id of RIDES) assertEqual(mayGo(id, z, CONFIG), false, id + ' on ' + z);
  for (const id of ['rocket', null, undefined, 'constructor']) for (const z of ZONES) assertEqual(mayGo(id, z, CONFIG), false);
  assertEqual(mayGo('walk', 'road', { transport: { walk: { go: { road: 'yes' } } } }), false, 'only true counts');
});

/* ---- gaining and losing speed ---- */
test('rideStep: reaches top speed and never passes it', () => {
  for (const id of ['bicycle', 'scooter', 'car']) { let v = 0; const top = rideSpeed(id, CONFIG);
    for (let i = 0; i < 600; i++) { const n = rideStep(v, 99, 1 / 60, id, CONFIG); assert(n >= v - 1e-9 && n <= top + 1e-9, id); v = n; }
    assert(near(v, top, 1e-6), id + ' top ' + v); }
});
test('rideStep: gains at accel, brakes at brake, harder when told', () => {
  const c = CONFIG.transport.car; assert(near(rideStep(0, 99, 0.1, 'car', CONFIG), c.accel * 0.1)); assert(near(rideStep(5, 0, 0.1, 'car', CONFIG), 5 - c.brake * 0.1));
  assert(near(rideStep(5, 0, 0.1, 'car', CONFIG, 2), 5 - c.brake * 0.2)); assertEqual(rideStep(0.2, 0, 0.1, 'car', CONFIG), 0);
});
test('rideStep: backwards only as fast as reverse allows, and never straight from forwards', () => {
  let v = 0; for (let i = 0; i < 300; i++) v = rideStep(v, -99, 1 / 60, 'car', CONFIG); assert(near(v, -CONFIG.transport.car.reverse, 1e-6));
  v = 0; for (let i = 0; i < 300; i++) v = rideStep(v, -99, 1 / 60, 'bicycle', CONFIG); assertEqual(v, 0, 'a bicycle has no reverse');
  assert(rideStep(4, -1, 0.05, 'car', CONFIG) > 0, 'it slows first'); assertEqual(rideStep(0.1, -1, 0.05, 'car', CONFIG), 0, 'and stops before backing');
});
test('rideStep: bad values never give NaN', () => {
  for (const a of [NaN, undefined, null, Infinity, 'x']) { const v = rideStep(a, a, a, 'car', CONFIG, a); assert(typeof v === 'number' && isFinite(v), String(a)); }
  assertEqual(rideStep(3, 3, 0.1, 'rocket', CONFIG), 0);
});

/* ---- levels ---- */
test('levelRules: level 1 and how it grows', () => {
  const a = levelRules(1, CONFIG), b = levelRules(4, CONFIG);
  assertEqual(a.n, 3); assertEqual(a.mult, 1); assertEqual(a.near, [75, 139]); assertEqual(a.far, [118, 212]); assert(near(a.slack, 1.34));
  assertEqual(b.n, 6); assert(b.mult > a.mult && b.far[1] > a.far[1] && b.slack < a.slack); assert(levelRules(99, CONFIG).slack >= CONFIG.levels.slackMin);
  assertEqual(levelRules(undefined, CONFIG), a); assertEqual(levelRules(-3, CONFIG), a); assertEqual(levelRules(NaN, CONFIG), a);
  assertEqual(levelBonus(1, CONFIG), 5000); assertEqual(levelBonus(3, CONFIG), 15000);
});
test('tripBands: faster rides get longer trips', () => {
  let last = 0; for (const id of RIDES) { const b = tripBands(1, id, CONFIG); assert(b.near[0] < b.near[1] && b.far[0] < b.far[1], id); assert(b.far[1] > last, id + ' is not longer'); last = b.far[1]; }
  assert(tripBands(1, 'car', CONFIG).far[0] >= 2 * tripBands(1, 'walk', CONFIG).far[0], 'a car run is a real drive');
});

/* ---- packages ---- */
test('packages: small, medium and big, with pay and value ranges', () => {
  assertEqual(PKGS, ['small', 'medium', 'big']);
  for (const id of PKGS) { const p = CONFIG.packages[id]; assert(p.name && p.payMult >= 1 && p.value[0] > 0 && p.value[1] > p.value[0] && p.chance > 0, id); }
  assert(CONFIG.packages.big.payMult > CONFIG.packages.medium.payMult && CONFIG.packages.medium.payMult > CONFIG.packages.small.payMult);
  assertEqual(CONFIG.packages.big.big, true); assert(!CONFIG.packages.small.big && !CONFIG.packages.medium.big);
});
test('packages: big ones never go by bicycle or scooter; they do by car and on foot', () => {
  assertEqual(packagesFor('walk', CONFIG), ['small', 'medium', 'big']); assertEqual(packagesFor('car', CONFIG), ['small', 'medium', 'big']);
  assertEqual(packagesFor('bicycle', CONFIG), ['small', 'medium']); assertEqual(packagesFor('scooter', CONFIG), ['small', 'medium']);
  assertEqual(packageFits('big', 'bicycle', CONFIG), false); assertEqual(packageFits('big', 'scooter', CONFIG), false); assertEqual(packageFits('nope', 'car', CONFIG), false); assertEqual(packagesFor('rocket', CONFIG), []);
});
test('pickPackage: every roll gives a package that fits, with a value in its range', () => {
  const seen = {};
  for (const id of RIDES) for (let i = 0; i <= 200; i++) for (const r2 of [0, 0.37, 0.999999]) { const p = pickPackage(id, i / 200, CONFIG, r2), P = CONFIG.packages[p.id];
    assert(packageFits(p.id, id, CONFIG), id + ' was given ' + p.id); assert(p.value >= P.value[0] && p.value <= P.value[1] && p.value % 1000 === 0, p.id + ' worth ' + p.value); seen[id + p.id] = 1; }
  assert(seen.walkbig && seen.carbig && seen.bicyclemedium && !seen.bicyclebig && !seen.scooterbig);
  assertEqual(pickPackage('rocket', 0.5, CONFIG), null); assert(pickPackage('walk', NaN, CONFIG).id === 'small'); assert(pickPackage('walk', 7, CONFIG).id === 'big');
});

/* ---- pay and time ---- */
const DIST = [0, 1, 20, 60, 110, 180, 260, 400, 700, 1500, 9000];
test('offerTerms: pay is always 3,000 to 15,000 in hundreds, time is positive (wide sweep)', () => {
  let lo = Infinity, hi = -Infinity;
  for (const ride of RIDES) for (const pkg of PKGS) for (let level = 1; level <= 40; level += 3) for (const d1 of DIST) for (const d2 of DIST) {
    const t = offerTerms({ d1, d2, level, ride, pkg }, CONFIG);
    assert(t.pay >= 3000 && t.pay <= 15000 && t.pay % 100 === 0, [ride, pkg, level, d1, d2, t.pay].join(' ')); assert(t.time > 0 && isFinite(t.time) && t.time % 5 === 0, 'time ' + t.time);
    lo = Math.min(lo, t.pay); hi = Math.max(hi, t.pay); }
  assertEqual(lo, CONFIG.pay.min); assertEqual(hi, CONFIG.pay.max);
});
test('offerTerms: bad values still pay within the range and never give NaN', () => {
  for (const o of [undefined, null, {}, { d1: NaN, d2: -50, level: 'x', ride: 'rocket', pkg: 'huge' }, { d1: Infinity, d2: Infinity, level: Infinity, ride: 'car', pkg: 'big' }]) {
    const t = offerTerms(o, CONFIG); assert(t.pay >= 3000 && t.pay <= 15000, 'pay ' + t.pay); assert(t.time > 0 && isFinite(t.time), 'time ' + t.time); }
});
test('offerTerms: pay and time never fall as the distance grows', () => {
  for (const ride of RIDES) for (const pkg of PKGS) for (const level of [1, 3, 8]) { let p = 0, t = 0;
    for (let d = 0; d <= 1200; d += 25) { const a = offerTerms({ d1: 100, d2: d, level, ride, pkg }, CONFIG), b = offerTerms({ d1: d, d2: 100, level, ride, pkg }, CONFIG);
      assert(a.pay >= p && a.time >= t, ride + ' fell at ' + d); p = a.pay; t = a.time; assert(b.pay >= 3000 && b.time > 0); } }
  assert(offerTerms({ d1: 80, d2: 300, level: 1, ride: 'walk', pkg: 'small' }, CONFIG).pay > offerTerms({ d1: 80, d2: 100, level: 1, ride: 'walk', pkg: 'small' }, CONFIG).pay);
});
test('offerTerms: pay rises with the package and with the level', () => {
  const o = { d1: 80, d2: 130, level: 1, ride: 'walk' }, s = offerTerms({ ...o, pkg: 'small' }, CONFIG).pay, m = offerTerms({ ...o, pkg: 'medium' }, CONFIG).pay, b = offerTerms({ ...o, pkg: 'big' }, CONFIG).pay;
  assert(s < m && m < b, [s, m, b].join(' ')); assert(offerTerms({ ...o, pkg: 'small', level: 4 }, CONFIG).pay > s);
});
test('offerTerms: a faster ride gets less time per metre, but still more than flat out needs', () => {
  for (const level of [1, 5, 20]) { let last = Infinity;
    for (const ride of RIDES) { const d = 2000, t = offerTerms({ d1: d / 2, d2: d / 2, level, ride, pkg: 'small' }, CONFIG).time, per = t / d;
      assert(per < last, ride + ' is not quicker per metre at level ' + level); last = per;
      const flat = d / (ride === 'walk' ? footSpeed(true, CONFIG) : rideSpeed(ride, CONFIG)); assert(t > flat * 1.1, ride + ' cannot be done in time at level ' + level); } }
});
test('offerTerms: a big package by bicycle or scooter is paid as a small one, and says so', () => {
  const o = { d1: 100, d2: 200, level: 1 };
  for (const ride of ['bicycle', 'scooter']) { const t = offerTerms({ ...o, ride, pkg: 'big' }, CONFIG); assertEqual(t.pkg, 'small'); assertEqual(t.pay, offerTerms({ ...o, ride, pkg: 'small' }, CONFIG).pay); }
  assertEqual(offerTerms({ ...o, ride: 'car', pkg: 'big' }, CONFIG).pkg, 'big'); assertEqual(offerTerms({ ...o, ride: 'walk', pkg: 'big' }, CONFIG).pkg, 'big');
});
test('economy: on foot at level 1 a typical run pays about 3,000 to 6,000; a bicycle is a few runs, a car is real progress', () => {
  const B = tripBands(1, 'walk', CONFIG), mid = (b) => (b[0] + b[1]) / 2, pays = PKGS.map((pkg) => offerTerms({ d1: mid(B.near), d2: mid(B.far), level: 1, ride: 'walk', pkg }, CONFIG).pay);
  const w = PKGS.map((p) => CONFIG.packages[p].chance), avg = pays.reduce((s, p, i) => s + p * w[i], 0) / w.reduce((a, b) => a + b, 0);
  assert(pays[0] >= 3000 && pays[1] <= 6000, 'small ' + pays[0] + ', medium ' + pays[1]); assert(avg >= 3000 && avg <= 6000, 'average ' + avg);
  const runsBike = CONFIG.transport.bicycle.price / avg, runsCar = CONFIG.transport.car.price / avg; assert(runsBike >= 4 && runsBike <= 8, 'bicycle in ' + runsBike + ' runs'); assert(runsCar > 40, 'car in ' + runsCar + ' runs');
});

/* ---- from the last review ---- */
test('countStep: never NaN, whatever it is given', () => {
  for (const t of [NaN, undefined, null, 'x', Infinity, -Infinity]) for (const a of [NaN, 5000, undefined]) { const v = countStep(a, 2000, t); assert(typeof v === 'number' && v === v && v >= 0, String(t) + ' ' + String(a) + ' gave ' + v); }
  assertEqual(countStep(5000, 2000, NaN), 5000); assertEqual(countStep(5000, 2000, Infinity), 2000);
});

/* ---- main.js keeps to the rules (static checks; skipped where the runner cannot read files) ---- */
const readText = (path) => {
  try { if (typeof readFile === 'function') return readFile(path); } catch (e) { return null; }
  try { if (typeof require === 'function') return require('fs').readFileSync(path, 'utf8'); } catch (e) { return null; }
  return null;
};
test('main.js: speeds, zones, pay and time come from logic and config, not from numbers of its own', () => {
  const src = readText('street_src/main.js'); if (src === null) return;
  for (const need of ['logic.footSpeed(true, CONFIG)', 'logic.footSpeed(false, CONFIG)', 'logic.rideSpeed(id, CONFIG)', 'logic.rideStep(', 'logic.mayGo(id, zoneAt(x, z), CONFIG)', 'logic.offerTerms(', 'logic.tripBands(', 'logic.pickPackage(', 'logic.levelBonus('])
    assert(src.indexOf(need) >= 0, 'main.js does not use ' + need);
  for (const old of ['run ? 5.2', '1.75 * Math.min', '2500 + d2', '/ 2.9 *', '5000 * J.level', 'near: [75, 135']) assert(src.indexOf(old) < 0, 'main.js still has the old literal: ' + old);
  assert(!/(accel|brake|turnRate|reverse|payMult|walkSpeed)\s*:\s*\d/.test(src), 'main.js has a ride or package number of its own');
});
test('main.js: inside the car a traffic car cannot knock you down; on foot and on two wheels it still can', () => {
  const src = readText('street_src/main.js'); if (src === null) return;
  assert(/function carHit\(c\) \{\n\s*if \(ride\.on && ride\.id === 'car'\) return;/.test(src), 'carHit must be ignored only inside the car');
});
test('main.js: the fixes from the last review are in', () => {
  const src = readText('street_src/main.js'); if (src === null) return;
  const body = (name) => { const at = src.indexOf('function ' + name + '('); return at < 0 ? '' : src.slice(at, src.indexOf('\nfunction ', at + 10)); };
  assert(body('pickStart').indexOf('CONFIG.ride.startGuard') > 0, 'pickStart does not wait after a purchase'); assert(CONFIG.ride.startGuard >= 300 && CONFIG.ride.startGuard <= 600);
  assert(/function closeErrand\(\) \{[^\n]*job\.ask = null;/.test(src), 'closeErrand does not clear job.ask');
  assert(/function pickBuy\(id\)[^\n]*\n\s*if \(job\.state !== 'offer' \|\| errandEl\.hidden\) return;/.test(src), 'pickBuy works with the picker shut');
  assert(body('pickStart').indexOf('job.offer = o') > 0 && body('pickTerms').indexOf('job.offers[id]') > 0, 'the card and Start do not use the same terms');
});

/* ---- second review: a stick behind you turns you round; only a blocked nose backs up ---- */
test('rideAim: wherever the stick points, an unblocked ride goes forwards (a stick behind is a U-turn, not a reverse)', () => {
  for (const id of ['bicycle', 'scooter', 'car']) for (let a = -Math.PI; a <= Math.PI + 1e-9; a += Math.PI / 12) for (const push of [0.2, 0.8, 1]) {
    const w = rideAim(a, push, false, id, CONFIG); assert(w > 0 && w <= rideSpeed(id, CONFIG) + 1e-9, id + ' at ' + a.toFixed(2) + ' aims for ' + w); }
  for (const id of ['scooter', 'car']) { let v = 0; for (let i = 0; i < 90; i++) { v = rideStep(v, rideAim(Math.PI, 1, false, id, CONFIG), 1 / 30, id, CONFIG); assert(v >= 0, id + ' backed up'); }
    assert(near(v, rideSpeed(id, CONFIG) * CONFIG.ride.slowTurn, 1e-6), id + ' should creep round at the slow-turn speed, is at ' + v); }
});
test('rideAim: straight ahead is flat out, a sharp turn is slower, and it never falls as the turn eases', () => {
  for (const id of ['bicycle', 'scooter', 'car']) { const top = rideSpeed(id, CONFIG); assert(near(rideAim(0, 1, false, id, CONFIG), top)); assert(near(rideAim(0.3, 1, false, id, CONFIG), top));
    assert(near(rideAim(Math.PI, 1, false, id, CONFIG), top * CONFIG.ride.slowTurn)); let last = Infinity; for (let a = 0; a <= Math.PI; a += 0.1) { const w = rideAim(a, 1, false, id, CONFIG); assert(w <= last + 1e-9); last = w; }
    assertEqual(rideAim(0, 0, false, id, CONFIG), 0); assert(near(rideAim(-2.5, 1, false, id, CONFIG), rideAim(2.5, 1, false, id, CONFIG)), 'left and right alike'); }
});
test('rideAim: a blocked nose backs up at the reverse speed (a bicycle, which has none, stays put); bad values give no NaN', () => {
  assertEqual(rideAim(0, 1, true, 'car', CONFIG), -CONFIG.transport.car.reverse); assertEqual(rideAim(3, 0.5, true, 'scooter', CONFIG), -CONFIG.transport.scooter.reverse); assertEqual(rideAim(0, 1, true, 'bicycle', CONFIG), 0);
  let v = 0, m = 0; for (let i = 0; i < CONFIG.ride.backTime * 30; i++) { v = rideStep(v, rideAim(0, 1, true, 'car', CONFIG), 1 / 30, 'car', CONFIG); m += -v / 30; } assert(m > 0.5 && m <= CONFIG.ride.backDist, 'the car backs ' + m + ' m');
  for (const a of [NaN, undefined, null, 'x', Infinity]) { const w = rideAim(a, a, false, 'car', CONFIG); assert(typeof w === 'number' && isFinite(w), String(a)); } assertEqual(rideAim(0, 1, false, 'rocket', CONFIG), 0);
});

/* ---- second review: distances are measured by the streets ---- */
const G = { pitch: 93.6, f: 10.8, lane: (i, j) => ((i * 7 + j * 13) % 2 === 0 ? 'z' : 'x') }, P = G.pitch, F0 = G.f;
test('routeFrom: along one road it is the straight distance; round a corner it is the two sides', () => {
  const d = routeFrom(30, F0, G, true); assert(near(d(80, F0), 50, 1e-6)); assert(near(d(30 + 3 * P, F0), 3 * P, 1e-6), 'straight through junctions');
  assert(near(d(P + F0, 40), (P + F0 - 30) + (40 - F0), 1e-6), 'to the corner, then up'); assert(near(d(30, F0 + 9) , 9, 1e-6), 'the pavement is 9 m off the centre line');
});
test('routeFrom: doors on parallel streets are a trip round the block, shorter where an inner street cuts through (if you may use it)', () => {
  /* block (0, 0) lies between the roads z = f and z = f + pitch; its inner street runs 'z' (G.lane(0, 0)), through x = f + pitch / 2 */
  assertEqual(G.lane(0, 0), 'z'); const ax = F0 + P / 2 + 20, bx = F0 + P / 2 - 10, crow = 30 + P;
  const walk = routeFrom(ax, F0, G, true)(bx, F0 + P), drive = routeFrom(ax, F0, G, false)(bx, F0 + P);
  assert(near(walk, 20 + P + 10, 1e-6), 'through the inner street: ' + walk); assert(near(drive, (P / 2 - 20) + P + (P / 2 + 10), 1e-6), 'round by the junction: ' + drive);
  assert(drive > walk && walk >= crow - 1e-6 && drive > crow * 1.3, 'the road route is the long way round');
});
test('routeFrom: never shorter than the straight-line sum, the same both ways, and from inside an inner street you first reach its end', () => {
  for (const [ax, az, bx, bz] of [[30, F0 + 8, 250, F0 + 2 * P - 8], [F0 - 9, 60, F0 + 3 * P + 9, -120], [40, F0, 41, F0 + P], [-200, F0 - P, 300, F0 + 2 * P]]) for (const al of [true, false]) {
    const ab = routeFrom(ax, az, G, al)(bx, bz), ba = routeFrom(bx, bz, G, al)(ax, az); assert(isFinite(ab) && near(ab, ba, 1e-6), 'there ' + ab + ', back ' + ba); assert(ab >= Math.abs(ax - bx) + Math.abs(az - bz) - 18.1, 'shorter than possible: ' + ab); }
  const mid = F0 + P / 2, inLane = routeFrom(mid, F0 + 30, G, false)(mid + 20, F0); assert(near(inLane, 30 + 20, 1e-6), 'out of the inner street to the road, then along: ' + inLane);
});

/* ---- second review: the clock, with distances by the street ---- */
test('clock on foot: plain walking fits at levels 1 to 3 on any route; by level 10 it needs running no more than a third of the time', () => {
  const walk = footSpeed(false, CONFIG), mixed = (2 * walk + footSpeed(true, CONFIG)) / 3, BEND = 3.4;
  for (let level = 1; level <= 10; level++) { const B = tripBands(level, 'walk', CONFIG);
    for (const [d1, d2] of [[15, 15], [B.near[0], B.far[0]], [B.near[1], B.far[1]], [300, 500]]) { const have = offerTerms({ d1, d2, level, ride: 'walk', pkg: 'small' }, CONFIG).time;
      if (level <= 3) assert((d1 + d2) / walk + BEND <= have, 'level ' + level + ': walking ' + (d1 + d2) + ' m needs ' + ((d1 + d2) / walk + BEND).toFixed(0) + ' s of ' + have);
      assert((d1 + d2) / mixed + BEND <= have, 'level ' + level + ': ' + (d1 + d2) + ' m, a third of it running, needs ' + ((d1 + d2) / mixed + BEND).toFixed(0) + ' s of ' + have); } }
});
test('clock: the walk to a ride parked out of reach is added at walking pace', () => {
  const o = { d1: 150, d2: 300, level: 2, ride: 'scooter', pkg: 'small' }, a = offerTerms(o, CONFIG).time, b = offerTerms({ ...o, walk: 41 }, CONFIG).time;
  assert(b - a >= 41 / CONFIG.walkSpeed - 5 && b - a <= 41 / CONFIG.walkSpeed + 5, 'added ' + (b - a) + ' s'); assertEqual(offerTerms({ ...o, walk: -9 }, CONFIG).time, a); assertEqual(offerTerms({ ...o, walk: NaN }, CONFIG).pay, offerTerms(o, CONFIG).pay);
});
test('pay: across levels 1 to 10 the car still pays more for a bigger package and a higher level, and only its best cases reach the top', () => {
  const mid = (b) => (b[0] + b[1]) / 2, at = (level, pkg, ride = 'car') => { const B = tripBands(level, ride, CONFIG); return offerTerms({ d1: mid(B.near), d2: mid(B.far), level, ride, pkg }, CONFIG).pay; };
  for (let L = 1; L <= 10; L++) { assert(at(L, 'small') < at(L, 'medium') && at(L, 'medium') <= at(L, 'big'), 'level ' + L + ': ' + [at(L, 'small'), at(L, 'medium'), at(L, 'big')].join(' ')); assert(at(L, 'medium') < CONFIG.pay.max, 'a medium parcel by car is already at the top at level ' + L);
    if (L > 1) assert(at(L, 'small') > at(L - 1, 'small'), 'level ' + L + ' pays no more than the one before'); }
  assert(at(1, 'big') < CONFIG.pay.max, 'even at level 1 a big parcel by car is at the top'); assert(at(1, 'small', 'walk') >= 3400 && at(1, 'big', 'walk') <= 7000, 'on foot at level 1: ' + at(1, 'small', 'walk') + ' to ' + at(1, 'big', 'walk'));
  for (const [a, b] of [['walk', 'bicycle'], ['bicycle', 'scooter'], ['scooter', 'car']]) assert(at(1, 'small', b) > at(1, 'small', a), b + ' pays no more than ' + a);
});
test('stops: at most one on each leg', () => { assertEqual(CONFIG.stops.perLeg, 1); });
test('main.js: second-review fixes are wired in (street distances, U-turn rule, one stop a leg, corner probes, no "0 Cancelled")', () => {
  const src = readText('street_src/main.js'); if (src === null) return;
  for (const need of ['logic.routeFrom(x, z, STREETS, alleys)', 'logic.rideAim(diff, push, ride.back > 0, id, CONFIG)', 'CONFIG.stops.perLeg', 'walk }, CONFIG)', "if (fine > 0) gain(-fine, 'Cancelled')"]) assert(src.indexOf(need) >= 0, 'main.js lacks ' + need);
  assert(src.indexOf('reverseAngle') < 0 && src.indexOf('tripLen') < 0, 'the old reverse rule or crow-flies distance is still there');
  const m = /const RIDE_PROBES = (\[\[.*?\]\]);/.exec(src); assert(m, 'no probe list'); const probes = JSON.parse(m[1]);
  for (const c of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) assert(probes.some((q) => q[0] === c[0] && q[1] === c[1]), 'no probe at ' + c);
});

/* ---- third review: each step up earns more for a minute of play ---- */
const typical = (ride, level) => { const mid = (b) => (b[0] + b[1]) / 2, B = tripBands(level, ride, CONFIG), d1 = mid(B.near), d2 = mid(B.far), ids = packagesFor(ride, CONFIG);
  let pay = 0, w = 0, time = 0; for (const pkg of ids) { const t = offerTerms({ d1, d2, level, ride, pkg }, CONFIG), c = CONFIG.packages[pkg].chance; pay += t.pay * c; w += c; time = t.time; }
  const played = time * (ride === 'walk' ? CONFIG.time.played.foot : CONFIG.time.played.ride); return { pay: pay / w, secs: played, perMin: pay / w / played * 60 }; };
test('earnings: walk < bicycle < scooter < car for a minute of play, each step at least 10% (about 15%) better, at levels 1, 5 and 10', () => {
  for (const level of [1, 5, 10]) { const per = RIDES.map((r) => typical(r, level).perMin);
    for (let i = 1; i < per.length; i++) { const step = per[i] / per[i - 1]; assert(step >= 1.1, 'level ' + level + ': ' + RIDES[i] + ' earns ' + Math.round(per[i]) + ' a minute against ' + Math.round(per[i - 1]) + ' by ' + RIDES[i - 1] + ' (x' + step.toFixed(2) + ')'); assert(step <= 1.35, RIDES[i] + ' is too far ahead at level ' + level + ': x' + step.toFixed(2)); } }
  const l1 = RIDES.map((r) => typical(r, 1).perMin); for (let i = 1; i < l1.length; i++) assert(l1[i] / l1[i - 1] >= 1.12 && l1[i] / l1[i - 1] <= 1.25, 'level 1 step to ' + RIDES[i] + ': x' + (l1[i] / l1[i - 1]).toFixed(3));
});
test('main.js: traffic is never made passable to a ride, and you never step on from a yard or through a fence', () => {
  const src = readText('street_src/main.js'); if (src === null) return;
  assert(src.indexOf('ghost') < 0, 'something still lets a ride pass through traffic'); assert(src.indexOf('pushOut(); pushOffCars(D.side + pad, D.nose + pad);') > 0, 'cars are not always solid to the ride');
  assert(src.indexOf('if (c && c.see > 0)') > 0, 'the release is not limited to a car that is itself waiting for you');
  assert(src.indexOf('q.yard || !rideClear(px, pz, ride.x, ride.z)') > 0, 'rideSide offers a spot in a yard or behind a fence'); assert(src.indexOf('rideClear(hero.x, hero.z, p[0], p[1]) && rideClear(p[0], p[1], ride.x, ride.z)') > 0, 'rideAct does not check the whole way onto the ride');
});
