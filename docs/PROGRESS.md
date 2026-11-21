# Progress: errands, transport, carrying, chase

PM log. Statuses: todo / building / in review / passed / QA / done.

## Decisions (PM)
| # | Decision | Why |
|---|---|---|
| D1 | Work lands on `main` as local commits, one per passed task. Nothing is pushed or deployed. | Owner chose the current branch; brief says commit per task, never deploy. |
| D2 | No Node.js on this Mac, so: unit tests are plain JS bundled by esbuild and run on macOS's built-in `jsc`; visible checks are done in the app's built-in browser at 390x844 instead of Playwright. Test files are written so they also run under Node later. | Downloads need the owner's OK. To be offered at the end. |
| D3 | Balance numbers live in `street_src/config.js`; pure rules (prices, pay, bribes, stamina, stars, enemy states) live in `street_src/logic.js` with no Three.js or DOM, so they can be unit tested. `main.js` imports both. | Brief: one config file, unit tests. main.js is one 436 KB file. |
| D4 | New saves start with N100,000; any existing save keeps its balance. | Brief. |
| D5 | Transport set becomes Walk / Bicycle / Scooter / Car at the brief's prices, replacing the unfinished Walk / Bike / Scooter / Skateboard picker. The picker page is switched back on. | Brief is newer than the picker. |
| D6 | "Alleys" = the inner streets through each block. "Roads only" = carriageway of main roads and inner streets, not pavements or compounds. "Market" does not exist yet: it is built in Phase 4 as a market street. | The world has no alleys, market or enterable shops today. |
| D7 | The existing traffic knock-down (hospital) stays as it is on foot. | Brief: don't break existing features. Phase 4's "never end the run" covers the new obstacles. |
| D8 | The existing walk-up agbero / police stop is replaced by the brief's state machine (idle, noticed with "!", chasing, gave up). The owner earlier rejected floating marks; the brief asks for "!" explicitly, so the brief wins. Flag in the final report. | Brief section 4. |

| D9 | Speeds follow the brief's table literally from a 1.75 m/s walk: sprint 2.8, bicycle 3.15, scooter 4.55, car 5.6 m/s. The old 5.2 m/s run is gone. | Brief. Flag for tuning: the car is slow in absolute terms. |
| D10 | Scooter and car parked out of reach (player in an inner street): walk time is added to the clock and the map leads to the vehicle first. | Reviewer defect; nothing may pop in beside you where it cannot drive. |
| D11 | Until Phase 3 replaces them, the old agbero / police stops are capped at one per leg. | They cost more than a run paid. |
| D12 | The speech box before the picker no longer quotes addresses, pay and time (they differ per ride); the picker card shows them. | Terms depend on the ride. Owner liked the old wording: flag. |

## Phase 1: economy and transport
| Task | Status | Notes |
|---|---|---|
| 1.1 Config + logic modules, test runner, safe money functions, N100,000 start | passed | Reviewer PASS, 48 unit tests. Follow-ups folded into 1.2: stuck keyboard keys (old bug), balance display clamp, zero-fee wording. |
| 1.2 Transport picker: buy once, owned, greyed with shortfall, confirmation, counter animates down | passed | Reviewer PASS, 69 unit tests. Scooter = owner's Vino model slimmed to 309 KB. Minor defects carried into 1.3: Start appears under the finger right after Buy; small-phone overlap with the minimap; scooter picture lacks its box; car paint reads green not lime. |
| 1.3 Riding: vehicle appears beside you, mount / dismount, speeds, where each may go | passed | Failed review twice (clock unbeatable on foot, reverse trap, far-parked vehicle, bribes above pay; then car ghosting through a queue). All fixed; last three fixes staged by the Builder and re-checked in Phase 1 QA. 135 unit tests. |
| 1.4 Pay range N3,000 to N15,000 by distance and package | passed | Distances measured along the streets. Each ride earns about 15-20% more per minute than the one below it. |

## Phase 2: carrying
todo

## Phase 3: chase
todo

## Phase 4: obstacles and rating
todo

## Open bugs
- The online build needs a phone copy of `ride_scooter.glb` (`tools/shrink_glb.py`, needs Pillow) and Node.js: cannot be run on this Mac yet.
