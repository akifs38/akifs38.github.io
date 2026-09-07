import { cn } from '@/utils/cn';

export type DotTone = 'ok' | 'warn' | 'error' | 'idle' | 'busy' | 'sim';

const tones: Record<DotTone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  error: 'bg-err',
  idle: 'bg-idle',
  busy: 'bg-signal',
  sim: 'bg-mochi',
};

export function StatusDot({
  tone,
  pulse = false,
  className,
}: {
  tone: DotTone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('relative inline-flex size-2 shrink-0', className)}>
      {pulse && (
        <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', tones[tone])} />
      )}
      <span className={cn('relative size-2 rounded-full', tones[tone])} />
    </span>
  );
}
