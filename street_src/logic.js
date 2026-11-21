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

/* ---------------- starting and loading ---------------- */
export function freshGame(CONFIG) { return CONFIG.startMoney; }

// A saved number is kept as it is (never below 0); anything else starts fresh.
export function loadMoney(saved, CONFIG) { return typeof saved === 'number' && isFinite(saved) ? Math.max(0, saved) : freshGame(CONFIG); }
