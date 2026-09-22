#pragma once
#include "Arduino.h"
class UpdateClass {
 public:
  bool begin(size_t size);
  size_t write(uint8_t* data, size_t len);
  bool end(bool evenIfRemaining);
  void abort();
};
extern UpdateClass Update;
