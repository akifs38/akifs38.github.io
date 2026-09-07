import { X } from 'lucide-react';
import { useToastStore, type ToastTone } from '@/store';
import { cn } from '@/utils/cn';

const toneBar: Record<ToastTone, string> = {
  ok: 'bg-ok',
  info: 'bg-signal',
  warn: 'bg-warn',
  error: 'bg-err',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex overflow-hidden rounded-md border border-line bg-surface-2 shadow-lg shadow-black/40"
        >
          <span className={cn('w-0.5 shrink-0', toneBar[t.tone])} aria-hidden />
          <div className="min-w-0 flex-1 px-3 py-2">
            <p className="truncate text-xs font-medium text-ink-hi">{t.title}</p>
            {t.detail && <p className="mt-0.5 text-2xs leading-snug text-ink-mid">{t.detail}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 px-2 text-ink-lo transition-colors hover:text-ink-hi"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
