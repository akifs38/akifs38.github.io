# Silindir Sağ–Sol Seviye Eşitleme

İki **OPKON ERTL** lineer cetvel (4–20 mA) ile bir silindirin sol ve sağ yatak
yüksekliğini eşitleme sisteminin simülasyonu ve anlatım dokümanı.

🌐 `/silindir-seviye/` — simülasyon · `/silindir-seviye/dokuman.html` — mobil doküman

## Donanım

| Parça | Görev |
|---|---|
| Delta **DVP28SV** | PLC |
| **DVP04AD-S** (modül no `K0`) | CH1 = SOL cetvel, CH2 = SAĞ cetvel, Mod 2 (4 mA → 0, 20 mA → 4000) |
| **DOP-107EV** | 7″ HMI, 800×480 |
| 2× **ERTL** | Lineer cetvel, 4–20 mA, kurs 30 mm varsayıldı |

## Hesap

```
ham  = (mA − 4) / 16 × 4000                 (CR#6 / CR#7 → D0 / D1)
D20  = ham × D500 / 4000                     (0.01 mm, D500 = kurs × 100)
SOL  = D20 − D510      SAĞ = D24 − D512      (SIFIRLA referansı)
Δ    = SOL − SAĞ  →  |Δ| ≤ D514 ise EŞİT
```

Kablo kopukluğu (0 mA → ham ≈ −1000) modülde hata vermez; PLC `ham < −100`
(3.6 mA) ile alarm üretir.

## Sayfalar

- **index.html** — DOP-107EV ekran taslağı (ana / ayarlar / alarm, tuş takımı,
  tam ekran-yatay), makine görünümü, sinyal zinciri, simülasyon ayarları
  (gürültü, ortalama, lineerlik, ters montaj, kablo kopuk), DVP28SV komut
  listesi ve canlı register monitörü. PLC hesabı programla birebir tam sayı
  aritmetiğiyle taklit edilir.
- **dokuman.html** — bağlantı şeması, 04AD-S CR ayarı, ölçekleme örneği,
  program + register haritası, HMI objeleri, devreye alma, operatör adımları,
  arıza ve CR#30 hata tablosu, doğruluk notları.
