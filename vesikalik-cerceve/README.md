# Vesikalık Anahtarlık Üretici · Dalyan

**35×45 mm vesikalık fotoğraflı, klipsli ve vidasız 3D baskı anahtarlık.**
Model seç, ölçüleri ve arka yazıyı değiştir, STL'i tarayıcıda anında indir. Sunucu yok;
geometri [manifold-3d](https://github.com/elalish/manifold) (WASM) ile istemcide üretilir.

🌐 `/vesikalik-cerceve/`

## Modeller

| Model | Özellik |
|---|---|
| Caretta | Deniz kaplumbağası; fotoğraf kabukta, halka başında, kazıma gözler |
| Bulut | Yuvanın çevresinde birbirine binen kabarcıklar |
| Mavi Yengeç | Kıskaçlar, yürüme ve kürek bacaklar, yan dikenler |
| Kaya Mezarı | Kaunos kral mezarı cephesi: alınlık, sütun çizgileri, basamaklar |
| Güneş | İztuzu güneşi: ışınlı gövde |
| Madalyon | Boncuk kenarlı oval |
| Klasik | Sade yuvarlak köşeli |

- Pencere şekli (dikdörtgen, yuvarlak köşe, oval, kemer) her modelde değiştirilebilir.
- Fotoğraf ölçüsü serbesttir (hazır: 35×45, 50×60, 45×35, 30×40, 25×35).
- **Arka yazı:** kapağa 1–2 satır kabartma ya da oyma yazı (Türkçe harfler, rakam, `- . ! ♥`;
  `<3` yazınca kalp olur). Kapağa sığmazsa harfler otomatik küçülür.
- Ön yüzde kazıma süs çizgileri (kabuk kenarı, sütunlar, gözler) açılıp kapatılabilir.

## Klips sistemi (vidasız)

```
   giriş pahı ─┐  ┌─ kanal (sökülebilir: 45° rampa / kalıcı: düz tavan)
               ▼  ▼
  ┌──────────╲  ┌──────
  │ gövde     │ │ ◄── tırnak çıkıntısı (dil ucunda)
  │           │ └──────   arka kapak
  │           │ ══════    fotoğraf (+ isteğe bağlı asetat)
  └───────────┴───────    ön yüz (tablada)
```

Arka kapağın kenarlarında, **düzlem içinde esneyen dil (konsol) tırnaklar** var.
Kapak bastırılınca gövde ağzındaki pah tırnağı içeri iter; kapak oturunca tırnak
ucu duvardaki kanala girer. Sökmek için kapağın kenarındaki **kulakçık**, gövdedeki
çentikten tırnakla kaldırılır.

- **2 klips**: uzun kenarlarda · **4 klips**: her kenarda
- **Sökülebilir** kilit: kanal tavanı 45° — fotoğraf değiştirilebilir
- **Kalıcı** kilit: düz tavan — çok sıkı tutar

## Baskı

- PLA / PETG · 0.16–0.2 mm katman · **3–4 duvar** · %20 doluluk · **destek yok**
- Parçalar baskı yönünde gelir: gövdenin ön yüzü, kapağın fotoğrafa bakan yüzü tablaya.
- Yazı farklı renk olsun istersen kabartmanın başladığı katmanda filament değiştir.
- Kapak zor giriyorsa *Kapak toleransı* +0.05; gevşekse *Tırnak kilit derinliği* +0.1.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Arayüz ve stiller |
| `app.js` | Form, three.js önizleme, STL indirme, bağlantı paylaşma (`#m=caretta&yazi=DALYAN…`) |
| `geo.js` | Bütün geometri: modeller, parametreler, klips, yazı, STL yazıcı (saf ES modülü, Node'da da çalışır) |
| `font.js` | Arka yazı için tek çizgili Türkçe büyük harf fontu |
| `vendor/manifold.*` | manifold-3d 3.5.4 (Apache-2.0, `vendor/LICENSE-manifold.txt`) |

`geo.js` Node'da doğrudan test edilebilir:

```js
import Module from './vendor/manifold.js';
import { build, defaultsFor, layoutForPrint, toBinarySTL } from './geo.js';
const M = await Module(); M.setup();
const r = build(M, 'caretta', defaultsFor('caretta'), { check: true });
// r.stats → manifold durumu, parça sayısı, kapak–gövde çakışma hacmi
```
