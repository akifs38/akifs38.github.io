#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/hw/Settings.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * Kalıcı ayarlar (NVS / Preferences).
 *
 * 36. ve 41. madde: gizli bilgi kaynak koda gömülmez. Wi-Fi parolası, cihaz
 * anahtarı ve sunucu adresi yalnızca burada — flash'ın NVS bölümünde — durur.
 * Depoya hiçbir şekilde girmez; cihaz ilk açılışta eşleşme ekranı gösterip
 * bunları kendisi alır.
 */

#include <Arduino.h>
#include <Preferences.h>

#include "OtaPolicy.h"

namespace elcin {

class Settings {
 public:
  void begin();

  bool hasWifi() const;
  String wifiSsid() const;
  String wifiPassword() const;
  void setWifi(const String& ssid, const String& password);

  String deviceId() const;
  void setDeviceId(const String& id);

  /** Backend kökü, ör. "https://api.elcin.example". Boşsa çevrimdışı çalışır. */
  String backendUrl() const;
  String websocketUrl() const;
  void setUrls(const String& backend, const String& websocket);

  /** Cihaz anahtarı; sunucu bunu doğrular. Günlüğe asla basılmaz. */
  String deviceToken() const;
  void setDeviceToken(const String& token);
  bool isPaired() const;

  /** İlk açılış mı — tanışma sekansı yalnızca bir kez oynar. */
  bool isFirstBoot() const;
  void markBooted();

  String userName() const;
  void setUserName(const String& name);

  /** OTA açılış kaydı: başarısız güncellemeden dönebilmek için. */
  BootRecord bootRecord() const;
  void setBootRecord(const BootRecord& record);

  /** Her şeyi siler — fabrika ayarları. */
  void factoryReset();

 private:
  mutable Preferences prefs_;
};

}  // namespace elcin
