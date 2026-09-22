#pragma once
#include "Arduino.h"
typedef enum {
  WStype_ERROR, WStype_DISCONNECTED, WStype_CONNECTED, WStype_TEXT, WStype_BIN,
} WStype_t;
class WebSocketsClient {
 public:
  void begin(const char* host, uint16_t port, const char* url);
  void beginSSL(const char* host, uint16_t port, const char* url);
  void onEvent(void (*cb)(WStype_t, uint8_t*, size_t));
  void loop();
  bool sendTXT(const char* payload, size_t length);
  void setReconnectInterval(unsigned long ms);
  void enableHeartbeat(uint32_t pingInterval, uint32_t pongTimeout, uint8_t retries);
};
