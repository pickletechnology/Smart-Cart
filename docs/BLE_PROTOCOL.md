# BLE Protocol — Smart Cart V1

## Advertising

| Property | Value |
|---|---|
| Device name | `PASCO_Cart` |
| Service UUID | `4fafc201-1fb5-459e-8fcc-c5c9c331914b` |
| Characteristic UUID | `beb5483e-36e1-4688-b7f5-ea07361b26a8` |
| Characteristic properties | `READ`, `NOTIFY` (with a `0x2902` CCCD descriptor) |

The name `PASCO_Cart` is what the Physics Cart app scans for — changing it in the
firmware means the app will no longer find the cart.

## Data flow

- Sensors are sampled at **60 Hz** (`SENSOR_INTERVAL_US = 16667`).
- Notifications are sent at **20 Hz** (`BLE_INTERVAL_MS = 50`), only while a
  central is connected.
- On disconnect the firmware waits 500 ms and restarts advertising, so a client
  can reconnect without power-cycling the cart.

## Payload

Each notification is a UTF-8 JSON object, written into a 220-byte buffer:

```json
{"t":12.34,"ax":0.012,"ay":-0.003,"az":0.998,"gx":0.1,"gy":-0.2,"gz":0.0,"f":5396.799,"a":180.5,"r":42.3,"v":0.144}
```

| Key | Quantity | Unit | Notes |
|---|---|---|---|
| `t` | Time since boot | s | 2 decimal places |
| `ax` | Acceleration X | g | ±2 g range (16384 LSB/g) |
| `ay` | Acceleration Y | g | |
| `az` | Acceleration Z | g | Not offset-corrected — carries the 1 g gravity term |
| `gx` | Angular rate X | °/s | ±250 °/s range (131 LSB/°/s) |
| `gy` | Angular rate Y | °/s | |
| `gz` | Angular rate Z | °/s | |
| `f` | Force | N | Load cell, includes `FORCE_OFFSET` |
| `a` | Wheel angle | ° | AS5600, 0–360 |
| `r` | Wheel speed | RPM | 5-sample moving average; forced to 0 below 2 RPM |
| `v` | Linear velocity | m/s | Derived: `(RPM / 60) × wheel circumference` |

Acceleration is reported in **g**, not m/s² — multiply by 9.81 on the client if
you want SI units.

## Writing a client

1. Scan for `PASCO_Cart` or filter on the service UUID.
2. Connect, discover the service, and subscribe to notifications on the
   characteristic (write `0x0001` to its CCCD).
3. Parse each notification as JSON. Expect ~20 messages per second.

There are no writable characteristics in V1 — the cart is send-only. Taring,
calibration, and zeroing all happen in firmware at boot.
