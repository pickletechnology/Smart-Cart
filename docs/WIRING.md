# Wiring — Smart Cart V1

The firmware targets an **ESP32** (BLE + two hardware I²C-capable pins). Pin
assignments below are taken directly from `firmware/PhysicsCart_V1/PhysicsCart_V1.ino`.

## I²C bus (shared)

`Wire.begin(21, 22)` at 400 kHz.

| Signal | ESP32 pin |
|---|---|
| SDA | GPIO 21 |
| SCL | GPIO 22 |

Two devices share this bus:

| Device | Address | Purpose |
|---|---|---|
| MPU-6050 | `0x68` | 3-axis accelerometer + 3-axis gyroscope |
| AS5600 | `0x36` (fixed) | Magnetic rotary encoder — wheel angle and angular speed |

Both need 3.3 V and ground. The AS5600 breakout usually carries its own pull-ups;
if you have pull-ups on both boards the bus may still work, but drop one set if
you see I²C errors.

## HX711 load cell amplifier

| Signal | ESP32 pin |
|---|---|
| DOUT | GPIO 19 |
| SCK  | GPIO 18 |
| VCC  | 3.3 V (or 5 V if your board is 5 V-tolerant on data lines) |
| GND  | GND |

The load cell itself wires to the HX711 in the usual bridge arrangement
(E+/E−/A+/A−). Colour codes vary by cell — check your load cell's datasheet
rather than assuming.

## AS5600 magnet

The AS5600 reads a **diametrically magnetised** magnet mounted on the axle end,
centred over the chip and typically 0.5–3 mm away. `encoder.begin(4)` sets the
direction-control pin to GPIO 4. If your breakout has no DIR pin, tie it as the
board documents; a reversed reading shows up as negative RPM for forward motion.

## Power

Any supply that gives the ESP32 a clean 3.3 V rail. The HX711 is the noise-
sensitive part of this circuit — keep its wiring short, away from motor or
battery leads, and grounded to the same point as the ESP32.

## Quick check

With everything wired and powered, an I²C scanner sketch should report `0x68`
and `0x36`. If either is missing, fix that before flashing the cart firmware.
