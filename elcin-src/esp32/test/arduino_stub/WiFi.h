#pragma once
#include "Arduino.h"
#define WIFI_STA 1
#define WL_CONNECTED 3
class WiFiClass {
 public:
  void mode(int m);
  void setSleep(bool enable);
  void begin(const char* ssid, const char* pass);
  int status();
  int32_t RSSI();
};
extern WiFiClass WiFi;
