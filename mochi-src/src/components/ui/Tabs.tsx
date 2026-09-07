import { cn } from '@/utils/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  badge?: number;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex items-center gap-0.5', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative h-7 rounded px-2.5 text-xs transition-colors',
              active ? 'text-ink-hi' : 'text-ink-lo hover:text-ink-mid',
            )}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="data ml-1.5 text-2xs text-ink-lo">{item.badge}</span>
            )}
            {active && (
              <span className="absolute inset-x-1.5 -bottom-px h-px bg-mochi" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}
