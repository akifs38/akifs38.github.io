import { create } from 'zustand';

interface SelectionState {
  selectedId: string | null;
  hoveredId: string | null;
  /** Ids the user has hidden with the eye toggle. */
  hiddenIds: Set<string>;
  /** When non-empty, only these ids render. */
  isolatedIds: Set<string>;
  expandedIds: Set<string>;

  select(id: string | null): void;
  hover(id: string | null): void;
  toggleVisibility(id: string): void;
  setVisible(id: string, visible: boolean): void;
  isolate(ids: string[]): void;
  showAll(): void;
  toggleExpanded(id: string): void;
  setExpanded(ids: string[]): void;
  isVisible(id: string): boolean;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedId: null,
  hoveredId: null,
  hiddenIds: new Set(),
  isolatedIds: new Set(),
  expandedIds: new Set(['robot', 'head', 'body', 'base']),

  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set({ hoveredId }),

  toggleVisibility: (id) =>
    set((s) => {
      const hiddenIds = new Set(s.hiddenIds);
      if (hiddenIds.has(id)) hiddenIds.delete(id);
      else hiddenIds.add(id);
      return { hiddenIds };
    }),

  setVisible: (id, visible) =>
    set((s) => {
      const hiddenIds = new Set(s.hiddenIds);
      if (visible) hiddenIds.delete(id);
      else hiddenIds.add(id);
      return { hiddenIds };
    }),

  isolate: (ids) => set({ isolatedIds: new Set(ids) }),
  showAll: () => set({ isolatedIds: new Set(), hiddenIds: new Set() }),

  toggleExpanded: (id) =>
    set((s) => {
      const expandedIds = new Set(s.expandedIds);
      if (expandedIds.has(id)) expandedIds.delete(id);
      else expandedIds.add(id);
      return { expandedIds };
    }),

  setExpanded: (ids) => set({ expandedIds: new Set(ids) }),

  isVisible: (id) => {
    const { hiddenIds, isolatedIds } = get();
    if (hiddenIds.has(id)) return false;
    if (isolatedIds.size > 0) return isolatedIds.has(id);
    return true;
  },
}));
