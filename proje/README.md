# Proje Yönetimi — müşteri, ekip, görev, maliyet ve fiyat teklifi

Müşterileri, ekibi, görevleri, proje maliyetlerini ve fiyat tekliflerini tek yerden yöneten web uygulaması.
Kurulum ve üyelik gerektirmez; tarayıcıda çalışır, telefonda da kullanılır.

🌐 **Canlı:** [akifs38.github.io/proje](https://akifs38.github.io/proje/)

## Neler var

- **Kontrol paneli:** aktif projeler, açık ve geciken görevler, yanıt bekleyen teklifler, bu ay kabul edilenler, aktif
  projelerdeki kâr; geciken/yaklaşan görevler, ekip iş yükü, proje tablosu, son teklifler ve hareketler.
- **Müşteriler:** müşteri adı, yetkili, telefon, e-posta, vergi dairesi/no, adres, notlar; müşterinin projeleri, teklifleri
  ve kabul edilen ciro; WhatsApp ve e-posta kısayolları; CSV.
- **Ekip:** çalışan, rol, saatlik maliyet, saatlik satış ücreti, haftalık kapasite, renk, aktif/pasif. Her çalışanın
  açık görevi, kalan işi, bu haftaki saati ve doluluk oranı; görev listesini WhatsApp'la gönderme.
  - **Varsayılan ekip:** Ersagun Yılmaz, Mehmet Alp Karamavuş, Mehmet Akif Soyuslu ve Kuddusi Köksal ilk açılışta
    ekipte hazır gelir (siteyi daha önce açmış tarayıcılara da bir kez eklenir; aynı adlı kişi tekrar eklenmez). Rol ve
    saatlik ücretleri Ekip sayfasından girilir; maliyeti girilmemiş kişiler için uyarı çıkar. Silinen kişi geri gelmez;
    "Tüm verileri sil" sonrası ekip yeniden eklenir. Örnek veriler kendi kurgusal ekibiyle gelir.
- **Projeler:** kod (PRJ-0001), müşteri, durum, tarihler, bütçe, sorumlu ve proje ekibi. Proje sayfasında:
  - **Özet:** gelir (kabul edilen teklif ya da bütçe), planlanan ve gerçekleşen maliyet, kâr ve marj, bütçe kullanımı.
  - **Görevler:** kanban panosu (Yapılacak → Devam ediyor → Kontrolde → Tamamlandı), sürükle-bırak.
  - **Çalışma saatleri:** kişi bazında saat ve işçilik maliyeti (kayıt anındaki saatlik ücretle), CSV.
  - **Giderler:** malzeme, ulaşım, konaklama, kiralama, taşeron… kategoriye göre; CSV.
  - **Teklifler** ve **Ekip** (proje ekibini ve sorumluyu seçme).
- **Görevler:** tüm görevler pano ya da liste olarak; proje, kişi, öncelik, "gecikenler" süzgeci; CSV.
  Görev penceresindeki **Öner** düğmesi proje ekibinden, haftalık kapasitesine göre en boş kişiyi seçer.
- **Fiyat teklifleri:** otomatik numara (TKF-2026-0001), müşteri, proje, tarih, geçerlilik, para birimi (₺, $, €, £);
  satır iskontosu, genel iskonto, KDV oranlarına göre döküm, genel toplam. Değişiklikler kendiliğinden kaydedilir.
  - **Hazır kalemden ekle**, **şablondan ekle**, **proje maliyetinden ekle** (görevlerin tahmini saatleri role göre;
    satış ücreti ya da maliyet + kâr payı; giderler kâr payıyla).
  - **A4 önizleme / PDF:** antet (logo, firma, vergi bilgileri), müşteri, satırlar, KDV dökümü, "Yalnız: … Türk Lirası",
    şartlar, IBAN, imza alanları. Yazdır penceresinde "PDF olarak kaydet".
  - Durum: taslak, gönderildi, kabul, ret; geçerliliği geçen gönderilmiş teklif "süresi doldu" görünür.
    Kabul edilen projesiz teklif tek tıkla **projeye dönüştürülür**. Kopyala, şablon olarak kaydet, WhatsApp, e-posta.
- **Hazır kalemler ve şablonlar:** ürün/hizmet fiyat listesi (birim, KDV, isteğe bağlı birim maliyet ve kâr payı) ve
  hazır teklif şablonları ("Etkinlik paketi" gibi).
- **Raporlar:** proje kârlılığı, ekip saatleri ve işçilik maliyeti, gider kategorileri, son 6 ayda verilen/kabul edilen
  teklifler; CSV.
- **Ayarlar:** firma bilgileri ve logo, teklif no öneki, geçerlilik süresi, varsayılan KDV ve kâr payı, para birimi,
  varsayılan şartlar; açık/koyu tema; yedek indir/yükle, örnek veriler, tüm verileri silme.
- Genel arama (`/` kısayolu), hızlı ekle menüsü, mobilde alt menü, koyu tema, klavye ile kullanım.

## Veriler nerede?

Uygulama GitHub Pages üzerinde çalışan statik bir sitedir; sunucu yoktur. **Tüm kayıtlar yalnızca kullandığınız
tarayıcıda** (`localStorage`) tutulur ve hiçbir yere gönderilmez. Bu yüzden:

- Başka bir bilgisayarda ya da telefonda çalışmak için **Ayarlar › Veri › Yedek indir** ile `.json` dosyası alın ve diğer
  cihazda **Yedekten yükle** ile açın.
- Tarayıcı verisini silerseniz kayıtlar da silinir; düzenli yedek alın (kontrol paneli 7 günde bir hatırlatır).
- Aynı tarayıcıda birden çok sekme açıksa değişiklikler sekmeler arasında eşitlenir.

## Hesaplar

- **Teklif:** satır tutarı = miktar × birim fiyat − satır iskontosu; genel iskonto ara toplama uygulanır; KDV genel
  iskontodan sonra, oranlara göre ayrı ayrı hesaplanır. Tutarlar kuruşa yuvarlanır.
- **Planlanan maliyet:** görevlerin tahmini saati × atanan kişinin saatlik maliyeti (atanmamışsa proje ekibinin
  ortalaması) + giderler.
- **Gerçekleşen maliyet:** girilen çalışma saatleri × kayıt anındaki saatlik maliyet + giderler.
- **Gelir:** projeye bağlı kabul edilen tekliflerin KDV hariç toplamı; teklif yoksa proje bütçesi.
- **Doluluk:** açık görevlerin kalan saati (tahmin − girilen) ÷ haftalık kapasite.

## Teknik

Çerçevesiz, derleme gerektirmeyen saf ES modülleri ve tek CSS dosyası; harici bağımlılık yok.

```
proje/
├── index.html
├── css/style.css          tema değişkenleri (açık/koyu), bileşenler, mobil, A4 baskı
├── js/
│   ├── main.js            kabuk, adres yönlendirme (#/…), arama, hızlı ekle, tema
│   ├── store.js           veri, kalıcılık, şema doğrulama, ilişkili silme
│   ├── calc.js            saf hesaplar (teklif, maliyet, kâr, iş yükü, atama önerisi, numaralar)
│   ├── util.js            güvenli HTML, para/tarih biçimleri, tutarı yazıyla, CSV
│   ├── ui.js              ikonlar, pencere, form, bildirim, menü
│   ├── forms.js           kayıt pencereleri (müşteri, çalışan, proje, görev, saat, gider, kalem)
│   ├── demo.js            örnek veriler
│   └── pages/             sayfalar
└── tests/
    ├── calc.test.js       hesap ve veri testleri (node --test)
    └── e2e.js             gerçek tarayıcıda uçtan uca test (Playwright)
```

- Kullanıcının girdiği her metin ekrana kaçışlanarak yazılır; yedekten gelen veri doğrulanır (logo yalnızca resim
  olabilir).
- Testler: `cd proje && node --test tests/*.test.js` ve `node tests/e2e.js` (Playwright gerekir).
