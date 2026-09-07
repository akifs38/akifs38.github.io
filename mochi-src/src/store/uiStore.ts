import { create } from 'zustand';

export type BottomTab = 'terminal' | 'serial' | 'logs' | 'build' | 'problems';

interface UiState {
  railCollapsed: boolean;
  inspectorOpen: boolean;
  bottomOpen: boolean;
  bottomHeight: number;
  bottomTab: BottomTab;
  commandPaletteOpen: boolean;
  onboardingDismissed: boolean;

  toggleRail(): void;
  toggleInspector(): void;
  setInspectorOpen(open: boolean): void;
  toggleBottom(): void;
  setBottomOpen(open: boolean): void;
  setBottomHeight(height: number): void;
  setBottomTab(tab: BottomTab): void;
  openBottomTab(tab: BottomTab): void;
  setCommandPaletteOpen(open: boolean): void;
  toggleCommandPalette(): void;
  dismissOnboarding(): void;
}

export const MIN_BOTTOM_HEIGHT = 120;
export const MAX_BOTTOM_HEIGHT = 620;

export const useUiStore = create<UiState>()((set) => ({
  railCollapsed: false,
  inspectorOpen: true,
  bottomOpen: false,
  bottomHeight: 216,
  bottomTab: 'terminal',
  commandPaletteOpen: false,
  onboardingDismissed: false,

  toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
  toggleBottom: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
  setBottomOpen: (bottomOpen) => set({ bottomOpen }),
  setBottomHeight: (height) =>
    set({ bottomHeight: Math.min(MAX_BOTTOM_HEIGHT, Math.max(MIN_BOTTOM_HEIGHT, height)) }),
  setBottomTab: (bottomTab) => set({ bottomTab }),
  openBottomTab: (bottomTab) => set({ bottomTab, bottomOpen: true }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  dismissOnboarding: () => set({ onboardingDismissed: true }),
}));
