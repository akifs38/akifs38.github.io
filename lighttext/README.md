# LightText 💡

**Telefonlar arasında ışık ile metin aktarımı.**
İnternet, Bluetooth, Wi-Fi Direct veya herhangi bir harici haberleşme yöntemi
kullanmadan; bir telefonun ekranındaki ışık değişimlerini diğer telefonun
kamerasıyla algılayarak metin taşır.

Tamamen **statik** bir web uygulamasıdır: sadece HTML5 + CSS3 + Vanilla JavaScript.
Backend yok, veritabanı yok, WebSocket yok, harici API yok. GitHub Pages üzerinde
olduğu gibi çalışır.

---

## İçindekiler
- [Projenin Amacı](#projenin-amacı)
- [Nasıl Çalışır?](#nasıl-çalışır)
- [LightText Protokolü](#lighttext-protokolü)
- [Gönderici Nasıl Kullanılır](#gönderici-nasıl-kullanılır)
- [Alıcı Nasıl Kullanılır](#alıcı-nasıl-kullanılır)
- [Gerçek Telefonlarla Test](#gerçek-telefonlarla-test)
- [Kamera İzinleri ve HTTPS](#kamera-i̇zinleri-ve-https)
- [GitHub Pages'e Deploy](#github-pagese-deploy)
- [Bilinen Tarayıcı Kısıtlamaları](#bilinen-tarayıcı-kısıtlamaları)
- [Teknik Açıklama](#teknik-açıklama)
- [Dosya Yapısı](#dosya-yapısı)

---

## Projenin Amacı

İki telefonu yan yana koyup, aralarında **hiçbir ağ bağlantısı olmadan**, yalnızca
ekran ışığı ve kamera kullanarak kısa metinler aktarmak. Görünür ışık haberleşmesinin
(Visible Light Communication) basit, açık kaynak ve mobil tarayıcıda çalışan bir
gösterimidir.

Hedef senaryo:

```
Telefon A  →  "Merhaba dünya"
Telefon B  →  kamerayı Telefon A'nın ekranına tutar
Telefon B  →  "Merhaba dünya"
```

---

## Nasıl Çalışır?

1. **Gönderici (Telefon A)** metni UTF-8 byte'lara çevirir, üzerine bir LightText
   çerçevesi ekler (senkronizasyon, sürüm, uzunluk, CRC, bitiş) ve ekranını
   protokole göre **siyah/beyaz** yanıp söndürür.
2. **Alıcı (Telefon B)** arka kamerayı açar, her video karesinde ekranın orta
   bölgesinin **ortalama parlaklığını** ölçer, ışık değişimlerinden bitleri
   çözer, CRC ile doğrular ve metni yeniden oluşturur.

Işık, **Morse koddan bağımsız**, kendimize ait bir zaman tabanlı (pulse-width)
protokolle modüle edilir.

---

## LightText Protokolü

### Modülasyon: Kendinden Saatli Darbe Genişliği (Self-Clocking Pulse-Width)

Morse **kullanılmaz**. Her **bit** bir **darbe** (pulse) ile temsil edilir.
Darbenin **polaritesi her bitte otomatik değişir** (ON=beyaz ↔ OFF=siyah); bilgi
darbenin **süresinde** taşınır:

| Bit | Darbe |
|-----|-------|
| `0` | KISA darbe |
| `1` | UZUN darbe |

Her bitte garantili bir **kenar (edge)** olduğundan, alıcı kamera sinyale
kendini saatler. Süreler sabit bir FPS varsayımıyla değil, her karenin
**gerçek zaman damgasıyla** (`requestAnimationFrame` timestamp) ölçülür. Bu
sayede protokol kamera FPS'inden bağımsızdır.

### Çerçeve Yapısı

```
[PREAMBLE] [SFD] [VERSION] [LENGTH] [DATA] [CHECKSUM] [END]
```

| Alan       | Boyut       | Açıklama |
|------------|-------------|----------|
| `PREAMBLE` | 24 bit      | "10" × 12 alternatif deseni. Alıcının kısa/uzun süre kümelerini ve parlaklık aralığını **kalibre etmesini** sağlar. |
| `SFD`      | 8 bit (0x7E)| *Start Frame Delimiter* — benzersiz başlangıç işareti. Bit akışında byte hizalamasını verir. |
| `VERSION`  | 8 bit (0x01)| Protokol sürümü. |
| `LENGTH`   | 16 bit      | DATA'nın byte cinsinden uzunluğu (uint16, big-endian). |
| `DATA`     | n byte      | **UTF-8** kodlanmış mesaj. Türkçe karakterler dahil tam destek. |
| `CHECKSUM` | 16 bit      | **CRC-16/CCITT-FALSE** (poly `0x1021`, init `0xFFFF`). `VERSION + LENGTH + DATA` üzerinde hesaplanır. |
| `END`      | 8 bit (0x7E)| Bitiş işareti. |

Byte'lar **MSB-first** gönderilir. Çerçevenin önünde kısa bir **siyah bekleme**
(lead-in), sonunda ise son bitin kenarını üreten bir **kapanış darbesi** (trail)
vardır. Çerçeve, güvenilirlik için **birden çok kez tekrarlanabilir** (varsayılan 2x).

### Türkçe Karakter Desteği

`TextEncoder`/`TextDecoder` ile UTF-8 kodlaması yapılır. Şu karakterler test
edilmiştir ve tam desteklenir:

```
ç ğ ı İ ö ş ü Ç Ğ I Ö Ş Ü
```

Emoji gibi çok baytlı karakterler de doğru aktarılır.

---

## Gönderici Nasıl Kullanılır

1. Ana sayfada **📤 METİN GÖNDER**'e dokunun.
2. Metin kutusuna mesajınızı yazın (ör. `Merhaba, nasılsın?`).
3. İsteğe bağlı olarak **Gönderim hızı** ve **Tekrar sayısı** seçin.
4. **GÖNDER**'e basın. Ekran tamamen kaplanır ve protokole göre yanıp söner.
5. Bitince **"✅ Mesaj gönderildi"** görünür.

- Gönderim sırasında **Screen Wake Lock API** ile ekranın kapanması engellenir.
  Desteklenmeyen cihazlarda uyarı gösterilir; bu durumda ekran zaman aşımını
  uzatın veya ekrana dokunmadan bekleyin.
- Ekranınızın parlaklığını **maksimuma** alın; en iyi sonucu verir.

**Hız profilleri:**

| Profil | Kısa (bit 0) | Uzun (bit 1) | Önerilen kamera |
|--------|--------------|--------------|-----------------|
| Yavaş  | 220 ms       | 440 ms       | Yavaş / düşük FPS kameralar (~12–15 fps) |
| Normal | 140 ms       | 280 ms       | Çoğu telefon (24–60 fps) |
| Hızlı  | 100 ms       | 200 ms       | Işık koşulları iyi, hızlı kameralar |

> İpucu: Alıcı telefon mesajı okuyamıyorsa **Yavaş** hızı deneyin.

---

## Alıcı Nasıl Kullanılır

1. Ana sayfada **📷 METİN OKU**'ya dokunun.
2. **Kamerayı Başlat**'a basın ve kamera iznini verin.
3. Telefonu, gönderen telefonun **yanıp sönen ekranına** doğru tutun.
   Ekrandaki **kırmızı çerçeveyi** parlayan alanla hizalayın (yalnızca bu orta
   bölge analiz edilir; çevre ışığından etkilenme azalır).
4. Durum göstergesini izleyin:
   - `Kamera bekleniyor`
   - `Kalibrasyon yapılıyor`
   - `Sinyal aranıyor…`
   - `Sinyal algılandı`
   - `Veri okunuyor %45`
   - `Mesaj çözüldü`
5. Çözülen mesaj büyük bir kutuda görünür. **Kopyala** ile panoya alabilir,
   **Temizle** ile yeni bir okuma başlatabilirsiniz.

---

## Gerçek Telefonlarla Test

1. Her iki telefonda da tarayıcıda LightText adresini açın
   (ör. `https://<kullanıcı>.github.io/lighttext/`).
2. **Telefon A**: METİN GÖNDER → `Merhaba dünya` yazın → hız **Normal** → GÖNDER.
   (Henüz GÖNDER'e basmayın.)
3. **Telefon B**: METİN OKU → Kamerayı Başlat → kamerayı A'nın ekranına tutun.
   Kırmızı çerçeveyi A'nın ekranıyla hizalayın (mesafe **5–20 cm**).
4. Şimdi **Telefon A**'da GÖNDER'e basın.
5. Telefon B durum çubuğunda ilerlemeyi gösterir ve bitince
   **`Merhaba dünya`** metnini ekrana yazar.

**En iyi sonuç için:**
- Gönderen ekranın **parlaklığını maksimuma** alın.
- İki ekranı **birbirine paralel** ve titremeyecek şekilde sabitleyin.
- Aşırı parlak ortam ışığından ve kameraya doğrudan gelen yansımalardan kaçının.
- İlk denemede okunmazsa **Tekrar sayısını** 3x, **hızı** Yavaş yapın.

---

## Kamera İzinleri ve HTTPS

- Kamera erişimi (`navigator.mediaDevices.getUserMedia`) yalnızca **güvenli
  bağlamda** (HTTPS veya `localhost`) çalışır. GitHub Pages HTTPS sağladığı için
  sorun olmaz.
- İzin reddedilirse uygulama çökmez; şu mesajı gösterir:
  *"Kamera erişimi reddedildi. Tarayıcı ayarlarından kamera iznini açın."*
- Kamera bulunamazsa / meşgulse anlaşılır hata mesajları verilir.

---

## GitHub Pages'e Deploy

Bu uygulama depo içinde `lighttext/` klasöründedir ve tamamen statiktir.

1. Depoyu GitHub'a gönderin.
2. **Settings → Pages** bölümünde kaynağı `Deploy from a branch` → `main`
   (veya ilgili dal) / `root` seçin.
3. Birkaç dakika sonra uygulama şu adreste yayında olur:
   ```
   https://<kullanıcı-adı>.github.io/lighttext/
   ```
4. Yerel deneme için klasörde basit bir statik sunucu çalıştırabilirsiniz
   (kamera için `localhost` güvenli bağlam sayılır):
   ```bash
   cd lighttext
   python3 -m http.server 8000
   # tarayıcıda: http://localhost:8000
   ```

> Not: Yerelde `file://` ile açarsanız kamera çalışmaz — mutlaka `http://localhost`
> veya HTTPS kullanın.

---

## Bilinen Tarayıcı Kısıtlamaları

- **Screen Wake Lock API** bazı tarayıcılarda (özellikle eski iOS Safari
  sürümlerinde) desteklenmez. Bu durumda gönderim sırasında ekran kapanabilir;
  uygulama uyarı gösterir.
- **iOS Safari**: video etiketi `playsinline` ve `muted` ile açılır (kod bunu
  yapar). Kamera yalnızca kullanıcı hareketinden (butona basma) sonra ve HTTPS'te
  başlar.
- **Kamera FPS'i**: Çok düşük kare hızına sahip kameralarda (≈15 fps altı) Normal/
  Hızlı profiller güvenilir olmayabilir; **Yavaş** profili kullanın. Protokol
  12–60 fps aralığında test edilmiştir.
- **Otomatik pozlama**: Kamera pozlaması ani değişirse birkaç kare sinyal
  bozulabilir; uyarlanabilir eşik (adaptive threshold) çoğunu telafi eder,
  tekrar gönderimi (2x/3x) kalanı kurtarır.
- **Tam ekran (Fullscreen)**: Best-effort denenir; desteklenmese bile gönderim
  normal çalışır.

---

## Teknik Açıklama

### Alıcı algoritması (özet)

Her video karesinde:

1. Video karesi düşük çözünürlüklü (80×60) bir **canvas**'a çizilir (düşük CPU).
2. Görüntünün **orta %40'lık bölgesi (ROI)** alınır, ortalama **luma**
   (0.299R + 0.587G + 0.114B) hesaplanır.
3. Parlaklık örnekleri **zaman pencereli** (~2.5 s) tutulur; bu pencereden
   `min`/`max` bulunur. Bu, ortam ışığı ve pozlama kaymalarına karşı
   **uyarlanabilir eşik (adaptive threshold)** sağlar.
4. **Histerezis** ile seviye belirlenir: `b > min + 0.6·(max−min)` → ON,
   `b < min + 0.4·(max−min)` → OFF. Aradaki değerlerde önceki seviye korunur
   (gürültü bastırma).
5. Seviye değişimi bir **kenar**dır. Kenarlar arasındaki gerçek zaman farkı
   darbe **süresi**dir. Çok kısa titremeler (glitch) yok sayılır.
6. Süreler, son ~90 darbe üzerinde **k-means (k=2)** ile iki kümeye ayrılır
   (kısa=0, uzun=1). Eşik iki merkezin ortasıdır. Bu, gönderim hızından bağımsız
   çözüm sağlar. (Süreler pozlamadan etkilenmediği için bu katman çok kararlıdır.)
7. Bit akışında **SFD (0x7E)** aranır; bulununca VERSION, LENGTH, DATA, CRC, END
   okunur. **CRC-16** doğrulanır ve END kontrol edilir. Hatalı çerçevede bir
   sonraki SFD denenir (sahte tetiklemelere dayanıklılık + tekrar desteği).
8. Başarılıysa UTF-8 çözülür ve metin gösterilir.

### Neden güvenilir?

- **İki bağımsız uyarlanabilir katman**: parlaklık→seviye (pozlama/ortam ışığına
  dayanıklı) ve süre→bit (FPS/hıza dayanıklı).
- **Gerçek zaman damgaları** kullanıldığından değişken FPS sorun olmaz.
- **CRC-16** ile bozuk veriler reddedilir; yanlış metin gösterilmez.
- **Tekrarlı gönderim** ve **SFD tabanlı yeniden senkronizasyon** ile gürültülü
  ortamlarda başarı şansı artar.

Bu mantık, kamera simülasyonu ile 12–60 fps, gürültü, pozlama kayması ve zaman
jitter'ı altında Türkçe karakterler ve emoji dahil doğrulanmıştır.

---

## Dosya Yapısı

```
lighttext/
├── index.html   # Tek sayfa arayüz (ana sayfa / gönderici / alıcı)
├── style.css    # Karanlık tema, mobil öncelikli responsive tasarım
├── app.js       # Protokol, kodlayıcı, gönderici, alıcı/decoder, arayüz
└── README.md    # Bu dosya
```

---

*Işıkla iletişim: internet yok, Bluetooth yok — sadece ekran ve kamera.* ✨
