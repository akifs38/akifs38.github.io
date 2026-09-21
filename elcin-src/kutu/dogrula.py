#!/usr/bin/env python3
"""
Elçin gövdesi — sayısal doğrulama.

Bakarak tasarlamak yetmiyor. Bu betik üç şeyi ölçüyor:

  1. Her modül kabuğun İÇİNDE mi ve mekanik parçalara çarpıyor mu
  2. Modüller BİRBİRİNE giriyor mu   ← asıl tuzak burası
  3. Elçin devrilir mi, STL'ler kapalı mı

(2) olmadan (1) yanıltıyor: OLED ile pil ayrı ayrı kabuğa sığıyordu ama
aynı derinlik bandında üst üste biniyorlardı. Kabuk testi bunu göremez,
çünkü ikisi de kabuğun boşluğunda duruyor — sadece aynı boşlukta.

    python3 dogrula.py
"""

import os
import sys
from collections import defaultdict

import numpy as np
import stl as numpy_stl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import elcin_kutu_uret as e                                    # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
LID_Z0 = e.BODY_D - e.LID_T


def kutu(cy, w, h, z0, z1, buyut=0.0):
    return e.slab(-w / 2 - buyut, w / 2 + buyut,
                  cy - h / 2 - buyut, cy + h / 2 + buyut,
                  z0 - buyut, z1 + buyut)


def moduller():
    """Her modülün gerçekte kapladığı hacim — yerleşim koduyla aynı ifadeler."""
    bat_z = e.WALL + 1.0
    tp_z = bat_z + e.BAT_T + 2.0
    oled_z = e.WALL + e.OLED_STANDOFF
    esp_arka = LID_Z0 - e.ESP_LID_GAP
    ty0 = e.BODY_H - e.WALL - e.TOUCH_MEMBRANE - (e.TOUCH_T + 0.6)
    return [
        ("OLED modül", e.OLED_CY, e.OLED_PCB_W, e.OLED_PCB_H,
         oled_z, oled_z + e.OLED_PCB_T),
        ("ESP32-C3", e.ESP_CY, e.ESP_L, e.ESP_W,
         esp_arka - e.ESP_T - e.ESP_COMP_H, esp_arka),
        ("Li-Po pil", e.BAT_CY, e.BAT_W, e.BAT_H, bat_z, bat_z + e.BAT_T),
        ("TP4056", e.TP_CY, e.TP_W, e.TP_H, tp_z, tp_z + e.TP_T),
        ("TTP223", ty0 + (e.TOUCH_T + 0.6) / 2, e.TOUCH_W, e.TOUCH_T + 0.6,
         e.WALL + 1.0, e.WALL + 1.0 + e.TOUCH_H),
    ]


def montaj_kabugu():
    """Gövde + kapak, ikisi de montaj konumunda."""
    kapak = e.back_lid()                      # baskı yönünde geliyor
    bb = kapak.bounding_box()
    kapak = (kapak.translate([0, 0, bb[2] - bb[5]])
                  .rotate([180, 0, 0])
                  .translate([0, 0, LID_Z0]))
    return e.front_shell(), kapak


def kabuk_payi(kabuk, ad, cy, w, h, z0, z1, gomulu=False):
    hacim = (kutu(cy, w, h, z0, z1) ^ kabuk).volume()
    if hacim > 1e-3 and not gomulu:
        nokta = np.asarray((kutu(cy, w, h, z0, z1) ^ kabuk)
                           .to_mesh().vert_properties)[:, :3]
        print(f"  {ad:13s} ÇAKIŞMA {hacim:7.1f} mm³"
              f"  {nokta.min(0).round(1)} .. {nokta.max(0).round(1)}")
        return False
    if gomulu:
        print(f"  {ad:13s} duvarın içine gömülü")
        return True
    alt, ust = 0.0, 8.0
    for _ in range(22):
        orta = (alt + ust) / 2
        if (kutu(cy, w, h, z0, z1, orta) ^ kabuk).volume() > 1e-3:
            ust = orta
        else:
            alt = orta
    print(f"  {ad:13s} boşluk +{alt:.1f} mm")
    return True


def modul_carpismasi(liste):
    """Modüllerin birbirine girmesi — kabuk testinin göremediği sınıf."""
    temiz = True
    for i in range(len(liste)):
        for j in range(i + 1, len(liste)):
            a, b = liste[i], liste[j]
            ortak = (kutu(*a[1:]) ^ kutu(*b[1:])).volume()
            if ortak > 1e-3:
                print(f"  {a[0]} ↔ {b[0]}: {ortak:.1f} mm³ ÇAKIŞMA")
                temiz = False
    if temiz:
        print("  modüller birbirine girmiyor ✓")
    return temiz


def devrilme():
    kutle = e.desk_cut(e.body_mass())
    ag = kutle.to_mesh()
    v = np.asarray(ag.vert_properties)[:, :3]
    f = v[np.asarray(ag.tri_verts)]
    alti_hacim = np.einsum("ij,ij->i", f[:, 0], np.cross(f[:, 1], f[:, 2]))
    merkez = ((f.sum(1) / 4.0) * alti_hacim[:, None]).sum(0) / alti_hacim.sum()

    aci = np.radians(e.LEAN)
    c, s = np.cos(aci), np.sin(aci)
    donus = (np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
             @ np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]]))
    mw = donus @ merkez
    taban = (f.reshape(-1, 3) @ donus.T)
    taban = taban[taban[:, 2] < 0.6]
    arka = abs(mw[1] - taban[:, 1].min())
    on = abs(taban[:, 1].max() - mw[1])
    print(f"  hacim {alti_hacim.sum() / 6000:.1f} cm³"
          f"   devrilme payı: arka {arka:.1f} mm · ön {on:.1f} mm")
    return arka > 4.0 and on > 4.0


def kapalilik():
    temiz = True
    for ad in sorted(os.listdir(os.path.join(HERE, "stl"))):
        if not ad.endswith(".stl"):
            continue
        v = numpy_stl.Mesh.from_file(os.path.join(HERE, "stl", ad))
        v = v.vectors.reshape(-1, 3)
        _, idx = np.unique(np.round(v, 3), axis=0, return_inverse=True)
        idx = idx.reshape(-1, 3)
        kenar = defaultdict(int)
        for t in idx:
            for a, b in ((0, 1), (1, 2), (2, 0)):
                kenar[(t[a], t[b]) if t[a] < t[b] else (t[b], t[a])] += 1
        acik = sum(1 for n in kenar.values() if n != 2)
        print(f"  {ad:26s} {'kapalı ✓' if acik == 0 else f'{acik} açık kenar ✗'}")
        temiz = temiz and acik == 0
    return temiz


def main():
    liste = moduller()
    govde, kapak = montaj_kabugu()
    kabuk = govde + kapak

    print("\nModül ↔ kabuk")
    tamam = all(kabuk_payi(kabuk, *m, gomulu=(m[0] == "TTP223")) for m in liste)
    print(f"  gövde ↔ kapak çakışma {(govde ^ kapak).volume():.1f} mm³")
    tamam = tamam and (govde ^ kapak).volume() < 1e-3

    print("\nModül ↔ modül")
    tamam = modul_carpismasi(liste) and tamam

    print("\nDenge")
    tamam = devrilme() and tamam

    print("\nSTL")
    tamam = kapalilik() and tamam

    print("\n  " + ("Hepsi geçti." if tamam else "SORUN VAR."))
    return 0 if tamam else 1


if __name__ == "__main__":
    raise SystemExit(main())
