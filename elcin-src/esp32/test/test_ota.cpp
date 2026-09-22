#include "tiny_test.h"
#include "OtaPolicy.h"

using namespace elcin;

void testOta() {
  SUITE("OtaPolicy");

  {  // sürüm okuma
    auto version = parseVersion("1.2.3");
    CHECK(version.valid);
    CHECK_EQ(version.major, 1);
    CHECK_EQ(version.minor, 2);
    CHECK_EQ(version.patch, 3);

    CHECK(parseVersion("v2.0.1").valid);
    CHECK_EQ(parseVersion("v2.0.1").major, 2);
    CHECK(parseVersion("1.2.3-beta").valid);
    CHECK(!parseVersion("").valid);
    CHECK(!parseVersion(nullptr).valid);
    CHECK(!parseVersion("abc").valid);
    CHECK(!parseVersion("999999.0.0").valid);  // taşma
  }

  {  // karşılaştırma
    CHECK_EQ(compareVersion(parseVersion("1.0.0"), parseVersion("1.0.1")), -1);
    CHECK_EQ(compareVersion(parseVersion("1.1.0"), parseVersion("1.0.9")), 1);
    CHECK_EQ(compareVersion(parseVersion("2.0.0"), parseVersion("2.0.0")), 0);
    // Geçersiz sürüm her zaman küçük: bilinmeyen bir sürüme yükseltmeyiz.
    CHECK_EQ(compareVersion(parseVersion("abc"), parseVersion("1.0.0")), -1);
  }

  {  // güncelleme kararları
    OtaRequest request{"1.0.0", "1.1.0", 800000, 1600000, "sha256:abc"};
    CHECK(decideOta(request) == OtaDecision::Update);

    request.offeredVersion = "1.0.0";
    CHECK(decideOta(request) == OtaDecision::UpToDate);

    request.offeredVersion = "0.9.0";
    CHECK(decideOta(request) == OtaDecision::UpToDate);

    request.offeredVersion = "bozuk";
    CHECK(decideOta(request) == OtaDecision::RejectBadVersion);
  }

  {  // sağlama yoksa yazma yok — doğrulanamayan imaj cihazı tuğlalar
    OtaRequest request{"1.0.0", "1.1.0", 800000, 1600000, nullptr};
    CHECK(decideOta(request) == OtaDecision::RejectNoChecksum);
    request.checksum = "";
    CHECK(decideOta(request) == OtaDecision::RejectNoChecksum);
  }

  {  // bölüme sığmayan imaja hiç başlanmaz
    OtaRequest request{"1.0.0", "1.1.0", 2000000, 1600000, "sha256:abc"};
    CHECK(decideOta(request) == OtaDecision::RejectTooBig);
    request.imageSize = 0;
    CHECK(decideOta(request) == OtaDecision::RejectTooBig);
  }

  {  // geri dönüş
    CHECK(!shouldRollback(BootRecord{1, false}));
    CHECK(!shouldRollback(BootRecord{9, true}));   // doğrulandıysa dönülmez
    CHECK(shouldRollback(BootRecord{3, false}));   // üç denemede açılamadı
    CHECK(shouldRollback(BootRecord{4, false}));
  }
}
