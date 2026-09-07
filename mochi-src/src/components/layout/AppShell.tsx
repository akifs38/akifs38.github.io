import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { CommandPalette } from '@/components/command/CommandPalette';
import { Toaster } from '@/components/ui';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUiStore } from '@/store';
import { BottomPanel } from './BottomPanel';
import { Inspector } from './Inspector';
import { LeftRail } from './LeftRail';
import { TopBar } from './TopBar';

export function AppShell() {
  useKeyboardShortcuts();
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <LeftRail />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="stage min-h-0 flex-1 overflow-hidden">
            <Suspense fallback={<ScreenLoading />}>
              <Outlet />
            </Suspense>
          </main>
          <BottomPanel />
        </div>

        {inspectorOpen && <Inspector />}
      </div>

      <CommandPalette />
      <Toaster />
    </div>
  );
}

function ScreenLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <span className="text-xs text-ink-lo">Loading…</span>
    </div>
  );
}
