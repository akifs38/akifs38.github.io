import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'default' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Renders a spinner and blocks clicks. */
  busy?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-mochi text-surface-0 font-medium hover:bg-mochi/90 active:bg-mochi/80 disabled:bg-mochi-dim/40 disabled:text-ink-lo',
  default:
    'bg-surface-2 text-ink-hi border border-line hover:bg-surface-3 hover:border-line-strong disabled:text-ink-lo disabled:hover:bg-surface-2',
  ghost:
    'text-ink-mid hover:text-ink-hi hover:bg-surface-2 disabled:text-ink-lo disabled:hover:bg-transparent',
  danger:
    'bg-transparent text-err border border-err/40 hover:bg-err/10 disabled:text-ink-lo disabled:border-line',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 gap-1.5 text-xs rounded-md',
  md: 'h-8 px-3 gap-2 text-sm rounded-md',
};

export function Button({
  variant = 'default',
  size = 'sm',
  icon,
  busy = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-colors duration-100 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {busy ? <Spinner /> : icon}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
    />
  );
}
