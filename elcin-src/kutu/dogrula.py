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


ETIKET = {
    "oled": "OLED modül",
    "esp32": "ESP32-C3",
    "pil": "Li-Po pil",
    "tp4056": "TP4056",
    "ttp223": "TTP223",
    "anahtar": "Anahtar",
}

# Duvarın içine gömülü olanlar: kabuğa girmeleri hata değil, tasarım.
GOMULU = ("ttp223", "anahtar")


def moduller():
    """Modül katıları — tanımları elcin_kutu_uret.modul_katilari()'nda."""
    return e.modul_katilari()


def montaj_kabugu():
    """Gövde + kapak, ikisi de montaj konumunda."""
    return e.front_shell(), e.montaj_kapagi()


def kabuk_payi(kabuk, ad, katı, gomulu=False):
    """Modül kabuğa giriyor mu; girmiyorsa etrafında ne kadar boşluk var."""
    hacim = (katı ^ kabuk).volume()
    if gomulu:
        print(f"  {ETIKET[ad]:13s} duvarın içine gömülü")
        return True
    if hacim > 1e-3:
        nokta = np.asarray((katı ^ kabuk).to_mesh().vert_properties)[:, :3]
        print(f"  {ETIKET[ad]:13s} ÇAKIŞMA {hacim:7.1f} mm³"
              f"  {nokta.min(0).round(1)} .. {nokta.max(0).round(1)}")
        return False

    # Payı ölçmek için katıyı büyütmek gerekiyor; Manifold'da doğrudan
    # "şişir" yok, o yüzden küçük bir küreyle Minkowski yerine sınır
    # kutusunu büyütüyoruz — eğik parçalarda bu payı hafif olduğundan az
    # gösterir, yani güvenli tarafta kalır.
    bb = katı.bounding_box()
    alt, ust = 0.0, 8.0
    for _ in range(22):
        orta = (alt + ust) / 2
        buyuk = e.slab(bb[0] - orta, bb[3] + orta, bb[1] - orta, bb[4] + orta,
                       bb[2] - orta, bb[5] + orta)
        if ((buyuk - katı) ^ kabuk).volume() > 1e-3:
            ust = orta
        else:
            alt = orta
    print(f"  {ETIKET[ad]:13s} boşluk +{alt:.1f} mm")
    return True


def modul_carpismasi(liste):
    """Modüllerin birbirine girmesi — kabuk testinin göremediği sınıf."""
    adlar = list(liste)
    temiz = True
    for i in range(len(adlar)):
        for j in range(i + 1, len(adlar)):
            a, b = adlar[i], adlar[j]
            ortak = (liste[a] ^ liste[b]).volume()
            if ortak > 1e-3:
                print(f"  {ETIKET[a]} ↔ {ETIKET[b]}: {ortak:.1f} mm³ ÇAKIŞMA")
                temiz = False
    if temiz:
        print("  modüller birbirine girmiyor ✓")
    return temiz


def fis_takilabiliyor_mu(kabuk):
    """
    Şarj fişi gerçekten takılabiliyor mu?

    İki soru: fiş kabuğa çarpıyor mu, ve masanın altına giriyor mu. İkincisi
    en az birincisi kadar önemli — portu iyi niyetle alta koyup fişi masaya
    dayamak mümkün.
    """
    fis = e.fis_hacmi()
    carpma = (fis ^ kabuk).volume()

    # Masa düzlemi: gövdenin kesildiği düzlemin altı.
    masa = e.slab(-200, 200, -200, 0.001, -200, 200).rotate([-e.LEAN, 0, 0])
    gomulme = (fis ^ masa).volume()

    if carpma > 1e-3:
        print(f"  fiş kabuğa çarpıyor: {carpma:.1f} mm³")
    if gomulme > 1e-3:
        print(f"  fiş masanın içine giriyor: {gomulme:.1f} mm³")
    if carpma <= 1e-3 and gomulme <= 1e-3:
        # Masaya en yakın noktası ne kadar yukarıda?
        nokta = np.asarray(fis.to_mesh().vert_properties)[:, :3]
        aci = np.radians(e.LEAN)
        yukseklik = (nokta[:, 1] * np.cos(aci) - nokta[:, 2] * np.sin(aci)).min()
        print(f"  şarj fişi takılabiliyor ✓ (masaya en yakın {yukseklik:.1f} mm)")
        return True
    return False


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
    tamam = all(kabuk_payi(kabuk, ad, katı, gomulu=(ad in GOMULU))
                for ad, katı in liste.items())
    print(f"  gövde ↔ kapak çakışma {(govde ^ kapak).volume():.1f} mm³")
    tamam = tamam and (govde ^ kapak).volume() < 1e-3

    print("\nModül ↔ modül")
    tamam = modul_carpismasi(liste) and tamam

    print("\nŞarj portu")
    tamam = fis_takilabiliyor_mu(kabuk) and tamam

    print("\nDenge")
    tamam = devrilme() and tamam

    print("\nSTL")
    tamam = kapalilik() and tamam

    print("\n  " + ("Hepsi geçti." if tamam else "SORUN VAR."))
    return 0 if tamam else 1


if __name__ == "__main__":
    raise SystemExit(main())
