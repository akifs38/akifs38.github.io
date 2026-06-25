#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ESP32 kutusu — ESP32 DevKit V1 (yaygın) için tepsi/kutu.
Kart 4 standoff'a oturur, köşe kılavuzlarıyla konumlanır, USB ucu duvardan çıkar.
Kartın ETRAFINDA bol jumper/kablo boşluğu + duvarlarda kablo çıkış çentikleri.

Gereksinim:  pip install manifold3d numpy-stl
Çalıştır:    python3 esp_kutu_uret.py   ->  stl/esp32_kutu.stl   (ölçüler mm)
"""
import os
import numpy as np
from manifold3d import Manifold
from stl import mesh as numpy_stl

OUT = os.path.join(os.path.dirname(__file__), "stl")
os.makedirs(OUT, exist_ok=True)
SEG = 48

# ---- ESP32 DevKit (38-pin, geniş) ----
ESP_L = 55.0      # kart uzunluğu (USB ekseni)
ESP_W = 28.0      # kart genişliği
ESP_T = 1.6       # PCB kalınlığı
STANDOFF = 6.0    # alttaki pin/header boşluğu için yükseklik

# ---- kutu ----
WALL = 2.5
FLOOR = 2.5
CABLE = 12.0      # kart çevresindeki kablo boşluğu (USB ucu hariç)
CL = 0.5          # tolerans

# ---- klips (snap) kapak ----
BEAD = 0.9        # kutu dış duvarındaki klips çıkıntısı
SKIRT_LEN = 7.0   # kapak eteği boyu
SKIRT_T = 2.0     # kapak eteği kalınlığı
GAP = 0.4         # kapak ile kutu arası boşluk
LID_T = 2.5       # kapak üst plaka kalınlığı


def box_between(x0, x1, y0, y1, z0, z1):
    return Manifold.cube([x1-x0, y1-y0, z1-z0]).translate([x0, y0, z0])

def cyl(h, d):
    return Manifold.cylinder(h, d/2, d/2, SEG)

def export(man, name):
    m = man.to_mesh()
    verts = np.asarray(m.vert_properties)[:, :3]
    tris  = np.asarray(m.tri_verts)
    data = np.zeros(len(tris), dtype=numpy_stl.Mesh.dtype)
    data['vectors'] = verts[tris]
    numpy_stl.Mesh(data).save(os.path.join(OUT, name))
    bb = verts.max(0) - verts.min(0)
    print(f"  {name:20s}  {bb[0]:5.1f} x {bb[1]:5.1f} x {bb[2]:5.1f} mm  ({len(tris)} üçgen)")


def dims():
    btop = FLOOR + STANDOFF
    bx0 = WALL + 4
    by0 = WALL + CABLE
    bx1 = bx0 + ESP_L
    by1 = by0 + ESP_W
    CW = bx1 + CABLE + WALL          # +X'te kablo payı
    CD = by1 + CABLE + WALL          # +Y/-Y kablo payı
    H  = btop + ESP_T + 8            # iç yükseklik
    return btop, bx0, by0, bx1, by1, CW, CD, H


def esp32_kutu():
    btop, bx0, by0, bx1, by1, CW, CD, H = dims()

    case  = box_between(0, CW, 0, CD, 0, H)
    case -= box_between(WALL, CW-WALL, WALL, CD-WALL, FLOOR, H+1)   # iç oyuk
    # USB TARAFI (-X kısa duvar) TAMAMEN AÇIK
    case -= box_between(-1, WALL+0.5, -1, CD+1, FLOOR, H+1)

    # 4 standoff (kart köşeleri) — kart üstüne oturur, altta pin boşluğu
    for (px, py) in [(bx0+3, by0+3), (bx1-3, by0+3), (bx0+3, by1-3), (bx1-3, by1-3)]:
        case += cyl(btop, 5).translate([px, py, 0])

    # köşe kılavuzları (L): kartı konumlar; uzun kenarlar açık
    g, ln = 2.0, 7.0
    gh = btop + ESP_T + 1.2
    def lguide(cx, czy, sx, sy):
        a = box_between(min(cx, cx+sx*ln), max(cx, cx+sx*ln),
                        min(czy-CL, czy-CL-sy*g), max(czy-CL, czy-CL-sy*g), FLOOR, gh)
        b = box_between(min(cx-CL, cx-CL-sx*g), max(cx-CL, cx-CL-sx*g),
                        min(czy, czy+sy*ln), max(czy, czy+sy*ln), FLOOR, gh)
        return a + b
    case += lguide(bx0, by0,  1,  1)
    case += lguide(bx1, by0, -1,  1)
    case += lguide(bx0, by1,  1, -1)
    case += lguide(bx1, by1, -1, -1)

    # kablo çıkış çentikleri (U) — +X, +Y, -Y duvarlarında
    for (x0, x1, y0, y1) in [
        (CW-WALL-1, CW+1, CD/2-9, CD/2+9),
        (CW/2-9, CW/2+9, CD-WALL-1, CD+1),
        (CW/2-9, CW/2+9, -1, WALL+1),
    ]:
        case -= box_between(x0, x1, y0, y1, FLOOR+2, H+1)

    # KLİPS ÇIKINTISI (bead) — 3 dış duvarda, üst kenara yakın (kapak buraya tutunur)
    bz0, bz1 = H-5, H-3.6
    case += box_between(CW, CW+BEAD, 4, CD-4, bz0, bz1)          # +X
    case += box_between(4, CW-4, CD, CD+BEAD, bz0, bz1)          # +Y
    case += box_between(4, CW-4, -BEAD, 0, bz0, bz1)             # -Y
    return case


def esp32_kapak():
    btop, bx0, by0, bx1, by1, CW, CD, H = dims()
    so = GAP + SKIRT_T                          # etek dış ofset
    z0 = H - SKIRT_LEN                           # etek alt z
    # üst plaka (USB tarafı -X açık kalsın diye o kenarda etek yok)
    lid = box_between(0, CW+so, -so, CD+so, H, H+LID_T)
    # etekler (3 yön: +X, +Y, -Y) — kutu dışını sarar
    lid += box_between(CW+GAP, CW+so, -so, CD+so, z0, H)         # +X etek
    lid += box_between(0, CW+so, CD+GAP, CD+so, z0, H)           # +Y etek
    lid += box_between(0, CW+so, -so, -GAP, z0, H)               # -Y etek
    # klips kancaları (içe çıkıntı) — bead'in ALTINA oturur (duvara çarpmaz)
    cz0, cz1 = H-6.4, H-5.0
    lid += box_between(CW, CW+GAP, CD/2-7, CD/2+7, cz0, cz1)       # +X kanca
    lid += box_between(CW/2-7, CW/2+7, CD, CD+GAP, cz0, cz1)       # +Y kanca
    lid += box_between(CW/2-7, CW/2+7, -GAP, 0, cz0, cz1)          # -Y kanca
    # tepede havalandırma (birkaç delik)
    for i in (-1, 0, 1):
        lid -= cyl(LID_T+2, 4).translate([CW/2+i*14, CD/2, H-1])
    return lid


if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(esp32_kutu(),  "esp32_kutu.stl")
    export(esp32_kapak(), "esp32_kapak.stl")
    print("Bitti -> stl/  (kapak klipsle kapanır, vidasız)")
