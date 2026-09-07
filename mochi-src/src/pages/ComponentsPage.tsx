import { RotateCcw } from 'lucide-react';
import { AssemblyTree } from '@/components/robot/AssemblyTree';
import { Button, Panel } from '@/components/ui';
import { useProjectStore, useSelectionStore } from '@/store';
import { titleCase } from '@/utils/format';

export function ComponentsPage() {
  const components = useProjectStore((s) => s.project.components);
  const showAll = useSelectionStore((s) => s.showAll);
  const isolated = useSelectionStore((s) => s.isolatedIds.size > 0);
  const hiddenCount = useSelectionStore((s) => s.hiddenIds.size);
  const select = useSelectionStore((s) => s.select);

  const totalWeight = components.reduce((sum, c) => sum + (c.part?.weightG ?? 0), 0);
  const byCategory = components.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full min-h-0">
      <Panel
        title="Assembly"
        className="m-3 mr-1.5 w-72 shrink-0"
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

      <div className="min-w-0 flex-1 overflow-y-auto p-3 pl-1.5">
        <Panel title="Bill of materials" bodyClassName="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-2xs text-ink-lo">
                <th className="px-3 py-1.5 text-left font-normal">Part</th>
                <th className="px-3 py-1.5 text-left font-normal">Category</th>
                <th className="px-3 py-1.5 text-left font-normal">Part number</th>
                <th className="px-3 py-1.5 text-right font-normal">GPIO</th>
                <th className="px-3 py-1.5 text-right font-normal">Weight</th>
              </tr>
            </thead>
            <tbody>
              {components
                .filter((c) => c.parent !== null)
                .map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => select(c.id)}
                    className="cursor-pointer border-b border-line/60 last:border-b-0 hover:bg-surface-2/60"
                  >
                    <td className="px-3 py-1.5 text-ink-hi">
                      {c.name}
                      {c.status === 'not-installed' && (
                        <span className="ml-2 text-2xs text-ink-lo">not fitted</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-ink-mid">{titleCase(c.category)}</td>
                    <td className="data px-3 py-1.5 text-ink-lo">{c.part?.partNumber ?? '—'}</td>
                    <td className="data px-3 py-1.5 text-right text-signal-dim">
                      {c.electrical?.gpio?.join(', ') ?? '—'}
                    </td>
                    <td className="data px-3 py-1.5 text-right text-ink-mid">
                      {c.part?.weightG !== undefined ? `${c.part.weightG} g` : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line text-2xs text-ink-lo">
                <td className="px-3 py-2" colSpan={4}>
                  {components.length} parts ·{' '}
                  {Object.entries(byCategory)
                    .map(([k, v]) => `${v} ${k}`)
                    .join(' · ')}
                </td>
                <td className="data px-3 py-2 text-right text-ink-mid">{totalWeight} g</td>
              </tr>
            </tfoot>
          </table>
        </Panel>
      </div>
    </div>
  );
}
