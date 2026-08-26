# Finans — Kişisel Finans ve Bütçe Yönetimi

Modern, sade ve tamamen responsive bir kişisel finans yönetimi web uygulaması.
Gelir/gider takibi, bütçe planlama, hesap yönetimi, raporlar ve hızlı harcama ekleme.

🌐 **Canlı:** [akifs38.github.io/finans](https://akifs38.github.io/finans/)

## Özellikler

- **Dashboard** — Ay seçimi, özet kartları (gelir/gider/kalan/tasarruf oranı), finansal
  denge (progress bar), "bu ay ne kadar harcayabilirim?", yaklaşan ödemeler, finansal
  sağlık göstergesi ve otomatik finansal özet cümleleri.
- **İşlemler** — Filtreleme (ay/tür/kategori/hesap), arama, düzenleme ve silme (onaylı).
  Mobilde tablo otomatik kart görünümüne dönüşür.
- **Gelirler / Giderler** — Kategori bazlı özet ve hızlı ekleme.
- **Hızlı Harcama** — Alt sheet / modal ile birkaç saniyede harcama ekleme; son
  kullanılan kategori ve hesabı hatırlar.
- **Bütçe** — Kategori bazlı aylık bütçe, ilerleme çubukları ve aşım uyarıları.
- **Ödemeler** — Taksitli borçlar (kalan borç, taksit planı, öde/geri al), fatura takibi
  (bekliyor/ödendi/gecikti + hatırlatma ve gecikme toleransı), uyarılar merkezi (geciken/
  yaklaşan/ödenen) ve aylık ödeme takvimi. Bir taksit/fatura "ödendi" işaretlenince otomatik
  ve **ilişkili** bir gider işlemi oluşur (mükerrer kayıt olmaz); geri alınca işlem silinir.
- **Hesaplar** — Banka/nakit/kredi kartı hesapları; bakiyeler işlemlerden otomatik hesaplanır.
- **Raporlar** — Gelir/gider bar grafiği, kategori donut grafiği, 6 aylık trend (saf SVG).
- **Ayarlar** — Kategori yönetimi, tekrarlayan ödemeler, aylık plan, şifre değiştirme,
  koyu tema, demo veri yükleme.

## Teknoloji

Bu depo bir GitHub Pages statik sitesidir; sunucu tarafı çalıştırılamaz. Bu nedenle
uygulama, mevcut projelerin çizgisiyle uyumlu olacak şekilde **çerçeve gerektirmeyen,
saf ES modülleri + CSS** ile geliştirildi. Harici bağımlılık yoktur.

- **Kalıcılık:** `localStorage` (kullanıcı bazlı veri izolasyonu).
- **Kimlik doğrulama:** İstemci tarafı; şifreler SHA-256 + salt ile saklanır. Her
  kullanıcının verisi yalnızca kendisine aittir.
- **Para:** `Intl.NumberFormat('tr-TR')` ile `₺35.000,00` biçimi.
- **Tarih/saat:** UTC ISO timestamp saklanır, arayüzde Türkiye saatine (`Europe/Istanbul`)
  göre gösterilir. Her işlemde `createdAt` ve `transactionDate` ayrı tutulur.

> Not: Verilerin tarayıcıda saklanması nedeniyle bu, tek cihazlık kişisel kullanım
> içindir ve bir bankaya/otomatik banka hareketine bağlanmaz. Gerçek çok kullanıcılı
> güvenlik için sunucu tarafı bir backend gerekir.

## Dosya Yapısı

```
finans/
├── index.html
├── css/style.css              # Tüm stiller: değişkenler, responsive, açık/koyu tema
└── js/
    ├── main.js                # Giriş noktası
    ├── app.js                 # Çekirdek: düzen, yönlendirme, ay durumu, hızlı harcama
    ├── store.js               # Veri katmanı: localStorage, auth, modeller, hesaplar
    ├── utils.js               # Para/tarih biçimlendirme, DOM yardımcıları
    ├── ui.js                  # Toast, modal, progress bar, kart, SVG grafikler
    ├── forms.js               # İşlem/hesap/kategori/tekrarlayan formları
    ├── auth.js                # Giriş / kayıt ekranı
    └── page-*.js              # Dashboard, İşlemler, Bütçe, Hesaplar, Raporlar, Ayarlar
```
