# Yangın Kulesi — 3D Baskı Parçaları (STL)

SG90 servolar + Arduino ile gerçek kuleyi kurmak için baskıya hazır, **parametrik** parçalar.
Tüm ölçüler **mm**, FDM baskı için ~0.45 mm tolerans dahildir. Kaynak: `parcalar_uret.py`
(manifold3d ile CSG). Tekrar üretmek/değiştirmek için:

```bash
pip install manifold3d numpy-stl
python3 parcalar_uret.py     # -> stl/*.stl
```

## Parça listesi (`stl/`)

| Dosya | Açıklama | Adet |
|-------|----------|------|
| `00_MONTAJ.stl`          | **Montajlı hâl** — tüm parçalar yerinde + basit SG90 gövdeleri (yalnız görsel referans, basma) | — |
| `01_taban_plakasi.stl`   | 90×90×4 taban; köşe M3 + alt servo/kule montaj delikleri, kablo boşluğu | 1 |
| `02_alt_servo_tutucu.stl`| ALT (tarama) SG90 — kapalı gövde cebi + flanş gömme + kulak vidaları (kablo alttan çıkar) | 1 |
| `03_flame_sensor_tutucu.stl`| Alev sensörüne özel tutucu: arka plaka 3 mm geride (lehim/SMD sıkışmaz), kart 3 destek topuzuna değer + tek vidayla sabitlenir, ön yüz tamamen açık, IR göz öne; kablo arkadan | 1 |
| `04_kule_yukseltici.stl` | Üst servoyu kaldıran dikme; **baştan sona içi boş kablo kanalı** (11×11), yanlar kapalı, üst/alt flanşlı | 1 |
| `05_ust_servo_tutucu.stl`| ÜST (nişan) SG90 — kule üstü, kapalı gövde cebi (kablo ortadan kuleye iner) | 1 |
| `06_nozul_taban.stl`     | Nozül tabanı: 2 kulak + pivot; vida −Y kulağa **kendinden kılavuz** (somun yok) | 1 |
| `06b_nozul_kol.stl`      | Pivottan **eğilen kol**: Ø8 boru kelepçesi (taban kulakları arasına girer) | 1 |
| `06c_ayar_dugmesi.stl`   | Elle çevrilen **tırtıllı baskı düğmesi** (M3 cap-head'e geçer; anahtarsız sık-gevşet) | 1 |
| `07_arduino_case.stl`    | Arduino UNO **+ 1-kanal röle** kutusu (taban plakasının **altına**); UNO ve röle standoff'ları, USB/güç penceresi, röle terminal yuvası, havalandırma; üstüne taban plakası 4 köşeden vidalanır | 1 |

## Önerilen baskı ayarları
- Malzeme: **PLA** veya **PETG** (alev kaynağından uzak tut!)
- Katman: 0.2 mm · Duvar: 3 perimetre · Dolgu: %25–40
- Destek: genelde gerekmez; yalnız `06_nozul_kelepcesi` halkası için "yalnızca tabandan" destek iyi olur
- Yönlendirme: tüm tutucuları **ayak/taban yüzü tabla üstte** yatır (delikler temiz çıksın)

## Vida/donanım (BOM)
- SG90 servo ×2 (kendi plastik horn'u ve M2 vidalarıyla)
- M2 × 6–8 mm vida ×4 (servo kulaklarını tutuculara)
- M3 × 8–10 mm vida + somun ×~10 (taban, kule, tutucu birleşimleri)
- M3 × 16 mm **cap-head** vida ×1 (nozül menteşe — somunsuz, kendinden kılavuz; düğme `06c` ile elle)
- Alev sensörü modülü (analog AO + dijital DO)
- Mini DC pompa + Ø8 silikon/PVC hortum + nozül ucu
- MOSFET (IRLZ44N) **veya** röle modülü, 1N4007 flyback diyot
- Ayrı 5V güç kaynağı (servo+pompa), Arduino UNO/Nano, jumper kablolar

## Montaj sırası
1. **Taban**: `02_alt_servo_tutucu`yu `01_taban_plakasi`ya M3 ile vidala.
2. Alt SG90'ı tutucuya yukarıdan geçir (flanş gömme cebe otursun), M2 ile sıkıştır.
3. SG90 plastik horn'unu `03_flame_sensor_tutucu`ya vidala, tutucuyu servo şaftına tak;
   alev sensörü kartını arka plakaya yaslayıp alttan/üstten klipse oturt, M2.5 vidayla sabitle
   (IR göz öne, header/kablo arkaya bakmalı). Kartın deliği farklıysa `FS` ölçülerini ayarla.
4. **Kule**: `04_kule_yukseltici`yi tabana vidala; üstüne `05_ust_servo_tutucu`yu bağla.
5. Üst SG90'ı tak; horn'a `06_nozul_taban`ı vidala. `06b_nozul_kol`u kulaklar arasına yerleştir;
   tek **M3 cap-head vida**yı +Y kulaktan geçirip −Y kulağa (kendinden kılavuz) tak — **somun yok**.
   `06c_ayar_dugmesi`ni vida başına geçir. Nozülü elle **eğip düğmeyi parmakla sık** → sürtünme tutar
   (anahtar gerekmez). Ø8 hortumu kola geçir.
6. Pompa → hortum → nozül; kablolama için bkz. `../DONANIM.md`.

## Arduino + röle kutusu (07)
`07_arduino_case` taban plakasının **altına** gelir, **Arduino UNO + 1-kanal röle**yi barındırır:
- 90×90 ayak izi (taban plakasıyla aynı), 28 mm yüksek; üstüne **taban plakası 4 köşeden M3** ile vidalanır.
- UNO **−Y** yarısında, **1-kanal röle +Y** şeridinde; her ikisinin montaj deliklerine denk **standoff'lar** (M3 kendinden kılavuz pilot).
- Bir duvarda **USB-B + güç jakı penceresi**; röle tarafındaki duvarda **terminal/kablo yuvası**; yan duvarda **havalandırma**.
- Servo/sensör/pompa kabloları taban plakasındaki deliklerden kutuya iner; röle pompayı (D7 → IN) sürer.
- Farklı kart/röle ölçüsü için `UNO` / `RELAY` sözlüklerini değiştirip yeniden üret.

## SG90 horn bağlantısı
`03_flame_sensor_tutucu` ve `06_nozul_kelepcesi`, SG90 ile gelen **2-kollu (düz) plastik horn'a**
göre tasarlandı: parçanın alt yüzünde horn'u içine kilitleyen **yuva** (hub + kol kanalı),
horn'un kol deliklerine denk **2 tespit vidası** ve **ortadan boydan boya delik** (Ø2.6 şaft +
üstte Ø5.5 tornavida erişimi) var. Tek merkez M2 vidasıyla horn+parça doğrudan spline'a kenetlenir;
istersen 2 yan vidayı da kullan. Horn ölçüsü farklıysa `HORN` parametrelerini ayarla.

> Alev sensörü kartı ölçüsü `FS = dict(pcb_l, pcb_w, pcb_t)` ile belirlenir (varsayılan **30×15×1.6 mm**).
> Kendi kartın farklıysa burayı değiştirip yeniden üret — tutucu kart boyuna göre kendini ayarlar.

## Kablo yönlendirme
- **Alt/üst servo**: kapalı gövde cebi; servo üstten oturur, flanş gömme cebine yaslanır,
  2 kulak vidasıyla sabitlenir. Kablo gövde cebinin **alt açıklığından** çıkar.
- **Üst servo**: kablo ortadan **kule içine** iner; kulenin yanları kapalıdır, kablo **alttan**
  (taban plakasındaki delikten) çıkar.
- **Sensör**: kart arkasındaki kablo, tutucunun arka kenarındaki **dikey çentikten** geçer;
  iki **zip-tie deliği** ile sabitlenir.

## Baskıda destek azaltma
- Kule üst flanşının altına **45° pah** eklendi → desteksiz basılır.
- Servo cepleri ve kablo kanalları dik duvarlı; tutucu ayakları tabla üstünde.
- Önerilen yön: tüm parçaları **taban/ayak yüzü tablaya** koy. `06_nozul_kelepcesi`
  halkası için hafif destek (yalnız tabandan) iyi olur.

> Not: SG90 ölçüleri markaya göre ±0.5 mm değişebilir. Yuva sıkı/gevşek olursa
> `parcalar_uret.py` içindeki `CLEAR` (tolerans) değerini ayarlayıp yeniden üret.
