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
# Yaslanma açısı ölçümle belirlendi, göz kararıyla değil.
#
# 18°'de nesne güzel duruyordu ama hacim merkezi taban arka kenarına 0.9 mm
# kalıyordu: masaya hafif bir dokunuş Elçin'i sırtüstü deviriyordu. Büyük ve
# yüksek bir kafa, yaslandıkça ağırlığı arkaya taşıyor. 10° hem "yukarı
# bakıyor" hissini koruyor hem 6 mm pay bırakıyor; alt bölmedeki ağırlık
# (bkz. montaj) bunu 10 mm'nin üzerine çıkarıyor.
LEAN = 10.0                  # geriye yaslanma açısı

# Gövde iki kürenin dış zarfı (hull): altta geniş göbek, üstte kafa.
# Yuvarlatılmış bir kutu "kutu" gibi duruyordu; oturan bir karakterin
# silueti için armut biçimi gerekiyor.
BELLY_R = 24.0               # gövde küresi yarıçapı
BELLY_Y = 18.0               # gövde merkezinin yüksekliği
# Kafa yarıçapı OLED'e göre belirlendi, keyfi değil: 35.5 × 33.5 mm'lik kart
# kürenin ÖN DÜZLEMİNDEKİ dar kesitine sığmalı. 27 mm'de kart köşeleri
# kabuktan 3.9 mm taşıyordu.
#
# Kafanın gövdeden büyük olması bir uzlaşma değil, kazanç: chibi oranı
# (büyük kafa, küçük gövde) karakteri animasyon figürüne yaklaştırıyor.
# ESP32 de kafanın içinde, OLED'in arkasında duruyor — gövdeye koyunca
# 52.5 mm'lik kart boyun bölgesindeki dar kesite girmiyordu.
#
# Not: ESP32-C3 Super Mini (22.5 × 18 mm) kullanırsan kafa 27 mm'ye kadar
# küçülebilir; DevKitM-1'in 52.5 mm'si burada belirleyici ölçü.
HEAD_R = 34.0                # kafa küresi yarıçapı
HEAD_Y = 48.0                # kafa merkezinin yüksekliği

INNER_D = 21.0
BODY_D = INNER_D + WALL + 2.6        # ön duvar + iç + kapak omzu
BODY_W = 2 * BELLY_R                 # en geniş yer
BODY_H = HEAD_Y + HEAD_R             # tepe noktası

# Kulaklar — pandayı panda yapan şey. Ayrı basılır (siyah filament),
# kafanın tepesine dikey geçmeyle oturur.
# Kulaklar panda kulağı: kafaya oranla küçük ve TEPEDE. Büyük ve yanlarda
# olunca Mickey'e dönüyordu.
EAR_R = 13.0
EAR_X = 21.0                 # merkezden yanal kayma
EAR_FLAT = 0.52              # derinlik yönünde yassılaştırma
EAR_PEG_D = 6.0
EAR_PEG_H = 7.0

# Kollar — yanlarda küçük patiler. Bunlar da siyah basılır.
ARM_R = 8.5
ARM_Y = 20.0
ARM_PEG_D = 5.0
ARM_PEG_H = 6.0

# Ayaklar gövdeye dahil: yükü taşıdıkları için geçme parçaya bırakılmıyor.
FOOT_R = 11.0
FOOT_X = 15.0

# Dikey yerleşim.
#
# ESP32 OLED'in ALTINA değil ARKASINA konuyor. Alt alta dizmek iki kartın
# yüksekliğini toplayıp gövdeyi 90 mm'ye çıkarıyordu — masada duran bir dost
# değil, mezar taşı. Arkaya alınca yükseklik yalnızca OLED'e bağlı kalıyor.
#
# Bunun bedeli montajda: OLED'in 4'lü header'ı TAKILMAZ, kablolar doğrudan
# pedlere lehimlenir. Header 8 mm derinlik yiyor ve ESP'nin yerini işgal ediyor.
OLED_ZONE = OLED_PCB_H + 3.0

# OLED kafanın ortasına, ESP32 göbeğe. Panda silüetinde kafa dar, göbek
# geniş — 52.5 mm'lik ESP kartı ancak göbekte yer buluyor.
OLED_CY = HEAD_Y - 3.0
ESP_CY = HEAD_Y - 4.0

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
    faces = verts[tris]

    # Sıfır alanlı üçgenleri at.
    #
    # Boole işlemleri kesişim düzlemlerinde dejenere üçgen bırakabiliyor.
    # Katı topolojik olarak sağlam (manifold status = NoError) ama bu
    # üçgenler kenar eşleşmesini bozuyor ve bazı dilimleyiciler "kapalı değil"
    # diye uyarıyor. Atmak hem güvenli hem de dosyayı küçültüyor.
    normals = np.cross(faces[:, 1] - faces[:, 0], faces[:, 2] - faces[:, 0])
    alan = np.linalg.norm(normals, axis=1) / 2.0
    saglam = alan > 1e-9
    atilan = int((~saglam).sum())
    faces = faces[saglam]

    data = np.zeros(len(faces), dtype=numpy_stl.Mesh.dtype)
    data["vectors"] = faces
    numpy_stl.Mesh(data).save(os.path.join(OUT, name))

    verts = faces.reshape(-1, 3)
    tris = faces

    size = verts.max(0) - verts.min(0)
    not_ = f"  ({atilan} dejenere atıldı)" if atilan else ""
    print(f"  {name:24s} {size[0]:5.1f} × {size[1]:5.1f} × {size[2]:5.1f} mm"
          f"  {len(tris):5d} üçgen  {man.volume() / 1000:5.1f} cm³{not_}")
    return man


# ────────────────────────────────────────────────────────────── parçalar

def boss_x():
    return BODY_W / 2 - 14.0


def boss_ys():
    """Vida kulelerinin yükseklikleri; alttaki masa kesiğinin üstünde durur."""
    desk_at_back = BODY_D * np.tan(np.radians(LEAN))
    return (desk_at_back + BOSS_D / 2 + 4.0, BODY_H - HEAD_R - 2.0)


def sphere_at(r, x, y, z, flat=1.0):
    """Merkezi verilen küre; `flat` derinlik yönünde yassılaştırır."""
    return Manifold.sphere(r, SEG).scale([1.0, 1.0, flat]).translate([x, y, z])


def blob(belly_r, belly_y, head_r, head_y, z):
    """
    Göbek ve kafa küreleri — hull değil BİRLEŞİM.

    hull() ikisini tek bir armuda dönüştürüyor ve kafa göbeğin içinde
    kayboluyordu. Birleşim aradaki boyun girintisini koruyor; karakteri
    karakter yapan da o girinti.

    Girinti baskıda sorun çıkarmıyor: gövde yüzü tablaya geldiği için
    siluetteki her şey tablaya paralel düzlemde kalıyor, hiçbir yerde askıda
    malzeme olmuyor.
    """
    return (sphere_at(belly_r, 0, belly_y, z)
            + sphere_at(head_r, 0, head_y, z))


def body_mass():
    """Gövdenin dış kütlesi: armut + ayaklar, ön ve arka düzlemlerden kesilmiş."""
    mass = blob(BELLY_R, BELLY_Y, HEAD_R, HEAD_Y, BODY_D / 2)

    # Ayaklar: öne doğru taşan iki yastık. Hem karakteri tamamlıyor hem de
    # yaslanan gövdenin öne devrilmesine karşı ön temas noktası veriyor.
    for sx in (-1, 1):
        mass += Manifold.batch_hull([
            sphere_at(FOOT_R, sx * FOOT_X, FOOT_R + 1.0, BODY_D / 2, 0.85),
            sphere_at(FOOT_R * 0.8, sx * FOOT_X, FOOT_R + 1.0, BODY_D * 0.78, 0.85),
        ])

    # Ön ve arka düz düzlemler: yüz paneli ve kapak oturma yüzeyi.
    return mass ^ slab(-200, 200, -200, 200, 0.0, BODY_D)


def inner_cavity():
    """İç boşluk: dış kütlenin WALL kadar içeri çekilmiş hâli."""
    cav = blob(BELLY_R - WALL, BELLY_Y, HEAD_R - WALL, HEAD_Y, BODY_D / 2)
    return cav ^ slab(-200, 200, -200, 200, WALL, BODY_D + 1.0)


def desk_cut(part):
    """
    Masaya oturan düz taban.

    Gövde geriye yaslandığı için taban, gövde eksenine dik değil; LEAN kadar
    eğik bir düzlemle kesilir. Arkada daha çok malzeme gider — nesne bu yüzden
    geriye yaslanır, öne değil.
    """
    cutter = slab(-200, 200, -200, 0.001, -200, 200)
    return part - cutter.rotate([-LEAN, 0, 0])


def back_outline(inset=0.0):
    """
    Gövdenin arka yüzündeki dış hat.

    Kapağı elle yeniden çizmek yerine gövdenin kesitini alıyoruz: silueti
    değiştirdiğimizde kapak kendiliğinden ona uyuyor, ikisi ayrı düşmüyor.
    """
    mass = blob(BELLY_R, BELLY_Y, HEAD_R, HEAD_Y, BODY_D / 2)
    cross = mass.slice(BODY_D - 0.05)
    if inset:
        cross = cross.offset(-inset, JoinType.Round, 2.0, SEG)
    return cross


def ear(side):
    """
    Kulak — ayrı parça, siyah filamentle basılır.

    Kafanın tepesine DİKEY geçmeyle oturuyor. Radyal bir geçme daha doğal
    dururdu ama eksen hizalı bir pim hem daha güçlü hem de desteksiz basılıyor.
    """
    # Kafa kubbesinin bu x konumundaki tepe noktası.
    dome_y = HEAD_Y + np.sqrt(max(HEAD_R ** 2 - EAR_X ** 2, 1.0))
    cy = dome_y + EAR_R * 0.45

    body = Manifold.batch_hull([
        sphere_at(EAR_R, 0, cy, BODY_D / 2, EAR_FLAT),
        sphere_at(EAR_R * 0.72, 0, cy - EAR_R * 0.7, BODY_D / 2, EAR_FLAT),
    ])
    # Kafaya gömülen kısmı at: kulak kubbenin üstünde kalsın.
    body -= slab(-40, 40, -40, dome_y - EAR_PEG_H, -40, BODY_D + 40)

    peg = Manifold.cylinder(EAR_PEG_H + 1.0, EAR_PEG_D / 2, EAR_PEG_D / 2, SEG)
    peg = peg.rotate([-90, 0, 0]).rotate([0, 0, 0])
    peg = Manifold.cylinder(EAR_PEG_H + 1.0, EAR_PEG_D / 2, EAR_PEG_D / 2, SEG)
    peg = peg.rotate([90, 0, 0]).translate([0, dome_y + 0.5, BODY_D / 2])

    return (body + peg).translate([side * EAR_X, 0, 0])


def ear_socket(side):
    """Kulak piminin gireceği yuva."""
    dome_y = HEAD_Y + np.sqrt(max(HEAD_R ** 2 - EAR_X ** 2, 1.0))
    hole = Manifold.cylinder(EAR_PEG_H + 2.0, (EAR_PEG_D + CL) / 2,
                             (EAR_PEG_D + CL) / 2, SEG)
    return hole.rotate([90, 0, 0]).translate([side * EAR_X, dome_y + 1.0, BODY_D / 2])


def arm(side):
    """Yandaki pati — ayrı parça, siyah basılır."""
    body = Manifold.batch_hull([
        sphere_at(ARM_R, 0, ARM_Y, BODY_D / 2, 0.8),
        sphere_at(ARM_R * 0.8, 0, ARM_Y - ARM_R * 0.9, BODY_D * 0.55, 0.8),
    ])
    peg = Manifold.cylinder(ARM_PEG_H + 2.0, ARM_PEG_D / 2, ARM_PEG_D / 2, SEG)
    peg = peg.rotate([0, 90, 0]).translate([-ARM_PEG_H - 1.0, ARM_Y, BODY_D / 2])

    part = body + peg
    if side > 0:
        part = part.mirror([1, 0, 0])
    # Gövde kenarına yaslanacak konuma taşı.
    edge = np.sqrt(max(BELLY_R ** 2 - (ARM_Y - BELLY_Y) ** 2, 1.0))
    return part.translate([side * (edge + ARM_PEG_H * 0.4), 0, 0])


def arm_socket(side):
    edge = np.sqrt(max(BELLY_R ** 2 - (ARM_Y - BELLY_Y) ** 2, 1.0))
    hole = Manifold.cylinder(ARM_PEG_H + 3.0, (ARM_PEG_D + CL) / 2,
                             (ARM_PEG_D + CL) / 2, SEG)
    hole = hole.rotate([0, 90, 0])
    if side > 0:
        hole = hole.mirror([1, 0, 0])
    return hole.translate([side * (edge + 1.0), ARM_Y, BODY_D / 2])


def front_shell():
    """
    Ön gövde — yüz, kart yuvaları, ayak.

    Baskı yönü: yüz tablada (Z=0 düzlemi). Pencere ilk katmanda bir delik
    olur, bütün kuleler +Z yönünde yukarı büyür, hiçbir yerde destek gerekmez.
    """
    shell = body_mass()

    # ---- iç boşluk (arkadan oyulur) ----
    shell -= inner_cavity()

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
    ledge = back_outline(1.2).extrude(LID_T + 0.2).translate([0, 0, BODY_D - LID_T])
    holes.append(ledge)

    # Kulak ve kol yuvaları.
    for side in (-1, 1):
        holes.append(ear_socket(side))
        holes.append(arm_socket(side))

    for part in solids:
        shell += part
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
    lid = back_outline(1.2 + CL / 2).extrude(LID_T).translate([0, 0, z0])

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
    print(f"\nElçin  {BODY_W:.1f} G × {BODY_D:.1f} D × {BODY_H:.1f} Y mm"
          f"   ({LEAN:.0f}° yaslı)\n")

    export(front_shell(), "elcin_govde.stl")
    export(back_lid(), "elcin_arka_kapak.stl")
    export(ear(-1).translate([EAR_X, 0, 0]), "elcin_kulak.stl")
    export(arm(-1), "elcin_kol.stl")
    export(fit_template(), "elcin_olcu_sablonu.stl")

    print("\n  Önce elcin_olcu_sablonu.stl bas. Modül oturmuyorsa OLED_*")
    print("  değerlerini düzelt ve bu betiği yeniden çalıştır.\n")


if __name__ == "__main__":
    main()
