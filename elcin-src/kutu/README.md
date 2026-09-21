# Elçin'in gövdesi — 3D baskı

Masada duran bir karakter: büyük kafa, tepede kulaklar, küçük gövde, yanlarda
patiler. Kutu değil.

| Ölçü | Değer |
|---|---|
| Masadaki boyut | **86 G × 44 D × 98 Y mm** |
| Yaslanma | 10° geriye |
| Devrilme payı | arkaya 7 mm, öne 22 mm (+ pil ağırlığı) |
| Malzeme | ~58 cm³, **≈ 72 g** PLA |

## İçine girenler

| Parça | Ölçü (mm) | Nerede |
|---|---|---|
| SSD1306 OLED | 35.5 × 33.5 | Kafa, yüz penceresinin arkasında |
| ESP32-C3 | 52.5 × 20.3 | Kafa, OLED'in arkasında |
| TTP223 dokunma | 15 × 11 | Kafanın tepesi, duvarın içinde |
| **Li-Po pil** | **40 × 30 × 5** | Göbek, önde — ağırlık merkezi burada |
| **TP4056 Type-C** | 26.5 × 17 × 5 | Göbek, pilin arkasında |
| **Aç/kapa anahtarı** | delik **20 × 5** | Arka kapak, pilin üstünde |

Hepsinin kabuğa sığdığı sayısal olarak doğrulanıyor (`elcin_kutu_uret.py`
çalıştırıldığında pay değerleri yazılır). En dar yer ESP32 bileşenlerinin
üstü: **+1.0 mm**.

Pil ayrı bir ağırlık cebini gereksiz kılıyor: göbekte ve alçakta durduğu için
Elçin'i masaya oturtan şey zaten o.

## Parçalar

| Dosya | Adet | Filament | Baskı |
|---|---|---|---|
| `stl/elcin_govde.stl` | 1 | beyaz | **yüz tablada** |
| `stl/elcin_arka_kapak.stl` | 1 | beyaz | düz |
| `stl/elcin_kulak.stl` | **2** | siyah | düz taraf tablada |
| `stl/elcin_kol.stl` | **2** | siyah | düz taraf tablada |
| `stl/elcin_olcu_sablonu.stl` | 1 | fark etmez | düz — **önce bunu bas** |

Kulaklar ve kollar ayrı parça olduğu için **tek renkli yazıcıda da iki renkli**
çıkıyor: gövde beyaz, kulaklar ve patiler siyah. Pandayı panda yapan şey bu.

Parçalar baskıya hazır dışa aktarılıyor; slicer'da döndürme.

## Önce ölçü şablonunu bas

Buradaki modül ölçüleri piyasada yaygın olanlara göre; seninki farklı olabilir.

1. `elcin_olcu_sablonu.stl` bas (~5 dk, ~8 g).
2. OLED modülünü kulelere otur, vidala.
3. Cam pencereye ortalanıyor mu, kart dış hattı oluğa oturuyor mu bak.
4. Oturmuyorsa `elcin_kutu_uret.py` içindeki `OLED_*` değerlerini düzelt ve
   `python3 elcin_kutu_uret.py` ile yeniden üret.

## Baskı ayarları

| Ayar | Değer |
|---|---|
| Malzeme | PLA veya PETG |
| Katman | 0.2 mm |
| Dolgu | %20 |
| Destek | **gerekmez** |
| Duvar | 3 çeper |

Gövde yüzü tablaya geldiği için pencere ilk katmanda bir delik olur, bütün iç
kuleler yukarı doğru büyür. Kafa–gövde arasındaki boyun girintisi de sorun
çıkarmıyor: siluetteki her şey tablaya paralel düzlemde kalıyor.

## Montaj

1. **OLED'in header'ını takma.** Kabloları doğrudan pedlere lehimle. Header
   8 mm derinlik yiyor ve ESP32'nin yerini işgal ediyor.
2. OLED'i dört M2 vidayla kafadaki kulelere tuttur.
3. ESP32-C3'ü OLED'in arkasındaki oluğa yandan sür.
4. Dokunma sensörünü tepedeki yuvaya yerleştir. Üstünde 1.2 mm zar kalır;
   kapasitif algılama oradan geçer, delik açmaya gerek yok.
5. **TP4056'yı** göbekteki arka yuvaya otur; Type-C soketi kapaktaki
   açıklığa denk gelmeli.
6. **Anahtarı** arka kapaktaki 20 × 5 deliğe geçir.
7. **Pili** öndeki yuvaya kaydır. Tutucular pili yerinde tutar; alt ve üst
   dudaklar ortadan açık bırakıldı ki parmakla çıkarabilesin.
8. Kabloları göbekteki boşlukta topla.
9. Arka kapağı 4× **M3 × 10 mm** vidayla tuttur.
10. Kulakları ve kolları yuvalarına bastır. Sıkı geliyorsa `CL` değerini
    artırıp yeniden üret; gevşek geliyorsa bir damla yapıştırıcı.
11. Tabana kaymaz ped.

### Kablolama

```
Pil  ──► TP4056 (B+ / B−)
TP4056 (OUT+) ──► anahtar ──► ESP32 5V
TP4056 (OUT−) ──────────────► ESP32 GND

OLED    SDA → GPIO20   SCL → GPIO21   VCC → 3V3   GND → GND
TTP223  SIG → GPIO1    VCC → 3V3      GND → GND
```

> **Anahtar TP4056'nın çıkışına konur, pilin ucuna değil.** Pil ucuna koyarsan
> anahtar kapalıyken şarj da kesilir.

## Donanım

- 4× M3 × 10 mm (arka kapak)
- 4× M2 × 6 mm (OLED)
- Birkaç somun (ağırlık) · kaymaz ped

## Kendi modülüne göre

`elcin_kutu_uret.py` başındaki değerler — hepsi mm:

| Değişken | Ne | Varsayılan |
|---|---|---|
| `OLED_PCB_W/H` | OLED kart boyutu | 35.5 × 33.5 |
| `OLED_GLASS_W/H` | görünen cam | 30.0 × 16.5 |
| `OLED_HOLE_DX/DY` | montaj delikleri arası | 30.5 × 28.5 |
| `ESP_L/W` | ESP32 kart boyutu | 52.5 × 20.3 |
| `HEAD_R` / `BELLY_R` | kafa / gövde yarıçapı | 34 / 24 |
| `EAR_R` / `EAR_X` | kulak boyu / açıklığı | 13 / 21 |
| `BAT_W/H/T` | pil ölçüsü | 40 × 30 × 5 |
| `BAT_CL` | pil payı (şişmeye karşı bol) | 1.0 |
| `TP_W/H/T` | TP4056 ölçüsü | 26.5 × 17 × 5 |
| `SW_W/H` | anahtar deliği | 20 × 5 |
| `LEAN` | yaslanma açısı | 10° |
| `CL` | tolerans (geçmeler sıkıysa artır) | 0.4 |

**Kafa yarıçapı keyfi değil:** 52.5 mm'lik ESP32 DevKitM-1 ve 35.5 mm'lik OLED,
kürenin ön düzlemindeki dar kesitine sığmak zorunda. 27 mm'de OLED köşeleri
kabuktan 3.9 mm, 31 mm'de ESP32 köşeleri 5.5 mm taşıyordu. **ESP32-C3 Super
Mini** (22.5 × 18 mm) kullanırsan kafa belirgin biçimde küçülebilir.

## Önizleme ve doğrulama

```bash
python3 elcin_kutu_uret.py                          # STL üret
python3 onizle.py                                   # görünüşleri çıkar
python3 ../esp32/tools/to_png.py onizleme/*.pgm
```

`onizle.py` STL'leri yazılımdan rasterize eder (yalnızca numpy). Kutuyu
göremeden tasarlamak, OLED yüzünü göremeden çizmek gibi.

Tasarım sırasında bakarak ve ölçerek yakalanan gerçek kusurlar:

- gövde **öne** yaslanıyordu (önizlemedeki yatırma işareti tersti)
- render tamamen karanlıktı: eksen takası aslında bir yansıma (determinant −1),
  üçgen sarımını ters çevirip normalleri içeri döndürüyordu
- alt vida kuleleri masa kesiğine denk geliyor, kılavuz delikleri tabanda
  açığa çıkıyordu; kapak da kesilmiş alt kenardan taşıyordu
- 18° yaslanmada hacim merkezi taban arka kenarına **0.9 mm** kalıyordu —
  masaya hafif bir dokunuş Elçin'i deviriyordu
- Boole işlemleri 16 sıfır alanlı üçgen bırakıyordu; katı sağlamdı ama bazı
  dilimleyiciler "kapalı değil" diye uyarıyordu

## Neden bu biçim

- **Chibi oranı (büyük kafa, küçük gövde):** hem karakteri animasyon figürüne
  yaklaştırıyor hem de OLED ile ESP32'nin sığabileceği tek yerleşim bu.
- **Küre birleşimi, hull değil:** hull ikisini tek bir armuda dönüştürüp kafayı
  yutuyordu. Birleşim boyun girintisini koruyor — karakteri karakter yapan şey.
- **Kulak ve kollar ayrı parça:** tek renkli yazıcıda iki renk.
- **Ayaklar gövdeye dahil:** yükü taşıdıkları için geçme parçaya bırakılmadı.
- **Pilin arkasına havalandırma deliği açılmadı:** Li-Po hücresi toza ve
  delici cisme açık kalmamalı. Yarıklar kafanın arkasında, ESP32 hizasında.
- **Anahtar arkada:** Gülçin'in gördüğü yüzde anahtar olmasın.
- **10° yaslanma:** "yukarı bakıyor" hissi ile devrilmeme arasındaki denge;
  ölçümle seçildi.
- **Ön yüzde vida yok:** Gülçin'in gördüğü yüzey temiz kalsın.
