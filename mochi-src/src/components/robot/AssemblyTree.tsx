import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type { AssemblyNode } from '@/types';
import {
  ancestorIds,
  buildAssemblyTree,
  useProjectStore,
  useSelectionStore,
} from '@/store';
import { cn } from '@/utils/cn';

const categoryColor: Record<string, string> = {
  structure: 'bg-ink-lo',
  actuator: 'bg-warn',
  sensor: 'bg-signal',
  display: 'bg-mochi',
  audio: 'bg-mochi-dim',
  compute: 'bg-ok',
  power: 'bg-err',
  interface: 'bg-signal-dim',
  wiring: 'bg-line-strong',
};

/**
 * The tree and the 3D scene are two views of one selection. Phase 2 reads the
 * same selection store, so clicking a mesh highlights the row here without
 * either side knowing about the other.
 */
export function AssemblyTree({ className }: { className?: string }) {
  const components = useProjectStore((s) => s.project.components);
  const nodes = buildAssemblyTree(components);

  return (
    <div className={cn('py-1', className)} role="tree" aria-label="Assembly">
      {nodes.map((node) => (
        <TreeRow key={node.component.id} node={node} />
      ))}
    </div>
  );
}

function TreeRow({ node }: { node: AssemblyNode }) {
  const { component, children, depth } = node;

  const components = useProjectStore((s) => s.project.components);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const expanded = useSelectionStore((s) => s.expandedIds.has(component.id));
  const hidden = useSelectionStore((s) => s.hiddenIds.has(component.id));
  const select = useSelectionStore((s) => s.select);
  const hover = useSelectionStore((s) => s.hover);
  const toggleExpanded = useSelectionStore((s) => s.toggleExpanded);
  const toggleVisibility = useSelectionStore((s) => s.toggleVisibility);
  const setExpanded = useSelectionStore((s) => s.setExpanded);

  const selected = selectedId === component.id;
  const hasChildren = children.length > 0;
  const notInstalled = component.status === 'not-installed';

  const onSelect = () => {
    select(component.id);
    // Reveal the row's ancestors so a selection made from the 3D scene is visible.
    const current = useSelectionStore.getState().expandedIds;
    setExpanded([...current, ...ancestorIds(components, component.id)]);
  };

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined} aria-selected={selected}>
      <div
        onMouseEnter={() => hover(component.id)}
        onMouseLeave={() => hover(null)}
        className={cn(
          'group flex h-7 items-center gap-1.5 pr-1.5 text-xs transition-colors',
          selected ? 'bg-surface-2 text-ink-hi' : 'text-ink-mid hover:bg-surface-2/50',
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        <button
          onClick={() => hasChildren && toggleExpanded(component.id)}
          className={cn('grid size-4 shrink-0 place-items-center text-ink-lo', !hasChildren && 'invisible')}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          tabIndex={hasChildren ? 0 : -1}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            categoryColor[component.category] ?? 'bg-ink-lo',
            (hidden || notInstalled) && 'opacity-30',
          )}
          aria-hidden
        />

        <button
          onClick={onSelect}
          className={cn(
            'min-w-0 flex-1 truncate text-left',
            (hidden || notInstalled) && 'text-ink-lo line-through decoration-line-strong',
          )}
        >
          {component.name}
        </button>

        {notInstalled && <span className="shrink-0 text-2xs text-ink-lo">not fitted</span>}

        {component.electrical?.gpio && (
          <span className="data shrink-0 text-2xs text-signal-dim">
            {component.electrical.gpio.map((g) => g).join(',')}
          </span>
        )}

        <button
          onClick={() => toggleVisibility(component.id)}
          className={cn(
            'shrink-0 text-ink-lo transition-opacity hover:text-ink-hi',
            hidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          )}
          aria-label={hidden ? `Show ${component.name}` : `Hide ${component.name}`}
        >
          {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </div>

      {hasChildren && expanded && children.map((child) => (
        <TreeRow key={child.component.id} node={child} />
      ))}
    </div>
  );
}
