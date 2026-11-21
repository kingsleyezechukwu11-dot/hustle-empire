// Blocktown balance numbers. EVERY number that tunes the economy lives here and nowhere else.
// No Three.js, no DOM: this file is also read by the unit tests (street_src/tests/).
export const CONFIG = {
  /* ---- money ---- */
  startMoney: 100000,          // what a brand-new game starts with (existing saves keep their balance)
  treatFee: 3000,              // hospital, after a car knocks you down (takes what you have if you are short)
  lateShare: 0.4,              // share of an errand's pay taken as the fine when you are late

  /* ---- errand pay (naira) ---- */
  pay: { min: 3000, max: 15000 },

  /* ---- transport ----
     price in naira; speed = multiple of walking speed; sprint = extra multiple while running (walk only);
     go = where it may travel; turn = how fast it turns compared with the others (1 when not given). */
  transport: {
    walk: { name: 'Walk', price: 0, speed: 1, sprint: 1.6, go: { road: true, pavement: true, alley: true, market: true, indoors: true } },
    bicycle: { name: 'Bicycle', price: 25000, speed: 1.8, go: { road: true, pavement: true, alley: true, market: false, indoors: false } },
    scooter: { name: 'Scooter', price: 60000, speed: 2.6, go: { road: true, pavement: false, alley: false, market: false, indoors: false } },
    car: { name: 'Car', price: 400000, speed: 3.2, turn: 0.55, bigPackages: true, go: { road: true, pavement: false, alley: false, market: false, indoors: false } },
  },

  /* ---- stamina (Phase 3) ---- */
  // stamina: { },

  /* ---- bribes (Phase 3) ---- */
  // bribes: { },

  /* ---- enemies: area boys and police (Phase 3) ---- */
  // enemies: { },

  /* ---- obstacles (Phase 4) ---- */
  // obstacles: { },

  /* ---- stars / rating (Phase 4) ---- */
  // stars: { },
};
