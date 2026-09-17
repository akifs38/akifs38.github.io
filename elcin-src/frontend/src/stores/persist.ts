import { createJSONStorage, persist } from 'zustand/middleware';
import { config } from '@/config';

/**
 * Depolama adaptörü.
 *
 * Tüm anahtarlar `elcin.v1.` önekiyle yazılır; böylece aynı alan adında duran
 * başka projelerle çakışmaz ve "verilerimi sil" tek seferde temizleyebilir.
 * Depolama erişilemezse (gizli sekme, kota) uygulama bellekte çalışmaya devam
 * eder — bu yüzden her çağrı try/catch içinde.
 */
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(config.storage.prefix + name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(config.storage.prefix + name, value);
    } catch {
      /* depolama yoksa sessizce geç */
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(config.storage.prefix + name);
    } catch {
      /* yok sayılır */
    }
  },
};

export const jsonStorage = createJSONStorage(() => safeStorage);
export { persist };
