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

def box_between(x0, x1, y0, y1, z0, z1):
    # köşe koordinatlarıyla kutu (ortalama yok)
    return Manifold.cube([x1-x0, y1-y0, z1-z0]).translate([x0, y0, z0])

def hole_y(d, x, z):
    # Y ekseni boyunca uzanan delik (kelepçe vidası için)
    return Manifold.cylinder(200, d/2, d/2, SEG, True).rotate([90, 0, 0]).translate([x, 0, z])

def taper(sx, sy, bx, by, z0, z1):
    # z0'da (sx,sy) -> z1'de (bx,by) daralan/genişleyen 45°'lik geçiş (destek azaltır)
    a = box(sx, sy, 0.1).translate([0, 0, z0])
    b = box(bx, by, 0.1).translate([0, 0, z1 - 0.1])
    return (a + b).hull()

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


# SG90 ile gelen 2-KOLLU (düz) horn ölçüleri — gerçek aparata göre
HORN = dict(dt=5.0, hub_d=7.4, arm_half=16.5, arm_w=6.6, depth=2.6,
            screw_r=10.0, screw_d=2.2, hubscrew_d=5.0, hubscrew_depth=3.4)

def horn_disc():
    """Servo horn'una oturan disk: SG90'ın 2-kollu plastik horn'unu ALTTAN
       içine kilitleyen yuva + horn kol deliklerine tespit vidaları +
       merkez (spline) vida başı boşluğu. Disk üst yüzü z = HORN['dt']."""
    H = HORN
    d = cyl(H['dt'], 26)
    # 2-kollu horn yuvası (alttan, derinlik kadar): hub dairesi + düz kol kanalı
    rec  = cyl(H['depth'], H['hub_d'])
    rec += box_between(-H['arm_half'], H['arm_half'], -H['arm_w']/2, H['arm_w']/2, 0, H['depth'])
    d -= rec
    # merkez spline vidasının başı için boşluk (alttan)
    d -= cyl(H['hubscrew_depth'], H['hubscrew_d'])
    # horn'un kol deliklerine 2 tespit vidası (parçayı horn'a tutturur)
    d -= hole(H['screw_d']).translate([ H['screw_r'], 0, 0])
    d -= hole(H['screw_d']).translate([-H['screw_r'], 0, 0])
    return d


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
    # kule yükselticiyi bağlama (arka, y=-30) — riser taban deliğiyle (±9.5) aynı
    for sx in (-1, 1):
        m -= hole(M3).translate([sx*9.5, -30, 0])
    # riser kablo kanalının tabanın altına çıkışı
    m -= box(12, 12, 20).translate([0, -30, -2])
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
    # YANDAN KABLO ÇIKIŞI: gövde cebini -Y dış yüzeye bağlayan kanal
    holder -= box_between(-4, 4, -22, -5, 5, 13)
    return holder

# ============================================================================
# 3) FLAME SENSOR TUTUCU (alt servonun horn'una oturur)
#    Tipik alev sensörü kartı: ~32x14x1.6mm PCB, önde IR "göz",
#    arkada 3-4 pin header, üstte trimpot/LED. Kart DİK durur, göz öne bakar.
# ============================================================================
FS = dict(pcb_l=32.0, pcb_w=14.0, pcb_t=1.6)   # alev sensörü kartı ölçüsü

def flame_sensor_tutucu():
    P_T = FS['pcb_t']; cl = 0.5
    yf = P_T + cl                                # kartın ön yüzü (dudak/kanca iç yüzü)
    z0 = HORN['dt']                              # disk üstü (yapı buradan başlar)
    # SG90 horn'una kilitlenen disk
    part  = horn_disc()
    # destek kolu (disk -> kelepçe tabanı)
    part += box_between(-3, 22, -4, 4, z0, z0+4)
    # ARKA PLAKA: kart bu yüzeye (+Y) yaslanır
    part += box_between(6, 22, -3, 0, z0, z0+20)
    # TABAN: kartın alt kenarı buraya oturur (üst z = z0+4)
    part += box_between(6, 22, -3, 3, z0+2, z0+4)
    # ÖN ALT DUDAK: kartı +Y'den tutar; tabana bindirilir
    part += box_between(6, 22, yf, 3.4, z0+3, z0+8)
    # ÜST TUTUCU: arka plakadan kartın üstünden geçen köprü + öne sarkan kanca
    part += box_between(10, 18, -3, 3.4, z0+18, z0+20)
    part += box_between(10, 18, yf, 3.4, z0+16, z0+18)
    # kart montaj vidası (arka plakadan, M2.5 kendinden kılavuz)
    part -= hole_y(2.3, 12, z0+11)
    # SENSÖR KABLOSU: arka kenarda dikey kablo çentiği + zip-tie delikleri
    part -= cyl(z0+4, 5).translate([-9, 0, -1])
    part -= hole(2.6).translate([-6, 6, 0])
    part -= hole(2.6).translate([-6, -6, 0])
    return part

# ============================================================================
# 4) KULE YÜKSELTİCİ (üst servoyu kaldıran dikme)
# ============================================================================
def kule_yukseltici():
    H = 55.0
    col_top = H - 4
    out  = box(18, 18, col_top)            # kare dikme
    out += taper(18, 18, 40, 22, col_top-12, col_top)  # üst flanş altına 45° pah (desteksiz)
    base = box(26, 22, 4)                  # alt flanş (tabla üstünde basılır)
    top  = box(40, 22, 4).translate([0, 0, col_top])   # üst flanş
    tower = base + out + top
    # SÜREKLİ KABLO KANALI: taban + gövde + üst boyunca tam geçer (11x11)
    tower -= box(11, 11, H+10).translate([0, 0, -5])
    # YANDAN KABLO ÇIKIŞI (üst servonun kablosu kule içinden inip buradan çıkar)
    tower -= box(10, 12, 9).translate([9, 0, 8])
    # taban montaj delikleri (kanaldan uzakta, yanlarda)
    for sx in (-1, 1):
        tower -= hole(M3).translate([sx*9.5, 0, 0])
    # üst montaj delikleri (üst servo tutucu deseniyle aynı: ±15, ±7)
    for sx in (-1, 1):
        for sy in (-1, 1):
            tower -= hole(M3).translate([sx*15, sy*7, col_top])
    return tower

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
    # KABLO AŞAĞI: gövde cebini ayağın altına (kule kanalına) bağlayan merkez geçiş
    holder -= box(11, 11, 12).translate([0, 0, -1])
    return holder

# ============================================================================
# 6) NOZÜL KELEPÇESİ (üst servo horn'una oturur, su borusunu tutar)
#    C-kelepçe: bore ekseni +X (İLERİ) -> hortum ileri bakar, su ileri fışkırır.
#    Üstteki ince yarıktan hortum bastırılıp içeri klipslenir (Ø8 hortum).
# ============================================================================
def nozul_kelepcesi():
    z0 = HORN['dt']
    cz = z0 + 7.0                                # hortum ekseni yüksekliği
    part  = horn_disc()                          # SG90 horn'una kilitlenen disk
    part += box_between(-3, 30, -6, 6, z0, z0+4) # disk -> kelepçe destek kolu
    # C-kelepçe gövdesi (eksen +X boyunca)
    part += cyl(16, 14).rotate([0, 90, 0]).translate([22, 0, cz])
    # Ø8 hortum deliği (ileri doğru, önden açık)
    part -= cyl(22, 8.0).rotate([0, 90, 0]).translate([20, 0, cz])
    # üstten klips yarığı: hortum buradan bastırılıp geçirilir
    part -= box_between(22, 38, -1.1, 1.1, cz, cz + 8)
    return part


# ============================================================================
# 7) MONTAJ — tüm parçalar gerçek konumlarında + basit SG90 gövdeleri
#    (yalnızca görsel referans; baskı için tekil parçaları kullan)
# ============================================================================
def sg90_model(x, y, flange_top_z, rot_deg=0):
    """Basitleştirilmiş SG90: gövde + flanş + şaft + horn diski.
       (x,y) konumda, flanş üst yüzeyi flange_top_z'de, şaft yukarı.
       Döndürülmüş model + horn üst z + şaft xy döner."""
    bl, bw, bh = SG['body_l'], SG['body_w'], SG['body_h']
    body_top = flange_top_z + SG['flg_top']
    soff = SG['shaft_off']
    m  = box(bl, bw, bh).translate([0, 0, body_top - bh])
    m += box(SG['flg_l'], SG['flg_w'], SG['flg_t']).translate([0, 0, flange_top_z - SG['flg_t']])
    m += cyl(4.0, 5.0).translate([soff, 0, body_top])          # şaft
    m += cyl(2.0, 18.0).translate([soff, 0, body_top + 4])     # horn diski
    m = m.rotate([0, 0, rot_deg]).translate([x, y, 0])
    # şaftın döndürülmüş xy konumu
    a = np.radians(rot_deg)
    sx = x + soff*np.cos(a); sy = y + soff*np.sin(a)
    return m, (sx, sy), body_top + 6

def montaj():
    a = taban_plakasi()

    # --- Alt servo tutucu + servo (merkez, tarama) ---
    a += alt_servo_tutucu().translate([0, 0, 4])               # ayak taban üstünde
    holder_top = 24 + 4                                        # = 28 (flanş buraya gömülü)
    servoL, shaftL, hornTopL = sg90_model(0, 0, holder_top, rot_deg=35)
    a += servoL
    # flame sensor tutucu, alt servo horn'una (tarama açısı 35°)
    a += flame_sensor_tutucu().rotate([0, 0, 35]).translate([shaftL[0], shaftL[1], hornTopL])

    # --- Kule yükseltici (arkada) + üst servo + nozül ---
    ry = -30.0
    a += kule_yukseltici().translate([0, ry, 4])
    riser_top = 55 + 4                                         # = 59
    a += ust_servo_tutucu().translate([0, ry, riser_top])
    up_holder_top = riser_top + 24
    servoU, shaftU, hornTopU = sg90_model(0, ry, up_holder_top, rot_deg=70)
    a += servoU
    a += nozul_kelepcesi().rotate([0, 0, 70]).translate([shaftU[0], shaftU[1], hornTopU])

    return a


# ----------------------------------------------------------------------------
if __name__ == "__main__":
    print("STL üretiliyor (mm):")
    export(taban_plakasi(),     "01_taban_plakasi.stl")
    export(alt_servo_tutucu(),  "02_alt_servo_tutucu.stl")
    export(flame_sensor_tutucu(), "03_flame_sensor_tutucu.stl")
    export(kule_yukseltici(),   "04_kule_yukseltici.stl")
    export(ust_servo_tutucu(),  "05_ust_servo_tutucu.stl")
    export(nozul_kelepcesi(),   "06_nozul_kelepcesi.stl")
    export(montaj(),            "00_MONTAJ.stl")
    print("Bitti -> stl/")
