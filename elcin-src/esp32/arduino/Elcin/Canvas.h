#pragma once

// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/include/Canvas.h
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

/**
 * 128×64 tek renkli çerçeve tamponu.
 *
 * Tüm çizim buraya yapılır; ekrana basmak ayrı bir iştir (src/hw/Display).
 * Bu ayrım sayesinde yüz motoru masaüstünde çalıştırılıp PNG'ye basılabiliyor
 * — yani Elçin'in ifadelerine donanım olmadan da bakılabiliyor.
 *
 * Tampon SSD1306'nın beklediği düzende tutulur: her bayt 8 piksellik dikey bir
 * dilim, sayfa sayfa. Böylece ekrana gönderirken dönüştürme yapılmaz.
 */

#include <cstdint>
#include <cstddef>

namespace elcin {

enum class Ink : uint8_t { Black = 0, White = 1, Invert = 2 };

class Canvas {
 public:
  static constexpr int16_t kWidth = 128;
  static constexpr int16_t kHeight = 64;
  static constexpr size_t kBytes = (kWidth * kHeight) / 8;

  Canvas();

  void clear(Ink ink = Ink::Black);
  void setPixel(int16_t x, int16_t y, Ink ink);
  bool pixel(int16_t x, int16_t y) const;

  void hLine(int16_t x, int16_t y, int16_t w, Ink ink);
  void vLine(int16_t x, int16_t y, int16_t h, Ink ink);
  void line(int16_t x0, int16_t y0, int16_t x1, int16_t y1, Ink ink);
  void rect(int16_t x, int16_t y, int16_t w, int16_t h, Ink ink);
  void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, Ink ink);
  void roundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, Ink ink);
  void fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, Ink ink);
  void circle(int16_t cx, int16_t cy, int16_t r, Ink ink);
  void fillCircle(int16_t cx, int16_t cy, int16_t r, Ink ink);

  /**
   * Kuadratik Bézier yayı — ağzın kıvrımı bununla çiziliyor.
   * Adım sayısı yay uzunluğundan türetilir; sabit adım kısa yaylarda boşluk,
   * uzun yaylarda gereksiz iş bırakıyordu.
   */
  void quadCurve(int16_t x0, int16_t y0, int16_t cx, int16_t cy,
                 int16_t x1, int16_t y1, Ink ink, int16_t thickness = 1);

  const uint8_t* buffer() const { return buffer_; }
  uint8_t* buffer() { return buffer_; }

 private:
  uint8_t buffer_[kBytes];
};

}  // namespace elcin
