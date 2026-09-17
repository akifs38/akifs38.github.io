import type { ActivityKind } from '@/types';

/** Aktivite türlerinin simgesi ve adı — birden çok sayfa aynı sözlüğü kullanır. */
export const ACTIVITY_ICON: Record<ActivityKind, string> = {
  touch: '👆',
  chat: '💬',
  sleep: '😴',
  wake: '☀️',
  memory: '🧠',
  device: '📱',
  surprise: '🎁',
  system: '⚙️',
};

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  touch: 'Dokunma',
  chat: 'Sohbet',
  sleep: 'Uyku',
  wake: 'Uyanma',
  memory: 'Hafıza',
  device: 'Cihaz',
  surprise: 'Sürpriz',
  system: 'Sistem',
};
