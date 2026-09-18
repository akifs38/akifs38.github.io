// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/hw/Display.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

#include "Display.h"

#include "ElcinConfig.h"

namespace elcin {

bool Display::begin() {
  Wire.begin(ELCIN_I2C_SDA, ELCIN_I2C_SCL);
  // 400 kHz: 128×64'lük tam kare ~25 ms yerine ~7 ms sürüyor, yani 30 fps
  // hedefi I2C'ye takılmıyor.
  Wire.setClock(400000);

  ready_ = oled_.begin(SSD1306_SWITCHCAPVCC, ELCIN_OLED_ADDRESS);
  if (!ready_) return false;

  oled_.clearDisplay();
  oled_.display();
  return true;
}

void Display::push(const Canvas& canvas) {
  if (!ready_) return;
  // Aynı düzen: x + (y/8)*genişlik, bit (y&7). Dönüştürme yok.
  memcpy(oled_.getBuffer(), canvas.buffer(), Canvas::kBytes);
  oled_.display();
}

void Display::setBrightness(uint8_t value) {
  if (!ready_) return;
  oled_.ssd1306_command(SSD1306_SETCONTRAST);
  oled_.ssd1306_command(value);
}

}  // namespace elcin
