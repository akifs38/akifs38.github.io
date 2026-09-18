#pragma once
#include "Arduino.h"
#define HTTP_CODE_OK 200
class HTTPClient {
 public:
  bool begin(const String& url);
  void addHeader(const String& name, const String& value);
  int GET();
  String getString();
  int getSize();
  Stream* getStreamPtr();
  bool connected();
  void end();
};
