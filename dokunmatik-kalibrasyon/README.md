# Dokunmatik Kalibrasyon (Windows 10)

Windows'un **USB fare** (ör. "HID uyumlu fare", "USB Giriş Aygıtı") olarak gördüğü
dokunmatik ekranları kalibre eden küçük bir araç. Bu tür ekranlarda Windows'un
kendi "Kalem veya dokunma girişi için ekranı kalibre et" seçeneği ya hiç çıkmaz ya
da işe yaramaz. İmleç parmağın altında değil de kaymış, ters dönmüş, eksenleri yer
değiştirmiş ya da yanlış monitöre gidiyorsa bu araç düzeltir.

## Ne yapar?

1. Dokunduğunuz ekranın hangi USB cihaz olduğunu bulur ("Dokunarak bul").
2. Ekranın **4 köşesinde** sırayla hedef gösterir; 4 hedefe dokununca kalibrasyon hesaplanır.
3. Dokunulan ve olması gereken noktalardan bir düzeltme hesaplar (afin dönüşüm:
   kaydırma, ölçek, eksen ters çevirme, X/Y yer değiştirme ve hafif dönme).
4. Kaydetmeden önce test ettirir. 45 saniye içinde onaylamazsanız eski ayara döner,
   yani kötü bir kalibrasyon yüzünden ekran kullanılamaz hale gelmez.
5. Arka planda (sistem tepsisinde) çalışarak **yalnızca dokunmatikten gelen**
   olayları düzeltir. Normal fareniz etkilenmez.

## Kurulum / derleme

### Visual Studio 2022 ile (önerilen)

1. Visual Studio Installer'da **".NET masaüstü geliştirme"** iş yükünün yüklü olduğundan
   emin olun.
2. `DokunmatikKalibrasyon.sln` dosyasına çift tıklayın.
3. Üstteki yapılandırmayı **Release** seçin ve **Derle › Çözümü Derle** (Ctrl+Shift+B) ya da
   doğrudan **Başlat** (F5) ile çalıştırın.
4. Hazır program: `bin\Release\net48\DokunmatikKalibrasyon.exe`. Bu tek dosyayı dokunmatik
   bilgisayara kopyalamanız yeterli; hedef .NET Framework 4.8 Windows 10'da zaten yüklüdür.

### Visual Studio olmadan

`derle.bat` dosyasına çift tıklayın. Betik, Windows 10 ile gelen .NET Framework
derleyicisini (`csc.exe`) kullanır ve aynı klasöre `DokunmatikKalibrasyon.exe` üretir.

### Hazır dosya

`main` dalına her gönderimde GitHub Actions, `DokunmatikKalibrasyon.exe` dosyasını
deponun **Releases › dokunmatik-kalibrasyon** sürümüne yükler.

## Kullanım

1. **Dokunarak bul** düğmesine tıklayın ve 15 saniye içinde dokunmatik ekrana dokunun.
   Cihaz listede kalın yazıyla seçilir. İsterseniz listeden elle de seçebilirsiniz.
2. Birden fazla monitör varsa **Dokunmatik ekran** kutusundan doğru ekranı seçin.
3. **Kalibrasyonu başlat (4 nokta)** düğmesine basın. Sırayla sol üst, sağ üst, sağ alt
   ve sol alt köşedeki kırmızı hedefin tam merkezine dokunup parmağınızı kaldırın.
4. Test ekranında farklı yerlere dokunun. Mavi noktalar parmağınızın altında
   çıkıyorsa **Kaydet**'e basın.
5. **Windows açılınca otomatik başlat** seçeneğini işaretleyin. Uygulama her açılışta
   tepside sessizce başlar ve düzeltmeyi uygular.

| Kısayol | İşlev |
|---|---|
| `Ctrl+Alt+K` | Düzeltmeyi aç/kapat (acil durumda) |
| `Esc` | Kalibrasyonu iptal et |
| `R` | Kalibrasyona baştan başla |
| `Enter` | Test ekranında kaydet |

Ayarlar `%APPDATA%\DokunmatikKalibrasyon\ayarlar.ini` dosyasında saklanır.

## Bilinmesi gerekenler

- **Windows cihazı gerçek dokunmatik olarak tanıyorsa** (listede "Windows dokunmatik
  (HID sayısallaştırıcı)" yazıyorsa ya da "Dokunarak bul" bunu söylüyorsa) en doğru
  sonucu Windows'un kendi aracı verir. **Windows'un kendi kalibrasyonu** düğmesi
  `tabcal.exe`'yi açar.
- **Yönetici olarak çalışan pencereler:** Windows güvenlik kuralları (UIPI) gereği
  normal yetkiyle çalışan bir uygulama, yönetici olarak açılmış pencerelere giden
  dokunmaları düzeltemez. Bu gerekiyorsa uygulamayı "Yönetici olarak çalıştır" ile
  açın. Otomatik başlatmada da yönetici yetkisi isteniyorsa Görev Zamanlayıcı'da
  "en yüksek ayrıcalıklarla çalıştır" seçeneğiyle bir görev oluşturun (program:
  `DokunmatikKalibrasyon.exe`, bağımsız değişken: `--tepsi`).
- Üreticinin kendi dokunmatik sürücüsü (eGalax / eGalaxTouch, ILITEK vb.) kendi
  kalibrasyonunu uyguluyorsa önce onu sıfırlayın ya da kapatın. İki kalibrasyon üst
  üste binmesin.
- Cihaz seçmeden (filtre kapalıyken) düzeltme tüm fare olaylarına uygulanır. Bu,
  yalnızca dokunmatiği olan kiosk/panel PC'ler için uygundur.

## Nasıl çalışır? (teknik)

Proje yapısı:

```
DokunmatikKalibrasyon.sln        Visual Studio 2022 çözümü
DokunmatikKalibrasyon.csproj     .NET Framework 4.8, WinForms (tasarımcısız, tamamen kod)
app.manifest                     Per-Monitor V2 DPI, Windows 10 uyumluluğu
derle.bat                        VS olmadan derleme
src\                             kaynak kodlar
```

- `InputEngine.cs`: Düşük seviye fare kancası (`WH_MOUSE_LL`) ile fare olaylarını
  yakalar. Olayın hangi cihazdan geldiğini **Raw Input** (`WM_INPUT`) ile belirler.
  Seçili cihazdan gelen olayı yutar, düzeltilmiş koordinatla `SendInput` üzerinden
  yeniden gönderir. Tıklama, sürükleme ve sağ tık düzeltilir; tekerlek olduğu gibi
  geçer.
- `AffineTransform.cs`: 4 noktadan en küçük kareler yöntemiyle 6 parametreli dönüşümü
  hesaplar. 4 nokta 6 bilinmeyenden fazla olduğu için ortalama hatayı (RMS, piksel) da
  raporlar; yanlış dokunulmuş bir köşe yüksek hata olarak görünür.
- `CalibrationForm.cs`: Tam ekran 4 köşe hedefi ve test ekranı. Her hedefte dokunma
  süresince gelen noktaların ortancası alınır, böylece titreşim etkisi azalır.
- `InputDevices.cs`: USB/HID cihazlarını, VID:PID ve ürün adlarıyla listeler.
- Uygulama "Per-Monitor V2 DPI" uyumludur; ölçekleme %125/%150 olsa da koordinatlar
  fiziksel piksel olarak doğru hesaplanır.
