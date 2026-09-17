#include "Text.h"

#include "Font5x10.h"

namespace elcin {
namespace {

/** Temel harfin üstüne/altına eklenen işaret. */
enum class Accent : uint8_t {
  None,
  DotAbove,        // İ
  DiaeresisAbove,  // Ö Ü ö ü
  BreveAbove,      // Ğ ğ
  CedillaBelow,    // Ç Ş ç ş
  RemoveDot,       // ı
};

struct Mapped {
  char base;
  Accent accent;
  bool upper;
};

/**
 * Türkçe kod noktasını temel harf + aksana indirger.
 *
 * Buradaki tek incelik 'I'/'i' çifti: Türkçede büyük 'I'nın küçüğü noktasız
 * 'ı', büyük 'İ'nin küçüğü noktalı 'i'dir. ASCII 'I' zaten noktasız
 * olduğundan olduğu gibi geçer; 'ı' ise 'i'nin noktası silinerek üretilir.
 */
Mapped mapCodepoint(uint32_t codepoint) {
  switch (codepoint) {
    case 0x00C7: return {'C', Accent::CedillaBelow, true};    // Ç
    case 0x00E7: return {'c', Accent::CedillaBelow, false};   // ç
    case 0x011E: return {'G', Accent::BreveAbove, true};      // Ğ
    case 0x011F: return {'g', Accent::BreveAbove, false};     // ğ
    case 0x0130: return {'I', Accent::DotAbove, true};        // İ
    case 0x0131: return {'i', Accent::RemoveDot, false};      // ı
    case 0x00D6: return {'O', Accent::DiaeresisAbove, true};  // Ö
    case 0x00F6: return {'o', Accent::DiaeresisAbove, false}; // ö
    case 0x015E: return {'S', Accent::CedillaBelow, true};    // Ş
    case 0x015F: return {'s', Accent::CedillaBelow, false};   // ş
    case 0x00DC: return {'U', Accent::DiaeresisAbove, true};  // Ü
    case 0x00FC: return {'u', Accent::DiaeresisAbove, false}; // ü
    // Sık kullanılan birkaç düzeltme işareti: aksansız karşılığına düşer.
    case 0x00C2: return {'A', Accent::None, true};            // Â
    case 0x00E2: return {'a', Accent::None, false};
    case 0x00CE: return {'I', Accent::None, true};            // Î
    case 0x00EE: return {'i', Accent::None, false};
    case 0x00DB: return {'U', Accent::None, true};            // Û
    case 0x00FB: return {'u', Accent::None, false};
    default:     return {'\0', Accent::None, false};
  }
}

const font::Glyph* findGlyph(char character) {
  const auto target = static_cast<uint8_t>(character);
  uint16_t low = 0;
  uint16_t high = font::kGlyphCount;
  while (low < high) {
    const uint16_t mid = static_cast<uint16_t>((low + high) / 2);
    if (font::kGlyphs[mid].codepoint == target) return &font::kGlyphs[mid];
    if (font::kGlyphs[mid].codepoint < target) low = static_cast<uint16_t>(mid + 1);
    else high = mid;
  }
  return nullptr;
}

/** Aksanın hangi satıra ve hangi desenle bindiği. */
void applyAccent(uint8_t rows[font::kCellHeight], Accent accent, bool upper) {
  // Büyük harfin aksanı hücrenin en üstüne, küçük harfinki x-yüksekliğinin
  // hemen üstüne gelir; yoksa 'ö'nün noktaları harften kopuk durur.
  const int topRow = upper ? 0 : 2;

  switch (accent) {
    case Accent::DotAbove:
      rows[topRow] |= 0b00100;
      break;
    case Accent::DiaeresisAbove:
      rows[topRow] |= 0b01010;
      break;
    case Accent::BreveAbove:
      // İki satırlık kâse: tek satırda breve ile makron ayırt edilemiyor.
      rows[topRow] |= 0b10001;
      rows[topRow + 1] |= 0b01110;
      break;
    case Accent::CedillaBelow:
      rows[font::kCellHeight - 1] |= 0b00100;
      break;
    case Accent::RemoveDot:
      // 'i' tablodan noktalı geliyor; 'ı' için o satır temizlenir.
      rows[2] = 0;
      break;
    case Accent::None:
      break;
  }
}

/** Kod noktasını çizilebilir 10 satırlık maskeye çevirir. */
bool glyphFor(uint32_t codepoint, uint8_t rows[font::kCellHeight]) {
  for (int i = 0; i < font::kCellHeight; ++i) rows[i] = 0;

  char base = '\0';
  Accent accent = Accent::None;
  bool upper = false;

  if (codepoint < 0x80) {
    base = static_cast<char>(codepoint);
  } else {
    const Mapped mapped = mapCodepoint(codepoint);
    if (mapped.base == '\0') return false;
    base = mapped.base;
    accent = mapped.accent;
    upper = mapped.upper;
  }

  const font::Glyph* glyph = findGlyph(base);
  if (glyph == nullptr) return false;

  for (int i = 0; i < font::kCellHeight; ++i) rows[i] = glyph->rows[i];
  applyAccent(rows, accent, upper);
  return true;
}

constexpr int16_t kAdvance = font::kCellWidth + 1;
constexpr int16_t kLineGap = 2;

}  // namespace

uint32_t decodeUtf8(const char* text, uint16_t& index) {
  const auto first = static_cast<uint8_t>(text[index]);
  if (first == 0) return 0;

  auto continuation = [&](uint16_t offset) -> bool {
    const auto byte = static_cast<uint8_t>(text[index + offset]);
    return (byte & 0xC0) == 0x80;
  };

  if (first < 0x80) {
    index += 1;
    return first;
  }
  if ((first & 0xE0) == 0xC0 && continuation(1)) {
    const uint32_t value = ((first & 0x1Fu) << 6) |
                           (static_cast<uint8_t>(text[index + 1]) & 0x3Fu);
    index += 2;
    return value;
  }
  if ((first & 0xF0) == 0xE0 && continuation(1) && continuation(2)) {
    const uint32_t value = ((first & 0x0Fu) << 12) |
                           ((static_cast<uint8_t>(text[index + 1]) & 0x3Fu) << 6) |
                           (static_cast<uint8_t>(text[index + 2]) & 0x3Fu);
    index += 3;
    return value;
  }
  if ((first & 0xF8) == 0xF0 && continuation(1) && continuation(2) && continuation(3)) {
    const uint32_t value = ((first & 0x07u) << 18) |
                           ((static_cast<uint8_t>(text[index + 1]) & 0x3Fu) << 12) |
                           ((static_cast<uint8_t>(text[index + 2]) & 0x3Fu) << 6) |
                           (static_cast<uint8_t>(text[index + 3]) & 0x3Fu);
    index += 4;
    return value;
  }

  // Bozuk dizi: bir bayt atla. Takılıp kalmaktansa tek karakter kaybetmek yeğ.
  index += 1;
  return 0xFFFD;
}

int16_t lineHeight(int16_t scale) {
  return static_cast<int16_t>((font::kCellHeight + kLineGap) * scale);
}

int16_t textWidth(const char* utf8, int16_t scale) {
  if (utf8 == nullptr) return 0;
  uint16_t index = 0;
  int16_t width = 0;
  while (utf8[index] != '\0') {
    decodeUtf8(utf8, index);
    width = static_cast<int16_t>(width + kAdvance * scale);
  }
  // Son karakterden sonraki boşluk sayılmaz.
  return width > 0 ? static_cast<int16_t>(width - scale) : 0;
}

int16_t drawText(Canvas& canvas, int16_t x, int16_t y, const char* utf8, Ink ink,
                 int16_t scale) {
  if (utf8 == nullptr || scale < 1) return 0;

  uint16_t index = 0;
  int16_t cursor = x;
  uint8_t rows[font::kCellHeight];

  while (utf8[index] != '\0') {
    const uint32_t codepoint = decodeUtf8(utf8, index);
    if (codepoint == '\n') break;

    if (glyphFor(codepoint, rows)) {
      for (int16_t row = 0; row < font::kCellHeight; ++row) {
        const uint8_t bits = rows[row];
        if (bits == 0) continue;
        for (int16_t column = 0; column < font::kCellWidth; ++column) {
          if ((bits & (1u << (font::kCellWidth - 1 - column))) == 0) continue;
          if (scale == 1) {
            canvas.setPixel(static_cast<int16_t>(cursor + column),
                            static_cast<int16_t>(y + row), ink);
          } else {
            canvas.fillRect(static_cast<int16_t>(cursor + column * scale),
                            static_cast<int16_t>(y + row * scale), scale, scale, ink);
          }
        }
      }
    }
    cursor = static_cast<int16_t>(cursor + kAdvance * scale);
  }

  return static_cast<int16_t>(cursor - x);
}

int16_t drawTextAligned(Canvas& canvas, int16_t y, const char* utf8, Align align,
                        Ink ink, int16_t scale) {
  const int16_t width = textWidth(utf8, scale);
  int16_t x = 0;
  if (align == Align::Center) x = static_cast<int16_t>((Canvas::kWidth - width) / 2);
  else if (align == Align::Right) x = static_cast<int16_t>(Canvas::kWidth - width);
  if (x < 0) x = 0;
  return drawText(canvas, x, y, utf8, ink, scale);
}

int16_t drawWrapped(Canvas& canvas, int16_t x, int16_t y, int16_t width,
                    const char* utf8, Ink ink, int16_t scale, int16_t maxLines) {
  if (utf8 == nullptr || scale < 1) return 0;

  const int16_t advance = static_cast<int16_t>(kAdvance * scale);
  const int16_t perLine = static_cast<int16_t>(width / advance);
  if (perLine <= 0) return 0;

  // Satır tamponu: 32 karakter, UTF-8'de en fazla 4 bayt + sonlandırıcı.
  char line[32 * 4 + 1];
  uint16_t lineBytes = 0;
  int16_t lineChars = 0;
  int16_t drawn = 0;
  int16_t cursorY = y;

  // Son boşluğun tampondaki yeri: sözcüğü ortadan bölmemek için geri dönülür.
  uint16_t lastSpaceBytes = 0;
  int16_t lastSpaceChars = 0;
  bool hasSpace = false;

  auto flush = [&](uint16_t bytes) {
    line[bytes] = '\0';
    drawText(canvas, x, cursorY, line, ink, scale);
    cursorY = static_cast<int16_t>(cursorY + lineHeight(scale));
    ++drawn;
  };

  uint16_t index = 0;
  while (utf8[index] != '\0') {
    if (maxLines > 0 && drawn >= maxLines) break;

    const uint16_t start = index;
    const uint32_t codepoint = decodeUtf8(utf8, index);
    const uint16_t bytes = static_cast<uint16_t>(index - start);

    if (codepoint == '\n') {
      flush(lineBytes);
      lineBytes = 0;
      lineChars = 0;
      hasSpace = false;
      continue;
    }

    if (lineBytes + bytes >= sizeof(line) - 1 || lineChars >= perLine) {
      if (hasSpace && codepoint != ' ') {
        // Sözcüğü bölmeden sar: boşluğa kadar bas, kalanı sonraki satıra taşı.
        const uint16_t carryBytes = static_cast<uint16_t>(lineBytes - lastSpaceBytes);
        char carry[32 * 4 + 1];
        for (uint16_t i = 0; i < carryBytes; ++i) carry[i] = line[lastSpaceBytes + i];

        flush(lastSpaceBytes);

        lineBytes = 0;
        for (uint16_t i = 0; i < carryBytes; ++i) line[lineBytes++] = carry[i];
        lineChars = static_cast<int16_t>(lineChars - lastSpaceChars);
      } else {
        flush(lineBytes);
        lineBytes = 0;
        lineChars = 0;
      }
      hasSpace = false;
      if (maxLines > 0 && drawn >= maxLines) break;
    }

    // Satır başındaki boşluk atlanır; sarma sonrası girinti oluşmasın.
    if (codepoint == ' ' && lineChars == 0) continue;

    if (codepoint == ' ') {
      hasSpace = true;
      lastSpaceBytes = static_cast<uint16_t>(lineBytes + bytes);
      lastSpaceChars = static_cast<int16_t>(lineChars + 1);
    }

    for (uint16_t i = 0; i < bytes; ++i) line[lineBytes++] = utf8[start + i];
    ++lineChars;
  }

  if (lineBytes > 0 && (maxLines <= 0 || drawn < maxLines)) flush(lineBytes);
  return drawn;
}

}  // namespace elcin
