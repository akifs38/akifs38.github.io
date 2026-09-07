import { Command, PanelBottom, PanelRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useDeviceStore, useProjectStore, useUiStore } from '@/store';
import { BrandMark } from './BrandMark';
import { ConnectMenu } from './ConnectMenu';
import { ConnectionBadge } from './ConnectionBadge';

export function TopBar() {
  const navigate = useNavigate();
  const projectName = useProjectStore((s) => s.project.meta.name);
  const boardId = useProjectStore((s) => s.project.meta.board);
  const connected = useDeviceStore((s) => s.state === 'connected');

  const toggleBottom = useUiStore((s) => s.toggleBottom);
  const toggleInspector = useUiStore((s) => s.toggleInspector);
  const openPalette = useUiStore((s) => s.toggleCommandPalette);

  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b border-line bg-surface-1 px-3"
      style={{ height: '2.875rem' }}
    >
      <BrandMark />

      <div className="ml-2 flex min-w-0 items-baseline gap-2">
        <span className="truncate text-xs text-ink-mid">{projectName}</span>
        <span className="data shrink-0 rounded border border-line px-1.5 py-px text-2xs text-ink-lo">
          {boardId}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ConnectionBadge />

        <span className="h-4 w-px bg-line" aria-hidden />

        <Button
          variant="ghost"
          icon={<Upload size={14} strokeWidth={1.75} />}
          onClick={() => navigate('/firmware')}
          title="Firmware manager"
        >
          Upload
        </Button>
        <Button
          variant="ghost"
          icon={<PanelBottom size={14} strokeWidth={1.75} />}
          onClick={toggleBottom}
          title="Toggle bottom panel"
          aria-label="Toggle bottom panel"
        />
        <Button
          variant="ghost"
          icon={<PanelRight size={14} strokeWidth={1.75} />}
          onClick={toggleInspector}
          title="Toggle inspector"
          aria-label="Toggle inspector"
        />
        <Button
          variant="ghost"
          icon={<Command size={14} strokeWidth={1.75} />}
          onClick={openPalette}
          title="Command palette — Ctrl+K"
          aria-label="Command palette"
        />

        <ConnectMenu />
      </div>

      {!connected && (
        <span className="sr-only" role="status">
          No device connected
        </span>
      )}
    </header>
  );
}
