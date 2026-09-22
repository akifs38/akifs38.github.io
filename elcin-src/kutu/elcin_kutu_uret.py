#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Elçin'in gövdesi — masada duran bir dost.

Tasarım proje kutusu değil, masa nesnesi:
  · 10° geriye yaslanır — masada oturan biri Elçin'e yukarıdan bakar; dik
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

# OLED modülü: 27.0 × 27.0 × 4.1 mm (0.96" sınıfı, SSD1306 128×64, I2C).
OLED_PCB_W, OLED_PCB_H, OLED_PCB_T = 27.0, 27.0, 4.1

# Cam (görünen siyah yüzey) 27 × 16 — modülün tam genişliğinde, kartın üst
# yarısında. Yanan piksel alanı bunun içinde ve daha küçük: 128 × 64 piksel,
# 0.17 mm adımla 21.7 × 10.9 mm.
OLED_GLASS_W, OLED_GLASS_H = 27.0, 16.0
OLED_PIXEL_W, OLED_PIXEL_H = 21.7, 10.9   # camın içindeki yanan alan
OLED_GLASS_DY = 1.5          # modül merkezinden cam merkezine (+ = yukarı)

# Delik aralığı 23 mi 24 mü kesin değil. Kılavuz deliği köşegen yönünde
# OLED_HOLE_SLOT kadar oval açılıyor; ikisi de aynı kuleye oturuyor.
OLED_HOLE_DX, OLED_HOLE_DY = 23.0, 23.0
OLED_HOLE_SLOT = 1.2         # köşegen boyunca oval uzunluğu (23 ↔ 24)
OLED_HOLE_D = 2.2            # M2
# Modülde montaj deliği yoksa kuleler dayanak görevi görür; modül çift taraflı
# bantla ön duvara yapıştırılır.

# ESP32-C3 Super Mini — 23 × 18 mm, en kalın yeri (USB soketi dâhil) 5 mm.
ESP_L, ESP_W = 23.0, 18.0
ESP_T = 1.2                  # kartın kendisi
ESP_COMP_H = 3.8             # üstündeki en yüksek bileşen → toplam 5.0 mm

TOUCH_W, TOUCH_H, TOUCH_T = 15.0, 11.0, 1.6      # TTP223

# TP4056 şarj modülü (Type-C)
TP_W, TP_H, TP_T = 26.5, 17.0, 5.0   # ölçüldü, doğrulandı
TP_USB_W, TP_USB_H = 9.5, 3.6        # Type-C soketi
TP_USB_CL = 1.5                      # soket açıklığına pay

# Li-Po pil
BAT_W, BAT_H, BAT_T = 40.0, 30.0, 5.0
BAT_CL = 1.0                         # pil şişebilir; bol pay bırak

# Aç/kapa anahtarı — delik ölçüsü kullanıcıdan
SW_W, SW_H = 20.0, 5.0

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
BELLY_R = 32.0               # gövde küresi yarıçapı (pil buraya giriyor)
BELLY_Y = 26.0               # gövde merkezinin yüksekliği
# Göbek yarıçapını pil belirliyor: 40 × 30'luk hücrenin köşesi, kürenin ön
# düzlemine yakın kesitinde 29.6 mm'ye düşüyor; duvarla birlikte 32 mm'nin
# altına inmek pili dışarı taşırıyor.
#
# Kafanın gövdeden büyük olması bir uzlaşma değil, kazanç: chibi oranı
# (büyük kafa, küçük gövde) karakteri animasyon figürüne yaklaştırıyor.
# ESP32 de kafanın içinde, OLED'in arkasında duruyor.
#
# Kafa yarıçapını elektronik DEĞİL siluet belirliyor. 27 × 27 OLED için
# 24.4 mm yetiyor; ama göbek 40 mm'lik pili almak için 32 mm'ye çıkmak
# zorunda ve kafa göbekten küçük olursa karakter armuda dönüyor. 33 mm,
# pandayı panda tutan en küçük değer.
HEAD_R = 33.0                # kafa küresi yarıçapı
HEAD_Y = 54.0                # kafa merkezinin yüksekliği

INNER_D = 24.0
BODY_D = INNER_D + WALL + 2.6        # ön duvar + iç + kapak omzu
# En geniş yer kafa da olabilir göbek de; ikisinin büyüğü.
# Önceden göbekten hesaplanıyordu ve kafa daha genişken kapak dar kalıyordu.
BODY_W = 2 * max(BELLY_R, HEAD_R)
BODY_H = HEAD_Y + HEAD_R             # tepe noktası

# Kulaklar — pandayı panda yapan şey. Ayrı basılır (siyah filament),
# kafanın tepesine dikey geçmeyle oturur.
# Kulaklar panda kulağı: kafaya oranla küçük ve TEPEDE. Büyük ve yanlarda
# olunca Mickey'e dönüyordu.
EAR_R = 13.0
EAR_X = 20.0                 # merkezden yanal kayma  (kafa tepesinde)
EAR_FLAT = 0.52              # derinlik yönünde yassılaştırma
EAR_PEG_D = 6.0
EAR_PEG_H = 7.0

# Kollar — yanlarda küçük patiler. Bunlar da siyah basılır.
ARM_R = 8.5
ARM_Y = 24.0
ARM_PEG_D = 5.0
ARM_PEG_H = 6.0

# Ayaklar gövdeye dahil: yükü taşıdıkları için geçme parçaya bırakılmıyor.
FOOT_R = 11.0
FOOT_X = 16.0

# Dikey yerleşim.
#
# ESP32 OLED'in ARKASINDA ama ön kabukta DEĞİL — ARKA KAPAKTA.
#
# Kartı ön kabuğa tutturmayı denedim: rayların ön duvardan yükselmesi
# gerekiyor ve 27 × 27'lik OLED tam o hizada duruyor. Raylar modülün içinden
# geçiyordu. Rayları OLED'in arkasından başlatmak da işe yaramıyor; baskıda
# havada kalıyorlar.
#
# Kapağa alınca sorun kendiliğinden bitiyor: raylar kapağın iç yüzünden
# yükseliyor, OLED'in 4.1–8.2 mm bandına hiç girmiyor, kapak düz basıldığı
# için de hiçbir yerde destek gerekmiyor.
#
# Bedeli montajda: kapağı açarken OLED kabloları kapakla birlikte geliyor,
# o yüzden 6 cm bolluk bırakılıyor. Ayrıca OLED'in 4'lü header'ı TAKILMAZ,
# kablolar doğrudan pedlere lehimlenir.
OLED_ZONE = OLED_PCB_H + 3.0

# OLED'i kafa merkezinin 2 mm üstüne almak zorunluydu: 27 mm boyundaki modül
# aşağıdayken alt kenarı y = 37.5'e iniyor, 40 × 30'luk pil ise y = 42'ye
# çıkıyor. İkisi aynı derinlik bandında (z ≈ 4–9) olduğu için BİRBİRİNE
# giriyorlardı — kabuk testi ikisini ayrı ayrı denetlediği için bunu
# göstermiyordu. Şimdi pilin üstü 41, modülün altı 42.5.
OLED_CY = HEAD_Y + 2.0

# Göbek yerleşimi: pil önde (ön duvarın hemen arkasında), TP4056 onun
# arkasında. İkisi de yüze paralel; pil ağırlığın çoğu olduğu için mümkün
# olduğunca alçakta duruyor, bu da devrilme payını açıyor.
BAT_CY = BELLY_Y - 1.0       # daha aşağısı masa kesiğine değiyor, daha yukarısı OLED'e
BAT_Z = 0.0                  # main() içinde WALL + 1.0 olarak kullanılıyor
TP_CY = BELLY_Y - 4.0
SW_CY = BELLY_Y + 16.0       # anahtar, pilin üstünde kalan boşlukta
# ESP32 kafa merkezinde: küre orada en geniş ve OLED'in tam arkasına
# düşüyor, kablolar kısalıyor.
ESP_CY = HEAD_Y

OLED_STANDOFF = 1.5          # ön duvarın arkasından modülün ön yüzüne
ESP_LID_GAP = 1.6            # kapağın iç yüzünden kartın arka yüzüne

# Pencere camdan DAR. Cam modülün tam genişliğinde (27 mm) olduğu için
# camı birebir açmak demek kartın kenarını da açmak demek; 24 mm'de her iki
# yanda 1.5 mm'lik bir çerçeve camın kenarını örtüyor.
#
# Yükseklikte camın kart üzerindeki yeri ±1.5 mm belirsiz, o yüzden pencere
# yanan alandan (10.9 mm) cömert biçimde büyük: cam nereye denk gelirse
# gelsin piksel alanı tamamen açıkta kalıyor.
WINDOW_W = 24.0
WINDOW_H = 16.0
TOUCH_MEMBRANE = 1.2         # dokunma sensörünün üstünde kalan zar

# ── Göz yaması (siyah maske) ──────────────────────────────────────────────
#
# 24 × 16'lık pencere 66 mm'lik kafada çıkartma gibi duruyordu: yüz alanı
# kafanın %6'sı. Ekranı büyütmek mümkün değil (modül 27 × 27), kafayı
# küçültmek de mümkün değil (göbek pili almak için 32 mm yarıçapta).
#
# Çözüm pandanın kendi çözümü: pencerenin çevresine siyah göz yaması.
# Ayrı basılıyor (kulak ve kollarla aynı siyah filament), yüzdeki 1 mm'lik
# oyuğa oturuyor. Yüz alanı %6'dan %21'e çıkıyor ve ekran nerede durursa
# dursun kırpılmıyor — maske pencereyi ÇEVRELİYOR, örtmüyor.
MASK_A = 14.0                # göz yaması yarı-eni
MASK_B = 12.0                # yarı-boyu
MASK_X = 10.0                # merkezden kayma
MASK_DY = 1.0                # yamaların merkezden yukarı kayması
MASK_TILT = 16.0             # dışa doğru yatma (derece)
MASK_BRIDGE_A = 14.0         # iki yamayı birleştiren orta elips
MASK_BRIDGE_B = 10.5
MASK_RECESS = 1.0            # yüzdeki oyuk derinliği
MASK_PROUD = 1.0             # yüzden dışarı taşan miktar

# Maskenin deliği dikdörtgen DEĞİL: dikdörtgen delik ekranı vizör gibi
# gösteriyordu. İki daire + ortada köprü, ekranı iki göz çukuruna çeviriyor.
# Ölçüler yanan alandan (21.7 × 10.9) türetildi: gözler ±4, kaşlar ±7 mm'de
# duruyor, ikisi de daire içinde kalıyor; köşeler zaten boş.
HOLE_R = 7.0                 # göz çukuru yarıçapı
HOLE_X = 4.7                 # çukurların merkezden kayması
HOLE_BRIDGE_A = 7.0          # ortadaki köprü elipsi (ağız buradan görünüyor)
HOLE_BRIDGE_B = 5.5

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


def oled_pilot(sx, sy, cy, z0, z1):
    """
    OLED vidasının kılavuz deliği — köşegen boyunca oval.

    Delik aralığının 23 mi 24 mm mi olduğu kesin değil. Yuvarlak delik
    açarsak yanlış tahminde vida hiç girmiyor. Köşegen yönünde
    OLED_HOLE_SLOT kadar uzatılmış bir oval ikisini de kabul ediyor;
    M2 zaten plastiğe kendi dişini açtığı için oval delik tutuşu bozmuyor.
    """
    r = OLED_HOLE_SLOT / 2
    ux, uy = sx / np.sqrt(2), sy / np.sqrt(2)
    x = sx * OLED_HOLE_DX / 2
    y = cy + sy * OLED_HOLE_DY / 2
    return Manifold.batch_hull([
        post_z(x - ux * r, y - uy * r, z0, z1, OLED_HOLE_D),
        post_z(x + ux * r, y + uy * r, z0, z1, OLED_HOLE_D),
    ])


def mask_profile(z0, z1, pay=0.0):
    """
    Göz yamasının dış hattı: iki yana yatmış elips + ortada birleştirici.

    Tek bir dikdörtgen ya da tek elips "vizör" gibi duruyor; iki yamanın
    birleşimi panda yüzünü veriyor.
    """
    disk = Manifold.cylinder(z1 - z0, 1.0, 1.0, SEG).translate([0, 0, z0])
    şekil = disk.scale([MASK_BRIDGE_A - pay, MASK_BRIDGE_B - pay, 1.0])
    for sx in (-1, 1):
        şekil += (disk.scale([MASK_A - pay, MASK_B - pay, 1.0])
                      .rotate([0, 0, -sx * MASK_TILT])
                      .translate([sx * MASK_X, MASK_DY, 0]))
    return şekil.translate([0, OLED_CY + OLED_GLASS_DY, 0])


def hole_profile(z0, z1):
    """
    Maskenin deliği: iki göz çukuru + ortada köprü.

    Gövdedeki dikdörtgen pencerenin (24 × 16) İÇİNDE kalıyor; taşsaydı
    maskenin kenarından beyaz kabuk görünürdü.
    """
    disk = Manifold.cylinder(z1 - z0, 1.0, 1.0, SEG).translate([0, 0, z0])
    şekil = disk.scale([HOLE_BRIDGE_A, HOLE_BRIDGE_B, 1.0])
    for sx in (-1, 1):
        şekil += disk.scale([HOLE_R, HOLE_R, 1.0]).translate([sx * HOLE_X, 0, 0])
    return şekil.translate([0, OLED_CY + OLED_GLASS_DY, 0])


def face_mask():
    """
    Siyah göz yaması — ayrı basılır, yüzdeki oyuğa oturur.

    Penceresi gövdedekinden 0.6 mm dar: siyah kenar beyaz kabuğun pencere
    ağzını örtsün, arada beyaz bir kıl payı görünmesin. Yanan piksel alanı
    (21.7 × 10.9) buna rağmen tamamen açıkta kalıyor.
    """
    part = mask_profile(-MASK_PROUD, MASK_RECESS, pay=CL / 2)
    part -= hole_profile(-MASK_PROUD - 1.0, MASK_RECESS + 1.0)
    # Baskı: görünen yüz tablada, düz. Destek ve dolgu gerekmiyor.
    return part.translate([0, -(OLED_CY + OLED_GLASS_DY), MASK_PROUD])


def export(man, name, tilt_preview=False):
    m = man.to_mesh()
    verts = np.asarray(m.vert_properties)[:, :3]
    tris = np.asarray(m.tri_verts)
    faces = verts[tris]

    # Köşeleri kaynakla, sonra dejenere üçgenleri at.
    #
    # Boole işlemleri kesişim düzlemlerinde kıymık üçgen bırakıyor: alanı
    # eşiğin üstünde ama iki köşesi birbirine mikron mesafede. Yalnızca alana
    # bakıp atmak yetmedi — atılan kıymığın komşuları kalıyor ve dilimleyici
    # "kapalı değil" diyordu.
    #
    # Doğrusu önce kaynak: 1 µm ızgarasına oturan köşeler tek köşe sayılıyor
    # (baskı çözünürlüğünün 200 katı altında, geometri değişmiyor), sonra
    # köşesi tekrarlayan ya da alanı sıfır olan üçgen atılıyor. Kıymığın
    # bıraktığı boşluk kaynak sırasında zaten kapanmış oluyor.
    GRID = 1e-3
    flat = faces.reshape(-1, 3)
    anahtar = np.round(flat / GRID).astype(np.int64)
    _, ilk, ters = np.unique(anahtar, axis=0, return_index=True, return_inverse=True)
    kaynakli = flat[ilk][ters].reshape(-1, 3, 3)
    idx = ters.reshape(-1, 3)

    tekrar = (idx[:, 0] == idx[:, 1]) | (idx[:, 1] == idx[:, 2]) | (idx[:, 2] == idx[:, 0])
    normals = np.cross(kaynakli[:, 1] - kaynakli[:, 0], kaynakli[:, 2] - kaynakli[:, 0])
    alan = np.linalg.norm(normals, axis=1) / 2.0

    saglam = (~tekrar) & (alan > 1e-9)
    atilan = int((~saglam).sum())
    faces = kaynakli[saglam]

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

def boss_x(y=None):
    """
    Kapak vidasının merkezden uzaklığı.

    Alttaki çift pilin hizasında: 19 mm'de kule pilin içinden geçiyordu
    (205 mm³ çakışma). Pil yarı genişliği + pay + kule yarıçapı kadar dışarı
    alındı; kule pil tutucu kaburgasıyla kaynaşıyor, bu da bağlantıyı
    güçlendiriyor. Kılavuz deliğiyle dış yüzey arasında 2.3 mm et kalıyor.
    """
    dar = BODY_W / 2 - 14.0
    if y is not None and y < BELLY_Y:
        return max(dar, BAT_W / 2 + BAT_CL + BOSS_D / 2 + 0.6)
    return dar


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
    # Göz yaması oyuğu — siyah maske buraya oturuyor.
    holes.append(mask_profile(-0.1, MASK_RECESS))

    # İç pah: cam kenarı çerçevede gölge yapmasın.
    holes.append(slab(-(WINDOW_W + 3) / 2, (WINDOW_W + 3) / 2,
                      win_y - (WINDOW_H + 3) / 2, win_y + (WINDOW_H + 3) / 2,
                      WALL, WALL + 1.0))

    # ---- OLED kuleleri ----
    for sx in (-1, 1):
        for sy in (-1, 1):
            x = sx * OLED_HOLE_DX / 2
            y = OLED_CY + sy * OLED_HOLE_DY / 2
            # Kule oval deliği taşıyacak kadar geniş: 6.4 mm.
            solids.append(post_z(x, y, WALL, WALL + OLED_STANDOFF, 6.4))
            holes.append(oled_pilot(sx, sy, OLED_CY, WALL - 0.5,
                                    WALL + OLED_STANDOFF + OLED_PCB_T + 1.5))

    # ESP32 yuvası burada değil — back_lid() içinde. Gerekçesi ESP_LID_GAP
    # tanımının yanında.

    # ---- pil yuvası (göbekte, önde) ----
    #
    # Pil ağırlığın büyük kısmı; mümkün olduğunca alçakta ve önde duruyor.
    # Bu hem devrilme payını açıyor hem de ayrı bir ağırlık cebini gereksiz
    # kılıyor — eski tasarımdaki somun cebi kaldırıldı.
    #
    # Pil şişebilir, bu yüzden BAT_CL cömert: sıkı bir yuva zamanla tehlikeli.
    bat_z = WALL + 1.0
    bat_top = bat_z + BAT_T + 1.5
    bat_hx = BAT_W / 2 + BAT_CL
    bat_hy = BAT_H / 2 + BAT_CL
    rib = 2.4

    # Yan tutucular
    solids.append(slab(-bat_hx - rib, -bat_hx, BAT_CY - bat_hy, BAT_CY + bat_hy,
                       WALL, bat_top))
    solids.append(slab(bat_hx, bat_hx + rib, BAT_CY - bat_hy, BAT_CY + bat_hy,
                       WALL, bat_top))
    # Alt dudak — ortada açık, pil parmakla çıkarılabilsin.
    solids.append(slab(-(BAT_W / 2 - 7), BAT_W / 2 - 7,
                       BAT_CY - bat_hy - rib, BAT_CY - bat_hy, WALL, bat_top))
    # Üst dudak iki yana kaçık: ortada dursaydı (x ±13) OLED modülünün alt
    # kenarının içinden geçiyordu. Yanlara alınca hem modülün x sınırının
    # (±13.5) dışında kalıyor hem de ortadaki açıklık genişliyor.
    for sx in (-1, 1):
        x1, x2 = sorted((sx * 14.0, sx * 19.0))
        solids.append(slab(x1, x2, BAT_CY + bat_hy, BAT_CY + bat_hy + rib,
                           WALL, bat_top))

    # ---- TP4056 yuvası (pilin arkasında) ----
    tp_z = bat_z + BAT_T + 2.0
    tp_hx = TP_W / 2 + CL
    solids.append(slab(-tp_hx - 2.2, -tp_hx, TP_CY - TP_H / 2, TP_CY + TP_H / 2,
                       tp_z - 2.0, tp_z + TP_T))
    solids.append(slab(tp_hx, tp_hx + 2.2, TP_CY - TP_H / 2, TP_CY + TP_H / 2,
                       tp_z - 2.0, tp_z + TP_T))
    # Kartın oturduğu omuz.
    solids.append(slab(-tp_hx - 2.2, tp_hx + 2.2, TP_CY - TP_H / 2 - 2.0,
                       TP_CY - TP_H / 2, tp_z - 2.0, tp_z + 1.0))

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
            solids.append(post_z(sx * boss_x(y), y, WALL, BODY_D - LID_T, BOSS_D))
            holes.append(post_z(sx * boss_x(y), y, WALL + 2.5, BODY_D - LID_T + 0.5,
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
            lid -= post_z(sx * boss_x(y), y, z0 - 0.5, z0 + LID_T + 0.5, LID_CLEAR)
            head = Manifold.cylinder(2.0, LID_HEAD / 2, LID_CLEAR / 2, SEG)
            lid -= head.rotate([180, 0, 0]).translate([sx * boss_x(y), y, z0 + 2.0])

    # ---- ESP32 rayları ----
    #
    # Kart yandan sürülerek iki rayın oluğuna giriyor; vida yok. Raylar
    # kapağın iç yüzünden yükseliyor, yani baskıda kapak ters durur ve
    # raylar yukarı bakar — hiçbiri havada kalmıyor.
    esp_arka = z0 - ESP_LID_GAP            # kartın arka yüzü
    esp_on = esp_arka - ESP_T              # ön yüzü (bileşenler öne bakar)
    ray_ic = ESP_W / 2 + CL + 1.5          # rayın iç yüzü (merkeze uzaklık)
    ray_dis = ESP_W / 2 + CL + 4.0
    ray_ucu = esp_on - 1.2                 # rayın ulaştığı en ön nokta
    for sy in (-1, 1):
        y1, y2 = sorted((ESP_CY + sy * ray_ic, ESP_CY + sy * ray_dis))
        ray = slab(-(ESP_L / 2 + 3), ESP_L / 2 + 3, y1, y2, ray_ucu, z0 + 0.1)
        # Kartın oturduğu oluk: rayın iç yüzüne açılan yatay kanal.
        o1, o2 = sorted((ESP_CY + sy * (ESP_W / 2 + CL), ESP_CY + sy * ray_ic))
        oluk = slab(-(ESP_L / 2 + 4), ESP_L / 2 + 4, o1, o2,
                    esp_on - 0.2, esp_arka + 0.2)
        lid += ray - oluk

    # Havalandırma: ESP32 hizasında yatay yarıklar. Pilin arkasına delik
    # açılmıyor — Li-Po hücresi toza ve delici cisme açık kalmamalı.
    # Yarıklar rayların ARASINDA kalıyor; ray hizasına denk gelen bir yarık
    # rayı boşluğun üstünde bırakırdı.
    for i in range(4):
        y = ESP_CY - 8 + i * 5.0
        lid -= slab(-13, 13, y - 1.2, y + 1.2, z0 - 0.5, z0 + LID_T + 0.5)

    # TP4056 Type-C açıklığı.
    #
    # Şarj soketi arkadan erişilebilir olmalı: Elçin masada dururken kablo
    # arkasından takılıp topuğun üzerinden çıkar, öne hiç dolanmaz. Açıklık
    # sokete göre bol — kartın yerleşimi birkaç mm kaysa da kablo giriyor.
    usb_y = TP_CY - TP_H / 2 + 3.0
    usb_w = TP_USB_W + TP_USB_CL * 2
    usb_h = TP_USB_H + TP_USB_CL * 2
    lid -= slab(-usb_w / 2, usb_w / 2, usb_y - usb_h / 2, usb_y + usb_h / 2,
                z0 - 0.5, z0 + LID_T + 0.5)

    # Aç/kapa anahtarı: 20 × 5 mm dikdörtgen delik.
    #
    # Arkaya konuyor — Gülçin'in gördüğü yüzde anahtar olmasın. Pilin
    # üstündeki boşlukta, elin arkadan rahat ulaşacağı yükseklikte.
    lid -= slab(-SW_W / 2, SW_W / 2, SW_CY - SW_H / 2, SW_CY + SW_H / 2,
                z0 - 0.5, z0 + LID_T + 0.5)

    lid = desk_cut(lid)

    # Baskı yönü: kapak TERS basılır — dış (görünen) yüz tablada, raylar
    # yukarı. Vida havşası da bu yönde tabandan içeri doğru daraldığı için
    # köprü gerektirmiyor.
    lid = lid.translate([0, 0, -z0]).rotate([180, 0, 0])
    m = lid.bounding_box()
    return lid.translate([0, 0, -m[2]])


def fit_template():
    """
    Ölçü şablonu — gövdeyi basmadan önceki tek kontrol.

    Gövdedeki OLED bölgesinin birebir kopyası: aynı pencere, aynı kuleler,
    aynı oval delikler, kartın oturduğu aynı oluk. Modül buraya oturuyorsa
    gövdeye de oturur.

    Kasten ince ve küçük: 1.6 mm taban, kartın çevresinde 6 mm'lik bir
    çerçeve, ortası zaten pencere. Dolgu gerekmiyor, destek gerekmiyor;
    0.2 mm katmanda birkaç dakika ve ~2 g filament.
    """
    base_t = 1.6
    w, h = OLED_PCB_W + 12, OLED_PCB_H + 12
    plate = rounded_slab(w, h, 0.0, base_t, 3.0)

    # Pencere — gövdedeki ile aynı ölçü ve aynı yer (cam merkezine göre).
    plate -= slab(-WINDOW_W / 2, WINDOW_W / 2,
                  OLED_GLASS_DY - WINDOW_H / 2, OLED_GLASS_DY + WINDOW_H / 2,
                  -1.0, base_t + 1.0)

    # Kart dış hattını gösteren sığ oluk (0.6 mm) — kart oluğa oturmalı.
    outer = rounded_slab(OLED_PCB_W + CL * 2, OLED_PCB_H + CL * 2,
                         base_t - 0.6, base_t + 0.1, 1.0)
    inner = rounded_slab(OLED_PCB_W - 1.6, OLED_PCB_H - 1.6,
                         base_t - 0.8, base_t + 0.2, 1.0)
    plate -= (outer - inner)

    # Kuleler ve oval delikler — gövdedekinin aynısı.
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * OLED_HOLE_DX / 2, sy * OLED_HOLE_DY / 2
            plate += post_z(x, y, base_t, base_t + OLED_STANDOFF, 6.4)
            plate -= oled_pilot(sx, sy, 0.0, -0.5,
                                base_t + OLED_STANDOFF + 2.0)

    return plate


def main():
    print(f"\nElçin  {BODY_W:.1f} G × {BODY_D:.1f} D × {BODY_H:.1f} Y mm"
          f"   ({LEAN:.0f}° yaslı)\n")

    export(front_shell(), "elcin_govde.stl")
    export(back_lid(), "elcin_arka_kapak.stl")
    export(ear(-1).translate([EAR_X, 0, 0]), "elcin_kulak.stl")
    export(arm(-1), "elcin_kol.stl")
    export(face_mask(), "elcin_goz_yamasi.stl")
    export(fit_template(), "elcin_olcu_sablonu.stl")

    print("\n  Önce elcin_olcu_sablonu.stl bas. Modül oturmuyorsa OLED_*")
    print("  değerlerini düzelt ve bu betiği yeniden çalıştır.\n")


if __name__ == "__main__":
    main()
