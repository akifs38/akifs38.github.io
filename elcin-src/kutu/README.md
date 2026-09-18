# Elçin'in gövdesi — 3D baskı

Masada duran bir dost için kutu. Proje kutusu değil: geriye yaslanır,
ağırlık merkezi tabanda durur, kablo görünmez, ön yüzde vida yoktur.

| Ölçü | Değer |
|---|---|
| Masadaki boyut | **63 G × 41 D × 56 Y mm** |
| Yaslanma | 18° geriye |
| Düz taban | 39 mm derinliğinde |
| Devrilme payı | arkaya 23 mm, öne 16 mm |
| Toplam malzeme | ~43 cm³ (≈ 53 g PLA) |

## Parçalar

| Dosya | Ne | Baskı |
|---|---|---|
| `stl/elcin_on_govde.stl` | Gövde: yüz penceresi, kart yuvaları, topuk | **yüz tablada** |
| `stl/elcin_arka_kapak.stl` | Arka kapak: havalandırma, USB çıkışı | düz |
| `stl/elcin_olcu_sablonu.stl` | Ölçü şablonu — önce bunu bas | düz |

Parçalar **baskıya hazır** dışa aktarılıyor; slicer'da döndürme.

## Önce ölçü şablonunu bas

Buradaki modül ölçüleri piyasada yaygın olanlara göre. Seninki farklı olabilir.

1. `elcin_olcu_sablonu.stl` bas (~5 dk, ~7 g).
2. OLED modülünü kulelere otur, vidala.
3. Cam pencereye ortalanıyor mu, kart dış hattı oluğa oturuyor mu bak.
4. Oturmuyorsa `elcin_kutu_uret.py` içindeki `OLED_*` değerlerini düzelt ve
   `python3 elcin_kutu_uret.py` ile yeniden üret.

Bunu atlamak, 4 saatlik gövde baskısını çöpe atmanın en kolay yolu.

## Baskı ayarları

| Ayar | Değer |
|---|---|
| Malzeme | PLA veya PETG |
| Katman | 0.2 mm |
| Dolgu | %20 (gövde), %40 (topuk bölgesi istersen) |
| Destek | **gerekmez** |
| Duvar | 3 çeper |

Gövde yüzü tablaya geldiği için pencere ilk katmanda bir delik olur, bütün iç
kuleler yukarı doğru büyür — hiçbir yerde köprüleme yok.

## Montaj

1. **OLED'in header'ını takma.** Kabloları doğrudan pedlere lehimle. Header
   8 mm derinlik yiyor ve ESP32'nin yerini işgal ediyor.
2. OLED'i dört M2 vidayla ön kulelere tuttur; cam pencereye ortalanmalı.
3. ESP32-C3'ü arkadaki oluğa yandan sür.
4. Dokunma sensörünü tepedeki yuvaya yerleştir, kablosunu kanaldan aşağı al.
   Sensörün üstünde 1.2 mm zar kalır — kapasitif algılama oradan geçer, delik
   açmaya gerek yok.
5. Kabloları alt boşlukta topla.
6. Arka kapağı 4× **M3 × 10 mm** vidayla tuttur (kuleler kendinden kılavuz).
7. İstersen alt boşluğa birkaç somun koy: Elçin masaya oturur, itince kaymaz.
8. Tabana 4 adet kaymaz ped yapıştır.

## Donanım

- 4× M3 × 10 mm (arka kapak)
- 4× M2 × 6 mm (OLED)
- Kaymaz ped

## Kendi modülüne göre ayarlama

`elcin_kutu_uret.py` başındaki değerler — hepsi mm:

| Değişken | Ne | Varsayılan |
|---|---|---|
| `OLED_PCB_W/H` | OLED kart boyutu | 35.5 × 33.5 |
| `OLED_GLASS_W/H` | görünen cam | 30.0 × 16.5 |
| `OLED_GLASS_DY` | kart merkezinden cam merkezine | 4.0 |
| `OLED_HOLE_DX/DY` | montaj delikleri arası | 30.5 × 28.5 |
| `ESP_L/W` | ESP32 kart boyutu | 52.5 × 20.3 |
| `LEAN` | yaslanma açısı | 18° |
| `WALL` | duvar kalınlığı | 2.6 |
| `CL` | tolerans (sıkı çıkarsa artır) | 0.4 |

## Önizleme

```bash
python3 onizle.py
python3 ../esp32/tools/to_png.py onizleme/*.pgm
```

`onizle.py` STL'leri yazılımdan rasterize eder (yalnızca numpy). Kutuyu
göremeden tasarlamak, OLED yüzünü göremeden çizmek gibi: sayılar tutuyor
olabilir ama nesnenin masada dost gibi durup durmadığını ancak bakarak
anlarsın. Bu betik geliştirme sırasında üç gerçek kusuru yakaladı — ters
yaslanma, keskin üst kenar ve masa kesiğine denk gelen vida kuleleri.

## Neden bu biçim

- **18° yaslanma:** masada oturan biri Elçin'e yukarıdan bakar. Dik duran bir
  yüz insanın göğsüne bakıyormuş gibi durur.
- **Arkadaki topuk:** yaslanma ağırlık merkezini arka kenara yaklaştırıyor;
  topuk devrilme payını açıyor. Düz bir fin olarak durmasın diye gövdeye
  yüksekten bağlanıp arkaya doğru inceliyor.
- **İki görünüşten yuvarlatma:** yalnızca önden yuvarlatınca üst kenar keskin
  90° kalıyordu ve nesne dost değil mezar taşı gibi duruyordu.
- **Ön yüzde vida yok:** Gülçin'in gördüğü yüzey temiz kalsın.
- **USB arkada, kesiğin hemen üstünde:** kablo topuğun üzerinden çıkar,
  masada görünmez ve Elçin duvara dayanabilir.
