#!/usr/bin/env python3
"""
Gundam-style masaustu bust (desktop bust) - parametrik govde.

Icerik / Fits:
  - Gogus (chest) merkezinde 1.3" AMOLED ekran penceresi + kart cebi
  - Ic bosluk (cavity): ESP32-C3 SuperMini + TP4056 + LiPo batarya
  - Arka kapak (rear hatch) icin cikma (lip) ve ayri kapak STL'i
  - Kafa ustunde touch sensor cebi + kablo kanali
  - Kaide (base)

Cikti:
  gundam_bust.stl        -> ana govde (kafa + gogus + omuz + kaide)
  gundam_bust_cover.stl  -> arka kapak
  gundam_bust_full.stl   -> ikisi birlestirilmis (onizleme/print-in-place degil)

Not: Tum olculer mm. Elektronik kart olculeri gercek modullere gore parametrik;
     kendi kartlarina gore PARAMS'tan ince ayar yapabilirsin.
"""

import numpy as np
import trimesh
from trimesh.creation import box
from trimesh.transformations import (
    rotation_matrix as rot,
    translation_matrix as trans,
    concatenate_matrices as chain,
)

# ----------------------------------------------------------------------------
# PARAMETRELER (mm)
# ----------------------------------------------------------------------------
P = dict(
    wall=3.0,                 # govde et kalinligi

    # --- Govde / chest (X=genislik, Y=derinlik, Z=yukseklik) ---
    torso_h=94.0,
    torso_top_w=118.0,        # omuz hizi genislik
    torso_bot_w=76.0,         # bel genislik
    torso_depth=56.0,         # on-arka derinlik (on yuz duz/dikey)

    # --- 1.3" AMOLED ekran ---
    scr_win_w=26.0,           # gorunen pencere (aktif alan + biraz)
    scr_win_h=26.0,
    scr_board_w=36.0,         # kart cebi (modul boyutu)
    scr_board_h=36.0,
    scr_board_t=6.0,          # kart cebi derinligi
    scr_bezel=2.5,            # on yuzeydeki cerceve girintisi
    scr_center_z_from_top=34.0,  # ekran merkezinin tepeden mesafesi

    # --- Ic bosluk / cavity ---
    cav_extra_bottom=6.0,     # kaideye yakin taban et payi

    # --- Arka kapak ---
    cover_gap=0.35,           # kapak surme boslugu (tolerans)
    cover_t=3.0,
    cover_lip=4.0,            # cikma derinligi

    # --- Omuzlar ---
    shoulder_w=34.0,
    shoulder_d=46.0,
    shoulder_h=30.0,

    # --- Boyun ---
    neck_w=26.0,
    neck_d=26.0,
    neck_h=12.0,

    # --- Kafa / helmet ---
    head_w=50.0,
    head_d=48.0,
    head_h=46.0,

    # --- Touch sensor (kafa ustu cep) ---
    touch_dia=14.0,
    touch_depth=4.0,
    touch_wire_dia=5.0,

    # --- Kaide / base ---
    base_w=132.0,
    base_d=92.0,
    base_h=12.0,
    base_cham=6.0,
)


def hull(points):
    return trimesh.Trimesh(vertices=np.asarray(points, float)).convex_hull


def prism_trap(top_w, bot_w, depth, h, z0):
    """X'te trapez (ustte genis), Y sabit derinlik. z0 tabani."""
    tw, bw, d = top_w / 2, bot_w / 2, depth / 2
    z1 = z0 + h
    pts = [
        [-bw, -d, z0], [bw, -d, z0], [bw, d, z0], [-bw, d, z0],
        [-tw, -d, z1], [tw, -d, z1], [tw, d, z1], [-tw, d, z1],
    ]
    return hull(pts)


def cyl(r, h, sections=64):
    return trimesh.creation.cylinder(radius=r, height=h, sections=sections)


def T(x=0, y=0, z=0):
    return trans([x, y, z])


parts = []      # birlestirilecek (union) katilar
cuts = []        # cikarilacak (difference) katilar

wall = P['wall']

# ============================================================================
# KAIDE
# ============================================================================
base = box((P['base_w'], P['base_d'], P['base_h']))
base.apply_transform(T(0, 0, P['base_h'] / 2))
# ust kenar pahi icin ustten hafif daraltilmis blok cikar (basit chamfer his)
top_lip = box((P['base_w'] - 2 * P['base_cham'], P['base_d'] - 2 * P['base_cham'], P['base_h']))
top_lip.apply_transform(T(0, 0, P['base_h'] / 2 + P['base_h'] * 0.4))
base = base.union(top_lip)
parts.append(base)

torso_z0 = P['base_h']

# ============================================================================
# GOVDE (torso) - dis kabuk
# ============================================================================
torso = prism_trap(P['torso_top_w'], P['torso_bot_w'], P['torso_depth'],
                   P['torso_h'], torso_z0)
parts.append(torso)

torso_top_z = torso_z0 + P['torso_h']
front_y = P['torso_depth'] / 2       # on yuz duzlemi (+Y)
back_y = -P['torso_depth'] / 2       # arka yuz

# --- Ic bosluk (cavity) ---
cav_w_top = P['torso_top_w'] - 2 * wall
cav_w_bot = P['torso_bot_w'] - 2 * wall
cav_depth = P['torso_depth'] - 2 * wall
cav_h = P['torso_h'] - wall - P['cav_extra_bottom']
cav_z0 = torso_z0 + P['cav_extra_bottom']
cavity = prism_trap(cav_w_top, cav_w_bot, cav_depth, cav_h, cav_z0)
cuts.append(cavity)

# ============================================================================
# GOGUS DETAYI + EKRAN
# ============================================================================
scr_cz = torso_top_z - P['scr_center_z_from_top']

# Merkezi gogus plakasi (proud block) - ekranin ciktigi kokpit blogu
chest_plate_w = P['scr_board_w'] + 26
chest_plate_h = P['scr_board_h'] + 30
chest_plate = box((chest_plate_w, 8, chest_plate_h))
chest_plate.apply_transform(T(0, front_y + 1, scr_cz))
parts.append(chest_plate)

plate_front_y = front_y + 1 + 4  # chest_plate on yuzu

# Ekran cercevesi (bezel ring) - ekranin etrafinda cikintili monitor cercevesi
bezel_ring = box((P['scr_win_w'] + 10, 3, P['scr_win_h'] + 10))
bezel_ring.apply_transform(T(0, plate_front_y + 1, scr_cz))
parts.append(bezel_ring)

# Ekran gorunen penceresi (delik) - on yuzden cavity'ye
win = box((P['scr_win_w'], 40, P['scr_win_h']))
win.apply_transform(T(0, front_y, scr_cz))
cuts.append(win)

# Yan gogus kanallari (side ducts) - ekranin iki yaninda acili bloklar
for sgn in (-1, 1):
    duct = box((10, 6, 24))
    duct.apply_transform(chain(T(sgn * (chest_plate_w / 2 - 3), front_y - 1, scr_cz),
                               rot(np.radians(sgn * 14), [0, 0, 1])))
    parts.append(duct)

# On yuzde cerceve girintisi (bezel recess) - kart on yuzu buraya oturur
bezel = box((P['scr_board_w'] + 3, P['scr_bezel'] * 2, P['scr_board_h'] + 3))
bezel.apply_transform(T(0, plate_front_y, scr_cz))
cuts.append(bezel)

# Kart cebi (board pocket) - cerceve arkasi, modul govdesi icin
pocket_y = plate_front_y - P['scr_bezel'] - P['scr_board_t'] / 2
board_pocket = box((P['scr_board_w'], P['scr_board_t'], P['scr_board_h']))
board_pocket.apply_transform(T(0, pocket_y, scr_cz))
cuts.append(board_pocket)

# Gogus havalandirma yariklari (vents) - ekran altinda dekoratif
for i, dz in enumerate((-1, 0, 1)):
    vent = box((chest_plate_w * 0.62, 5, 2.4))
    vy = scr_cz - P['scr_board_h'] / 2 - 12 - i * 6
    vent.apply_transform(chain(T(0, plate_front_y - 1, vy), rot(np.radians(-12), [1, 0, 0])))
    cuts.append(vent)

# Boyun halkasi / yaka (collar) ust merkez
collar = prism_trap(P['neck_w'] + 20, P['neck_w'] + 26, P['neck_d'] + 16, 8, torso_top_z - 2)
parts.append(collar)

# ============================================================================
# OMUZLAR
# ============================================================================
sh_z = torso_top_z - P['shoulder_h'] / 2 - 2
sh_x = P['torso_top_w'] / 2 + P['shoulder_w'] / 2 - 8
for sgn in (-1, 1):
    sh = box((P['shoulder_w'], P['shoulder_d'], P['shoulder_h']))
    # hafif yukari-disa acili omuz zirhi
    m = chain(T(sgn * sh_x, 0, sh_z + 6),
              rot(np.radians(sgn * -10), [0, 1, 0]))
    sh.apply_transform(m)
    parts.append(sh)
    # omuz ust pah bloklari (chamfer hissi icin kucuk ust blok)
    cap = box((P['shoulder_w'] * 0.8, P['shoulder_d'] * 0.8, 8))
    cap.apply_transform(chain(T(sgn * sh_x, 0, sh_z + P['shoulder_h'] / 2 + 8),
                              rot(np.radians(sgn * -10), [0, 1, 0])))
    parts.append(cap)

# ============================================================================
# BOYUN
# ============================================================================
neck_z0 = torso_top_z + 2
neck = box((P['neck_w'], P['neck_d'], P['neck_h']))
neck.apply_transform(T(0, 0, neck_z0 + P['neck_h'] / 2))
parts.append(neck)

# ============================================================================
# KAFA (helmet)
# ============================================================================
head_z0 = neck_z0 + P['neck_h']
head_cz = head_z0 + P['head_h'] / 2
hw, hd, hh = P['head_w'] / 2, P['head_d'] / 2, P['head_h']

# helmet govdesi: on-alt cene pahi icin hull ile bicimlendir
pts = [
    [-hw, -hd, head_z0], [hw, -hd, head_z0],
    [hw * 0.72, hd * 0.5, head_z0], [-hw * 0.72, hd * 0.5, head_z0],   # cene (dar+geri)
    [-hw, -hd, head_z0 + hh], [hw, -hd, head_z0 + hh],
    [hw, hd, head_z0 + hh], [-hw, hd, head_z0 + hh],
]
head = hull(pts)
parts.append(head)

head_front_y = hd  # yaklasik on yuz

# --- Visor / goz yarigi (recess) ---
visor_z = head_z0 + hh * 0.58
visor = box((P['head_w'] * 0.82, 8, 7))
visor.apply_transform(chain(T(0, head_front_y - 1, visor_z), rot(np.radians(-8), [1, 0, 0])))
cuts.append(visor)

# iki goz (daha derin kucuk delikler)
for sgn in (-1, 1):
    eye = box((9, 6, 4.5))
    eye.apply_transform(chain(T(sgn * 11, head_front_y - 2, visor_z), rot(np.radians(-8), [1, 0, 0])))
    cuts.append(eye)

# --- Agiz maskesi / cene guard (mouth guard) ---
mask = box((P['head_w'] * 0.5, 6, 10))
mask.apply_transform(chain(T(0, head_front_y - 3, head_z0 + hh * 0.32), rot(np.radians(10), [1, 0, 0])))
parts.append(mask)
# maske dikey yariklar
for k in (-1, 0, 1):
    ms = box((2, 6, 8))
    ms.apply_transform(chain(T(k * 6, head_front_y - 2, head_z0 + hh * 0.32), rot(np.radians(10), [1, 0, 0])))
    cuts.append(ms)

# --- Yan havalandirmalar (ear vents) ---
for sgn in (-1, 1):
    ear = box((5, 12, 16))
    ear.apply_transform(T(sgn * (hw + 1), -2, head_z0 + hh * 0.55))
    parts.append(ear)
    # yarik detay
    for k in (-1, 0, 1):
        slot = box((6, 2.2, 12))
        slot.apply_transform(T(sgn * (hw + 1), -2 + k * 3.2, head_z0 + hh * 0.55))
        cuts.append(slot)

# --- Alin krista (forehead crest / kamera) ---
crest = box((10, 6, 8))
crest.apply_transform(T(0, head_front_y - 1, head_z0 + hh * 0.82))
parts.append(crest)

# --- V-Fin anten ---
vfin_z = head_z0 + hh * 0.86
for sgn in (-1, 1):
    blade = box((30, 3, 8))
    m = chain(
        T(sgn * 18, head_front_y - 3, vfin_z + 15),
        rot(np.radians(sgn * 44), [0, 1, 0]),   # disa splay
        rot(np.radians(-6), [1, 0, 0]),         # hafif geri yatik
    )
    blade.apply_transform(m)
    parts.append(blade)
# orta kirmizi ust blok (V ortasi)
vmid = box((8, 6, 10))
vmid.apply_transform(T(0, head_front_y - 4, vfin_z + 6))
parts.append(vmid)

# --- Touch sensor cebi (kafa ustu) ---
head_top_z = head_z0 + hh
touch_pocket = cyl(P['touch_dia'] / 2, P['touch_depth'] + 2)
touch_pocket.apply_transform(T(0, 4, head_top_z - P['touch_depth'] / 2 + 1))
cuts.append(touch_pocket)
# kablo kanali: touch cebinden asagi kafa/boyun bosluguna
wire = cyl(P['touch_wire_dia'] / 2, hh + P['neck_h'] + 20)
wire.apply_transform(T(0, 4, head_top_z - (hh + P['neck_h'] + 20) / 2 + 2))
cuts.append(wire)

# ============================================================================
# ARKA KAPAK ACIKLIGI (rear hatch)
# ============================================================================
open_w = cav_w_bot - 6
open_h = cav_h - 16
open_cz = cav_z0 + cav_h / 2 - 2

# lip recess (disaridan ice cikma) - kapagin oturacagi genis sig cukur
lip_out = box((open_w + 2 * P['cover_lip'], P['cover_t'] + 1, open_h + 2 * P['cover_lip']))
lip_out.apply_transform(T(0, back_y + (P['cover_t'] + 1) / 2 - 0.5, open_cz))
cuts.append(lip_out)
# esas delik (cavity'ye acilir)
hole = box((open_w, P['torso_depth'], open_h))
hole.apply_transform(T(0, back_y, open_cz))
cuts.append(hole)

# ============================================================================
# BOOLEAN: union parts, subtract cuts
# ============================================================================
print("union parts:", len(parts))
body = trimesh.boolean.union(parts)
print("body watertight:", body.is_watertight, "-> subtract", len(cuts), "cuts")
body = trimesh.boolean.difference([body] + cuts)
print("final body watertight:", body.is_watertight, "verts:", len(body.vertices))

# ============================================================================
# ARKA KAPAK (ayri parca)
# ============================================================================
g = P['cover_gap']
cov_plate = box((open_w + 2 * P['cover_lip'] - 2 * g, P['cover_t'], open_h + 2 * P['cover_lip'] - 2 * g))
cov_plug = box((open_w - 2 * g, P['cover_lip'], open_h - 2 * g))
cov_plate.apply_transform(T(0, 0, 0))
cov_plug.apply_transform(T(0, P['cover_t'] / 2 + P['cover_lip'] / 2, 0))
cover = trimesh.boolean.union([cov_plate, cov_plug])
# kapak: dik dursun diye print icin oldugu gibi birak; montaj icin yerine tasi
cover_place = cover.copy()
cover_place.apply_transform(chain(
    T(0, back_y - P['cover_t'] / 2 + 0.6, open_cz),
    rot(np.radians(-90), [1, 0, 0]),
))

# ============================================================================
# EXPORT
# ============================================================================
import os
outdir = os.path.dirname(os.path.abspath(__file__))
body.export(os.path.join(outdir, "gundam_bust.stl"))
cover.export(os.path.join(outdir, "gundam_bust_cover.stl"))
full = trimesh.util.concatenate([body, cover_place])
full.export(os.path.join(outdir, "gundam_bust_full.stl"))

bb = body.bounds
print("\n=== OK ===")
print("body bbox (mm):", np.round(bb[1] - bb[0], 1))
print("body volume (cm^3):", round(body.volume / 1000, 1))
print("files: gundam_bust.stl, gundam_bust_cover.stl, gundam_bust_full.stl")
