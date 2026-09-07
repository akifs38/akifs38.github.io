import { Panel } from '@/components/ui';
import { getBoardAdapter, listBoards } from '@/services/board';
import { listTransports } from '@/services/transport';
import { useProjectStore } from '@/store';
import { detectBrowser, isDesktop, isSecureContextOk } from '@/utils/env';
import { PROTOCOL_VERSION } from '@/types';
import { cn } from '@/utils/cn';

export function SettingsPage() {
  const project = useProjectStore((s) => s.project);
  const board = getBoardAdapter(project.meta.board).definition;
  const browser = detectBrowser();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <header>
          <h1 className="text-xl font-medium tracking-tight text-ink-hi">Settings</h1>
          <p className="mt-1 text-xs text-ink-mid">
            What this browser can and cannot do, and what the project is currently set to.
          </p>
        </header>

        <Panel title="Environment" bodyClassName="divide-y divide-line/60">
          <Check
            ok={browser === 'chromium'}
            label="Chromium-based browser"
            detail={
              browser === 'chromium'
                ? 'Web Serial is available here.'
                : 'Web Serial only ships in Chrome and Edge. Everything else in the studio still works, and the simulator needs no hardware.'
            }
          />
          <Check
            ok={isSecureContextOk}
            label="Secure context"
            detail={
              isSecureContextOk
                ? 'Running over HTTPS or localhost, so device APIs are permitted.'
                : 'Web Serial refuses to run outside HTTPS or localhost.'
            }
          />
          <Check
            ok={isDesktop}
            label="Desktop platform"
            detail={
              isDesktop
                ? 'USB serial ports can be enumerated.'
                : 'Mobile browsers do not expose USB serial ports.'
            }
          />
        </Panel>

        <Panel title="Transports" bodyClassName="divide-y divide-line/60">
          {listTransports().map((t) => (
            <Check
              key={t.id}
              ok={t.capabilities.available}
              label={t.label}
              detail={
                t.capabilities.unavailableReason ??
                `Binary upload ${t.capabilities.supportsBinaryUpload ? 'supported' : 'unsupported'} · reset ${t.capabilities.supportsReset ? 'supported' : 'unsupported'}`
              }
            />
          ))}
        </Panel>

        <Panel title="Project" bodyClassName="px-3 py-2.5">
          <dl className="space-y-1.5 text-xs">
            <Row label="Name" value={project.meta.name} />
            <Row label="Board" value={`${board.name} (${board.id})`} />
            <Row label="Project version" value={project.meta.version} />
            <Row label="Protocol version" value={String(PROTOCOL_VERSION)} />
            <Row label="Registered boards" value={listBoards().join(', ')} />
            <Row label="Default baud" value={String(board.defaultBaud)} />
          </dl>
          <p className="mt-3 text-2xs leading-relaxed text-ink-lo">
            The project is held in memory for now. Persistence to IndexedDB, plus import and
            export of .mochi bundles, lands in Phase 13.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-2.5 px-3 py-2.5">
      <span
        className={cn('mt-1 size-2 shrink-0 rounded-full', ok ? 'bg-ok' : 'bg-idle')}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-xs text-ink-hi">{label}</p>
        <p className="mt-0.5 text-2xs leading-relaxed text-ink-lo">{detail}</p>
      </div>
    </div>
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
