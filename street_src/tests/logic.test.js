import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import { canAfford, spend, spendUpTo, earn, buyRide, rideStatus, freshGame, loadMoney } from '../logic.js';

const T = CONFIG.transport;

/* ---- config ---- */
test('config: start money and prices are the brief\'s', () => {
  assertEqual(CONFIG.startMoney, 100000);
  assertEqual([T.walk.price, T.bicycle.price, T.scooter.price, T.car.price], [0, 25000, 60000, 400000]);
  assertEqual([T.walk.speed, T.bicycle.speed, T.scooter.speed, T.car.speed], [1, 3.4, 5, 6.4]);
  assertEqual(T.walk.sprint, 2.6); assertEqual(T.car.turn, 0.55); assertEqual(T.car.bigPackages, true);
  assertEqual(CONFIG.pay, { min: 3000, max: 15000 }); assertEqual(CONFIG.treatFee, 3000); assertEqual(CONFIG.lateShare, 0.4);
});
test('config: where each ride may go', () => {
  assertEqual(T.walk.go, { road: true, pavement: true, alley: true, market: true, indoors: true });
  assertEqual(T.bicycle.go, { road: true, pavement: true, alley: true, market: false, indoors: false });
  assertEqual(T.scooter.go, { road: true, pavement: false, alley: false, market: false, indoors: false });
  assertEqual(T.car.go, { road: true, pavement: false, alley: false, market: false, indoors: false });
});

/* ---- canAfford ---- */
test('canAfford: more, exact, less', () => {
  assert(canAfford(100, 50)); assert(canAfford(100, 100)); assert(!canAfford(99, 100)); assert(canAfford(0, 0));
});
test('canAfford: bad values are never affordable', () => {
  assert(!canAfford(100, -1)); assert(!canAfford(100, NaN)); assert(!canAfford(NaN, 1)); assert(!canAfford(-50, 1));
  assert(!canAfford(100, Infinity)); assert(!canAfford(100, '50')); assert(!canAfford(undefined, 1));
});

/* ---- spend ---- */
test('spend: takes the exact amount', () => { assertEqual(spend(1000, 300), { ok: true, money: 700, paid: 300 }); });
test('spend: the exact balance leaves 0', () => { assertEqual(spend(300, 300), { ok: true, money: 0, paid: 300 }); });
test('spend: refuses when short, money unchanged', () => { assertEqual(spend(299, 300), { ok: false, money: 299, paid: 0 }); assertEqual(spend(0, 1), { ok: false, money: 0, paid: 0 }); });
test('spend: zero is allowed and free', () => { assertEqual(spend(50, 0), { ok: true, money: 50, paid: 0 }); });
test('spend: rejects negative, NaN, Infinity and non-numbers', () => {
  for (const a of [-1, -0.01, NaN, Infinity, -Infinity, '10', null, undefined, {}]) assertEqual(spend(500, a), { ok: false, money: 500, paid: 0 }, 'amount ' + String(a));
});
test('spend: a broken balance counts as 0', () => {
  assertEqual(spend(-200, 100), { ok: false, money: 0, paid: 0 }); assertEqual(spend(NaN, 100), { ok: false, money: 0, paid: 0 }); assertEqual(spend(undefined, 0), { ok: true, money: 0, paid: 0 });
});

/* ---- spendUpTo ---- */
test('spendUpTo: takes the full fine when it is there', () => { assertEqual(spendUpTo(5000, 3000), { money: 2000, paid: 3000 }); });
test('spendUpTo: takes only what you have', () => { assertEqual(spendUpTo(1200, 3000), { money: 0, paid: 1200 }); assertEqual(spendUpTo(0, 3000), { money: 0, paid: 0 }); });
test('spendUpTo: bad amounts take nothing', () => {
  for (const a of [-5, NaN, Infinity, '7', undefined]) assertEqual(spendUpTo(900, a), { money: 900, paid: 0 }, 'amount ' + String(a));
  assertEqual(spendUpTo(-900, 100), { money: 0, paid: 0 }); assertEqual(spendUpTo(NaN, 100), { money: 0, paid: 0 });
});

/* ---- earn ---- */
test('earn: adds', () => { assertEqual(earn(100, 50), 150); assertEqual(earn(0, 0), 0); });
test('earn: negative and NaN add nothing', () => { assertEqual(earn(100, -50), 100); assertEqual(earn(100, NaN), 100); assertEqual(earn(100, Infinity), 100); assertEqual(earn(-30, 10), 10); assertEqual(earn(NaN, 10), 10); });

/* ---- buyRide ---- */
test('buyRide: buys, deducts the exact price once', () => {
  const r = buyRide({ money: 100000, rides: {} }, 'bicycle', CONFIG);
  assertEqual(r, { ok: true, reason: null, shortfall: 0, money: 75000, rides: { bicycle: true } });
});
test('buyRide: exact-price purchase leaves 0', () => {
  const r = buyRide({ money: 60000, rides: {} }, 'scooter', CONFIG);
  assert(r.ok); assertEqual(r.money, 0); assertEqual(r.rides, { scooter: true });
});
test('buyRide: buying twice is refused and costs nothing', () => {
  const a = buyRide({ money: 100000, rides: {} }, 'bicycle', CONFIG), b = buyRide(a, 'bicycle', CONFIG);
  assertEqual(b, { ok: false, reason: 'owned', shortfall: 0, money: 75000, rides: { bicycle: true } });
});
test('buyRide: unaffordable is refused with the shortfall', () => {
  const r = buyRide({ money: 100000, rides: {} }, 'car', CONFIG);
  assertEqual(r, { ok: false, reason: 'short', shortfall: 300000, money: 100000, rides: {} });
  assertEqual(buyRide({ money: 24999, rides: {} }, 'bicycle', CONFIG).shortfall, 1);
});
test('buyRide: walk is always owned', () => {
  assertEqual(buyRide({ money: 0, rides: {} }, 'walk', CONFIG), { ok: false, reason: 'owned', shortfall: 0, money: 0, rides: {} });
});
test('buyRide: unknown ride', () => {
  for (const id of ['skate', '', undefined, 'toString', '__proto__', 'constructor']) { const r = buyRide({ money: 999999, rides: {} }, id, CONFIG); assertEqual([r.ok, r.reason, r.money], [false, 'unknown', 999999], 'id ' + String(id)); }
});
test('buyRide: does not change the state passed in', () => {
  const rides = {}, state = { money: 100000, rides }, r = buyRide(state, 'bicycle', CONFIG);
  assertEqual(state.money, 100000); assertEqual(rides, {}); assert(r.rides !== rides);
  const again = buyRide(state, 'car', CONFIG); assert(again.rides !== rides, 'a refused purchase also returns a copy');
});
test('buyRide: missing rides or broken money', () => {
  assertEqual(buyRide({ money: 30000 }, 'bicycle', CONFIG), { ok: true, reason: null, shortfall: 0, money: 5000, rides: { bicycle: true } });
  assertEqual(buyRide({ money: -5, rides: null }, 'bicycle', CONFIG), { ok: false, reason: 'short', shortfall: 25000, money: 0, rides: {} });
  assertEqual(buyRide({ money: NaN, rides: {} }, 'bicycle', CONFIG).reason, 'short');
  assertEqual(buyRide(null, 'bicycle', CONFIG).reason, 'short');
});
test('buyRide: keeps what you already own', () => {
  const r = buyRide({ money: 500000, rides: { bicycle: true } }, 'car', CONFIG);
  assertEqual(r.money, 100000); assertEqual(r.rides, { bicycle: true, car: true });
});

/* ---- rideStatus ---- */
test('rideStatus: owned, affordable, short', () => {
  const s = { money: 100000, rides: { scooter: true } };
  assertEqual(rideStatus(s, 'walk', CONFIG), { owned: true, affordable: true, price: 0, shortfall: 0 });
  assertEqual(rideStatus(s, 'scooter', CONFIG), { owned: true, affordable: true, price: 60000, shortfall: 0 });
  assertEqual(rideStatus(s, 'bicycle', CONFIG), { owned: false, affordable: true, price: 25000, shortfall: 0 });
  assertEqual(rideStatus(s, 'car', CONFIG), { owned: false, affordable: false, price: 400000, shortfall: 300000 });
  assertEqual(rideStatus({ money: 400000, rides: {} }, 'car', CONFIG), { owned: false, affordable: true, price: 400000, shortfall: 0 });
});
test('rideStatus: unknown ride and missing state', () => {
  assertEqual(rideStatus({ money: 1e9, rides: {} }, 'rocket', CONFIG), { owned: false, affordable: false, price: 0, shortfall: 0 });
  assertEqual(rideStatus({}, 'bicycle', CONFIG), { owned: false, affordable: false, price: 25000, shortfall: 25000 });
  assertEqual(rideStatus(undefined, 'walk', CONFIG).owned, true);
});
test('rideStatus agrees with buyRide', () => {
  for (const money of [0, 24999, 25000, 60000, 399999, 400000, 1000000]) for (const id of Object.keys(T)) {
    const s = { money, rides: {} }, st = rideStatus(s, id, CONFIG), b = buyRide(s, id, CONFIG);
    assertEqual(b.ok, !st.owned && st.affordable, id + ' at ' + money); if (b.reason === 'short') assertEqual(b.shortfall, st.shortfall);
  }
});

/* ---- starting and loading ---- */
test('freshGame: starts with the config amount', () => { assertEqual(freshGame(CONFIG), 100000); assertEqual(freshGame({ startMoney: 7 }), 7); });
test('loadMoney: a saved balance is kept as is', () => { assertEqual(loadMoney(1000000, CONFIG), 1000000); assertEqual(loadMoney(0, CONFIG), 0); assertEqual(loadMoney(123.5, CONFIG), 123.5); });
test('loadMoney: a negative save becomes 0', () => { assertEqual(loadMoney(-4000, CONFIG), 0); });
test('loadMoney: no usable number starts fresh', () => { for (const v of [undefined, null, NaN, Infinity, '500', {}]) assertEqual(loadMoney(v, CONFIG), 100000, String(v)); });

/* ---- the promise: money is never negative, whatever happens ---- */
test('money never goes below 0 after any sequence', () => {
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const odd = [NaN, -1, -1e9, Infinity, 0, 1, 2999, 3000, 25000, 400000, 1e7, 0.5], ids = ['walk', 'bicycle', 'scooter', 'car', 'nope'];
  for (let run = 0; run < 40; run++) {
    let money = loadMoney(odd[run % odd.length], CONFIG), rides = {}, spent = 0, got = 0; const start = money;
    for (let i = 0; i < 400; i++) {
      const a = rnd() < 0.25 ? odd[Math.floor(rnd() * odd.length)] : Math.round(rnd() * 120000), k = Math.floor(rnd() * 4);
      if (k === 0) { const r = spend(money, a); spent += r.paid; money = r.money; }
      else if (k === 1) { const r = spendUpTo(money, a); spent += r.paid; money = r.money; }
      else if (k === 2) { const before = money; money = earn(money, a); got += money - before; }
      else { const before = money, owned = Object.keys(rides).length, r = buyRide({ money, rides }, ids[Math.floor(rnd() * ids.length)], CONFIG); money = r.money; rides = r.rides; spent += before - money;
        assert(r.ok ? Object.keys(rides).length === owned + 1 && before > money : before === money && Object.keys(rides).length === owned, 'a purchase either happens fully or not at all'); }
      assert(typeof money === 'number' && isFinite(money) && money >= 0, 'money went bad: ' + money + ' at step ' + i + ' of run ' + run);
    }
    assert(Math.abs(start + got - spent - money) < 1e-3, 'the books balance');
  }
});

/* ---- police chase ---- */
import { chaseFine, rideSpeed as rideSpeedFn } from '../logic.js';
const rideSpeedOf = (id) => rideSpeedFn(id, CONFIG);
test('chaseFine: stopping costs the usual fee, running and being caught costs more, and it grows with the level', () => {
  assertEqual(chaseFine(1, false, CONFIG), 1500); assertEqual(chaseFine(1, true, CONFIG), 3800); assert(chaseFine(5, false, CONFIG) > chaseFine(1, false, CONFIG));
  for (let L = 1; L <= 10; L++) assert(chaseFine(L, true, CONFIG) > chaseFine(L, false, CONFIG), 'level ' + L);
  assertEqual(chaseFine(NaN, false, CONFIG), 1500); assertEqual(chaseFine(-3, true, CONFIG), 3800); assertEqual(chaseFine(1, true, {}), 0);
});
test('chase: the car can outrun a patrol on a straight, the scooter and the bicycle cannot, and nothing is caught or lost in an instant', () => {
  const C = CONFIG.police.chase; assert(rideSpeedOf('car') > C.speed && rideSpeedOf('scooter') < C.speed && rideSpeedOf('bicycle') < C.speed);
  assert(C.trapTime >= 2 && C.pullOver >= 1 && C.loseTime >= 3 && C.hail >= 3 && C.gone > C.loseFar && C.loseFar > C.see, 'timings');
  const S = CONFIG.stops, sprint = CONFIG.walkSpeed * CONFIG.transport.walk.sprint; assert(S.agberoSpeed < sprint && S.officerSpeed < sprint && S.agberoSpeed > CONFIG.walkSpeed && S.officerSpeed > CONFIG.walkSpeed, 'on foot you can outrun them, but not out-walk them');
});

/* ---- joining ---- */
import { userName, userProblem, userFree } from '../logic.js';
test('usernames: tidied to small letters, digits and _; too short, bad start and taken ones are refused; a free one is offered', () => {
  assertEqual(userName('  Kingsley Orji! '), 'kingsleyorji'); assertEqual(userName('A_b-9'), 'a_b9'); assertEqual(userName('x'.repeat(40)).length, 15); assertEqual(userName(null), '');
  assertEqual(userProblem('ab', []), 'Use 3 or more letters'); assertEqual(userProblem('9lives', []), 'Start with a letter'); assertEqual(userProblem('Good', []), 'Letters, numbers and _ only');
  assertEqual(userProblem('leo', ['Leo']), 'That username is taken'); assertEqual(userProblem('leo2', ['Leo']), ''); assertEqual(userProblem('tunde', undefined), '');
  assertEqual(userFree('Leo', ['Leo']), 'leo2'); assertEqual(userFree('Leo', ['Leo', 'leo2']), 'leo3'); assertEqual(userFree('Ada', []), 'ada'); assertEqual(userFree('7', []), 'player7'); assert(!userProblem(userFree('', ['player_']), ['player_']));
});
test('start: the bicycle and the scooter are yours from the start, the car is not', () => { assertEqual(CONFIG.startRides, ['bicycle', 'scooter']); assert(CONFIG.transport.car.price > 0); });
