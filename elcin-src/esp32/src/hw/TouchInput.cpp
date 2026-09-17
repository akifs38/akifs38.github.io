#include "TouchInput.h"

#include "ElcinConfig.h"

namespace elcin {

void TouchInput::begin() {
  // TTP223 gibi modüller kendi sürücüsüne sahip; dahili pull-up sinyali
  // bozabileceği için giriş çıplak bırakılıyor.
  pinMode(ELCIN_TOUCH_PIN, INPUT);
  lastLevel_ = false;
  recognizer_.reset();
}

GestureBatch TouchInput::poll(uint32_t now) {
  const bool raw = digitalRead(ELCIN_TOUCH_PIN) == HIGH;
  const bool level = ELCIN_TOUCH_ACTIVE_HIGH ? raw : !raw;

  if (level != lastLevel_) {
    lastLevel_ = level;
    // Titreşim bastırma tanıyıcının içinde; burada kenarı olduğu gibi veriyoruz.
    return level ? recognizer_.press(now) : recognizer_.release(now);
  }

  return recognizer_.tick(now);
}

}  // namespace elcin
