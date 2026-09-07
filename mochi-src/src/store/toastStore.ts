import { create } from 'zustand';

export type ToastTone = 'ok' | 'warn' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
  /** ms; 0 keeps it until dismissed. */
  ttl: number;
}

interface ToastState {
  toasts: Toast[];
  push(toast: Omit<Toast, 'id' | 'ttl'> & { ttl?: number }): number;
  dismiss(id: number): void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: ({ tone, title, detail, ttl }) => {
    const id = nextId++;
    const resolved = ttl ?? (tone === 'error' ? 8000 : 4200);
    set((s) => ({ toasts: [...s.toasts, { id, tone, title, detail, ttl: resolved }] }));
    if (resolved > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, resolved);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper for use outside React. */
export const toast = {
  ok: (title: string, detail?: string) => useToastStore.getState().push({ tone: 'ok', title, detail }),
  info: (title: string, detail?: string) => useToastStore.getState().push({ tone: 'info', title, detail }),
  warn: (title: string, detail?: string) => useToastStore.getState().push({ tone: 'warn', title, detail }),
  error: (title: string, detail?: string) => useToastStore.getState().push({ tone: 'error', title, detail }),
};
