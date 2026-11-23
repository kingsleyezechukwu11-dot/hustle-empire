// Reviewer's tests for the second review of tasks 1.3 + 1.4: street distances, the clock at a plain walk, the U-turn rule, stops, pay.
import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import { rideSpeed, footSpeed, rideAim, routeFrom, tripBands, offerTerms, rideIds } from '../logic.js';

const P = 93.6, F = 10.8, near = (a, b, e = 0.01) => Math.abs(a - b) <= e;
const grid = (lane) => ({ pitch: P, f: F, lane: typeof lane === 'function' ? lane : () => lane });

/* ---- how far it really is by the streets ---- */
test('review 2: along one road the distance is the straight distance', () => {
  for (const alleys of [true, false]) { assert(near(routeFrom(30, F, grid('x'), alleys)(75, F), 45)); assert(near(routeFrom(F, -20, grid('z'), alleys)(F, 200), 220)); }
});
test('review 2: between parallel streets you go round by a junction (147 m, not the 108.6 m a straight sum gives)', () => {
  const d = routeFrom(30, F, grid('x'), false)(45, F + P); assert(near(d, (30 - F) + P + (45 - F)), 'got ' + d);
  assert(d > Math.abs(45 - 30) + P + 30, 'the detour is missing');
});
test('review 2: on foot or by bicycle an inner street that runs the right way is a short cut; a scooter or car never gets it', () => {
  const walk = routeFrom(30, F, grid('z'), true)(45, F + P), drive = routeFrom(30, F, grid('z'), false)(45, F + P), mid = F + P / 2;
  assert(near(walk, Math.abs(30 - mid) + P + Math.abs(mid - 45)), 'by the inner street: ' + walk); assert(near(drive, 147), 'by the junction: ' + drive); assert(walk < drive);
  assert(near(routeFrom(30, F, grid('x'), true)(45, F + P), 147), 'an inner street running the other way is no short cut');
});
test('review 2: street distance is the same both ways, never shorter than a straight line, and inner streets never make it longer', () => {
  let s = 99; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }, lane = (i, j) => ((i * 7 + j * 13) % 3 + 3) % 3 === 0 ? 'z' : 'x';
  const spot = () => { const k = Math.floor(rnd() * 5) - 2, t = (rnd() - 0.5) * 4 * P; return rnd() < 0.5 ? [t, k * P + F] : [k * P + F, t]; };
  for (let n = 0; n < 400; n++) { const a = spot(), b = spot(), G = grid(lane);
    for (const alleys of [true, false]) { const ab = routeFrom(a[0], a[1], G, alleys)(b[0], b[1]), ba = routeFrom(b[0], b[1], G, alleys)(a[0], a[1]);
      assert(isFinite(ab) && ab >= 0, 'no way from ' + a + ' to ' + b); assert(near(ab, ba, 0.01), a + ' -> ' + b + ': ' + ab + ' there, ' + ba + ' back'); assert(ab >= Math.hypot(a[0] - b[0], a[1] - b[1]) - 0.01, 'shorter than a straight line'); }
    assert(routeFrom(a[0], a[1], G, true)(b[0], b[1]) <= routeFrom(a[0], a[1], G, false)(b[0], b[1]) + 0.01, 'inner streets made it longer'); }
});

/* ---- the clock, now that offers are measured by the streets ---- */
const BEND = 3.4, clock = (ride, level, d1, d2, walk) => offerTerms({ d1, d2, level, ride, pkg: 'small', walk }, CONFIG).time;
test('review 2: at a plain walk (no sprint at all) every errand on foot fits the clock at levels 1 to 15, with something to spare', () => {
  for (let level = 1; level <= 15; level++) { const B = tripBands(level, 'walk', CONFIG);
    for (const [d1, d2] of [[B.near[0], B.far[0]], [(B.near[0] + B.near[1]) / 2, (B.far[0] + B.far[1]) / 2], [B.near[1], B.far[1]]]) { const need = (d1 + d2) / footSpeed(false, CONFIG) + BEND, have = clock('walk', level, d1, d2);
      assert(need <= have - 5, 'level ' + level + ': ' + (d1 + d2) + ' m walks in ' + need.toFixed(0) + ' s, the clock gives ' + have); } }
});
test('review 2: at levels 1 to 3 a plain walk still fits after one stop of 10 seconds; sprinting half the way covers two stops at any level', () => {
  for (let level = 1; level <= 3; level++) { const B = tripBands(level, 'walk', CONFIG), d1 = (B.near[0] + B.near[1]) / 2, d2 = (B.far[0] + B.far[1]) / 2;
    assert((d1 + d2) / footSpeed(false, CONFIG) + BEND + 10 <= clock('walk', level, d1, d2), 'level ' + level); }
  for (let level = 1; level <= 15; level++) { const B = tripBands(level, 'walk', CONFIG), D = B.near[1] + B.far[1], half = D / 2 / footSpeed(false, CONFIG) + D / 2 / footSpeed(true, CONFIG);
    assert(half + BEND + 20 <= clock('walk', level, B.near[1], B.far[1]), 'level ' + level + ': ' + (half + BEND + 20).toFixed(0) + ' s against ' + clock('walk', level, B.near[1], B.far[1])); }
});
test('review 2: the clock gets tighter with the level but never tighter than 1.05 x a plain walk, and vehicles get 1.5 to 2 x their top-speed time', () => {
  for (let level = 1; level <= 15; level++) for (const ride of rideIds(CONFIG)) { const B = tripBands(level, ride, CONFIG), D = B.near[1] + B.far[1], x = (clock(ride, level, B.near[1], B.far[1]) - (CONFIG.transport[ride].onOff || 0)) / (D / rideSpeed(ride, CONFIG));   /* (2026-11-23: the seconds for getting on and off are set apart; at the owner's faster speeds they are a large share of a trip) */
    if (ride === 'walk') assert(x >= 1.05 && x <= 1.35, 'walk level ' + level + ': ' + x.toFixed(2)); else assert(x >= 1.5 && x <= 2.0, ride + ' level ' + level + ': ' + x.toFixed(2)); }
});
test('review 2: a ride left on the main road adds the walk to it to the clock, at walking pace', () => {
  for (const ride of ['scooter', 'car']) { const a = clock(ride, 1, 200, 300), b = clock(ride, 1, 200, 300, 41); assert(b - a >= 20 && b - a <= 30, ride + ': ' + (b - a) + ' s for 41 m'); assertEqual(clock(ride, 1, 200, 300, 0), a); assertEqual(clock(ride, 1, 200, 300, NaN), a); assertEqual(clock(ride, 1, 200, 300, -50), a); }
});

/* ---- the stick behind you ---- */
test('review 2: a stick pointing behind you never reverses: it creeps forward round a U-turn; it backs up only when the nose is blocked', () => {
  for (const id of ['bicycle', 'scooter', 'car']) { const top = rideSpeed(id, CONFIG);
    for (let diff = 0; diff <= Math.PI + 0.001; diff += Math.PI / 16) for (const push of [0.2, 0.6, 1]) { const v = rideAim(diff, push, false, id, CONFIG); assert(v > 0 && v <= top * push + 1e-9, id + ' at ' + diff.toFixed(2) + ': ' + v); assert(near(v, rideAim(-diff, push, false, id, CONFIG), 1e-9), 'left and right differ'); }
    assert(near(rideAim(Math.PI, 1, false, id, CONFIG), top * CONFIG.ride.slowTurn, 1e-9), id + ' U-turn speed'); assert(near(rideAim(0, 1, false, id, CONFIG), top, 1e-9));
    const back = rideAim(Math.PI, 1, true, id, CONFIG); assert(id === 'bicycle' ? back === 0 : back < 0 && near(-back, CONFIG.transport[id].reverse, 1e-9), id + ' blocked: ' + back); }
  assert(CONFIG.ride.backTime <= 2 && CONFIG.ride.backDist <= 4, 'it backs up for too long'); assertEqual(rideAim(1, 1, false, 'rocket', CONFIG), 0);
  for (const bad of [NaN, undefined, null, Infinity]) { const v = rideAim(bad, bad, false, 'car', CONFIG); assert(typeof v === 'number' && isFinite(v) && v >= 0, String(bad)); }
});

/* ---- stops and pay ---- */
test('review 2: at most one stop on the way to the pickup and one on the way to the delivery', () => { assertEqual(CONFIG.stops.perLeg, 1); });
test('review 2: by car the top of the pay range is not reached before level 5, and never by a small parcel up to level 10', () => {
  for (let level = 1; level <= 10; level++) { const B = tripBands(level, 'car', CONFIG);
    assert(offerTerms({ d1: B.near[1], d2: B.far[1], level, ride: 'car', pkg: 'small' }, CONFIG).pay < CONFIG.pay.max, 'small at level ' + level);
    if (level < 5) for (const pkg of ['small', 'medium', 'big']) assert(offerTerms({ d1: B.near[1], d2: B.far[1], level, ride: 'car', pkg }, CONFIG).pay < CONFIG.pay.max, pkg + ' at level ' + level); }
});
test('review 2: for the same parcel a faster ride\'s typical errand never pays less than a slower one\'s', () => {
  const R = rideIds(CONFIG);
  for (let level = 1; level <= 10; level++) for (const pkg of ['small', 'medium']) { let last = 0;
    for (const ride of R) { const B = tripBands(level, ride, CONFIG), pay = offerTerms({ d1: (B.near[0] + B.near[1]) / 2, d2: (B.far[0] + B.far[1]) / 2, level, ride, pkg }, CONFIG).pay; assert(pay >= last, ride + ' ' + pkg + ' level ' + level + ': ' + pay + ' after ' + last); last = pay; } }
});
