import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { config } from '@/config';
import { createId } from '@/lib/id';
import { cn } from '@/lib/cn';

/**
 * Bildirim çubuğu.
 *
 * 58. madde: kullanıcı teknik hata görmez. Bu yüzden `toast.error` da
 * Elçin'in ağzından konuşan kısa bir cümle bekler, yığın izi değil.
 */

export type ToastTone = 'info' | 'success' | 'warn' | 'error';

interface Toast {
  id: string;
  text: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push(text: string, tone?: ToastTone): void;
  dismiss(id: string): void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (text, tone = 'info') => {
    const id = createId('toast');
    set((state) => ({ toasts: [...state.toasts, { id, text, tone }] }));
    setTimeout(
      () => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
      config.ui.toastDuration,
    );
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const toast = {
  info: (text: string) => useToasts.getState().push(text, 'info'),
  success: (text: string) => useToasts.getState().push(text, 'success'),
  warn: (text: string) => useToasts.getState().push(text, 'warn'),
  error: (text: string) => useToasts.getState().push(text, 'error'),
};

const TONE_STYLE: Record<ToastTone, string> = {
  info: 'border-line/50',
  success: 'border-ok/40 text-ok',
  warn: 'border-warn/40 text-warn',
  error: 'border-danger/40 text-danger',
};

export function Toaster() {
  const toasts = useToasts((state) => state.toasts);
  const dismiss = useToasts((state) => state.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex flex-col items-center gap-2 px-4 sm:bottom-6">
      <AnimatePresence>
        {toasts.map((entry) => (
          <motion.button
            key={entry.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            onClick={() => dismiss(entry.id)}
            className={cn(
              'panel pointer-events-auto max-w-sm px-4 py-3 text-sm text-ink',
              TONE_STYLE[entry.tone],
            )}
          >
            {entry.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
