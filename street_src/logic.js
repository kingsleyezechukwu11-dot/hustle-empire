// Blocktown rules as pure functions: plain values in, plain values out.
// NO Three.js, NO DOM, NO globals, nothing is changed in place. Unit tested in street_src/tests/logic.test.js.

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);   // anything that is not a real number counts as 0
const bal = (money) => Math.max(0, num(money));                      // a balance is never below 0
const okAmount = (a) => typeof a === 'number' && isFinite(a) && a >= 0;

/* ---------------- money ---------------- */
export function canAfford(money, price) { return okAmount(price) && bal(money) >= price; }

// An exact payment: all of it or none of it.
export function spend(money, amount) {
  const m = bal(money);
  if (!okAmount(amount) || amount > m) return { ok: false, money: m, paid: 0 };
  return { ok: true, money: m - amount, paid: amount };
}

// A fine that takes what you have: at most the amount, never below 0.
export function spendUpTo(money, amount) {
  const m = bal(money), paid = okAmount(amount) ? Math.min(amount, m) : 0;
  return { money: m - paid, paid };
}

export function earn(money, amount) { return bal(money) + (okAmount(amount) ? amount : 0); }

/* ---------------- transport ---------------- */
const rideOf = (id, CONFIG) => (CONFIG && CONFIG.transport && Object.prototype.hasOwnProperty.call(CONFIG.transport, id) ? CONFIG.transport[id] : null);
const owns = (rides, id, ride) => ride.price === 0 || !!(rides && rides[id]);   // walking is free, so it is always owned

export function rideStatus(state, id, CONFIG) {
  const ride = rideOf(id, CONFIG), money = bal(state && state.money);
  if (!ride) return { owned: false, affordable: false, price: 0, shortfall: 0 };
  const owned = owns(state && state.rides, id, ride);
  return { owned, affordable: owned || money >= ride.price, price: ride.price, shortfall: owned ? 0 : Math.max(0, ride.price - money) };
}

// Buy once. Returns the new money and a NEW rides object; the state passed in is not touched.
export function buyRide(state, id, CONFIG) {
  const money = bal(state && state.money), rides = Object.assign({}, state && state.rides), ride = rideOf(id, CONFIG);
  const no = (reason, shortfall) => ({ ok: false, reason, shortfall, money, rides });
  if (!ride) return no('unknown', 0);
  if (owns(rides, id, ride)) return no('owned', 0);
  const s = spend(money, ride.price);
  if (!s.ok) return no('short', ride.price - money);
  rides[id] = true;
  return { ok: true, reason: null, shortfall: 0, money: s.money, rides };
}

// How money is written: ₦12,000 (whole naira, commas every three digits).
export function moneyText(n, sym) {
  const v = Math.round(Math.abs(num(n)));
  return (num(n) < 0 ? '−' : '') + (typeof sym === 'string' ? sym : '₦') + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// The ids of everything you can travel by, in the order the picker shows them.
export function rideIds(CONFIG) { return CONFIG && CONFIG.transport ? Object.keys(CONFIG.transport) : []; }

// What the picker shows for one way to travel:
//   act   'start' (owned: the lime Start button) | 'buy' (the dark price pill, a tap buys) | 'short' (greyed out, nothing can be done)
//   price the price as text ('' when it is free); tag 'Owned' or ''; need 'Need ₦12,000 more' or ''.
export function rideOption(state, id, CONFIG, sym) {
  const ride = rideOf(id, CONFIG), st = rideStatus(state, id, CONFIG);
  if (!ride) return { id, name: '', act: 'short', owned: false, price: '', tag: '', need: '', confirm: '' };
  const act = st.owned ? 'start' : st.affordable ? 'buy' : 'short';
  return { id, name: ride.name, act, owned: st.owned, price: st.price > 0 ? moneyText(st.price, sym) : '', tag: st.owned && st.price > 0 ? 'Owned' : '',
    need: act === 'short' ? 'Need ' + moneyText(st.shortfall, sym) + ' more' : '', confirm: act === 'buy' ? 'Buy the ' + ride.name + ' for ' + moneyText(st.price, sym) + '?' : '' };
}

// Which option the picker opens on: the one you last used if you still own it, else walking.
export function ridePick(state, CONFIG) {
  const ids = rideIds(CONFIG), want = state && state.ride, at = ids.indexOf(want);
  return at >= 0 && rideStatus(state, want, CONFIG).owned ? at : Math.max(0, ids.indexOf('walk'));
}

// One step of the balance counting from one figure to another: t runs 0 to 1, eased, whole naira, never below 0.
export function countStep(from, to, t) {
  const k = t >= 1 ? 1 : !(t > 0) ? 0 : 1 - Math.pow(1 - t, 3);   /* (anything that is not a number counts as the start) */
  return Math.max(0, Math.round(bal(from) + (bal(to) - bal(from)) * k));
}

/* ---------------- moving: speeds and where each ride may go ---------------- */
const pos = (v, d) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : d);   // a real number above 0, or the stand-in

// Metres a second on foot: walking, or sprinting.
export function footSpeed(sprinting, CONFIG) {
  const w = pos(CONFIG && CONFIG.walkSpeed, 0), walk = rideOf('walk', CONFIG);
  return w * (sprinting ? pos(walk && walk.sprint, 1) : 1);
}

// Top speed in metres a second by this ride (walking for 'walk'; 0 for anything unknown).
export function rideSpeed(id, CONFIG) { const r = rideOf(id, CONFIG); return r ? pos(CONFIG.walkSpeed, 0) * pos(r.speed, 0) : 0; }

// Radians a second it can turn at speed.
export function rideTurn(id, CONFIG) { const r = rideOf(id, CONFIG); return r ? pos(r.turnRate, 0) * pos(r.turn, 1) : 0; }

export const ZONES = ['road', 'pavement', 'alley', 'market', 'indoors'];

// May this ride be on this kind of ground? Unknown rides and unknown ground: no.
export function mayGo(id, zone, CONFIG) { const r = rideOf(id, CONFIG); return !!(r && r.go && ZONES.indexOf(zone) >= 0 && r.go[zone] === true); }

// One step of a ride's speed: v metres a second now, want = the speed asked for (below 0 = backwards), dt seconds.
// It gains speed at accel and loses it at brake (harder by `hard` when told to stop at once); never past top or the reverse speed.
export function rideStep(v, want, dt, id, CONFIG, hard) {
  const r = rideOf(id, CONFIG); if (!r) return 0;
  const top = rideSpeed(id, CONFIG), back = pos(r.reverse, 0), w = Math.max(-back, Math.min(top, num(want))), t = Math.max(0, num(dt)); let s = num(v);
  const slowing = Math.abs(w) < Math.abs(s) || w * s < 0, rate = slowing ? pos(r.brake, 1) * pos(hard, 1) : pos(r.accel, 1);
  if (slowing && w * s < 0) { const z = Math.abs(s) - rate * t; return z > 0 ? Math.sign(s) * z : 0; }   /* the other way: stop first */
  s += Math.max(-rate * t, Math.min(rate * t, w - s));
  return Math.max(-back, Math.min(top, s));
}

// The speed a ride should make for. diff = radians between its heading and where the stick points, push = how far the stick is
// pushed (0 to 1), blocked = its nose is against something it may not pass. Always forwards, slower through a sharp turn: a stick
// pointing behind you means "turn round", never "back up". Backwards only to get a blocked nose clear, and only if it can reverse.
export function rideAim(diff, push, blocked, id, CONFIG) {
  const r = rideOf(id, CONFIG); if (!r) return 0; const C = CONFIG.ride, p = Math.max(0, Math.min(1, num(push)));
  if (blocked) return -pos(r.reverse, 0) || 0;
  const sharp = Math.max(0, Math.min(1, (Math.abs(num(diff)) - C.turnFrom) / (C.turnFull - C.turnFrom)));
  return rideSpeed(id, CONFIG) * p * (1 - (1 - C.slowTurn) * sharp);
}

/* ---------------- the streets: how far it really is ---------------- */
// The city is a grid: main roads every `pitch` metres (centre lines at n x pitch + f, both ways), and through the middle of every block
// one inner street joining the two main roads either side of it (lane(i, j) says which way it runs: 'z' or 'x').
// routeFrom(ax, az, G, alleys) works out the shortest way by the streets from A to everywhere near, and returns a function
// (bx, bz) => metres. alleys = may this traveller use the inner streets? G = { pitch, f, lane }.
export function routeFrom(ax, az, G, alleys, reach) {
  const p = G.pitch, f = G.f, R = Math.max(2, reach || 6), h = p / 2;
  const where = (x, z) => { const i = Math.round((x - f) / p), j = Math.round((z - f) / p), dx = Math.abs(x - (i * p + f)), dz = Math.abs(z - (j * p + f));
    return dx <= dz ? { ax: 'z', line: i, s: z, off: dx } : { ax: 'x', line: j, s: x, off: dz }; };              /* the main road it is on (or nearest to), how far along, how far off its centre line */
  const hooks = (w) => { const n = Math.floor((w.s - f) / p), at = w.s - (n * p + f);                             /* the junction before it, the junction after it, and the middle of that stretch (where an inner street may open) */
    return w.ax === 'x' ? [['J', n, w.line, at], ['J', n + 1, w.line, p - at], ['X', n, w.line, Math.abs(at - h)]] : [['J', w.line, n, at], ['J', w.line, n + 1, p - at], ['Z', w.line, n, Math.abs(at - h)]]; };
  const A = where(ax, az), i0 = Math.round((ax - f) / p), j0 = Math.round((az - f) / p), key = (t, i, j) => t + i + ',' + j, dist = new Map(), todo = [];
  const put = (t, i, j, d) => { if (Math.abs(i - i0) > R || Math.abs(j - j0) > R) return; const k = key(t, i, j); if (!(dist.get(k) <= d)) { dist.set(k, d); todo.push([d, t, i, j]); } };
  for (const [t, i, j, d] of hooks(A)) put(t, i, j, d);
  while (todo.length) { let m = 0; for (let q = 1; q < todo.length; q++) if (todo[q][0] < todo[m][0]) m = q; const [d, t, i, j] = todo.splice(m, 1)[0]; if (d > dist.get(key(t, i, j))) continue;
    if (t === 'J') { put('X', i, j, d + h); put('X', i - 1, j, d + h); put('Z', i, j, d + h); put('Z', i, j - 1, d + h); }
    else if (t === 'X') { put('J', i, j, d + h); put('J', i + 1, j, d + h); if (alleys) { if (G.lane(i, j) === 'z') put('X', i, j + 1, d + p); if (G.lane(i, j - 1) === 'z') put('X', i, j - 1, d + p); } }
    else { put('J', i, j, d + h); put('J', i, j + 1, d + h); if (alleys) { if (G.lane(i, j) === 'x') put('Z', i + 1, j, d + p); if (G.lane(i - 1, j) === 'x') put('Z', i - 1, j, d + p); } } }
  return (bx, bz) => { const B = where(bx, bz); let best = A.ax === B.ax && A.line === B.line ? Math.abs(A.s - B.s) : Infinity;   /* on the same road: straight along it */
    for (const [t, i, j, d] of hooks(B)) { const k = dist.get(key(t, i, j)); if (k !== undefined && k + d < best) best = k + d; }
    return best + A.off + B.off; };
}

/* ---------------- errands: levels, packages, pay and time ---------------- */
// What a level asks: runs to finish it, how much more it pays, how far the pickup and the delivery are, how generous the clock is.
export function levelRules(level, CONFIG) {
  const L = Math.max(1, Math.round(pos(level, 1))), c = CONFIG.levels;
  return { n: c.runs + L, mult: 1 + c.payStep * (L - 1), near: [c.near[0], c.near[1] + c.nearGrow * L], far: [c.far[0] + c.farGrow[0] * L, c.far[1] + c.farGrow[1] * L],
    slack: Math.max(c.slackMin, c.slackMax - c.slackStep * L) };
}
export function levelBonus(level, CONFIG) { return CONFIG.levels.bonus * Math.max(1, Math.round(pos(level, 1))); }

// The distances an errand by this ride should cover: the level's distances, stretched for faster rides.
export function tripBands(level, ride, CONFIG) {
  const L = levelRules(level, CONFIG), r = rideOf(ride, CONFIG), k = pos(r && r.trip, 1), m = (b) => [Math.round(b[0] * k), Math.round(b[1] * k)];
  return { near: m(L.near), far: m(L.far) };
}

const pkgOf = (id, CONFIG) => (CONFIG && CONFIG.packages && Object.prototype.hasOwnProperty.call(CONFIG.packages, id) ? CONFIG.packages[id] : null);

// May this package go by this ride? Big ones only by a ride that takes them, or on foot.
export function packageFits(pkg, ride, CONFIG) {
  const p = pkgOf(pkg, CONFIG), r = rideOf(ride, CONFIG); if (!p || !r) return false;
  return !p.big || !!r.bigPackages || ride === 'walk';
}
export function packagesFor(ride, CONFIG) { return CONFIG && CONFIG.packages ? Object.keys(CONFIG.packages).filter((id) => packageFits(id, ride, CONFIG)) : []; }

// Which package an errand by this ride carries: roll and roll2 are numbers from 0 up to (not including) 1.
// Returns { id, value } (value = what the goods are worth, to the nearest thousand), or null for an unknown ride.
export function pickPackage(ride, roll, CONFIG, roll2) {
  const ids = packagesFor(ride, CONFIG); if (!ids.length) return null;
  const total = ids.reduce((s, id) => s + pos(CONFIG.packages[id].chance, 1), 0); let at = Math.min(0.999999, Math.max(0, num(roll))) * total, id = ids[ids.length - 1];
  for (const k of ids) { at -= pos(CONFIG.packages[k].chance, 1); if (at < 0) { id = k; break; } }
  const [lo, hi] = CONFIG.packages[id].value, f = Math.min(1, Math.max(0, num(roll2 === undefined ? roll : roll2)));
  return { id, value: Math.round((lo + (hi - lo) * f) / 1000) * 1000 };
}

// What an errand pays and how long you have: d1 = metres to the pickup, d2 = metres from there to the delivery (both BY THE STREETS,
// see routeFrom), walk = metres you must first walk to your ride (0 when it is beside you).
// A package that may not go by this ride counts as the smallest. Pay is always within CONFIG.pay.min..max.
export function offerTerms(o, CONFIG) {
  const d1 = Math.max(0, num(o && o.d1)), d2 = Math.max(0, num(o && o.d2)), ride = rideOf(o && o.ride, CONFIG) ? o.ride : 'walk', L = levelRules(o && o.level, CONFIG);
  const first = Object.keys(CONFIG.packages)[0], pkg = packageFits(o && o.pkg, ride, CONFIG) ? o.pkg : first, P = CONFIG.packages[pkg], R = CONFIG.payRule, r = CONFIG.transport[ride];
  const raw = (R.base + (d2 * R.perMetre + d1 * R.perMetrePickup) * pos(r.payRate, 1)) * P.payMult * L.mult;   /* (payRate: a faster ride earns a little less per metre, so its longer trips do not all end at the top of the range) */
  const pay = Math.max(CONFIG.pay.min, Math.min(CONFIG.pay.max, Math.round(raw / R.round) * R.round));
  const ref = Math.max(0.1, rideSpeed(ride, CONFIG) * pos(r.pace, 1)), T = CONFIG.time;
  const onFoot = Math.max(0, num(o && o.walk)) / Math.max(0.1, pos(CONFIG.walkSpeed, 1));   /* the walk to where your ride stands, when it could not be brought to you */
  const time = Math.max(T.round, Math.ceil(((d1 + d2) / ref * L.slack + T.fixed + onFoot) / T.round - 1e-9) * T.round);
  return { pay, time, pkg };
}

/* ---------------- starting and loading ---------------- */
export function freshGame(CONFIG) { return CONFIG.startMoney; }

// A saved number is kept as it is (never below 0); anything else starts fresh.
export function loadMoney(saved, CONFIG) { return typeof saved === 'number' && isFinite(saved) ? Math.max(0, saved) : freshGame(CONFIG); }

/* ---------------- police ---------------- */
// What the officer takes: the usual fee when you stopped for him, fineMult times that when you ran and were caught. Never below 0.
export function chaseFine(level, ran, CONFIG) {
  const C = CONFIG && CONFIG.police && CONFIG.police.chase; if (!C) return 0; const L = Math.max(1, Math.floor(num(level)) || 1), r = pos(C.round, 1);
  return Math.max(0, Math.round((pos(C.feeBase, 0) + pos(C.feePerLevel, 0) * L) * (ran ? pos(C.fineMult, 1) : 1) / r) * r);
}

/* ---------------- usernames ---------------- */
// A username: small letters, digits and _ only, at most 15. userName tidies what was typed (or a person's name) into that shape.
export function userName(text) { return String(text === undefined || text === null ? '' : text).toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '').slice(0, 15); }
// What is wrong with a username ('' when it may be used): too short, not starting with a letter, or already somebody's (taken: names in any case).
export function userProblem(user, taken) {
  const u = String(user || ''); if (u.length < 3) return 'Use 3 or more letters'; if (u !== userName(u)) return 'Letters, numbers and _ only'; if (!/^[a-z]/.test(u)) return 'Start with a letter';
  return (taken || []).some((t) => userName(t) === u) ? 'That username is taken' : '';
}
// The nearest free username to the one wanted: itself, or with a number on the end.
export function userFree(want, taken) {
  let base = userName(want); if (!/^[a-z]/.test(base)) base = 'player' + base; while (base.length < 3) base += '_'; if (!userProblem(base, taken)) return base;
  for (let n = 2; n < 1000; n++) { const u = base.slice(0, 15 - String(n).length) + n; if (!userProblem(u, taken)) return u; } return base;
}

// The rides you own once the free ones everybody starts with (CONFIG.startRides) are counted in. A new object: nothing is changed in place.
export function startRides(rides, CONFIG) { const out = Object.assign({}, rides); for (const id of (CONFIG && CONFIG.startRides) || []) if (rideOf(id, CONFIG)) out[id] = true; return out; }
