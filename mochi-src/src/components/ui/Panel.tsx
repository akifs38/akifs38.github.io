import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('panel flex min-h-0 flex-col overflow-hidden', className)}>
      {title !== undefined && (
        <header className="panel-head shrink-0">
          <span className="truncate">{title}</span>
          {actions && <span className="ml-auto flex items-center gap-1">{actions}</span>}
        </header>
      )}
      <div className={cn('min-h-0 flex-1 overflow-auto', bodyClassName)}>{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="shrink-0 text-2xs text-ink-lo">{label}</dt>
      <dd className="data min-w-0 truncate text-right text-xs text-ink-hi">{children}</dd>
    </div>
  );
}
