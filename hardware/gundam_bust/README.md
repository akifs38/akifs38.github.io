# MECHA-01 — Gundam Masaüstü Büst (AMOLED + ESP32-C3)

1.3" AMOLED ekranlı, ESP32-C3 tabanlı masaüstü mecha büst. Gövde içi elektronik
yuvası, kafada dokunmatik sensör cebi ve arkadan sökülebilir kapak.

## Ölçüler
- Toplam: **175 × 92 × 188 mm** (G × D × Y) — 1:1, mm
- İç yuva net alanı: ~**70–112 × 85 × 50 mm** (bel→omuz genişliği artar)
- Tüm mesh'ler **watertight** → dilimleyiciye doğrudan girer.

## STL dosyaları
| Dosya | İçerik |
|---|---|
| `gundam_bust.stl` | Ana gövde (kafa + göğüs + omuz + kaide) |
| `gundam_bust_cover.stl` | Arka elektronik kapağı (sürme + lip, 0.35 mm tol.) |
| `gundam_bust_full.stl` | Montajlı önizleme (baskı için değil) |

## Bileşenler (BOM)
| Bileşen | Boyut (mm) | Yuva |
|---|---|---|
| 1.3" AMOLED ekran | 36×36×6 | Göğüs cebi + 26×26 pencere |
| ESP32-C3 SuperMini | 22.5×18×6 | İç yuva (arka duvar) |
| TP4056 (USB-C) | 26×17×5 | İç yuva (alt) |
| LiPo batarya (603040) | 40×30×9 | İç yuva (üst) |
| Dokunmatik sensör (TTP223) | Ø14×4 | Kafa üstü cep + Ø5 kablo kanalı |

## Parametrik üretim
Model tamamen parametrik. Kendi kartların farklıysa `gundam_bust.py` içindeki
`P{...}` sözlüğünden (ör. `scr_board_w`, `torso_depth`, `touch_dia`) değiştir:

```bash
pip install numpy trimesh manifold3d scipy numpy-stl
python3 gundam_bust.py        # STL'leri üretir
python3 render.py             # 4-görünüm önizleme (preview.png)
python3 hero.py               # 3/4 hero render
python3 build_page.py         # gundam_bust.html spec sayfası
```

## Baskı ayarları
- **Yön:** gövde dik, arka yüz tablaya bakacak (ekran penceresi üstte, destek az).
- **Destek:** V-fin, omuz altları, visor için (tree/organic).
- **Duvar 3 mm** → 3–4 perimeter, %15–20 dolgu. Katman 0.2 mm (yüz için 0.12–0.16).
- Malzeme: PLA/PETG. Kapak sıkıysa zımparala / akış-ölçek ayarla.
