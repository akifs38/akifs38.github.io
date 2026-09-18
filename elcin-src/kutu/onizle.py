#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STL önizleyici.

Kutuyu göremeden tasarlamak, OLED yüzünü göremeden çizmek gibi: sayılar
tutuyor olabilir ama nesnenin "dost gibi mi duruyor" sorusunu ancak bakarak
cevaplarsın. Bu betik STL'leri yazılımdan rasterize eder — harici bağımlılık
yok, sadece numpy.

    python3 onizle.py           ->  onizleme/*.pgm
    python3 ../esp32/tools/to_png.py onizleme/*.pgm
"""

import os

import numpy as np
from stl import mesh as numpy_stl

HERE = os.path.dirname(os.path.abspath(__file__))
STL = os.path.join(HERE, "stl")
OUT = os.path.join(HERE, "onizleme")
os.makedirs(OUT, exist_ok=True)

W, H = 420, 480
BG = 26


def rot_x(deg):
    a = np.radians(deg)
    return np.array([[1, 0, 0], [0, np.cos(a), -np.sin(a)], [0, np.sin(a), np.cos(a)]])


def rot_y(deg):
    a = np.radians(deg)
    return np.array([[np.cos(a), 0, np.sin(a)], [0, 1, 0], [-np.sin(a), 0, np.cos(a)]])


def load(name):
    m = numpy_stl.Mesh.from_file(os.path.join(STL, name))
    return np.asarray(m.vectors, dtype=np.float64)


def render(tris, view, size=(W, H), margin=0.10):
    """Ortografik, z-tamponlu, düz gölgeli rasterizasyon."""
    width, height = size
    v = tris.reshape(-1, 3) @ view.T
    v = v.reshape(-1, 3, 3)

    lo, hi = v.reshape(-1, 3).min(0), v.reshape(-1, 3).max(0)
    span = max(hi[0] - lo[0], hi[1] - lo[1])
    if span <= 0:
        span = 1.0
    scale = min(width, height) * (1 - 2 * margin) / span
    cx, cy = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2

    px = (v[:, :, 0] - cx) * scale + width / 2
    py = height / 2 - (v[:, :, 1] - cy) * scale
    pz = v[:, :, 2]

    # Yüzey normali; ışık gözden hafif sol üstte.
    e1 = v[:, 1] - v[:, 0]
    e2 = v[:, 2] - v[:, 0]
    n = np.cross(e1, e2)
    length = np.linalg.norm(n, axis=1, keepdims=True)
    n = np.divide(n, np.where(length == 0, 1, length))
    light = np.array([-0.4, 0.5, 0.77])
    light = light / np.linalg.norm(light)
    # Ortam + dağınık. Ortam olmadan kenar yüzeyler tamamen siyah kalıyor ve
    # siluet okunmuyor.
    shade = 0.22 + 0.78 * np.clip(n @ light, 0, 1)
    tone = np.clip(28 + 218 * shade, 0, 255).astype(np.int32)

    image = np.full((height, width), BG, dtype=np.int32)
    zbuf = np.full((height, width), -1e18)

    for i in range(len(v)):
        x0, x1, x2 = px[i]
        y0, y1, y2 = py[i]
        area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
        if abs(area) < 1e-9:
            continue

        xmin = max(int(np.floor(min(x0, x1, x2))), 0)
        xmax = min(int(np.ceil(max(x0, x1, x2))), width - 1)
        ymin = max(int(np.floor(min(y0, y1, y2))), 0)
        ymax = min(int(np.ceil(max(y0, y1, y2))), height - 1)
        if xmin > xmax or ymin > ymax:
            continue

        xs = np.arange(xmin, xmax + 1)
        ys = np.arange(ymin, ymax + 1)
        gx, gy = np.meshgrid(xs + 0.5, ys + 0.5)

        # Barisentrik koordinatlar
        w0 = ((x1 - x0) * (gy - y0) - (gx - x0) * (y1 - y0)) / area
        w1 = ((gx - x0) * (y2 - y0) - (x2 - x0) * (gy - y0)) / area
        w2 = 1.0 - w0 - w1
        inside = (w0 >= 0) & (w1 >= 0) & (w2 >= 0)
        if not inside.any():
            continue

        z = w2 * pz[i, 0] + w1 * pz[i, 1] + w0 * pz[i, 2]
        patch = zbuf[ymin:ymax + 1, xmin:xmax + 1]
        win = inside & (z > patch)
        if not win.any():
            continue

        patch[win] = z[win]
        image[ymin:ymax + 1, xmin:xmax + 1][win] = tone[i]

    return image.astype(np.uint8)


def write_pgm(path, image):
    with open(path, "wb") as handle:
        handle.write(f"P5\n{image.shape[1]} {image.shape[0]}\n255\n".encode())
        handle.write(image.tobytes())
    print(f"  {os.path.relpath(path, HERE)}  ({image.shape[1]}×{image.shape[0]})")


# İnşa uzayı → dünya: X genişlik, Y gövde ekseni (yukarı), Z derinlik.
#
# Dikkat: Y ve Z'yi düpedüz takas etmek bir YANSIMADIR (determinant -1) ve
# üçgenlerin sarım yönünü ters çevirir; normaller içeri bakar, model tamamen
# karanlık çıkar. Doğrusu X ekseni etrafında +90° dönüş.
BUILD_TO_WORLD = rot_x(90)


def sitting(tris, lean):
    """
    Parçayı masada durduğu gibi yerleştirir.

    İşaret önemli: gövdenin tepesi ARKAYA (world -Y) gitmeli. X etrafında
    +lean bunu verir; -lean nesneyi öne eğip tabanı yatay olmaktan çıkarıyordu.
    Toplam dönüş rot_x(90 + lean).
    """
    world = tris.reshape(-1, 3) @ BUILD_TO_WORLD.T
    world = world @ rot_x(lean).T
    # Tabanı Z = 0'a otur: masa yüzeyi.
    world[:, 2] -= world[:, 2].min()
    return world.reshape(-1, 3, 3)


def main():
    from elcin_kutu_uret import LEAN, BODY_D, LID_T, EAR_X

    body = load("elcin_govde.stl")
    # Kapak baskıya hazır hâlde (Z=0) dışa aktarılıyor; montajda gövdenin
    # arkasına oturur. Önizlemede de oraya taşınmalı.
    lid = load("elcin_arka_kapak.stl") + np.array([0.0, 0.0, BODY_D - LID_T])

    # Kulak ve kol tek parça üretiliyor, iki kez basılıyor.
    # Kulak X'te simetrik olduğu için yalnızca ötelenir; kol değil, aynalanır.
    ear = load("elcin_kulak.stl")          # merkezde üretiliyor
    arm = load("elcin_kol.stl")

    def mirror_x(tris):
        out = tris.copy()
        out[:, :, 0] *= -1
        # Aynalama sarım yönünü ters çevirir; normaller içeri dönmesin diye
        # köşe sırası düzeltilir.
        return out[:, ::-1, :]

    parts = [body, lid,
             ear + np.array([EAR_X, 0.0, 0.0]),
             ear + np.array([-EAR_X, 0.0, 0.0]),
             arm, mirror_x(arm)]
    assembled = np.concatenate(parts)

    seated = sitting(assembled, LEAN)

    # Dünya: X sağa, Y derinlik (ön yüz 0, arka -D), Z yukarı.
    #
    # BUILD_TO_WORLD = rot_x(90) olduğu için ön yüz world_y = 0'da, arka
    # world_y = -D'de kalıyor; bu kamera nesneyi ARKADAN görür. Ön görünüş
    # için 180° çevirmek gerekiyor. (Matrisi elle "düzeltmek" yansıma üretir
    # ve normalleri yine ters çevirirdi.)
    to_screen = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], dtype=np.float64)

    views = {
        "on": rot_y(180) @ to_screen,                 # yüz penceresi burada
        "arka": to_screen,                            # havalandırma ve USB
        "yan": rot_y(90) @ to_screen,                 # yaslanma ve ayak
        "uc_boyut": rot_y(215) @ to_screen,           # üç çeyrek, önden
    }

    print("\nElçin gövdesi önizleme\n")
    for name, view in views.items():
        write_pgm(os.path.join(OUT, f"govde_{name}.pgm"), render(seated, view))

    write_pgm(os.path.join(OUT, "sablon.pgm"),
              render(load("elcin_olcu_sablonu.stl"), rot_x(-55) @ to_screen))
    print()


if __name__ == "__main__":
    main()
