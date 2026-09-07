# Roadmap

Fourteen phases. The application builds, typechecks and runs at the end of every
one — no phase leaves the tree in a state where `npm run dev` shows a blank page.

| Phase | Delivers | State |
| --- | --- | --- |
| 1 | App shell, routing, theme, stores, transport layer, protocol, board adapter, console, Dashboard / Components / Electronics / Settings | **done** |
| 2 | 3D viewer: R3F canvas, placeholder model, camera presets, fit, orbit | next |
| 3 | Assembly tree ↔ scene selection sync, outline highlight, focus-on-select | |
| 4 | Exploded view slider, per-group explode, eased transitions | |
| 5 | Ghost mode, section planes, isolate, wiring view, part visibility | |
| 6 | Firmware upload over Web Serial: validate, flash, verify, reconnect | |
| 7 | Full serial monitor: filters, pause, baud switching, send box, export | |
| 8 | Firmware manager: releases, rollback, metadata, Wi-Fi transport + OTA | |
| 9 | Robot control: head sliders, colour picker, expressions, audio | |
| 10 | Simulation: expression engine, idle behaviour, servo animation in 3D | |
| 11 | Diagnostics: per-peripheral self-test driven by the device | |
| 12 | Behavior editor: node graph, event → action chains | |
| 13 | Project system: IndexedDB persistence, `.mochi` import/export, asset upload | |
| 14 | Performance: Draco, KTX2, LOD, instancing, frustum culling | |

## Ordering

The 3D work (2–5) comes before the device work (6–9) because the 3D viewer is
what the studio is *for* — everything else is instrumentation around it. The
transport and protocol layers were built in Phase 1 rather than Phase 6 because
the mock device is what makes phases 2–5 developable without hardware.

Compilation is deliberately last among the firmware features. It is the only
part that cannot be done client-side, and pretending otherwise would have shaped
the whole architecture around a capability that does not exist yet.
