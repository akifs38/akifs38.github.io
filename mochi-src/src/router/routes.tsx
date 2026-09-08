import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ROUTE_PATHS } from './routePaths';

/**
 * Every screen is a lazy chunk. Three.js sits behind /robot and must stay out
 * of the initial bundle for someone who only opened the pin map.
 */
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const RobotPage = lazy(() =>
  import('@/pages/RobotPage').then((m) => ({ default: m.RobotPage })),
);
const ComponentsPage = lazy(() =>
  import('@/pages/ComponentsPage').then((m) => ({ default: m.ComponentsPage })),
);
const ElectronicsPage = lazy(() =>
  import('@/pages/ElectronicsPage').then((m) => ({ default: m.ElectronicsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

const placeholder = (name: keyof typeof import('@/pages/PlaceholderPages')) =>
  lazy(() => import('@/pages/PlaceholderPages').then((m) => ({ default: m[name] })));

// Under a GitHub Pages project site the app is mounted at /<repo>/, which Vite
// exposes as BASE_URL. Without this the router would look for routes at the
// domain root and every link would 404.
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

const children = [
  { index: true, element: <DashboardPage /> },
  { path: 'robot', element: <RobotPage /> },
  { path: 'components', element: <ComponentsPage /> },
  { path: 'electronics', element: <ElectronicsPage /> },
  { path: 'firmware', Component: placeholder('FirmwarePage') },
  { path: 'behavior', Component: placeholder('BehaviorPage') },
  { path: 'control', Component: placeholder('ControlPage') },
  { path: 'serial', Component: placeholder('SerialMonitorPage') },
  { path: 'sensors', Component: placeholder('SensorsPage') },
  { path: 'diagnostics', Component: placeholder('DiagnosticsPage') },
  { path: 'assets', Component: placeholder('AssetsPage') },
  { path: 'settings', element: <SettingsPage /> },
  { path: '*', element: <NotFound /> },
];

/**
 * A route with no entry in ROUTE_PATHS gets no directory index at build time,
 * so it would 404 when opened directly — the failure only shows up in
 * production. Catch the drift here, while someone is still editing the file.
 */
if (import.meta.env.DEV) {
  const declared = new Set<string>(ROUTE_PATHS);
  const missing = children
    .map((route) => ('path' in route ? route.path : undefined))
    .filter((path): path is string => !!path && path !== '*')
    .map((path) => `/${path}`)
    .filter((path) => !declared.has(path));

  if (missing.length) {
    console.error(
      `[router] These routes are missing from ROUTE_PATHS, so a direct link to ` +
        `them will 404 in production: ${missing.join(', ')}`,
    );
  }
}

export const router = createBrowserRouter(
  [{ path: '/', element: <AppShell />, children }],
  { basename },
);

function NotFound() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-ink-mid">That screen does not exist.</p>
    </div>
  );
}
