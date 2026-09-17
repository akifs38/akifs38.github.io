import { cn } from '@/lib/cn';
import { config } from '@/config';

/** Elçin'in adı ve çiçeği — her ekranın sol üstünde duran imza. */
export function BrandMark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="text-lg leading-none" aria-hidden>
        🌸
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-gradient">{config.app.name}</p>
        {!compact && <p className="truncate text-[10px] text-muted">{config.app.tagline}</p>}
      </div>
    </div>
  );
}
