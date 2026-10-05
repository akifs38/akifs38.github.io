# Vesikalık Çerçeve Üretici

**35×45 mm vesikalık fotoğraf için klipsli, vidasız 3D baskı çerçeve.**
Model seç, ölçüleri değiştir, STL'i tarayıcıda anında indir. Sunucu yok;
geometri [manifold-3d](https://github.com/elalish/manifold) (WASM) ile istemcide üretilir.

🌐 `/vesikalik-cerceve/`

## Modeller

| Model | Özellik |
|---|---|
| Klasik Masa | Dikdörtgen, arka kapağa bütünleşik masa ayağı |
| İkili Masa | Yan yana iki fotoğraf, iki ayrı klipsli kapak |
| Kemerli | Üstü yarım daire kemer çerçeve + kemer pencere, ayaklı |
| Oval Madalyon | Eliptik dış hat, oval pahlı pencere, düz taban + ayak |
| Duvar Askılı | Arkada gizli anahtar deliği (çivi / yapışkanlı kanca) |
| Buzdolabı Magneti | İnce gövde, kapakta 1/2/4 yuvarlak mıknatıs için geçme yuva |
| Anahtarlık | Yuvarlak hatlı, halka delikli kulak |
| Yaka Kartı | Boyun ipi / yaka klipsi yarığı |

Pencere şekli (dikdörtgen, yuvarlak köşe, oval, kemer) her modelde değiştirilebilir.
Fotoğraf ölçüsü serbesttir (hazır: 35×45, 50×60, 45×35, 30×40, 25×35).

## Klips sistemi (vidasız)

```
   giriş pahı ─┐  ┌─ kanal (sökülebilir: 45° rampa / kalıcı: düz tavan)
               ▼  ▼
  ┌──────────╲  ┌──────
  │ çerçeve   │ │ ◄── tırnak çıkıntısı (dil ucunda)
  │           │ └──────   arka kapak
  │           │ ══════    fotoğraf (+ isteğe bağlı asetat)
  └───────────┴───────    ön yüz (tablada)
```

Arka kapağın kenarlarında, **düzlem içinde esneyen dil (konsol) tırnaklar** var.
Kapak bastırılınca çerçeve ağzındaki pah tırnağı içeri iter; kapak oturunca tırnak
ucu duvardaki kanala girer. Sökmek için kapağın kenarındaki **kulakçık**, çerçevedeki
çentikten tırnakla kaldırılır.

- **2 klips**: uzun kenarlarda · **4 klips**: her kenarda
- **Sökülebilir** kilit: kanal tavanı 45° — fotoğraf değiştirilebilir
- **Kalıcı** kilit: düz tavan — çok sıkı tutar

## Baskı

- PLA / PETG · 0.16–0.2 mm katman · **3–4 duvar** · %20 doluluk · **destek yok**
- Parçalar baskı yönünde gelir: çerçevenin ön yüzü, kapağın fotoğrafa bakan yüzü tablaya.
- Kapak zor giriyorsa *Kapak toleransı* +0.05; gevşekse *Tırnak kilit derinliği* +0.1.

## Dosyalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Arayüz ve stiller |
| `app.js` | Form, three.js önizleme, STL indirme, bağlantı paylaşma (`#m=masa&pw=35…`) |
| `geo.js` | Bütün geometri: modeller, parametreler, klips, STL yazıcı (saf ES modülü, Node'da da çalışır) |
| `vendor/manifold.*` | manifold-3d 3.5.4 (Apache-2.0, `vendor/LICENSE-manifold.txt`) |

`geo.js` Node'da doğrudan test edilebilir:

```js
import Module from './vendor/manifold.js';
import { build, defaultsFor, layoutForPrint, toBinarySTL } from './geo.js';
const M = await Module(); M.setup();
const r = build(M, 'masa', defaultsFor('masa'), { check: true });
// r.stats → manifold durumu, parça sayısı, kapak–çerçeve çakışma hacmi
```
