import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore, toast } from '@/store';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

/**
 * Global shortcuts. Viewer keys (F fit, E explode, G grid) are registered by the
 * 3D scene itself — see useViewerShortcuts — so a key never fires against a view
 * that is not on screen.
 */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();
  const togglePalette = useUiStore((s) => s.toggleCommandPalette);
  const setPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const toggleBottom = useUiStore((s) => s.toggleBottom);
  const openBottomTab = useUiStore((s) => s.openBottomTab);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        setPaletteOpen(false);
        return;
      }

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (mod && e.key === '`') {
        e.preventDefault();
        toggleBottom();
        return;
      }

      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        openBottomTab('build');
        toast.warn(
          'No build backend configured',
          'Compiling firmware in the browser is not wired up yet. Upload a prebuilt .bin instead.',
        );
        return;
      }

      if (mod && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        navigate('/firmware');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, openBottomTab, setPaletteOpen, toggleBottom, togglePalette]);
}
