/*
  Elçin — ESP32-C3 firmware (Arduino IDE sketch'i)

  Bu klasör esp32/tools/make_ino.py tarafından üretildi. Elçin'in kaynağı
  PlatformIO düzeninde duruyor; buradaki dosyalar onun düzleştirilmiş kopyası.

  ── Kurulum ───────────────────────────────────────────────────────────────
  1. Arduino IDE 2.x, Kart Yöneticisi'nden "esp32 by Espressif" (3.x)
  2. Kütüphane Yöneticisi'nden yalnızca iki kütüphane:
       Adafruit SSD1306       (Adafruit GFX'i bağımlılık olarak çeker)
       WebSockets             (Markus Sattler)
     ArduinoJson GEREKMİYOR: protokol ayrıştırması Protocol.cpp içinde,
     birkaç sabit alan için JSON ağacı kurmaya değmezdi.
  3. Kart: "ESP32C3 Dev Module"
       USB CDC On Boot : Enabled     ← bu olmadan seri port sessiz kalır
       Flash Size      : 4MB
       Partition Scheme: Default 4MB with spiffs (OTA için iki app bölümü)
       Upload Speed    : 921600

  ── Bağlantı ──────────────────────────────────────────────────────────────
       OLED VCC → 3.3V     OLED SDA → GPIO 20
       OLED GND → GND      OLED SCL → GPIO 21
       Dokunma  SIG → GPIO 3

  Pinler ve zaman aşımları ElcinConfig.h içinde; başka bir pin kullanacaksan
  yalnızca orayı değiştir.

  Ayrıntı: elcin-src/docs/ESP32_SETUP.md
*/

#include "ElcinApp.h"

void setup() { elcin::appSetup(); }

void loop() { elcin::appLoop(); }
