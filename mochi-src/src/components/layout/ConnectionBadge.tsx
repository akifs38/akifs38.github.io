import type { ConnectionState } from '@/types';
import { StatusDot, type DotTone } from '@/components/ui';
import { useDeviceStore } from '@/store';

const label: Record<ConnectionState, string> = {
  disconnected: 'Not connected',
  requesting: 'Choose a port…',
  connecting: 'Connecting',
  handshaking: 'Handshaking',
  connected: 'Connected',
  error: 'Connection error',
};

const tone: Record<ConnectionState, DotTone> = {
  disconnected: 'idle',
  requesting: 'busy',
  connecting: 'busy',
  handshaking: 'busy',
  connected: 'ok',
  error: 'error',
};

export function ConnectionBadge() {
  const state = useDeviceStore((s) => s.state);
  const mode = useDeviceStore((s) => s.mode);
  const connection = useDeviceStore((s) => s.connection);
  const latency = useDeviceStore((s) => s.latencyMs);
  const status = useDeviceStore((s) => s.status);

  const connected = state === 'connected';
  const simulated = connected && mode === 'simulation';

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className="flex items-center gap-1.5">
        <StatusDot
          tone={simulated ? 'sim' : tone[state]}
          pulse={state === 'connecting' || state === 'handshaking'}
        />
        <span className={connected ? 'text-ink-hi' : 'text-ink-mid'}>
          {simulated ? 'Simulation' : label[state]}
        </span>
      </span>

      {connection && (
        <>
          <span className="h-3 w-px bg-line" aria-hidden />
          <span className="data text-ink-mid">{connection.portLabel}</span>
        </>
      )}

      {status && (
        <>
          <span className="h-3 w-px bg-line" aria-hidden />
          <span className="data text-ink-mid">fw {status.firmware}</span>
        </>
      )}

      {connected && latency !== null && (
        <span className="data text-ink-lo">{latency} ms</span>
      )}
    </div>
  );
}
