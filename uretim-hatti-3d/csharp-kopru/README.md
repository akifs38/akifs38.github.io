# S7-300 Köprü — Tek .exe (WPF + WebView2 + gömülü web sunucu)

3D üretim hattı takibini **tek bir Windows uygulaması** olarak çalıştırır:

- **S7.NetPlus** ile S7-300'e **doğrudan** bağlanır (I/Q baytlarını okur),
- İçindeki **mini web sunucu** durumu WebSocket'ten yayınlar,
- **WebView2** penceresinde aynı 3D sayfayı gösterir,
- Three.js ve 3D sayfası **.exe içine gömülüdür** → **internet gerekmez**.

Başka PC'ye taşımak için: **tek `.exe`'yi kopyala, çalıştır.** Başka kurulum yok.

```
┌──────────── UretimHatti3D.exe ────────────┐
│ S7.NetPlus ──► S7-300 (IP, rack0/slot2)    │  I0.0.., Q0.0.. okur
│      │                                     │
│      ▼   Kestrel  /  → 3D sayfa            │
│          (gömülü)  /ws → {"Q0.0":true,...} │
│      ▼                                     │
│ WebView2 → http://127.0.0.1:5000/?src=ws   │  3D'yi gösterir
└────────────────────────────────────────────┘
```

## Derleme

Gereken: **.NET 8 SDK** (Windows) + **Visual Studio 2022** ya da `dotnet` CLI.

```powershell
cd uretim-hatti-3d/csharp-kopru
dotnet restore
dotnet run          # geliştirme çalıştırması
```

## Tek dosya (.exe) yayınlama

```powershell
dotnet publish -c Release
# çıktı: bin/Release/net8.0-windows/win-x64/publish/UretimHatti3D.exe
```

Bu `.exe` **kendi kendine yeter** (.NET dahil). Başka PC'ye sadece bu dosyayı
kopyalayıp çift tıkla. PLC ayarını değiştirmek istersen yanına `appsettings.json`
koyabilirsin (aşağıya bak) — koymazsan gömülü varsayılanlar kullanılır.

> **WebView2 çalışma zamanı:** Windows 11'de hazırdır, Windows 10'da çoğu makinede
> vardır. Yoksa Microsoft'un ücretsiz **Evergreen WebView2 Runtime**'ı bir kez kurulur.

## PLC ayarı (appsettings.json — opsiyonel)

`.exe` yanına koyulursa okunur:

```json
{
  "PlcIp": "192.168.0.1",   // S7-300 CP/IP adresi
  "Rack": 0,                // S7-300 tipik
  "Slot": 2,                // S7-300 tipik
  "InputBytes": 3,          // IB0..IB2  → I0.0..I2.7 okunur
  "OutputBytes": 2,         // QB0..QB1  → Q0.0..Q1.7 okunur
  "Port": 5000,             // web sunucu portu
  "PollMs": 150             // PLC okuma periyodu (ms)
}
```

`InputBytes`/`OutputBytes`'ı hattındaki adres sayısına göre büyüt (ör. I2.0'a kadar
kullanıyorsan `InputBytes: 3`). Sayfadaki sensör (I) ve motor (Q) adresleri bu
baytlardan birebir eşleşir.

## S7-300 tarafı (bir kez)

- STEP7/TIA'da CPU özelliklerinde **"PUT/GET haberleşmesine izin ver"** açık olmalı.
- S7-300 klasik DB'ler zaten **optimize kapalı**; I/Q mutlak adresle okunur, ek ayar yok.
- CP modülünün IP'si PC ile aynı ağda olmalı; **TCP 102** portu açık olmalı.

## Aynı ağdan izleme (bonus)

Sunucu `0.0.0.0:5000` dinler; aynı ağdaki telefon/tabletten
`http://<bu-pc-ip>:5000/` ile de açılır (ilk seferde Windows Güvenlik Duvarı izni).

## Dosyalar

| Dosya | Görev |
|-------|-------|
| `MainWindow.xaml(.cs)` | WebView2 penceresi, sunucu+PLC başlatma, durum çubuğu |
| `PlcBridge.cs` | S7.NetPlus ile I/Q okuma → adres→bool sözlüğü |
| `WebServer.cs` | Kestrel: 3D sayfa + `/ws` + `/plc.json` (kaynaklar gömülü) |
| `AppConfig.cs` | Ayar yükleme (appsettings.json / varsayılan) |
| `wwwroot/vendor/` | Three.js + OrbitControls (gömülür, çevrimdışı) |
| `../index.html` | 3D sayfası (gömülür; CDN yolları yerel yola çevrilir) |

> Not: 3D sayfası üst klasördeki `../index.html`'den gömülür — yani web sürümüyle
> **aynı tek dosya**. Sayfayı geliştirince C# projesini yeniden derlemen yeterli.
