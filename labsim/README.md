# The Physics Company

*Making Motion Happen™* — an AP® Physics 1 lab-career game built on the Smart
Cart simulation. You've been hired by The Physics Company's Field Test Division
to certify the **SC-01 Smart Cart** through six laboratory evaluations. Run the
experiments, read **your own** recorded data, and type numeric answers (with
units) that are checked against that data.

**Run it:** open `labsim/index.html` in any browser — fully offline, all assets
embedded. Enter your name at hiring (it goes on your printable transcript).

## How learning works here

- **Six labs, one per AP Physics 1 unit**, each an in-depth multi-part
  worksheet (5 calculations + 1 concept question, labeled like AP parts):
  1. **Kinematics** — Baseline Certification (position/time tables, x = ½at²)
  2. **Dynamics & friction** — The Grip Department (μs = tan θ from a tilt
     test; μk from measured a on an incline; three real surfaces)
  3. **Energy** — The Conservation Audit (outdoor mountain range; mgh → ½mv²;
     % difference; work–energy on a gravel patch)
  4. **Momentum** — Impact Assessment (load-cell impulse ∫F dt vs Δp; elastic
     and perfectly inelastic collisions with Cart B)
  5. **Simple harmonic motion** — Resonance Division (period from zero
     crossings; k = 4π²m/T²; prediction with added mass)
  6. **Rotation** — Full Certification (ω from real RPM; v = ωr; α; rolling
     without slipping)
- **Answers are numeric + unit**, checked against the student's own run within
  ±4% (unit must be right too). Pay decays 100% → 70% → 40%: after two misses
  the worked solution appears, but the student must still enter the correct
  value to proceed. Nobody gets stuck; guessing still costs.
- **Experiment parameters are randomized per session** (friction coefficients,
  spring constants), so answers can't be shared — only methods can.
- **Sensors are upgrades**: the cart starts with just position (ruler +
  stopwatch). Buying the real V1 hardware unlocks capability — the AS5600
  encoder unlocks velocity telemetry, the MPU-6050 acceleration, the HX711
  load cell force/impulse — and each is required by a later lab (stipends in
  the story keep them affordable).
- **The transcript** (HQ → Transcript) is a printable/saveable certification
  record: name, hire date, per-lab score, attempt counts, and pay — evidence a
  teacher can check.

## The story

Corporate comedy with a mystery: memos from Marla Joule (Director of Cart
Reliability, extremely fast in hallways) assign each lab, HR sends automated
warnings about naming company property, and recovered notes from vanished
Test Engineer #7 accumulate after each lab… ending with a message from the
SC-01 itself. Cosmetic upgrades (shells, LED colors, accessories) and office
furniture purchases make your corner of the company visibly cooler; a framed
certificate appears on your wall for every lab passed.

## Assets

- **KayKit Block Bits** and **KayKit Furniture Bits** by Kay Lousberg
  (kaylousberg.com), CC0 — test-chamber blocks, surfaces (metal/sand/frost/
  gravel), office furniture. Licenses in `assets/*/LICENSE.txt`.
- **MountainRocks** voxel pack (user-provided) — the outdoor test range and
  the office window view.
- The SC-01 itself is procedural, with sensor modules that visibly bolt on as
  you buy them.

`tools/build-assets.mjs` parses everything under `assets/` into compact mesh
data embedded between the `/*ASSETS_START*/` markers — drop in new `.obj`
files (with `atlas.png` for shared-atlas packs, or per-model `.png`) and
re-run it.

## Engine notes

Physics integrates at 240 Hz per lab-specific force model; telemetry records
at 60 Hz into the data table (0.5 s rows), charts, and an events line (slip
angle, impulse, contact time, zero crossings…). Question generators compute
accepted answers from the same recorded arrays the student reads, so the
numbers always agree with the screen. AP® is a trademark of the College
Board, which was not involved in and does not endorse this project.
