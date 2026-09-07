import { RotateCcw } from 'lucide-react';
import { AssemblyTree } from '@/components/robot/AssemblyTree';
import { RobotViewer, ViewerToolbar } from '@/components/viewer';
import { Button, Panel } from '@/components/ui';
import { useViewerShortcuts } from '@/hooks/useViewerShortcuts';
import { findComponent, useProjectStore, useSelectionStore } from '@/store';
import { titleCase } from '@/utils/format';

/**
 * The tree and the scene are two views of one selection: clicking a mesh
 * highlights the row, clicking a row highlights the mesh. Neither knows about
 * the other — both read the selection store.
 */
export function RobotPage() {
  useViewerShortcuts();

  const components = useProjectStore((s) => s.project.components);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const showAll = useSelectionStore((s) => s.showAll);
  const isolated = useSelectionStore((s) => s.isolatedIds.size > 0);
  const hiddenCount = useSelectionStore((s) => s.hiddenIds.size);

  const selected = findComponent(components, selectedId);

  return (
    <div className="flex h-full min-h-0">
      <Panel
        title="Assembly"
        className="m-3 mr-1.5 w-64 shrink-0"
        bodyClassName="p-0"
        actions={
          (isolated || hiddenCount > 0) && (
            <Button variant="ghost" icon={<RotateCcw size={12} />} onClick={showAll}>
              Show all
            </Button>
          )
        }
      >
        <AssemblyTree />
      </Panel>

      <div className="relative m-3 ml-1.5 min-w-0 flex-1 overflow-hidden rounded-panel border border-line">
        <RobotViewer className="absolute inset-0" />
        <ViewerToolbar />

        {selected && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-panel border border-line bg-surface-1/85 px-2.5 py-1.5 backdrop-blur">
            <p className="text-xs text-ink-hi">{selected.name}</p>
            <p className="text-2xs text-ink-lo">
              {titleCase(selected.category)}
              {selected.electrical?.gpio?.length
                ? ` · GPIO ${selected.electrical.gpio.join(', ')}`
                : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
