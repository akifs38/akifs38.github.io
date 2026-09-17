import type { ReactNode } from 'react';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Uygulama iskeleti: kenar çubuğu + üst çubuk + içerik + mobil alt çubuk. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* Alt boşluk mobil çubuğun içeriği örtmemesi için. */}
        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
