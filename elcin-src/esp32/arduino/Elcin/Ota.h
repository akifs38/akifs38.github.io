#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/hw/Ota.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * OTA güncellemesi.
 *
 * Karar mantığı burada değil — OtaPolicy'de, çünkü orası test edilebiliyor.
 * Bu dosya yalnızca indirme, yazma ve doğrulamayı yapar.
 *
 * Güvenlik katmanları:
 *   1. Sürüm karşılaştırması — geriye ya da aynı sürüme güncelleme yok.
 *   2. Sağlama zorunlu — doğrulanamayan imaj flash'a yazılmaz.
 *   3. Boyut kontrolü — bölüme sığmayan imaja hiç başlanmaz.
 *   4. Geri alma — yeni imaj kendini doğrulayamazsa eski bölüme dönülür.
 */

#include <Arduino.h>

#include "OtaPolicy.h"
#include "Settings.h"

namespace elcin {

class Ota {
 public:
  /**
   * Açılışta çağrılır.
   *
   * Yeni imajla açıldıysak deneme sayacını artırır; sayaç dolmuşsa ve uygulama
   * hâlâ kendini doğrulamadıysa eski bölüme döner. Bu çağrı olmadan bozuk bir
   * güncelleme cihazı kalıcı olarak açılmaz hale getirebilir.
   */
  static void checkRollback(Settings& settings);

  /**
   * Uygulama sağlıklı: Wi-Fi bağlandı, ekran çalışıyor, WebSocket açıldı.
   * Bu çağrıdan sonra geri dönüş iptal edilir ve imaj kalıcı kabul edilir.
   */
  static void confirmHealthy(Settings& settings);

  /** Sunucudan gelen teklifi değerlendirir ve gerekiyorsa indirir. */
  static OtaDecision apply(Settings& settings, const String& version);

 private:
  static bool download(const String& url, const String& expectedChecksum);
};

}  // namespace elcin
