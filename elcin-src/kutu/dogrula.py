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

# Kasıtlı olarak kabuk duvarının İÇİNDEN geçen kısımlar. Bu parçalar
# denetimden ÇIKARILMIYOR — önceki sürüm tam olarak bunu yapıyordu ve
# anahtarın ESP32 rayına 175 mm³ girdiğini saklıyordu. Bunun yerine her
# birinin duvar içindeki kısmı kesilip atılıyor, geri kalanı normal denetleniyor.
def duvar_disi(ad, kati):
    """Parçanın boşlukta kalması gereken kısmı."""
    if ad == "anahtar":
        # Kapak plakasından geçen gövde ve dışarıdaki kol kasıtlı; içerideki
        # kısım hiçbir şeye değmemeli.
        return kati ^ e.slab(-200, 200, -200, 200, -200, e.BODY_D - e.LID_T)
    return kati


def moduller():
    """Modül katıları — tanımları elcin_kutu_uret.modul_katilari()'nda."""
    return e.modul_katilari()


def montaj_kabugu():
    """Gövde + kapak, ikisi de montaj konumunda."""
    return e.front_shell(), e.montaj_kapagi()


def kabuk_payi(kabuk, ad, katı):
    """Modül kabuğa giriyor mu; girmiyorsa etrafında ne kadar boşluk var."""
    hacim = (katı ^ kabuk).volume()
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


def ekran_baglantisi(govde):
    """
    OLED'in camına hiçbir şey değmiyor mu, vida ön yüzü deliyor mu?

    Eski Ø6 kuleler camın köşelerine basıyordu. Doğrulama bunu kaçırdı,
    çünkü modeldeki cam gerçeğinden kısaydı ve çakışma testi yalnızca
    İÇ İÇE geçmeyi yakalıyor, sıfır paylı teması değil. Burada en yakın
    mesafe ölçülüyor.
    """
    oled_z = e.WALL + e.OLED_STANDOFF
    cam = e.slab(-e.OLED_GLASS_W / 2, e.OLED_GLASS_W / 2,
                 e.OLED_CY + e.OLED_GLASS_DY - e.OLED_GLASS_H / 2,
                 e.OLED_CY + e.OLED_GLASS_DY + e.OLED_GLASS_H / 2,
                 oled_z - e.OLED_GLASS_T, oled_z)
    pay = cam.min_gap(govde, 5.0)
    temiz = pay >= 0.35
    print(f"  cam ↔ gövde en yakın {pay:.2f} mm {'✓' if temiz else '✗ (en az 0.35)'}")

    # Kartın ön yüzü dayanaklara oturuyor mu: dayanak üstü = kart ön yüzü.
    dayanak = govde ^ e.slab(-e.OLED_PCB_W / 2, e.OLED_PCB_W / 2,
                             e.OLED_CY - e.OLED_PCB_H / 2,
                             e.OLED_CY + e.OLED_PCB_H / 2,
                             e.WALL + 0.01, oled_z)
    alan = dayanak.slice(oled_z - 0.05).area()
    oturuyor = alan > 4 * 4.0
    print(f"  kartın bastığı dayanak alanı {alan:.1f} mm² "
          f"{'✓' if oturuyor else '✗'}")

    deri = e.oled_vida_dibi()
    delmiyor = deri >= 1.0
    print(f"  M2 × {e.OLED_VIDA_BOY:.0f} vida ön yüze {deri:.1f} mm kala bitiyor "
          f"{'✓' if delmiyor else '✗'}")
    return temiz and oturuyor and delmiyor


def taban_kapali_mi(govde, kapak):
    """
    Elçin'in altı kapalı mı?

    Bu denetim yokken masa kesiği iç boşluğun içinden geçiyordu ve alt
    tamamen açıktı; pil alttan görünüyordu. Hiçbir denetim bunu yakalamadı,
    çünkü hepsi parçaların İÇERİDE olup olmadığına bakıyordu — dışarıya
    açılan bir boşluğa bakan yoktu.

    Masa düzleminin hemen üstünde ince bantlar alınıyor; gövdenin içinde
    kalıp ne gövdenin ne kapağın kapattığı bir hacim varsa alt açık demektir.
    Şarj ağzı kasıtlı bir açıklık olduğu için dışarıda tutuluyor.
    """
    ici = e.desk_cut(e.inner_cavity()) ^ e.desk_cut(e.body_mass())
    kanal = e.port_acikligi()
    en_kotu = 0.0
    for yuk in (0.3, 1.0, 1.8):
        bant = e.masa_bandi(yuk - 0.15, yuk + 0.15)
        acik = ((ici ^ bant) - govde - kapak - kanal).volume()
        en_kotu = max(en_kotu, acik)
    if en_kotu > 0.05:
        print(f"  alt AÇIK: masa düzleminde {en_kotu:.1f} mm³ boşluk")
        return False
    print("  alt kapalı ✓ (şarj ağzı dışında)")
    return True


def goz_yamasi(govde):
    """
    Göz yaması: tırnakları pencereye sığıyor mu, yüzden taşıyor mu, ve
    gövdenin yüzü baskıda gerçekten düz mü?

    Üçüncüsü neden var: yama eskiden yüzdeki bir oyuğa oturuyordu ve gövde
    yüz tablada basıldığı için o oyuğun tavanı 599 mm²'lik desteksiz bir
    yüzeydi. Yüzün ilk katmanı, yama bölgesinde penceresiz her yerde dolu
    olmalı.
    """
    win_y = e.OLED_CY + e.OLED_GLASS_DY
    yama = e.face_mask().translate([0, win_y, -e.MASK_T])     # montaj konumu
    tamam = True

    carpma = (yama ^ govde).volume()
    print(f"  yama ↔ gövde çakışma {carpma:.2f} mm³ {'✓' if carpma < 1e-3 else '✗'}")
    tamam &= carpma < 1e-3

    pencere = e.slab(-e.WINDOW_W / 2, e.WINDOW_W / 2, win_y - e.WINDOW_H / 2,
                     win_y + e.WINDOW_H / 2, 0.0, e.KEY_D)
    giren = (e.mask_keys() ^ pencere).volume()
    toplam = e.mask_keys().volume()
    print(f"  tırnakların pencereye giren kısmı %{100 * giren / toplam:.0f} "
          f"{'✓' if giren > 0.99 * toplam else '✗'}")
    tamam &= giren > 0.99 * toplam

    siluet = e.desk_cut(e.body_mass()) ^ e.slab(-200, 200, -200, 200, 0.0, 0.3)
    tasan = (e.mask_profile(0.0, 0.3) - siluet).volume()
    print(f"  yama yüzün dışına taşıyor mu: {tasan:.2f} mm³ {'✓' if tasan < 1e-3 else '✗'}")
    tamam &= tasan < 1e-3

    ilk = e.mask_profile(0.0, 0.2) - pencere.translate([0, 0, 0])
    bos = (ilk - govde).volume() / 0.2
    print(f"  yüzün ilk katmanında yama bölgesi boşluğu {bos:.0f} mm² "
          f"{'✓ (yüz düz)' if bos < 1 else '✗ (oyuk var)'}")
    tamam &= bos < 1
    return tamam


def port_eti(kapak):
    """
    Şarj portunun çevresinde kalan kapak eti — ticari üründe en çok
    zorlanan yer; kablo her gün takılıp çıkarılıyor.

    Arka yüzey 10° yatık, kılıf cebi ise fişe dik; bu yüzden cep üstte
    derin, altta sığ. Yastık eklenmeden önce üst kenarda 0.47 mm et
    kalıyordu. Alt kenardaki zar kartın kenarına dayalı olduğu için daha
    düşük bir eşikle denetleniyor.
    """
    c, s_ = np.cos(np.radians(e.LEAN)), np.sin(np.radians(e.LEAN))

    def govdeye(x, y, z):
        return np.array([x, e.TP_BACK_Y + c * y + s_ * z, e.TP_BACK_Z - s_ * y + c * z])

    yari_h = (e.USB_KILIF_H + 0.6) / 2
    yari_w = (e.USB_KILIF_W + 0.6) / 2
    zemin = e.TP_USB_OVERHANG + e.USB_KILIF_ONU - 0.1
    tamam = True
    for ad, xl, yl, esik in (
        ("üst kenar", 0.0, e.SOKET_Y + yari_h - 0.4, 1.2),
        ("yan kenar", yari_w - 0.4, e.SOKET_Y, 1.0),
        ("alt kenar (kart önü zarı)", 0.0, e.SOKET_Y - yari_h + 0.4, 0.4),
    ):
        p = govdeye(xl, yl, zemin + 0.05)
        igne = e.slab(p[0] - 0.1, p[0] + 0.1, p[1] - 0.1, p[1] + 0.1, p[2] - 8, p[2])
        et = (kapak ^ igne).volume() / 0.04
        iyi = et >= esik
        tamam &= iyi
        print(f"  {ad:26s} {et:4.2f} mm (en az {esik}) {'✓' if iyi else '✗'}")
    return tamam


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


BASILANLAR = ("elcin_govde", "elcin_arka_kapak", "elcin_kulak", "elcin_kol",
              "elcin_goz_yamasi", "elcin_ekran_sablonu", "elcin_port_sablonu")


def parca_sayisi(yol):
    """STL'deki birbirine bağlı olmayan katı sayısı."""
    v = numpy_stl.Mesh.from_file(yol).vectors.reshape(-1, 3)
    _, idx = np.unique(np.round(v, 3), axis=0, return_inverse=True)
    idx = idx.reshape(-1, 3)
    ebeveyn = list(range(int(idx.max()) + 1))

    def kok(a):
        while ebeveyn[a] != a:
            ebeveyn[a] = ebeveyn[ebeveyn[a]]
            a = ebeveyn[a]
        return a

    for t in idx:
        a = kok(int(t[0]))
        for b in (int(t[1]), int(t[2])):
            ebeveyn[kok(b)] = a
    return len({kok(int(t[0])) for t in idx})


def tek_parca_mi():
    """
    Basılan her parça TEK katı mı? Birbirine değmeyen ikinci bir katı,
    dilimleyicide havada basılmaya çalışılan bir ada demek — baskı çorbası.
    """
    temiz = True
    for ad in BASILANLAR:
        n = parca_sayisi(os.path.join(HERE, "stl", ad + ".stl"))
        print(f"  {ad + '.stl':26s} {'tek parça ✓' if n == 1 else f'{n} ayrı parça ✗'}")
        temiz = temiz and n == 1
    return temiz


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
        acik = sum(1 for n in kenar.values() if n == 1)
        cok = sum(1 for n in kenar.values() if n > 2)
        if acik == 0 and cok == 0:
            print(f"  {ad:26s} kapalı ✓")
        else:
            print(f"  {ad:26s} {acik} açık kenar, {cok} manifold-dışı kenar ✗")
        temiz = temiz and acik == 0 and cok == 0
    return temiz


def main():
    liste = moduller()
    govde, kapak = montaj_kabugu()
    kabuk = govde + kapak

    print("\nModül ↔ kabuk")
    tamam = all([kabuk_payi(kabuk, ad, duvar_disi(ad, katı))
                 for ad, katı in liste.items()])
    print(f"  gövde ↔ kapak çakışma {(govde ^ kapak).volume():.1f} mm³")
    tamam = tamam and (govde ^ kapak).volume() < 1e-3

    print("\nModül ↔ modül")
    tamam = modul_carpismasi(liste) and tamam

    print("\nEkran bağlantısı")
    tamam = ekran_baglantisi(govde) and tamam

    print("\nGöz yaması")
    tamam = goz_yamasi(govde) and tamam

    print("\nTaban")
    tamam = taban_kapali_mi(govde, kapak) and tamam

    print("\nŞarj portu")
    tamam = fis_takilabiliyor_mu(kabuk) and tamam
    tamam = port_eti(kapak) and tamam

    print("\nDenge")
    tamam = devrilme() and tamam

    print("\nBaskı: her parça tek katı mı")
    tamam = tek_parca_mi() and tamam

    print("\nSTL")
    tamam = kapalilik() and tamam

    print("\n  " + ("Hepsi geçti." if tamam else "SORUN VAR."))
    return 0 if tamam else 1


if __name__ == "__main__":
    raise SystemExit(main())
