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
BASE_T = 2.5       # koyu taban kalınlığı (renk değişimi bu yükseklikte)
PAD_H = 1.0        # beyaz kabartma yüksekliği
FRAME = 6.0        # dış çerçeve (koyu) kalınlığı
LINE  = 4.0        # çizgi (koyu boşluk) kalınlığı
PARK_D = 55.0      # park gözü derinliği (üst şerit)
NBAY = 4           # park gözü sayısı


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
    pz0, pz1 = BASE_T, BASE_T + PAD_H          # beyaz kabartma z aralığı
    base = box_between(0, W, 0, D, 0, BASE_T)  # KOYU taban (çerçeve+çizgiler+turnike burada görünür)

    pads = None
    def add(p):
        nonlocal pads
        pads = p if pads is None else pads + p

    # --- üst şerit: 4 park gözü (beyaz kabartma) ---
    ytop = D - FRAME
    ystrip = ytop - PARK_D
    innerw = W - 2*FRAME
    bw = (innerw - (NBAY-1)*LINE) / NBAY       # göz genişliği
    for i in range(NBAY):
        x0 = FRAME + i*(bw + LINE)
        add(box_between(x0, x0+bw, ystrip, ytop, pz0, pz1))

    # --- alt alan: araç şeridi (beyaz kabartma) ---
    laney1 = ystrip - LINE                     # park şeridi ile arasında koyu çizgi
    lane = box_between(FRAME, W-FRAME, FRAME, laney1, pz0, pz1)

    # turnike KUYUSU (koyu -> beyaz şeritten çıkar)
    lane -= box_between(14, 40, 16, 32, pz0-0.05, pz1+0.05)
    # turnike KOLU (koyu diyagonal çizgi)
    arm = box_between(0, 105, -1.7, 1.7, pz0-0.05, pz1+0.05).rotate([0, 0, 8.5]).translate([40, 29, 0])
    lane -= arm
    add(lane)

    return base + pads


if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(park_alani(), "park_alani.stl")
    print("Bitti -> stl/   (z=%.1fmm'de filament değiştir: koyu -> beyaz)" % BASE_T)
