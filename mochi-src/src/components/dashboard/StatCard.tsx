import type { ReactNode } from 'react';
import { StatusDot, type DotTone } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * A reading, not a decoration. When there is no device the value is an em dash
 * — never a plausible-looking number.
 */
export function StatCard({
  label,
  value,
  unit,
  detail,
  tone,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  detail?: string;
  tone?: DotTone;
  className?: string;
}) {
  return (
    <div className={cn('panel px-3 py-2.5', className)}>
      <div className="flex items-center gap-1.5">
        {tone && <StatusDot tone={tone} />}
        <span className="truncate text-2xs text-ink-lo">{label}</span>
      </div>
      <p className="data mt-1.5 text-lg leading-none text-ink-hi">
        {value}
        {unit && <span className="ml-1 text-xs text-ink-lo">{unit}</span>}
      </p>
      {detail && <p className="mt-1.5 truncate text-2xs text-ink-lo">{detail}</p>}
    </div>
  );
}
