import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_GROUPS, NAV_ITEMS } from '@/router/navigation';
import { useUiStore } from '@/store';
import { cn } from '@/utils/cn';

export function LeftRail() {
  const collapsed = useUiStore((s) => s.railCollapsed);
  const toggle = useUiStore((s) => s.toggleRail);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        'flex shrink-0 flex-col border-r border-line bg-surface-1 transition-[width] duration-150',
      )}
      style={{ width: collapsed ? '3.25rem' : '13rem' }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group.id);
          return (
            <div key={group.id} className="mb-1">
              {!collapsed && (
                <p className="px-3 pb-1 pt-2.5 text-2xs text-ink-lo">{group.label}</p>
              )}
              {collapsed && <div className="mx-3 my-2 h-px bg-line" aria-hidden />}
              <ul>
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'relative flex h-8 items-center gap-2.5 px-3 text-xs transition-colors',
                          isActive
                            ? 'bg-surface-2 text-ink-hi'
                            : 'text-ink-mid hover:bg-surface-2/60 hover:text-ink-hi',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-mochi"
                              aria-hidden
                            />
                          )}
                          <item.icon size={15} className="shrink-0" strokeWidth={1.75} />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {!collapsed && item.phase > 1 && (
                            <span className="data ml-auto shrink-0 text-2xs text-ink-lo/70">
                              P{item.phase}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <button
        onClick={toggle}
        className="flex h-9 shrink-0 items-center gap-2.5 border-t border-line px-3.5 text-2xs text-ink-lo transition-colors hover:text-ink-mid"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </nav>
  );
}
