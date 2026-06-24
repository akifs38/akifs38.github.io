#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Park Alanı — tek filamentli yazıcı için 2 renkli (Z-yükseklikte renk değişimi).
- ALT katmanlar (z 0..BASE_T): KOYU renk  -> çerçeve + çizgiler + turnike (kuyu/kol)
- ÜST kabartma (z BASE_T..BASE_T+PAD_H): BEYAZ renk -> park gözleri + şerit (beyaz alanlar)
Slicer'da z = BASE_T (mm) katmanına "filament değiştir / M600" ekle, beyaza geç.

Gereksinim:  pip install manifold3d numpy-stl
Çalıştır:    python3 park_uret.py   ->  stl/park_alani.stl   (ölçüler mm)
"""
import os
import numpy as np
from manifold3d import Manifold
from stl import mesh as numpy_stl

OUT = os.path.join(os.path.dirname(__file__), "stl")
os.makedirs(OUT, exist_ok=True)
SEG = 48

# ---- ayarlar (mm) ----
W = 200.0          # genişlik
D = 200.0          # derinlik
BASE_T = 2.5       # düz zemin kalınlığı (renk değişimi bu yükseklikte)
PAD_H = 1.0        # beyaz çizgi kabartma yüksekliği
FRAME = 6.0        # çizgilerin kenardan içeri mesafesi
LW = 3.0           # çizgi kalınlığı (beyaz)
PARK_D = 55.0      # park gözü derinliği (üst şerit)
NBAY = 4           # park gözü sayısı
DASH_LEN = 12.0    # kesikli çizgide çizgi uzunluğu
GAP = 8.0          # kesikli çizgide boşluk


def box_between(x0, x1, y0, y1, z0, z1):
    return Manifold.cube([x1-x0, y1-y0, z1-z0]).translate([x0, y0, z0])

def export(man, name):
    m = man.to_mesh()
    verts = np.asarray(m.vert_properties)[:, :3]
    tris  = np.asarray(m.tri_verts)
    data = np.zeros(len(tris), dtype=numpy_stl.Mesh.dtype)
    data['vectors'] = verts[tris]
    numpy_stl.Mesh(data).save(os.path.join(OUT, name))
    bb = verts.max(0) - verts.min(0)
    print(f"  {name:24s}  {bb[0]:5.1f} x {bb[1]:5.1f} x {bb[2]:5.1f} mm  ({len(tris)} üçgen)")


def park_alani():
    pz0, pz1 = BASE_T, BASE_T + PAD_H          # beyaz çizgi z aralığı
    base = box_between(0, W, 0, D, 0, BASE_T)  # DÜZ koyu zemin

    marks = None
    def add(p):
        nonlocal marks
        marks = p if marks is None else marks + p
    def bar(x0, x1, y0, y1):
        return box_between(x0, x1, y0, y1, pz0, pz1)

    x0, x1 = FRAME, W - FRAME
    y0, y1 = FRAME, D - FRAME
    ytop = y1
    ystrip = ytop - PARK_D

    # --- dış çerçeve (solid beyaz çizgi) ---
    add(bar(x0, x1, y0, y0+LW))                # alt
    add(bar(x0, x1, y1-LW, y1))                # üst (park arka çizgisi)
    add(bar(x0, x0+LW, y0, y1))                # sol
    add(bar(x1-LW, x1, y0, y1))                # sağ

    # --- park gözü bölücüleri (solid, dikey) ---
    for i in range(1, NBAY):
        xc = x0 + (x1 - x0) * i / NBAY
        add(bar(xc-LW/2, xc+LW/2, ystrip, ytop))
    # park ile şerit arası ayıraç (solid yatay)
    add(bar(x0, x1, ystrip-LW/2, ystrip+LW/2))

    # --- araç şeridi orta çizgisi (KESİKLİ kabartma) ---
    yc = (y0 + ystrip) / 2
    x = x0 + 4
    while x < x1 - 4:
        add(bar(x, min(x + DASH_LEN, x1 - 4), yc-LW/2, yc+LW/2))
        x += DASH_LEN + GAP

    return base + marks


if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(park_alani(), "park_alani.stl")
    print("Bitti -> stl/   (z=%.1fmm'de filament değiştir: koyu -> beyaz)" % BASE_T)
