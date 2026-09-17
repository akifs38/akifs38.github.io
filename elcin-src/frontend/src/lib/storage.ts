import { config } from '@/config';

/**
 * localStorage sarmalayıcısı.
 *
 * Gizli sekmede, depolama kapalıyken veya kota dolduğunda erişim istisna
 * fırlatabilir; bu yüzden her okuma/yazma sessizce yutulur ve uygulama
 * depolama olmadan da çalışmaya devam eder.
 */

function key(name: string): string {
  return config.storage.prefix + name;
}

export function readJson<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(name: string, value: unknown): void {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    /* depolama yoksa uygulama yine de çalışır */
  }
}

export function removeKey(name: string): void {
  try {
    localStorage.removeItem(key(name));
  } catch {
    /* yok sayılır */
  }
}

/** Elçin'e ait tüm yerel veriyi siler (Ayarlar → "Her şeyi temizle"). */
export function clearAll(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(config.storage.prefix)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* yok sayılır */
  }
}
