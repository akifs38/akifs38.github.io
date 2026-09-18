#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Elçin'in gövdesi — masada duran bir dost.

Tasarım proje kutusu değil, masa nesnesi:
  · 18° geriye yaslanır — masada oturan biri Elçin'e yukarıdan bakar; dik
    duran bir yüz insanın göğsüne bakıyormuş gibi durur.
  · Arkada ayak var — yaslanınca devrilmesin, ağırlık merkezi tabanda kalsın.
  · Alt gövdede ağırlık cebi; birkaç somun Elçin'i masaya oturtur.
  · Kablo arkadan aşağı çıkar, masada görünmez.
  · Ön yüzde vida yok; Gülçin'in gördüğü yüzey temiz.
  · Dokunma yüzeyi tepede — elin doğal olarak indiği yer.

    pip install manifold3d numpy-stl
    python3 elcin_kutu_uret.py     ->  stl/*.stl   (mm)

ÖLÇÜLER: aşağıdaki modül boyutları piyasada yaygın olanlara göre. Kendi
OLED'ini ve kartını KUMPASLA ölç. Önce ölçü şablonunu bas — 5 dakika sürer ve
4 saatlik baskıyı çöpe atmanı engeller.

BASKI YÖNÜ: parçalar baskıya hazır dışa aktarılıyor (gövdenin yüzü tablada).
Slicer'da döndürme.
"""

import os

import numpy as np
from manifold3d import CrossSection, JoinType, Manifold
from stl import mesh as numpy_stl

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stl")
os.makedirs(OUT, exist_ok=True)
SEG = 64

# ───────────────────────────────────────────────────── modüller (ÖLÇ!)

OLED_PCB_W, OLED_PCB_H, OLED_PCB_T = 35.5, 33.5, 1.4
OLED_GLASS_W, OLED_GLASS_H = 30.0, 16.5
OLED_GLASS_DY = 4.0          # kart merkezinden cam merkezine (+ = yukarı)
OLED_HOLE_DX, OLED_HOLE_DY = 30.5, 28.5
OLED_HOLE_D = 2.2            # M2

ESP_L, ESP_W, ESP_T = 52.5, 20.3, 1.6
ESP_COMP_H = 7.0             # üst yüz bileşen yüksekliği

TOUCH_W, TOUCH_H, TOUCH_T = 15.0, 11.0, 1.6

# ────────────────────────────────────────────────────────────── gövde
#
# İnşa uzayı (= baskı uzayı):
#   X  genişlik, ortalı
#   Y  gövde ekseni: 0 = alt, +Y yukarı
#   Z  derinlik: 0 = ÖN YÜZ (baskı tablası), +Z arkaya
#
# Masada dururken gövde X ekseni etrafında LEAN kadar geriye yatar.

WALL = 2.6
CL = 0.4
LEAN = 18.0                  # geriye yaslanma açısı
CORNER_R = 12.0              # ön siluetin köşe yarıçapı
SIDE_R = 9.0                 # yan siluetin köşe yarıçapı (üst kenarı yuvarlar)

INNER_W = 58.0
INNER_D = 21.0
BODY_W = INNER_W + 2 * WALL          # 63.2
BODY_D = INNER_D + WALL + 2.6        # ön duvar + iç + kapak omzu

# Dikey yerleşim.
#
# ESP32 OLED'in ALTINA değil ARKASINA konuyor. Alt alta dizmek iki kartın
# yüksekliğini toplayıp gövdeyi 90 mm'ye çıkarıyordu — masada duran bir dost
# değil, mezar taşı. Arkaya alınca yükseklik yalnızca OLED'e bağlı kalıyor.
#
# Bunun bedeli montajda: OLED'in 4'lü header'ı TAKILMAZ, kablolar doğrudan
# pedlere lehimlenir. Header 8 mm derinlik yiyor ve ESP'nin yerini işgal ediyor.
TOP_MARGIN = 6.0
OLED_ZONE = OLED_PCB_H + 3.0
BOTTOM_ZONE = 14.0           # kablo toplama + ağırlık bölgesi
INNER_H = TOP_MARGIN + OLED_ZONE + BOTTOM_ZONE
BODY_H = INNER_H + 2 * WALL

# Kartların merkez yükseklikleri (gövde tabanından).
OLED_CY = BODY_H - WALL - TOP_MARGIN - OLED_ZONE / 2
ESP_CY = WALL + BOTTOM_ZONE + ESP_W / 2 + 2.0

OLED_STANDOFF = 3.0          # ön duvarın arkasından OLED kartının ön yüzüne
ESP_STANDOFF = 12.0          # ön duvardan ESP kartının ön yüzüne (OLED'in arkası)

WINDOW_W = OLED_GLASS_W + 1.6
WINDOW_H = OLED_GLASS_H + 1.6
TOUCH_MEMBRANE = 1.2         # dokunma sensörünün üstünde kalan zar

# Arka kapak
LID_T = 2.6
BOSS_D = 7.4
BOSS_PILOT = 2.7             # M3 kendinden kılavuz
LID_CLEAR = 3.4
LID_HEAD = 6.4

# Vida kulelerinin yükseklikleri.
#
# Alt kule, masa kesiğinin ÜSTÜNDE kalmalı. Kesik arka yüzde
# BODY_D*tan(LEAN) kadar malzeme götürüyor; kuleyi oraya koyunca kılavuz
# deliği tabanda açığa çıkıyor ve vida tutacak et kalmıyordu.
BOSS_LOW_Y = None   # main() içinde hesaplanır
BOSS_HIGH_Y = None

# Ayak: arkada, yaslanan gövdeyi tutar.
FOOT_DEPTH = 15.0            # gövdenin arkasından taşan miktar
FOOT_H = 26.0                # ayağın gövdeye bağlandığı yükseklik
FOOT_TAPER = 30.0            # arkaya doğru incelme açısı


# ─────────────────────────────────────────────────────────── yardımcılar

def slab(x0, x1, y0, y1, z0, z1):
    """Eksen hizalı katı; tüm sınırlar açıkça verilir."""
    return Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0])


def rounded_slab(w, h, z0, z1, r, seg=SEG):
    """XY'de ortalı, köşeleri yuvarlatılmış, Z aralığı verilen prizma."""
    r = max(min(r, w / 2 - 0.01, h / 2 - 0.01), 0.01)
    core = CrossSection.square([w - 2 * r, h - 2 * r], center=True)
    return core.offset(r, JoinType.Round, 2.0, seg).extrude(z1 - z0).translate([0, 0, z0])


def post_z(x, y, z0, z1, d, seg=SEG):
    """+Z boyunca silindir (ön yüzden arkaya doğru kule)."""
    return Manifold.cylinder(z1 - z0, d / 2, d / 2, seg).translate([x, y, z0])


def export(man, name, tilt_preview=False):
    m = man.to_mesh()
    verts = np.asarray(m.vert_properties)[:, :3]
    tris = np.asarray(m.tri_verts)

    data = np.zeros(len(tris), dtype=numpy_stl.Mesh.dtype)
    data["vectors"] = verts[tris]
    numpy_stl.Mesh(data).save(os.path.join(OUT, name))

    size = verts.max(0) - verts.min(0)
    print(f"  {name:24s} {size[0]:5.1f} × {size[1]:5.1f} × {size[2]:5.1f} mm"
          f"  {len(tris):5d} üçgen  {man.volume() / 1000:5.1f} cm³  genus {man.genus()}")
    return man


# ────────────────────────────────────────────────────────────── parçalar

def boss_x():
    return BODY_W / 2 - WALL - BOSS_D / 2 + 0.6


def boss_ys():
    """Vida kulelerinin yükseklikleri; alttaki masa kesiğinin üstünde durur."""
    desk_at_back = BODY_D * np.tan(np.radians(LEAN))
    low = desk_at_back + BOSS_D / 2 + 2.0
    high = BODY_H - WALL - BOSS_D / 2 - 2.0
    return (low, high)


def body_profile(w, h, z0, z1, r):
    """Ön siluet: XY'de yuvarlatılmış, Z'de z0..z1, Y'de 0..h."""
    return rounded_slab(w, h, z0, z1, r).translate([0, h / 2, 0])


def side_profile(h, d, x0, x1, r):
    """
    Yan siluet: YZ düzleminde yuvarlatılmış, X boyunca uzatılmış.

    rotate([90, 0, 90]) eksenleri (x,y,z) → (z,x,y) olarak çevirir; böylece
    XY'de üretilen profil YZ'ye taşınır ve uzama X'e geçer.
    """
    prism = rounded_slab(h, d, 0.0, x1 - x0, r).rotate([90, 0, 90])
    return prism.translate([x0, h / 2, d / 2])


def rounded_body(w, h, d, front_r, side_r):
    """
    İki görünüşün kesişimi.

    Yalnızca ön siluet yuvarlatılınca üst kenar keskin 90° kalıyor ve nesne
    masada dost değil mezar taşı gibi duruyordu. Yan silueti de yuvarlayıp
    kesiştirmek, tepeyi ve alt kenarları birlikte yumuşatıyor.
    """
    return body_profile(w, h, 0.0, d, front_r) ^ side_profile(h, d, -w / 2, w / 2, side_r)


def desk_cut(part):
    """
    Masaya oturan düz taban.

    Gövde geriye yaslandığı için taban, gövde eksenine dik değil; LEAN kadar
    eğik bir düzlemle kesilir. Arkada daha çok malzeme gider — bu yüzden
    nesne geriye yaslanır, öne değil.
    """
    cutter = slab(-BODY_W, BODY_W, -BODY_H, 0.001, -BODY_D, 2 * BODY_D)
    cutter = cutter.rotate([-LEAN, 0, 0])
    return part - cutter


def front_shell():
    """
    Ön gövde — yüz, kart yuvaları, ayak.

    Baskı yönü: yüz tablada (Z=0 düzlemi). Pencere ilk katmanda bir delik
    olur, bütün kuleler +Z yönünde yukarı büyür, hiçbir yerde destek gerekmez.
    """
    shell = rounded_body(BODY_W, BODY_H, BODY_D, CORNER_R, SIDE_R)

    # ---- arkadaki topuk ----
    #
    # Gövde geriye yaslandığı için ağırlık merkezi arka kenara yaklaşıyor;
    # topuk devrilme payını açıyor. Ama düz bir fin olarak durursa sonradan
    # yapıştırılmış gibi görünüyor — bu yüzden gövdeye yüksekten bağlanıp
    # arkaya doğru inceliyor, oturan bir şeyin topuğu gibi.
    foot = body_profile(BODY_W - 12.0, FOOT_H, BODY_D - 8.0, BODY_D + FOOT_DEPTH,
                        CORNER_R * 0.75)

    # İnceltme: gövdeden uzaklaştıkça yüksekliği düşüren eğik düzlem.
    taper = slab(-BODY_W, BODY_W, 0.0, FOOT_H + 30.0,
                 -BODY_D, BODY_D + FOOT_DEPTH + 20.0)
    taper = taper.rotate([FOOT_TAPER, 0, 0]).translate([0, FOOT_H, BODY_D - 6.0])
    foot -= taper

    # Topuğun gövdeyle birleştiği yerde keskin iç köşe kalmasın.
    shell = shell + foot

    # ---- iç boşluk (arkadan oyulur) ----
    # Boşluk da yan profille kırpılıyor; aksi halde yuvarlatılmış tepeden
    # dışarı taşıp duvarı deliyor.
    cavity = body_profile(INNER_W, INNER_H, WALL, BODY_D + 0.1,
                          max(CORNER_R - WALL, 1.0)).translate([0, WALL, 0])
    cavity = cavity ^ side_profile(BODY_H - 2 * WALL, BODY_D, -BODY_W, BODY_W,
                                   max(SIDE_R - WALL, 1.0)).translate([0, WALL, 0])
    shell -= cavity

    holes, solids = [], []

    # ---- yüz penceresi ----
    win_y = OLED_CY + OLED_GLASS_DY
    holes.append(slab(-WINDOW_W / 2, WINDOW_W / 2,
                      win_y - WINDOW_H / 2, win_y + WINDOW_H / 2,
                      -1.0, WALL + 0.6))
    # İç pah: cam kenarı çerçevede gölge yapmasın.
    holes.append(slab(-(WINDOW_W + 3) / 2, (WINDOW_W + 3) / 2,
                      win_y - (WINDOW_H + 3) / 2, win_y + (WINDOW_H + 3) / 2,
                      WALL, WALL + 1.0))

    # ---- OLED kuleleri ----
    for sx in (-1, 1):
        for sy in (-1, 1):
            x = sx * OLED_HOLE_DX / 2
            y = OLED_CY + sy * OLED_HOLE_DY / 2
            solids.append(post_z(x, y, WALL, WALL + OLED_STANDOFF, 5.4))
            holes.append(post_z(x, y, WALL - 0.5,
                                WALL + OLED_STANDOFF + OLED_PCB_T + 1.5, OLED_HOLE_D))

    # ---- ESP32 yuvası ----
    # Vida yerine iki ray arasında oluk: küçük kartı dört vidayla tutturmak
    # montajı zorlaştırıyor, kart oluğa kayarak giriyor.
    esp_z0 = WALL + ESP_STANDOFF
    for sy in (-1, 1):
        y = ESP_CY + sy * (ESP_W / 2 + 1.6)
        solids.append(slab(-(ESP_L + 8) / 2, (ESP_L + 8) / 2,
                           y - 1.6, y + 1.6, WALL, esp_z0 + 3.0))
    holes.append(slab(-(ESP_L + CL * 2) / 2, (ESP_L + CL * 2) / 2,
                      ESP_CY - ESP_W / 2 - CL, ESP_CY + ESP_W / 2 + CL,
                      esp_z0, esp_z0 + ESP_T + CL))
    # Kartı arkadan iten tırnak yerine açık uç: kart yandan sürülür.
    holes.append(slab(-(ESP_L + 10) / 2, (ESP_L + 10) / 2,
                      ESP_CY - ESP_W / 2 + 3, ESP_CY + ESP_W / 2 - 3,
                      WALL, esp_z0 + ESP_T + ESP_COMP_H))

    # ---- dokunma sensörü (tepede, gövdenin içinde) ----
    # Sensör üst duvarın içine gömülür; üstünde ince bir zar kalır. Kapasitif
    # algılama zardan geçer; delik açmak sensörü toza ve neme açardı.
    ty0 = BODY_H - WALL - TOUCH_MEMBRANE - (TOUCH_T + 0.6)
    holes.append(slab(-(TOUCH_W + CL * 2) / 2, (TOUCH_W + CL * 2) / 2,
                      ty0, ty0 + TOUCH_T + 0.6,
                      WALL + 1.0, WALL + 1.0 + TOUCH_H + CL * 2))
    holes.append(slab(-3.0, 3.0, ty0 - 6.0, ty0 + 1.0, WALL + 2.0, WALL + 8.0))

    # ---- kapak vida kuleleri ----
    for sx in (-1, 1):
        for y in boss_ys():
            solids.append(post_z(sx * boss_x(), y, WALL, BODY_D - LID_T, BOSS_D))
            holes.append(post_z(sx * boss_x(), y, WALL + 2.5, BODY_D - LID_T + 0.5,
                                BOSS_PILOT))

    # ---- kapak omzu ----
    ledge = body_profile(BODY_W - 2.4, BODY_H - 2.4, BODY_D - LID_T, BODY_D + 0.1,
                         max(CORNER_R - 1.2, 1.0))
    holes.append(ledge.translate([0, 1.2, 0]))

    for s in solids:
        shell += s
    for h in holes:
        shell -= h

    return desk_cut(shell)


def back_lid():
    """
    Arka kapak.

    Montaj konumunda (z = BODY_D - LID_T) kurulur, gövdeyle aynı masa
    kesiğinden geçirilir, sonra baskı için düzleme indirilir. Kesiği
    uygulamazsak kapak gövdenin kesilmiş alt kenarından aşağı taşıyor ve
    Elçin kapağın köşesine basarak duruyordu.
    """
    z0 = BODY_D - LID_T
    lid = rounded_slab(BODY_W - 2.4 - CL, BODY_H - 2.4 - CL, z0, z0 + LID_T,
                       max(CORNER_R - 1.2, 1.0))
    lid = lid.translate([0, (BODY_H - 2.4 - CL) / 2 + 1.2, 0])

    for sx in (-1, 1):
        for y in boss_ys():
            lid -= post_z(sx * boss_x(), y, z0 - 0.5, z0 + LID_T + 0.5, LID_CLEAR)
            head = Manifold.cylinder(2.0, LID_HEAD / 2, LID_CLEAR / 2, SEG)
            lid -= head.rotate([180, 0, 0]).translate([sx * boss_x(), y, z0 + 2.0])

    # Havalandırma: ESP32 hizasında yatay yarıklar.
    for i in range(6):
        y = ESP_CY - 12 + i * 5.0
        lid -= slab(-14, 14, y - 1.2, y + 1.2, z0 - 0.5, z0 + LID_T + 0.5)

    # USB-C çıkışı: masa kesiğinin hemen üstünde çentik; kablo topuğun
    # üzerinden arkaya çıkar, masada görünmez.
    usb_y = BODY_D * np.tan(np.radians(LEAN)) + 1.0
    lid -= slab(-7.0, 7.0, usb_y, usb_y + 9.0, z0 - 0.5, z0 + LID_T + 0.5)

    lid = desk_cut(lid)
    # Baskı için düzleme indir.
    return lid.translate([0, 0, -z0])


def fit_template():
    """
    Ölçü şablonu — 5 dakikalık deneme baskısı.

    Yüz penceresi, OLED delikleri ve kart dış hattı. Modül oturmuyorsa bunu
    bir kez basmak, tam gövdeyi iki kez basmaktan ucuz.
    """
    w, h = OLED_PCB_W + 18, OLED_PCB_H + 18
    plate = rounded_slab(w, h, 0.0, 3.0, 4.0)

    plate -= slab(-WINDOW_W / 2, WINDOW_W / 2,
                  OLED_GLASS_DY - WINDOW_H / 2, OLED_GLASS_DY + WINDOW_H / 2,
                  -1.0, 4.0)

    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * OLED_HOLE_DX / 2, sy * OLED_HOLE_DY / 2
            plate += post_z(x, y, 3.0, 3.0 + OLED_STANDOFF, 5.4)
            plate -= post_z(x, y, -0.5, 3.0 + OLED_STANDOFF + 2.0, OLED_HOLE_D)

    # Kart dış hattını gösteren sığ oluk.
    outer = rounded_slab(OLED_PCB_W + CL * 2, OLED_PCB_H + CL * 2, 2.4, 3.2, 1.0)
    inner = rounded_slab(OLED_PCB_W - 1.6, OLED_PCB_H - 1.6, 2.2, 3.4, 1.0)
    plate -= (outer - inner)

    return plate


def main():
    print(f"\nElçin gövdesi  {BODY_W:.1f} G × {BODY_D:.1f} D × {BODY_H:.1f} Y mm"
          f"   ({LEAN:.0f}° yaslı, ayakla derinlik {BODY_D + FOOT_DEPTH:.1f})\n")

    export(front_shell(), "elcin_on_govde.stl")
    export(back_lid(), "elcin_arka_kapak.stl")
    export(fit_template(), "elcin_olcu_sablonu.stl")

    print("\n  Önce elcin_olcu_sablonu.stl bas. Modül oturmuyorsa OLED_*")
    print("  değerlerini düzelt ve bu betiği yeniden çalıştır.\n")


if __name__ == "__main__":
    main()
