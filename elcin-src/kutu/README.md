# Elçin'in gövdesi — 3D baskı

Masada duran bir karakter: büyük kafa, tepede kulaklar, göbekli gövde, yanlarda
patiler. Kutu değil.

| Ölçü | Değer |
|---|---|
| Masadaki boyut | **86 G × 46 D × 95 Y mm** (kulaklar ve patiler dâhil) |
| Yaslanma | 10° geriye |
| Devrilme payı | arkaya 9.3 mm, öne 22.9 mm (+ pil ağırlığı) |
| Malzeme | ~58 cm³, **≈ 72 g** PLA (katı hacim; %20 dolguda çok daha az)<br>17 cm³'ü siyah |

## İçine girenler

Hepsi kumpasla ölçüldü.

| Parça | Ölçü (mm) | Nerede |
|---|---|---|
| **SSD1306 OLED modül** | **27 × 27 × 4.1** | Kafa, yüz penceresinin arkasında — **gövdede** |
| ↳ cam paneli | **26.7 × 19.3 × 1.5** | görüntü camın **üst 15 mm'sinde**; alt şerit sürücü |
| ↳ montaj deliği aralığı | **23.5 × 23.5** (23.1–23.9 arası tutar) | çapraz: 2 pim + 2 vida |
| **ESP32-C3 Super Mini** | **22.5 × 18**, kart 1.2, USB soketi 3.3 | Kafa hizası, **arka kapakta**, bileşen yüzü kapağa bakar |
| **TTP223 dokunma** | **14.7 × 11.1 × 1.0** (+0.9 bileşen) | Kafanın tepesi, iç yüzeye oyulmuş cepte, duvara değer |
| **Li-Po pil** | **40 × 30 × 5** | Göbek, önde — ağırlık merkezi burada |
| **TP4056 Type-C** | **26.5 × 17 × 5** (soket 9.5 × 3.6) | Göbeğin altında, **tabana paralel** |
| **Aç/kapa anahtarı** | delik **20 × 5** | Arka kapak, ESP32 yuvasının 4.6 mm altında |
| **Şarj portu** | USB-C biçiminde **9.9 × 3.8**, çevresinde kılıf cebi | Arkada en altta, **masaya paralel** |

Pil ayrı bir ağırlık cebini gereksiz kılıyor: göbekte ve alçakta durduğu için
Elçin'i masaya oturtan şey zaten o.

### Şarj portu

Type-C soketi kartın **kenarında** ve kart düzlemine **paralel** bakıyor —
telefonun şarj soketi gibi. Kart kapağa paralel dururken soketi kapağa asla
bakmaz; kartın 26.5 mm'lik uzun ekseni derinliğe dönmek zorunda.

**Kart tabana paralel yatıyor, soketi masaya paralel dümdüz arkaya bakıyor.**
Kablo masa hizasında itilip takılıyor. Arkadan bakınca görünen tek açıklık
soketin kendi biçiminde (stadyum), **9.9 × 3.8 mm**.

Buna varmadan önce iki seçenek ölçüldü:

| | Sonuç |
|---|---|
| Kapağa dik port | ✗ Elçin 10° geriye yaslı, taban arkaya doğru yükseliyor: kart pilin altına sığmıyor, kablo 10° aşağı inip fişi masaya değdiriyor. Pili ve yüzü 5–6 mm yukarı itmek gerekirdi. |
| **Masaya paralel port** | ✓ Kart tabana paralel, pilin altında 3.7 mm pay, fiş masadan 2.5 mm yukarıda. Bedeli: gövde **2.5 mm derinleşti** (26.5 × cos 10° = 26.1 mm). |

Arka yüzey 10° yatık olduğu için portun çevresine **fişe dik bir cep**
oyuluyor. Boyu USB-C standardının fiş kılıfına tanıdığı en büyük ölçüden
(12.35 × 6.5) biraz geniş — standarda uyan her kablo sonuna kadar giriyor.
Cep üstte derin, altta sığ; bu yüzden kapağın içinde portun üstünde bir
takviye yastığı var. Yastık olmadan cebin üst kenarında **0.47 mm** et
kalıyordu; kablo her gün takılıp çıkarılırken kırılacak yer. Şimdi:

| Yer | Kalan et |
|---|---|
| üst kenar | 2.17 mm |
| yan kenar | 1.11 mm |
| alt kenar | 0.51 mm — kartın kenarına dayalı zar |

Alt kenardaki zar geometrinin sonucu: soket kart kenarından yalnızca ~0.6 mm
taşıyor, fiş kılıfı ise soketin altına, kart hizasına kadar iniyor. Zar kartın
kenarına dayandığı için takılırken gelen kuvveti kart taşıyor.

Kart, kenarı kapağın içindeki sığ bir cebe oturarak konumlanıyor; raylardaki
ön dayanak da kablo takılırken kartın içeri kaymasını engelliyor.

**İlk önce `elcin_port_sablonu.stl`'i bas** (1.2 cm³, birkaç dakika): kendi
TP4056'nın kenarı cebe oturuyor mu, soketi deliğe giriyor mu, kendi kablon
sonuna kadar takılıyor mu — gövdeyi basmadan görürsün.

### İki modül neden kapakta

ESP32'yi ön kabuğa tutturmak mümkün değil. Tutucuların ön duvardan yükselmesi
gerekiyor, 27 × 27'lik OLED de tam o hizada duruyor. Tutucular modülün içinden
geçiyordu. Onları OLED'in arkasından başlatmak da çözüm değil: baskıda havada
kalıyorlar.

Kapağın iç yüzünden yükselen yuva OLED'in derinlik bandına hiç girmiyor, kapak
düz basıldığı için de hiçbir yerde destek gerekmiyor.

### ESP32 yuvası

Kartta montaj deliği yok. Uzun kenarlarında pinler ve teller var, oraya hiçbir
şey değmemeli. **Eski yuvanın ciddi bir hatası vardı:** kartı uzun kenarlarından
iki rayla tutması gerekiyordu, ama oluk rayın dışına açılmıştı. Kart iki düz
duvarın arasında her yana 1.9 mm boşlukla serbest duruyordu. Çakışma testi bunu
göremiyordu, çünkü çakışma yoktu; tutan da yoktu.

Yeni yuvada kart **ters** duruyor, **bileşen yüzü kapağa bakıyor**. Bileşen
yüzünde tutunacak yer yok: bir uçta USB soketi ve iki yanında BOOT/RST
düğmeleri, öbür uçta anten. Arka yüz ise tamamen düz.

- **Üç noktaya oturuyor:** USB ucunda soketin metal sırtı bir takoza, anten
  ucunda kartın iki köşesi iki ayağa.
- **Dört esnek tırnak** (iki uçta ikişer) düz arka yüze biniyor ve kartı bu
  üç noktaya bastırıyor. Kollar kapağın içine gömülü başlıyor. 7.6 mm boyla
  açılırken PLA %1.6 geriliyor, yorulmuyor.
- **Uzun kenarların uçlarında yanaklar** kartı yanlara karşı tutuyor. Pinlerin
  olduğu orta kısma hiçbir şey değmiyor.
- **Takmak ve çıkarmak:** kartı kapağa dik bastırınca tırnaklar açılıp kapanır.
  Çıkarmak için anten ucundaki iki tırnağı dışa itip kartı kaldır.
- **USB kablosu kart yerindeyken takılıyor:** kapak sökülüp yere konunca
  soketin ağzı açık. USB ucundaki tırnaklar fiş kılıfının (12.35 mm) dışında.
- **Teller** arka yüzden lehimlenip doğrudan öne, OLED'e ve sensöre gidiyor.

`dogrula.py` kartı altı yöne 0.3 mm itip her birinde bir yere çarptığını
denetliyor. Eski yuva altı yönün altısında da serbestti.

Kart ters durunca güç LED'i kapağa bakıyor. Havalandırma yarıklarından
arkaya hafif bir ışık sızabilir.

### Dokunma sensörü

TTP223 kapasitif: dokunma yüzü duvara **değmeli**, arada hava kalınca
algılamıyor. Eski yuva düz kartı kafa kubbesinin altına koyuyordu. Kart kubbeye
tek noktada değiyordu, kenarlarında 1.5 mm'ye varan hava kalıyordu.

Artık kafanın iç yüzüne, tepede, **düz tabanlı bir cep** oyuluyor. Cep
masaya paralel, yani dokunulan yerin tam altında.

- **Duvar kalınlığı:** ortada 2.6 mm (hiç oyulmuyor), köşelerde 1.07 mm'ye
  iniyor. Kartın %93'ü duvara değiyor; kalan %7 lehim çukurları.
- **Neden ray (kızak) değil:** düz bir kart küresel bir duvara değerek
  kayamaz. Kaydığı yol duvarın içinden geçer ve 10 mm sonra kafanın dışına
  çıkar.
- **Nasıl tutuluyor:** kart cebe aşağıdan bastırılıyor. Cebin kısa
  kenarlarında ve ön kenarında **ezilen kaburgalar** var: kart sıkı geçiyor ve
  bastırıldığı yerde, duvara değerek kalıyor.
- **Pinli kenar:** tabanda üç sığ çukur var. Tel delikten geçirilip dokunma
  yüzünde lehimlenirse lehim tümseği kartı duvardan ayırmasın diye. En iyisi
  telleri **bileşen tarafından** lehimlemek; dokunma yüzü tamamen düz kalır.
- **Çıkarmak:** pinsiz kısa kenarda bir kanırtma çentiği var.

**Bedeli montajda:** kapağı açarken OLED kabloları kapakla birlikte geliyor.
Kabloları **6 cm bol** bırak.

## Parçalar

| Dosya | Adet | Filament | Baskı |
|---|---|---|---|
| `stl/elcin_govde.stl` | 1 | beyaz | **yüz tablada** |
| `stl/elcin_arka_kapak.stl` | 1 | beyaz | **dış yüz tablada, ESP tırnakları yukarı** |
| `stl/elcin_kulak.stl` | **2** | siyah | düz taraf tablada |
| `stl/elcin_kol.stl` | **2** | siyah | düz taraf tablada |
| `stl/elcin_goz_yamasi.stl` | 1 | **siyah** | düz — görünen yüz tablada |
| `stl/elcin_ekran_sablonu.stl` | 1 | fark etmez | ön yüz tablada, pimler yukarı — **önce bunu bas** |
| `stl/elcin_port_sablonu.stl` | 1 | fark etmez | dış yüz tablada — **bunu da önce bas** |
| `stl/elcin_esp32_sablonu.stl` | 1 | fark etmez | dış yüz tablada, tırnaklar yukarı — ESP32 yuvası |
| `stl/elcin_anahtar_sablonu.stl` | 1 | fark etmez | düz — anahtar deliği, kapakla aynı kalınlıkta |
| `stl/elcin_dokunma_sablonu.stl` | 1 | fark etmez | yüz tablada (gövde gibi) — kafa tepesi ve sensör cebi |

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

**Yama yüzün üstüne yapışıyor, yüzde oyuk yok.** İlk sürümde 1 mm'lik bir
oyuğa oturuyordu; ama gövde yüz tablada basıldığı için o oyuğun tavanı
**599 mm²'lik desteksiz** bir yüzeydi — yan loblarda 12 mm konsol, iç kenarı
da boş pencere. Sarkan tavan oyuğu sığlaştırıp yamayı eğri oturturdu. Şimdi
yüz tamamen düz basılıyor; yamayı ortalayan şey arkasındaki **dört köşe
tırnağı** — pencerenin köşelerine giriyorlar.

Parçalar baskıya hazır yönde dışa aktarılıyor; slicer'da döndürme.

## Önce ekran şablonunu bas

Şablon, gövdedeki OLED bölgesinin kopyası. Duvar kalınlığı, pencere, pimler,
dayanaklar ve vida kılavuzları gövdedekilerle aynı. Hepsi aynı fonksiyondan
(`oled_baglanti()`) geliyor, yani şablon tutarsa gövde de tutar.

**39 × 39 × 6 mm, 3.1 cm³.** Gövde gibi basılır: ön yüz tablada, pimler
yukarı. Dolgu ve destek gerekmez.

1. `elcin_ekran_sablonu.stl` bas.
2. OLED'i camı şablona bakacak, header tarafı üstte kalacak şekilde koy.
   Arkadan bakınca **sol üst ve sağ alt** delik pimlere geçer.
3. Öbür köşegendeki iki deliğe, yani **sağ üst ve sol alt** deliğe, **M2 × 4**
   kendinden kılavuzlu vida tak. Vidalar ön yüzü delmez, 1.3 mm et kalır.
4. Şunlara bak:
   - Cama hiçbir şey değmemeli. Dayanaklar camın 0.5 mm dışında kesiliyor.
     Cam, duvara 0.4 mm kala duruyor.
   - Kart dört dayanağa da düz basmalı.
   - Yanan piksel alanı pencerede ortada ve tamamen açıkta olmalı.
5. Oturmuyorsa `elcin_kutu_uret.py` içindeki `OLED_*` değerlerini düzelt,
   `python3 elcin_kutu_uret.py` ile yeniden üret.

**Neden 4 vida değil, çapraz 2 pim + 2 vida?** Pimler modülü yerine
oturtuyor, vidalar kartı dayanaklara bastırıyor. Çapraz olmaları şart: ilk
sürümde iki vida da alttaydı. Pim kartı sıkmadığı için üst kenarı hiçbir şey
tutmuyordu, kart pimlerden kalkabiliyordu. Çapraz vidalar kartı iki
köşesinden bastırıyor, pimler de öbür köşegende kaymayı ve dönmeyi kesiyor.

Sol üst pim yuvarlak, modülün yerini o belirliyor. Sağ alt pim köşegen
boyunca inceltilmiş (elmas pim). Böylece delik aralığı birkaç onda bir
şaşsa da giriyor (kare düzende 23.1–23.9 mm). İki yuvarlak pim olsaydı aralık
0.1 mm şaşınca modül oturmazdı. Vida kılavuzları da hatanın geleceği yönde
0.8 mm oval: vida kartın deliğini izliyor.

**Eski şablonda ne yanlıştı:** Ø6 kuleler camın köşelerine basıyordu. Modelde
cam 27 × 16 varsayılmıştı, gerçek 0.96" panel 26.7 × 19.3. Doğrulama da bunu
göremedi: çakışma testi iç içe geçmeyi yakalıyordu, modeldeki cam da
gerçeğinden kısaydı. Artık `dogrula.py` cam ile gövde arasındaki en yakın
mesafeyi ölçüyor.

## ESP32, anahtar ve dokunma şablonları

Her biri gerçek parçanın o bölgesinin kopyası, aynı kalınlıkta ve aynı baskı
yönünde. Hepsi birkaç dakikalık baskı.

**`elcin_esp32_sablonu.stl`** (32.5 × 25 × 10.3 mm): kapağın ESP32 yuvası.

1. Kartı bileşen yüzü şablona bakacak, USB soketi takozun üstüne gelecek
   şekilde dik bastır. Dört tırnak kapanmalı.
2. Kart hiçbir yöne oynamamalı. Anten ucundaki iki köşe ayağa ve soket takoza
   basmalı.
3. Köşe ayağı bir bileşene basıyorsa `ESP_KOSE`'yi küçült. Kart oynuyorsa ya
   da tırnaklar kapanmıyorsa kartın kalınlığını (`ESP_T`) ve soketin
   yüksekliğini (`ESP_USB_H`) ölç.
4. Kart yerindeyken USB kablosunu tak.

**`elcin_anahtar_sablonu.stl`** (32 × 15 × 2.6 mm): kapağın anahtar deliği,
kapakla aynı kalınlıkta. Geçmeli anahtarların klipsleri belli bir panel
kalınlığına göre yapılıyor. Anahtar burada kilitleniyorsa kapakta da kilitlenir.

**`elcin_dokunma_sablonu.stl`** (26 × 15 × 21 mm): kafanın tepesi, sensör
cebiyle birlikte. Gövde gibi, yüz tablada basılır.

1. TTP223'ü dokunma yüzü cebe bakacak şekilde bastır. Sıkı geçmeli ve düz
   oturmalı.
2. Kartı bağla (3V3, GND, SIG → GPIO1) ve parçanın **dışından** tepesine
   dokun. Sensörün LED'i yanmalı. Bu, duvar kalınlığının algılamaya uygun
   olduğunu gerçek malzemede gösteriyor.

## Montajlı hâline bakmak

İki yol var.

**1. Renkli görüntüleyici — [akifs38.github.io/elcin/govde](https://akifs38.github.io/elcin/govde)**

Elçin'in kendi sitesinde. Her parça kendi rengiyle: beyaz gövde, siyah
kulak/pati/göz yaması, mavi OLED, gümüş pil, yeşil dokunma sensörü. Yüzde
firmware'in gerçekten çizdiği görüntü duruyor — uydurma bir resim değil,
`esp32/test && make render` çıktısı.

- **Kabuğu şeffaflaştır** — içindeki her şey görünür
- **Kapağı aç** — kapak ESP32 ve anahtarla birlikte geriye kayar
- Listeden tek tek parça gizle/göster

**2. GitHub'ın kendi STL görüntüleyicisi**

Dosyaya tıklayıp döndürebilirsin; tek renk gösterir, siyah/beyaz ayrımı
kaybolur.

| Dosya | Ne gösteriyor |
|---|---|
| `stl/elcin_montaj.stl` | Elçin'in kendisi — beş parça, masada duruyor |
| `stl/elcin_montaj_kesit.stl` | ortadan kesilmiş hâli: OLED, ESP32, pil, TP4056, dokunma sensörü, anahtar, hepsi yerinde |

`stl/montaj/` altındakiler de `montaj.py` çıktısı; renkli görüntüleyici
onları parça parça yüklüyor. Hepsi montaj konumunda dışa aktarılıyor, yani
tarayıcı tarafında hiçbir dönüşüm yok — yanlış yere düşecek bir hesap da yok.

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
ESP tırnakları yukarı. Vida havşası bu yönde tabandan içeri doğru daraldığı için
köprü gerektirmiyor.

## Montaj

**Gövdeye:**

1. **OLED'in header'ını takma.** Kabloları doğrudan pedlere lehimle. Header
   8 mm derinlik yiyor.
2. OLED'i sol üst ve sağ alt deliğinden pimlere geçir (arkadan bakınca),
   sağ üst ve sol alt deliğe **M2 × 4** vida tak. Daha uzun vida ön yüzü
   deler.
3. **Dokunma sensörünü** dokunma yüzü kafaya bakacak şekilde tepedeki cebe
   bastır; pinli kenar, gövdeye arkadan bakınca sağda. Kaburgalar sıkı tutar.
   Kart duvara değiyor olmalı. Kapasitif algılama duvarın içinden geçer, delik
   açmaya gerek yok.
4. **Göz yamasını** tırnakları pencerenin köşelerine girecek şekilde yüze
   bastır; arkasına ince bir kat yapıştırıcı. Tırnaklar ortalıyor, yapıştırıcı
   tutuyor.
5. **Pili** göbekteki yuvaya kaydır. Yan kaburgalar ve dudaklar pili yerinde
   tutar; üst dudak iki yana kaçık bırakıldı, ortadan parmakla çıkarabilirsin.

**Kapağa:**

6. **ESP32-C3'ü** bileşen yüzü kapağa, USB soketi takozun üstüne gelecek
   şekilde kapağa dik bastır. Dört tırnak "tık" diye kapanır. Telleri önceden
   arka yüzden lehimle.
7. **TP4056'yı** gövdenin altındaki raylara arkadan, soketi arkaya bakacak
   şekilde sür; ön dayanağa kadar. Kapağı kapatınca kart kenarı kapağın
   içindeki cebe, soket de porta oturur. Kart gövdede duruyor, kapakta
   değil — kapağı açtığında yerinde kalır.
8. **Anahtarı** kapaktaki 20 × 5 deliğe geçir.

**Birleştirme:**

9. Kabloları bağla — OLED, pil ve TP4056 gövdede, ESP kapakta olduğu için
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
- 2× M2 × 4 mm kendinden kılavuzlu (OLED)
- Kaymaz ped

## Kendi modülüne göre

`elcin_kutu_uret.py` başındaki değerler — hepsi mm:

| Değişken | Ne | Değer |
|---|---|---|
| `OLED_PCB_W/H/T` | OLED kart boyutu | 27 × 27 × 4.1 |
| `OLED_GLASS_W/H/T` | cam paneli | 26.7 × 19.3 × 1.5 |
| `OLED_CAM_PAYI` | cama hiçbir şeyin yaklaşmadığı pay | 0.5 |
| `OLED_PIXEL_W/H` | camın içindeki yanan alan | 21.7 × 10.9 |
| `OLED_HOLE_DX/DY` | montaj delikleri arası | 23.5 × 23.5 |
| `OLED_PIM_D`, `OLED_PIM_INCE` | pim çapı, elmas pimin kalınlığı | 1.8, 0.9 (23.1–23.9 arası tutar) |
| `OLED_VIDA_BOY` | OLED vidası | 4 (M2) |
| `OLED_AKTIF_H` | camın görüntü gösteren üst kısmı | 15 |
| `WINDOW_W/H` | yüz penceresi (görüntü alanının ortasında) | 24 × 14.6 |
| `MASK_A/B`, `MASK_X` | göz yaması elipsi ve kayması | 14 × 12, ±10 |
| `MASK_TILT` | yamanın dışa yatması | 16° |
| `MASK_T` | yama kalınlığı (tamamı yüzün önünde) | 1.6 |
| `KEY_D` | köşe tırnaklarının pencereye girişi | 1.2 |
| `FLOOR_T` | taban kalınlığı | 2.0 |
| `HOLE_R`, `HOLE_X` | göz çukuru yarıçapı ve kayması | 7.0, ±4.7 |
| `ESP_L/W/T` | ESP32 kart boyutu | 22.5 × 18 × 1.2 |
| `ESP_USB_W/L/H`, `ESP_USB_TASMA` | ESP32'nin USB-C soketi, kenardan taşması | 9 × 7.4 × 3.3, 0.8 |
| `ESP_KOSE` | anten ucunda kartın bastığı boş köşe | 1.8 |
| `ESP_ALTI` | kapaktan bileşen yüzüne (fiş takılabilsin) | 5.2 |
| `ESP_TIRNAK_T/GOMME/BINDIRME` | tırnak kalınlığı / gömülü kök / karta binme | 1.2 / 1.2 / 0.5 |
| `TOUCH_W/H/T` | TTP223 kartı | 14.7 × 11.1 × 1.0 |
| `TOUCH_CEP_PAY` | kart ile cep duvarı arası | 0.2 |
| `HEAD_R` / `BELLY_R` | kafa / göbek yarıçapı | 33 / 32 |
| `EAR_R` / `EAR_X` | kulak boyu / açıklığı | 13 / 20 |
| `BAT_W/H/T` | pil ölçüsü | 40 × 30 × 5 |
| `BAT_CL` | pil payı (şişmeye karşı bol) | 1.0 |
| `TP_W/H/T` | TP4056 ölçüsü | 26.5 × 17 × 5 |
| `TP_TILT` | kartın eğimi — masaya paralel | `LEAN` (10°) |
| `TP_KAPAGA_GOMME` | kart kenarının kapağa girişi | 1.0 |
| `TP_USB_OVERHANG` | soketin kart kenarından taşması | 0.6 |
| `USB_KILIF_W/H` | standart fiş kılıfı (cep bundan biraz geniş) | 12.35 × 6.5 |
| `INNER_D` | iç derinlik | 26.5 |
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

`dogrula.py` şunları ölçer: her modül kabuğun içinde mi, **modüller birbirine
giriyor mu**, **OLED camına bir şey yaklaşıyor mu, kart dayanaklara basıyor
mu, vida ön yüzü deliyor mu**, **ESP32 ve dokunma kartı her yöne itilince
tutuluyor mu, USB kablosu takılabiliyor mu, tırnaklar yorulmadan esniyor ve
baskıda komşularına kaynamıyor mu, dokunma yüzü duvara değiyor mu ve üstünde
kalan duvar ne kadar ince**, **göz yaması oturuyor mu ve yüz baskıda düz mü**, **alt kapalı
mı**, **şarj fişi gerçekten takılabiliyor mu ve portun çevresinde yeterli et
var mı**, Elçin devrilir mi, **basılan her parça tek katı mı** (havada ada
yok), STL'ler kapalı mı (açık kenar ve manifold-dışı kenar ayrı ayrı).

Denetimlerin çoğu sonradan eklendi ve her biri bir hatayı yakaladığı için var.

**Hiçbir parça denetimden muaf değil.** Eski sürüm dokunma sensörüyle anahtarı
"duvara gömülü" diye hiç denetlemiyordu. Anahtarın kapağın içine uzanan gövdesi
ESP32'nin alt rayına 175 mm³ giriyordu — anahtar takılamazdı — ve doğrulama
"hepsi geçti" diyordu. Artık kasıtlı olarak duvardan geçen kısım kesilip atılıyor,
geri kalanı herkes gibi denetleniyor. (Dokunma sensörünün muafiyete hiç ihtiyacı
yokmuş; cebine tam oturuyor.)

**Parçaların içeride olması, dışarıya açık bir boşluk olmadığı anlamına gelmiyor.**
Masa kesiği iç boşluğun içinden geçiyordu ve Elçin'in altı tamamen açıktı; pil
alttan görünüyordu. Bütün denetimler parçaların içeride olup olmadığına
bakıyordu, dışarıya açılan bir boşluğa bakan yoktu.

Modülleri tek tek kabuğa karşı denetlemek yanıltıyor: OLED ile pil ayrı ayrı
kabuğa rahat sığıyordu ama aynı derinlik bandında üst üste biniyorlardı —
ikisi de "boşlukta" olduğu için kabuk testi bunu göremez.

Kartın sığması da soketin **erişilebilir** olduğu anlamına gelmiyor. Fiş bir
yerden girmek zorunda ve girdiği koridor hem kabuğun hem masanın dışında
kalmalı. `dogrula.py` artık takılı bir USB-C fişini katı olarak kurup ikisini
de ölçüyor.

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
- **TP4056'nın Type-C soketi kapağa bakamıyordu:** kart düzlemine paralel
  bakan bir soketi kapak düzlemine dik varsaymıştım
- kapağı montaj konumuna geri getiren dönüşüm yanlıştı, kapak 3.7 mm geride
  duruyordu — "gövde ↔ kapak çakışması yok" testi tam da bu yüzden geçiyordu
- camın üst kenarı OLED montaj kulelerinin içinden geçiyordu
- yüz, kafaya göre çok küçüktü ve "yüzü yok" gibi duruyordu — ancak gerçek
  OLED görüntüsü pencereye yapıştırılınca görüldü
- **Elçin'in altı açıktı:** masa kesiği iç boşluktan geçiyordu, Elçin masaya
  ince bir halka üzerinde oturuyordu ve pil dahil her şey alttan açıktaydı.
  2 mm taban eklendi; TP4056 tabanın üstünde kalsın diye 1.5 mm yükseltildi,
  pilin alt dudağı da kartın geçtiği yerden yana alındı
- **anahtar ESP32'nin alt rayının içinden geçiyordu** (175 mm³) — doğrulama
  anahtarı hiç denetlemediği için görünmüyordu. Anahtarın yeri artık rayın
  konumundan türetiliyor
- göz yaması oyuğunun tavanı baskıda 599 mm² desteksiz kalıyordu
- **ESP32 yuvası kartı hiç tutmuyordu:** oluk rayın dışına açılmıştı, kart iki
  duvar arasında her yana 1.9 mm serbestti. Çakışma testi "çakışma yok"
  diyordu, doğruydu, ama tutan da yoktu. Artık kart altı yöne itiliyor
- **dokunma sensörü kubbeye tek noktada değiyordu** — kapasitif algılama için
  temas şart. Artık iç yüzeye düz cep oyuluyor, kartın %93'ü değiyor
- yeni ESP tırnaklarının ilk çiziminde USB ucundaki dişler yanaklarla iç
  içeydi, anten ucundakiler ayaklara 0.1 mm yakındı. Baskıda kaynaşıp esnemezdi.
  Çakışma testi bunu görmedi; artık tırnakların komşulara uzaklığı ölçülüyor
- **pencere camın ortasına göre duruyordu, ama cam her yerinde görüntü
  göstermiyor:** alt ~4 mm'sinde panelin sürücü şeridi var, görüntü üst 15
  mm'de. Görüntünün üstü kesiliyor, alttaki boş şerit pencerede görünüyordu.
  Basılan şablonda görüldü. Pencere, göz yaması ve yüz artık görüntü alanına
  göre yerleşiyor; `dogrula.py` pencerenin görüntü alanını açıp açmadığını
  ölçüyor
- **OLED kuleleri camın köşelerine basıyordu** — basılan şablonda görüldü.
  Modeldeki cam gerçeğinden 3.3 mm kısaydı. Dört kule yerine camın hattında
  kırpılmış dayanaklar, çapraz 2 pim ve 2 vida geldi. Eski M2 × 6 vidalar da
  kılavuz deliğinin dibine oturup kartı sıkamıyordu
- taban iç küreye tam teğet oturunca dört üçgenin paylaştığı manifold-dışı
  bir kenar çıktı; STL denetimi bunu "açık kenar" diye raporluyordu, artık
  ikisini ayırıyor
- **şarj portu ürün kalitesinde değildi:** kart 28° yatırılmıştı, kablo 28°
  yukarı doğru sokuluyor, kapakta 19 × 7 mm'lik eğik bir yarık kalıyordu.
  Kart tabana paralel yatırıldı, gövde 2.5 mm derinleşti; açıklık USB-C
  soketinin kendi biçimine indi (9.9 × 3.8 — dört kat küçük)
- portun kılıf cebi üst kenarda kapağı 0.47 mm'ye inceltiyordu; iç takviye
  yastığı eklendi
- soketi dikdörtgen kutu olarak modellemek, gerçekte olmayan bir çakışma
  gösteriyordu: gerçek USB-C soketi stadyum biçiminde

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
- **Pilin arkasına havalandırma deliği açılmadı, alt da kapalı:** Li-Po hücresi
  toza ve delici cisme açık kalmamalı. Yarıklar kafanın arkasında, ESP32
  hizasında. (Bu madde yazılıyken alt açıktı — taban eklenene kadar.)
- **Anahtar arkada:** Gülçin'in gördüğü yüzde anahtar olmasın.
- **10° yaslanma:** "yukarı bakıyor" hissi ile devrilmeme arasındaki denge;
  ölçümle seçildi.
- **Ön yüzde vida yok:** Gülçin'in gördüğü yüzey temiz kalsın.
