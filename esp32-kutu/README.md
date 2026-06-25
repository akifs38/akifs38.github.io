# ESP32 Kutusu (klipsli kapak)

**ESP32 DevKit (38-pin, 55×28 mm)** için kutu + **klipsli (vidasız) kapak**.
Kart 4 standoff'a oturur, köşe kılavuzlarıyla konumlanır. **USB tarafı (kısa duvar) tamamen
açık**; uzun kenarlar da açık → jumperlar pinlere ulaşır. Az kablo payı + kablo çıkış çentikleri.

| Dosya | Açıklama |
|---|---|
| `stl/esp32_kutu.stl`  | Kutu (≈ 77 × 59 × 18 mm) — USB tarafı açık, 3 duvarda klips çıkıntısı |
| `stl/esp32_kapak.stl` | Klipsli kapak — etekleri 3 duvarı sarar, kancalar çıkıntının altına oturur; tepede havalandırma |

Önizleme: `onizleme.svg`

## Kapak nasıl kapanır
Kapağı kutunun üstüne koy, **bastır** → etek klips çıkıntılarının üstünden esneyip
**altına geçer ve klipsler** (tık). Vidasız. Açmak için bir kenardan hafif kaldır.
USB tarafında etek yok (o kenar açık).

## Baskı
- PLA/PETG, 0.2 mm. **PETG klips için daha esnek/dayanıklı.**
- Destek gerekmez. Kapağı **düz (plaka altta)** bas.
- Klips sıkı/gevşekse `GAP` (0.4) ve `BEAD` (0.9) değerlerini ayarla, yeniden üret.

## Kendi kartına göre (`esp_kutu_uret.py`)
| Değişken | Açıklama | Vars. |
|---|---|---|
| `ESP_L`, `ESP_W` | kart uzunluk / genişlik | 55 × 28 |
| `STANDOFF` | alttaki pin boşluğu | 6 |
| `CABLE` | kart çevresi kablo payı | 12 |
| `BEAD` / `GAP` | klips çıkıntısı / kapak boşluğu | 0.9 / 0.4 |
| `SKIRT_LEN` / `SKIRT_T` | kapak eteği boy / kalınlık | 7 / 2 |

> `python3 esp_kutu_uret.py` ile yeniden üret.
