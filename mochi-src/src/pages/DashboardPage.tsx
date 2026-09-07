import { Bot, Cable, CpuIcon, TerminalSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Panel, StatusDot } from '@/components/ui';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDeviceStore, useProjectStore, useUiStore, toast } from '@/store';
import { formatUptime, titleCase } from '@/utils/format';
import { isWebSerialSupported } from '@/services/transport';

const DASH = '—';

export function DashboardPage() {
  const navigate = useNavigate();
  const status = useDeviceStore((s) => s.status);
  const state = useDeviceStore((s) => s.state);
  const mode = useDeviceStore((s) => s.mode);
  const connect = useDeviceStore((s) => s.connect);
  const latency = useDeviceStore((s) => s.latencyMs);
  const project = useProjectStore((s) => s.project);
  const openBottomTab = useUiStore((s) => s.openBottomTab);

  const connected = state === 'connected';
  const simulated = connected && mode === 'simulation';
  const peripherals = status?.peripherals ?? {};

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-ink-hi">
              {project.meta.name}
            </h1>
            <p className="mt-1 text-xs text-ink-mid">
              {project.meta.description}
            </p>
          </div>
          {simulated && (
            <p className="flex items-center gap-1.5 rounded border border-mochi-dim/40 bg-mochi/5 px-2 py-1 text-2xs text-mochi">
              <StatusDot tone="sim" />
              Every reading below comes from the simulator, not hardware.
            </p>
          )}
        </header>

        {!connected && <ConnectPrompt onConnect={(t) => void connect(t).catch(() => undefined)} />}

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatCard
            label="Firmware"
            value={status?.firmware ?? DASH}
            detail={status?.board ?? project.meta.board}
            tone={connected ? 'ok' : 'idle'}
          />
          <StatCard
            label="Uptime"
            value={status ? formatUptime(status.uptimeS) : DASH}
            detail={connected && latency !== null ? `${latency} ms round trip` : undefined}
          />
          <StatCard
            label="Free heap"
            value={status ? Math.round(status.freeHeap / 1024) : DASH}
            unit={status ? 'kB' : undefined}
            detail={status?.cpuLoad !== undefined ? `CPU ${status.cpuLoad}%` : undefined}
          />
          <StatCard
            label="Temperature"
            value={status?.tempC ?? DASH}
            unit={status?.tempC !== undefined ? '°C' : undefined}
          />
          <StatCard
            label="Battery"
            value={status?.batteryPct ?? DASH}
            unit={status?.batteryPct !== undefined ? '%' : undefined}
            detail={status?.batteryMv ? `${status.batteryMv} mV` : undefined}
            tone={
              status?.batteryPct === undefined
                ? 'idle'
                : status.batteryPct < 15
                  ? 'error'
                  : status.batteryPct < 35
                    ? 'warn'
                    : 'ok'
            }
          />
          <StatCard
            label="Wi-Fi"
            value={status?.wifi?.connected ? (status.wifi.ssid ?? 'Connected') : DASH}
            detail={status?.wifi?.connected === false ? 'No credentials stored' : undefined}
            tone={status?.wifi?.connected ? 'ok' : 'idle'}
          />
          <StatCard
            label="Parts"
            value={project.components.length}
            detail={`${project.pins.length} pins assigned`}
          />
          <StatCard
            label="Session"
            value={simulated ? 'Simulation' : connected ? 'Live' : 'Offline'}
            detail={titleCase(state)}
            tone={simulated ? 'sim' : connected ? 'ok' : 'idle'}
          />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_20rem]">
          <Panel title="Robot preview" bodyClassName="p-0">
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
              <Bot size={26} strokeWidth={1.4} className="text-ink-lo" />
              <p className="text-xs text-ink-mid">The 3D viewer is on the Robot screen.</p>
              <p className="max-w-xs text-2xs leading-relaxed text-ink-lo">
                {project.components.length} parts with explode vectors and pin assignments, drawn
                from the same data this dashboard reads. It loads on demand — the scene and
                three.js stay out of this screen's bundle.
              </p>
              <div className="mt-1 flex gap-2">
                <Button variant="primary" onClick={() => navigate('/robot')}>
                  Open the 3D viewer
                </Button>
                <Button onClick={() => navigate('/components')}>Browse the assembly</Button>
              </div>
            </div>
          </Panel>

          <Panel title="Peripherals">
            {connected ? (
              <ul className="divide-y divide-line">
                {Object.entries(peripherals).map(([key, value]) => (
                  <li key={key} className="flex items-center gap-2 px-3 py-1.5">
                    <StatusDot
                      tone={
                        value === 'ok'
                          ? 'ok'
                          : value === 'warning'
                            ? 'warn'
                            : value === 'error'
                              ? 'error'
                              : 'idle'
                      }
                    />
                    <span className="truncate text-xs text-ink-mid">{titleCase(key)}</span>
                    <span className="data ml-auto text-2xs text-ink-lo">{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 text-xs leading-relaxed text-ink-lo">
                Peripheral health is reported by the firmware. Connect a device — real or
                simulated — to populate this list.
              </p>
            )}
          </Panel>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            icon={<TerminalSquare size={13} />}
            onClick={() => openBottomTab('terminal')}
          >
            Open console
          </Button>
          <Button icon={<Bot size={13} />} onClick={() => navigate('/electronics')}>
            Pin map
          </Button>
          <Button
            icon={<CpuIcon size={13} />}
            onClick={() => {
              openBottomTab('terminal');
              toast.info('Console opened', 'Device output streams here.');
            }}
          >
            Watch device output
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConnectPrompt({ onConnect }: { onConnect: (transport: 'serial' | 'mock') => void }) {
  const serialOk = isWebSerialSupported();

  return (
    <div className="panel mt-4 flex flex-wrap items-center gap-3 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-hi">No device connected</p>
        <p className="mt-0.5 text-2xs leading-relaxed text-ink-lo">
          {serialOk
            ? 'Plug the board in over USB, or start the simulator to work without hardware.'
            : 'This browser has no Web Serial API, so USB is unavailable. Chrome or Edge on desktop can talk to the board; the simulator works anywhere.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          icon={<Cable size={13} />}
          disabled={!serialOk}
          onClick={() => onConnect('serial')}
        >
          Connect over USB
        </Button>
        <Button icon={<CpuIcon size={13} />} onClick={() => onConnect('mock')}>
          Start simulator
        </Button>
      </div>
    </div>
  );
}
