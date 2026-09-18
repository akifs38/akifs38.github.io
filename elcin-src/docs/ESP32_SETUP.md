# Elçin — ESP32-C3 kurulumu

Elçin'in bedeni: ESP32-C3, 1.23" SSD1306 OLED, harici dokunma sensörü.

---

## 1. Malzeme

| Parça | Not |
|-------|-----|
| ESP32-C3 (DevKitM-1 ya da benzeri) | Native USB CDC'li kart tercih edilir |
| 1.23" OLED, SSD1306, I2C, 128×64 | Bazı 1.3" modüller SH1106'dır — aşağıya bak |
| Dokunma sensörü (TTP223 vb.) | Tek kanal yeterli |
| Bağlantı kabloları | — |

### Bağlantı

```
OLED          ESP32-C3
─────────────────────────
VCC     →     3.3V
GND     →     GND
SDA     →     GPIO 20
SCL     →     GPIO 21

Dokunma sensörü
─────────────────────────
VCC     →     3.3V
GND     →     GND
SIG     →     GPIO 3
```

Pinlerin tamamı `esp32/include/ElcinConfig.h` içinde. Başka bir pin kullanacaksan
yalnızca orayı değiştir; kodun geri kalanı pin numarası bilmiyor.

> **SH1106 uyarısı.** Piyasadaki 1.3" OLED modüllerin bir kısmı SSD1306 değil
> SH1106 sürücüsü taşır. İkisi de `0x3C` adresinden cevap verir, bu yüzden
> ekran açılır ama görüntü 2 piksel sağa kayar ve sağ kenarda çöp kalır.
> Böyle bir durumda `platformio.ini` içindeki kütüphaneyi
> `adafruit/Adafruit SH110X` ile değiştirip `src/hw/Display.cpp` içindeki tek
> tip adını güncellemek yeterli — çizim kodunun tamamı aynı kalır.

---

## 2. Derleme ve yükleme

İki yol var; ikisi de aynı kodu derler.

### PlatformIO

```bash
cd elcin-src/esp32
pio run                 # derle
pio run -t upload       # yükle
pio device monitor      # seri günlük (115200)
```

PlatformIO ilk çalıştırmada ESP32 araç zincirini indirir (~200 MB).

### Arduino IDE

Hazır sketch: **`esp32/arduino/Elcin/Elcin.ino`** — klasörü açıp derle.

1. Kart Yöneticisi → **esp32 by Espressif** (3.x)
2. Kütüphane Yöneticisi → yalnızca iki kütüphane:
   - **Adafruit SSD1306** (Adafruit GFX'i bağımlılık olarak çeker)
   - **WebSockets** (Markus Sattler)

   ArduinoJson *gerekmiyor*: protokoldeki mesajlar tek seviyeli ve sabit
   alanlı, birkaç alan için JSON ağacı kurup yığında ~1 kB harcamaya değmedi.
3. Kart ayarları:

   | Ayar | Değer |
   |------|-------|
   | Board | ESP32C3 Dev Module |
   | USB CDC On Boot | **Enabled** — bu olmadan seri port sessiz kalır |
   | Flash Size | 4MB |
   | Partition Scheme | Default 4MB with spiffs (OTA için iki app bölümü) |
   | Upload Speed | 921600 |

> **Sketch klasörü üretilmiştir, elle düzenlenmez.** Arduino IDE alt klasör
> yollarını (`#include "hw/Display.h"`) çözemediği için kaynak ağacı
> düzleştirilerek kopyalanır. Kaynağı değiştirdikten sonra:
>
> ```bash
> cd elcin-src/esp32 && python3 tools/make_ino.py
> ```
>
> İki nüsha tutmak yerine üretmenin sebebi basit: kopyalar zamanla birbirinden
> ayrı düşer. CI her push'ta sketch'in kaynakla aynı olduğunu doğruluyor.

---

## 3. İlk açılış

Cihaz ilk kez açıldığında tanışma sekansı oynar:

```
karanlık → küçük ışık → gözler açılır → yüz → gülümseme
      ↓
"Merhaba Gülçin"
      ↓
"Ben Elçin."
      ↓
"Mehmet Akif beni senin için geliştirdi."
      ↓
"Zor zamanlarında yanında olmak için buradayım."
```

Sekans yalnızca bir kez oynar (NVS'te `booted` bayrağı). Sonraki açılışlarda
yalnızca kısa selam gösterilir.

### Eşleşme

Cihaz eşleşmemişse ekranda altı haneli bir kod belirir:

```
       ELÇİN
      PAIRING
       482731
```

Bu kod web arayüzünden **Cihaz → Yeni cihaz ekle** ile girilir. Sunucu cihazı
hesaba bağlar ve cihaz anahtarını NVS'e yazar.

---

## 4. Ayarlar ve gizli bilgiler

**Wi-Fi parolası ve cihaz anahtarı kaynak koda yazılmaz.** İkisi de yalnızca
flash'ın NVS bölümünde durur (`src/hw/Settings.cpp`). Depoda hiçbir sır yoktur
ve `pio run` ile üretilen ikili dosya da sır taşımaz.

Saklanan alanlar:

| Anahtar | İçerik |
|---------|--------|
| `ssid` / `pass` | Wi-Fi bilgileri |
| `id` | Cihaz kimliği (`elcin-001`) |
| `api` / `ws` | Backend ve WebSocket adresleri |
| `token` | Cihaz anahtarı — günlüğe asla basılmaz |
| `user` | Elçin'in hitap ettiği ad |
| `booted` | Tanışma sekansı oynadı mı |
| `otaTry` / `otaOk` | OTA açılış kaydı |

Fabrika ayarlarına dönmek: `Settings::factoryReset()`.

---

## 5. Dokunma davranışları

| Hareket | Elçin |
|---------|-------|
| Tek dokunuş | 😊 "Buradayım." |
| Çift dokunuş | 😂 Gülme animasyonu |
| Uzun basış (0.7 sn) | 🤔 "Bir şey mi oldu?" |
| Çok uzun basış (2.2 sn) | ❤️ "Zor zamanlarında yanındayım." |

Eşikler `ElcinConfig.h` içinde ve web tarafındaki değerlerle aynı.

Dokunma tanıma `delay()` kullanmaz; `millis()` tabanlı, bloke etmeyen bir
tanıyıcı ile yapılır (`src/core/TouchRecognizer.cpp`). Aynı sınıf masaüstünde
test ediliyor — saati ilerletmek sadece sayı vermek olduğu için 2.2 saniyelik
uzun basışı sınamak 2.2 saniye sürmüyor.

---

## 6. Çevrimdışı mod

İnternet yokken Elçin çalışmaya devam eder. Dokunulduğunda sırayla:

```
"Şu an internete ulaşamıyorum."
"Ama buradayım."
"Bağlantımızı tekrar kurmaya çalışıyorum."
```

Bağlantı geri geldiğinde: **"Tekrar bağlandım!"**

Sağ üstte küçük bir çizgi çevrimdışı olduğunu gösterir.

---

## 7. OTA güncellemesi

Dört koruma katmanı var:

1. **Sürüm karşılaştırması** — aynı ya da daha eski sürüme güncelleme yapılmaz.
2. **Sağlama zorunlu** — `sha256` yoksa imaj flash'a *yazılmaz*. Doğrulanamayan
   bir imajı yazmak, bozuk indirmede cihazı açılmaz hale getirir.
3. **Boyut kontrolü** — bölüme sığmayan imaja hiç başlanmaz; yarıda kalan yazma
   hem eski hem yeni imajı kullanılamaz bırakır.
4. **Geri alma** — yeni imaj üç açılışta kendini doğrulayamazsa eski bölüme
   dönülür. Doğrulama ölçütü: Wi-Fi bağlandı **ve** WebSocket açıldı.

Karar mantığı `src/core/OtaPolicy.cpp` içinde ve masaüstünde test ediliyor;
indirme/yazma `src/hw/Ota.cpp` içinde.

> **Not:** Donanımsal geri alma (`esp_ota_mark_app_invalid_rollback_and_reboot`)
> bootloader'da rollback desteği açıksa çalışır. Arduino'nun hazır
> bootloader'ında bu kapalı olabilir; o durumda üçüncü başarısız açılışta
> yalnızca sayaç sıfırlanır, bölüm değişmez. Gerçekten ihtiyaç olursa
> `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` ile özel bootloader gerekir.

---

## 8. Türkçe karakterler

OLED'de `ç Ç ğ Ğ ı İ ö Ö ş Ş ü Ü` sorunsuz görünür.

Adafruit GFX'in gömülü fontu ASCII'dir; "Gülçin" yazdırmaya kalkınca ekranda
`GÃ¼lÃ§in` çıkar, çünkü UTF-8'in iki baytı iki ayrı karakter sanılır.

Çözüm iki parçalı (`src/core/Text.cpp`):

1. UTF-8 çözülür, kod noktası elde edilir.
2. Türkçe harf için **ayrı bitmap tutulmaz**: temel harf çizilir, üstüne aksan
   bindirilir. `ö` = `o` + iki nokta, `ş` = `s` + sedilla, `ı` = `i` eksi nokta.

İkincisi yalnızca 120 bayt flash tasarrufu değil — `o` ile `ö`nün aynı gövdeyi
paylaşması, birini düzeltip diğerini unutma ihtimalini ortadan kaldırıyor.

Font `tools/gen_font.py` içinde ASCII-art olarak duruyor; bir harfi düzeltmek
isteyen `#` taşır, bayt hesaplamaz:

```bash
python3 tools/gen_font.py     # include/Font5x10.h üretir
```

---

## 9. Test

Firmware'in "beyni" Arduino'ya bağımlı değildir ve masaüstünde test edilir:

```bash
cd elcin-src/esp32/test
make            # 296 test — dokunma, durum, protokol, OTA, yüz, font
make render     # yüzleri PGM olarak dök
python3 ../tools/to_png.py out/*.pgm
```

`make render` Elçin'in bütün ifadelerini, animasyonlarını ve açılış sekansını
PNG olarak üretir — donanım olmadan yüze bakabilmek için. OLED gibi tamamen
görsel bir işi kör yazmamanın tek yolu bu.

Sözleşme denetimi (cihaz ve web aynı kelimeleri mi kullanıyor):

```bash
python3 esp32/tools/check_contract.py
```

---

## 10. Mimari

```
esp32/
├── include/          # taşınabilir başlıklar + üretilmiş font
├── src/
│   ├── core/         # BEYİN — Arduino'ya bağımlı değil, test edilir
│   │   ├── DeviceState.cpp      durum makinesi (web ile aynı tablo)
│   │   ├── TouchRecognizer.cpp  dokunma, bloke etmeyen
│   │   ├── Canvas.cpp           128×64 tek renkli tampon
│   │   ├── Text.cpp             Türkçe metin
│   │   ├── FaceEngine.cpp       yüz geometrisi
│   │   ├── AnimationEngine.cpp  animasyon, kare değil zaman tabanlı
│   │   ├── BootSequence.cpp     açılış
│   │   ├── Protocol.cpp         WebSocket JSON
│   │   └── OtaPolicy.cpp        güncelleme kararları
│   ├── hw/           # DONANIM — ekran, sensör, Wi-Fi, OTA, NVS
│   └── main.cpp      # ikisini bağlayan ince kablo
├── test/             # masaüstü testleri + yüz dökümü
└── tools/            # font üreteci, PGM→PNG, sözleşme denetimi
```

Bu ayrımın tek sebebi düzen değil: `core` masaüstünde derlendiği için dokunma
zamanlaması, durum geçişleri, yüz çizimi ve OTA kararları ESP32 olmadan
sınanabiliyor. Donanıma dokunan kod kasten ince tutuldu.

---

## 11. Sorun giderme

| Belirti | Sebep |
|---------|-------|
| Ekran tamamen karanlık | I2C adresi 0x3D olabilir; `ELCIN_OLED_ADDRESS` değiştir |
| Görüntü 2 piksel kaymış | Modül SH110X — 1. bölümdeki nota bak |
| Seri port sessiz | *USB CDC On Boot* kapalı |
| Dokunma tepki vermiyor | Sensör aktif-düşük olabilir; `ELCIN_TOUCH_ACTIVE_HIGH = false` |
| Dokunma kendiliğinden tetikleniyor | Kablo uzun/parazitli; `ELCIN_TOUCH_DEBOUNCE_MS` artır |
| Wi-Fi bağlanmıyor | ESP32-C3 yalnızca 2.4 GHz destekler |
| Türkçe harfler bozuk | Kaynak dosya UTF-8 kaydedilmemiş |
