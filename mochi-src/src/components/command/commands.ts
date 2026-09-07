import type { LucideIcon } from 'lucide-react';
import { Cable, CpuIcon, PanelBottom, PanelRight, Plug, RefreshCw } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import { NAV_ITEMS } from '@/router/navigation';
import { useDeviceStore, useUiStore, toast } from '@/store';

export interface Command {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  icon?: LucideIcon;
  section: string;
  run(): void | Promise<void>;
}

/**
 * Only commands that actually do something today are registered. Viewer
 * commands (explode, fit, section) join the list in Phase 2 when there is a
 * scene for them to act on.
 */
export function buildCommands(navigate: NavigateFunction): Command[] {
  const device = useDeviceStore.getState();
  const ui = useUiStore.getState();

  const navigation: Command[] = NAV_ITEMS.map((item) => ({
    id: `go:${item.path}`,
    label: `Go to ${item.label}`,
    icon: item.icon,
    section: 'Navigate',
    hint: item.phase > 1 ? `Phase ${item.phase}` : undefined,
    run: () => navigate(item.path),
  }));

  const connection: Command[] = device.state === 'connected'
    ? [
        {
          id: 'device:disconnect',
          label: 'Disconnect device',
          icon: Plug,
          section: 'Device',
          run: () => device.disconnect(),
        },
        {
          id: 'device:status',
          label: 'Request device status',
          icon: RefreshCw,
          section: 'Device',
          run: () => device.requestStatus(),
        },
      ]
    : [
        {
          id: 'device:serial',
          label: 'Connect over USB serial',
          icon: Cable,
          section: 'Device',
          run: () =>
            device.connect('serial').catch((error: Error) => {
              toast.error('Could not connect', error.message);
            }),
        },
        {
          id: 'device:mock',
          label: 'Start simulated device',
          hint: 'No hardware needed',
          icon: CpuIcon,
          section: 'Device',
          run: () => device.connect('mock'),
        },
      ];

  const layout: Command[] = [
    {
      id: 'ui:console',
      label: ui.bottomOpen ? 'Hide console' : 'Show console',
      shortcut: 'Ctrl+`',
      icon: PanelBottom,
      section: 'Layout',
      run: () => useUiStore.getState().toggleBottom(),
    },
    {
      id: 'ui:inspector',
      label: ui.inspectorOpen ? 'Hide inspector' : 'Show inspector',
      icon: PanelRight,
      section: 'Layout',
      run: () => useUiStore.getState().toggleInspector(),
    },
  ];

  return [...connection, ...navigation, ...layout];
}
