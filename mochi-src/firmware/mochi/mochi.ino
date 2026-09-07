/**
 * Mochi reference firmware — ESP32-C3.
 *
 * Speaks the same NDJSON protocol as src/services/protocol in the studio, so
 * the simulator and the real board are interchangeable from the browser's point
 * of view.
 *
 * Libraries: ArduinoJson (v7), ESP32Servo.
 * Board: "ESP32C3 Dev Module", USB CDC On Boot = Enabled.
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

#include "Protocol.h"
#include "RobotConfig.h"

static Protocol protocol;
static Servo servoPan;
static Servo servoTilt;

static int panAngle = 90;
static int tiltAngle = 90;
static char expression[16] = "idle";
static unsigned long lastSensorPush = 0;
static bool sensorsSubscribed = false;
static unsigned long sensorInterval = SENSOR_INTERVAL_MS;

static int clampInt(int value, int lo, int hi) {
  return value < lo ? lo : (value > hi ? hi : value);
}

/** Reads the divider and converts to a rough percentage of a single Li-Po. */
static float batteryPercent() {
  const int raw = analogRead(PIN_BATTERY_ADC);
  const float millivolts = raw * (3300.0f / 4095.0f) * 2.0f;  // 2:1 divider
  const float pct = (millivolts - 3300.0f) / (4200.0f - 3300.0f) * 100.0f;
  return pct < 0 ? 0 : (pct > 100 ? 100 : pct);
}

static void sendStatus(int id) {
  JsonDocument& doc = protocol.statusDoc();
  doc["type"] = "status";
  if (id) doc["id"] = id;
  doc["device"] = DEVICE_NAME;

  JsonObject status = doc["status"].to<JsonObject>();
  status["firmware"] = FIRMWARE_VERSION;
  status["board"] = BOARD_ID;
  status["uptimeS"] = millis() / 1000;
  status["freeHeap"] = ESP.getFreeHeap();
  status["tempC"] = temperatureRead();
  status["batteryPct"] = (int)batteryPercent();

  JsonObject wifi = status["wifi"].to<JsonObject>();
  wifi["connected"] = false;  // Wi-Fi joins in Phase 8 with the OTA work.

  JsonObject peripherals = status["peripherals"].to<JsonObject>();
  peripherals["servo_head_pan"] = servoPan.attached() ? "ok" : "error";
  peripherals["servo_head_tilt"] = servoTilt.attached() ? "ok" : "error";
  peripherals["display"] = "ok";
  peripherals["speaker"] = "ok";
  peripherals["microphone"] = "ok";
  peripherals["battery"] = "ok";

  protocol.sendPrepared();
}

static void applyServo(const char* name, int angle) {
  if (strcmp(name, "head_pan") == 0) {
    panAngle = clampInt(angle, PAN_MIN, PAN_MAX);
    servoPan.write(panAngle);
  } else if (strcmp(name, "head_tilt") == 0) {
    tiltAngle = clampInt(angle, TILT_MIN, TILT_MAX);
    servoTilt.write(tiltAngle);
  } else {
    return;
  }

  JsonDocument event;
  JsonObject data = event.to<JsonObject>();
  data["servo"] = name;
  data["angle"] = strcmp(name, "head_pan") == 0 ? panAngle : tiltAngle;
  protocol.sendEvent("servo.moved", data);
}

static void onFrame(JsonDocument& frame) {
  const char* type = frame["type"] | "";
  const int id = frame["id"] | 0;

  if (strcmp(type, "ping") == 0) {
    protocol.sendPong(id, frame["ts"] | 0UL);

  } else if (strcmp(type, "status.get") == 0 || strcmp(type, "sys.info") == 0) {
    sendStatus(id);

  } else if (strcmp(type, "servo.set") == 0) {
    const char* servo = frame["servo"] | "";
    if (strlen(servo) == 0) {
      protocol.sendError(id, "no_servo", "servo.set needs a servo name.");
      return;
    }
    protocol.sendAck(id, "servo.set");
    applyServo(servo, frame["angle"] | 90);

  } else if (strcmp(type, "led.set") == 0) {
    // Drive the WS2812 here once a strip library is linked in.
    protocol.sendAck(id, "led.set");

  } else if (strcmp(type, "expression.set") == 0) {
    strlcpy(expression, frame["value"] | "idle", sizeof(expression));
    protocol.sendAck(id, "expression.set");
    JsonDocument event;
    JsonObject data = event.to<JsonObject>();
    data["value"] = expression;
    protocol.sendEvent("expression.changed", data);

  } else if (strcmp(type, "sound.play") == 0 || strcmp(type, "sound.stop") == 0) {
    protocol.sendAck(id, type);

  } else if (strcmp(type, "sensor.subscribe") == 0) {
    sensorsSubscribed = true;
    sensorInterval = frame["intervalMs"] | SENSOR_INTERVAL_MS;
    if (sensorInterval < 100) sensorInterval = 100;
    protocol.sendAck(id, "sensor.subscribe");

  } else if (strcmp(type, "sys.reboot") == 0) {
    protocol.sendAck(id, "sys.reboot");
    Serial.flush();
    delay(50);
    ESP.restart();

  } else {
    protocol.sendError(id, "unknown_type", "This firmware does not handle that frame type.");
  }
}

static void pushSensors() {
  JsonDocument& doc = protocol.statusDoc();
  doc["type"] = "sensor";
  doc["t"] = millis();
  JsonObject values = doc["values"].to<JsonObject>();
  values["battery"] = batteryPercent();
  values["tempC"] = temperatureRead();
  values["micLevel"] = analogRead(PIN_MIC_ADC) * (100.0f / 4095.0f);
  values["heapKb"] = ESP.getFreeHeap() / 1024.0f;
  protocol.sendPrepared();
}

void setup() {
  protocol.begin(SERIAL_BAUD, onFrame);

  pinMode(PIN_BUTTON, INPUT_PULLUP);
  analogReadResolution(12);

  servoPan.setPeriodHertz(50);
  servoTilt.setPeriodHertz(50);
  servoPan.attach(PIN_SERVO_PAN, 500, 2400);
  servoTilt.attach(PIN_SERVO_TILT, 500, 2400);
  servoPan.write(panAngle);
  servoTilt.write(tiltAngle);

  // Give the host's serial monitor a moment to attach before the first frame,
  // otherwise the boot log is written into a port nobody is reading yet.
  delay(300);

  Serial.printf("Mochi firmware %s (%s)\n", FIRMWARE_VERSION, BOARD_ID);
  protocol.sendLog("info", "Servos centred");

  JsonDocument ready;
  protocol.sendEvent("ready", ready.to<JsonObject>());
}

void loop() {
  protocol.poll();

  const unsigned long now = millis();
  if (sensorsSubscribed && now - lastSensorPush >= sensorInterval) {
    lastSensorPush = now;
    pushSensors();
  }

  // The host is expected to ping every 2 s. Losing it is not fatal — the robot
  // simply stops taking commands and idles rather than holding a stale pose.
  if (protocol.lastFrameAt() != 0 && now - protocol.lastFrameAt() > HEARTBEAT_TIMEOUT_MS) {
    sensorsSubscribed = false;
  }
}
