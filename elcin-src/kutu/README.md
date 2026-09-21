# Elçin'in gövdesi — 3D baskı

Masada duran bir karakter: büyük kafa, tepede kulaklar, göbekli gövde, yanlarda
patiler. Kutu değil.

| Ölçü | Değer |
|---|---|
| Masadaki boyut | **86 G × 43 D × 95 Y mm** (kulaklar ve patiler dâhil) |
| Yaslanma | 10° geriye |
| Devrilme payı | arkaya 8.1 mm, öne 21.7 mm (+ pil ağırlığı) |
| Malzeme | ~55 cm³, **≈ 68 g** PLA (katı hacim; %20 dolguda çok daha az)<br>17 cm³'ü siyah |

## İçine girenler

Hepsi kumpasla ölçüldü.

| Parça | Ölçü (mm) | Nerede |
|---|---|---|
| **SSD1306 OLED modül** | **27 × 27 × 4.1** | Kafa, yüz penceresinin arkasında — **gövdede** |
| ↳ görünen cam | **27 × 16** | içindeki yanan piksel alanı 21.7 × 10.9 |
| ↳ montaj deliği aralığı | **23 × 23** *ya da* **24 × 24** | oval delik ikisini de kabul ediyor |
| **ESP32-C3 Super Mini** | **23 × 18**, en kalın yeri **5.0** | Kafa hizası, **arka kapakta** |
| **TTP223 dokunma** | **15 × 11 × 1.6** | Kafanın tepesi, duvarın içinde |
| **Li-Po pil** | **40 × 30 × 5** | Göbek, önde — ağırlık merkezi burada |
| **TP4056 Type-C** | **26.5 × 17 × 5** (soket 9.5 × 3.6) | Göbek, pilin arkasında |
| **Aç/kapa anahtarı** | delik **20 × 5** | Arka kapak, pilin üstünde |

Pil ayrı bir ağırlık cebini gereksiz kılıyor: göbekte ve alçakta durduğu için
Elçin'i masaya oturtan şey zaten o.

### İki modül neden kapakta

ESP32'yi ön kabuğa tutturmak mümkün değil. Rayların ön duvardan yükselmesi
gerekiyor, 27 × 27'lik OLED de tam o hizada duruyor — raylar modülün içinden
geçiyordu. Rayları OLED'in arkasından başlatmak da çözüm değil: baskıda havada
kalıyorlar.

Kapağın iç yüzünden yükselen raylar OLED'in derinlik bandına (z = 4.1–8.2 mm)
hiç girmiyor ve kapak düz basıldığı için hiçbir yerde destek gerekmiyor.

**Bedeli montajda:** kapağı açarken OLED kabloları kapakla birlikte geliyor.
Kabloları **6 cm bol** bırak.

## Parçalar

| Dosya | Adet | Filament | Baskı |
|---|---|---|---|
| `stl/elcin_govde.stl` | 1 | beyaz | **yüz tablada** |
| `stl/elcin_arka_kapak.stl` | 1 | beyaz | **dış yüz tablada, raylar yukarı** |
| `stl/elcin_kulak.stl` | **2** | siyah | düz taraf tablada |
| `stl/elcin_kol.stl` | **2** | siyah | düz taraf tablada |
| `stl/elcin_goz_yamasi.stl` | 1 | **siyah** | düz — görünen yüz tablada |
| `stl/elcin_olcu_sablonu.stl` | 1 | fark etmez | düz — **önce bunu bas** |

`stl/elcin_montaj.stl` ve `stl/elcin_montaj_kesit.stl` **basılmaz** — bakmak
için. Aşağıya bak.

Kulaklar, kollar ve göz yaması ayrı parça olduğu için **tek renkli yazıcıda da
iki renkli** çıkıyor: gövde beyaz, kulaklar, patiler ve göz yaması siyah.
Pandayı panda yapan şey bu.

### Göz yaması neden var

İlk çizimde yüz, 66 mm'lik kafada duran 24 × 16 mm'lik bir dikdörtgendi —
kafanın %6'sı. Önizlemeye gerçek OLED yüzünü yapıştırınca ortaya çıktı:
Elçin'in yüzü yok gibi duruyordu, ekran bir çıkartma gibiydi.

Ekranı büyütmek mümkün değil (modül 27 × 27) ve kafayı küçültmek de mümkün
değil (göbek, pili alabilmek için 32 mm yarıçapta olmak zorunda; kafa
göbekten küçük olunca karakter armuda dönüyor).

Çözüm pandanın kendi çözümü: pencerenin çevresine **47 × 24 mm'lik siyah göz
yaması**. Yüz alanı %6'dan %21'e çıkıyor. Yaması **pencereyi çevreliyor,
örtmüyor** — ekran birkaç mm kaysa bile hiçbir şey kırpılmıyor.

Maskenin açıklığı da dikdörtgen değil: **iki daire + ortada köprü.** Dikdörtgen
delik ekranı vizör gibi gösteriyordu; iki çukur onu göz yapıyor. Ölçüler yanan
alandan türetildi — gözler ±4 mm'de, kaşlar ±7 mm'de, ikisi de çukurun içinde;
köşeler zaten boş kalıyor.

Parçalar baskıya hazır yönde dışa aktarılıyor; slicer'da döndürme.

## Önce ölçü şablonunu bas

Şablon gövdedeki OLED bölgesinin birebir kopyası: aynı pencere, aynı kuleler,
aynı oval delikler, kartın oturduğu aynı oluk.

Kasten ince ve küçük tutuldu — **39 × 39 × 3.1 mm, 1.8 cm³, ≈ 2.3 g.**
0.2 mm katmanda birkaç dakika sürer, dolgu ve destek gerekmez.

1. `elcin_olcu_sablonu.stl` bas.
2. OLED modülünü kulelere otur, M2 vidaları sık.
3. Camın yanan kısmı pencereye tamamen giriyor mu, kart dış hattı oluğa
   oturuyor mu bak.
4. Oturmuyorsa `elcin_kutu_uret.py` içindeki `OLED_*` değerlerini düzelt,
   `python3 elcin_kutu_uret.py` ile yeniden üret.

Delik aralığının 23 mi 24 mm mi olduğunu bilmene gerek yok: kılavuz deliği
köşegen yönünde 1.2 mm oval açılıyor, ikisi de aynı kuleye oturuyor.

## Montajlı hâline bakmak

GitHub `.stl` dosyalarını tarayıcıda 3B gösteriyor; dosyaya tıklayıp
döndürebilirsin. `python3 montaj.py` iki dosya üretiyor:

| Dosya | Ne gösteriyor |
|---|---|
| `stl/elcin_montaj.stl` | Elçin'in kendisi — beş parça, masada duruyor |
| `stl/elcin_montaj_kesit.stl` | ortadan kesilmiş hâli: OLED, ESP32, pil, TP4056, dokunma sensörü, anahtar, hepsi yerinde |

Modüller temsilî çizim değil: yerleşimleri `dogrula.py` ile **aynı
ifadelerden** geliyor. Doğrulamanın ölçtüğü şeyle baktığın şey aynı, ikisi
ayrı düşemiyor.

## Baskı ayarları

| Ayar | Değer |
|---|---|
| Malzeme | PLA veya PETG |
| Katman | 0.2 mm |
| Dolgu | %20 |
| Destek | **gerekmez** |
| Duvar | 3 çeper |

Gövde yüzü tablaya geldiği için pencere ilk katmanda bir delik olur, bütün iç
kuleler yukarı doğru büyür. Kapak da ters basılır: dış (görünen) yüzü tablada,
ESP rayları yukarı. Vida havşası bu yönde tabandan içeri doğru daraldığı için
köprü gerektirmiyor.

## Montaj

**Gövdeye:**

1. **OLED'in header'ını takma.** Kabloları doğrudan pedlere lehimle. Header
   8 mm derinlik yiyor.
2. OLED'i dört M2 vidayla kafadaki kulelere tuttur.
3. Dokunma sensörünü tepedeki yuvaya yerleştir. Üstünde 1.2 mm zar kalır;
   kapasitif algılama oradan geçer, delik açmaya gerek yok.
4. **Göz yamasını** yüzdeki oyuğa bastır. Sıkı geliyorsa `CL` artır; gevşek
   geliyorsa bir damla yapıştırıcı — yüzde kalıcı duracak.
5. **Pili** göbekteki yuvaya kaydır. Yan kaburgalar ve dudaklar pili yerinde
   tutar; üst dudak iki yana kaçık bırakıldı, ortadan parmakla çıkarabilirsin.

**Kapağa:**

6. **ESP32-C3'ü** kapaktaki iki rayın oluğuna yandan sür. Bileşenli yüzü öne
   (gövdeye) baksın.
7. **TP4056'yı** göbek hizasındaki yuvaya otur; Type-C soketi kapaktaki
   açıklığa denk gelmeli.
8. **Anahtarı** kapaktaki 20 × 5 deliğe geçir.

**Birleştirme:**

9. Kabloları bağla — OLED ve pil gövdede, ESP ve TP4056 kapakta olduğu için
   aradaki kabloları **6 cm bol** bırak, yoksa kapak açılırken çekiyor.
10. Fazla kabloyu göbekteki boşlukta topla.
11. Kapağı 4× **M3 × 10 mm** vidayla tuttur.
12. Kulakları ve kolları yuvalarına bastır. Sıkı geliyorsa `CL` değerini
    artırıp yeniden üret; gevşek geliyorsa bir damla yapıştırıcı.
13. Tabana kaymaz ped.

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
- Kaymaz ped

## Kendi modülüne göre

`elcin_kutu_uret.py` başındaki değerler — hepsi mm:

| Değişken | Ne | Değer |
|---|---|---|
| `OLED_PCB_W/H/T` | OLED kart boyutu | 27 × 27 × 4.1 |
| `OLED_GLASS_W/H` | görünen cam | 27 × 16 |
| `OLED_PIXEL_W/H` | camın içindeki yanan alan | 21.7 × 10.9 |
| `OLED_HOLE_DX/DY` | montaj delikleri arası | 23 × 23 |
| `OLED_HOLE_SLOT` | deliğin köşegen ovalliği | 1.2 (24 × 24'ü de tutar) |
| `WINDOW_W/H` | yüz penceresi | 24 × 16 |
| `MASK_A/B`, `MASK_X` | göz yaması elipsi ve kayması | 14 × 12, ±10 |
| `MASK_TILT` | yamanın dışa yatması | 16° |
| `HOLE_R`, `HOLE_X` | göz çukuru yarıçapı ve kayması | 7.0, ±4.7 |
| `ESP_L/W` | ESP32 kart boyutu | 23 × 18 |
| `ESP_T` + `ESP_COMP_H` | kart + üstündeki bileşenler | 1.2 + 3.8 = 5.0 |
| `HEAD_R` / `BELLY_R` | kafa / göbek yarıçapı | 33 / 32 |
| `EAR_R` / `EAR_X` | kulak boyu / açıklığı | 13 / 20 |
| `BAT_W/H/T` | pil ölçüsü | 40 × 30 × 5 |
| `BAT_CL` | pil payı (şişmeye karşı bol) | 1.0 |
| `TP_W/H/T` | TP4056 ölçüsü | 26.5 × 17 × 5 |
| `SW_W/H` | anahtar deliği | 20 × 5 |
| `LEAN` | yaslanma açısı | 10° |
| `CL` | tolerans (geçmeler sıkıysa artır) | 0.4 |

**Göbek yarıçapını pil belirliyor:** 40 × 30'luk hücrenin köşesi kürenin ön
düzlemine yakın kesitinde 29.6 mm'ye düşüyor; duvarla birlikte 32 mm'nin altına
inince pil dışarı taşıyor. **Kafa yarıçapını ise siluet belirliyor:** 27 × 27
OLED için 24.4 mm yeterdi, ama kafa göbekten küçük olunca karakter armuda
dönüyor. 33 mm, pandayı panda tutan en küçük değer.

## Önizleme ve doğrulama

```bash
python3 elcin_kutu_uret.py                          # basılan parçalar
python3 montaj.py                                   # montajlı ve kesit STL
python3 dogrula.py                                  # sayısal denetim
python3 onizle.py                                   # görünüşleri çıkar
python3 ../esp32/tools/to_png.py onizleme/*.pgm
```

`onizle.py` STL'leri yazılımdan rasterize eder (yalnızca numpy). Kutuyu
göremeden tasarlamak, OLED yüzünü göremeden çizmek gibi.

Önizleme iki şeyi ayrıca yapıyor, ikisi de tasarım kararı değiştirdi:

- **Gerçek OLED yüzünü pencereye yapıştırıyor.** Pencere bir delik olduğu için
  render arkasındaki havalandırma yarıklarını gösteriyordu ve Elçin yüzsüz
  duruyordu. Yüz firmware'in kendi çiziciyle üretiliyor
  (`esp32/test && make render` → `out/yuz.pgm`), uydurulmuyor.
- **Siyah parçaları siyah gösteriyor.** Hepsini beyaz göstermek Elçin'in iki
  renkli olduğunu gizliyordu.

`dogrula.py` üç şeyi ölçer: her modül kabuğun içinde mi, **modüller birbirine
giriyor mu**, Elçin devrilir mi ve STL'ler kapalı mı.

Ortadaki madde sonradan eklendi ve gerekliydi: modülleri tek tek kabuğa karşı
denetlemek yanıltıyor. OLED ile pil ayrı ayrı kabuğa rahat sığıyordu ama aynı
derinlik bandında üst üste biniyorlardı — ikisi de "boşlukta" olduğu için
kabuk testi bunu göremez.

Tasarım sırasında bakarak ve ölçerek yakalanan gerçek kusurlar:

- gövde **öne** yaslanıyordu (önizlemedeki yatırma işareti tersti)
- render tamamen karanlıktı: eksen takası aslında bir yansıma (determinant −1),
  üçgen sarımını ters çevirip normalleri içeri döndürüyordu
- alt vida kuleleri masa kesiğine denk geliyor, kılavuz delikleri tabanda
  açığa çıkıyordu; kapak da kesilmiş alt kenardan taşıyordu
- 18° yaslanmada hacim merkezi taban arka kenarına **0.9 mm** kalıyordu —
  masaya hafif bir dokunuş Elçin'i deviriyordu
- Boole işlemleri kıymık üçgen bırakıyordu; katı sağlamdı ama bazı
  dilimleyiciler "kapalı değil" diye uyarıyordu. Yalnızca alana bakıp atmak
  yetmedi: önce köşeleri 1 µm ızgarasında kaynaklamak gerekti
- ESP32'nin ön kabuktaki rayları **OLED modülünün içinden** geçiyordu
- alt kapak vida kuleleri **pilin içinden** geçiyordu (205 mm³)
- pil tutucunun üst dudağı OLED'in alt kenarına giriyordu
- **OLED ile pil birbirine giriyordu** — ikisi de kabuğa sığdığı hâlde
- yüz, kafaya göre çok küçüktü ve "yüzü yok" gibi duruyordu — ancak gerçek
  OLED görüntüsü pencereye yapıştırılınca görüldü

## Neden bu biçim

- **Chibi oranı (büyük kafa, küçük gövde):** karakteri animasyon figürüne
  yaklaştırıyor.
- **Küre birleşimi, hull değil:** hull ikisini tek bir armuda dönüştürüp kafayı
  yutuyordu. Birleşim boyun girintisini koruyor — karakteri karakter yapan şey.
- **Kulak ve kollar ayrı parça:** tek renkli yazıcıda iki renk.
- **Ayaklar gövdeye dahil:** yükü taşıdıkları için geçme parçaya bırakılmadı.
- **Göz yaması ayrı ve siyah:** yüz alanını üçe katlıyor ve tek renkli
  yazıcıda ikinci rengi veriyor. Pencereyi çevreliyor, örtmüyor — ekranın
  yeri kaysa bile yüz kırpılmıyor.
- **Pencere camdan dar (24 mm):** cam modülün tam genişliğinde (27 mm) olduğu
  için camı birebir açmak kartın kenarını da açmak demekti.
- **Pilin arkasına havalandırma deliği açılmadı:** Li-Po hücresi toza ve
  delici cisme açık kalmamalı. Yarıklar kafanın arkasında, ESP32 hizasında.
- **Anahtar arkada:** Gülçin'in gördüğü yüzde anahtar olmasın.
- **10° yaslanma:** "yukarı bakıyor" hissi ile devrilmeme arasındaki denge;
  ölçümle seçildi.
- **Ön yüzde vida yok:** Gülçin'in gördüğü yüzey temiz kalsın.
