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


def render(tris, view, size=(W, H), margin=0.10, harita=False, albedo=None):
    """
    Ortografik, z-tamponlu, düz gölgeli rasterizasyon.

    `harita=True` ise görüntüyle birlikte dünya→piksel dönüşümünü de döndürür;
    yüzü pencereye yapıştırmak için gerekiyor.

    `albedo` üçgen başına yüzey parlaklığı: kulaklar, kollar ve göz yaması
    siyah filamentle basılıyor. Hepsini beyaz göstermek önizlemeyi yalancı
    yapıyordu — Elçin'in iki renkli olduğu görünmüyordu.
    """
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
    if albedo is None:
        albedo = np.ones(len(v))
    tone = np.clip(18 + 228 * shade * albedo, 0, 255).astype(np.int32)

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

    if harita:
        def dunya_piksele(nokta):
            q = np.asarray(nokta, dtype=np.float64) @ view.T
            return np.array([(q[0] - cx) * scale + width / 2,
                             height / 2 - (q[1] - cy) * scale])
        return image.astype(np.uint8), dunya_piksele
    return image.astype(np.uint8)


def yuzu_yapistir(image, dunya_piksele, kose, yuz, mm=None, delik=None):
    """
    OLED yüzünü pencereye bas.

    Pencere bir delik olduğu için render onun arkasındaki havalandırma
    yarıklarını gösteriyor ve Elçin yüzsüz duruyor. Oysa oraya 128 × 64'lük
    ekran geliyor. Yüzü aynı izdüşümle pencereye yapıştırınca nesnenin
    gerçekte nasıl göründüğü çıkıyor — bu da tasarım kararı verdiren şey.

    `kose`: pencerenin dünya koordinatındaki sol-üst, sağ-üst, sol-alt köşesi.
    `delik`: maskenin açıklığı — dikdörtgenin dışına taşan pikseller
    boyanmaz, yoksa 2B yapıştırma siyah maskenin üstünü de siliyor.
    """
    su = dunya_piksele(kose[0])
    sag = dunya_piksele(kose[1]) - su
    alt = dunya_piksele(kose[2]) - su

    fh, fw = yuz.shape
    m = np.array([[sag[0] / fw, alt[0] / fh], [sag[1] / fw, alt[1] / fh]])
    if abs(np.linalg.det(m)) < 1e-9:
        return image
    ters = np.linalg.inv(m)

    hepsi = np.array([su, su + sag, su + alt, su + sag + alt])
    x0, y0 = np.floor(hepsi.min(0)).astype(int)
    x1, y1 = np.ceil(hepsi.max(0)).astype(int)
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, image.shape[1] - 1), min(y1, image.shape[0] - 1)
    if x1 <= x0 or y1 <= y0:
        return image

    gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5,
                         np.arange(y0, y1 + 1) + 0.5)
    d = np.stack([gx - su[0], gy - su[1]], axis=-1)
    uv = d @ ters.T
    u = uv[..., 0]
    v = uv[..., 1]
    icinde = (u >= 0) & (u < fw) & (v >= 0) & (v < fh)
    if delik is not None and mm is not None:
        icinde &= delik((u / fw - 0.5) * mm[0], (0.5 - v / fh) * mm[1])
    ui = np.clip(u.astype(int), 0, fw - 1)
    vi = np.clip(v.astype(int), 0, fh - 1)
    parca = image[y0:y1 + 1, x0:x1 + 1]
    # Cam siyah, yanan piksel beyaz.
    parca[icinde] = np.where(yuz[vi, ui][icinde] > 127, 245, 8)
    return image


def oku_yuz(yol):
    """render_faces'in yazdığı 128 × 64 PGM."""
    if not os.path.exists(yol):
        return None
    with open(yol, "rb") as handle:
        veri = handle.read()
    parcalar = veri.split(b"\n", 3)
    w, h = (int(n) for n in parcalar[1].split())
    return np.frombuffer(parcalar[3], dtype=np.uint8, count=w * h).reshape(h, w)


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
    kaydir = world[:, 2].min()
    world[:, 2] -= kaydir
    donusum = rot_x(lean) @ BUILD_TO_WORLD

    def uret_dunyaya(nokta):
        q = donusum @ np.asarray(nokta, dtype=np.float64)
        return q - np.array([0.0, 0.0, kaydir])

    return world.reshape(-1, 3, 3), uret_dunyaya


def main():
    from elcin_kutu_uret import LEAN, BODY_D, LID_T, EAR_X

    body = load("elcin_govde.stl")
    # Kapak baskıya hazır hâlde dışa aktarılıyor: DIŞ yüzü tablada, ESP
    # rayları yukarı. Montaj konumuna almak için ters çevirip gövdenin
    # arkasına taşımak gerekiyor — baskı yönünü olduğu gibi yerleştirirsek
    # raylar dışarı bakar ve önizleme yalan söyler.
    lid = load("elcin_arka_kapak.stl") - np.array([0.0, 0.0, LID_T])
    lid = (lid.reshape(-1, 3) @ rot_x(180).T).reshape(-1, 3, 3)
    lid = lid + np.array([0.0, 0.0, BODY_D - LID_T])

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

    # Göz yaması baskı yönünde dışa aktarılıyor; yüzdeki oyuğa geri taşı.
    from elcin_kutu_uret import MASK_T, OLED_CY, OLED_GLASS_DY
    mask = load("elcin_goz_yamasi.stl") + np.array(
        [0.0, OLED_CY + OLED_GLASS_DY, -MASK_T])

    # Beyaz filament / siyah filament ayrımı — Elçin tek renkli yazıcıda da
    # iki renkli çıkıyor, önizleme bunu göstermeli.
    beyaz = [body, lid]
    siyah = [ear + np.array([EAR_X, 0.0, 0.0]),
             ear + np.array([-EAR_X, 0.0, 0.0]),
             arm, mirror_x(arm), mask]
    assembled = np.concatenate(beyaz + siyah)
    albedo = np.concatenate([np.full(len(p), 1.0) for p in beyaz]
                            + [np.full(len(p), 0.17) for p in siyah])

    seated, uret_dunyaya = sitting(assembled, LEAN)

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

    # Pencerenin dünya köşeleri — yüzü buraya yapıştıracağız.
    from elcin_kutu_uret import (OLED_CY, OLED_GLASS_DY, OLED_PIXEL_H,
                                 OLED_PIXEL_W, WINDOW_H, WINDOW_W)
    win_y = OLED_CY + OLED_GLASS_DY

    def kose_kutusu(w, h):
        return [uret_dunyaya([-w / 2, win_y + h / 2, 0.0]),
                uret_dunyaya([w / 2, win_y + h / 2, 0.0]),
                uret_dunyaya([-w / 2, win_y - h / 2, 0.0])]

    yuz = oku_yuz(os.path.join(HERE, "..", "esp32", "test", "out", "yuz.pgm"))

    from elcin_kutu_uret import (HOLE_BRIDGE_A, HOLE_BRIDGE_B, HOLE_R, HOLE_X)

    def maske_deligi(x, y):
        """Göz yamasının açıklığı — gövdedeki geometriyle aynı ifade."""
        iki_daire = (((x - HOLE_X) ** 2 + y ** 2 <= HOLE_R ** 2)
                     | ((x + HOLE_X) ** 2 + y ** 2 <= HOLE_R ** 2))
        kopru = (x / HOLE_BRIDGE_A) ** 2 + (y / HOLE_BRIDGE_B) ** 2 <= 1.0
        return iki_daire | kopru

    print("\nElçin gövdesi önizleme\n")
    for name, view in views.items():
        image, dunya_piksele = render(seated, view, harita=True, albedo=albedo)
        if name in ("on", "uc_boyut") and yuz is not None:
            # Önce cam (sönük siyah), sonra yanan piksel alanı.
            yuzu_yapistir(image, dunya_piksele, kose_kutusu(WINDOW_W, WINDOW_H),
                          np.zeros((2, 2), dtype=np.uint8),
                          mm=(WINDOW_W, WINDOW_H), delik=maske_deligi)
            yuzu_yapistir(image, dunya_piksele,
                          kose_kutusu(OLED_PIXEL_W, OLED_PIXEL_H), yuz,
                          mm=(OLED_PIXEL_W, OLED_PIXEL_H), delik=maske_deligi)
        write_pgm(os.path.join(OUT, f"govde_{name}.pgm"), image)

    write_pgm(os.path.join(OUT, "sablon.pgm"),
              render(load("elcin_olcu_sablonu.stl"), rot_x(-55) @ to_screen))
    write_pgm(os.path.join(OUT, "goz_yamasi.pgm"),
              render(load("elcin_goz_yamasi.stl"), rot_x(-55) @ to_screen,
                     albedo=np.full(len(load("elcin_goz_yamasi.stl")), 0.17)))
    print()


if __name__ == "__main__":
    main()
