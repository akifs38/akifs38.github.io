import { useEffect } from 'react';
import { useSelectionStore, useViewerStore } from '@/store';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Viewer keys live with the viewer, not in the global shortcut table, so they
 * are only bound while the scene is on screen and never fire against a view
 * that cannot answer them.
 */
export function useViewerShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const viewer = useViewerStore.getState();

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          viewer.requestFit();
          break;
        case 'e':
          // A tap is the whole gesture: all the way apart, or back together.
          e.preventDefault();
          viewer.setExplode(viewer.explode > 0 ? 0 : 1);
          break;
        case 'g':
          e.preventDefault();
          viewer.toggleDebug('grid');
          break;
        case 'escape':
          useSelectionStore.getState().select(null);
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
