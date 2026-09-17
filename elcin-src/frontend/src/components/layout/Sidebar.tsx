import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from '@/app/navigation';
import { useElcin, useSettings } from '@/stores';
import { MOOD_LABEL } from '@/services/ai/moodEngine';
import { BrandMark } from './BrandMark';

/**
 * Masaüstü kenar çubuğu.
 *
 * Alt kısımdaki küçük kart bilinçli: kullanıcı hangi sayfada olursa olsun
 * Elçin'in o anki halini görebilsin. Menü bir araç listesi değil, bir odanın
 * kapıları gibi durmalı.
 */
export function Sidebar() {
  const role = useSettings((state) => state.role);
  const mood = useElcin((state) => state.mood);
  const reason = useElcin((state) => state.reason);

  const items = NAV_ITEMS.filter((item) => !item.developerOnly || role === 'developer');

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 border-r border-line/25 px-3 py-5 lg:flex">
      <div className="px-2 pb-4">
        <BrandMark />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive ? 'text-ink' : 'text-muted hover:text-ink hover:bg-surface-2/50',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  // Seçili sekme arka planı sayfalar arasında kayarak taşınır.
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/10"
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}
                <item.icon size={17} className="relative z-10 shrink-0" />
                <span className="relative z-10 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="panel-flat mt-2 px-3 py-3">
        <p className="text-[10px] uppercase tracking-wider text-muted">Şu an</p>
        <p className="mt-1 text-sm font-medium text-ink">{MOOD_LABEL[mood]}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{reason}</p>
      </div>
    </aside>
  );
}
