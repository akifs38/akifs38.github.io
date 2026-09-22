/**
 * Yüz dökümü — OLED olmadan Elçin'in suratına bakmak için.
 *
 * Firmware'i gerçek donanımda görmeden yazmak, yüz gibi tamamen görsel bir işi
 * kör çizmek demek. Bu araç yüz motorunu masaüstünde koşturur ve ortaya çıkan
 * 128×64 tamponları büyütüp PGM olarak diske yazar; tools/to_png.py bunları
 * PNG'ye çevirir.
 *
 *   cd test && make render
 */

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>

#include "AnimationEngine.h"
#include "BootSequence.h"
#include "Canvas.h"
#include "FaceEngine.h"
#include "Text.h"

using namespace elcin;

namespace {

constexpr int kScale = 2;
constexpr int kLabelH = 14;
constexpr int kPad = 4;

struct Tile {
  Canvas canvas;
  std::string label;
};

/** Tek bir hücreyi (yüz + altında etiket) büyük tampona basar. */
void blit(std::vector<uint8_t>& image, int imageW, const Tile& tile, int originX,
          int originY) {
  // Yüz
  for (int y = 0; y < Canvas::kHeight; ++y) {
    for (int x = 0; x < Canvas::kWidth; ++x) {
      const uint8_t value = tile.canvas.pixel(static_cast<int16_t>(x),
                                              static_cast<int16_t>(y))
                                ? 255
                                : 0;
      for (int sy = 0; sy < kScale; ++sy) {
        for (int sx = 0; sx < kScale; ++sx) {
          const int px = originX + x * kScale + sx;
          const int py = originY + y * kScale + sy;
          image[static_cast<size_t>(py) * imageW + px] = value;
        }
      }
    }
  }

  // Etiket: aynı metin motoruyla çiziliyor, yani bu döküm fontu da sınıyor.
  Canvas strip;
  drawTextAligned(strip, 1, tile.label.c_str(), Align::Center);
  for (int y = 0; y < kLabelH; ++y) {
    for (int x = 0; x < Canvas::kWidth; ++x) {
      const uint8_t value = strip.pixel(static_cast<int16_t>(x), static_cast<int16_t>(y))
                                ? 160
                                : 24;
      for (int sy = 0; sy < kScale; ++sy) {
        for (int sx = 0; sx < kScale; ++sx) {
          const int px = originX + x * kScale + sx;
          const int py = originY + (Canvas::kHeight + y) * kScale + sy;
          image[static_cast<size_t>(py) * imageW + px] = value;
        }
      }
    }
  }
}

/** Tek kanallı gri tamponu PGM olarak yazar. */
void writePgm(const char* path, const std::vector<uint8_t>& image, int width,
              int height) {
  FILE* file = std::fopen(path, "wb");
  if (file == nullptr) {
    std::fprintf(stderr, "yazilamadi: %s\n", path);
    return;
  }
  std::fprintf(file, "P5\n%d %d\n255\n", width, height);
  std::fwrite(image.data(), 1, image.size(), file);
  std::fclose(file);
  std::printf("  %s  (%dx%d)\n", path, width, height);
}


void writeSheet(const char* path, const std::vector<Tile>& tiles, int columns) {
  const int rows = static_cast<int>((tiles.size() + columns - 1) / columns);
  const int cellW = Canvas::kWidth * kScale;
  const int cellH = (Canvas::kHeight + kLabelH) * kScale;
  const int imageW = columns * (cellW + kPad) + kPad;
  const int imageH = rows * (cellH + kPad) + kPad;

  // Arka plan koyu gri: siyah yüz kenarı ile kâğıt arasındaki sınır görünsün.
  std::vector<uint8_t> image(static_cast<size_t>(imageW) * imageH, 48);

  for (size_t i = 0; i < tiles.size(); ++i) {
    const int column = static_cast<int>(i % columns);
    const int row = static_cast<int>(i / columns);
    blit(image, imageW, tiles[i], kPad + column * (cellW + kPad),
         kPad + row * (cellH + kPad));
  }

  FILE* file = std::fopen(path, "wb");
  if (file == nullptr) {
    std::fprintf(stderr, "yazilamadi: %s\n", path);
    return;
  }
  std::fprintf(file, "P5\n%d %d\n255\n", imageW, imageH);
  std::fwrite(image.data(), 1, image.size(), file);
  std::fclose(file);
  std::printf("  %s  (%dx%d)\n", path, imageW, imageH);
}

}  // namespace

int main() {
  if (std::system("mkdir -p out") != 0) return 1;
  std::printf("\nElçin yüz dökümü\n");

  // 1. Tüm ruh halleri
  {
    const char* labels[] = {"normal", "mutlu",   "üzgün",     "meraklı", "düşünceli",
                            "şaşkın", "heyecan", "uykulu",    "konuşuyor", "sevgi"};
    std::vector<Tile> tiles;
    for (uint8_t i = 0; i < static_cast<uint8_t>(Mood::Count); ++i) {
      Tile tile;
      drawMood(tile.canvas, static_cast<Mood>(i));
      tile.label = labels[i];
      tiles.push_back(std::move(tile));
    }
    writeSheet("out/moods.pgm", tiles, 5);
  }

  // 1b. Tek yüz, 1:1, etiketsiz — kutu önizleyicisi bunu pencereye yapıştırıp
  //     yüzün 24 × 16 mm'lik camda gerçekte ne kadar yer kapladığını gösteriyor.
  {
    Canvas canvas;
    drawMood(canvas, Mood::Normal);
    std::vector<uint8_t> image(Canvas::kWidth * Canvas::kHeight, 0);
    for (int y = 0; y < Canvas::kHeight; ++y) {
      for (int x = 0; x < Canvas::kWidth; ++x) {
        image[y * Canvas::kWidth + x] = canvas.pixel(static_cast<int16_t>(x), static_cast<int16_t>(y)) ? 255 : 0;
      }
    }
    writePgm("out/yuz.pgm", image, Canvas::kWidth, Canvas::kHeight);
  }

  // 2. Animasyonlar — her biri karakteristik anında yakalanıyor
  {
    struct Frame { Animation animation; uint32_t at; const char* label; };
    const Frame frames[] = {
        {Animation::Idle, 100, "idle"},        {Animation::Blink, 50, "göz kırp"},
        {Animation::Smile, 100, "gülümse"},    {Animation::Laugh, 100, "gül"},
        {Animation::Sad, 100, "üzgün"},        {Animation::Surprise, 60, "şaşır"},
        {Animation::Think, 700, "düşün"},      {Animation::Talk, 60, "konuş"},
        {Animation::Heart, 100, "kalp"},       {Animation::Sleep, 200, "uyu"},
        {Animation::Wake, 100, "uyan"},        {Animation::Loading, 900, "yükleniyor"},
    };

    std::vector<Tile> tiles;
    for (const auto& frame : frames) {
      Tile tile;
      AnimationEngine engine;
      engine.seedBlink(0xFFFFFFFF);  // kendiliğinden kırpma kareyi bozmasın
      engine.setMood(Mood::Normal, 0);
      engine.play(frame.animation, 0, 8000);
      engine.render(tile.canvas, frame.at);
      tile.label = frame.label;
      tiles.push_back(std::move(tile));
    }
    writeSheet("out/animations.pgm", tiles, 4);
  }

  // 3. Açılış sekansı
  {
    const uint32_t total = BootSequence::totalMs(true);
    std::vector<Tile> tiles;
    for (int i = 0; i < 12; ++i) {
      const uint32_t at = static_cast<uint32_t>((total * i) / 12);
      Tile tile;
      BootSequence::render(tile.canvas, at, true, "Gülçin");
      tile.label = std::to_string(at) + " ms";
      tiles.push_back(std::move(tile));
    }
    writeSheet("out/boot.pgm", tiles, 4);
  }

  // 4. Türkçe metin — fontun asıl sınavı
  {
    std::vector<Tile> tiles;
    {
      Tile tile;
      drawWrapped(tile.canvas, 4, 4, 120, "Merhaba Gülçin, bugün nasılsın?");
      tile.label = "sarmalı metin";
      tiles.push_back(std::move(tile));
    }
    {
      Tile tile;
      drawTextAligned(tile.canvas, 4, "çÇ ğĞ ıI İi", Align::Center);
      drawTextAligned(tile.canvas, 20, "öÖ şŞ üÜ", Align::Center);
      drawTextAligned(tile.canvas, 40, "0123456789", Align::Center);
      tile.label = "Türkçe harfler";
      tiles.push_back(std::move(tile));
    }
    {
      Tile tile;
      drawTextAligned(tile.canvas, 6, "ELÇİN", Align::Center, Ink::White, 2);
      drawTextAligned(tile.canvas, 34, "PAIRING", Align::Center);
      drawTextAligned(tile.canvas, 48, "482731", Align::Center);
      tile.label = "eşleşme ekranı";
      tiles.push_back(std::move(tile));
    }
    {
      Tile tile;
      drawWrapped(tile.canvas, 4, 8, 120, "Şu an internete ulaşamıyorum ama buradayım.");
      tile.label = "çevrimdışı";
      tiles.push_back(std::move(tile));
    }
    writeSheet("out/text.pgm", tiles, 2);
  }

  std::printf("\nPNG'ye çevir: python3 ../tools/to_png.py out/*.pgm\n\n");
  return 0;
}
