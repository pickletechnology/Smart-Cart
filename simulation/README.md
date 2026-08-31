# Smart Cart Lab — Physics Simulation

A browser-based simulation of the Smart Cart V1 for physics labs. Students set
up the same experiments they would run with the real cart — a hanging mass over
a pulley, an inclined track, a fan force, a collision with a spring bumper —
and read the same quantities the real hardware reports, in the same format.

**Run it:** open `index.html` in any modern browser. No build step, no server,
no internet connection required (Three.js is vendored in `vendor/`).

```
simulation/
├── index.html          The whole application (UI, physics, rendering)
├── vendor/
│   └── three.min.js    Three.js r128 (MIT), vendored for offline lab use
└── README.md           This file
```

## What it simulates

The apparatus is a track on a lab table, with:

| Element | Parameter | Range |
|---|---|---|
| Track length | table and camera resize with it | 0.60–2.00 m |
| Track incline | pivots at the pulley end, far end rises | 0–20° |
| Cart | mass (V1 printed cart ≈ 250 g default) | 150–1500 g |
| Hanging mass | string over an end pulley, classic modified Atwood | 0–300 g |
| Fan force | constant thrust along the track | ±1 N |
| Friction | single coefficient, kinetic + static (μₛ = 1.15 μₖ) | 0–0.30 |
| Spring bumper | at the pulley end, 900 N/m, tunable elasticity | 30–100 % |
| Initial push | initial velocity applied at t = 0 | ±1.2 m/s |

Five presets set these up as the classic experiments (Newton's second law,
inclined release, fan cart, bumper collision, static friction hold); every
slider stays live for custom setups.

### Equations of motion

Let `x` be the cart's distance from the pulley along the track and θ the
incline (the pulley end is the low end). With cart mass *m꜀*, hanging mass
*mₕ* and normal force *N = m꜀g cos θ*:

- **String taut** (coupled system, tension cannot be negative):
  `(m꜀ + mₕ) ẍ = F_fan + F_bumper − m꜀g sin θ − mₕg ∓ μₖN`
  and the tension the force sensor reads is `T = mₕ(g + ẍ)`.
- **String slack / no hanging mass:** the cart moves alone and the mass
  free-falls. When the cart re-tensions the string, the snap is resolved by
  momentum conservation along the string (both bodies jump to the common
  constraint velocity), and the jolt shows up on the simulated IMU.
- **Mass lands:** when the hanging mass reaches the floor the string goes
  slack — the classic "acceleration stops mid-run" feature of this lab.
- **Static friction** holds the cart whenever it is at rest and the net
  driving force is below μₛN (so a cart on a shallow incline genuinely
  does not move until tan θ exceeds μₛ).
- **Bumper:** a damped spring (`F = kΔx − cẋ`, k = 900 N/m); the damping
  is derived from the elasticity slider, and the contact force is what the
  hook force sensor reports (negative = compression), so students can see
  that a collision is a brief, large force and measure the impulse.

Integration is semi-implicit Euler at 240 Hz — four physics substeps per
sensor sample, so collisions and string snaps are resolved well below the
sensor timescale.

### The sensor pipeline mirrors the V1 firmware

The point of the app is that students practice on *instrument readings*, not
on idealized values, so the measurement chain from
`firmware/PhysicsCart_V1/PhysicsCart_V1.ino` is reproduced:

- Sensors sample at **60 Hz**; the BLE JSON line is emitted at **20 Hz** in
  the exact `snprintf` format and precision of the firmware
  (`{"t":…,"ax":…,…,"v":…}` — see `docs/BLE_PROTOCOL.md`).
- **IMU (MPU-6050):** reports *specific force* in g, so `az ≈ cos θ` at rest
  (≈ +1 g on the level — the firmware's calibration check) and `ax ≈ 0`
  during frictionless free roll, because an accelerometer measures proper
  acceleration. Bumper impacts ring the chassis at ~42 Hz. The cart's IMU
  x-axis points toward the pulley, matching how the cart is set on the track.
- **Wheel encoder (AS5600):** wheel angle wraps 0–360°, RPM goes through the
  firmware's 5-sample moving average and is forced to zero below 2 RPM, and
  reported velocity is `(RPM / 60) × π × d` — with **d = 34 mm**, the size the
  V1 wheel actually prints at (see "Known V1 issues" in the root README).
- **Load cell (HX711):** reads the hook — string tension positive, bumper
  compression negative, `FORCE_OFFSET = 0` (a freshly calibrated cart).
- **Noise toggle:** Gaussian sensor noise at realistic levels
  (σ ≈ 3 mg accel, 0.15 °/s gyro, 15 mN force, 0.8 RPM encoder jitter).
  Switch it off to compare against clean theory.

### Displays

- Live readout tiles: position, velocity, acceleration, hook force, wheel
  RPM, and the IMU's `az` (the "is the cart level?" sanity check).
- Three strip charts (10 s window): velocity, acceleration, hook force —
  plotting what the *sensors* report, like real DAQ software.
- A **BLE Notify console** streaming the exact 20 Hz JSON lines, so students
  can develop and test a client against `docs/BLE_PROTOCOL.md` behavior
  before touching hardware.
- **CSV export** (download or copy): 60 Hz samples with both the sensor
  readings and the true kinematic values side by side, for analysis in a
  spreadsheet — comparing the two *is* a good lab exercise.

### Rendering

Three.js with physically-based materials, one warm key light casting soft
shadows (2048² PCF), a cool hemisphere sky term for ambient, and ACES filmic
tone mapping. Scene units are metres and the geometry matches the build: a
34 mm wheel is a 34 mm wheel on screen.

## Suggested lab exercises

1. **Newton's second law** — vary the hanging mass, measure the slope of the
   velocity trace, compare with `a = mₕg / (m꜀ + mₕ)`. Explain the kink in
   the trace when the mass hits the floor.
2. **g from an incline** — release from rest at several angles, plot `a`
   against `sin θ`, extract g from the slope and μ from the intercept.
3. **Proper acceleration** — explain why `ax` reads ≈ 0 while the cart rolls
   freely downhill but `−sin θ` when it is held still.
4. **Impulse–momentum** — integrate the force spike of a bumper collision
   (export CSV) and compare with the measured Δv, at several elasticities.
5. **Static vs kinetic friction** — with μ = 0.15, raise the incline slowly
   until the cart breaks away; compare the break-away angle with arctan μₛ.
