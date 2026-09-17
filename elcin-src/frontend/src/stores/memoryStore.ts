import { useMemo } from 'react';
import { create } from 'zustand';
import { createId } from '@/lib/id';
import { findDuplicate, matchesQuery } from '@/services/ai/memoryEngine';
import type { Memory, MemoryDraft, MemoryKind } from '@/types';
import { seedMemories } from '@/services/api/seed';
import { jsonStorage, persist } from './persist';

interface MemoryState {
  memories: Memory[];
  query: string;
  kindFilter: MemoryKind | 'all';

  add(draft: MemoryDraft): Memory | null;
  update(id: string, patch: Partial<Pick<Memory, 'content' | 'importance' | 'tags' | 'kind'>>): void;
  remove(id: string): void;
  reinforce(id: string, importance: number): void;
  clear(): void;
  setQuery(query: string): void;
  setKindFilter(kind: MemoryKind | 'all'): void;
  visible(): Memory[];
}

export const useMemories = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: seedMemories(),
      query: '',
      kindFilter: 'all',

      /**
       * Yeni kayıt ekler. Aynı bilgi zaten varsa kayıt çoğaltılmaz, mevcut
       * olan pekiştirilir — yoksa hafıza aynı cümlenin kopyalarıyla dolar.
       */
      add: (draft) => {
        const existing = findDuplicate(get().memories, draft);
        if (existing) {
          get().reinforce(existing.id, Math.max(existing.importance, draft.importance));
          return null;
        }

        const now = new Date().toISOString();
        const memory: Memory = {
          id: createId('mem'),
          kind: draft.kind,
          content: draft.content,
          importance: draft.importance,
          tags: draft.tags ?? [],
          createdAt: now,
          updatedAt: now,
          sourceMessageId: draft.sourceMessageId,
        };
        set((state) => ({ memories: [memory, ...state.memories] }));
        return memory;
      },

      update: (id, patch) =>
        set((state) => ({
          memories: state.memories.map((memory) =>
            memory.id === id
              ? { ...memory, ...patch, updatedAt: new Date().toISOString(), pinned: true }
              : memory,
          ),
        })),

      remove: (id) =>
        set((state) => ({ memories: state.memories.filter((memory) => memory.id !== id) })),

      reinforce: (id, importance) =>
        set((state) => ({
          memories: state.memories.map((memory) =>
            memory.id === id
              ? {
                  ...memory,
                  importance: Math.min(1, Math.max(memory.importance, importance)),
                  updatedAt: new Date().toISOString(),
                }
              : memory,
          ),
        })),

      clear: () => set({ memories: [] }),
      setQuery: (query) => set({ query }),
      setKindFilter: (kindFilter) => set({ kindFilter }),

      visible: () => {
        const { memories, query, kindFilter } = get();
        return memories
          .filter((memory) => (kindFilter === 'all' ? true : memory.kind === kindFilter))
          .filter((memory) => matchesQuery(memory, query))
          .sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt));
      },
    }),
    {
      name: 'memories',
      storage: jsonStorage,
      partialize: (state) => ({ memories: state.memories }),
    },
  ),
);

/** Arama ve filtreden geçmiş kayıtlar — memoize edilmiş. */
export function useVisibleMemories(): Memory[] {
  const memories = useMemories((state) => state.memories);
  const query = useMemories((state) => state.query);
  const kindFilter = useMemories((state) => state.kindFilter);

  return useMemo(
    () =>
      memories
        .filter((memory) => (kindFilter === 'all' ? true : memory.kind === kindFilter))
        .filter((memory) => matchesQuery(memory, query))
        .sort((a, b) => b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt)),
    [memories, query, kindFilter],
  );
}
