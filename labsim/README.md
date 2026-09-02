# The Physics Company

*Making Motion Happen™* — an AP® Physics 1 lab-career game built on the Smart
Cart simulation. You've been hired by The Physics Company's Field Test Division
to certify the **SC-01 Smart Cart** through seven laboratory evaluations. Run
the experiments, read **your own** recorded data, and type numeric answers
(with units) that are checked against that data.

**Run it:** open `labsim/index.html` in any browser — fully offline, all assets
embedded. Enter your name at hiring (it goes on your printable transcript).

## The shape of a day

- **Title screen** over a living city street (traffic, pedestrians, the TPC
  building), then a skippable **cinematic intro**: your character drives in,
  parks, walks to the front door — and sits down with **R. Fulcrum, Founder &
  Owner**, who explains exactly what you've signed up for (click / Space
  through the dialogue).
- **The lab floor is walkable** (WASD/arrows or click-to-walk, E to use):
  a test bench where the labs run, a workshop desk where the SC-01 gets
  modified, a mail terminal for Marla's memos (many take **replies** — pick
  one, she answers), an equipment wall, the Deep End tank, a records desk with
  your transcript, Engineer #7's taped-off desk… and your cot.
- **Bench setup, PC-Building-Simulator style**: every lab starts with a parts
  tray — click a part, click its glowing spot; **right-click a placed part**
  to take it back. **Drag to orbit the bench, scroll to zoom**; while setting
  up, the camera frames the whole track so every slot is in reach. Cart on
  the track, pulley clamped past the 10 m mark, hanging mass over the pulley,
  spring bumper, Cart B, the Deep End's tank/boom/test cylinder. Nothing runs
  until the bench is built, and Lab 01 walks first-timers through it step by
  step.
- **After each certified lab you clock out**: a night-time sleep cutscene ends
  the day (DAY N COMPLETE), the day counter and your clearance level tick up —
  and the lab wakes up a little more lived-in: coffee cups, takeout cartons
  and pizza boxes accumulate with every certification.
- **Engineer #7's notes are physical**: after each lab, one turns up somewhere
  on the lab floor. Walk to the glow and read it where it fell.

## How learning works here

- **Seven labs, one per AP Physics 1 unit** (fluids included, per the 2024+
  curriculum), each an in-depth multi-part worksheet (5 calculations + 1
  concept question, labeled like AP parts):
  1. **Kinematics** — Baseline Certification (position/time tables, x = ½at²;
     the boost pass is a hanging mass over the end pulley)
  2. **Dynamics & friction** — The Grip Department (μs = tan θ from a tilt
     test; μk from measured a on an incline; three real surfaces)
  3. **Energy** — The Conservation Audit (outdoor mountain range; mgh → ½mv²;
     % difference; work–energy on a gravel patch)
  4. **Momentum** — Impact Assessment (load-cell impulse ∫F dt vs Δp; elastic
     and perfectly inelastic collisions with Cart B)
  5. **Simple harmonic motion** — Resonance Division (period from zero
     crossings; k = 4π²m/T²; prediction with added mass)
  6. **Rotation** — The Spin Cycle (ω from real RPM; v = ωr; α; rolling
     without slipping)
  7. **Fluids** — The Deep End (weigh a test cylinder in air, submerge it on
     the load-cell winch; F_b = F_air − F_sub; ρ = F_b/Vg for water and brine
     from the student's own readings)
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

Corporate comedy with a mystery, told interactively: memos from Marla Joule
(Director of Cart Reliability, extremely fast in hallways — watch the
sidewalk) assign each lab and take replies; HR sends automated warnings about
naming company property; and physical notes from vanished Test Engineer #7
turn up on the lab floor after each certification… ending with a message from
the SC-01 itself (which also takes a reply). Days pass, clearance levels rise,
takeout accumulates, certificates fill the wall, and cosmetic upgrades
(shells, LED colors, accessories, office furniture) make your corner of the
company visibly yours. The finale is a warm one — listen to the LED.

## Assets

- **KayKit Block Bits**, **KayKit Furniture Bits**, and **KayKit City Bits**
  by Kay Lousberg (kaylousberg.com), CC0 — test-chamber blocks, surfaces
  (metal/sand/frost/gravel), furniture, and the city street, buildings and
  cars. Licenses in `assets/*/LICENSE.txt`.
- **OFFICE** low-poly pack (user-provided, converted from `.glb` via
  `tools/convert-glb.mjs`) — desks, chairs, computers, cabinets, coffee
  machine, water cooler and friends.
- **MountainRocks** voxel pack (user-provided) — the outdoor test range.
- The SC-01 itself is procedural, with sensor modules that visibly bolt on as
  you buy them; the characters (you, Marla, pedestrians) are procedural
  low-poly walkers.

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
