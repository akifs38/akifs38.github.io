import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from '@/app/navigation';

/** Mobil alt çubuk — telefonlarda gezinmenin tek yolu bu. */
export function MobileNav() {
  const items = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/30 bg-bg/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors',
                isActive ? 'text-accent' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="mobile-active"
                    className="absolute inset-x-3 -top-1.5 h-0.5 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon size={19} />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
