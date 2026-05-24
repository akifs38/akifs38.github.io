# Otomasyon Akademi

**Türkiye'nin interaktif endüstriyel otomasyon eğitim platformu.**

Elektrik kumanda devreleri, Siemens LAD ile PLC programlama, ISO 1219 pnömatik simülasyon ve mekanik makine elemanları. MEGEP müfredatı uyumlu, IEC 60617 standartlarında.

🌐 **Canlı:** [akifs38.github.io](https://akifs38.github.io)

---

## Proje Yapısı

```
akifs38.github.io/
├── index.html              # Ana HTML şablonu — tüm HTML burda
│
├── css/                    # Modüler stil dosyaları
│   ├── style.css           # Temel stiller: değişkenler, layout, bileşenler
│   ├── bench.css           # Elektrik kumanda tezgâhı stiller
│   ├── plc.css             # PLC editör: ladder, network, palet
│   ├── pneumatik.css       # Pnömatik simülatör: ISO 1219
│   ├── mech.css            # Mekanik bilgi kartları & animasyonlar
│   ├── gamification.css    # Onboarding, başarı popup, XP/seviye çubuğu
│   └── mobile.css          # Mobil tasarım (≤899px), bottom nav
│
└── js/                     # Modüler JavaScript dosyaları (yükleme sırası önemli)
    ├── data.js             # Veri: DB, SYM (IEC semboller), INFO, TASKS, LIBRARY
    ├── app.js              # Çekirdek: auth, boot, sekme geçişi, toast, admin
    ├── bench.js            # Elektrik tezgâhı: simülasyon, tel, sahne, kontrol
    ├── plc.js              # PLC simülatörü: Siemens LAD, scan cycle, örnekler
    ├── pneumatik.js        # Pnömatik simülatörü: bileşenler, baskı, hareket
    ├── mech.js             # Mekanik kartlar: SVG animasyonlar, detay modal
    └── gamification.js     # XP, rozetler, seviyeler, onboarding, mobil nav
```

## Özellikler

- ⚡ **Elektrik Kumanda Devresi Tezgâhı** — IEC 60617 semboller, EN 60204-1 standartı
- 🖥️ **Siemens LAD PLC Editörü** — Ladder diagram, scan cycle simülasyonu
- 💨 **Pnömatik Simülatör** — ISO 1219 devre şeması, silindir hareketleri
- ⚙️ **Mekanik Bilgi Kartları** — Rulman, redüktör, kayış-kasnak, vida (MEGEP)
- 🎯 **12 Görev** — Temel devre tanımadan yıldız-üçgen yol vermeye
- 🏆 **Gamification** — XP puanı, rozetler, Çırak → Usta seviye sistemi
- 📱 **Mobil Uyumlu** — Native app hissi, bottom navigation bar

## Geliştirme

Her modül bağımsız olarak geliştirilebilir:

| Dosya | Ne zaman düzenle? |
|-------|------------------|
| `css/plc.css` | PLC editörünün görünümünü değiştirmek istersen |
| `css/pneumatik.css` | Pnömatik simülatörün görünümünü değiştirmek istersen |
| `js/plc.js` | PLC mantığını veya yeni örnekler eklemek istersen |
| `js/pneumatik.js` | Pnömatik bileşenler veya fizik simülasyonunu geliştirmek istersen |
| `js/data.js` | Yeni görevler, semboller veya bilgi kartları eklemek istersen |
| `js/gamification.js` | XP sistemi veya yeni rozetler eklemek istersen |

## Standartlar

- **IEC 60617** — Elektrik şema sembolleri
- **EN 50005** — Terminal kodlama
- **EN 60204-1** — Makine elektrik donanımı etiketleme
- **EN 60947-4-1** — Alçak gerilim anahtarlama cihazları
- **ISO 1219** — Pnömatik devre şeması sembolleri
- **MEGEP/MEB** — Türkiye mesleki eğitim müfredatı
