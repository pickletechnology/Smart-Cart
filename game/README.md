# Cart Blanche — the Smart Cart video game

*Physics, floor it.*

A single-file HTML5 physics adventure game starring **Newt**, a self-aware
Smart Cart, versus the **Stationary Front** — a union of grumpy lab equipment
sworn to bring all motion to a stop. Everything in the game runs on honest
physics, and every fight, gate, and upgrade teaches some of it.

**Run it:** open `game/index.html` in any modern browser. Fully offline —
Three.js and all 3D assets are embedded/vendored. Keyboard: ◀ ▶ thrust,
▼ brake, Esc pause, R restart. Touch controls appear on mobile.

## What's in the game

- **4 worlds × 5 missions** (20 total), each world tied to a physics topic:
  *Vector Valley* (kinematics), *Grindstone Gulch* (friction & inclines),
  *The Conservatory* (energy), *The Colliseum* (momentum) — each ending in a
  boss fight (Delta Vee, Big Mu, Grand Dame Potentia, General Standstill).
- **Real physics engine** (120 Hz): F = ma along the slope, gravity g·sinθ
  on hills, rolling friction, quadratic drag, ballistic flight off crests,
  mud (μ×14) and ice (μ×0.1) zones. The HUD telemetry strip — velocity,
  acceleration, force, kinetic energy — is the same set of quantities the
  real Smart Cart streams over BLE.
- **PVE with kinetic-energy combat**: every enemy wears its KE threshold in
  joules; you destroy it only if your live ½mv² beats that number when you
  ram, otherwise you bounce and lose battery. Turrets lob real parabolic
  projectiles. Bosses take multiple hits and enrage.
- **Question gates**: 48 multiple-choice physics questions (12 per topic,
  each bank independently re-derived and corrected by a verifier pass)
  block checkpoints; correct answers pay points, XP, and battery.
- **Points, stars, and par scores** per mission; battery and time convert
  to bonus points at the finish.
- **Leveling**: XP from missions and questions; levels + beaten bosses
  unlock the next world.
- **Shop**: spend Joulies with Millie Volt on a stronger motor (thrust),
  slicker bearings (lower μ), a bigger battery (more health, but heavier —
  trade-offs are physics too), an impulse-damper shield, a coin magnet,
  and cosmetic car bodies.
- **Mission types**: reach, coin-collect, speed-window finishes, battles,
  and boss fights, over six procedural terrain profiles (seeded per mission,
  so a mission's track is always the same).
- Saves in `localStorage` (per browser). "Reset save" on the title screen.

## Assets

- **KayKit City Builder Bits 1.0** by Kay Lousberg (kaylousberg.com) — CC0.
  Buildings, cars (the player cart and several enemies/skins), streetlights,
  traffic lights, props. License copy in `assets/kaykit/LICENSE.txt`.
- **MagicaVoxel building models** (`assets/voxel/`) — uploaded pack of six
  voxel buildings used as skyline decoration.
- Everything else (terrain, gates, coins, effects, extra props) is generated
  procedurally in code.

### Asset pipeline

`tools/build-assets.mjs` parses every `.obj` under `assets/` into compact
quantized mesh data (positions ×1000, UVs ×10000, indexed, with bounding
boxes), base64-encodes the textures, and splices the result into
`index.html` between the `/*ASSETS_START*/ … /*ASSETS_END*/` markers.
To add more assets: drop `.obj` (+ texture) files into `assets/kaykit/`
(shared atlas) or `assets/voxel/` (per-model texture), run
`node game/tools/build-assets.mjs`, and reference the new mesh names in
`WORLD_ART`/`extraProp` in `index.html`.

## Content pipeline

The theme, mission set, enemy roster, shop economy, and question banks were
generated as structured JSON by a multi-agent workflow (three competing
creative directions judged and synthesized; question banks written per topic
then adversarially re-derived by an independent checker) and embedded at the
`/*__GAME_DATA__*/` marker. The game reads everything from that `DATA`
constant, so content can be regenerated or hand-edited without touching the
engine.
