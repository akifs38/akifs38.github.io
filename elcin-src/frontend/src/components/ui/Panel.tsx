import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

// `title` HTML'de düz metin; burada başlık bir düğüm olabildiği için devralınmaz.
export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  flat?: boolean;
  padded?: boolean;
}

export function Panel({
  title,
  subtitle,
  action,
  flat,
  padded = true,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <section className={cn(flat ? 'panel-flat' : 'panel', className)} {...rest}>
      {(title || action) && (
        <header
          className={cn(
            'flex items-start justify-between gap-3 border-b border-line/30',
            padded ? 'px-5 py-4' : 'px-4 py-3',
          )}
        >
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {/*
        Dolgusuz panelde sarmalayıcı div hiç basılmaz: aksi halde panelin
        kendi flex düzeni (ör. sohbet ekranında "mesajlar esner, yazı alanı
        dibe yapışır") bir seviye derinde kalıp çalışmıyordu.
      */}
      {padded ? <div className="p-5">{children}</div> : children}
    </section>
  );
}
