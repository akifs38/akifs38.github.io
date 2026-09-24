#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Montaj dosyaları — Elçin'in tamamı, elektronikle birlikte, tek STL.

GitHub .stl dosyalarını tarayıcıda 3B gösteriyor. Tek tek parçalara bakmak
"acaba hepsi gerçekten birbirine oturuyor mu" sorusunu cevaplamıyor; bu
betik basılan beş parçayı ve içine giren beş modülü montaj konumunda
birleştirip iki dosya yazıyor:

  stl/elcin_montaj.stl        dıştan — masada duran Elçin
  stl/elcin_montaj_kesit.stl  ortadan kesilmiş — içindeki her şey görünür
  stl/montaj/*.stl            parça parça, montaj konumunda

Üçüncüsü web görüntüleyici için: GitHub'ın STL görüntüleyicisi tek renk
gösteriyor, siyah/beyaz ayrımı orada kaybolıyor. Parçaları ayrı dosyalara
bölünce tarayıcıdaki görüntüleyici her birine kendi rengini verebiliyor ve
kapağı geriye kaydırıp içini açabiliyor.

Modüller basılmıyor; kutu değil onlar. Yine de aynı yerleşim ifadelerinden
üretiliyorlar (dogrula.py ile ortak), yani buradaki görüntü tasarımın
kendisi, temsilî bir çizim değil.

    python3 montaj.py
"""

import json
import os

import numpy as np
from manifold3d import Manifold

import elcin_kutu_uret as e
from dogrula import LID_Z0
from elcin_kutu_uret import export, slab

HERE = os.path.dirname(os.path.abspath(__file__))


def montaj_maskesi():
    """Göz yaması, baskı yönünden yüzdeki oyuğa."""
    return e.face_mask().translate(
        [0, e.OLED_CY + e.OLED_GLASS_DY, -e.MASK_T])


def basilan_parcalar():
    """Beş basılan parça, montaj konumunda, tek katı."""
    parca = e.front_shell() + e.montaj_kapagi() + montaj_maskesi()
    for yan in (-1, 1):
        parca += e.ear(yan) + e.arm(yan)
    return parca


def elektronik(pay=0.0):
    """
    İçine giren modüllerin tamamı, tek katı.

    `pay` > 0 ise her modül kendi merkezine doğru o kadar küçülür. Tek
    STL'de kabukla birleştirirken gerekiyor: modüller yuvalarına tam değiyor
    (dokunma kartının kenarı kaburgalara, ESP'nin kenarı dişlere bir çizgi
    boyunca). Birleşimde bu çizgiler dörtten fazla üçgenin paylaştığı
    manifold-dışı kenarlara dönüşüyordu. 0.02 mm gözle görünmüyor.
    """
    butun = Manifold()
    for parca in e.modul_katilari().values():
        if pay > 0:
            b = parca.bounding_box()
            orta = [(b[i] + b[i + 3]) / 2 for i in range(3)]
            olcek = [1 - 2 * pay / (b[i + 3] - b[i]) for i in range(3)]
            parca = (parca.translate([-c for c in orta]).scale(olcek)
                     .translate(orta))
        butun += parca
    return butun


def masaya_otur(parca, kaydir=None):
    """
    Baskı ekseninden masa eksenine: Z yukarı, LEAN kadar geriye yaslı.

    `kaydir` ZORUNLU olarak dışarıdan geliyor. Her parçayı kendi en alçak
    noktasından tabana indirmek montajı bozuyordu: kapak da gövde de ayrı
    ayrı z = 0'a oturunca birbirinden kayıyorlar. Taban yüksekliği bütün
    montajın ortak özelliği, parçanın değil.
    """
    donuk = parca.rotate([90 + e.LEAN, 0, 0])
    if kaydir is None:
        kaydir = donuk.bounding_box()[2]
    return donuk.translate([0, 0, -kaydir])


def taban_yuksekligi(butun):
    """Montajın tamamının en alçak noktası — ortak kaydırma budur."""
    return butun.rotate([90 + e.LEAN, 0, 0]).bounding_box()[2]


def parcali_yaz():
    """
    Görüntüleyici için parça parça dışa aktarım.

    Tek dosya olsaydı hepsi tek renk olurdu ve kapak açılamazdı. Burada her
    parça kendi dosyasında ve hepsi MONTAJ konumunda — tarayıcı tarafında
    hiçbir dönüşüm gerekmiyor, yalnızca renk ve kaydırma.
    """
    klasor = os.path.join("montaj")
    os.makedirs(os.path.join(HERE, "stl", klasor), exist_ok=True)

    parcalar = {
        "govde": e.front_shell(),
        "kapak": e.montaj_kapagi(),
        "goz_yamasi": montaj_maskesi(),
        "kulaklar": e.ear(-1) + e.ear(1),
        "kollar": e.arm(-1) + e.arm(1),
    }
    parcalar.update(e.modul_katilari())

    kaydir = taban_yuksekligi(basilan_parcalar())
    for ad, parca in parcalar.items():
        export(masaya_otur(parca, kaydir), os.path.join(klasor, f"{ad}.stl"))

    hedef = os.path.join(HERE, "stl", klasor)
    yerlesim = {"yuz": yuz_duzlemi(kaydir), "yuz_gorseli": yuz_gorseli(hedef)}
    with open(os.path.join(hedef, "yerlesim.json"), "w", encoding="utf-8") as dosya:
        json.dump(yerlesim, dosya, ensure_ascii=False, indent=2)
    print("  montaj/yerlesim.json      yüz düzleminin konumu")


def yuz_duzlemi(kaydir):
    """
    OLED yüzünün duracağı düzlem — merkez ve eksenler, montaj koordinatında.

    Görüntüleyici yüzü buraya yapıştırıyor. Konumu JS'te elle hesaplamak
    yaslanma açısını ve cam derinliğini iki yerde tutmak olurdu; biri
    değişince diğeri sessizce kayardı.
    """
    aci = np.radians(90 + e.LEAN)
    don = np.array([[1, 0, 0],
                    [0, np.cos(aci), -np.sin(aci)],
                    [0, np.sin(aci), np.cos(aci)]])
    cam_on = e.WALL + e.OLED_STANDOFF - e.OLED_GLASS_T - 0.05   # camın hemen önü
    merkez = don @ np.array([0.0, e.OLED_CY + e.OLED_GLASS_DY, cam_on])
    merkez -= np.array([0.0, 0.0, kaydir])

    ust = don @ np.array([0.0, 1.0, 0.0])
    normal = don @ np.array([0.0, 0.0, -1.0])      # yüzeyin baktığı yön: öne
    # Sağ ekseni elle (1,0,0) vermek eksen takımını SOL elli yapıyordu ve
    # three.js dönüşü çöpe çıkarıp düzlemi kenardan gösteriyordu. Sağ elli
    # takımda üçüncü eksen normal ise, birincisi bu çarpım olmak zorunda.
    sag = np.cross(ust, normal)
    return {
        "merkez": [round(float(v), 4) for v in merkez],
        "sag": [round(float(v), 6) for v in sag],
        "ust": [round(float(v), 6) for v in ust],
        "normal": [round(float(v), 6) for v in normal],
        "genislik": e.OLED_GLASS_W,
        "yukseklik": e.OLED_GLASS_H,
    }


def yuz_gorseli(hedef):
    """
    Cam dokusunu üret: siyah cam + ortasında yanan piksel alanı.

    Yalnızca 128 × 64'lük yüzü koymak yetmiyordu; cam 26.7 × 19.3, yanan alan
    21.7 × 10.9. Aradaki fark kadar OLED kartının mavisi görünüyordu.
    Doku camın tamamını kaplıyor, yüz de içinde gerçek oranında duruyor.
    """
    kaynak = os.path.join(HERE, "..", "esp32", "test", "out", "yuz.pgm")
    if not os.path.exists(kaynak):
        print("  not: esp32/test && make render çalıştırılmamış, yüz dokusu yok")
        return False

    with open(kaynak, "rb") as dosya:
        parcalar = dosya.read().split(b"\n", 3)
    fw, fh = (int(n) for n in parcalar[1].split())
    yuz = np.frombuffer(parcalar[3], dtype=np.uint8, count=fw * fh).reshape(fh, fw)

    olcek = 8  # px/mm
    cw, ch = round(e.OLED_GLASS_W * olcek), round(e.OLED_GLASS_H * olcek)
    pw, ph = round(e.OLED_PIXEL_W * olcek), round(e.OLED_PIXEL_H * olcek)

    # En yakın komşu: piksel ekranı bulandırmak ona ekran görüntüsü değil
    # baskı hatası havası veriyor.
    sx = (np.arange(pw) * fw // pw).clip(0, fw - 1)
    sy = (np.arange(ph) * fh // ph).clip(0, fh - 1)
    buyuk = yuz[np.ix_(sy, sx)]

    cam = np.zeros((ch, cw), dtype=np.uint8)
    y0, x0 = (ch - ph) // 2, (cw - pw) // 2
    cam[y0:y0 + ph, x0:x0 + pw] = buyuk

    pgm = os.path.join(hedef, "yuz.pgm")
    with open(pgm, "wb") as dosya:
        dosya.write(f"P5\n{cw} {ch}\n255\n".encode())
        dosya.write(cam.tobytes())

    arac = os.path.join(HERE, "..", "esp32", "tools", "to_png.py")
    if os.system(f'python3 "{arac}" "{pgm}" >/dev/null') != 0:
        os.remove(pgm)
        return False
    os.remove(pgm)
    print(f"  montaj/yuz.png            cam dokusu, {cw} × {ch}")
    return True


def main():
    os.makedirs(os.path.join(HERE, "stl"), exist_ok=True)
    kabuk = basilan_parcalar()
    icerik = elektronik(pay=0.02)

    kaydir = taban_yuksekligi(kabuk)

    print("\nElçin montaj\n")
    export(masaya_otur(kabuk + icerik, kaydir), "elcin_montaj.stl")

    # Kesit: x > 0 yarısı atılıyor. Kabuk da modüller de kesiliyor —
    # yalnızca kabuğu kesmek modülleri havada bırakıyor gibi görünüyordu.
    bicak = slab(0.0, 200.0, -200.0, 200.0, -200.0, 200.0)
    export(masaya_otur((kabuk + icerik) - bicak, kaydir),
           "elcin_montaj_kesit.stl")

    print()
    parcali_yaz()

    print("\n  GitHub ilk iki dosyayı tarayıcıda 3B gösteriyor.")
    print("  montaj/ altındakiler renkli web görüntüleyici için.\n")


if __name__ == "__main__":
    main()
