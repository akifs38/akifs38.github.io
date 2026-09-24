# Robotlu Büküm Hattı · 3B Simülasyon

4 istasyonlu, robotlu sıcak sac büküm hattının tarayıcıda çalışan 3 boyutlu canlı simülasyonu.
Ek kurulum yok — `index.html` tek dosya, Three.js CDN'den yüklenir.

🔗 Canlı: `https://akifs38.github.io/bukme-hatti-3d/`

## Hat Kurgusu

Akış **sağdan sola** ilerler.

```
[FIRIN + STOK] → R1 → MRK-1 → BM-1 ⟲ ÇEV-1 → R2 → BM-2 ⟲ ÇEV-2
                                                      → R3 → BM-3 ⟲ ÇEV-3
                                                              → R4 → BM-4 ⟲ ÇEV-4 → [İSTİF]
```

Her istasyonun çevrimi 8 adımdır (sağdaki panelde canlı takip edilir):

| # | Adım | Açıklama |
|---|------|----------|
| 1 | Kaynaktan parça al | 1. istasyon **stok masasından**, diğerleri bir önceki **çevirme istasyonundan** |
| 2 | Merkezleme | Yalnız 1. istasyon — pnömatik dayamalar parçayı X ve Z'de hizalar |
| 3 | Makineye yükle | Robot parçayı alt kalıbın üstüne bırakır |
| 4 | 1. büküm | Robot güvenli mesafeye çekilir, koç iner, kanat 90° katlanır |
| 5 | Çevirme istasyonuna koy | Robot parçayı döner tablaya bırakır |
| 6 | 180° çevir | Tabla döner — bükülmemiş kanat makine tarafına gelir |
| 7 | Makineye yükle + 2. büküm | Aynı makine ikinci bükümü yapar |
| 8 | Aktar / istifle | 1–3. istasyon çevirme tablasına bırakır (sıradaki robot alır), **4. istasyon palete istifler** |

Hat **boru hattı (pipeline)** gibi çalışır: her istasyon kendi çevirme tablasını rezerve eder,
bir sonraki robot parçayı alınca tabla serbest kalır. Kilitlenme olmaz.

## Parça Modeli — 8 gerçek büküm

Parça, ortada bir gövde ve her iki yanda 4'er kanattan oluşan **menteşeli** bir zincirdir
(`FLANGE = [0.17, 0.13, 0.105, 0.085]` m). Makine **her zaman kendi tarafındaki (−Z) kanadı**
büker; 180° çevirme diğer yüzü makineye getirir. Böylece:

```
İST-1: L1 → (çevir) → R1     İST-3: L3 → (çevir) → R3
İST-2: R2 → (çevir) → L2     İST-4: R4 → (çevir) → L4
```

Hattın sonunda 8 kanadın hepsi katlanmış, kapalı profil çıkar. Parçalar fırından **950 °C**
çıkar (parlak sarı) ve istasyon istasyon soğuyarak turuncu-kırmızıya döner; istifteki
parçalar zamanla söner.

## Kamera Kipleri

| Kip | Kontrol |
|-----|---------|
| **Genel** | Sürükle döndür · tekerlek yakınlaştır · sağ tık kaydır (OrbitControls) |
| **Gez** | Birinci şahıs. `W A S D` yürü · fare bak · `Shift` koş · `Boşluk` zıpla · `Esc` çık. Mobilde sol joystick + sağ yarıda sürükleyerek bakma |
| **Tur** | Hattı baştan sona gezen otomatik kamera |

Gezinti kipinde makine, robot, pano ve çitlere **çarpışma** vardır; hücreye sağdaki
kapı boşluğundan girilir.

## Sahnedeki Personel

Beş işçi var: koridorda tur atan **operatör** ve **bakımcı**, forklift operatörü, panodaki
**hat sorumlusu** ve palet başındaki **kalite** personeli. Sabit duran personel EN ISO 10218
mantığıyla **çitin dışında**, hücreye bakar konumdadır.

## Kodu Değiştirme

`index.html` içindeki 1. bölüm bütün yerleşimi tutar:

```js
const NS   = 4;      // istasyon sayısı — değiştir, hat otomatik uzar/kısalır
const SPAN = 8.4;    // istasyonlar arası mesafe (m)
const X0   = 12.6;   // 1. istasyonun X'i
const PART_L = 2.4;  // parça boyu
const FLANGE = [0.17, 0.13, 0.105, 0.085];   // kanat genişlikleri → büküm sayısı = 2 × uzunluk
```

- Robot kol ölçüleri: `A1`, `A2`, `TOOL`, `SHO_X`, `SHO_Y`. Ters kinematik `solveIK()` içinde
  (taban dönüşü + 2 uzuv düzlemsel IK + bileği dik tutan telafi).
- Robot hareketleri **polar (eklem benzeri)** interpolasyonla yapılır (`Move()`), böylece
  kol, taban ekseninden geçerken savrulmaz.
- Çevrim akışı `stationProc()` generator'ında; zamanlayıcı `tickProcs()`.
- Süreleri değiştirmek için `Move(...)`/`Wait(...)` sürelerine ve `BendAt()` içindeki
  `T1/T2/T3` değerlerine bak.

### Konsoldan kurcalama

Sayfa `window.HAT` altında canlı durumu açar:

```js
HAT.setSpeed(3)          // simülasyon hızı
HAT.time                 // simülasyon saati (sn)
HAT.stations[0].state    // istasyon durumu
HAT.turns[1].part.bends  // parçadaki büküm sayısı
HAT.stack.n              // paletteki ürün adedi
HAT.look(30,14,26, 1,2,0)   // kamerayı konumlandır (Genel kipinde)
HAT.walk.pos             // gezinti kipindeki konum
```

## Teknik

- Three.js r160 (ESM + importmap, CDN)
- Tek dosya, bağımlılık kurulumu yok, `.nojekyll` ile GitHub Pages'te doğrudan yayında
- Gölgeli tek yönlü ışık + hemisphere/ambient; sıcak parçaların her biri kendi `PointLight`'ını taşır
- Duvar ve çatı **tek yüzlü** (`FrontSide`, normalleri içeri bakar): dışarıdan bakınca
  hattın içi görünür, içeride gezerken kapalı bir bina olur
