# Park Alanı — tek filamentli 2 renkli baskı

**Düz zemin + beyaz kabartma çizgiler.** Üstte **4 park gözü** çizgileri, altta **araç şeridi**
(orta çizgi **kesikli**). 200×200 mm. (Turnike dahil değil — onu sen ekleyeceksin.)

`stl/park_alani.stl` tek parçadır; renk **Z-yüksekliğinde** değişir (tek ekstruder):
- **z 0 – 2.5 mm → 1. filament (KOYU):** düz zemin.
- **z 2.5 – 3.5 mm → 2. filament (BEYAZ):** kabartılmış çizgiler (çerçeve, park bölücüleri, kesikli şerit çizgisi).

Önizleme: `onizleme.svg`

## Baskı (filament değişimi)
1. STL'i dilimle (önerilen katman 0.2 mm).
2. **z = 2.5 mm** olan katmana **renk/filament değişimi** ekle:
   - PrusaSlicer/SuperSlicer: *Height ranges* veya sağ panelde o katmanda **"Add color change"** (M600).
   - Cura: **Extensions → Post Processing → Filament Change**, layer = 2.5 / 0.2 = **13. katman**.
   - Bambu/OrcaSlicer: katmanda sağ tık → **Add filament/pause**.
3. Yazıcı o yükseklikte durunca KOYU'yu çıkar, **BEYAZ** yükle, devam et.

> İnce ayar: kabartma yüksekliğini (`PAD_H`) ve renk değişim yüksekliğini (`BASE_T`)
> `park_uret.py` içinden değiştirip yeniden üret: `python3 park_uret.py`.

## Parametreler (`park_uret.py`)
| Değişken | Açıklama | Vars. |
|---|---|---|
| `W`, `D` | genişlik / derinlik | 200 × 200 |
| `BASE_T` | düz zemin (renk değişim yüksekliği) | 2.5 |
| `PAD_H` | beyaz çizgi kabartma yüksekliği | 1.0 |
| `FRAME` | çizgilerin kenardan içeri mesafesi | 6 |
| `LW` | çizgi kalınlığı | 3 |
| `PARK_D` | park gözü derinliği | 55 |
| `NBAY` | park gözü sayısı | 4 |
| `DASH_LEN` / `GAP` | kesikli çizgi: çizgi / boşluk | 12 / 8 |

> Tabla küçükse `W`/`D`'yi düşür ya da dilimleyicide ölçekle.
> Renkleri ters istersen (çizgiler beyaz, zemin koyu) söyle — geometriyi tersine çevireyim.
