#!/usr/bin/env python3
"""
Arduino IDE sketch'i üreteci.

Elçin'in kaynağı PlatformIO düzeninde durur (include/, src/core, src/hw,
src/app). Arduino IDE ise sketch klasöründeki dosyaları düz bir yığın olarak
derler ve alt klasör yollarını `#include "core/Canvas.h"` biçiminde çözemez.

İki ayrı nüsha tutmak yerine sketch'i üretiyoruz: kaynak tek yerde kalıyor,
Arduino klasörü ondan türetiliyor. Böylece biri diğerinden ayrı düşemez —
CI de üretilmiş sketch'in güncel olduğunu her push'ta doğruluyor.

    python3 tools/make_ino.py        (esp32/ dizininden)

Üretilen klasör: arduino/Elcin/
"""

import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKETCH_NAME = 'Elcin'
OUT_DIR = ROOT / 'arduino' / SKETCH_NAME

# Sketch'e girecek kaynaklar. Sıra önemsiz; Arduino hepsini derler.
SOURCE_DIRS = [
    ROOT / 'include',
    ROOT / 'src' / 'core',
    ROOT / 'src' / 'hw',
    ROOT / 'src' / 'app',
]

# src/main.cpp sketch'e girmez: Arduino'nun giriş noktası .ino dosyasıdır,
# ikisi birden olursa setup/loop iki kez tanımlanır.
SKIP = {'main.cpp'}

BANNER = """// ÜRETİLMİŞ DOSYA — elle düzenleme.
//
// Kaynak: esp32/{origin}
// Yeniden üret: cd esp32 && python3 tools/make_ino.py
//
// Değişiklik yapman gereken yer yukarıdaki kaynak dosya; buradaki düzenleme
// bir sonraki üretimde kaybolur.

"""

INO = '''/*
  Elçin — ESP32-C3 firmware (Arduino IDE sketch'i)

  Bu klasör esp32/tools/make_ino.py tarafından üretildi. Elçin'in kaynağı
  PlatformIO düzeninde duruyor; buradaki dosyalar onun düzleştirilmiş kopyası.

  ── Kurulum ───────────────────────────────────────────────────────────────
  1. Arduino IDE 2.x, Kart Yöneticisi'nden "esp32 by Espressif" (3.x)
  2. Kütüphane Yöneticisi'nden yalnızca iki kütüphane:
       Adafruit SSD1306       (Adafruit GFX'i bağımlılık olarak çeker)
       WebSockets             (Markus Sattler)
     ArduinoJson GEREKMİYOR: protokol ayrıştırması Protocol.cpp içinde,
     birkaç sabit alan için JSON ağacı kurmaya değmezdi.
  3. Kart: "ESP32C3 Dev Module"
       USB CDC On Boot : Enabled     ← bu olmadan seri port sessiz kalır
       Flash Size      : 4MB
       Partition Scheme: Default 4MB with spiffs (OTA için iki app bölümü)
       Upload Speed    : 921600

  ── Bağlantı ──────────────────────────────────────────────────────────────
       OLED VCC → 3.3V     OLED SDA → GPIO 20
       OLED GND → GND      OLED SCL → GPIO 21
       Dokunma  SIG → GPIO 3

  Pinler ve zaman aşımları ElcinConfig.h içinde; başka bir pin kullanacaksan
  yalnızca orayı değiştir.

  Ayrıntı: elcin-src/docs/ESP32_SETUP.md
*/

#include "ElcinApp.h"

void setup() {{ elcin::appSetup(); }}

void loop() {{ elcin::appLoop(); }}
'''


def flatten_includes(text: str, known: set) -> str:
    """`#include "hw/Display.h"` → `#include "Display.h"` (yalnızca bilinen dosyalar)."""

    def replace(match: re.Match) -> str:
        target = match.group(1)
        name = Path(target).name
        if name in known:
            return f'#include "{name}"'
        return match.group(0)

    return re.sub(r'#include\s+"([^"]+)"', replace, text)


def main() -> None:
    sources = []
    for directory in SOURCE_DIRS:
        if not directory.is_dir():
            raise SystemExit(f'bulunamadi: {directory}')
        for path in sorted(directory.iterdir()):
            if path.suffix in {'.h', '.cpp'} and path.name not in SKIP:
                sources.append(path)

    names = {path.name for path in sources}

    # Aynı ada sahip iki dosya düz klasörde çakışır; sessizce birinin
    # kaybolmasındansa burada durmak iyi.
    duplicates = [name for name in names if sum(p.name == name for p in sources) > 1]
    if duplicates:
        raise SystemExit(f'ayni adli birden fazla dosya: {sorted(set(duplicates))}')

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    for path in sources:
        origin = path.relative_to(ROOT).as_posix()
        text = flatten_includes(path.read_text(encoding='utf-8'), names)

        # #pragma once başlıkta kalmalı, banner onu aşağı itmemeli.
        if text.startswith('#pragma once'):
            text = '#pragma once\n\n' + BANNER.format(origin=origin) + text[len('#pragma once\n'):].lstrip('\n')
        else:
            text = BANNER.format(origin=origin) + text

        (OUT_DIR / path.name).write_text(text, encoding='utf-8')

    (OUT_DIR / f'{SKETCH_NAME}.ino').write_text(INO.format(), encoding='utf-8')

    headers = sum(1 for p in sources if p.suffix == '.h')
    units = sum(1 for p in sources if p.suffix == '.cpp')
    print(f'{OUT_DIR.relative_to(ROOT.parent)} yazildi')
    print(f'  {SKETCH_NAME}.ino + {headers} baslik + {units} kaynak')


if __name__ == '__main__':
    main()
    sys.exit(0)
