# Architecture

## The shape of the thing

Four layers, each only aware of the one below it.

```
  pages / components          React. Renders state, dispatches actions.
        │
  store (Zustand slices)      The only mutable state in the app.
        │
  services                    DeviceSession · Transport · Protocol · BoardAdapter
        │
  data / types                The robot, the board, the wire format.
```

Nothing in `components/` imports a transport. Nothing in `services/` imports
React. The stores are the seam, which is what makes the 3D scene in Phase 2 able
to read a selection that the assembly tree wrote, without either knowing the
other exists.

## State management

Zustand, split into five slices rather than one store.

- `uiStore` — panel visibility, sizes, active console tab, palette
- `deviceStore` — connection state, device status, log ring, sensor window, actuator echo
- `projectStore` — the robot: parts, pins, firmware history, model mapping
- `selectionStore` — selected / hovered / hidden / isolated / expanded ids
- `viewerStore` — explode factor, section planes, ghost, camera preset, debug flags

Zustand rather than Redux or Context for one specific reason: the 3D scene will
need to read `viewerStore.explode` inside `useFrame` at 60 fps. Zustand's
`subscribe` gives a transient subscription that reads state without re-rendering
the React tree; Context re-renders every consumer on every change and would make
a slider drag drop frames across the whole application.

Slices are separate so the 3D canvas can subscribe to viewer state without
waking on every serial log line. `deviceStore` receives roughly one update per
100 ms when connected; nothing that renders the robot should be subscribed to it.

## Device layer

```
UI ── deviceStore ── DeviceSession ── Transport ── hardware / simulator
                          │
                    protocol codec
```

`DeviceSession` owns everything stateful about a connection: opening the
transport, framing, the heartbeat timer, request/response correlation by frame
id, and translating inbound frames into sink callbacks. It reports through a
`DeviceSessionSink` interface rather than importing the store, which keeps it
free of React and free of import cycles, and makes it testable without a DOM.

`Transport` is the only thing that knows how bytes move. Three implementations
exist:

- `SerialTransport` — Web Serial, real
- `MockTransport` — a simulated ESP32-C3, real protocol, in-memory pipe
- `WifiTransport` — declared, refuses to connect, reports why

The mock is not a stub. It parses frames, validates them, rejects unknown types
with a real error frame, maintains servo and expression state, and pushes
telemetry on a timer. It exists so the studio is usable without hardware and so
the protocol has a second implementation to disagree with the firmware — a
protocol tested only against one board is a protocol nobody tests.

### Heartbeat

The studio pings every 2 s and expects a `pong` carrying the same frame id.
Three unanswered pings and the session tears down and reports "Device stopped
answering". The firmware runs a mirror of this: eight seconds without any frame
and it drops the sensor subscription so it never streams into a dead port.

## Board abstraction

`BoardAdapter` holds everything board-specific: the pin table, what each pin can
do, which pins the chip has already claimed, firmware image validation, and USB
vendor filters for the port picker. `ESP32C3Adapter` is the only implementation
today. Adding an S3 or an RP2040 means writing an adapter and registering it —
no UI change, because no UI file contains the string "esp32".

The pin validator is the reason this is worth doing. It knows GPIO 12–17 are the
SPI flash, that 18/19 are USB, that 2/8/9 are strapping pins whose level at reset
picks the boot mode, and that ADC2 (GPIO5) stops answering when the radio comes
up. That knowledge lives in one file and surfaces in the Electronics page as
errors and warnings against the actual wiring.

## 3D architecture (Phase 2, designed now)

```
RobotScene            Canvas, lights, environment, controls
  └─ RobotModel       loads GLB or generates placeholder primitives
       └─ PartNode    one per component, wraps a mesh
```

Each `PartNode` resolves its transform through a single hook that composes:

```
final = base transform
      ∘ explode offset      (explosionVector × distance × explode factor)
      ∘ visibility          (hidden / isolated)
      ∘ material override   (ghost, selection outline, wireframe)
```

Explode, ghost, section and isolate are therefore all *view transforms* over the
same data — adding one does not touch the model, the loader, or the other three.

The placeholder model is generated from the `placeholder` field on each
component. Real geometry replaces it by dropping in `public/assets/robot.glb`;
node names that do not match get remapped in `src/data/modelMapping.ts`. Nothing
downstream — selection, tree sync, explode, inspector — changes either way.

## Rendering strategy

Every route is a lazy chunk. Three.js and React Three Fiber are large and belong
only to `/robot`; someone who opens the pin map should not download a renderer.
The current build ships a 22 kB gzipped app chunk plus 89 kB of framework.

## Security posture

- No `eval`, no `Function`, no dynamic import of user content. The Phase 15 code
  editor will edit text and hand it to a compiler; it will never execute it.
- Firmware images are validated before they touch the port: extension, size
  against the real flash capacity, and the ESP application magic byte.
- Serial input is treated as untrusted. Lines are length-capped, JSON parsing is
  wrapped, and anything that fails to parse is displayed as text rather than
  interpreted.
- All device access is user-gestured. `navigator.serial.requestPort()` cannot be
  called without a click, which is the browser's design and a good one.

## Where a backend would go

Nothing in the app assumes local state. When a backend arrives it slots in at
three seams, none of which require restructuring:

1. **Build service** — a `BuildAdapter` interface behind the Firmware page.
   `POST` sources, poll for a `.bin`, hand it to the existing upload path.
2. **Project persistence** — `projectStore` is already the single owner of the
   project. Swapping its in-memory value for a fetch is a one-file change.
3. **Wi-Fi transport** — `WifiTransport` is written and registered; it needs a
   WebSocket implementation, not a place to live.
