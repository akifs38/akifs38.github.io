#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/hw/TouchInput.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

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
