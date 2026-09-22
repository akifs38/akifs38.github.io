#pragma once
#include "Arduino.h"
#define SSD1306_SWITCHCAPVCC 2
#define SSD1306_SETCONTRAST 0x81
class Adafruit_SSD1306 {
 public:
  Adafruit_SSD1306(uint8_t w, uint8_t h, TwoWire* twi, int8_t rst);
  bool begin(uint8_t vcs, uint8_t addr);
  void clearDisplay();
  void display();
  uint8_t* getBuffer();
  void ssd1306_command(uint8_t c);
};
