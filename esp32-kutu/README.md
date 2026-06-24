# ESP32 Kutusu

**ESP32 DevKit V1** (yaygın 30/38-pin) için tepsi tipi kutu. Kart 4 standoff'a oturur,
köşe kılavuzlarıyla konumlanır; **USB ucu duvardan çıkar**. Kartın **etrafında bol
jumper/kablo boşluğu** ve duvarlarda **kablo çıkış çentikleri** var. Üst açık (pinlere
üstten erişim).

`stl/esp32_kutu.stl` (≈ 67.5 × 81.3 × 19 mm, tek parça). Önizleme: `onizleme.svg`.

## Özellikler
- Kart **standoff'lara** oturur (altta header/pin için ~6 mm boşluk).
- 4 **köşe kılavuzu** kartı konumlar; uzun kenarlar **açık** → jumperlar pinlere ulaşır.
- **USB penceresi** kısa duvarda (micro/USB-C konektör çıkar).
- 3 **kablo çıkış çentiği** (yan duvarlar) + kart çevresinde geniş boşluk.

## Baskı
- Malzeme PLA/PETG · katman 0.2 mm · duvar 3 perimetre · dolgu %20.
- Destek **gerekmez** (tepsi, dik duvarlar). Tabla 90×90+ yeterli.

## Kendi kartına göre ayarla (`esp_kutu_uret.py`)
| Değişken | Açıklama | Vars. |
|---|---|---|
| `ESP_L`, `ESP_W` | kart uzunluk / genişlik | 51.5 × 28.3 |
| `STANDOFF` | alttaki pin boşluğu | 6 |
| `CABLE` | kart çevresi kablo boşluğu | 24 |
| `USB_W`, `USB_H` | USB penceresi | 12 × 6 |
| `WALL`, `FLOOR` | duvar / taban | 2.5 |

> Kartını ölç (uzunluk × genişlik, USB ucu) ve `ESP_L`/`ESP_W`'yi gir, sonra
> `python3 esp_kutu_uret.py` ile yeniden üret.
> Kapak istersen söyle — geçmeli/vidalı bir üst kapak da eklerim.
