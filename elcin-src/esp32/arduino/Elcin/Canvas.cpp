// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/src/core/Canvas.cpp
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

#include "Canvas.h"

#include <cstdlib>
#include <cstring>

namespace elcin {
namespace {

int16_t iabs(int16_t v) { return v < 0 ? static_cast<int16_t>(-v) : v; }

}  // namespace

Canvas::Canvas() { clear(); }

void Canvas::clear(Ink ink) {
  std::memset(buffer_, ink == Ink::White ? 0xFF : 0x00, kBytes);
}

void Canvas::setPixel(int16_t x, int16_t y, Ink ink) {
  if (x < 0 || y < 0 || x >= kWidth || y >= kHeight) return;

  const size_t index = static_cast<size_t>(x) + (static_cast<size_t>(y) / 8) * kWidth;
  const uint8_t mask = static_cast<uint8_t>(1u << (y & 7));

  switch (ink) {
    case Ink::White:  buffer_[index] |= mask; break;
    case Ink::Black:  buffer_[index] = static_cast<uint8_t>(buffer_[index] & ~mask); break;
    case Ink::Invert: buffer_[index] ^= mask; break;
  }
}

bool Canvas::pixel(int16_t x, int16_t y) const {
  if (x < 0 || y < 0 || x >= kWidth || y >= kHeight) return false;
  const size_t index = static_cast<size_t>(x) + (static_cast<size_t>(y) / 8) * kWidth;
  return (buffer_[index] & (1u << (y & 7))) != 0;
}

void Canvas::hLine(int16_t x, int16_t y, int16_t w, Ink ink) {
  for (int16_t i = 0; i < w; ++i) setPixel(static_cast<int16_t>(x + i), y, ink);
}

void Canvas::vLine(int16_t x, int16_t y, int16_t h, Ink ink) {
  for (int16_t i = 0; i < h; ++i) setPixel(x, static_cast<int16_t>(y + i), ink);
}

void Canvas::line(int16_t x0, int16_t y0, int16_t x1, int16_t y1, Ink ink) {
  // Bresenham; kayan nokta yok, ESP32-C3'te FPU da yok.
  int16_t dx = iabs(static_cast<int16_t>(x1 - x0));
  int16_t dy = static_cast<int16_t>(-iabs(static_cast<int16_t>(y1 - y0)));
  int16_t sx = x0 < x1 ? 1 : -1;
  int16_t sy = y0 < y1 ? 1 : -1;
  int32_t err = dx + dy;

  while (true) {
    setPixel(x0, y0, ink);
    if (x0 == x1 && y0 == y1) break;
    const int32_t e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 = static_cast<int16_t>(x0 + sx); }
    if (e2 <= dx) { err += dx; y0 = static_cast<int16_t>(y0 + sy); }
  }
}

void Canvas::rect(int16_t x, int16_t y, int16_t w, int16_t h, Ink ink) {
  if (w <= 0 || h <= 0) return;
  hLine(x, y, w, ink);
  hLine(x, static_cast<int16_t>(y + h - 1), w, ink);
  vLine(x, y, h, ink);
  vLine(static_cast<int16_t>(x + w - 1), y, h, ink);
}

void Canvas::fillRect(int16_t x, int16_t y, int16_t w, int16_t h, Ink ink) {
  for (int16_t j = 0; j < h; ++j) hLine(x, static_cast<int16_t>(y + j), w, ink);
}

void Canvas::circle(int16_t cx, int16_t cy, int16_t r, Ink ink) {
  if (r <= 0) { setPixel(cx, cy, ink); return; }
  int16_t x = r, y = 0;
  int32_t err = 1 - r;

  while (x >= y) {
    setPixel(static_cast<int16_t>(cx + x), static_cast<int16_t>(cy + y), ink);
    setPixel(static_cast<int16_t>(cx + y), static_cast<int16_t>(cy + x), ink);
    setPixel(static_cast<int16_t>(cx - y), static_cast<int16_t>(cy + x), ink);
    setPixel(static_cast<int16_t>(cx - x), static_cast<int16_t>(cy + y), ink);
    setPixel(static_cast<int16_t>(cx - x), static_cast<int16_t>(cy - y), ink);
    setPixel(static_cast<int16_t>(cx - y), static_cast<int16_t>(cy - x), ink);
    setPixel(static_cast<int16_t>(cx + y), static_cast<int16_t>(cy - x), ink);
    setPixel(static_cast<int16_t>(cx + x), static_cast<int16_t>(cy - y), ink);
    ++y;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      --x;
      err += 2 * (y - x) + 1;
    }
  }
}

void Canvas::fillCircle(int16_t cx, int16_t cy, int16_t r, Ink ink) {
  for (int16_t dy = -r; dy <= r; ++dy) {
    for (int16_t dx = -r; dx <= r; ++dx) {
      if (dx * dx + dy * dy <= r * r) {
        setPixel(static_cast<int16_t>(cx + dx), static_cast<int16_t>(cy + dy), ink);
      }
    }
  }
}

void Canvas::roundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, Ink ink) {
  if (w <= 0 || h <= 0) return;
  const int16_t maxR = static_cast<int16_t>((w < h ? w : h) / 2);
  if (r > maxR) r = maxR;
  if (r <= 0) { rect(x, y, w, h, ink); return; }

  hLine(static_cast<int16_t>(x + r), y, static_cast<int16_t>(w - 2 * r), ink);
  hLine(static_cast<int16_t>(x + r), static_cast<int16_t>(y + h - 1),
        static_cast<int16_t>(w - 2 * r), ink);
  vLine(x, static_cast<int16_t>(y + r), static_cast<int16_t>(h - 2 * r), ink);
  vLine(static_cast<int16_t>(x + w - 1), static_cast<int16_t>(y + r),
        static_cast<int16_t>(h - 2 * r), ink);

  // Dört köşe: tek çeyrek dairenin dört yansıması.
  int16_t px = r, py = 0;
  int32_t err = 1 - r;
  while (px >= py) {
    const int16_t l = static_cast<int16_t>(x + r);
    const int16_t rr = static_cast<int16_t>(x + w - 1 - r);
    const int16_t t = static_cast<int16_t>(y + r);
    const int16_t b = static_cast<int16_t>(y + h - 1 - r);

    setPixel(static_cast<int16_t>(rr + px), static_cast<int16_t>(b + py), ink);
    setPixel(static_cast<int16_t>(rr + py), static_cast<int16_t>(b + px), ink);
    setPixel(static_cast<int16_t>(l - py), static_cast<int16_t>(b + px), ink);
    setPixel(static_cast<int16_t>(l - px), static_cast<int16_t>(b + py), ink);
    setPixel(static_cast<int16_t>(l - px), static_cast<int16_t>(t - py), ink);
    setPixel(static_cast<int16_t>(l - py), static_cast<int16_t>(t - px), ink);
    setPixel(static_cast<int16_t>(rr + py), static_cast<int16_t>(t - px), ink);
    setPixel(static_cast<int16_t>(rr + px), static_cast<int16_t>(t - py), ink);

    ++py;
    if (err < 0) {
      err += 2 * py + 1;
    } else {
      --px;
      err += 2 * (py - px) + 1;
    }
  }
}

void Canvas::fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, Ink ink) {
  if (w <= 0 || h <= 0) return;
  const int16_t maxR = static_cast<int16_t>((w < h ? w : h) / 2);
  if (r > maxR) r = maxR;
  if (r <= 0) { fillRect(x, y, w, h, ink); return; }

  fillRect(static_cast<int16_t>(x + r), y, static_cast<int16_t>(w - 2 * r), h, ink);

  for (int16_t dy = 0; dy < h; ++dy) {
    for (int16_t dx = 0; dx < r; ++dx) {
      // Köşe yayının içinde mi: sol/sağ ve üst/alt için aynı yarıçap testi.
      const int16_t ox = static_cast<int16_t>(r - dx);
      int16_t oy = 0;
      if (dy < r) oy = static_cast<int16_t>(r - dy);
      else if (dy >= h - r) oy = static_cast<int16_t>(dy - (h - 1 - r));
      if (ox * ox + oy * oy > r * r) continue;

      setPixel(static_cast<int16_t>(x + dx), static_cast<int16_t>(y + dy), ink);
      setPixel(static_cast<int16_t>(x + w - 1 - dx), static_cast<int16_t>(y + dy), ink);
    }
  }
}

void Canvas::quadCurve(int16_t x0, int16_t y0, int16_t cx, int16_t cy,
                       int16_t x1, int16_t y1, Ink ink, int16_t thickness) {
  // Adım sayısı kaba yay uzunluğundan: kısa yayda delik, uzun yayda israf olmasın.
  const int16_t span = static_cast<int16_t>(iabs(static_cast<int16_t>(x1 - x0)) +
                                            iabs(static_cast<int16_t>(y1 - y0)) +
                                            iabs(static_cast<int16_t>(cy - y0)));
  int16_t steps = static_cast<int16_t>(span);
  if (steps < 8) steps = 8;
  if (steps > 96) steps = 96;

  int16_t prevX = x0, prevY = y0;
  for (int16_t i = 1; i <= steps; ++i) {
    // Tamsayı aritmetiği: t = i/steps, ölçek 1024.
    const int32_t t = (static_cast<int32_t>(i) << 10) / steps;
    const int32_t inv = 1024 - t;

    const int32_t x = (inv * inv * x0 + 2 * inv * t * cx + t * t * x1) >> 20;
    const int32_t y = (inv * inv * y0 + 2 * inv * t * cy + t * t * y1) >> 20;

    line(prevX, prevY, static_cast<int16_t>(x), static_cast<int16_t>(y), ink);
    if (thickness > 1) {
      line(prevX, static_cast<int16_t>(prevY + 1), static_cast<int16_t>(x),
           static_cast<int16_t>(y + 1), ink);
    }
    prevX = static_cast<int16_t>(x);
    prevY = static_cast<int16_t>(y);
  }
}

}  // namespace elcin
