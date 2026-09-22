// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/core/BootSequence.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

#include "BootSequence.h"

#include "FaceEngine.h"
#include "Text.h"

namespace elcin {
namespace {

// Sekans aşamaları (birikimli, ms).
constexpr uint32_t kSpark      = 700;    // karanlıkta beliren nokta
constexpr uint32_t kEyesOpen   = 1500;   // gözler açılır
constexpr uint32_t kSmile      = 2600;   // gülümser
constexpr uint32_t kGreeting   = 4400;   // "Merhaba Gülçin"

// Yalnızca ilk açılışta gösterilen tanışma sözleri.
constexpr uint32_t kIntro1 = 6600;   // "Ben Elçin."
constexpr uint32_t kIntro2 = 9400;   // "Mehmet Akif beni senin için geliştirdi."
constexpr uint32_t kIntro3 = 12600;  // "Zor zamanlarında yanında olmak için buradayım."

/** Metni ekranın dikey ortasına sarmalayarak basar. */
void centeredBlock(Canvas& canvas, const char* text, int16_t scale = 1) {
  // Önce kaç satır tutacağını ölç, sonra dikeyde ortala: tek satırlık bir
  // mesajla üç satırlık mesaj aynı hizada başlarsa sekans zıplıyor.
  const int16_t margin = 8;
  const int16_t width = static_cast<int16_t>(Canvas::kWidth - 2 * margin);

  Canvas probe;
  const int16_t lines = drawWrapped(probe, margin, 0, width, text, Ink::White, scale);
  const int16_t height = static_cast<int16_t>(lines * lineHeight(scale));
  int16_t y = static_cast<int16_t>((Canvas::kHeight - height) / 2);
  if (y < 0) y = 0;

  drawWrapped(canvas, margin, y, width, text, Ink::White, scale);
}

}  // namespace

uint32_t BootSequence::totalMs(bool firstBoot) {
  return firstBoot ? kIntro3 : kGreeting;
}

bool BootSequence::render(Canvas& canvas, uint32_t elapsed, bool firstBoot,
                          const char* userName) {
  if (elapsed >= totalMs(firstBoot)) return false;

  canvas.clear();

  // 1. Karanlık ve küçük bir ışık: nokta büyüyerek yüze dönüşür.
  if (elapsed < kSpark) {
    const int16_t radius = static_cast<int16_t>(1 + (elapsed * 6) / kSpark);
    canvas.fillCircle(64, 32, radius, Ink::White);
    return true;
  }

  // 2. Gözler açılır.
  if (elapsed < kEyesOpen) {
    const uint32_t since = elapsed - kSpark;
    const uint32_t span = kEyesOpen - kSpark;
    FaceShape face = faceFor(Mood::Normal);
    // Göz yüksekliği 2'den tam boya çıkar: uyanan bir bakış.
    face.eye.height = static_cast<int16_t>(2 + (since * (24 - 2)) / span);
    FaceOverlay overlay;
    drawFace(canvas, face, overlay);
    return true;
  }

  // 3. Gülümser.
  if (elapsed < kSmile) {
    drawMood(canvas, Mood::Happy, FaceOverlay{});
    return true;
  }

  // 4. Selam. Yüz küçülüp yukarı çekilmez; yerine mesaj ekranı gelir —
  //    128×64'te ikisini yan yana sığdırmaya çalışmak ikisini de bozuyordu.
  if (elapsed < kGreeting) {
    char line[48];
    // snprintf yerine elle birleştirme: firmware'de printf ailesi ~10 kB
    // flash ve beklenmedik yığın kullanımı demek.
    const char* prefix = "Merhaba ";
    uint16_t at = 0;
    for (const char* p = prefix; *p && at < sizeof(line) - 1; ++p) line[at++] = *p;
    for (const char* p = userName; *p && at < sizeof(line) - 1; ++p) line[at++] = *p;
    line[at] = '\0';

    centeredBlock(canvas, line);
    return true;
  }

  if (!firstBoot) return false;

  // 5. Yalnızca ilk açılış: tanışma.
  if (elapsed < kIntro1) {
    centeredBlock(canvas, "Ben Elçin.");
    return true;
  }
  if (elapsed < kIntro2) {
    centeredBlock(canvas, "Mehmet Akif beni senin için geliştirdi.");
    return true;
  }
  centeredBlock(canvas, "Zor zamanlarında yanında olmak için buradayım.");
  return true;
}

}  // namespace elcin
