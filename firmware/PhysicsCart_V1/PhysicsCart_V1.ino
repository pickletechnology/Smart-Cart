// ════════════════════════
// Physics Cart V1 — Complete Firmware
// Sensors: MPU-6050, HX711, AS5600
// Output:  Bluetooth BLE + Serial Monitor
// ════════════════════════

#include <Wire.h>
#include <HX711.h>
#include <AS5600.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ── Pin Definitions ──
#define HX711_DOUT  19
#define HX711_SCK   18
const int MPU_ADDR = 0x68;

// ── Calibration Constants (update after calibrating) ──
const float CALIBRATION_FACTOR  = -33.0;     // raw units per gram
const float FORCE_OFFSET        = 5396.799;  // zero offset (N)
const float GRAVITY             = 9.81;
const float WHEEL_DIAMETER_M    = 0.065;     // measure your wheel (m)
const float WHEEL_CIRCUMFERENCE = WHEEL_DIAMETER_M * 3.14159;
const float RPM_THRESHOLD       = 2.0;       // below this = stopped
const int   NUM_SAMPLES         = 5;         // RPM averaging window

const float ACCEL_X_OFFSET = 0.0;
const float ACCEL_Y_OFFSET = 0.0;
const float GYRO_X_OFFSET  = 0.0;
const float GYRO_Y_OFFSET  = 0.0;
const float GYRO_Z_OFFSET  = 0.0;

// ── BLE UUIDs ──
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *pCharacteristic;
BLEServer         *pServer;
bool deviceConnected = false;
bool wasConnected    = false;

class MyCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer)    { deviceConnected = true; }
  void onDisconnect(BLEServer *pServer) { deviceConnected = false; }
};

const unsigned long SENSOR_INTERVAL_US = 16667; // 60Hz
const unsigned long BLE_INTERVAL_MS    = 50;    // 20Hz
unsigned long lastSensorUpdate = 0;
unsigned long lastBLEUpdate    = 0;
unsigned long startTime;

HX711  scale;
AS5600 encoder;
float rpmSamples[NUM_SAMPLES] = {0};
int   sampleIndex = 0;

float accelX, accelY, accelZ;
float gyroX, gyroY, gyroZ;
float lastNewtons = 0;
float angle, rpm, velocity, seconds;

void setup() {
  Wire.begin(21, 22);
  Wire.setClock(400000);
  delay(1000);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); Wire.write(0);
  Wire.endTransmission(true);
  scale.begin(HX711_DOUT, HX711_SCK);
  delay(2000);
  if (scale.is_ready()) { scale.set_scale(CALIBRATION_FACTOR); scale.tare(20); }
  encoder.begin(4);
  BLEDevice::init("PASCO_Cart");   // matches the Physics Cart App
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  BLEAdvertising *pAdv = pServer->getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->setMinPreferred(0x06);
  pAdv->start();
  startTime = millis();
}

void readSensors() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);
  int16_t ax = Wire.read() << 8 | Wire.read();
  int16_t ay = Wire.read() << 8 | Wire.read();
  int16_t az = Wire.read() << 8 | Wire.read();
  Wire.read(); Wire.read();
  int16_t gx = Wire.read() << 8 | Wire.read();
  int16_t gy = Wire.read() << 8 | Wire.read();
  int16_t gz = Wire.read() << 8 | Wire.read();
  accelX = (ax / 16384.0) - ACCEL_X_OFFSET;
  accelY = (ay / 16384.0) - ACCEL_Y_OFFSET;
  accelZ =  az / 16384.0;
  gyroX  = (gx / 131.0) - GYRO_X_OFFSET;
  gyroY  = (gy / 131.0) - GYRO_Y_OFFSET;
  gyroZ  = (gz / 131.0) - GYRO_Z_OFFSET;
  if (scale.is_ready()) {
    float grams = scale.get_units(1);
    lastNewtons = (grams / 1000.0 * GRAVITY) + FORCE_OFFSET;
  }
  angle = encoder.readAngle() * 0.0879;
  float rawRPM = encoder.getAngularSpeed();
  rpmSamples[sampleIndex] = rawRPM;
  sampleIndex = (sampleIndex + 1) % NUM_SAMPLES;
  float avgRPM = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) avgRPM += rpmSamples[i];
  avgRPM /= NUM_SAMPLES;
  rpm      = (abs(avgRPM) < RPM_THRESHOLD) ? 0.0 : avgRPM;
  velocity = (rpm / 60.0) * WHEEL_CIRCUMFERENCE;
  seconds  = (millis() - startTime) / 1000.0;
}

void loop() {
  if (!deviceConnected && wasConnected) {
    delay(500); pServer->getAdvertising()->start(); wasConnected = false;
  }
  if (deviceConnected) wasConnected = true;
  unsigned long nowUS = micros(), nowMS = millis();
  if (nowUS - lastSensorUpdate >= SENSOR_INTERVAL_US) {
    lastSensorUpdate = nowUS; readSensors();
  }
  if (deviceConnected && (nowMS - lastBLEUpdate >= BLE_INTERVAL_MS)) {
    lastBLEUpdate = nowMS;
    char json[220];
    snprintf(json, sizeof(json),
      "{\"t\":%.2f,\"ax\":%.3f,\"ay\":%.3f,\"az\":%.3f,\"gx\":%.1f,\"gy\":%.1f,\"gz\":%.1f,\"f\":%.3f,\"a\":%.1f,\"r\":%.1f,\"v\":%.3f}",
      seconds, accelX, accelY, accelZ, gyroX, gyroY, gyroZ,
      lastNewtons, angle, rpm, velocity);
    pCharacteristic->setValue(json);
    pCharacteristic->notify();
  }
}
