import { create } from 'zustand';
import type { CameraPreset, ExplodeGroup, SectionPlane, ViewerDebug } from '@/types';

interface ViewerState {
  /** 0..1 — how far apart the assembly is pulled. */
  explode: number;
  explodeGroup: ExplodeGroup;
  ghostMode: boolean;
  wiringVisible: boolean;
  section: SectionPlane;
  debug: ViewerDebug;
  cameraPreset: CameraPreset;
  /** Bumped to ask the viewer to refit the camera; Phase 2 reads it. */
  fitRequest: number;

  setExplode(value: number): void;
  setExplodeGroup(group: ExplodeGroup): void;
  toggleGhost(): void;
  toggleWiring(): void;
  setSection(patch: Partial<SectionPlane>): void;
  toggleDebug(key: keyof ViewerDebug): void;
  setCameraPreset(preset: CameraPreset): void;
  requestFit(): void;
  reset(): void;
}

const initialSection: SectionPlane = {
  enabled: false,
  x: 0,
  y: 0,
  z: 0,
  axis: 'x',
  flip: false,
};

const initialDebug: ViewerDebug = {
  wireframe: false,
  grid: true,
  axes: false,
  boundingBox: false,
  normals: false,
  stats: false,
};

export const useViewerStore = create<ViewerState>()((set) => ({
  explode: 0,
  explodeGroup: 'all',
  ghostMode: false,
  wiringVisible: false,
  section: initialSection,
  debug: initialDebug,
  cameraPreset: 'iso',
  fitRequest: 0,

  setExplode: (value) => set({ explode: Math.min(1, Math.max(0, value)) }),
  setExplodeGroup: (explodeGroup) => set({ explodeGroup }),
  toggleGhost: () => set((s) => ({ ghostMode: !s.ghostMode })),
  toggleWiring: () => set((s) => ({ wiringVisible: !s.wiringVisible })),
  setSection: (patch) => set((s) => ({ section: { ...s.section, ...patch } })),
  toggleDebug: (key) => set((s) => ({ debug: { ...s.debug, [key]: !s.debug[key] } })),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  requestFit: () => set((s) => ({ fitRequest: s.fitRequest + 1 })),
  reset: () =>
    set({
      explode: 0,
      explodeGroup: 'all',
      ghostMode: false,
      wiringVisible: false,
      section: initialSection,
      debug: initialDebug,
      cameraPreset: 'iso',
    }),
}));
