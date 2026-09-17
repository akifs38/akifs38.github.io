#include "tiny_test.h"
#include "AnimationEngine.h"
#include "BootSequence.h"
#include "Canvas.h"
#include "FaceEngine.h"
#include "Text.h"

using namespace elcin;

namespace {

/** Tamponda yanan piksel sayısı — "ekranda bir şey var mı" ölçüsü. */
int litPixels(const Canvas& canvas) {
  int count = 0;
  for (int16_t y = 0; y < Canvas::kHeight; ++y)
    for (int16_t x = 0; x < Canvas::kWidth; ++x)
      if (canvas.pixel(x, y)) ++count;
  return count;
}

/** Belirli bir satır aralığında yanan piksel — ağız/göz ayrımı için. */
int litRows(const Canvas& canvas, int16_t from, int16_t to) {
  int count = 0;
  for (int16_t y = from; y <= to && y < Canvas::kHeight; ++y)
    for (int16_t x = 0; x < Canvas::kWidth; ++x)
      if (canvas.pixel(x, y)) ++count;
  return count;
}

}  // namespace

void testCanvas() {
  SUITE("Canvas");

  Canvas canvas;
  CHECK_EQ(litPixels(canvas), 0);

  canvas.setPixel(10, 10, Ink::White);
  CHECK(canvas.pixel(10, 10));
  CHECK_EQ(litPixels(canvas), 1);

  canvas.setPixel(10, 10, Ink::Black);
  CHECK(!canvas.pixel(10, 10));

  // Sınır dışı yazma çökmemeli ve tampona sızmamalı.
  canvas.setPixel(-5, 10, Ink::White);
  canvas.setPixel(200, 10, Ink::White);
  canvas.setPixel(10, -1, Ink::White);
  canvas.setPixel(10, 99, Ink::White);
  CHECK_EQ(litPixels(canvas), 0);
  CHECK(!canvas.pixel(-5, 10));

  canvas.fillRect(0, 0, 8, 8, Ink::White);
  CHECK_EQ(litPixels(canvas), 64);

  canvas.clear();
  canvas.hLine(0, 0, 128, Ink::White);
  CHECK_EQ(litPixels(canvas), 128);

  canvas.clear();
  canvas.fillCircle(64, 32, 5, Ink::White);
  CHECK(litPixels(canvas) > 60);
  CHECK(canvas.pixel(64, 32));

  // Yuvarlatılmış dikdörtgen köşeleri kesmeli: köşe pikseli boş kalmalı.
  canvas.clear();
  canvas.fillRoundRect(10, 10, 20, 20, 6, Ink::White);
  CHECK(!canvas.pixel(10, 10));
  CHECK(canvas.pixel(20, 20));

  // Ters çevirme
  canvas.clear();
  canvas.setPixel(3, 3, Ink::Invert);
  CHECK(canvas.pixel(3, 3));
  canvas.setPixel(3, 3, Ink::Invert);
  CHECK(!canvas.pixel(3, 3));
}

void testFace() {
  SUITE("FaceEngine");

  // Her ruh hali ekranda görünür bir yüz üretmeli.
  for (uint8_t i = 0; i < static_cast<uint8_t>(Mood::Count); ++i) {
    Canvas canvas;
    drawMood(canvas, static_cast<Mood>(i));
    CHECK(litPixels(canvas) > 80);
    // Gözler üst yarıda, ağız alt yarıda olmalı.
    CHECK(litRows(canvas, 10, 40) > 30);
    CHECK(litRows(canvas, 41, 63) > 5);
  }

  // Üzgün yüzün ağzı aşağı, mutlunun yukarı kıvrılır.
  CHECK(faceFor(Mood::Sad).mouth.curve < 0);
  CHECK(faceFor(Mood::Happy).mouth.curve > 0);

  // Uykulu gözler neredeyse kapalı.
  CHECK(faceFor(Mood::Sleepy).eye.height < faceFor(Mood::Normal).eye.height / 2);

  // Şaşkın gözler en büyük.
  CHECK(faceFor(Mood::Surprised).eye.height > faceFor(Mood::Normal).eye.height);

  // Kapalı göz, açık gözden az piksel yakar.
  Canvas open, closed;
  FaceOverlay shut;
  shut.eyesClosed = true;
  drawMood(open, Mood::Normal);
  drawMood(closed, Mood::Normal, shut);
  CHECK(litPixels(closed) < litPixels(open));

  // Ara değer: yarı yolda iki uçtan da farklı bir yüz çıkar.
  const auto mid = blendFace(faceFor(Mood::Sad), faceFor(Mood::Happy), 128);
  CHECK(mid.mouth.curve > faceFor(Mood::Sad).mouth.curve);
  CHECK(mid.mouth.curve < faceFor(Mood::Happy).mouth.curve);
  CHECK(blendFace(faceFor(Mood::Sad), faceFor(Mood::Happy), 0).mouth.curve ==
        faceFor(Mood::Sad).mouth.curve);
  CHECK(blendFace(faceFor(Mood::Sad), faceFor(Mood::Happy), 256).mouth.curve ==
        faceFor(Mood::Happy).mouth.curve);

  // Ad dönüşümleri
  CHECK(moodFromName("love") == Mood::Love);
  CHECK(moodFromName("kahve") == Mood::Normal);
  CHECK(moodFromName(nullptr) == Mood::Normal);
  CHECK_STR(moodName(Mood::Sleepy), "sleepy");
}

void testAnimation() {
  SUITE("AnimationEngine");

  CHECK(animationForMood(Mood::Love) == Animation::Heart);
  CHECK(animationForMood(Mood::Sleepy) == Animation::Sleep);
  CHECK(animationFromName("laugh") == Animation::Laugh);
  CHECK(animationFromName("dans") == Animation::Idle);

  {  // Animasyon süresi dolunca kendiliğinden biter
    AnimationEngine engine;
    engine.play(Animation::Smile, 1000, 500);
    CHECK(engine.isPlaying(1200));
    CHECK(!engine.isPlaying(1600));
  }

  {  // Uyku kendiliğinden bitmez: durum değişene kadar sürer
    AnimationEngine engine;
    engine.play(Animation::Sleep, 0);
    CHECK(engine.isPlaying(600000));
  }

  {  // Ruh hali geçişi kayarak olur, sıçramayla değil
    AnimationEngine engine;
    engine.seedBlink(0xFFFFFFFF);  // testte göz kırpma araya girmesin
    engine.setMood(Mood::Sad, 0);

    Canvas early, late;
    engine.render(early, 10);    // geçişin başı
    engine.render(late, 1000);   // geçiş bitmiş
    int diff = 0;
    for (int16_t y = 0; y < Canvas::kHeight; ++y)
      for (int16_t x = 0; x < Canvas::kWidth; ++x)
        if (early.pixel(x, y) != late.pixel(x, y)) ++diff;
    CHECK(diff > 0);
  }

  {  // Konuşma animasyonu ağzı gerçekten oynatır
    AnimationEngine engine;
    engine.seedBlink(0xFFFFFFFF);
    engine.play(Animation::Talk, 0, 5000);

    Canvas a, b;
    engine.render(a, 10);
    engine.render(b, 200);
    int diff = 0;
    for (int16_t y = 41; y < Canvas::kHeight; ++y)
      for (int16_t x = 0; x < Canvas::kWidth; ++x)
        if (a.pixel(x, y) != b.pixel(x, y)) ++diff;
    CHECK(diff > 0);
  }

  {  // Render hiçbir zaman boş ekran bırakmaz
    AnimationEngine engine;
    for (uint8_t i = 0; i < static_cast<uint8_t>(Animation::Count); ++i) {
      Canvas canvas;
      engine.play(static_cast<Animation>(i), 0, 3000);
      engine.render(canvas, 100);
      CHECK(litPixels(canvas) > 50);
    }
  }
}

void testText() {
  SUITE("Text");

  {  // UTF-8 çözme
    uint16_t index = 0;
    CHECK_EQ(decodeUtf8("A", index), 'A');
    CHECK_EQ(index, 1);

    index = 0;
    CHECK_EQ(decodeUtf8("ü", index), 0x00FCu);
    CHECK_EQ(index, 2);

    index = 0;
    CHECK_EQ(decodeUtf8("ğ", index), 0x011Fu);
    CHECK_EQ(index, 2);

    // Bozuk dizi takılıp kalmamalı: index mutlaka ilerler.
    index = 0;
    decodeUtf8("\xFF", index);
    CHECK_EQ(index, 1);
  }

  {  // Türkçe metin ASCII karşılığından daha çok piksel yakar (aksanlar var)
    Canvas plain, turkish;
    drawText(plain, 0, 0, "gulcin");
    drawText(turkish, 0, 0, "gülçin");
    CHECK(litPixels(turkish) > litPixels(plain));
  }

  {  // 'ı' noktasız, 'i' noktalı
    Canvas dotted, dotless;
    drawText(dotted, 0, 0, "i");
    drawText(dotless, 0, 0, "ı");
    CHECK(litPixels(dotted) > litPixels(dotless));
  }

  {  // 'İ' noktalı, 'I' noktasız
    Canvas withDot, without;
    drawText(withDot, 0, 0, "İ");
    drawText(without, 0, 0, "I");
    CHECK(litPixels(withDot) > litPixels(without));
  }

  {  // Genişlik karakter sayısıyla orantılı
    CHECK(textWidth("abc") > textWidth("ab"));
    CHECK_EQ(textWidth(""), 0);
    // Türkçe harf de tek karakter genişliğinde: aksan yana taşmaz.
    CHECK_EQ(textWidth("ö"), textWidth("o"));
  }

  {  // Sarmalama satır üretir ve sözcüğü ortadan bölmez
    Canvas canvas;
    const int16_t lines = drawWrapped(canvas, 0, 0, 120,
                                      "Zor zamanlarında yanında olmak için buradayım.");
    CHECK(lines >= 2);
    CHECK(litPixels(canvas) > 100);
  }

  {  // maxLines sınırına uyar
    Canvas canvas;
    const int16_t lines = drawWrapped(canvas, 0, 0, 60,
                                      "bir iki uc dort bes alti yedi sekiz dokuz on",
                                      Ink::White, 1, 2);
    CHECK_EQ(lines, 2);
  }

  {  // Tanınmayan karakter çizimi bozmaz
    Canvas canvas;
    drawText(canvas, 0, 0, "a\xFF\xFE b");
    CHECK(litPixels(canvas) > 0);
  }

  {  // Ölçek büyütür
    Canvas small, big;
    drawText(small, 0, 0, "A", Ink::White, 1);
    drawText(big, 0, 0, "A", Ink::White, 2);
    CHECK(litPixels(big) > litPixels(small));
  }
}

void testBoot() {
  SUITE("BootSequence");

  // Sekans ilerledikçe ekran değişmeli ve sonunda bitmeli.
  const uint32_t total = BootSequence::totalMs(true);
  CHECK(total > 0);
  CHECK(BootSequence::totalMs(true) > BootSequence::totalMs(false));

  uint32_t previousLit = 0;
  int changes = 0;
  for (uint32_t t = 0; t < total; t += 250) {
    Canvas canvas;
    CHECK(BootSequence::render(canvas, t, true, "Gülçin"));
    const uint32_t lit = static_cast<uint32_t>(litPixels(canvas));
    if (t > 0 && lit != previousLit) ++changes;
    previousLit = lit;
  }
  CHECK(changes > 4);

  // Bitiş: süre dolduğunda false döner ve ana döngü IDLE'a geçer.
  Canvas canvas;
  CHECK(!BootSequence::render(canvas, total, true, "Gülçin"));
  CHECK(!BootSequence::render(canvas, total + 5000, true, "Gülçin"));

  // İlk açılış olmayan sekans daha kısa ve tanışma sözlerini atlar.
  CHECK(!BootSequence::render(canvas, BootSequence::totalMs(false), false, "Gülçin"));
}

void testAnimationMood() {
  SUITE("Animasyon → ruh hali");

  {  // "sad" animasyonu tek başına gelse bile yüz üzgünleşir
    AnimationEngine engine;
    engine.seedBlink(0xFFFFFFFF);
    CHECK(engine.mood() == Mood::Normal);
    engine.play(Animation::Sad, 0, 3000);
    CHECK(engine.mood() == Mood::Sad);
  }

  {  // kalp → sevgi, uyku → uykulu
    AnimationEngine engine;
    engine.play(Animation::Heart, 0);
    CHECK(engine.mood() == Mood::Love);
    engine.play(Animation::Sleep, 100);
    CHECK(engine.mood() == Mood::Sleepy);
  }

  {  // nötr animasyonlar ruh halini bozmaz
    AnimationEngine engine;
    engine.setMood(Mood::Happy, 0);
    engine.play(Animation::Blink, 10);
    CHECK(engine.mood() == Mood::Happy);
    engine.play(Animation::Loading, 20);
    CHECK(engine.mood() == Mood::Happy);
  }

  {  // Ekranda da gerçekten fark var: üzgün animasyon normalden farklı çizilir
    AnimationEngine sad, normal;
    sad.seedBlink(0xFFFFFFFF);
    normal.seedBlink(0xFFFFFFFF);
    sad.play(Animation::Sad, 0, 3000);

    Canvas sadCanvas, normalCanvas;
    sad.render(sadCanvas, 1000);
    normal.render(normalCanvas, 1000);

    int diff = 0;
    for (int16_t y = 0; y < Canvas::kHeight; ++y)
      for (int16_t x = 0; x < Canvas::kWidth; ++x)
        if (sadCanvas.pixel(x, y) != normalCanvas.pixel(x, y)) ++diff;
    CHECK(diff > 20);
  }

  {  // Ters eşleme tutarlı: ruh hali → animasyon → aynı ruh hali
    const Mood moods[] = {Mood::Happy, Mood::Sad, Mood::Love, Mood::Sleepy,
                          Mood::Thinking, Mood::Talking, Mood::Excited, Mood::Surprised};
    for (Mood mood : moods) {
      Mood back;
      CHECK(moodForAnimation(animationForMood(mood), back));
      CHECK(back == mood);
    }
  }
}
