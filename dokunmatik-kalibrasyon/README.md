# Dokunmatik Kalibrasyon (Windows 10)

Windows'un **USB fare** (ör. "HID uyumlu fare", "USB Giriş Aygıtı") olarak gördüğü
dokunmatik ekranları kalibre eden küçük bir araç. Bu tür ekranlarda Windows'un
kendi "Kalem veya dokunma girişi için ekranı kalibre et" seçeneği ya hiç çıkmaz ya
da işe yaramaz. İmleç parmağın altında değil de kaymış, ters dönmüş, eksenleri yer
değiştirmiş ya da yanlış monitöre gidiyorsa bu araç düzeltir.

## Ne yapar?

1. Dokunduğunuz ekranın hangi USB cihaz olduğunu bulur ("Dokunarak bul").
2. Ekranda 5 (ya da 9) hedef gösterir; her birine dokunursunuz.
3. Dokunulan ve olması gereken noktalardan bir düzeltme hesaplar (afin dönüşüm:
   kaydırma, ölçek, eksen ters çevirme, X/Y yer değiştirme ve hafif dönme).
4. Kaydetmeden önce test ettirir. 45 saniye içinde onaylamazsanız eski ayara döner,
   yani kötü bir kalibrasyon yüzünden ekran kullanılamaz hale gelmez.
5. Arka planda (sistem tepsisinde) çalışarak **yalnızca dokunmatikten gelen**
   olayları düzeltir. Normal fareniz etkilenmez.

## Kurulum / derleme

Yöntem A: hazır dosyayı indirin. `main` dalına her gönderimde GitHub Actions,
`DokunmatikKalibrasyon.exe` dosyasını deponun **Releases › dokunmatik-kalibrasyon**
sürümüne yükler.

Yöntem B: kendiniz derleyin (hiçbir şey kurmanız gerekmez).

1. `dokunmatik-kalibrasyon` klasörünü bilgisayara kopyalayın.
2. `derle.bat` dosyasına çift tıklayın. Betik, Windows 10 ile gelen .NET Framework 4
   derleyicisini (`csc.exe`) kullanır.
3. Oluşan `DokunmatikKalibrasyon.exe` dosyasını çalıştırın.

## Kullanım

1. **Dokunarak bul** düğmesine tıklayın ve 15 saniye içinde dokunmatik ekrana dokunun.
   Cihaz listede kalın yazıyla seçilir. İsterseniz listeden elle de seçebilirsiniz.
2. Birden fazla monitör varsa **Dokunmatik ekran** kutusundan doğru ekranı seçin.
3. **Kalibrasyonu başlat** düğmesine basın. Kırmızı hedeflerin tam merkezine sırayla
   dokunup parmağınızı kaldırın.
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

- `InputEngine.cs`: Düşük seviye fare kancası (`WH_MOUSE_LL`) ile fare olaylarını
  yakalar. Olayın hangi cihazdan geldiğini **Raw Input** (`WM_INPUT`) ile belirler.
  Seçili cihazdan gelen olayı yutar, düzeltilmiş koordinatla `SendInput` üzerinden
  yeniden gönderir. Tıklama, sürükleme ve sağ tık düzeltilir; tekerlek olduğu gibi
  geçer.
- `AffineTransform.cs`: En küçük kareler yöntemiyle 6 parametreli dönüşümü hesaplar
  ve ortalama hatayı (RMS, piksel) raporlar.
- `CalibrationForm.cs`: Tam ekran hedefler ve test ekranı. Her hedefte dokunma
  süresince gelen noktaların ortancası alınır, böylece titreşim etkisi azalır.
- `InputDevices.cs`: USB/HID cihazlarını, VID:PID ve ürün adlarıyla listeler.
- Uygulama "Per-Monitor V2 DPI" uyumludur; ölçekleme %125/%150 olsa da koordinatlar
  fiziksel piksel olarak doğru hesaplanır.
