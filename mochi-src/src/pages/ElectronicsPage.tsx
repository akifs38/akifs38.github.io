import { AlertTriangle, CircleAlert } from 'lucide-react';
import type { PinDefinition } from '@/types';
import { Panel } from '@/components/ui';
import { getBoardAdapter } from '@/services/board';
import { findComponent, useProjectStore, useSelectionStore } from '@/store';
import { cn } from '@/utils/cn';

export function ElectronicsPage() {
  const project = useProjectStore((s) => s.project);
  const select = useSelectionStore((s) => s.select);
  const selectedId = useSelectionStore((s) => s.selectedId);

  const adapter = getBoardAdapter(project.meta.board);
  const board = adapter.definition;
  const issues = adapter.validateAssignments(project.pins);

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  const assignmentFor = (gpio: number) => project.pins.find((p) => p.gpio === gpio);

  const budgetMa = project.components.reduce(
    (sum, c) => sum + (c.electrical?.currentMa ?? 0),
    0,
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-ink-hi">{board.name} pin map</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-mid">
            Every pin the chip has, what the build uses it for, and what the board adapter
            objects to. Reserved pins belong to the flash, the USB bridge or UART0 — the
            validator will not let a component take one.
          </p>
        </header>

        {(errors.length > 0 || warnings.length > 0) && (
          <div className="mt-4 space-y-1.5">
            {errors.map((issue, i) => (
              <IssueRow key={`e${i}`} severity="error" message={issue.message} />
            ))}
            {warnings.map((issue, i) => (
              <IssueRow key={`w${i}`} severity="warning" message={issue.message} />
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_16rem]">
          <Panel title={`Pins · ${project.pins.length} of ${board.pins.filter((p) => !p.reserved).length} usable assigned`} bodyClassName="p-0">
            <ul className="divide-y divide-line/60">
              {board.pins.map((pin) => {
                const assignment = assignmentFor(pin.gpio);
                const component = findComponent(project.components, assignment?.componentId ?? null);
                const active = component?.id === selectedId;

                return (
                  <li key={pin.gpio}>
                    <button
                      disabled={!component}
                      onClick={() => component && select(component.id)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-1.5 text-left',
                        component && 'hover:bg-surface-2/60',
                        active && 'bg-surface-2',
                        !component && 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'data w-16 shrink-0 text-xs',
                          pin.reserved ? 'text-ink-lo' : assignment ? 'text-signal' : 'text-ink-mid',
                        )}
                      >
                        {pin.label}
                      </span>

                      <PinBadge pin={pin} used={Boolean(assignment)} />

                      <span className="min-w-0 flex-1 truncate text-xs text-ink-hi">
                        {assignment ? `${component?.name ?? assignment.componentId} · ${assignment.label}` : ''}
                      </span>

                      <span className="hidden shrink-0 truncate text-2xs text-ink-lo sm:block sm:max-w-[16rem]">
                        {pin.reserved ? pin.reservedReason : pin.note}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <div className="space-y-3">
            <Panel title="Board" bodyClassName="px-3 py-2">
              <dl className="space-y-1 text-xs">
                <Row label="Architecture" value={board.architecture} />
                <Row label="Clock" value={`${board.clockMhz} MHz`} />
                <Row label="Flash" value={`${board.flashBytes / 1024 / 1024} MB`} />
                <Row label="SRAM" value={`${Math.round(board.sramBytes / 1024)} kB`} />
                <Row label="Radio" value={`Wi-Fi 4 · ${board.capabilities.bluetooth.toUpperCase()}`} />
                <Row label="Logic" value={`${board.logicVoltage} V`} />
              </dl>
            </Panel>

            <Panel title="Current budget" bodyClassName="px-3 py-2">
              <p className="data text-lg leading-none text-ink-hi">
                {budgetMa}
                <span className="ml-1 text-xs text-ink-lo">mA</span>
              </p>
              <p className="mt-2 text-2xs leading-relaxed text-ink-lo">
                Sum of the typical draw declared by each part. Both servos stalling at once is the
                worst case — size the regulator for it, not for this figure.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function PinBadge({ pin, used }: { pin: PinDefinition; used: boolean }) {
  const label = pin.reserved
    ? 'reserved'
    : used
      ? 'used'
      : pin.capabilities.includes('strapping')
        ? 'strapping'
        : 'free';

  const tone =
    label === 'reserved'
      ? 'border-line text-ink-lo'
      : label === 'used'
        ? 'border-signal-dim/50 text-signal'
        : label === 'strapping'
          ? 'border-warn/40 text-warn'
          : 'border-line text-ink-lo';

  return (
    <span className={cn('data w-20 shrink-0 rounded border px-1.5 py-px text-center text-2xs', tone)}>
      {label}
    </span>
  );
}

function IssueRow({ severity, message }: { severity: 'error' | 'warning'; message: string }) {
  const Icon = severity === 'error' ? CircleAlert : AlertTriangle;
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded border px-2.5 py-1.5 text-2xs leading-relaxed',
        severity === 'error'
          ? 'border-err/30 bg-err/5 text-err'
          : 'border-warn/30 bg-warn/5 text-warn',
      )}
    >
      <Icon size={13} className="mt-px shrink-0" />
      <span className="text-ink-mid">{message}</span>
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-2xs text-ink-lo">{label}</dt>
      <dd className="data truncate text-xs text-ink-hi">{value}</dd>
    </div>
  );
}
