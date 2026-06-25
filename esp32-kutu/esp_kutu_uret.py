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

# ---- vidalı kapak ----
BOSS_D = 7.0      # köşe vida kulesi çapı
PILOT = 2.7       # kuleye M3 kendinden kılavuz
CLEAR = 3.4       # kapakta M3 geçme deliği
LID_T = 2.5       # kapak plaka kalınlığı


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
    H  = 25.0                        # kutu yüksekliği (duvar üstü)
    return btop, bx0, by0, bx1, by1, CW, CD, H


def boss_xy(CW, CD):
    return [(5, 5), (CW-5, 5), (5, CD-5), (CW-5, CD-5)]


def esp32_kutu():
    btop, bx0, by0, bx1, by1, CW, CD, H = dims()

    case  = box_between(0, CW, 0, CD, 0, H)
    case -= box_between(WALL, CW-WALL, WALL, CD-WALL, FLOOR, H+1)   # iç oyuk
    # SADECE USB TARAFI (-X kısa duvar) AÇIK
    case -= box_between(-1, WALL+0.5, by0-3, by1+3, FLOOR, btop+ESP_T+4)

    # 4 standoff (kart köşeleri) — kart üstüne oturur, altta pin boşluğu
    for (px, py) in [(bx0+3, by0+3), (bx1-3, by0+3), (bx0+3, by1-3), (bx1-3, by1-3)]:
        case += cyl(btop, 5).translate([px, py, 0])

    # köşe kılavuzları (L): kartı konumlar
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

    # 4 köşe vida kulesi (kapak buraya vidalanır) + M3 pilot
    for (px, py) in boss_xy(CW, CD):
        case += cyl(H, BOSS_D).translate([px, py, 0])
        case -= cyl(16, PILOT).translate([px, py, H-16])
    return case


def esp32_kapak():
    btop, bx0, by0, bx1, by1, CW, CD, H = dims()
    lid = box_between(0, CW, 0, CD, H, H+LID_T)
    # konum lipi (içeri girer, 3 kapalı duvara) — USB (-X) tarafında lip yok
    lid += box_between(WALL+0.3, CW-WALL-0.3, WALL+0.3, CD-WALL-0.3, H-3, H)
    lid -= box_between(WALL+2.3, CW-WALL-2.3, WALL+2.3, CD-WALL-2.3, H-3.1, H+0.1)
    lid -= box_between(-1, WALL+2.5, by0-2, by1+2, H-3.1, H+0.1)     # USB tarafı lipi aç
    # 4 vida deliği (gömme başlı)
    for (px, py) in boss_xy(CW, CD):
        lid -= cyl(H+LID_T+2, CLEAR).translate([px, py, H-1])
        lid -= Manifold.cylinder(2.4, CLEAR/2, 3.4, SEG).translate([px, py, H+LID_T-2.4])
    # tepede havalandırma
    for i in (-1, 0, 1):
        lid -= cyl(LID_T+2, 4).translate([CW/2+i*13, CD/2, H-1])
    return lid


if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(esp32_kutu(),  "esp32_kutu.stl")
    export(esp32_kapak(), "esp32_kapak.stl")
    print("Bitti -> stl/  (kapak 4 köşeden M3 vida ile; sadece USB tarafı açık)")
