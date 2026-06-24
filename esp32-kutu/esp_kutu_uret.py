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

# ---- ESP32 DevKit V1 (gerekirse kendi kartına göre değiştir) ----
ESP_L = 51.5      # kart uzunluğu (USB ekseni)
ESP_W = 28.3      # kart genişliği
ESP_T = 1.6       # PCB kalınlığı
STANDOFF = 6.0    # alttaki pin/header boşluğu için yükseklik

# ---- kutu ----
WALL = 2.5
FLOOR = 2.5
CABLE = 24.0      # kart çevresindeki kablo boşluğu (jumperlar için)
CL = 0.5          # tolerans
USB_W = 12.0      # USB konektör penceresi genişliği
USB_H = 6.0       # USB penceresi yüksekliği


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


def esp32_kutu():
    btop = FLOOR + STANDOFF                 # kart alt yüzü z
    # kart konumu: USB ucu -X duvarına yakın, +Y'de kablo boşluğu
    bx0 = WALL + 5
    by0 = WALL + CABLE
    bx1 = bx0 + ESP_L
    by1 = by0 + ESP_W
    CW = bx1 + 6 + WALL                      # USB ucu kısa, diğer uçta da kablo için yer
    CD = by1 + CABLE + WALL                  # +Y ve -Y'de kablo boşluğu
    H  = btop + ESP_T + 9                    # iç yükseklik (kart üstü + boşluk)
    cy = (by0 + by1) / 2                      # USB ekseni (kart ortası)

    case  = box_between(0, CW, 0, CD, 0, H)
    case -= box_between(WALL, CW-WALL, WALL, CD-WALL, FLOOR, H+1)   # iç oyuk (üstü açık)

    # 4 standoff (kart köşelerine yakın) — kart üstüne oturur, altta pin boşluğu
    posts = [(bx0+3, by0+3), (bx1-3, by0+3), (bx0+3, by1-3), (bx1-3, by1-3)]
    for (px, py) in posts:
        case += cyl(btop, 5).translate([px, py, 0])

    # köşe kılavuzları (L duvarları): kartı XY konumlar (uzun kenarlar AÇIK -> pinlere kablo ulaşır)
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

    # USB konektör penceresi (-X duvarı)
    case -= box_between(-1, WALL+1.5, cy-USB_W/2, cy+USB_W/2, FLOOR+2, btop+USB_H)

    # kablo çıkış çentikleri (U) — +X, +Y, -Y duvarlarında
    for (x0, x1, y0, y1) in [
        (CW-WALL-1, CW+1, CD/2-9, CD/2+9),          # +X duvar
        (CW/2-9, CW/2+9, CD-WALL-1, CD+1),          # +Y duvar
        (CW/2-9, CW/2+9, -1, WALL+1),               # -Y duvar
    ]:
        case -= box_between(x0, x1, y0, y1, FLOOR+2, H+1)

    return case


if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(esp32_kutu(), "esp32_kutu.stl")
    print("Bitti -> stl/")
