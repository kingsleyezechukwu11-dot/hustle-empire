// Reviewer's tests for tasks 1.3 + 1.4 (riding and delivery pay). Rules only: no Three.js, no DOM.
// The numbers quoted from play were measured in the built game at 390x844 #lq, driving every run with the stick (no teleporting).
import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import { rideSpeed, footSpeed, rideTurn, mayGo, ZONES, rideStep, levelRules, tripBands, packagesFor, pickPackage, offerTerms, rideIds } from '../logic.js';

const RIDES = rideIds(CONFIG), VEHICLES = RIDES.filter((r) => r !== 'walk'), within = (got, want, share) => Math.abs(got - want) <= want * share;

/* ---- the owner's speeds: walk 1x, sprint 2.6x, bicycle 5.4x, scooter 8.2x, car 10.5x (raised by the owner twice on 2026-11-21 and twice again on 2026-11-23; the walk itself is now 2 m/s) (within 5%) ---- */
test('review: each way of travelling is the owner\'s multiple of walking speed', () => {
  const walk = footSpeed(false, CONFIG), want = { bicycle: 5.4, scooter: 8.2, car: 10.5 };
  assert(walk > 0); assert(within(rideSpeed('walk', CONFIG) / walk, 1, 0.05)); assert(within(footSpeed(true, CONFIG) / walk, 2.6, 0.05), 'sprint');
  for (const id in want) assert(within(rideSpeed(id, CONFIG) / walk, want[id], 0.05), id + ' is ' + rideSpeed(id, CONFIG) / walk + 'x');
});
test('review: the car is clearly slower to turn than everything else, at speed and on the spot', () => {
  for (const id of ['bicycle', 'scooter']) assert(rideTurn('car', CONFIG) <= rideTurn(id, CONFIG) * 0.6, 'car against ' + id);
  assert(!(CONFIG.transport.car.pivot > 0), 'a car cannot turn on the spot');
});

/* ---- driving: what the hero really covers over time ---- */
const cover = (id, secs, fps) => { let v = 0, m = 0; for (let i = 0; i < secs * fps; i++) { v = rideStep(v, 99, 1 / fps, id, CONFIG); m += v / fps; } return { v, m }; };
test('review: held flat out for 20 seconds each vehicle covers its top speed x time, less only the pull-away', () => {
  for (const id of VEHICLES) { const top = rideSpeed(id, CONFIG), T = CONFIG.transport[id], c = cover(id, 20, 30), lost = top * top / (2 * T.accel);
    assert(Math.abs(c.v - top) < 1e-6, id + ' ends at ' + c.v); assert(c.m <= top * 20 + 1e-6, id + ' went further than top speed allows');
    assert(Math.abs(c.m - (top * 20 - lost)) < top * 0.1, id + ' covered ' + c.m + ', expected about ' + (top * 20 - lost));
    assert(within(c.m / 20, top, 0.05), id + ' averages ' + c.m / 20 + ' against ' + top + ' (5%)'); }
});
test('review: the distance covered does not depend on the frame rate (20, 30, 60 a second)', () => {
  for (const id of VEHICLES) { const a = cover(id, 10, 20).m, b = cover(id, 10, 30).m, c = cover(id, 10, 60).m; assert(within(a, c, 0.02) && within(b, c, 0.02), id + ': ' + [a, b, c].join(' ')); }
});
test('review: every vehicle gets to top speed within 2 seconds and stops from it within 1.5', () => {
  for (const id of VEHICLES) { const top = rideSpeed(id, CONFIG), T = CONFIG.transport[id]; assert(top / T.accel <= 2, id + ' takes ' + top / T.accel + ' s to get going'); assert(top / T.brake <= 1.5, id + ' takes ' + top / T.brake + ' s to stop');
    let v = top; for (let i = 0; i < 45; i++) v = rideStep(v, 0, 1 / 30, id, CONFIG); assertEqual(v, 0, id + ' is still rolling after 1.5 s'); }
});
test('review: letting go never rolls it backwards, and a reverse never outruns a walk', () => {
  for (const id of VEHICLES) { let v = rideSpeed(id, CONFIG); for (let i = 0; i < 200; i++) { v = rideStep(v, 0, 1 / 30, id, CONFIG); assert(v >= 0, id + ' rolled back'); }
    assert((CONFIG.transport[id].reverse || 0) < footSpeed(false, CONFIG), id + ' reverses faster than walking'); }
});

/* ---- where each may go ---- */
test('review: every ride answers for every kind of ground, and only walking may be indoors or in the market', () => {
  for (const id of RIDES) { const go = CONFIG.transport[id].go; assertEqual(Object.keys(go).sort(), ZONES.slice().sort(), id + ' go list'); for (const z of ZONES) assertEqual(typeof go[z], 'boolean', id + '.' + z); }
  for (const id of VEHICLES) { assertEqual(mayGo(id, 'indoors', CONFIG), false, id + ' indoors'); assertEqual(mayGo(id, 'market', CONFIG), false, id + ' in the market'); assertEqual(mayGo(id, 'road', CONFIG), true, id + ' on the road'); }
  for (const z of ZONES) assertEqual(mayGo('scooter', z, CONFIG), mayGo('car', z, CONFIG), 'scooter and car differ on ' + z);
  assert(mayGo('bicycle', 'pavement', CONFIG) && mayGo('bicycle', 'alley', CONFIG) && !mayGo('scooter', 'pavement', CONFIG) && !mayGo('car', 'alley', CONFIG));
});

/* ---- pay ---- */
test('review: every offer the game can really make (each ride, levels 1 to 30, its own distances, its own packages) pays 3,000 to 15,000', () => {
  let n = 0;
  for (const ride of RIDES) for (let level = 1; level <= 30; level++) { const B = tripBands(level, ride, CONFIG);
    for (const d1 of [15, B.near[0], (B.near[0] + B.near[1]) / 2, B.near[1]]) for (const d2 of [15, B.far[0], (B.far[0] + B.far[1]) / 2, B.far[1]]) for (let r = 0; r < 1; r += 0.07) {
      const pk = pickPackage(ride, r, CONFIG, r), t = offerTerms({ d1, d2, level, ride, pkg: pk.id }, CONFIG); n++;
      assert(packagesFor(ride, CONFIG).indexOf(t.pkg) >= 0, ride + ' was given ' + t.pkg); assertEqual(t.pkg, pk.id);
      assert(t.pay >= 3000 && t.pay <= 15000 && t.pay % 100 === 0, [ride, level, d1, d2, t.pkg, t.pay].join(' ')); assert(t.time >= 20 && t.time % 5 === 0, 'time ' + t.time); } }
  assert(n > 5000);
});
test('review: the late fine is never more than the pay, and is a whole number of hundreds', () => {
  for (let pay = 3000; pay <= 15000; pay += 100) { const fine = Math.round(pay * CONFIG.lateShare / 100) * 100; assert(fine > 0 && fine < pay && fine % 100 === 0, pay + ' -> ' + fine); }
});
const readText = (path) => {
  try { if (typeof readFile === 'function') return readFile(path); } catch (e) { return null; }
  try { if (typeof require === 'function') return require('fs').readFileSync(path, 'utf8'); } catch (e) { return null; }
  return null;
};
test('review: main.js pays exactly the offer\'s pay, takes the late fine through spendUpTo (never below zero), and ends the ride on every ending', () => {
  const src = readText('street_src/main.js'); if (src === null) return;
  const at = src.indexOf('function endErrand('), body = src.slice(at, src.indexOf('\nfunction ', at + 10));
  assert(body.indexOf('logic.earn(game.money, o.pay)') > 0, 'endErrand does not pay o.pay'); assert(body.indexOf('logic.spendUpTo(game.money, latePenalty(o))') > 0, 'the late fine can go below zero');
  assert(body.indexOf('rideEnd(hit)') > 0, 'endErrand does not send the ride away');
  assert(/const startErrand = [^\n]*rideCall\(job\.offer\.ride\)/.test(src), 'startErrand does not bring the ride the offer was made for');
});

/* ---- the clock: can it be beaten? ---- */
// Offers measure distance as |dx| + |dz| (tripLen). When the two doors are on parallel streets the real way round (the route the map
// draws) is longer by up to a block each leg. Measured in play at level 6 on foot: offer 131 m + 231 m, real route about 541 m.
const BEND = 3.4;                // two bends (pick up, hand over) of 1.7 s each, during which you stand still
const clock = (ride, level, d1, d2) => offerTerms({ d1, d2, level, ride, pkg: 'small' }, CONFIG).time;
test('review: on foot at level 1, a straight route (no detour, nobody stops you) can be WALKED in time without sprinting', () => {
  const B = tripBands(1, 'walk', CONFIG);
  for (const [d1, d2] of [[B.near[0], B.far[0]], [B.near[1], B.far[1]], [(B.near[0] + B.near[1]) / 2, (B.far[0] + B.far[1]) / 2]]) {
    const need = (d1 + d2) / footSpeed(false, CONFIG) + BEND, have = clock('walk', 1, d1, d2); assert(need <= have, 'walking ' + (d1 + d2) + ' m takes ' + need.toFixed(0) + ' s, the clock gives ' + have); }
});
test('review: each vehicle, held at 80% of top speed with 30 s lost to getting on and off, beats the clock at levels 1 to 10', () => {
  for (const id of VEHICLES) for (let level = 1; level <= 10; level++) { const B = tripBands(level, id, CONFIG);
    for (const [d1, d2] of [[B.near[0], B.far[0]], [B.near[1], B.far[1]]]) { const need = (d1 + d2) / (rideSpeed(id, CONFIG) * 0.8) + 30 + BEND, have = clock(id, level, d1, d2);
      assert(need <= have, id + ' level ' + level + ': ' + (d1 + d2) + ' m needs ' + need.toFixed(0) + ' s, the clock gives ' + have); } }
});
// DEFECT (review of 1.3 + 1.4, major): the two tests below FAIL until the clock (or how offers measure distance) is fixed.
// From level 5 the clock on foot cannot be beaten on a parallel-street errand even by sprinting every metre with nobody stopping you.
test('review: on foot at level 6, the errand played in review (card 131 m + 231 m, 541 m by the street) can be done at a flat-out sprint', () => {
  const need = 541 / footSpeed(true, CONFIG) + BEND, have = clock('walk', 6, 131, 231);
  assert(need <= have, 'a perfect run needs ' + need.toFixed(0) + ' s, the clock gives ' + have + ' (in play: late by 2 s)');
});
test('review: on foot, sprinting ALL the way round a parallel-street errand (a block extra each leg), the clock can be beaten at levels 1 to 10', () => {
  const EXTRA = 90; /* metres added to a leg by going round the block when the two doors are on parallel streets (block pitch 93.6) */
  for (let level = 1; level <= 10; level++) { const B = tripBands(level, 'walk', CONFIG), d1 = B.near[1], d2 = (B.far[0] + B.far[1]) / 2; /* both legs long enough to be street-to-street */
    const need = (d1 + d2 + 2 * EXTRA) / footSpeed(true, CONFIG) + BEND, have = clock('walk', level, d1, d2);
    assert(need <= have, 'level ' + level + ': ' + (d1 + d2) + ' m on the card is ' + (d1 + d2 + 2 * EXTRA) + ' m on the street, ' + need.toFixed(0) + ' s at a flat-out sprint; the clock gives ' + have); }
});
