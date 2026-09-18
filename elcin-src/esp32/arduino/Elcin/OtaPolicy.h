#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/include/OtaPolicy.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * OTA kararları (35. madde).
 *
 * Buradaki kod indirme yapmaz — yalnızca "bu güncelleme yapılmalı mı,
 * yapıldıysa sağlam mı, değilse ne yapmalı" sorularına cevap verir. Ağdan
 * ayrı tutulmasının sebebi: bir güncelleme kararını test etmek için sunucu
 * kurmak gerekmesin. Yanlış bir karar cihazı tuğlaya çevirebilir; bu yüzden
 * tam da bu kısım test edilebilir olmalı.
 */

#include <cstdint>

namespace elcin {

struct Version {
  uint16_t major = 0;
  uint16_t minor = 0;
  uint16_t patch = 0;
  bool valid = false;
};

/** "1.2.3" → Version. Bozuk metin valid=false döndürür. */
Version parseVersion(const char* text);

/** -1: a<b, 0: eşit, 1: a>b. Geçersiz sürüm her zaman küçüktür. */
int compareVersion(const Version& a, const Version& b);

enum class OtaDecision : uint8_t {
  UpToDate,        // zaten güncel ya da daha yeni
  Update,          // güncelle
  RejectBadVersion,// sürüm okunamadı
  RejectTooBig,    // bölüme sığmıyor
  RejectNoChecksum // sağlama yok: doğrulanamayan imaj yazılmaz
};

struct OtaRequest {
  const char* currentVersion;
  const char* offeredVersion;
  uint32_t imageSize;
  uint32_t partitionSize;
  const char* checksum;  // "sha256:..." ya da nullptr
};

OtaDecision decideOta(const OtaRequest& request);
const char* otaDecisionName(OtaDecision decision);

/**
 * Başarısız güncelleme koruması.
 *
 * Yeni imaj açıldıktan sonra kendini "sağlam" diye işaretlemezse, bir sonraki
 * açılışta eski bölüme dönülür. Sayaç NVS'te durur; burada yalnızca karar
 * mantığı var.
 */
struct BootRecord {
  /** Yeni imajla kaç kez açıldı. */
  uint8_t bootAttempts;
  /** Uygulama kendini doğruladı mı (Wi-Fi + ekran + WebSocket). */
  bool confirmed;
};

/** Bu açılışta eski sürüme dönülmeli mi. */
bool shouldRollback(const BootRecord& record, uint8_t maxAttempts = 3);

}  // namespace elcin
