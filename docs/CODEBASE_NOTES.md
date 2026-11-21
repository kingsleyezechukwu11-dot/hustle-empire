# Blocktown: codebase notes

Written by the PM before the errands / transport / chase build (2026-11-20). Read with `CLAUDE.md` (owner's rules) and
`docs/claude-notes/` (full history and the design system). Line numbers drift: search for the function name.

## 1. Stack (confirmed)
- **Three.js r187 in the browser.** The whole game is `street_src/main.js` (about 4,300 lines, 436 KB, some lines are very
  long: always `grep -n` and read ranges with `cut -c1-900`, never dump the file) plus `street_src/index.html` (all HTML and
  CSS, with a `/*BUNDLE*/` marker where the script goes). No framework, no modules besides small icon data files
  (`art-icons.js`, `flat-icons.js`, `glass-icons.js`, `glyphs.js`, `ride-art.js`).
- Models are `.glb` files in `street_src/models/`, textures `.jpg` in `street_src/textures/`; both are imported as binary
  and written into the bundle. Every downloaded model must be credited in `models/CREDITS.txt`.
- The Flutter folders (`lib/`, `ios/`, `android/`) only wrap the built page in a web view. Not part of this work.
- **Hosting: Cloudflare Workers static assets** (`npx wrangler deploy --assets=build/web --name hustle-empire`), live at
  hustle-empire.postteller.workers.dev. NEVER deploy unless the owner says "deploy".

## 2. Build and run
- `sh build_street.sh` bundles with esbuild into `assets/street/index.html` (about 79 MB, not in git). It prints a
  "... KB of script" line: if that line is missing the build failed. On this Mac esbuild is at
  `~/development/tools/esbuild/bin/esbuild` (the script's default) and `three` is in `street_src/node_modules`.
- **Node.js is NOT installed on this Mac.** So `tools/build_web.mjs` (the online build: `build/web/` with `m.html` phone
  version loading shrunk models from `m/`, `full.html` loading from `d/`) cannot be run here. Any new `.glb` also needs a
  phone copy made by `python3 tools/shrink_glb.py street_src/models build/mobile_src/models` before the online build.
- Preview: `.claude/launch.json` entry `street` serves `assets/street` at http://localhost:8765 (python http.server).
  The page takes about 15 to 20 seconds to load. Stop the preview server / close the tab when finished: it keeps rendering.
- Hash flags: `#dbg` exposes `window.__dbg`; `#new` wipes the save; `#hq` / `#lq` force computer / phone quality;
  `#hour=13.5` fakes the clock; `#bld=N` forces one building model. Flags combine: `#dbg#new#lq`.
- Phone mode is `PHONE = !HQ`, where HQ is "not a touch device" (or `#hq`). Phones skip real shadow maps, depth shading,
  glossy cars and use shorter view distance. **Test phone behaviour with `#lq` at 390x844.**
- When the browser pane is hidden `requestAnimationFrame` stops. Drive the game with `__dbg.frame()` in a loop; to fake
  time passing patch `performance.now`. CSS animations also freeze when hidden.
- JS without Node: `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc file.js` runs plain
  JavaScript (has `print`, no `console.log` to stdout guarantee, no DOM, no `require`). Unit tests are bundled with esbuild
  to one file and run on jsc: see `street_src/tests/` once it exists.

## 3. World and movement
- Endless grid. Constants near line 118 and 2692: `F` (half the road-plus-pavement width, the main road centre is at
  local `F`), `ROAD_HALF`, `GUTTER_W`, `BLOCK = 72`, `RW = 2*F`, `PITCH = BLOCK + RW`, `MID = BLOCK/2`, `LANE_HALF`, `LANE_Y`.
  Cell (i, j) = one junction + a main road along z + one along x + one block. Each block has one **inner street** (lane)
  through its middle (`laneDir(i, j)` says which way). Streets are built per cell in `buildCell` / `buildRoad` /
  `buildLane` and merged into few meshes (`Batch`).
- **`locate(x, z, lim, slack)` is THE walkability test**: returns `null` (solid / not allowed) or `{ y, room?, level?,
  rect?, door?, over? }`. Main roads: carriageway is `|u| <= ROAD_HALF` at y 0, pavements at y 0.28 out to `lim`.
  Inner streets: `LANE_Y`. Rented house interiors come from `homeSpot`. There are NO enterable shops, NO market and NO bus
  stops in the world today; shops (`st_shop`, `st_market`) are exteriors only.
- `locY(x, z)` ground height; `locateRoom()` true when the hero is indoors.
- **Hero**: object `hero` (line ~2794): `x, z, y, heading, speed, obj, model, mixer, acts [idle, walk, run], w, stride, who,
  down, safe, free, level`. Models and animations are set up with the walkers (`HEROES`, `becomeHero`, `makeKind`, `bake`,
  `retarget`). Default hero is Leo; several skeleton families (Renderpeople, Mixamo, Character Creator), so anything that
  poses bones must go through `rigFor(model)` / `rigOf()` (returns spine, arms, fore, hands, thighs, shins, feet) and the
  world-space helpers `turnBone` and `aimBone`. **There are no mocap clips beyond idle / walk / run**: pick-up, carry and
  hand gestures are made in code in `errandPose(dt)`.
- **Movement** is in `frame()` (line ~4250): joystick (`joy`, right half of the screen, radius 36 px) or WASD; speed is
  `run ? 5.2 : 1.75 * min(1, mag/0.8)` where run = stick past 0.85 (or Shift) and not `game.hurt`; then `locate` checks with
  wall sliding, then `pushOut()` (trees, poles, people), `pushOffCars()`, `homePush()`. `ui.busy = true` freezes input.
  Camera follows behind (`camYaw`, `camPitch`), pulled in by `locate`.
- **Traffic**: `cars`, `spawnCar`, `updateTraffic`, `carPos(c)`, lanes per main road, traffic lights `signal(axis)`.
  A moving car that reaches you calls `carHit(c)`: knocked down, errand lost, `game.hurt` until treated from the menu
  (`treat`, `TREAT_FEE`). Car models are `carKinds` (from `models/cars.glb`).
- **Walkers**: `people`, `updatePeople(dt, cam)`, `kinds[]` (9 kinds), far ones swap to a light body, shadows only near.

## 4. Money, save, life, HUD
- `game` (line ~2850) is the whole save: `money, curV, home, items, seenHome, pack, hero, heroV, name, job {level, done},
  jobs, hurt, life, lifeAt, day, rides, ride`. Stored as JSON in localStorage key `hustle-save-v1` by `save()`.
  New games start with `money: 1000000`. Loading does `Object.assign(game, sv)`.
- Money is changed directly (`game.money += / -=`) in: `endErrand`, `hzSay` (bribes), `treat`, `rentIt`, `addFurniture`.
  There is no single "spend" function yet, and guards are ad hoc (`Math.min(fee, Math.max(0, game.money))`).
- `cash(n)` formats naira. `showMoney()` redraws `#money`; `ui.hold` delays the shown balance so `coinDrop(amount)` can
  count it up; `gain(n, why)` shows the +/- pop.
- **Hunger** = `game.life` (5 to 100), drains with the real clock (`showLife`, `PER_HOUR`), drawn as five lime segments +
  percent in `#life`; "Hungry" chip at 30 or less. Eating at home refills it (`homeSpots`).
- **HUD elements** (ids in index.html): `#money`, `#gain`, `#job` (timer capsule: `#jobtv`), `#life`, `#hurt`, `#map`
  (minimap canvas, `showMap`, route to `ui.dest`), `#menubtn` (opens `#places`, `openPlaces`, tiles from `PLACES` with
  `ART_ICONS`), `#dock` (your picture + passers-by = the "character slots"; tap opens chat `#dm`), `#act` (the one yellow
  action button, `setAct({label, run})`), `#brief` (speech-box popup: `tell(text, btn, go, opt)` and `showBrief`),
  `#errand` (the travel-picker card, currently switched off), `#count` (3-2-1), `#goal` / `note(text, secs)`.
- `chars` panel + `HEROES` = character chooser.

## 5. Errands (the delivery loop)
- State machine `job.state`: `idle -> offer -> count -> pickup -> deliver -> idle` (line ~3720 to 4043).
  `makeOffer()` picks pickup/delivery from `ADDR` (numbered main-road houses registered by `noteAddress`), pay
  `(2500 + d2*22 + d1*8) * level mult`, time from distance at 2.9 m/s. `openErrand` -> `showBrief` (speech box, asks the
  player's name first time) -> `startErrand` -> countdown -> `errandTick`. Pickup and drop are automatic within 1.25 m
  (`startBend`, bend pose in `errandPose`). `endErrand(paid, hit)` pays or fines (`latePenalty` 40%). Levels: `levelOf(L)`.
- `parcel` is one kraft box mesh (`makeParcel`, `PARCEL` size); while carried it is placed between the two hand bones each
  frame at the end of `errandPose`. `jobPin` = lime 3D pin; `aim(name, x, z)` sets the map route.
- **Travel picker exists but is off**: `MODES` (walk, bike 180,000, scooter 90,000, skate 25,000), `errandCard()`,
  `pickStep`, `walkSheet`, CSS `.pick .rail/.opts/.op`, pictures in `RIDE_ART`. `game.rides` / `game.ride` are reserved.
  Buying and riding were never built. Raw vehicle models: `build/vehicles_src/` (scooter_vino 13 MB, bike_jawa (a motorbike),
  skateboard). There is no bicycle model and no player-car logic.

## 6. Area boys ("agberos") and police, as they are today
- `hz` list, `hzMake / hzSpawn / hzSay / hzTick` (line ~3931). One of each at most, spawned ahead of you every 7 s check
  while on an errand. States `wait -> come -> stop -> talk -> hold -> back -> done`. They walk up (3.3 / 2.9 m/s), you are
  frozen at 2.6 m, popup asks for a fixed fee (`300+200L` / `1000+500L`); police also offer "Wait 9 s". No chase, no
  stamina, no refusing, no groups, no checkpoints. Created and destroyed each time (not pooled).
- Models: `AGB` (agb1, agb2), `POLICE` (cop2, cop3), set up through `makeKind`.

## 7. Tests
- None for the game. `test/widget_test.dart` is the Flutter template only. No Node, no Playwright on this Mac.

## 8. Conventions that bite
- Owner's design system: flat frosted-glass cards just above `#dock`, lime `--lime:#b6f02c` accents, black icons, almost no
  text. Reuse `tell()`, `.panel`, the errand card styles. Do not invent a new look.
- Owner's rule: nothing may pop into view or vanish in view; spawn out of sight or behind something.
- Never put a `//` comment in the middle of a long line (it swallows the rest): use `/* */`.
- After replacing CSS, grep for duplicate older rules. Do not name classes `.tab` / `.tabs`.
- Phones have little memory: reuse objects, dispose what you remove, add no heavy models.
