// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/core/OtaPolicy.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

#include "OtaPolicy.h"

#include <cstring>

namespace elcin {
namespace {

bool isDigit(char c) { return c >= '0' && c <= '9'; }

}  // namespace

Version parseVersion(const char* text) {
  Version version;
  if (text == nullptr || *text == '\0') return version;

  // Başta 'v' olabilir: "v1.2.3" da "1.2.3" da kabul.
  if (*text == 'v' || *text == 'V') ++text;

  uint16_t parts[3] = {0, 0, 0};
  uint8_t index = 0;
  bool sawDigit = false;

  while (*text != '\0' && index < 3) {
    if (isDigit(*text)) {
      sawDigit = true;
      const uint32_t next = static_cast<uint32_t>(parts[index]) * 10 +
                            static_cast<uint32_t>(*text - '0');
      // Taşma: 65535'ten büyük bir bileşen sürüm değil, çöptür.
      if (next > 0xFFFF) return Version{};
      parts[index] = static_cast<uint16_t>(next);
      ++text;
      continue;
    }
    if (*text == '.') {
      if (!sawDigit) return Version{};
      ++index;
      sawDigit = false;
      ++text;
      continue;
    }
    // "1.2.3-beta" gibi son ekler yok sayılır; sürüm sıralaması etkilenmez.
    break;
  }

  if (!sawDigit && index == 0) return Version{};

  version.major = parts[0];
  version.minor = parts[1];
  version.patch = parts[2];
  version.valid = true;
  return version;
}

int compareVersion(const Version& a, const Version& b) {
  if (!a.valid && !b.valid) return 0;
  if (!a.valid) return -1;
  if (!b.valid) return 1;

  if (a.major != b.major) return a.major < b.major ? -1 : 1;
  if (a.minor != b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch != b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

OtaDecision decideOta(const OtaRequest& request) {
  const Version current = parseVersion(request.currentVersion);
  const Version offered = parseVersion(request.offeredVersion);

  if (!offered.valid) return OtaDecision::RejectBadVersion;

  // Sağlama yoksa imaj yazılmaz. Doğrulanamayan bir imajı flash'a yazmak,
  // bozuk indirmede cihazı açılmaz hale getirir.
  if (request.checksum == nullptr || *request.checksum == '\0') {
    return OtaDecision::RejectNoChecksum;
  }

  if (compareVersion(offered, current) <= 0) return OtaDecision::UpToDate;

  // OTA bölümü imajdan küçükse yazmaya hiç başlanmaz: yarıda kalan yazma,
  // hem eski hem yeni imajı kullanılamaz bırakır.
  if (request.imageSize == 0 || request.imageSize > request.partitionSize) {
    return OtaDecision::RejectTooBig;
  }

  return OtaDecision::Update;
}

const char* otaDecisionName(OtaDecision decision) {
  switch (decision) {
    case OtaDecision::UpToDate:         return "guncel";
    case OtaDecision::Update:           return "guncelle";
    case OtaDecision::RejectBadVersion: return "surum_okunamadi";
    case OtaDecision::RejectTooBig:     return "imaj_buyuk";
    case OtaDecision::RejectNoChecksum: return "saglama_yok";
    default:                            return "?";
  }
}

bool shouldRollback(const BootRecord& record, uint8_t maxAttempts) {
  if (record.confirmed) return false;
  return record.bootAttempts >= maxAttempts;
}

}  // namespace elcin
