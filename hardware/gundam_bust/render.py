#!/usr/bin/env python3
import sys, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import trimesh

stl = sys.argv[1] if len(sys.argv) > 1 else "gundam_bust.stl"
out = sys.argv[2] if len(sys.argv) > 2 else "preview.png"
m = trimesh.load(stl)

# light direction shading
tris = m.triangles
normals = m.face_normals
light = np.array([0.4, -0.8, 0.5]); light = light / np.linalg.norm(light)
shade = np.clip(normals @ light, 0, 1) * 0.75 + 0.25
base = np.array([0.55, 0.62, 0.78])   # mavi-gri gundam tonu
colors = np.clip(base[None, :] * shade[:, None], 0, 1)
colors = np.hstack([colors, np.ones((len(colors), 1))])

views = [(18, -70, "on-3/4 / front-3/4"), (12, -180, "yan / side"),
         (12, -90, "on / front"), (75, -90, "ust / top")]
fig = plt.figure(figsize=(14, 12), facecolor="#111318")
for i, (el, az, ttl) in enumerate(views):
    ax = fig.add_subplot(2, 2, i + 1, projection="3d")
    pc = Poly3DCollection(tris, facecolors=colors, edgecolors=(0, 0, 0, 0.08), linewidths=0.15)
    ax.add_collection3d(pc)
    b = m.bounds
    ctr = (b[0] + b[1]) / 2
    r = (b[1] - b[0]).max() / 2 * 1.05
    ax.set_xlim(ctr[0] - r, ctr[0] + r)
    ax.set_ylim(ctr[1] - r, ctr[1] + r)
    ax.set_zlim(ctr[2] - r, ctr[2] + r)
    ax.set_box_aspect((1, 1, 1))
    ax.view_init(elev=el, azim=az)
    ax.set_axis_off()
    ax.set_title(ttl, color="#c9d1e0", fontsize=12)
    ax.set_facecolor("#111318")
fig.suptitle(f"Gundam Masaustu Bust — {os.path.basename(stl)}", color="#e6ecf5", fontsize=16, y=0.97)
plt.tight_layout()
plt.savefig(out, dpi=110, facecolor="#111318", bbox_inches="tight")
print("saved", out)
