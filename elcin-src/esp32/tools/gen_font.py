#!/usr/bin/env python3
"""
Elçin OLED fontu üreteci.

Fontu elle hex yazmak yerine burada ASCII-art olarak tutuyoruz: bir harfi
düzeltmek isteyen insan '#' taşır, bayt hesaplamaz. Çıktı
include/Font5x10.h dosyasıdır; üretilmiş dosya depoya girer, böylece
firmware derlemek için Python gerekmez.

    python3 tools/gen_font.py

Hücre 5 piksel geniş, 10 piksel yüksek:

    satır 0   aksan (büyük harf)
    satır 1   aksan alt parçası / boşluk
    satır 2   aksan (küçük harf) · büyük harf gövde başlangıcı
    satır 3   boşluk
    satır 4   küçük harf x-yüksekliği başlangıcı
    satır 8   taban çizgisi
    satır 9   alt uzantı (g j p q y) ve sedilla (ç ş)

Türkçe harfler tabloda YOK: temel harf + aksan olarak çalışma anında
birleştiriliyor (bkz. Text.cpp). On iki glif için ayrı bitmap tutmak 120 bayt
fazladan flash demekti ve 'ö' ile 'o'nun zamanla birbirinden ayrı düşmesi
riskini getiriyordu.
"""

CELL_W = 5
CELL_H = 10

# 'cap'  → satır 2..8   (büyük harf, rakam, çoğu noktalama)
# 'asc'  → satır 2..8   (uzun küçük harf: b d f h k l t)
# 'x'    → satır 4..8   (x-yüksekliğinde küçük harf)
# 'desc' → satır 4..9   (alt uzantılı küçük harf: g p q y)
# 'jay'  → satır 2..9   (j: hem nokta hem alt uzantı)
GLYPHS = {
    ' ': ('cap', "...../...../...../...../...../...../....."),

    'A': ('cap', ".###./#...#/#...#/#####/#...#/#...#/#...#"),
    'B': ('cap', "####./#...#/#...#/####./#...#/#...#/####."),
    'C': ('cap', ".###./#...#/#..../#..../#..../#...#/.###."),
    'D': ('cap', "####./#...#/#...#/#...#/#...#/#...#/####."),
    'E': ('cap', "#####/#..../#..../####./#..../#..../#####"),
    'F': ('cap', "#####/#..../#..../####./#..../#..../#...."),
    'G': ('cap', ".###./#...#/#..../#.###/#...#/#...#/.####"),
    'H': ('cap', "#...#/#...#/#...#/#####/#...#/#...#/#...#"),
    'I': ('cap', "#####/..#../..#../..#../..#../..#../#####"),
    'J': ('cap', "....#/....#/....#/....#/#...#/#...#/.###."),
    'K': ('cap', "#...#/#..#./#.#../##.../#.#../#..#./#...#"),
    'L': ('cap', "#..../#..../#..../#..../#..../#..../#####"),
    'M': ('cap', "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#"),
    'N': ('cap', "#...#/##..#/#.#.#/#.#.#/#..##/#...#/#...#"),
    'O': ('cap', ".###./#...#/#...#/#...#/#...#/#...#/.###."),
    'P': ('cap', "####./#...#/#...#/####./#..../#..../#...."),
    'Q': ('cap', ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#"),
    'R': ('cap', "####./#...#/#...#/####./#.#../#..#./#...#"),
    'S': ('cap', ".####/#..../#..../.###./....#/....#/####."),
    'T': ('cap', "#####/..#../..#../..#../..#../..#../..#.."),
    'U': ('cap', "#...#/#...#/#...#/#...#/#...#/#...#/.###."),
    'V': ('cap', "#...#/#...#/#...#/#...#/#...#/.#.#./..#.."),
    'W': ('cap', "#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#"),
    'X': ('cap', "#...#/#...#/.#.#./..#../.#.#./#...#/#...#"),
    'Y': ('cap', "#...#/#...#/.#.#./..#../..#../..#../..#.."),
    'Z': ('cap', "#####/....#/...#./..#../.#.../#..../#####"),

    'a': ('x',   ".###./....#/.####/#...#/.####"),
    'b': ('asc', "#..../#..../####./#...#/#...#/#...#/####."),
    'c': ('x',   ".###./#..../#..../#..../.###."),
    'd': ('asc', "....#/....#/.####/#...#/#...#/#...#/.####"),
    'e': ('x',   ".###./#...#/#####/#..../.###."),
    'f': ('asc', "..##./.#.../.#.../####./.#.../.#.../.#..."),
    'g': ('desc',".####/#...#/#...#/.####/....#/.###."),
    'h': ('asc', "#..../#..../####./#...#/#...#/#...#/#...#"),
    'i': ('asc', "..#../...../.##../..#../..#../..#../.###."),
    'j': ('jay', "...#./...../...#./...#./...#./...#./#..#./.##.."),
    'k': ('asc', "#..../#..../#..#./#.#../##.../#.#../#..#."),
    'l': ('asc', ".##../..#../..#../..#../..#../..#../.###."),
    'm': ('x',   "##.#./#.#.#/#.#.#/#.#.#/#.#.#"),
    'n': ('x',   "####./#...#/#...#/#...#/#...#"),
    'o': ('x',   ".###./#...#/#...#/#...#/.###."),
    'p': ('desc',"####./#...#/#...#/####./#..../#...."),
    'q': ('desc',".####/#...#/#...#/.####/....#/....#"),
    'r': ('x',   "#.##./##..#/#..../#..../#...."),
    's': ('x',   ".####/#..../.###./....#/####."),
    't': ('asc', ".#.../.#.../####./.#.../.#.../.#..#/..##."),
    'u': ('x',   "#...#/#...#/#...#/#...#/.####"),
    'v': ('x',   "#...#/#...#/#...#/.#.#./..#.."),
    'w': ('x',   "#...#/#...#/#.#.#/#.#.#/.#.#."),
    'x': ('x',   "#...#/.#.#./..#../.#.#./#...#"),
    'y': ('desc',"#...#/#...#/#...#/.####/....#/.###."),
    'z': ('x',   "#####/...#./..#../.#.../#####"),

    '0': ('cap', ".###./#...#/#..##/#.#.#/##..#/#...#/.###."),
    '1': ('cap', "..#../.##../..#../..#../..#../..#../.###."),
    '2': ('cap', ".###./#...#/....#/...#./..#../.#.../#####"),
    '3': ('cap', "#####/...#./..##./....#/....#/#...#/.###."),
    '4': ('cap', "...#./..##./.#.#./#..#./#####/...#./...#."),
    '5': ('cap', "#####/#..../####./....#/....#/#...#/.###."),
    '6': ('cap', "..##./.#.../#..../####./#...#/#...#/.###."),
    '7': ('cap', "#####/....#/...#./..#../.#.../.#.../.#..."),
    '8': ('cap', ".###./#...#/#...#/.###./#...#/#...#/.###."),
    '9': ('cap', ".###./#...#/#...#/.####/....#/...#./.##.."),

    '.': ('cap', "...../...../...../...../...../...../..#.."),
    ',': ('desc',"...../...../...../..#../..#../.#..."),
    '!': ('cap', "..#../..#../..#../..#../..#../...../..#.."),
    '?': ('cap', ".###./#...#/....#/...#./..#../...../..#.."),
    ':': ('cap', "...../..#../...../...../..#../...../....."),
    '-': ('cap', "...../...../...../.###./...../...../....."),
    "'": ('cap', "..#../..#../...../...../...../...../....."),
    '(': ('cap', "...#./..#../.#.../.#.../.#.../..#../...#."),
    ')': ('cap', ".#.../..#../...#./...#./...#./..#../.#..."),
    '/': ('cap', "....#/....#/...#./..#../.#.../#..../#...."),
    '+': ('cap', "...../..#../..#../#####/..#../..#../....."),
    '*': ('cap', "...../#.#.#/.###./#####/.###./#.#.#/....."),
}

TOP = {'cap': 2, 'asc': 2, 'x': 4, 'desc': 4, 'jay': 2}


def render(kind: str, art: str):
    """ASCII-art'ı 10 satırlık bit maskesine çevirir (bit 4 = en sol piksel)."""
    rows = [0] * CELL_H
    lines = art.split('/')
    top = TOP[kind]

    for index, line in enumerate(lines):
        if len(line) != CELL_W:
            raise SystemExit(f'{kind}: "{line}" {len(line)} piksel, {CELL_W} olmalı')
        y = top + index
        if y >= CELL_H:
            raise SystemExit(f'{kind}: art hücreden taşıyor (satır {y})')
        bits = 0
        for column, char in enumerate(line):
            if char == '#':
                bits |= 1 << (CELL_W - 1 - column)
            elif char != '.':
                raise SystemExit(f'beklenmeyen karakter: {char!r}')
        rows[y] = bits
    return rows


def main() -> None:
    entries = []
    for char, (kind, art) in GLYPHS.items():
        entries.append((char, render(kind, art)))

    # Tabloda kod noktasına göre ikili arama yapılacak; sıralı olmalı.
    entries.sort(key=lambda item: ord(item[0]))

    out = []
    out.append('#pragma once')
    out.append('')
    out.append('// ÜRETİLMİŞ DOSYA — elle düzenleme.')
    out.append('// Kaynak: tools/gen_font.py  ·  yeniden üret: python3 tools/gen_font.py')
    out.append('//')
    out.append('// 5x10 piksel hücre. Her glif 10 bayt; her bayt bir satır, bit 4 en sol')
    out.append('// piksel. Türkçe harfler burada yok, Text.cpp içinde aksan bindirilerek')
    out.append('// üretiliyor.')
    out.append('')
    out.append('#include <cstdint>')
    out.append('')
    out.append('namespace elcin {')
    out.append('namespace font {')
    out.append('')
    out.append(f'constexpr int16_t kCellWidth = {CELL_W};')
    out.append(f'constexpr int16_t kCellHeight = {CELL_H};')
    out.append(f'constexpr uint16_t kGlyphCount = {len(entries)};')
    out.append('')
    out.append('struct Glyph {')
    out.append('  uint8_t codepoint;')
    out.append('  uint8_t rows[kCellHeight];')
    out.append('};')
    out.append('')
    out.append('constexpr Glyph kGlyphs[kGlyphCount] = {')

    body = []
    for char, rows in entries:
        label = char if char != "'" else "\\'"
        packed = ', '.join(f'0x{row:02X}' for row in rows)
        body.append(f"    {{0x{ord(char):02X}, {{{packed}}}}},  // '{label}'")
    out.extend(body)
    out.append('};')
    out.append('')
    out.append('}  // namespace font')
    out.append('}  // namespace elcin')
    out.append('')

    path = 'include/Font5x10.h'
    with open(path, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(out))
    print(f'{path} yazıldı — {len(entries)} glif, {len(entries) * CELL_H} bayt')


if __name__ == '__main__':
    main()
