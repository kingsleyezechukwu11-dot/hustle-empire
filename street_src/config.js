// Blocktown balance numbers. EVERY number that tunes the economy lives here and nowhere else.
// No Three.js, no DOM: this file is also read by the unit tests (street_src/tests/).
export const CONFIG = {
  /* ---- money ---- */
  startMoney: 100000,          // what a brand-new game starts with (existing saves keep their balance)
  treatFee: 3000,              // hospital, after a car knocks you down (takes what you have if you are short)
  lateShare: 0.4,              // share of an errand's pay taken as the fine when you are late

  /* ---- errand pay (naira) ---- */
  pay: { min: 3000, max: 15000 },   // every errand pays at least min and at most max, whatever the sums below come to
  // pay = (base + (perMetre x metres from pickup to delivery + perMetrePickup x metres to the pickup) x the ride's payRate) x package x level,
  // to the nearest `round`. Metres are measured BY THE STREETS (round the block where you must), not as the crow flies.
  payRule: { base: 1500, perMetre: 20, perMetrePickup: 5, round: 100 },

  /* ---- errand time ----
     seconds = metres / reference speed x the level's slack + fixed, to the nearest `round`.
     The reference speed is the ride's top speed x its `pace` (below, per ride). */
  time: { fixed: 18, round: 5, played: { foot: 0.8, ride: 0.68 } },   // played = the share of the clock a typical run really takes (measured in review): used only to compare earnings per minute

  /* ---- levels ----
     runs to finish level L = runs + L; pay x (1 + payStep x (L - 1)); a bonus of bonus x L when the level is finished;
     near = metres to the pickup [from, to + nearGrow x L]; far = metres pickup to delivery [from + farGrow[0] x L, to + farGrow[1] x L];
     slack = how generous the clock is: slackMax - slackStep x L, never under slackMin. */
  levels: { runs: 2, payStep: 0.01, bonus: 5000, near: [75, 135], nearGrow: 4, far: [110, 200], farGrow: [8, 12], slackMax: 1.37, slackStep: 0.03, slackMin: 1.22 },

  /* ---- packages ----
     payMult = how much more it pays; value = what the goods are worth [from, to] (for bribes, later); chance = how often it comes up;
     big = only by a ride with bigPackages, or on foot. */
  packages: {
    small: { name: 'Small', payMult: 1, value: [10000, 40000], chance: 5 },
    medium: { name: 'Medium', payMult: 1.25, value: [30000, 90000], chance: 3 },
    big: { name: 'Big', payMult: 1.6, value: [80000, 200000], chance: 2, big: true },
  },

  /* ---- moving ---- */
  walkSpeed: 1.75,             // metres a second at a walk; every other speed is a multiple of this

  /* ---- transport ----
     price in naira; speed = multiple of walking speed; sprint = extra multiple while running (walk only);
     go = where it may travel; turn = how fast it turns compared with the others (1 when not given).
     accel / brake = metres a second gained / lost each second; turnRate = radians a second it can turn at speed (x turn);
     pivot = radians a second it can turn while standing still (a bicycle can be walked round; a scooter or car cannot);
     reverse = metres a second backwards (0 = cannot); trip = how much longer its errands are than the level's distances;
     pace = the share of its top speed the clock expects you to average (on foot: of walking speed, so above 1 means some running);
     payRate = how much of the per-metre pay it earns (set so that each step up, walk < bicycle < scooter < car, earns about 15% more
     for a minute of play than the one before, while pay stays inside the range); cam = how far back the camera sits (1 = on foot). */
  transport: {
    walk: { name: 'Walk', price: 0, speed: 1, sprint: 1.6, trip: 0.7, pace: 1.25, payRate: 1, cam: 1, go: { road: true, pavement: true, alley: true, market: true, indoors: true } },
    bicycle: { name: 'Bicycle', price: 25000, speed: 1.8, accel: 2.2, brake: 5, turnRate: 2.6, pivot: 0.9, reverse: 0, trip: 1, pace: 0.8, payRate: 1.03, cam: 1.1, go: { road: true, pavement: true, alley: true, market: false, indoors: false } },
    scooter: { name: 'Scooter', price: 60000, speed: 2.6, accel: 3, brake: 6.5, turnRate: 2.4, pivot: 0, reverse: 0.8, trip: 1.4, pace: 0.8, payRate: 0.86, cam: 1.25, go: { road: true, pavement: false, alley: false, market: false, indoors: false } },
    car: { name: 'Car', price: 400000, speed: 3.2, turn: 0.55, accel: 3.2, brake: 7.5, turnRate: 2.4, pivot: 0, reverse: 1.4, trip: 1.7, pace: 0.8, payRate: 0.77, cam: 1.6, bigPackages: true, go: { road: true, pavement: false, alley: false, market: false, indoors: false } },
  },

  /* ---- riding ----
     turnFrom..turnFull = radians off your heading over which it slows for a turn, down to slowTurn = the share of top speed kept
     through the sharpest (a stick pointing behind you is a U-turn, never a reverse); backTime / backDist = seconds / metres it backs
     up by itself when its nose is blocked (the middle of a three-point turn); stuck = seconds held by a traffic car that is itself waiting for you before the ride is eased sideways (a plain queue just holds you); park = metres within which your ride is brought to you at the start; reach = metres from which you can
     get back on; autoOff = metres from the parcel or the door at which you get off by yourself once stopped; fade = seconds it
     takes to appear and to leave; stopped = metres a second that counts as standing still; unstick = radians a second it can be
     worked round when jammed against a kerb; startGuard = milliseconds after buying during which Start ignores taps. */
  ride: { turnFrom: 0.5, turnFull: 2.1, slowTurn: 0.4, backTime: 1.5, backDist: 3, stuck: 3, park: 12, reach: 2.2, autoOff: 9, fade: 0.6, stopped: 0.35, unstick: 0.9, startGuard: 400 },

  /* ---- being stopped for money (the old walk-up area boy / officer; Phase 3 replaces it) ---- */
  stops: { perLeg: 1 },        // at most this many stops on the way to the pickup, and again on the way to the delivery


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
