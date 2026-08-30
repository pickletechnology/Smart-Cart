# Smart Cart

An instrumented physics cart. An ESP32 reads acceleration, force, and wheel
rotation, and streams the combined state over Bluetooth LE to the Physics Cart
app at 20 Hz.

**Current version: V1** — the first complete build. Firmware and 3D-printable
hardware in this repository are all tagged `V1`.

## What's here

```
Smart-Cart/
├── firmware/
│   ├── README.md                       Board, libraries, flashing
│   └── PhysicsCart_V1/
│       └── PhysicsCart_V1.ino          Complete cart firmware
├── hardware/
│   ├── README.md                       Parts list and print settings
│   └── stl/
│       ├── Cart_Casing_8mm_Bearing_V1.stl   Main chassis      ×1
│       ├── Wheel_8mm_Bearing_V1.stl         Wheel             ×4
│       ├── Bearing_Casing_8mm_V1.stl        Bearing housing   ×4
│       └── Axle_8mm_V1.stl                  Axle              ×2
└── docs/
    ├── WIRING.md                       Pinout and sensor connections
    ├── CALIBRATION.md                  Every tunable constant, and how to set it
    └── BLE_PROTOCOL.md                 Service UUIDs and JSON payload format
```

## Hardware

| Component | Role | Interface |
|---|---|---|
| ESP32 | Controller, BLE peripheral | — |
| MPU-6050 | 3-axis accelerometer + gyroscope | I²C `0x68` |
| AS5600 | Magnetic rotary encoder (wheel angle / speed) | I²C `0x36` |
| HX711 + load cell | Force measurement | GPIO 19 (DOUT) / 18 (SCK) |

All printed parts are built around 8 mm bore bearings. Full pinout in
[`docs/WIRING.md`](docs/WIRING.md).

## Getting started

1. **Print the parts** — [`hardware/README.md`](hardware/README.md). Start with
   the axles and bearing casings to check your printer's tolerance against the
   8 mm bearings.
2. **Wire the electronics** — [`docs/WIRING.md`](docs/WIRING.md). Confirm both
   I²C devices appear on a scanner sketch before flashing.
3. **Flash the firmware** — [`firmware/README.md`](firmware/README.md).
4. **Calibrate** — [`docs/CALIBRATION.md`](docs/CALIBRATION.md). Do not skip
   this; two V1 constants ship with placeholder values.
5. **Connect** — the cart advertises as `PASCO_Cart`. Pair from the Physics Cart
   app, or write your own client against
   [`docs/BLE_PROTOCOL.md`](docs/BLE_PROTOCOL.md).

## Data output

20 Hz JSON notifications over BLE:

```json
{"t":12.34,"ax":0.012,"ay":-0.003,"az":0.998,"gx":0.1,"gy":-0.2,"gz":0.0,"f":0.482,"a":180.5,"r":42.3,"v":0.144}
```

Time (s), acceleration (g), angular rate (°/s), force (N), wheel angle (°),
wheel speed (RPM), and linear velocity (m/s).

## Known V1 issues

These are carried forward from the working build and left as-is in V1 so the
code in this repo matches the cart that was actually running. Each is worth
addressing in the next revision:

- **`WHEEL_DIAMETER_M` is 0.065 m, but the V1 wheel STL is 34 mm across.**
  Velocity scales directly with this constant, so it must be set to the wheel
  you actually built before velocity readings mean anything.
- **`FORCE_OFFSET` is 5396.799 N** and is added on top of the automatic
  boot-time `tare()`. It looks like a leftover from an earlier calibration run —
  `0.0` is the sensible default for a fresh build.
- **No serial output.** The header comment advertises Serial Monitor output, but
  the sketch never calls `Serial.begin()`. BLE is the only output in V1.
- **IMU offsets are all zero** — they are placeholders awaiting a real
  still-cart calibration run.

## Versioning

`V1` marks the first complete cart: firmware, chassis, wheels, bearing casings,
and axles as built. Future revisions get their own `V2` files rather than
overwriting these, so a printed cart can always be matched back to the firmware
it was built with.
