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

Modüller basılmıyor; kutu değil onlar. Yine de aynı yerleşim ifadelerinden
üretiliyorlar (dogrula.py ile ortak), yani buradaki görüntü tasarımın
kendisi, temsilî bir çizim değil.

    python3 montaj.py
"""

import os

import numpy as np
from manifold3d import Manifold

import elcin_kutu_uret as e
from dogrula import LID_Z0, moduller
from elcin_kutu_uret import export, slab

HERE = os.path.dirname(os.path.abspath(__file__))


def basilan_parcalar():
    """Beş basılan parça, montaj konumunda."""
    kapak = e.back_lid()                       # baskı yönünde geliyor
    bb = kapak.bounding_box()
    kapak = (kapak.translate([0, 0, bb[2] - bb[5]])
                  .rotate([180, 0, 0])
                  .translate([0, 0, LID_Z0]))

    maske = e.face_mask()                      # o da baskı yönünde
    maske = maske.translate([0, e.OLED_CY + e.OLED_GLASS_DY, -e.MASK_PROUD])

    parca = e.front_shell() + kapak + maske
    for yan in (-1, 1):
        parca += e.ear(yan) + e.arm(yan)
    return parca


def elektronik():
    """
    İçine giren modüller — kart gövdeleri, cam, soketler.

    Yerleşim dogrula.py'deki ifadelerin aynısı; oradan geliyor. İkisi
    ayrılırsa doğrulama bir şeyi, montaj görüntüsü başka şeyi anlatır.
    """
    kutu = Manifold()
    for ad, cy, w, h, z0, z1 in moduller():
        kutu += slab(-w / 2, w / 2, cy - h / 2, cy + h / 2, z0, z1)

    # OLED camı — modülün ön yüzünde, yüzü veren yer.
    oled_on = e.WALL + e.OLED_STANDOFF
    cam_y = e.OLED_CY + e.OLED_GLASS_DY
    kutu += slab(-e.OLED_GLASS_W / 2, e.OLED_GLASS_W / 2,
                 cam_y - e.OLED_GLASS_H / 2, cam_y + e.OLED_GLASS_H / 2,
                 oled_on - 0.6, oled_on + 0.2)

    # TP4056'nın Type-C soketi — kapaktaki açıklığa dayanıyor.
    tp_z = e.WALL + 1.0 + e.BAT_T + 2.0
    usb_y = e.TP_CY - e.TP_H / 2 + 3.0
    kutu += slab(-e.TP_USB_W / 2, e.TP_USB_W / 2,
                 usb_y - e.TP_USB_H / 2, usb_y + e.TP_USB_H / 2,
                 tp_z + e.TP_T - 0.5, e.BODY_D + 0.4)

    # Aç/kapa anahtarı — kapaktan dışarı çıkan gövdesi ve kolu.
    kutu += slab(-e.SW_W / 2, e.SW_W / 2,
                 e.SW_CY - e.SW_H / 2, e.SW_CY + e.SW_H / 2,
                 LID_Z0 - 4.0, e.BODY_D + 1.6)
    kutu += slab(-2.0, 2.0, e.SW_CY - 1.6, e.SW_CY + 1.6,
                 e.BODY_D + 1.0, e.BODY_D + 4.0)
    return kutu


def masaya_otur(parca):
    """Baskı ekseninden masa eksenine: Z yukarı, LEAN kadar geriye yaslı."""
    donuk = parca.rotate([90 + e.LEAN, 0, 0])
    return donuk.translate([0, 0, -donuk.bounding_box()[2]])


def main():
    os.makedirs(os.path.join(HERE, "stl"), exist_ok=True)
    kabuk = basilan_parcalar()
    icerik = elektronik()

    print("\nElçin montaj\n")
    export(masaya_otur(kabuk + icerik), "elcin_montaj.stl")

    # Kesit: x > 0 yarısı atılıyor. Kabuk da modüller de kesiliyor —
    # yalnızca kabuğu kesmek modülleri havada bırakıyor gibi görünüyordu.
    bicak = slab(0.0, 200.0, -200.0, 200.0, -200.0, 200.0)
    export(masaya_otur((kabuk + icerik) - bicak), "elcin_montaj_kesit.stl")

    print("\n  GitHub bu iki dosyayı tarayıcıda 3B gösteriyor.")
    print("  Kesit olan içindeki her şeyi gösterir; diğeri Elçin'in kendisi.\n")


if __name__ == "__main__":
    main()
