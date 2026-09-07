# Mochi Robot Studio

A browser-based development environment for an ESP32-C3 desktop robot: inspect the
assembly, map the pins, talk to the board over USB, and — as later phases land —
control it, simulate it and flash it.

The studio runs entirely client-side. There is no backend, and none is required
until firmware compilation arrives.

## Status

Phase 1 of 14. What works today:

| Screen | State |
| --- | --- |
| Dashboard | Live device status, peripheral health, session mode |
| Components | Assembly tree, bill of materials, part inspector, hide/isolate |
| Electronics | Full ESP32-C3 pin map with adapter validation |
| Settings | Browser capability report, transport availability, project facts |
| Console | Real serial stream with tx/rx tagging and problem filtering |
| Connection | Web Serial transport + a simulated device that speaks the real protocol |

Everything else shows what it will do and in which phase. Nothing renders a
mock-up that implies working software — see "No fake functionality" below.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # typecheck + production bundle
npm run preview   # serve the built bundle
```

Node 20 or newer. Works on Windows, macOS and Linux.

## Talking to hardware

Web Serial needs Chrome or Edge on desktop, over HTTPS or `localhost`. The dev
server on `localhost` qualifies.

1. Flash `firmware/mochi` to an ESP32-C3 (see `firmware/README.md`).
2. Click **Connect → Connect over USB** and pick the port.
3. The console at the bottom of the window shows the stream; `tx` lines are what
   the studio sent, `rx` lines are what the board answered.

No board to hand? **Connect → Simulated device** runs an in-memory ESP32-C3 that
answers the same frames. The interface labels the session "Simulation"
throughout so a simulated reading is never mistaken for a measurement.

## Layout

```
src/
  components/    layout chrome, UI primitives, robot views, command palette
  data/          the robot itself: parts, pins, board table, firmware history
  hooks/         global keyboard shortcuts
  pages/         one screen per route, lazily loaded
  router/        route table and navigation model
  services/
    board/       BoardAdapter — everything ESP32-C3-specific
    device/      DeviceSession — connection lifecycle, heartbeat, framing
    protocol/    NDJSON codec and typed frame constructors
    transport/   Transport interface + serial, mock and (declared) Wi-Fi
  store/         Zustand slices: ui, device, project, selection, viewer
  types/         the data models everything else agrees on
firmware/mochi/  reference ESP32-C3 firmware speaking the same protocol
docs/            architecture, protocol reference, roadmap, asset pipeline
```

## Deploying

The build is static, so any static host works. `.github/workflows/deploy.yml`
publishes to GitHub Pages on every push to `main`:

1. Push the repository to GitHub.
2. **Settings → Pages → Source → GitHub Actions**.
3. Push to `main`. The site lands at `https://<user>.github.io/<repo>/`.

Two things the workflow handles that a plain `vite build` does not:

- **Base path.** A project site is served from a subdirectory, so the build runs
  with `BASE_PATH=/<repo>/` and the router picks the same prefix up from
  `import.meta.env.BASE_URL`.
- **SPA routing.** Pages has no rewrite rules, so `dist/404.html` is written as a
  copy of `index.html`. An unmatched path lands there, the app boots and React
  Router resolves the real route. Hosts with a real SPA fallback — Netlify,
  Vercel, Cloudflare Pages — ignore the file and serve a proper 200 instead.

Web Serial needs a secure context, and Pages is HTTPS, so **connecting to the
board works from the deployed site** — no local server needed to talk to the
robot. Serial permissions are stored per origin, so the deployed site and
`localhost` each ask for the port once.

Free GitHub Pages requires a public repository. On a private repo, Pages needs a
paid plan; Cloudflare Pages has no such restriction.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — the decisions and why they were made
- [`docs/protocol.md`](docs/protocol.md) — every frame, both directions
- [`docs/3d-assets.md`](docs/3d-assets.md) — getting a real `robot.glb` into the viewer
- [`docs/roadmap.md`](docs/roadmap.md) — the 14 phases and what each delivers
- [`firmware/README.md`](firmware/README.md) — building and flashing the firmware

## No fake functionality

A control that cannot do its job says so. The build console reports that no
toolchain is configured rather than printing a fake compile; a screen that is not
built yet names its phase instead of rendering an empty shell; disconnected
readings are em dashes, not plausible numbers. This is a deliberate constraint —
a tool that lies about the robot is worse than no tool.

## Adding things

**A part.** Append to `src/data/components.ts`. The tree, the BOM, the inspector
and (from Phase 2) the 3D scene pick it up with no other change.

**A board.** Write a `BoardDefinition` and a `BoardAdapter`, register it in
`src/services/board/index.ts`. Nothing in the UI knows what an ESP32-C3 is.

**A transport.** Implement `Transport` in `src/services/transport/`, add it to the
factory map. `DeviceSession` and the connect menu need no changes.
