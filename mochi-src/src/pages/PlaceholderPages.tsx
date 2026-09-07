import { useNavigate } from 'react-router-dom';
import { PhaseNotice } from '@/components/ui';
import { useUiStore } from '@/store';

/**
 * These screens are on the roadmap, not in the build. Each one says what it
 * will do and when, and offers the nearest thing that works today — rather than
 * rendering a shell that looks functional.
 */

export function RobotPage() {
  const navigate = useNavigate();
  return (
    <PhaseNotice
      phase={2}
      title="3D viewer"
      summary="The scene, the placeholder model and camera controls land next. The data it renders already exists: every part carries a model node, a local transform and an explode vector."
      bullets={[
        'React Three Fiber canvas with orbit, pan and zoom',
        'Placeholder primitives generated from each part, swapped for assets/robot.glb without code changes',
        'Click a mesh to select it — the assembly tree already listens for that selection',
      ]}
      action={{ label: 'Browse the assembly instead', onClick: () => navigate('/components') }}
    />
  );
}

export function FirmwarePage() {
  const openBottomTab = useUiStore((s) => s.openBottomTab);
  return (
    <PhaseNotice
      phase={8}
      title="Firmware manager"
      summary="Uploading a prebuilt .bin over USB comes first; compiling in the browser is a separate problem and a later phase. The board adapter already validates images, so the checks are written and tested — only the flashing path is missing."
      bullets={[
        'Select, validate and flash a .bin over Web Serial',
        'Release history with notes and rollback',
        'Compiling stays out until there is a real toolchain — no fake build output',
      ]}
      action={{ label: 'Open the build console', onClick: () => openBottomTab('build') }}
    />
  );
}

export function BehaviorPage() {
  return (
    <PhaseNotice
      phase={12}
      title="Behavior editor"
      summary="A node graph for the robot's reactions: an event triggers a chain of servo moves, expressions, sounds and waits, saved with the project and compiled down to firmware-side behaviour scripts."
      bullets={[
        'Event, delay, servo, LED, display, sound, condition, loop and variable nodes',
        'Runs against the simulator first, then against hardware',
      ]}
    />
  );
}

export function ControlPage() {
  return (
    <PhaseNotice
      phase={9}
      title="Robot control"
      summary="Direct control over head angles, LED colour, volume and expression. The protocol frames for all of it are already written and the simulator answers them — this screen is the surface that sends them."
      bullets={[
        'Head pan and tilt sliders bound to servo.set',
        'Colour picker bound to led.set, expression buttons bound to expression.set',
        'Works against the simulator when no board is plugged in',
      ]}
    />
  );
}

export function SerialMonitorPage() {
  const openBottomTab = useUiStore((s) => s.openBottomTab);
  return (
    <PhaseNotice
      phase={7}
      title="Serial monitor"
      summary="A full monitor with timestamps, filters, pause, baud switching, a send box and log export. The console at the bottom of the window already streams the same data if you need it now."
      bullets={[
        'Filter by level and by direction',
        'Send raw lines or protocol frames',
        'Save the session to a file',
      ]}
      action={{ label: 'Open the console', onClick: () => openBottomTab('serial') }}
    />
  );
}

export function SensorsPage() {
  return (
    <PhaseNotice
      phase={10}
      title="Sensor dashboard"
      summary="Rolling 60-second charts of battery, temperature, microphone level and free heap. The samples are already arriving and being buffered — this screen draws them."
      bullets={['Live charts over a 60 s window', 'Per-sensor subscription intervals']}
    />
  );
}

export function DiagnosticsPage() {
  return (
    <PhaseNotice
      phase={11}
      title="Diagnostics"
      summary="Per-peripheral self-test: sweep each servo, draw a test pattern on the display, play a tone, sample the microphone, read the battery divider. Results come from the device, not from a checklist in the browser."
      bullets={['One test per peripheral, run on demand', 'Pass, warn or fail with the measured value']}
    />
  );
}

export function AssetsPage() {
  return (
    <PhaseNotice
      phase={13}
      title="Assets"
      summary="Drop a .glb in and the viewer picks it up. Node names that do not match get mapped in modelMapping rather than renamed in Blender."
      bullets={[
        'GLB and texture upload, stored in IndexedDB',
        'Draco and KTX2 decoding',
        'Node-to-component mapping editor',
      ]}
    />
  );
}
