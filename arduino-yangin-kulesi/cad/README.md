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
| `02_alt_servo_tutucu.stl`| ALT (tarama) SG90 — şaft yukarı, gövde cebi + flanş gömme + kulak vidaları | 1 |
| `03_sensor_platformu.stl`| Alt servo horn'una oturur; alev sensörü kartını dik tutan kızaklı kol | 1 |
| `04_kule_yukseltici.stl` | Üst servoyu kaldıran içi boş dikme (alt+üst flanşlı) | 1 |
| `05_ust_servo_tutucu.stl`| ÜST (nişan) SG90 — kule üstüne, şaft yukarı | 1 |
| `06_nozul_kelepcesi.stl` | Üst servo horn'una oturur; Ø8 su borusunu sıkan yarıklı kelepçe | 1 |

## Önerilen baskı ayarları
- Malzeme: **PLA** veya **PETG** (alev kaynağından uzak tut!)
- Katman: 0.2 mm · Duvar: 3 perimetre · Dolgu: %25–40
- Destek: genelde gerekmez; yalnız `06_nozul_kelepcesi` halkası için "yalnızca tabandan" destek iyi olur
- Yönlendirme: tüm tutucuları **ayak/taban yüzü tabla üstte** yatır (delikler temiz çıksın)

## Vida/donanım (BOM)
- SG90 servo ×2 (kendi plastik horn'u ve M2 vidalarıyla)
- M2 × 6–8 mm vida ×4 (servo kulaklarını tutuculara)
- M3 × 8–10 mm vida + somun ×~10 (taban, kule, tutucu birleşimleri)
- Alev sensörü modülü (analog AO + dijital DO)
- Mini DC pompa + Ø8 silikon/PVC hortum + nozül ucu
- MOSFET (IRLZ44N) **veya** röle modülü, 1N4007 flyback diyot
- Ayrı 5V güç kaynağı (servo+pompa), Arduino UNO/Nano, jumper kablolar

## Montaj sırası
1. **Taban**: `02_alt_servo_tutucu`yu `01_taban_plakasi`ya M3 ile vidala.
2. Alt SG90'ı tutucuya yukarıdan geçir (flanş gömme cebe otursun), M2 ile sıkıştır.
3. SG90 plastik horn'unu `03_sensor_platformu`na vidala, sonra platformu servo şaftına tak;
   alev sensörü kartını kızak kanalına geçir.
4. **Kule**: `04_kule_yukseltici`yi tabana vidala; üstüne `05_ust_servo_tutucu`yu bağla.
5. Üst SG90'ı tak; horn'a `06_nozul_kelepcesi`ni vidala, Ø8 hortumu kelepçeye geçir.
6. Pompa → hortum → nozül; kablolama için bkz. `../DONANIM.md`.

> Not: SG90 ölçüleri markaya göre ±0.5 mm değişebilir. Yuva sıkı/gevşek olursa
> `parcalar_uret.py` içindeki `CLEAR` (tolerans) değerini ayarlayıp yeniden üret.
