import { create } from 'zustand';
import { config } from '@/config';
import type { Settings, ThemeMode, UserRole } from '@/types';
import { jsonStorage, persist } from './persist';

interface SettingsState extends Settings {
  role: UserRole;
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  setRole(role: UserRole): void;
  reset(): void;
}

const DEFAULTS: Settings = {
  theme: 'dark',
  userName: config.app.defaultUserName,
  reduceMotion: false,
  soundEnabled: false,
  proactiveMessages: true,
  autoMemory: true,
  aiProvider: config.ai.provider,
  deviceTransport: 'mock',
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      role: 'user',
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      setRole: (role) => set({ role }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: 'settings', storage: jsonStorage },
  ),
);

/** Tema tercihini gerçek temaya çevirir ('system' → işletim sistemi tercihi). */
export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
