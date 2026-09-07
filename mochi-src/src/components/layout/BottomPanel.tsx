import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import type { LogEntry } from '@/types';
import { Button, EmptyState, Tabs, type TabItem } from '@/components/ui';
import { useDeviceStore, useUiStore, type BottomTab } from '@/store';
import { MIN_BOTTOM_HEIGHT, MAX_BOTTOM_HEIGHT } from '@/store/uiStore';
import { formatClock } from '@/utils/format';
import { cn } from '@/utils/cn';

const TABS: TabItem<BottomTab>[] = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'serial', label: 'Serial' },
  { id: 'logs', label: 'Logs' },
  { id: 'build', label: 'Build' },
  { id: 'problems', label: 'Problems' },
];

export function BottomPanel() {
  const open = useUiStore((s) => s.bottomOpen);
  const height = useUiStore((s) => s.bottomHeight);
  const tab = useUiStore((s) => s.bottomTab);
  const setTab = useUiStore((s) => s.setBottomTab);
  const setOpen = useUiStore((s) => s.setBottomOpen);
  const setHeight = useUiStore((s) => s.setBottomHeight);

  const logs = useDeviceStore((s) => s.logs);
  const clearLogs = useDeviceStore((s) => s.clearLogs);

  const problems = logs.filter((l) => l.level === 'error' || l.level === 'warn');
  const tabsWithBadges = TABS.map((t) =>
    t.id === 'problems' ? { ...t, badge: problems.length } : t,
  );

  const onResizeStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = height;
      const move = (e: PointerEvent) => setHeight(startHeight - (e.clientY - startY));
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [height, setHeight],
  );

  if (!open) return null;

  return (
    <section
      className="flex shrink-0 flex-col border-t border-line bg-surface-1"
      style={{ height: Math.min(MAX_BOTTOM_HEIGHT, Math.max(MIN_BOTTOM_HEIGHT, height)) }}
      aria-label="Console"
    >
      <div
        onPointerDown={onResizeStart}
        role="separator"
        aria-orientation="horizontal"
        className="h-1 shrink-0 cursor-row-resize bg-transparent transition-colors hover:bg-signal-dim"
      />

      <header className="flex h-8 shrink-0 items-center gap-2 border-b border-line px-2">
        <Tabs items={tabsWithBadges} value={tab} onChange={setTab} />
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            icon={<Trash2 size={13} />}
            onClick={clearLogs}
            aria-label="Clear console"
            title="Clear console"
          />
          <Button
            variant="ghost"
            icon={<ChevronDown size={14} />}
            onClick={() => setOpen(false)}
            aria-label="Hide console"
            title="Hide console"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {tab === 'terminal' && <LogStream entries={logs} />}
        {tab === 'serial' && <LogStream entries={logs.filter((l) => l.source !== 'studio')} />}
        {tab === 'logs' && <LogStream entries={logs.filter((l) => l.source === 'studio')} />}
        {tab === 'problems' && (
          <LogStream entries={problems} empty="No warnings or errors so far." />
        )}
        {tab === 'build' && (
          <EmptyState title="No build backend configured">
            Compiling in the browser needs a toolchain the studio does not ship yet. Until then,
            upload a prebuilt .bin from the Firmware page.
          </EmptyState>
        )}
      </div>
    </section>
  );
}

const levelColor: Record<LogEntry['level'], string> = {
  debug: 'text-ink-lo',
  info: 'text-ink-mid',
  warn: 'text-warn',
  error: 'text-err',
};

function LogStream({ entries, empty }: { entries: LogEntry[]; empty?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  useLayoutEffect(() => {
    if (pinned && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length, pinned]);

  useEffect(() => {
    if (entries.length === 0) setPinned(true);
  }, [entries.length]);

  if (entries.length === 0) {
    return <EmptyState title={empty ?? 'Nothing on the wire yet.'} />;
  }

  return (
    <div ref={ref} onScroll={onScroll} className="h-full overflow-y-auto px-2.5 py-1.5">
      {entries.map((entry) => (
        <div key={entry.id} className="data flex gap-2.5 py-px text-2xs leading-relaxed">
          <span className="shrink-0 text-ink-lo/70">{formatClock(entry.at)}</span>
          <span
            className={cn(
              'w-6 shrink-0',
              entry.source === 'tx' ? 'text-signal-dim' : 'text-ink-lo/60',
            )}
          >
            {entry.source === 'tx' ? 'tx' : entry.source === 'studio' ? 'app' : 'rx'}
          </span>
          <span className={cn('min-w-0 break-all', levelColor[entry.level])}>{entry.text}</span>
        </div>
      ))}
    </div>
  );
}
