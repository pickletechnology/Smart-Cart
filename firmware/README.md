# Firmware — Smart Cart V1

`PhysicsCart_V1/PhysicsCart_V1.ino` — the complete cart firmware. Reads the
MPU-6050, HX711 load cell, and AS5600 encoder, and streams the combined state
over BLE as JSON.

## Board

ESP32 (any dev board with BLE). Select it in **Tools → Board** before compiling;
the sketch uses the ESP32 BLE stack (`BLEDevice.h` and friends), which ships with
the ESP32 Arduino core.

## Library dependencies

Install through **Sketch → Include Library → Manage Libraries…**:

| Library | Used for |
|---|---|
| `HX711` (bogde) | Load cell amplifier |
| `AS5600` (RobTillaart) | Magnetic rotary encoder |

`Wire.h` and the `BLE*` headers come from the ESP32 core — nothing to install.

## Flashing

1. Install the ESP32 board support package (Boards Manager URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`).
2. Open `PhysicsCart_V1/PhysicsCart_V1.ino`. The folder name must keep matching
   the sketch name — Arduino requires it.
3. Select your ESP32 board and port, then Upload.

## Loop timing

| Task | Rate | Constant |
|---|---|---|
| Sensor sampling | 60 Hz | `SENSOR_INTERVAL_US = 16667` |
| BLE notification | 20 Hz | `BLE_INTERVAL_MS = 50` |

## Before you trust the data

Work through [`../docs/CALIBRATION.md`](../docs/CALIBRATION.md). Two constants in
particular ship with values that will not be right for your build:
`WHEEL_DIAMETER_M` (65 mm, against a 34 mm V1 wheel STL) and `FORCE_OFFSET`
(5396.799 N, on top of an automatic boot-time tare).

## Output

BLE JSON at 20 Hz — see [`../docs/BLE_PROTOCOL.md`](../docs/BLE_PROTOCOL.md) for
the field-by-field payload description.

Note that the header comment mentions Serial Monitor output, but this version
does not call `Serial.begin()` or print anything. BLE is the only output path in
V1. Adding serial logging is a natural V1.1 change.
