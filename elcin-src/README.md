# 🌸 Elçin

**Masanda yaşayan küçük bir dost.**

Elçin, Mehmet Akif Soylusu tarafından Gülçin için geliştirilen kişisel bir AI
companion'dır. Üç parçası var:

```
                    🌸 ELÇİN
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       WEB APP       CLOUD       ESP32-C3
        Dünya         Beyin         Beden
```

| Parça | Ne yapar | Durum |
|-------|----------|-------|
| **Web** | Sohbet, hafıza, duygular, cihaz kontrolü | ✅ PHASE 1 tamam |
| **Cloud** | AI, hafıza kalıcılığı, WebSocket köprüsü | ⏳ PHASE 2 |
| **ESP32-C3** | OLED yüz, dokunma, OTA | ⏳ PHASE 6 |

🌐 **Canlı:** [akifs38.github.io/elcin](https://akifs38.github.io/elcin/)

---

## Şu an ne çalışıyor?

PHASE 1 tamamlandı: **web deneyimi backend olmadan uçtan uca çalışıyor.**

- 🎭 **Canlı avatar** — 10 ruh hali, 12 animasyon, göz kırpma, imleç takibi
- 💬 **Sohbet** — bağlam, ruh hali çıkarımı, yazıyor animasyonu
- 🧠 **Hafıza** — konuşmadan otomatik çıkarım, ekle/düzenle/sil/ara/dışa aktar
- ❤️ **Duygular** — ruh hali seyri ve nedenleri
- 📅 **Takvim** — özel günler; Elçin zamanı gelince kendisi anar
- 🎁 **Sürprizler** — zamanla ve koşulla açılan kutular, Akif'ten mesaj
- 📱 **Cihaz** — simüle edilmiş ESP32: heartbeat, durum makinesi, uzaktan animasyon
- 🛠 **Geliştirici paneli** — simülasyon, ham günlükler, OTA, mesaj bırakma
- 🌓 **Koyu/açık tema**, mobil alt çubuk, hareket azaltma desteği

Gerçek cihaz ya da AI anahtarı olmadan da her ekran çalışır: demo motoru ve
cihaz simülatörü devrededir, **geliştirme sırasında API maliyeti oluşmaz.**

---

## Kurulum

```bash
cd elcin-src/frontend
npm install
npm run dev          # http://localhost:5273
```

Diğer komutlar:

```bash
npm run build        # üretim derlemesi (dist/)
npm run preview      # derlenmiş sürümü sun
npm run typecheck    # TypeScript denetimi
npm test             # testler (112 test)
```

### Ortam değişkenleri

Hiçbiri zorunlu değil — tanımsızsa demo motoru ve simülatör kullanılır.
Gizli anahtarlar **asla** buraya yazılmaz; AI anahtarı yalnızca backend'de durur.

`elcin-src/frontend/.env.local`:

```
VITE_API_URL=https://api.elcin.example      # backend adresi
VITE_WS_URL=wss://api.elcin.example/ws      # WebSocket adresi
VITE_AI_PROVIDER=cloud                      # mock | cloud
VITE_AI_MODEL=gpt-4o-mini
```

---

## Yayına alma

`main` dalına `elcin-src/**` altında bir değişiklik gittiğinde
`.github/workflows/build-elcin.yml` siteyi derler, testleri koşar ve çıktıyı
depodaki `elcin/` klasörüne commit'ler. Elle derleme gerekmez.

---

## Dizin yapısı

```
elcin-src/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md      # sistemin bütünü ve sözleşmeler
│   └── ROADMAP.md           # 16 faz, hangisi bitti
└── frontend/
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── app/             # kök, router, açılış sekansı, hata sınırı
        ├── components/
        │   ├── avatar/      # Elçin'in yüzü (SVG geometrisi + bileşen)
        │   ├── layout/      # kabuk, kenar çubuğu, üst çubuk, mobil nav
        │   └── ui/          # düğme, panel, alan, modal, bildirim
        ├── config/          # TÜM sabitler burada (hard-code yok)
        ├── hooks/
        ├── lib/             # zaman, depolama, kimlik, indirme
        ├── pages/           # 9 ekran
        ├── services/
        │   ├── ai/          # sağlayıcı soyutlaması, ruh hali, hafıza motoru
        │   ├── api/         # başlangıç verisi
        │   └── device/      # taşıma soyutlaması, durum makinesi, dokunma
        ├── stores/          # zustand + kalıcılık
        ├── styles/
        └── types/           # frontend ↔ backend ortak sözleşme
```

---

## Geliştirici notu

Ayarlar → **Geliştirici modu**'nu aç; kenar çubuğunda 🛠 Geliştirici sekmesi
belirir. Oradan cihaz olmadan dokunma üretebilir, bağlantıyı koparabilir,
günlükleri okuyabilir ve Gülçin'e mesaj bırakabilirsin.

Gizli mod: ana sayfada Elçin'in yüzüne 3 saniye içinde 7 kez dokun. ✨
