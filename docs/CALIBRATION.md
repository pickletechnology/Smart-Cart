# Calibration — Smart Cart V1

Every constant here lives at the top of
`firmware/PhysicsCart_V1/PhysicsCart_V1.ino`. Recalibrate after any mechanical
change — a new load cell, a reprinted wheel, a remounted sensor.

## 1. Wheel diameter — `WHEEL_DIAMETER_M`

```cpp
const float WHEEL_DIAMETER_M = 0.065;  // metres
```

Velocity is computed as `(RPM / 60) × π × WHEEL_DIAMETER_M`, so an error here
scales every velocity reading proportionally.

The V1 wheel STL measures **34 mm** (0.034 m) across, while the constant is set
to 65 mm. Measure the wheel you actually printed and assembled — with any tyre,
o-ring, or grip surface fitted, since that is what contacts the track — and set
the constant to that value in metres. Sanity-check by rolling the cart a
measured 1.000 m and confirming the integrated velocity lands near 1 m.

## 2. Load cell — `CALIBRATION_FACTOR`

```cpp
const float CALIBRATION_FACTOR = -33.0;  // raw units per gram
```

1. Flash a sketch that prints `scale.get_units()` with the scale factor set to `1.0`.
2. With nothing on the cell, note the raw reading, then call `tare()`.
3. Place a known mass (a calibration weight, or anything you have measured on an
   accurate scale) and note the new raw reading.
4. `CALIBRATION_FACTOR = (loaded_raw − tared_raw) / known_mass_in_grams`.
5. Keep the sign — negative simply means the cell is wired or loaded in the
   opposite sense, which is fine.

Verify with a second, different mass. The reading should be within a few percent.

## 3. Force zero — `FORCE_OFFSET`

```cpp
const float FORCE_OFFSET = 5396.799;  // newtons
```

This is added to every force reading:
`force_N = (grams / 1000 × 9.81) + FORCE_OFFSET`.

Note that the firmware already calls `scale.tare(20)` at boot, which zeroes the
cell in hardware. A non-zero `FORCE_OFFSET` on top of that shifts every reported
force by a constant — the value above is large enough that it dominates the
signal, so it is almost certainly a leftover from an earlier calibration run.
**Unless you know why you need it, set it to `0.0`.** If you do need an offset,
derive it as the average steady-state force reported with the cart at rest and
unloaded, negated.

## 4. IMU offsets — `ACCEL_*_OFFSET`, `GYRO_*_OFFSET`

```cpp
const float ACCEL_X_OFFSET = 0.0;
const float ACCEL_Y_OFFSET = 0.0;
const float GYRO_X_OFFSET  = 0.0;
const float GYRO_Y_OFFSET  = 0.0;
const float GYRO_Z_OFFSET  = 0.0;
```

With the cart level and completely still, log `ax`, `ay`, `gx`, `gy`, `gz` for
about 10 seconds and average each. Those averages are your offsets — the
firmware subtracts them.

`accelZ` is deliberately **not** offset-corrected: it should read ≈ +1.0 g at
rest, since it carries gravity. Use that as your check that the IMU is level and
scaled correctly.

## 5. Noise floor — `RPM_THRESHOLD` and `NUM_SAMPLES`

```cpp
const float RPM_THRESHOLD = 2.0;   // below this, RPM is reported as 0
const int   NUM_SAMPLES   = 5;     // moving-average window
```

Encoder jitter makes a stationary wheel report small non-zero RPM. Watch the
reported RPM with the cart at rest and set `RPM_THRESHOLD` just above the
observed noise. Raising `NUM_SAMPLES` smooths the signal but adds lag — at 60 Hz
sampling, 5 samples is about 83 ms of averaging.

## Calibration record

Fill this in for your build so the numbers are not lost between sessions.

| Constant | V1 default | Your value | Date | Notes |
|---|---|---|---|---|
| `WHEEL_DIAMETER_M` | 0.065 | | | Measure the assembled wheel |
| `CALIBRATION_FACTOR` | −33.0 | | | |
| `FORCE_OFFSET` | 5396.799 | | | Consider 0.0 |
| `ACCEL_X_OFFSET` | 0.0 | | | |
| `ACCEL_Y_OFFSET` | 0.0 | | | |
| `GYRO_X_OFFSET` | 0.0 | | | |
| `GYRO_Y_OFFSET` | 0.0 | | | |
| `GYRO_Z_OFFSET` | 0.0 | | | |
| `RPM_THRESHOLD` | 2.0 | | | |
