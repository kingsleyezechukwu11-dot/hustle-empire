# Blocktown (folder: hustle-empire)

A 3D browser life-sim. The game is `street_src/` (Three.js, one large `main.js` plus `index.html`). The Flutter folders only wrap it in a web view.

## Rules from the owner
- **Never deploy unless he says "deploy".** Build, check in the local preview, and stop.
- **Ask before committing or pushing.**
- He is not a developer: report in plain language, and check every change in the preview yourself before saying it is done.
- He pays per attempt: show a picture sheet before introducing a new look, and match his reference images closely.
- Design system: flat frosted-glass cards just above the passer-by bar, lime accent (`--lime:#b6f02c`), black icons, very little text.
- It must keep working in phone browsers.

Full notes, history and testing tricks are in `docs/claude-notes/` (read `hustle-empire-project.md` first). Copy those three files into this computer's Claude memory folder if you want them recalled automatically.

## First-time setup on a new computer
1. Install Node.js and Python 3 with Pillow (`pip3 install pillow`).
2. `cd street_src && npm install` (installs esbuild and three).
3. Build: `sh rebuild_preview.sh <folder>` writes `assets/street/index.html` and copies it to `<folder>` when given. That file is not kept in git.
4. Preview: `.claude/launch.json` has a `street` entry serving `assets/street`. On macOS the preview server cannot read the Desktop, so either keep the project outside the Desktop or serve a copy from another folder.

## Deploy (only when asked)
```
python3 tools/shrink_glb.py street_src/models build/mobile_src/models
node tools/build_web.mjs
npx -y wrangler@4 deploy --assets="$PWD/build/web" --name hustle-empire --compatibility-date 2026-11-13
```
Run the last line from a folder outside the project. It needs a Cloudflare sign-in (`npx wrangler login`).

## Where things are
- `street_src/models/` game models and `CREDITS.txt` (keep credits up to date for every download).
- `build/vehicles_src/` raw bike, scooter and skateboard models for a later stage.
- `tools/` build and model tools (`slim_char.py`, `shrink_glb.py`, `merge_glb.py`, `build_web.mjs`).
- `sheets/` picture sheets shown to the owner.
