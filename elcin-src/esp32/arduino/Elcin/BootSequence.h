#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/include/BootSequence.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * Açılış sekansı (20. ve 50. madde).
 *
 * Siyah ekran → küçük bir ışık → gözler → Elçin'in yüzü → gülümseme, ardından
 * Gülçin'e tanışma sözleri. Sonra IDLE.
 *
 * Zaman tabanlı, kare tabanlı değil: motor "şu an kaçıncı milisaniyedeyiz"
 * sorusuna bakar. Bir kare gecikirse sekans yavaşlamaz, sadece o kareyi
 * atlar — ve hiçbir yerde beklemediği için WebSocket ile Wi-Fi bu sırada
 * arka planda bağlanmaya devam eder.
 */

#include <cstdint>

#include "Canvas.h"

namespace elcin {

class BootSequence {
 public:
  /** Sekansın toplam süresi. */
  static uint32_t totalMs(bool firstBoot);

  /** `elapsed` sekans başından beri geçen süre. Bittiyse false döner. */
  static bool render(Canvas& canvas, uint32_t elapsed, bool firstBoot,
                     const char* userName);
};

}  // namespace elcin
