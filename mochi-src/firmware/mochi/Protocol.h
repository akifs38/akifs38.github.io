#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>

/**
 * Newline-delimited JSON, one object per line, in both directions.
 *
 * Reading is done a byte at a time into a fixed buffer rather than with
 * Serial.readStringUntil(), because a String per frame fragments the heap and
 * this loop runs for days.
 */
class Protocol {
 public:
  static constexpr size_t kMaxLine = 512;

  using FrameHandler = void (*)(JsonDocument& frame);

  void begin(unsigned long baud, FrameHandler handler);
  void poll();

  // Frame builders. Each writes one line and returns immediately.
  void sendPong(int id, unsigned long ts);
  void sendAck(int id, const char* of);
  void sendError(int id, const char* code, const char* msg);
  void sendLog(const char* level, const char* msg);
  void sendEvent(const char* event, JsonObject data);
  JsonDocument& statusDoc();  // fill, then call sendPrepared()
  void sendPrepared();

  unsigned long lastFrameAt() const { return last_frame_at_; }

 private:
  void dispatch();

  char buffer_[kMaxLine];
  size_t length_ = 0;
  bool overflowed_ = false;
  FrameHandler handler_ = nullptr;
  unsigned long last_frame_at_ = 0;
  JsonDocument out_;
};
