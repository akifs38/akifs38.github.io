# ESP32 Kutusu (vidalı kapak)

**ESP32 DevKit (38-pin, 55×28 mm)** için kapalı kutu + **4 köşeden M3 vidalı kapak**.
Kart 4 standoff'a oturur, köşe kılavuzlarıyla konumlanır. **Sadece USB tarafı (kısa duvar)
açık** — diğer tüm kenarlar kapalı.

| Dosya | Açıklama |
|---|---|
| `stl/esp32_kutu.stl`  | Kutu (≈ 76 × 57 × 18 mm) — kapalı, USB tarafı açık, 4 köşe vida kulesi |
| `stl/esp32_kapak.stl` | Kapak (düz, 4 gömme M3 deliği + konum lipi + havalandırma) |

Önizleme: `onizleme.svg`

## Montaj
1. ESP32'yi standoff'lara oturt (USB ucu açık kenara baksın).
2. Kapağı üste koy (konum lipi içeri girer), **4 köşeden M3 vida** ile kuleleri tuttur.

## Donanım
- **4× M3 × 10 mm** vida (kapak → köşe kuleleri, kendinden kılavuz).

## Baskı
- PLA/PETG, 0.2 mm. Destek gerekmez (kutu ve kapak düz basılır).
- Vida sıkı/gevşekse `PILOT` (2.7) / `CLEAR` (3.4) değerlerini ayarla.

## Kendi kartına göre (`esp_kutu_uret.py`)
| Değişken | Açıklama | Vars. |
|---|---|---|
| `ESP_L`, `ESP_W` | kart uzunluk / genişlik | 55 × 28 |
| `STANDOFF` | alttaki pin boşluğu | 6 |
| `CABLE` | kart çevresi kablo payı | 12 |
| `BOSS_D` | köşe vida kulesi çapı | 7 |
| `PILOT` / `CLEAR` | kule pilotu / kapak geçme | 2.7 / 3.4 |

> `python3 esp_kutu_uret.py` ile yeniden üret.
