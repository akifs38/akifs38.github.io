import { Eye, EyeOff, Focus } from 'lucide-react';
import type { RobotComponent } from '@/types';
import { Button, Field, Panel } from '@/components/ui';
import {
  descendantIds,
  findComponent,
  useDeviceStore,
  useProjectStore,
  useSelectionStore,
} from '@/store';
import { formatUptime, titleCase } from '@/utils/format';
import { getBoardAdapter } from '@/services/board';

export function Inspector() {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const components = useProjectStore((s) => s.project.components);
  const component = findComponent(components, selectedId);

  return (
    <aside
      className="flex shrink-0 flex-col overflow-hidden border-l border-line bg-surface-1"
      style={{ width: '19rem' }}
      aria-label="Inspector"
    >
      {component ? <ComponentInspector component={component} /> : <DeviceInspector />}
    </aside>
  );
}

function ComponentInspector({ component }: { component: RobotComponent }) {
  const components = useProjectStore((s) => s.project.components);
  const pins = useProjectStore((s) => s.project.pins);
  const hidden = useSelectionStore((s) => s.hiddenIds.has(component.id));
  const toggleVisibility = useSelectionStore((s) => s.toggleVisibility);
  const isolate = useSelectionStore((s) => s.isolate);

  const assignments = pins.filter((p) => p.componentId === component.id);
  const parent = findComponent(components, component.parent);

  return (
    <>
      <div className="border-b border-line px-3 py-3">
        <p className="text-2xs text-ink-lo">{titleCase(component.category)}</p>
        <h2 className="mt-0.5 text-sm font-medium text-ink-hi">{component.name}</h2>
        {component.description && (
          <p className="mt-1.5 text-xs leading-relaxed text-ink-mid">{component.description}</p>
        )}
        <div className="mt-2.5 flex gap-1.5">
          <Button
            icon={hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            onClick={() => toggleVisibility(component.id)}
          >
            {hidden ? 'Show' : 'Hide'}
          </Button>
          <Button
            icon={<Focus size={13} />}
            onClick={() => isolate(descendantIds(components, component.id))}
          >
            Isolate
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Group title="Placement">
          <dl>
            {parent && <Field label="Parent">{parent.name}</Field>}
            <Field label="Model node">{component.modelNode}</Field>
            <Field label="Position">{component.position.map((n) => n.toFixed(3)).join(', ')}</Field>
            <Field label="Explode vector">{component.explosionVector.join(', ')}</Field>
            <Field label="Status">{titleCase(component.status)}</Field>
          </dl>
        </Group>

        {component.electrical && (
          <Group title="Electrical">
            <dl>
              {component.electrical.gpio && (
                <Field label="GPIO">
                  {component.electrical.gpio.map((g) => `GPIO${g}`).join(' · ')}
                </Field>
              )}
              {component.electrical.protocol && (
                <Field label="Interface">{component.electrical.protocol.toUpperCase()}</Field>
              )}
              {component.electrical.address && (
                <Field label="Address">{component.electrical.address}</Field>
              )}
              {component.electrical.voltage !== undefined && (
                <Field label="Voltage">{component.electrical.voltage} V</Field>
              )}
              {component.electrical.currentMa !== undefined && (
                <Field label="Current">{component.electrical.currentMa} mA</Field>
              )}
            </dl>
          </Group>
        )}

        {assignments.length > 0 && (
          <Group title="Pin assignments">
            <ul className="space-y-1">
              {assignments.map((a) => (
                <li key={`${a.gpio}-${a.label}`} className="flex items-baseline justify-between gap-2">
                  <span className="data text-xs text-signal">GPIO{a.gpio}</span>
                  <span className="truncate text-2xs text-ink-mid">{a.label}</span>
                </li>
              ))}
            </ul>
          </Group>
        )}

        {component.part && (
          <Group title="Part">
            <dl>
              {component.part.partNumber && <Field label="Part number">{component.part.partNumber}</Field>}
              {component.part.material && <Field label="Material">{component.part.material}</Field>}
              {component.part.weightG !== undefined && <Field label="Weight">{component.part.weightG} g</Field>}
              {component.part.vendor && <Field label="Vendor">{component.part.vendor}</Field>}
            </dl>
          </Group>
        )}
      </div>
    </>
  );
}

function DeviceInspector() {
  const status = useDeviceStore((s) => s.status);
  const connection = useDeviceStore((s) => s.connection);
  const mode = useDeviceStore((s) => s.mode);
  const board = getBoardAdapter(useProjectStore((s) => s.project.meta.board)).definition;

  return (
    <>
      <div className="border-b border-line px-3 py-3">
        <p className="text-2xs text-ink-lo">Board</p>
        <h2 className="mt-0.5 text-sm font-medium text-ink-hi">{board.name}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-mid">
          Select a part in the assembly tree to inspect it here.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Group title="Silicon">
          <dl>
            <Field label="Architecture">{board.architecture}</Field>
            <Field label="Clock">{board.clockMhz} MHz</Field>
            <Field label="Flash">{board.flashBytes / 1024 / 1024} MB</Field>
            <Field label="SRAM">{Math.round(board.sramBytes / 1024)} kB</Field>
            <Field label="Wi-Fi">{board.capabilities.wifi ? '2.4 GHz' : 'none'}</Field>
            <Field label="Bluetooth">{board.capabilities.bluetooth}</Field>
            <Field label="Logic level">{board.logicVoltage} V</Field>
          </dl>
        </Group>

        <Group title="Session">
          <dl>
            <Field label="Mode">{mode === 'live' ? 'Live device' : 'Simulation'}</Field>
            <Field label="Port">{connection?.portLabel ?? '—'}</Field>
            <Field label="Baud">{connection?.baudRate ?? board.defaultBaud}</Field>
            <Field label="Firmware">{status?.firmware ?? '—'}</Field>
            <Field label="Uptime">{status ? formatUptime(status.uptimeS) : '—'}</Field>
            <Field label="Free heap">
              {status ? `${Math.round(status.freeHeap / 1024)} kB` : '—'}
            </Field>
          </dl>
        </Group>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel title={title} className="m-2 border-line" bodyClassName="px-3 py-2">
      {children}
    </Panel>
  );
}
