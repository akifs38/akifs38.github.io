#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arduino Yangın Kulesi — baskıya hazır parça üreteci (parametrik).
SG90 servo ölçülerine göre tüm braketleri CSG ile üretir ve STL olarak yazar.

Gereksinim:  pip install manifold3d numpy-stl
Çalıştır:    python3 parcalar_uret.py   ->  stl/*.stl

Tüm ölçüler MİLİMETRE. FDM baskı için ~0.4mm tolerans (CLEAR) eklenmiştir.
"""
import os
import numpy as np
from manifold3d import Manifold
from stl import mesh as numpy_stl

OUT = os.path.join(os.path.dirname(__file__), "stl")
os.makedirs(OUT, exist_ok=True)

# ----------------------------------------------------------------------------
# SG90 STANDART ÖLÇÜLERİ (nominal)
# ----------------------------------------------------------------------------
SG = dict(
    body_l   = 22.8,   # gövde uzunluğu
    body_w   = 12.2,   # gövde genişliği
    body_h   = 22.7,   # gövde yüksekliği (şaft hariç)
    flg_l    = 32.0,   # kulaklar dahil flanş uzunluğu
    flg_w    = 12.2,   # flanş genişliği
    flg_t    = 2.6,    # flanş kalınlığı
    flg_top  = 6.7,    # flanşın gövde ÜSTÜNE olan uzaklığı (şaft tarafı)
    tab_sp   = 28.0,   # iki montaj deliği merkez arası
    tab_d    = 2.3,    # montaj deliği çapı (M2 vida)
    shaft_off= 5.9,    # şaftın gövde merkezine göre kayıklığı
)
CLEAR = 0.45           # baskı toleransı
M3 = 3.4               # M3 geçme deliği
SEG = 64               # silindir segment sayısı (yuvarlaklık)


# ----------------------------------------------------------------------------
# Yardımcılar
# ----------------------------------------------------------------------------
def box(x, y, z, center_xy=True):
    m = Manifold.cube([x, y, z])
    if center_xy:
        m = m.translate([-x/2, -y/2, 0])
    return m

def cyl(h, d, center_z=False):
    m = Manifold.cylinder(h, d/2, d/2, SEG, center_z)
    return m

def hole(d, h=200):
    # z ekseni boyunca, ortalı uzun delik
    return cyl(h, d, center_z=True)

def export(man, name):
    m = man.to_mesh()
    verts = np.asarray(m.vert_properties)[:, :3]
    tris  = np.asarray(m.tri_verts)
    data = np.zeros(len(tris), dtype=numpy_stl.Mesh.dtype)
    data['vectors'] = verts[tris]
    numpy_stl.Mesh(data).save(os.path.join(OUT, name))
    bb = verts.max(0) - verts.min(0)
    print(f"  {name:34s}  {bb[0]:5.1f} x {bb[1]:5.1f} x {bb[2]:5.1f} mm  ({len(tris)} üçgen)")


def servo_pocket_negative(z0):
    """SG90'ın şaft-yukarı oturacağı NEGATİF hacim:
       gövde cebi (boydan boya) + üstte flanş için cep + flanş vida delikleri.
       z0: tutucunun ÜST yüzey z'si (flanş bu yüzeye gömülür)."""
    bl, bw = SG['body_l']+CLEAR, SG['body_w']+CLEAR
    fl, fw, ft = SG['flg_l']+CLEAR, SG['flg_w']+CLEAR, SG['flg_t']+CLEAR
    neg  = box(bl, bw, 120).translate([0, 0, z0-119])          # gövde cebi (alta doğru)
    neg += box(fl, fw, ft+0.2).translate([0, 0, z0-ft])        # flanş gömme cebi (üstte)
    for sx in (-SG['tab_sp']/2, SG['tab_sp']/2):
        neg += hole(SG['tab_d']).translate([sx, 0, z0])         # kulak vida delikleri
    return neg


def horn_mount_holes():
    """SG90 plastik horn'unu parçaya bağlamak için merkez + 2 yan delik."""
    h  = hole(2.2)                                  # merkez (şaft M2)
    h += hole(1.8).translate([ 5.0, 0, 0])          # horn vidası
    h += hole(1.8).translate([-5.0, 0, 0])
    return h


# ============================================================================
# 1) TABAN PLAKASI
# ============================================================================
def taban_plakasi():
    L, T = 90.0, 4.0
    m = box(L, L, T)
    # köşe M3 delikleri
    for sx in (-1, 1):
        for sy in (-1, 1):
            m -= hole(M3).translate([sx*(L/2-7), sy*(L/2-7), 0])
    # alt servo tutucuyu bağlama deseni (40x40 ayak)
    for sx in (-1, 1):
        for sy in (-1, 1):
            m -= hole(M3).translate([sx*15, sy*15, 0])
    # kule yükselticisini bağlama (köşeye yakın 2 delik)
    m -= hole(M3).translate([28, 28, 0])
    m -= hole(M3).translate([28, 16, 0])
    # merkez kablo/şaft boşluğu
    m -= box(26, 16, 20).translate([0, 0, -2])
    return m

# ============================================================================
# 2) ALT SERVO TUTUCU (TARAMA — şaft yukarı)
# ============================================================================
def alt_servo_tutucu():
    H = 20.0                       # gövde tutucu yüksekliği
    foot = 40.0                    # ayak ölçüsü
    # gövde bloğu (flanştan biraz geniş)
    blk = box(SG['flg_l']+6, SG['body_w']+8, H)
    # ayak
    foot_m = box(foot, foot, 4).translate([0, 0, 0])
    holder = foot_m + blk.translate([0, 0, 4])
    # servo negatifi (üst yüzey z = H+4)
    holder -= servo_pocket_negative(H+4)
    # ayağı tabana bağlama delikleri
    for sx in (-1, 1):
        for sy in (-1, 1):
            holder -= hole(M3).translate([sx*15, sy*15, 0])
    # yandan kablo çıkışı
    holder -= box(8, 20, 8).translate([SG['flg_l']/2, 0, 7])
    return holder

# ============================================================================
# 3) SENSÖR PLATFORMU (alt servonun horn'una oturur, alev sensörü taşır)
# ============================================================================
def sensor_platformu():
    # horn diski
    disc = cyl(3, 24).translate([0, 0, 0])
    disc -= horn_mount_holes()
    # öne uzanan kol
    arm = box(10, 12, 3).translate([16, 0, 0])
    part = disc + arm
    # uçta dik sensör kartı yuvası (PCB ~32x14x1.6, kenarından kızaklı tutulur)
    wall = box(4, 18, 20).translate([22, 0, 0])
    part += wall
    # PCB kızak kanalı (1.8mm kalınlık + tolerans), dik
    slot = box(2.2, 15, 16).translate([22, 0, 4])
    part -= slot
    # sensör pinleri/kablo için arka açıklık
    part -= box(6, 8, 12).translate([22, 0, 6])
    return part

# ============================================================================
# 4) KULE YÜKSELTİCİ (üst servoyu kaldıran dikme)
# ============================================================================
def kule_yukseltici():
    H = 55.0
    # içi boş kare dikme
    out = box(18, 18, H)
    out -= box(11, 11, H+2).translate([0, 0, -1])     # ağırlık azalt
    # alt flanş (tabana 2 delik)
    base = box(26, 22, 4)
    base -= hole(M3).translate([0, 6, 0])
    base -= hole(M3).translate([0, -6, 0])
    # üst flanş (üst servo tutucuya bağlanır)
    top = box(40, 22, 4).translate([0, 0, H-4])
    for sx in (-1, 1):
        for sy in (-1, 1):
            top -= hole(M3).translate([sx*15, sy*7, H-4])
    return base + out + top

# ============================================================================
# 5) ÜST SERVO TUTUCU (HEDEFLEME — şaft yukarı, kule üstüne)
# ============================================================================
def ust_servo_tutucu():
    H = 20.0
    blk = box(SG['flg_l']+6, SG['body_w']+8, H)
    foot = box(40, 22, 4)
    holder = foot + blk.translate([0, 0, 4])
    holder -= servo_pocket_negative(H+4)
    # kuleye bağlama delikleri (kule üst flanşıyla aynı desen)
    for sx in (-1, 1):
        for sy in (-1, 1):
            holder -= hole(M3).translate([sx*15, sy*7, 0])
    holder -= box(8, 20, 8).translate([SG['flg_l']/2, 0, 7])
    return holder

# ============================================================================
# 6) NOZÜL KELEPÇESİ (üst servo horn'una oturur, su borusunu tutar)
# ============================================================================
def nozul_kelepcesi():
    # horn diski
    disc = cyl(3, 24)
    disc -= horn_mount_holes()
    # öne kol
    arm = box(26, 10, 4).translate([16, 0, 1])
    part = disc + arm
    # boru kelepçesi (dış çap ~12, iç ~8 boru için) ucu
    ring = cyl(12, 14, center_z=False).rotate([90, 0, 0]).translate([28, 0, 6])
    part += ring
    part -= cyl(16, 8.0, center_z=True).rotate([90, 0, 0]).translate([28, 0, 6])  # boru deliği Ø8
    # üstten yarık (boru geçsin / sıksın)
    part -= box(2.2, 16, 8).translate([28, 0, 11])
    return part


# ----------------------------------------------------------------------------
if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(taban_plakasi(),     "01_taban_plakasi.stl")
    export(alt_servo_tutucu(),  "02_alt_servo_tutucu.stl")
    export(sensor_platformu(),  "03_sensor_platformu.stl")
    export(kule_yukseltici(),   "04_kule_yukseltici.stl")
    export(ust_servo_tutucu(),  "05_ust_servo_tutucu.stl")
    export(nozul_kelepcesi(),   "06_nozul_kelepcesi.stl")
    print("Bitti -> stl/")
