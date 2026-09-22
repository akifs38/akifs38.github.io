#pragma once

/**
 * Dokunma sensörü girişi.
 *
 * Sensörü okur, kenarları taşınabilir TouchRecognizer'a verir. Tanıma mantığı
 * burada değil: o kısım masaüstünde test ediliyor, burada yalnızca pin okuma
 * var.
 */

#include <Arduino.h>

#include "TouchRecognizer.h"

namespace elcin {

class TouchInput {
 public:
  void begin();
  /** Ana döngüden çağrılır; bu turda oluşan hareketleri döndürür. */
  GestureBatch poll(uint32_t now);
  bool isPressed() const { return recognizer_.isPressed(); }

 private:
  TouchRecognizer recognizer_;
  bool lastLevel_ = false;
};

}  // namespace elcin
