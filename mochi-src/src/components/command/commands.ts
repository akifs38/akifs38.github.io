import type { LucideIcon } from 'lucide-react';
import {
  Cable,
  CpuIcon,
  Focus,
  Ghost,
  Layers,
  PanelBottom,
  PanelRight,
  Plug,
  RefreshCw,
  RotateCcw,
  Scissors,
} from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import { NAV_ITEMS } from '@/router/navigation';
import { useDeviceStore, useUiStore, useViewerStore, toast } from '@/store';

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
 * Only commands that actually do something today are registered. The viewer
 * commands route to /robot before acting, so running one from the pin map
 * lands you where you can see the result rather than changing state off screen.
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

  const viewer = useViewerStore.getState();

  /** Route to the scene first — a view change you cannot see is a no-op. */
  const inViewer = (run: () => void) => () => {
    navigate('/robot');
    run();
  };

  const view: Command[] = [
    {
      id: 'view:fit',
      label: 'Fit the robot in view',
      shortcut: 'F',
      icon: Focus,
      section: 'View',
      run: inViewer(() => useViewerStore.getState().requestFit()),
    },
    {
      id: 'view:explode',
      label: viewer.explode > 0 ? 'Collapse the assembly' : 'Explode the assembly',
      shortcut: 'E',
      icon: Layers,
      section: 'View',
      run: inViewer(() => {
        const state = useViewerStore.getState();
        state.setExplode(state.explode > 0 ? 0 : 1);
      }),
    },
    {
      id: 'view:ghost',
      label: viewer.ghostMode ? 'Solid shells' : 'Ghost the shells',
      hint: 'See the electronics through the case',
      icon: Ghost,
      section: 'View',
      run: inViewer(() => useViewerStore.getState().toggleGhost()),
    },
    {
      id: 'view:section',
      label: viewer.section.enabled ? 'Clear the section cut' : 'Cut a section',
      icon: Scissors,
      section: 'View',
      run: inViewer(() =>
        useViewerStore.getState().setSection({ enabled: !useViewerStore.getState().section.enabled }),
      ),
    },
    {
      id: 'view:reset',
      label: 'Reset the view',
      icon: RotateCcw,
      section: 'View',
      run: inViewer(() => useViewerStore.getState().reset()),
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

  return [...connection, ...navigation, ...view, ...layout];
}
