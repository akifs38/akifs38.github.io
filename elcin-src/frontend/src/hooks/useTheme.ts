import { useEffect } from 'react';
import { resolveTheme, useSettings } from '@/stores';

/**
 * Temayı belgeye uygular.
 *
 * `data-theme` kökte durur; CSS değişkenleri buna göre değişir. 'system'
 * seçiliyken işletim sistemi tercihi canlı olarak dinlenir — kullanıcı
 * akşam moduna geçtiğinde sayfa yenilemeye gerek kalmaz.
 */
export function useTheme(): void {
  const theme = useSettings((state) => state.theme);
  const reduceMotion = useSettings((state) => state.reduceMotion);

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(theme);
    };
    apply();

    if (theme !== 'system' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);
}
