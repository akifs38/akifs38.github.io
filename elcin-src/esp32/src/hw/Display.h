#pragma once

/**
 * SSD1306 sürücüsü.
 *
 * Tek işi var: Canvas tamponunu ekrana basmak. Çizimin tamamı taşınabilir
 * katmanda yapıldığı için burada hiçbir yüz/animasyon bilgisi yok.
 *
 * Not: Canvas'ın bellek düzeni SSD1306'nın beklediğiyle birebir aynı
 * (sayfa başına 8 dikey piksel), bu yüzden gönderim düz bir memcpy.
 */

#include <Adafruit_SSD1306.h>

#include "Canvas.h"
#include "ElcinConfig.h"

namespace elcin {

class Display {
 public:
  bool begin();
  /** Tamponu ekrana gönderir. */
  void push(const Canvas& canvas);
  void setBrightness(uint8_t value);
  bool ready() const { return ready_; }

 private:
  Adafruit_SSD1306 oled_{ELCIN_SCREEN_W, ELCIN_SCREEN_H, &Wire, -1};
  bool ready_ = false;
};

}  // namespace elcin
