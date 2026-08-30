# Hardware — Smart Cart V1

3D-printable parts for the V1 physics cart. All models are binary STL, dimensioned
in millimetres, and built around **8 mm bore bearings**.

## Parts list

| File | Part | Bounding box (mm) | Triangles | Qty per cart |
|---|---|---|---|---|
| `stl/Cart_Casing_8mm_Bearing_V1.stl` | Main cart chassis / body | 165.0 × 31.8 × 90.0 | 11,164 | 1 |
| `stl/Wheel_8mm_Bearing_V1.stl` | Wheel with bearing seat | 34.0 × 13.3 × 34.0 | 1,192 | 4 |
| `stl/Bearing_Casing_8mm_V1.stl` | Bearing housing / retainer | 16.0 × 6.5 × 8.2 | 876 | 4 |
| `stl/Axle_8mm_V1.stl` | Axle | 4.5 × 41.6 × 4.5 | 842 | 2 |

## Non-printed hardware

- 8 mm bore ball bearings (one per wheel seat)
- Fasteners to suit the chassis mounting holes

## Suggested print settings

These are starting points, not measured-and-proven values — tune for your printer.

| Setting | Chassis | Wheels / bearing casings / axles |
|---|---|---|
| Material | PLA or PETG | PLA or PETG |
| Layer height | 0.20 mm | 0.16 mm |
| Walls | 3 | 3–4 |
| Infill | 20–25 % | 40 % |
| Supports | Only where overhangs require | Usually none |

Print the axles and bearing casings first — they are quick, and they confirm your
printer's tolerance against the 8 mm bearings before you commit to the ~4 hour
chassis print.

## Wheel diameter and the firmware

The V1 wheel STL measures **34 mm** across. The firmware's `WHEEL_DIAMETER_M`
constant currently reads `0.065` (65 mm). Velocity is derived from wheel
circumference, so this constant must match the wheel that is actually on the
cart — measure your printed-and-assembled wheel (including any tyre or grip
surface) and set it before trusting velocity data. See
[`../docs/CALIBRATION.md`](../docs/CALIBRATION.md).
