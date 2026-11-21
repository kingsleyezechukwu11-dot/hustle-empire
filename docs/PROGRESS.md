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

## Phase 1: economy and transport
| Task | Status | Notes |
|---|---|---|
| 1.1 Config + logic modules, test runner, safe money functions, N100,000 start | passed | Reviewer PASS, 48 unit tests. Follow-ups folded into 1.2: stuck keyboard keys (old bug), balance display clamp, zero-fee wording. |
| 1.2 Transport picker: buy once, owned, greyed with shortfall, confirmation, counter animates down | passed | Reviewer PASS, 69 unit tests. Scooter = owner's Vino model slimmed to 309 KB. Minor defects carried into 1.3: Start appears under the finger right after Buy; small-phone overlap with the minimap; scooter picture lacks its box; car paint reads green not lime. |
| 1.3 Riding: vehicle appears beside you, mount / dismount, speeds, where each may go | todo | |
| 1.4 Pay range N3,000 to N15,000 by distance and package | todo | built together with 1.3 |

## Phase 2: carrying
todo

## Phase 3: chase
todo

## Phase 4: obstacles and rating
todo

## Open bugs
- The online build needs a phone copy of `ride_scooter.glb` (`tools/shrink_glb.py`, needs Pillow) and Node.js: cannot be run on this Mac yet.
