#include "Ota.h"

#include <HTTPClient.h>
#include <Update.h>
#include <esp_ota_ops.h>
#include <mbedtls/sha256.h>

#include "ElcinConfig.h"

namespace elcin {
namespace {

/** İndirme parçası. Büyütmek RAM'i, küçültmek süreyi artırıyor; 1 kB denge. */
constexpr size_t kChunk = 1024;

void toHex(const uint8_t* digest, size_t length, char* out) {
  static const char* kDigits = "0123456789abcdef";
  for (size_t i = 0; i < length; ++i) {
    out[i * 2] = kDigits[(digest[i] >> 4) & 0x0F];
    out[i * 2 + 1] = kDigits[digest[i] & 0x0F];
  }
  out[length * 2] = '\0';
}

}  // namespace

void Ota::checkRollback(Settings& settings) {
  BootRecord record = settings.bootRecord();

  if (record.confirmed) return;

  ++record.bootAttempts;
  settings.setBootRecord(record);

  if (shouldRollback(record)) {
    // Üç kez açılıp kendini doğrulayamadı: eski imaja dön. Bu çağrı cihazı
    // yeniden başlatır ve geri döner.
    settings.setBootRecord(BootRecord{0, true});
    esp_ota_mark_app_invalid_rollback_and_reboot();
  }
}

void Ota::confirmHealthy(Settings& settings) {
  BootRecord record = settings.bootRecord();
  if (record.confirmed) return;

  settings.setBootRecord(BootRecord{0, true});
  esp_ota_mark_app_valid_cancel_rollback();
}

OtaDecision Ota::apply(Settings& settings, const String& version) {
  const String backend = settings.backendUrl();
  if (backend.isEmpty()) return OtaDecision::RejectBadVersion;

  // Sunucudan imaj bilgisi: boyut ve sağlama. Kararı bunlarla veriyoruz.
  HTTPClient http;
  const String metaUrl = backend + "/api/firmware/" + version;
  http.begin(metaUrl);
  http.addHeader("Authorization", "Bearer " + settings.deviceToken());

  const int status = http.GET();
  if (status != HTTP_CODE_OK) {
    http.end();
    return OtaDecision::RejectBadVersion;
  }

  const String body = http.getString();
  http.end();

  // Küçük bir gövde; tam JSON ayrıştırıcı kurmadan iki alanı okuyoruz.
  auto field = [&body](const char* key) -> String {
    const int at = body.indexOf(String("\"") + key + "\"");
    if (at < 0) return "";
    int start = body.indexOf(':', at);
    if (start < 0) return "";
    ++start;
    while (start < static_cast<int>(body.length()) &&
           (body[start] == ' ' || body[start] == '"')) ++start;
    int end = start;
    while (end < static_cast<int>(body.length()) && body[end] != '"' &&
           body[end] != ',' && body[end] != '}') ++end;
    return body.substring(start, end);
  };

  const String checksum = field("checksum");
  const uint32_t size = static_cast<uint32_t>(field("size").toInt());
  const String imageUrl = field("url");

  OtaRequest request{};
  request.currentVersion = ELCIN_FIRMWARE_VERSION;
  request.offeredVersion = version.c_str();
  request.imageSize = size;
  request.partitionSize = static_cast<uint32_t>(ESP.getFreeSketchSpace());
  request.checksum = checksum.isEmpty() ? nullptr : checksum.c_str();

  const OtaDecision decision = decideOta(request);
  if (decision != OtaDecision::Update) return decision;

  if (!download(imageUrl.isEmpty() ? backend + "/api/firmware/" + version + "/image" : imageUrl,
                checksum)) {
    return OtaDecision::RejectBadVersion;
  }

  // Yeni imaj henüz doğrulanmadı: bir sonraki açılışta kendini kanıtlamalı.
  settings.setBootRecord(BootRecord{0, false});
  ESP.restart();
  return OtaDecision::Update;
}

bool Ota::download(const String& url, const String& expectedChecksum) {
  HTTPClient http;
  http.begin(url);
  if (http.GET() != HTTP_CODE_OK) {
    http.end();
    return false;
  }

  const int total = http.getSize();
  if (total <= 0 || !Update.begin(static_cast<size_t>(total))) {
    http.end();
    return false;
  }

  // Sağlama indirmeyle birlikte hesaplanır: imajı ikinci kez okumak için
  // ne RAM var ne de zaman.
  mbedtls_sha256_context sha;
  mbedtls_sha256_init(&sha);
  mbedtls_sha256_starts(&sha, 0);

  /*
    Stream*, WiFiClient* değil.

    İki sebep: bu dosya WiFi.h içermiyor (Arduino IDE'de derleme burada
    'WiFiClient was not declared' ile duruyordu), ve arduino-esp32 3.x'te
    getStreamPtr() artık NetworkClient* döndürüyor — sınıf yeniden
    adlandırıldı. İkisi de Stream'den türediği ve burada yalnızca available()
    ile readBytes() kullanıldığı için Stream* her iki çekirdekte de derleniyor.
  */
  Stream* stream = http.getStreamPtr();
  uint8_t buffer[kChunk];
  int remaining = total;

  while (remaining > 0 && http.connected()) {
    const size_t available = stream->available();
    if (available == 0) {
      delay(1);
      continue;
    }
    const size_t read = stream->readBytes(
        buffer, available > kChunk ? kChunk : available);
    if (read == 0) continue;

    mbedtls_sha256_update(&sha, buffer, read);
    if (Update.write(buffer, read) != read) {
      Update.abort();
      mbedtls_sha256_free(&sha);
      http.end();
      return false;
    }
    remaining -= static_cast<int>(read);
  }

  uint8_t digest[32];
  mbedtls_sha256_finish(&sha, digest);
  mbedtls_sha256_free(&sha);
  http.end();

  char hex[65];
  toHex(digest, sizeof(digest), hex);

  // Beklenen sağlama "sha256:" önekiyle gelebilir.
  String expected = expectedChecksum;
  const int colon = expected.indexOf(':');
  if (colon >= 0) expected = expected.substring(colon + 1);

  if (!expected.equalsIgnoreCase(hex)) {
    // Bozuk indirme: yazılanı iptal et. Eksik imajla açılmak, cihazı
    // kurtarılamaz hale getirir.
    Update.abort();
    return false;
  }

  return Update.end(true);
}

}  // namespace elcin
