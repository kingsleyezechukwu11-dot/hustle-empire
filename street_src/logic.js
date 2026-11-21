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
  const k = t >= 1 ? 1 : t <= 0 ? 0 : 1 - Math.pow(1 - t, 3);
  return Math.max(0, Math.round(bal(from) + (bal(to) - bal(from)) * k));
}

/* ---------------- starting and loading ---------------- */
export function freshGame(CONFIG) { return CONFIG.startMoney; }

// A saved number is kept as it is (never below 0); anything else starts fresh.
export function loadMoney(saved, CONFIG) { return typeof saved === 'number' && isFinite(saved) ? Math.max(0, saved) : freshGame(CONFIG); }
