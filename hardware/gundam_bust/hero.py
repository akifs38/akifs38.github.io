#!/usr/bin/env python3
"""Tek acili, ekrani 'yanik' gosteren yuksek cozunurluklu hero render (artifact icin)."""
import numpy as np, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import trimesh
from trimesh.creation import box
from trimesh.transformations import translation_matrix as T

m = trimesh.load("gundam_bust.stl")
SCZ = 106 - 34  # ekran merkez yuksekligi
# ekran modul govdesi (cebi doldurur, arkayi kapatir)
scr_body = box((34, 10, 34)); scr_body.apply_transform(T([0, 29.5, SCZ]))
# ekran cami (isikli on yuz)
scr = box((26, 1.4, 26)); scr.apply_transform(T([0, 34.8, SCZ]))

def faces_colors(mesh, base, emissive=None):
    n = mesh.face_normals
    if emissive is not None:
        c = np.asarray(emissive)[None] * np.ones((len(n), 1))
    else:
        light = np.array([0.45, -0.8, 0.55]); light /= np.linalg.norm(light)
        sh = np.clip(n @ light, 0, 1) * 0.72 + 0.28
        c = np.clip(np.asarray(base)[None] * sh[:, None], 0, 1)
    return np.hstack([c, np.ones((len(n), 1))])

fig = plt.figure(figsize=(9, 11), facecolor="#0d0f14")
ax = fig.add_subplot(111, projection="3d")
ax.add_collection3d(Poly3DCollection(m.triangles, facecolors=faces_colors(m, [0.56, 0.63, 0.80]),
                                     edgecolors=(0, 0, 0, 0.12), linewidths=0.25))
b = m.bounds; ctr = (b[0]+b[1])/2; r = (b[1]-b[0]).max()/2*0.98
ax.set_xlim(ctr[0]-r, ctr[0]+r); ax.set_ylim(ctr[1]-r, ctr[1]+r); ax.set_zlim(ctr[2]-r, ctr[2]+r)
ax.set_box_aspect((1, 1, 1)); ax.view_init(elev=12, azim=-62); ax.set_axis_off(); ax.set_facecolor("#0d0f14")
plt.tight_layout(); plt.savefig("hero.png", dpi=130, facecolor="#0d0f14", bbox_inches="tight")
print("saved hero.png")
