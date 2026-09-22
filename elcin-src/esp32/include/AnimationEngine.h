#pragma once

/**
 * Animasyon motoru.
 *
 * Tek kural: hiçbir animasyon beklemez. `delay()` yok, döngü yok, kare
 * sayacı yok — motor yalnızca "şu an kaçıncı milisaniyedeyiz" sorusunu sorar
 * ve o ana ait yüzü döndürür. Bu yüzden animasyon oynarken WebSocket ölmez,
 * dokunma kaçmaz, watchdog aç kalmaz.
 *
 * Göz kırpma ayrı tutuldu: ruh hali ne olursa olsun Elçin ara sıra göz kırpar.
 * Sabit aralıkla kırpmak makine gibi durduğundan aralık her seferinde
 * rastgeleleşir.
 */

#include <cstdint>

#include "FaceEngine.h"

namespace elcin {

enum class Animation : uint8_t {
  Idle,
  Blink,
  Smile,
  Laugh,
  Sad,
  Surprise,
  Think,
  Talk,
  Heart,
  Sleep,
  Wake,
  Loading,
  Count,
};

const char* animationName(Animation animation);
Animation animationFromName(const char* name);
/** Ruh haline yakışan varsayılan animasyon. */
Animation animationForMood(Mood mood);

/**
 * Animasyonun ima ettiği ruh hali.
 *
 * Sunucudan çoğu zaman yalnız bir animasyon komutu gelir
 * ({"command":"animation","animation":"sad"}). Bunu sadece bir bindirme olarak
 * almak, Elçin'in "üzgün" komutunu alıp gülümsemeye devam etmesi demekti.
 * İma edilen ruh hali varsa yüz de ona döner. Nötr animasyonlar
 * (blink, idle, wake, loading) ruh halini değiştirmez.
 */
bool moodForAnimation(Animation animation, Mood& out);

class AnimationEngine {
 public:
  AnimationEngine();

  /** Hedef ruh hali; yüz buraya doğru kayar, sıçramaz. */
  void setMood(Mood mood, uint32_t now);
  Mood mood() const { return target_; }

  /** Tek seferlik animasyon oynat; bitince ruh haline döner. */
  void play(Animation animation, uint32_t now, uint32_t durationMs = 0);
  Animation current() const { return animation_; }
  bool isPlaying(uint32_t now) const;

  /** Bakışı kaydır (web'deki imleç takibinin cihazdaki karşılığı yok; sunucu sürer). */
  void setGaze(int16_t x, int16_t y);

  /** O ana ait yüzü ve etkileri üretir. */
  void render(Canvas& canvas, uint32_t now);

  /** Test ve tekrarlanabilirlik için: göz kırpma zamanlayıcısını sabitler. */
  void seedBlink(uint32_t nextBlinkAt) { nextBlinkAt_ = nextBlinkAt; }

 private:
  uint32_t blinkInterval(uint32_t now) const;

  Mood target_;
  Mood previous_;
  uint32_t moodChangedAt_;

  Animation animation_;
  uint32_t animationStartedAt_;
  uint32_t animationDurationMs_;

  uint32_t nextBlinkAt_;
  uint32_t blinkStartedAt_;
  bool blinking_;

  int16_t gazeX_;
  int16_t gazeY_;
  /** Basit doğrusal rastgelelik: göz kırpma aralığını dağıtmaya yeter. */
  mutable uint32_t random_;
};

}  // namespace elcin
