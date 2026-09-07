#include "Protocol.h"

void Protocol::begin(unsigned long baud, FrameHandler handler) {
  Serial.begin(baud);
  handler_ = handler;
  length_ = 0;
  overflowed_ = false;
}

void Protocol::poll() {
  while (Serial.available() > 0) {
    const int c = Serial.read();
    if (c < 0) return;

    if (c == '\n' || c == '\r') {
      if (length_ > 0) {
        buffer_[length_] = '\0';
        if (overflowed_) {
          sendError(0, "line_too_long", "Frame exceeded 512 bytes and was discarded.");
        } else {
          dispatch();
        }
      }
      length_ = 0;
      overflowed_ = false;
      continue;
    }

    if (length_ + 1 >= kMaxLine) {
      overflowed_ = true;  // keep draining until the newline
      continue;
    }
    buffer_[length_++] = static_cast<char>(c);
  }
}

void Protocol::dispatch() {
  JsonDocument doc;
  const DeserializationError error = deserializeJson(doc, buffer_, length_);
  if (error) {
    sendError(0, "parse", error.c_str());
    return;
  }
  last_frame_at_ = millis();
  if (handler_) handler_(doc);
}

void Protocol::sendPong(int id, unsigned long ts) {
  out_.clear();
  out_["type"] = "pong";
  if (id) out_["id"] = id;
  out_["ts"] = ts;
  sendPrepared();
}

void Protocol::sendAck(int id, const char* of) {
  out_.clear();
  out_["type"] = "ack";
  if (id) out_["id"] = id;
  out_["of"] = of;
  sendPrepared();
}

void Protocol::sendError(int id, const char* code, const char* msg) {
  out_.clear();
  out_["type"] = "error";
  if (id) out_["id"] = id;
  out_["code"] = code;
  out_["msg"] = msg;
  sendPrepared();
}

void Protocol::sendLog(const char* level, const char* msg) {
  out_.clear();
  out_["type"] = "log";
  out_["level"] = level;
  out_["msg"] = msg;
  out_["t"] = millis();
  sendPrepared();
}

void Protocol::sendEvent(const char* event, JsonObject data) {
  out_.clear();
  out_["type"] = "event";
  out_["event"] = event;
  if (!data.isNull()) out_["data"] = data;
  sendPrepared();
}

JsonDocument& Protocol::statusDoc() {
  out_.clear();
  return out_;
}

void Protocol::sendPrepared() {
  serializeJson(out_, Serial);
  Serial.write('\n');
}
