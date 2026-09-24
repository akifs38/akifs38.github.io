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

# OLED modülü: 27.0 × 27.0 mm kart, toplam 4.1 mm kalınlık (0.96" sınıfı,
# SSD1306 128×64, I2C). Kalınlık katmanlı: önde cam, arkasında kart, kartın
# arkasında bileşenler.
OLED_PCB_W, OLED_PCB_H, OLED_PCB_T = 27.0, 27.0, 4.1
OLED_KART_T = 1.2            # yalnız kart — pim boyu buna göre

# Cam paneli 26.7 × 19.3 × 1.5: 0.96" SSD1306 panelinin standart dış ölçüsü.
# Eskiden 27 × 16 varsayılıyordu. Basılan şablonda Ø6 kulelerin camın
# köşelerine bastığı görüldü: cam 3.3 mm daha uzun, kulelerin iç kenarı
# (±8.5) camın içinde (±9.65) kalıyordu. Doğrulama bunu göremedi çünkü
# modeldeki cam gerçeğinden kısaydı.
#
# Yanan piksel alanı camın içinde ve daha küçük: 128 × 64 piksel, 0.17 mm
# adımla 21.7 × 10.9 mm.
OLED_GLASS_W, OLED_GLASS_H, OLED_GLASS_T = 26.7, 19.3, 1.5
OLED_PIXEL_W, OLED_PIXEL_H = 21.7, 10.9   # camın içindeki yanan alan
OLED_GLASS_DY = 0.0          # modül merkezinden cam merkezine
# Camın çevresinde hiçbir şeyin giremeyeceği pay. Dayanaklar bu hatta
# kırpılıyor; cam kartın üstünde birkaç onda bir oynayabiliyor.
OLED_CAM_PAYI = 0.5

# Montaj: 2 merkezleme pimi + 2 vida, ÇAPRAZ.
#
# Arkadan (montaj tarafından) bakınca: sol üst ve sağ alt pim, sağ üst ve
# sol alt vida. Önceki sürümde iki vida da alttaydı; pim kartı sıkmadığı
# için üst kenarı hiçbir şey tutmuyordu, kart pimlerden kalkabiliyordu.
# Çapraz vidalar kartı iki köşeden dayanaklara bastırıyor; pimler de öbür
# köşegende kaymayı ve dönmeyi kesiyor.
#
# Sol üst pim yuvarlak, modülün yerini o belirliyor. Sağ alttaki köşegen
# boyunca inceltilmiş ("elmas pim"): delik aralığı birkaç onda bir şaşsa da
# giriyor, dönmeyi yine kesiyor. İki yuvarlak pim olsaydı aralık 0.1 mm
# şaşınca modül oturmazdı. Tolerans: kare delik düzeninde 23.1–23.9 mm.
#
# Vidalar M2 × 4 kendinden kılavuzlu: plastiğe kendi dişini açıyor, somun
# gerekmiyor, ön yüzü delmiyor. Kılavuzlar yuvarlak pime göre hatanın
# geleceği yönde (sağ üstte yatay, sol altta dikey) OLED_VIDA_OVAL kadar
# oval; vida kartın deliğini izleyip doğru yerde tutuyor.
OLED_HOLE_DX, OLED_HOLE_DY = 23.5, 23.5   # delik merkezleri arası (ÖLÇ)
OLED_DELIK_D = 2.0           # karttaki delik
OLED_PIM_D = 1.8             # yuvarlak pim — delikte çapta 0.2 mm pay
OLED_ELMAS_D = 1.7           # elmas pimin geniş yönü
OLED_PIM_INCE = 0.9          # elmas pimin köşegen boyunca kalınlığı
OLED_VIDA_BOY = 4.0          # M2 × 4
OLED_VIDA_KILAVUZ = 1.6      # M2 kendinden kılavuzlu vida için kılavuz deliği
OLED_VIDA_OVAL = 0.8         # kılavuzun uzaması (±0.4)
OLED_DAYANAK_D = 5.0         # pim ve vidanın çevresinde kartın bastığı yüzey

# ESP32-C3 Super Mini — 23 × 18 mm, en kalın yeri (USB soketi dâhil) 5 mm.
ESP_L, ESP_W = 23.0, 18.0
ESP_T = 1.2                  # kartın kendisi
ESP_COMP_H = 3.8             # üstündeki en yüksek bileşen → toplam 5.0 mm

TOUCH_W, TOUCH_H, TOUCH_T = 15.0, 11.0, 1.6      # TTP223

# TP4056 şarj modülü (Type-C)
TP_W, TP_H, TP_T = 26.5, 17.0, 5.0   # ölçüldü, doğrulandı
TP_USB_W, TP_USB_H = 9.5, 3.6        # Type-C soketi
TP_USB_OVERHANG = 0.6                # soketin kart kenarından taşması
# USB-C standardı fiş kılıfını en fazla 12.35 × 6.5 mm'ye sınırlıyor —
# tam da cihaz yapanlar portun etrafına cep açabilsin diye. Cep bundan
# biraz geniş: standarda uyan her kablo sonuna kadar giriyor.
USB_KILIF_W, USB_KILIF_H = 12.35, 6.5
# Takılıyken kılıfın soket yüzüne en fazla bu kadar yaklaştığını varsayıyoruz.
# Standart fişte metal kısım soketin derinliğinden ~0.45 mm uzun; 0.2 bunun
# güvenli tarafı. Cebin tabanı bundan 0.1 mm önde duruyor.
USB_KILIF_ONU = 0.2

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

# 24 mm'den 26.5'e çıktı: TP4056 (26.5 mm) masaya paralel yatıp soketi
# kapaktan dümdüz dışarı bakabilsin diye. Ayrıntısı TP_TILT'in yanında.
INNER_D = 26.5
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
BAT_CY = BELLY_Y            # daha aşağısı TP4056'ya, daha yukarısı OLED'e değiyor
BAT_Z = 0.0                  # main() içinde WALL + 1.0 olarak kullanılıyor
# ── TP4056: masaya paralel, soketi dümdüz arkada ──────────────────────────
#
# Type-C soketi kartın KENARINDA ve kart düzlemine PARALEL bakıyor — telefonun
# şarj soketi gibi. Kart kapağa paralel dururken soketi kapağa asla bakmaz.
#
# İkinci sürümde kart 28° yatırılmıştı (26.5 mm'lik kart 24 mm'lik boşluğa
# ancak öyle sığıyordu). Sonuç ürün kalitesinde değildi: kablo 28° yukarı
# doğru sokuluyor, kapakta 19 × 9 mm'lik kocaman eğik bir yarık kalıyordu.
#
# Şimdi kart MASAYA PARALEL yatıyor, soketi masaya paralel dümdüz arkaya
# bakıyor: kablo masa hizasında itilip takılıyor. İki seçenek ölçüldü:
#
#   kapağa dik port     ✗ taban arkaya doğru yükseldiği için (10° yaslanma)
#                         kart pilin altına sığmıyor; kablo 10° aşağı inip
#                         fişi masaya değdiriyor. Pili ve yüzü 5–6 mm
#                         yukarı itmek gerekirdi.
#   masaya paralel port ✓ kart tabana paralel, pilin altında 3.7 mm pay,
#                         fiş masadan 2.5 mm yukarıda. Tek bedeli gövdenin
#                         2.5 mm derinleşmesi (26.5·cos10° = 26.1 mm).
#
# Arka yüzey 10° yatık olduğu için portun çevresine fişe DİK bir cep
# oyuluyor; soketin baktığı yüz kabloya kare duruyor.
TP_TILT = LEAN               # kart masaya paralel
TP_TABAN_PAY = 0.5           # kartın altıyla taban arasındaki boşluk
TP_KAPAGA_GOMME = 1.0        # kart kenarı kapağın iç yüzüne bu kadar gömülü
# ESP32 kafa merkezinde: küre orada en geniş ve OLED'in tam arkasına
# düşüyor, kablolar kısalıyor.
ESP_CY = HEAD_Y

# Ön duvarın arkasından KARTIN ön yüzüne. Cam kartın önünde, duvara 0.4 mm
# kala duruyor: vida sıkılınca kuvvet dayanaklardan karta geçiyor, cama değil.
OLED_STANDOFF = OLED_GLASS_T + 0.4
ESP_LID_GAP = 1.6            # kapağın iç yüzünden kartın arka yüzüne

# Aç/kapa anahtarı ESP32'nin alt rayının ALTINDA.
#
# Eskiden BELLY_Y + 16'da, rayla bağımsız bir sabitti; anahtarın kapağın
# içine uzanan gövdesi alt raya 175 mm³ giriyordu ve anahtar takılamazdı.
# Doğrulama bunu göremiyordu çünkü anahtarı "duvara gömülü" diye hiç
# denetlemiyordu. Artık konumu rayın dış kenarından türetiliyor: ray
# yerinden oynarsa anahtar da onunla kayar.
ESP_RAY_ALT = ESP_CY - (ESP_W / 2 + CL + 4.0)       # alt rayın dış kenarı
SW_CY = ESP_RAY_ALT - SW_H / 2 - 1.5

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
# Ayrı basılıyor (kulak ve kollarla aynı siyah filament) ve yüzün ÜSTÜNE
# yapışıyor. Yüz alanı %6'dan %21'e çıkıyor ve ekran nerede durursa dursun
# kırpılmıyor — maske pencereyi ÇEVRELİYOR, örtmüyor.
#
# Eskiden yüzde 1 mm'lik bir oyuğa oturuyordu. Gövde yüz tablada basıldığı
# için o oyuğun tavanı 599 mm²'lik desteksiz bir yüzeydi; yan loblarda 12 mm
# konsol, iç kenarı da boş pencere — tutunacak yer yok. Sarkan tavan oyuğu
# sığlaştırıp yamayı eğri oturtuyordu. Artık yüz tamamen düz basılıyor;
# yamayı yerine oturtan şey arkasındaki dört köşe tırnağı, pencerenin
# köşelerine giriyor.
MASK_A = 14.0                # göz yaması yarı-eni
MASK_B = 12.0                # yarı-boyu
MASK_X = 10.0                # merkezden kayma
MASK_DY = 1.0                # yamaların merkezden yukarı kayması
MASK_TILT = 16.0             # dışa doğru yatma (derece)
MASK_BRIDGE_A = 14.0         # iki yamayı birleştiren orta elips
MASK_BRIDGE_B = 10.5
MASK_T = 1.6                 # yama kalınlığı (tamamı yüzün önünde)
KEY_D = 1.2                  # köşe tırnaklarının pencereye giriş derinliği
KEY_W, KEY_H = 4.5, 3.5      # bir tırnağın pencere köşesinde kapladığı alan

# Maskenin deliği dikdörtgen DEĞİL: dikdörtgen delik ekranı vizör gibi
# gösteriyordu. İki daire + ortada köprü, ekranı iki göz çukuruna çeviriyor.
# Ölçüler yanan alandan (21.7 × 10.9) türetildi: gözler ±4, kaşlar ±7 mm'de
# duruyor, ikisi de daire içinde kalıyor; köşeler zaten boş.
HOLE_R = 7.0                 # göz çukuru yarıçapı
HOLE_X = 4.7                 # çukurların merkezden kayması
HOLE_BRIDGE_A = 7.0          # ortadaki köprü elipsi (ağız buradan görünüyor)
HOLE_BRIDGE_B = 5.5

# ── Taban ──────────────────────────────────────────────────────────────────
#
# Masa kesiği iç boşluğun İÇİNDEN geçiyordu: göbeğin iç küresi y = −3.4'e
# iniyor, kesik düzlemi ise y ≈ 0–5'te. Elçin masaya ince bir halka üzerinde
# oturuyordu ve alt tamamen açıktı — pil, TP4056, bütün kablolar alttan
# görünüyor ve parmağa, kaleme, toza açıktı. Taban o boşluğu kapatıyor.
#
# Kalınlık kesik düzlemine dik ölçülüyor. Baskıda yüz tablada olduğu için
# taban dikey bir duvar gibi basılıyor; 2 mm = 5 çeper, köprü ya da destek yok.
FLOOR_T = 2.0

# Arka kapak
LID_T = 2.6
BOSS_D = 7.4
BOSS_PILOT = 2.7             # M3 kendinden kılavuz
LID_CLEAR = 3.4
LID_HEAD = 6.4

# TP4056'nın yerel çerçevesinin orijini (soket kenarının alt ortası).
# Z: kart kenarı kapağın iç yüzüne TP_KAPAGA_GOMME kadar giriyor — kapağın
# içindeki küçük bir cebe oturuyor. Bu hem kartı konumluyor hem de soketi
# dış yüze yaklaştırıyor; fişin sonuna kadar girmesi buna bağlı.
# Y: kartın alt yüzü, tabanın üst yüzünden TP_TABAN_PAY yukarıda ve ona
# paralel. Masa düzlemine dik uzaklık = FLOOR_T + TP_TABAN_PAY.
TP_BACK_Z = BODY_D - LID_T + TP_KAPAGA_GOMME
TP_BACK_Y = ((FLOOR_T + TP_TABAN_PAY + np.sin(np.radians(LEAN)) * TP_BACK_Z)
             / np.cos(np.radians(LEAN)))

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


def oled_baglanti(cy, z0):
    """
    OLED'i tutan dört nokta: bir köşegende iki pim, öbüründe iki vida.

    z0 ön duvarın arka yüzü, cy modül merkezinin yüksekliği. (ekle, oy)
    döner: eklenecek dayanak ve pimler, oyulacak vida kılavuzları. Gövde de
    ölçü şablonu da bunu kullanıyor; ikisi ayrı çizilseydi biri
    düzeltilip diğeri unutulurdu.

    Her noktada kartın ön yüzünün bastığı bir dayanak var. Dayanaklar
    camın dış hattı + OLED_CAM_PAYI kadar kırpılıyor, yani yarım ay
    biçiminde; eski Ø6 kuleler kırpılmıyordu ve camın köşelerine basıyordu.
    """
    z1 = z0 + OLED_STANDOFF
    gy = cy + OLED_GLASS_DY
    cam = slab(-OLED_GLASS_W / 2 - OLED_CAM_PAYI, OLED_GLASS_W / 2 + OLED_CAM_PAYI,
               gy - OLED_GLASS_H / 2 - OLED_CAM_PAYI,
               gy + OLED_GLASS_H / 2 + OLED_CAM_PAYI,
               z0 - 2.0, z1 + 10.0)

    boy = OLED_KART_T + 0.3          # kartın arkasından biraz taşar
    uc = 0.4                         # pah — pim deliği kendisi bulur

    def pim(x, y, d):
        r = d / 2
        p = (Manifold.cylinder(boy - uc + 0.2, r, r, 32)
             + Manifold.cylinder(uc, r, r - 0.35, 32).translate([0, 0, boy - uc + 0.2]))
        return p.translate([x, y, z1 - 0.2])

    hx, hy = OLED_HOLE_DX / 2, OLED_HOLE_DY / 2
    ekle, oy = Manifold(), Manifold()
    for sx in (-1, 1):
        for sy in (-1, 1):
            ekle += post_z(sx * hx, cy + sy * hy, z0 - 0.3, z1, OLED_DAYANAK_D)

    # Pimler: sol üst yuvarlak, sağ alt elmas. Elmas pim köşegen boyunca
    # (yuvarlak pime doğru) inceltilmiş; aralık hatası o yönde birikiyor.
    ekle += pim(-hx, cy + hy, OLED_PIM_D)
    bant = (slab(-OLED_PIM_INCE / 2, OLED_PIM_INCE / 2, -5, 5, -5, 50)
            .rotate([0, 0, -45]).translate([hx, cy - hy, 0]))
    ekle += pim(hx, cy - hy, OLED_ELMAS_D) ^ bant

    # Vidalar: sağ üst ve sol alt. Vida kartı geçip plastiğe
    # (OLED_VIDA_BOY - OLED_KART_T) kadar giriyor; 0.4 mm fazlası pay.
    dip = z1 - (OLED_VIDA_BOY - OLED_KART_T) - 0.4
    o = OLED_VIDA_OVAL / 2
    for (x, y), (ux, uy) in (((hx, cy + hy), (1, 0)), ((-hx, cy - hy), (0, 1))):
        oy += Manifold.batch_hull([
            post_z(x - ux * o, y - uy * o, dip, z1 + 0.5, OLED_VIDA_KILAVUZ),
            post_z(x + ux * o, y + uy * o, dip, z1 + 0.5, OLED_VIDA_KILAVUZ),
        ])
    return ekle - cam, oy


def oled_vida_dibi():
    """Vida kılavuzunun dibi, ön yüzden (z=0) ölçülen derinlik."""
    return WALL + OLED_STANDOFF - (OLED_VIDA_BOY - OLED_KART_T) - 0.4


def tp_yerel(man):
    """
    TP4056'nın yerel çerçevesinden gövde çerçevesine.

    Yerel eksenler: x kart genişliği, y kart yüzeyinin normali (bileşenler
    +y'de), z kart boyunca — +z soket tarafı. Orijin soket kenarının alt
    ortası.
    """
    return man.rotate([-TP_TILT, 0, 0]).translate([0, TP_BACK_Y, TP_BACK_Z])


SOKET_Y = (1.6 + TP_T) / 2          # soketin merkezi, kart yüzeyinden (yerel y)


def _yuvarlak(w, h, z0, z1, r, cy):
    """Yerel çerçevede, merkezi (0, cy) olan köşeleri yuvarlak prizma."""
    return rounded_slab(w, h, z0, z1, r).translate([0, cy, 0])


def tp_kart():
    """
    Kartın kendisi + Type-C soketi, yerleşik hâlde.

    Soket stadyum biçiminde (uçları yarım daire) — gerçek USB-C soketi de
    öyle. Dikdörtgen kutu olarak modellemek köşelerini stadyum deliğinden
    taşırıyordu; gerçek parçada olmayan bir çakışma.
    """
    kart = slab(-TP_H / 2, TP_H / 2, 0.0, 1.6, -TP_W, 0.0)
    sh = TP_T - 1.6
    soket = _yuvarlak(TP_USB_W, sh, -7.0, TP_USB_OVERHANG, sh / 2 - 0.01, SOKET_Y)
    return tp_yerel(kart + soket)


def port_acikligi():
    """
    Kapaktaki şarj portu — iki parça, ikisi de fişin eksenine dik.

    Delik: soketin kendi biçimi (stadyum), çevresinde 0.2 mm pay. İçeriden
    cebin tabanına kadar. Dışarıdan bakınca görünen tek açıklık bu.
    Cep: standart fiş kılıfı (12.35 × 6.5) + pay, cebin tabanı soketin
    yüzüyle aynı hizada. Kılıf cebe girdiği için fiş sonuna kadar oturuyor;
    arka yüzey 10° yatık olduğundan cep üstte biraz derin, altta sığ —
    tabanı kabloya kare duran küçük bir düz yüz.
    """
    dw, dh = TP_USB_W + 0.4, (TP_T - 1.6) + 0.4
    delik = _yuvarlak(dw, dh, -4.0, TP_USB_OVERHANG + 0.1, dh / 2 - 0.01, SOKET_Y)
    cep = _yuvarlak(USB_KILIF_W + 0.6, USB_KILIF_H + 0.6,
                    TP_USB_OVERHANG + USB_KILIF_ONU - 0.1, 15.0, 3.0, SOKET_Y)
    return tp_yerel(delik + cep)


PORT_YASTIK = 1.6            # port takviyesinin kapak içine taşması


def port_yastigi():
    """
    Kapağın içinde, portun ÜSTÜNDE takviye.

    Arka yüzey 10° yatık, cep ise fişe dik; bu yüzden cep üstte derin
    (2.2 mm), altta sığ. 2.6 mm'lik kapakta cebin üst kenarında yalnızca
    0.4 mm et kalıyordu — ticari bir üründe fiş takılıp çıkarıldıkça
    kırılacak yer. Yastık o bölgeyi içeriden kalınlaştırıyor.

    Yalnızca soketin üstünde: altında kart var, yastık oraya uzansaydı
    karta çarpardı.
    """
    ust = SOKET_Y + (USB_KILIF_H + 0.6) / 2 + 2.0
    blok = tp_yerel(slab(-(TP_H / 2), TP_H / 2, TP_T + 0.4, ust, -8.0, 4.0))
    ic_yuz = BODY_D - LID_T
    return blok ^ slab(-200, 200, -200, 200, ic_yuz - PORT_YASTIK, ic_yuz + 0.1)


KART_CEBI_PAY = 0.2           # kart kenarının ötesinde bırakılan boşluk


def kart_cebi():
    """
    Kapağın içinde, kart kenarının oturduğu sığ cep — kartı konumlar.

    Cebin dibiyle dıştaki kılıf cebinin tabanı arasında ince bir zar
    kalıyor: soket kart kenarından yalnızca TP_USB_OVERHANG kadar taşıyor,
    fişin kılıfı ise soketin altına, kart hizasına kadar iniyor. Zar
    kartın kenarına dayalı; takılırken gelen kuvveti kart taşıyor.
    """
    return tp_yerel(slab(-(TP_H / 2 + 0.3), TP_H / 2 + 0.3,
                         -0.3, 1.6 + 0.3, -4.0, KART_CEBI_PAY))


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


def mask_keys():
    """
    Yamayı pencereye kilitleyen dört köşe tırnağı.

    Pencerenin (WINDOW_W × WINDOW_H) köşelerine giriyorlar; kenarlardan CL/2
    pay var. Yamanın göz çukuru tırnaklardan da oyuluyor, yani ön yüzden
    bakınca açıklık kesintisiz. Köşe seçildi çünkü çukurun daireleri
    pencerenin yan kenarlarına neredeyse değiyor — orada tırnak için et yok.
    """
    win_y = OLED_CY + OLED_GLASS_DY
    hx, hy = WINDOW_W / 2 - CL / 2, WINDOW_H / 2 - CL / 2
    tirnak = Manifold()
    for sx in (-1, 1):
        for sy in (-1, 1):
            x1, x2 = sorted((sx * hx, sx * (hx - KEY_W)))
            y1, y2 = sorted((win_y + sy * hy, win_y + sy * (hy - KEY_H)))
            tirnak += slab(x1, x2, y1, y2, 0.0, KEY_D)
    return tirnak


def face_mask():
    """
    Siyah göz yaması — ayrı basılır, yüzün üstüne yapışır.

    Yüzden MASK_T kadar öne çıkıyor; arkadaki tırnaklar pencereye girip onu
    ortalıyor. Göz çukuru gövdedeki pencereden dar: siyah kenar beyaz
    kabuğun pencere ağzını örtüyor, arada beyaz kıl payı görünmüyor. Yanan
    piksel alanı (21.7 × 10.9) buna rağmen tamamen açıkta.
    """
    part = mask_profile(-MASK_T, 0.0) + mask_keys()
    part -= hole_profile(-MASK_T - 1.0, KEY_D + 1.0)
    # Baskı: görünen yüz tablada, tırnaklar yukarıda. Destek gerekmiyor.
    return part.translate([0, -(OLED_CY + OLED_GLASS_DY), MASK_T])


def montaj_kapagi():
    """
    back_lid() baskı yönünde (ters, raylar yukarı) döner; burası onu montaj
    konumuna geri getiriyor.

    Dönüşümü elle kurmak hata üretti: kapak 3.7 mm geride duruyordu ve
    "gövde ↔ kapak çakışması yok" testi tam da bu yüzden geçiyordu. Artık
    tek bir yerde ve ölçüye değil kuralına bağlı: kapağın arka yüzü gövdenin
    arka yüzüyle (BODY_D) çakışır.
    """
    lid = back_lid().rotate([180, 0, 0])
    return lid.translate([0, 0, BODY_D - lid.bounding_box()[5]])


def fis_hacmi():
    """
    Tam takılı bir USB-C fişinin soketin DIŞINDA kalan kısmı.

    Kartın gövdesi kabuğa sığıyor diye soketin ERİŞİLEBİLİR olduğunu
    varsaymak ilk hataydı. Fiş bir yerden girmek zorunda; girdiği koridor
    kabuğun ve masanın dışında kalmalı.

    Kılıf standardın izin verdiği en büyük ölçüde (12.35 × 6.5) ve en kötü
    durumda: soketin yüzünden yalnızca 0.2 mm geride başlıyor. Boyu kablonun
    gerilim gidericisiyle birlikte 25 mm.
    """
    kilif = _yuvarlak(USB_KILIF_W, USB_KILIF_H, TP_USB_OVERHANG + USB_KILIF_ONU,
                      TP_USB_OVERHANG + 25.0, 2.5, SOKET_Y)
    return tp_yerel(kilif)


def oled_katisi(kart_on):
    """
    OLED modülü: önde cam, arkasında kart ve bileşenleri, kartta dört delik.

    Delikler modelde açık — pimler oraya giriyor. Delikleri doldurup
    modülü tek kutu saymak pimleri çakışma diye gösterirdi.
    """
    cam = slab(-OLED_GLASS_W / 2, OLED_GLASS_W / 2,
               OLED_CY + OLED_GLASS_DY - OLED_GLASS_H / 2,
               OLED_CY + OLED_GLASS_DY + OLED_GLASS_H / 2,
               kart_on - OLED_GLASS_T, kart_on)
    kart = slab(-OLED_PCB_W / 2, OLED_PCB_W / 2,
                OLED_CY - OLED_PCB_H / 2, OLED_CY + OLED_PCB_H / 2,
                kart_on, kart_on + OLED_PCB_T - OLED_GLASS_T)
    for sx in (-1, 1):
        for sy in (-1, 1):
            kart -= post_z(sx * OLED_HOLE_DX / 2, OLED_CY + sy * OLED_HOLE_DY / 2,
                           kart_on - 1.0, kart_on + OLED_PCB_T + 1.0,
                           OLED_DELIK_D)
    return cam + kart


def modul_katilari():
    """
    İçine giren modüllerin gerçekte kapladığı hacimler.

    Tek kaynak: doğrulama da (dogrula.py) montaj görüntüsü de (montaj.py)
    buradan besleniyor. Ayrı yerlerde tanımlanmış olsalardı biri güncellenip
    diğeri unutulurdu — TP4056'nın yatırılması tam olarak böyle bir
    değişiklik.
    """
    bat_z = WALL + 1.0
    oled_z = WALL + OLED_STANDOFF          # kartın ön yüzü
    esp_arka = BODY_D - LID_T - ESP_LID_GAP
    ty0 = BODY_H - WALL - TOUCH_MEMBRANE - (TOUCH_T + 0.6)

    def kutu(cy, w, h, z0, z1):
        return slab(-w / 2, w / 2, cy - h / 2, cy + h / 2, z0, z1)

    return {
        "oled": oled_katisi(oled_z),
        "esp32": kutu(ESP_CY, ESP_L, ESP_W,
                      esp_arka - ESP_T - ESP_COMP_H, esp_arka),
        "pil": kutu(BAT_CY, BAT_W, BAT_H, bat_z, bat_z + BAT_T),
        "tp4056": tp_kart(),
        "ttp223": kutu(ty0 + (TOUCH_T + 0.6) / 2, TOUCH_W, TOUCH_T + 0.6,
                       WALL + 1.0, WALL + 1.0 + TOUCH_H),
        "anahtar": (kutu(SW_CY, SW_W, SW_H, BODY_D - LID_T - 4.0, BODY_D + 1.6)
                    + kutu(SW_CY, 4.0, 3.2, BODY_D + 1.0, BODY_D + 4.0)),
    }


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


def masa_bandi(alt, ust):
    """Masa düzlemine paralel bant: düzlemden `alt`–`ust` mm yukarısı."""
    return slab(-200, 200, alt, ust, -200, 200).rotate([-LEAN, 0, 0])


def taban():
    """
    İç boşluğun masa düzlemine en yakın FLOOR_T mm'lik kısmı.

    Kapağın oturduğu banda (z > BODY_D − LID_T) girmiyor: orayı kapağın
    kendisi kapatıyor, taban uzasaydı kapak yerine oturmazdı.
    """
    # Taban iç kürenin yüzeyine tam oturursa iki katı bir çizgi boyunca
    # teğet kalıyor ve birleşimde dört üçgenin paylaştığı manifold-dışı bir
    # kenar çıkıyordu. 0.5 mm duvarın içine gömülünce temiz birleşiyor —
    # duvar 2.6 mm, gömülen kısım dışarıdan görünmüyor.
    gomulu = blob(BELLY_R - WALL + 0.5, BELLY_Y, HEAD_R - WALL + 0.5, HEAD_Y, BODY_D / 2)
    ic = gomulu ^ slab(-200, 200, -200, 200, WALL - 0.1, BODY_D - LID_T)
    return ic ^ masa_bandi(-0.5, FLOOR_T)


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
    # Göz yaması oyuğu YOK: yama yüzün üstüne yapışıyor, tırnakları
    # pencereye giriyor (bkz. MASK_T). Yüz baskıda tamamen düz kalıyor.

    # İç pah: cam kenarı çerçevede gölge yapmasın.
    holes.append(slab(-(WINDOW_W + 3) / 2, (WINDOW_W + 3) / 2,
                      win_y - (WINDOW_H + 3) / 2, win_y + (WINDOW_H + 3) / 2,
                      WALL, WALL + 1.0))

    # ---- OLED: 2 pim + 2 vida ----
    ekle, oy = oled_baglanti(OLED_CY, WALL)
    solids.append(ekle)
    holes.append(oy)

    # ---- taban ----
    solids.append(taban())

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
    # Alt dudak da iki yana kaçık: ortada dursaydı (x ±13) yatık TP4056'nın
    # ön ucu tam oradan geçiyor. Kart x ±8.5'te, dudaklar ±14–19'da.
    for sx in (-1, 1):
        x1, x2 = sorted((sx * 14.0, sx * 19.0))
        solids.append(slab(x1, x2, BAT_CY - bat_hy - rib, BAT_CY - bat_hy,
                           WALL, bat_top))
    # Üst dudak iki yana kaçık: ortada dursaydı (x ±13) OLED modülünün alt
    # kenarının içinden geçiyordu. Yanlara alınca hem modülün x sınırının
    # (±13.5) dışında kalıyor hem de ortadaki açıklık genişliyor.
    for sx in (-1, 1):
        x1, x2 = sorted((sx * 14.0, sx * 19.0))
        solids.append(slab(x1, x2, BAT_CY + bat_hy, BAT_CY + bat_hy + rib,
                           WALL, bat_top))

    # ---- TP4056 yuvası (tabana paralel, göbeğin altında) ----
    #
    # İki ray, iç yüzlerinde oluk. Kart arkadan sürülerek giriyor. Raylar
    # tabandan yükseliyor ve tabanla aynı 10° eğimde — yüz tablada basılırken
    # her katman bir öncekinin üstüne düşüyor, destek gerekmiyor.
    ray_ic = TP_H / 2 + CL + 1.5
    ray_dis = TP_H / 2 + CL + 4.0
    # Raylar kapak omzunun 0.2 mm önünde bitmeli: arkaya taşarsa gövde
    # taşıyor, tam kapak yüzünde biterse montajda ray ucu kapağa bir çizgi
    # boyunca değip manifold-dışı kenar üretiyor.
    ic_bolge = slab(-200, 200, -200, 200, WALL, BODY_D - LID_T - 0.2)
    for sx in (-1, 1):
        x1, x2 = sorted((sx * ray_ic, sx * ray_dis))
        solids.append(tp_yerel(slab(x1, x2, -1.8, 4.2, -TP_W - 2.5, 0.5)) ^ ic_bolge)
        o1, o2 = sorted((sx * (TP_H / 2 + CL), sx * ray_ic))
        # Oluk kartın ön kenarında bitiyor: ray ucu ön dayanak. Kablo
        # takılırken kartı içeri iten kuvveti bu karşılıyor; çıkarırken
        # kartı geri çeken kuvveti kapaktaki cep.
        holes.append(tp_yerel(slab(o1, o2, -0.2, 1.6 + CL, -TP_W - 0.3, 1.0)))
    # Kartın altındaki taban — rayları birbirine bağlıyor.
    solids.append(tp_yerel(slab(-ray_dis, ray_dis, -1.8, -0.2, -TP_W - 1.0, 0.5))
                  ^ ic_bolge)

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

    # TP4056 Type-C portu — gövdenin en altında, arkada, masaya paralel.
    # Görünen tek açıklık soket biçiminde; çevresinde kılıf cebi. Kartın
    # kenarı kapağın içindeki cebe oturup kartı konumluyor.
    lid += port_yastigi()
    lid -= port_acikligi()
    lid -= kart_cebi()

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


def ekran_sablonu():
    """
    Ekran şablonu — gövdeyi basmadan önceki kontrol.

    Gövdedeki OLED bölgesinin kopyası: aynı duvar kalınlığı, aynı pencere,
    aynı pimler, aynı dayanaklar, aynı vida kılavuzları. Hepsi
    oled_baglanti()'dan geliyor, yani gövdedekiyle birebir. Modül burada
    pimlere oturuyor, cama hiçbir şey değmiyor ve iki vida tutuyorsa
    gövdede de öyle.

    Gövde gibi basılıyor: ön yüz tablada, pimler yukarı. Destek gerekmiyor.
    """
    w, h = OLED_PCB_W + 12, OLED_PCB_H + 12
    plate = rounded_slab(w, h, 0.0, WALL, 3.0)

    # Pencere ve iç pah — gövdedeki ile aynı ölçü ve aynı yer.
    plate -= slab(-WINDOW_W / 2, WINDOW_W / 2,
                  OLED_GLASS_DY - WINDOW_H / 2, OLED_GLASS_DY + WINDOW_H / 2,
                  -1.0, WALL + 1.0)

    ekle, oy = oled_baglanti(0.0, WALL)
    plate += ekle
    plate -= slab(-(WINDOW_W + 3) / 2, (WINDOW_W + 3) / 2,
                  OLED_GLASS_DY - (WINDOW_H + 3) / 2,
                  OLED_GLASS_DY + (WINDOW_H + 3) / 2, WALL, WALL + 1.0)
    plate -= oy
    return plate


def port_sablonu():
    """
    Port deneme parçası — kapağın şarj portu bölgesinin birebir kopyası.

    Ticari bir üründe en sık kullanılan, en çok zorlanan yer burası; modülün
    soketi ve kabloların kılıfı markadan markaya değişiyor. Bu parça kapakla
    AYNI geometriyi, AYNI baskı yönünde (dış yüz tablada) taşıyor: kart
    kenarı cebe oturuyor mu, soket deliğe giriyor mu, kablo sonuna kadar
    takılıyor mu — gövdeyi basmadan görülüyor.
    """
    c, s_ = np.cos(np.radians(LEAN)), np.sin(np.radians(LEAN))
    port_y = TP_BACK_Y + c * SOKET_Y + s_ * TP_USB_OVERHANG
    bolge = slab(-15.0, 15.0, port_y - 9.0, port_y + 11.0,
                 BODY_D - LID_T - PORT_YASTIK - 1.0, BODY_D + 0.5)
    parca = montaj_kapagi() ^ bolge
    # Kapakla aynı baskı yönü: dış yüz tablada.
    parca = parca.rotate([180, 0, 0])
    return parca.translate([0, 0, -parca.bounding_box()[2]])


def main():
    print(f"\nElçin  {BODY_W:.1f} G × {BODY_D:.1f} D × {BODY_H:.1f} Y mm"
          f"   ({LEAN:.0f}° yaslı)\n")

    export(front_shell(), "elcin_govde.stl")
    export(back_lid(), "elcin_arka_kapak.stl")
    export(ear(-1).translate([EAR_X, 0, 0]), "elcin_kulak.stl")
    export(arm(-1), "elcin_kol.stl")
    export(face_mask(), "elcin_goz_yamasi.stl")
    export(ekran_sablonu(), "elcin_ekran_sablonu.stl")
    export(port_sablonu(), "elcin_port_sablonu.stl")

    print("\n  Önce elcin_ekran_sablonu.stl ve elcin_port_sablonu.stl bas. Modül")
    print("  oturmuyorsa OLED_* değerlerini düzelt ve bu betiği yeniden çalıştır.\n")


if __name__ == "__main__":
    main()
