#!/usr/bin/env python3
"""
PGM → PNG.

Pillow yok diye döküme bakamamak olmaz; PNG yazmak zaten zlib + birkaç CRC.
Sadece standart kütüphane kullanır.

    python3 tools/to_png.py test/out/*.pgm
"""

import struct
import sys
import zlib
from pathlib import Path


def read_pgm(path: Path):
    data = path.read_bytes()

    # P5 başlığı: sihirli sayı, genişlik, yükseklik, en büyük değer.
    fields = []
    at = 0
    while len(fields) < 4:
        while at < len(data) and data[at : at + 1].isspace():
            at += 1
        if data[at : at + 1] == b'#':                      # yorum satırı
            while at < len(data) and data[at] != 0x0A:
                at += 1
            continue
        start = at
        while at < len(data) and not data[at : at + 1].isspace():
            at += 1
        fields.append(data[start:at])
    at += 1

    if fields[0] != b'P5':
        raise SystemExit(f'{path}: P5 bekleniyordu, {fields[0]!r} geldi')

    width, height = int(fields[1]), int(fields[2])
    pixels = data[at : at + width * height]
    if len(pixels) != width * height:
        raise SystemExit(f'{path}: {width * height} bayt bekleniyordu, {len(pixels)} var')
    return width, height, pixels


def write_png(path: Path, width: int, height: int, pixels: bytes) -> None:
    def chunk(tag: bytes, payload: bytes) -> bytes:
        return (
            struct.pack('>I', len(payload))
            + tag
            + payload
            + struct.pack('>I', zlib.crc32(tag + payload) & 0xFFFFFFFF)
        )

    # Her satırın başına filtre baytı (0 = filtresiz).
    raw = b''.join(
        b'\x00' + pixels[row * width : (row + 1) * width] for row in range(height)
    )

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 0, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)


def main() -> None:
    paths = [Path(arg) for arg in sys.argv[1:]]
    if not paths:
        raise SystemExit('kullanim: to_png.py <dosya.pgm> [...]')

    for source in paths:
        width, height, pixels = read_pgm(source)
        target = source.with_suffix('.png')
        write_png(target, width, height, pixels)
        print(f'{target}  ({width}x{height})')


if __name__ == '__main__':
    main()
