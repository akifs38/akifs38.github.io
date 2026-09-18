#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/app/ElcinApp.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * Firmware'in giriş noktaları.
 *
 * Arduino'nun setup/loop'u ile uygulama mantığı bilerek ayrı: aynı kod hem
 * PlatformIO'da (src/main.cpp) hem Arduino IDE'de (Elcin.ino) derleniyor ve
 * iki kabuk da yalnızca buradaki iki fonksiyonu çağırıyor.
 */

namespace elcin {

/** Bir kez: ayarlar, ekran, sensör, ağ, watchdog. */
void appSetup();

/** Her turda: ağ, dokunma, durum, animasyon, ekran. Hiçbir yerde beklemez. */
void appLoop();

}  // namespace elcin
