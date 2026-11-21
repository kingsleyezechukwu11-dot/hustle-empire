---
name: feedback-blocktown-design-system
description: Blocktown UI rules - glossy white curved cards like the menu, lemon/lime green accent (Apple Fitness), very little text
metadata:
  type: feedback
---

New Blocktown screens must look like the places menu: glossy WHITE surfaces/tiles floating in front of the character on a curve - not dark panels. Accent colour is a lemon yellow-green ("Apple Fitness" lime), not yellow or blue. Keep text to the bare minimum (e.g. "First errand", "Pick up at No. 5", "Deliver to No. 12" - no distances, no "Level 1 · Errand 1 of 3", no explanations).

UPDATE 2026-11-19 (later): he dropped the curve - cards are FLAT frosted glass ("don't make it curved again"), placed just above the avatar bar at the bottom. When he sends a reference image, match it closely. Icons inside tiles are black, not lime; lime is for accents (Start button, timer, selection ring, life hearts).

**Why:** on 2026-11-19 he rejected the dark errand card I built ("I told you to maintain the same design system… I don't want too many texts").
**How to apply:** reuse the menu's white tile + curved ring look and the lime accent for any new UI in [[hustle-empire-project]]; if a genuinely new design element is needed, show him a picture first. Related: [[feedback-blocktown-no-deploy]].

Travel picker (errand page 2), 2026-11-19: he rejected the pastel coloured-pad carousel as "outdated". Now: big frosted stage with lime floor glow, one large item, speed segments chip, round arrow buttons, row of 4 glass tiles (lime ring = selected, lock badge), full-width Start / dark price pill. CSS classes .pick .rail/.opts/.op (do not name things .tab/.tabs: clashes with existing rules).

Picker v3 (2026-11-19, liked the direction): one glossy card, no inner stage box, no lime glow, no floor ring, no speed bars, no subtitle. Title = lime pill with black text (he asked for lemon-green titles). Character walks (walkSheet/walkPlay sprite sheet), items slide (.trk --at) with left/right arrows.
