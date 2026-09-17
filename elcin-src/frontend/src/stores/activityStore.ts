import { useMemo } from 'react';
import { create } from 'zustand';
import { createId } from '@/lib/id';
import { isSameDay } from '@/lib/time';
import type { Activity, ActivityKind, DeviceLog } from '@/types';
import { seedActivities } from '@/services/api/seed';
import { jsonStorage, persist } from './persist';

export type ActivityRange = 'today' | 'week' | 'month' | 'all';

interface ActivityState {
  activities: Activity[];
  /** Cihaz günlükleri yalnızca oturum boyunca tutulur; kalıcı değildir. */
  logs: DeviceLog[];
  range: ActivityRange;

  push(kind: ActivityKind, title: string, detail?: string): void;
  pushLog(level: DeviceLog['level'], message: string): void;
  setRange(range: ActivityRange): void;
  visible(): Activity[];
  clear(): void;
}

const ACTIVITY_LIMIT = 200;
const LOG_LIMIT = 300;

function withinRange(iso: string, range: ActivityRange, now: Date): boolean {
  if (range === 'all') return true;
  const at = new Date(iso);
  if (range === 'today') return isSameDay(at, now);

  const days = range === 'week' ? 7 : 30;
  return now.getTime() - at.getTime() <= days * 86_400_000;
}

export const useActivity = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: seedActivities(),
      logs: [],
      range: 'today',

      push: (kind, title, detail) =>
        set((state) => ({
          activities: [
            { id: createId('act'), kind, title, detail, at: new Date().toISOString() },
            ...state.activities,
          ].slice(0, ACTIVITY_LIMIT),
        })),

      pushLog: (level, message) =>
        set((state) => ({
          logs: [
            { id: createId('log'), level, message, at: new Date().toISOString() },
            ...state.logs,
          ].slice(0, LOG_LIMIT),
        })),

      setRange: (range) => set({ range }),

      visible: () => {
        const { activities, range } = get();
        const now = new Date();
        return activities.filter((activity) => withinRange(activity.at, range, now));
      },

      clear: () => set({ activities: [], logs: [] }),
    }),
    {
      name: 'activity',
      storage: jsonStorage,
      partialize: (state) => ({ activities: state.activities }),
    },
  ),
);

/** Seçili zaman aralığındaki etkinlikler — memoize edilmiş. */
export function useVisibleActivities(): Activity[] {
  const activities = useActivity((state) => state.activities);
  const range = useActivity((state) => state.range);

  return useMemo(() => {
    const now = new Date();
    return activities.filter((activity) => withinRange(activity.at, range, now));
  }, [activities, range]);
}
