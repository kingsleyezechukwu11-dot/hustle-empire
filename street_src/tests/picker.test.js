import { test, assert, assertEqual } from './harness.js';
import { CONFIG } from '../config.js';
import { moneyText, rideIds, rideOption, ridePick, countStep, buyRide } from '../logic.js';

test('moneyText: naira with commas, whole numbers', () => {
  assertEqual(moneyText(12000), '₦12,000'); assertEqual(moneyText(0), '₦0'); assertEqual(moneyText(999), '₦999');
  assertEqual(moneyText(1000000), '₦1,000,000'); assertEqual(moneyText(2500.4), '₦2,500'); assertEqual(moneyText(NaN), '₦0');
  assertEqual(moneyText(500, '$'), '$500');
});
test('rideIds: exactly walk, bicycle, scooter, car, from the config', () => {
  assertEqual(rideIds(CONFIG), ['walk', 'bicycle', 'scooter', 'car']); assertEqual(rideIds(null), []);
});
test('rideOption: a fresh game (100,000)', () => {
  const s = { money: CONFIG.startMoney, rides: {} };
  assertEqual(rideOption(s, 'walk', CONFIG), { id: 'walk', name: 'Walk', act: 'start', owned: true, price: '', tag: '', need: '', confirm: '' });
  assertEqual(rideOption(s, 'bicycle', CONFIG), { id: 'bicycle', name: 'Bicycle', act: 'buy', owned: false, price: '₦25,000', tag: '', need: '', confirm: 'Buy the Bicycle for ₦25,000?' });
  assertEqual(rideOption(s, 'scooter', CONFIG).act, 'buy');
  const car = rideOption(s, 'car', CONFIG);
  assertEqual(car.act, 'short'); assertEqual(car.price, '₦400,000'); assertEqual(car.need, 'Need ₦300,000 more'); assertEqual(car.confirm, '');
});
test('rideOption: after buying the bicycle it is owned, and the scooter may now be short', () => {
  const b = buyRide({ money: 72000, rides: {} }, 'bicycle', CONFIG), s = { money: b.money, rides: b.rides };
  assertEqual(s.money, 47000);
  const bike = rideOption(s, 'bicycle', CONFIG); assertEqual([bike.act, bike.tag, bike.need, bike.price], ['start', 'Owned', '', '₦25,000']);
  const sc = rideOption(s, 'scooter', CONFIG); assertEqual([sc.act, sc.need], ['short', 'Need ₦13,000 more']);
});
test('rideOption: exact money buys; one naira less does not', () => {
  assertEqual(rideOption({ money: 60000, rides: {} }, 'scooter', CONFIG).act, 'buy');
  assertEqual(rideOption({ money: 59999, rides: {} }, 'scooter', CONFIG).need, 'Need ₦1 more');
});
test('rideOption: unknown ride and broken state can never be started or bought', () => {
  assertEqual(rideOption({ money: 1e9, rides: {} }, 'skate', CONFIG).act, 'short');
  assertEqual(rideOption(null, 'bicycle', CONFIG).act, 'short'); assertEqual(rideOption({ money: -5 }, 'bicycle', CONFIG).need, 'Need ₦25,000 more');
  assertEqual(rideOption(null, 'walk', CONFIG).act, 'start');
});
test('ridePick: opens on the last ride used when it is owned, else on walking', () => {
  assertEqual(ridePick({ ride: 'scooter', rides: { scooter: true } }, CONFIG), 2);
  assertEqual(ridePick({ ride: 'scooter', rides: {} }, CONFIG), 0); assertEqual(ridePick({ ride: 'skate', rides: { skate: true } }, CONFIG), 0);
  assertEqual(ridePick({}, CONFIG), 0); assertEqual(ridePick(null, CONFIG), 0);
});
test('countStep: starts at the old figure, ends at the new, never overshoots or goes below 0', () => {
  assertEqual(countStep(100000, 75000, 0), 100000); assertEqual(countStep(100000, 75000, 1), 75000); assertEqual(countStep(100000, 75000, 5), 75000);
  let last = 100000; for (let i = 0; i <= 20; i++) { const v = countStep(100000, 75000, i / 20); assert(v <= last && v >= 75000, 'step ' + i); assert(v === Math.round(v)); last = v; }
  assertEqual(countStep(-10, 0, 0.5), 0); assertEqual(countStep(10, 30, 1), 30);
});
