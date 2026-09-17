import { Link } from 'react-router-dom';
import { Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { StatusDot } from '@/components/ui';
import { STATE_LABEL } from '@/services/device';
import { useDevice, useSettings } from '@/stores';
import { BrandMark } from './BrandMark';

/**
 * Üst çubuk.
 *
 * Solda kimlik, sağda cihazın nabzı. Cihaz durumu her sayfada görünür olmalı:
 * Elçin'in bedeni kopmuşsa kullanıcının bunu bir alt sayfaya girerek
 * öğrenmesi gerekmez.
 */
export function TopBar() {
  const online = useDevice((state) => state.online);
  const state = useDevice((state) => state.state);
  const theme = useSettings((s) => s.theme);
  const setSetting = useSettings((s) => s.set);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line/25 bg-bg/70 px-4 backdrop-blur-xl sm:px-6">
      <Link to="/" className="lg:hidden">
        <BrandMark compact />
      </Link>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium',
            online ? 'border-ok/25 bg-ok/8 text-ok' : 'border-line/40 bg-surface-2/50 text-muted',
          )}
          title={`Cihaz: ${STATE_LABEL[state]}`}
        >
          <StatusDot online={online} />
          <span className="hidden sm:inline">{online ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
          {online ? <Wifi size={13} className="sm:hidden" /> : <WifiOff size={13} className="sm:hidden" />}
        </div>

        <button
          onClick={() => setSetting('theme', theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          className="rounded-full border border-line/40 bg-surface-2/50 p-2 text-muted transition-colors hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
