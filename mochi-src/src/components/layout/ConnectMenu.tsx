import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Cable, CpuIcon, Wifi } from 'lucide-react';
import type { TransportId } from '@/types';
import { listTransports } from '@/services/transport';
import { Button } from '@/components/ui';
import { useDeviceStore, selectIsBusy } from '@/store';
import { cn } from '@/utils/cn';

const icons: Partial<Record<TransportId, typeof Cable>> = {
  serial: Cable,
  mock: CpuIcon,
  wifi: Wifi,
};

export function ConnectMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const state = useDeviceStore((s) => s.state);
  const busy = useDeviceStore(selectIsBusy);
  const connect = useDeviceStore((s) => s.connect);
  const disconnect = useDeviceStore((s) => s.disconnect);

  const connected = state === 'connected';

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (connected) {
    return (
      <Button variant="default" onClick={() => void disconnect()}>
        Disconnect
      </Button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="primary"
        busy={busy}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Connect
        <ChevronDown size={13} className="-mr-0.5 opacity-70" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-40 w-72 overflow-hidden rounded-md border border-line bg-surface-2 shadow-xl shadow-black/50"
        >
          {listTransports().map((t) => {
            const Icon = icons[t.id] ?? Cable;
            const enabled = t.capabilities.available;
            return (
              <button
                key={t.id}
                role="menuitem"
                disabled={!enabled}
                onClick={() => {
                  setOpen(false);
                  void connect(t.id).catch(() => undefined);
                }}
                className={cn(
                  'flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left last:border-b-0',
                  enabled ? 'hover:bg-surface-3' : 'cursor-not-allowed',
                )}
              >
                <Icon
                  size={15}
                  className={cn('mt-0.5 shrink-0', enabled ? 'text-ink-mid' : 'text-ink-lo')}
                  strokeWidth={1.75}
                />
                <span className="min-w-0">
                  <span
                    className={cn('block text-xs', enabled ? 'text-ink-hi' : 'text-ink-lo')}
                  >
                    {t.label}
                  </span>
                  <span className="mt-0.5 block text-2xs leading-snug text-ink-lo">
                    {t.capabilities.unavailableReason ??
                      (t.id === 'mock'
                        ? 'Runs the real protocol against a simulated board. No hardware needed.'
                        : 'Opens the browser port picker. Chrome or Edge on desktop.')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
