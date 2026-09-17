import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2/70 text-muted border-line/40',
  accent: 'bg-accent/12 text-accent border-accent/25',
  ok: 'bg-ok/12 text-ok border-ok/25',
  warn: 'bg-warn/12 text-warn border-warn/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Canlılık bildiren nokta; çevrimiçiyken nabız gibi atar. */
export function StatusDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {online && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
      )}
      <span
        className={cn(
          'relative inline-flex h-2 w-2 rounded-full',
          online ? 'bg-ok' : 'bg-muted/50',
        )}
      />
    </span>
  );
}
