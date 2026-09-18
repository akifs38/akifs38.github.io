#pragma once
#include "Arduino.h"
class Preferences {
 public:
  bool begin(const char* name, bool readOnly);
  void end();
  String getString(const char* key, const char* fallback);
  void putString(const char* key, const String& value);
  bool getBool(const char* key, bool fallback);
  void putBool(const char* key, bool value);
  uint8_t getUChar(const char* key, uint8_t fallback);
  void putUChar(const char* key, uint8_t value);
  void clear();
};
