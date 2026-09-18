#pragma once

/**
 * Elçin firmware — merkezî yapılandırma.
 *
 * Hiçbir modül kendi içinde pin, zaman aşımı ya da eşik tutmaz; hepsi burada.
 * Bu dosyadaki zamanlamalar web tarafındaki src/config/index.ts ile aynı
 * değerleri taşır — birini değiştirirsen diğerini de değiştir, yoksa iki Elçin
 * farklı hızlarda yaşamaya başlar.
 *
 * Gizli bilgi burada YOKTUR. Wi-Fi parolası, cihaz anahtarı ve sunucu adresi
 * NVS'ten (Preferences) okunur; kaynak koda gömülmez, depoya girmez.
 */

#include <cstdint>

// ----------------------------------------------------------------- donanım

// 1.23" SSD1306 OLED, I2C.
// Not: piyasadaki 1.3" modüllerin bir kısmı SH1106 sürücüsüdür ve aynı
// adresten cevap verir ama ekranı 2 piksel kaydırır. README'de tek satırlık
// değişiklik anlatılıyor.
static constexpr uint8_t  ELCIN_I2C_SDA      = 20;
static constexpr uint8_t  ELCIN_I2C_SCL      = 21;
static constexpr uint8_t  ELCIN_OLED_ADDRESS = 0x3C;
static constexpr int16_t  ELCIN_SCREEN_W     = 128;
static constexpr int16_t  ELCIN_SCREEN_H     = 64;

/**
 * Harici dokunma sensörünün sinyal ucu.
 *
 * ESP32-C3'te GPIO2, GPIO8 ve GPIO9 strapping pinidir; açılışta seviyeleri
 * okunduğu için dokunma sensörü bağlamak açılışı bozabilir. GPIO1 serbest.
 */
static constexpr uint8_t  ELCIN_TOUCH_PIN    = 1;
/** Sensör aktifken HIGH mı veriyor (TTP223 varsayılanı) — modüle göre değişir. */
static constexpr bool     ELCIN_TOUCH_ACTIVE_HIGH = true;

static constexpr uint32_t ELCIN_SERIAL_BAUD  = 115200;

// ------------------------------------------------------------------ zaman

/** Dokunma tanıma eşikleri (ms). Web'deki DEFAULT_TOUCH_CONFIG ile aynı. */
static constexpr uint32_t ELCIN_TOUCH_DEBOUNCE_MS     = 35;
static constexpr uint32_t ELCIN_TOUCH_DOUBLE_TAP_MS   = 320;
static constexpr uint32_t ELCIN_TOUCH_LONG_PRESS_MS   = 700;
static constexpr uint32_t ELCIN_TOUCH_VERY_LONG_MS    = 2200;

/** Cihaz durumları için zaman aşımları (ms). */
static constexpr uint32_t ELCIN_HEARTBEAT_MS          = 5000;
static constexpr uint32_t ELCIN_TOUCH_REACTION_MS     = 3500;
static constexpr uint32_t ELCIN_SLEEP_TIMEOUT_MS      = 120000;
/** Cevap gelmezse "düşünüyor" ekranında asılı kalmamak için. */
static constexpr uint32_t ELCIN_THINKING_TIMEOUT_MS   = 12000;

/** Ekran tazeleme aralığı (ms). ~33 fps; I2C'yi doyurmadan akıcı. */
static constexpr uint32_t ELCIN_FRAME_INTERVAL_MS     = 30;

/** Yeniden bağlanma üstel geri çekilmesi (ms). */
static constexpr uint32_t ELCIN_RECONNECT_BACKOFF_MS[] = {1000, 2000, 4000, 8000, 16000};
static constexpr uint8_t  ELCIN_RECONNECT_STEPS = 5;

/** Watchdog süresi (sn). Ana döngü bunu düzenli besler. */
static constexpr uint32_t ELCIN_WATCHDOG_S            = 8;

// ----------------------------------------------------------------- kimlik

#ifndef ELCIN_FIRMWARE_VERSION
#define ELCIN_FIRMWARE_VERSION "1.0.0"
#endif

static constexpr const char* ELCIN_DEFAULT_DEVICE_ID = "elcin-001";
static constexpr const char* ELCIN_DEVICE_NAME       = "Elcin";
/** Protokol sürümü: sunucu uyumsuz sürümü reddedebilsin diye. */
static constexpr uint8_t     ELCIN_PROTOCOL_VERSION  = 1;

/** Eşleşme kodu kaç haneli ve ne kadar geçerli. */
static constexpr uint8_t  ELCIN_PAIRING_DIGITS       = 6;
static constexpr uint32_t ELCIN_PAIRING_TTL_MS       = 300000;
