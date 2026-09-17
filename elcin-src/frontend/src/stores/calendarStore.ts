import { useMemo } from 'react';
import { create } from 'zustand';
import { createId } from '@/lib/id';
import { daysUntil, nextOccurrence } from '@/lib/time';
import type { CalendarEvent } from '@/types';
import { seedCalendar } from '@/services/api/seed';
import { jsonStorage, persist } from './persist';

export interface UpcomingEvent {
  event: CalendarEvent;
  date: Date;
  inDays: number;
}

interface CalendarState {
  events: CalendarEvent[];
  add(event: Omit<CalendarEvent, 'id'>): void;
  update(id: string, patch: Partial<CalendarEvent>): void;
  remove(id: string): void;
  /** Yaklaşan günler, en yakın önce. */
  upcoming(limit?: number): UpcomingEvent[];
}

export const useCalendar = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: seedCalendar(),

      add: (event) =>
        set((state) => ({ events: [...state.events, { ...event, id: createId('cal') }] })),

      update: (id, patch) =>
        set((state) => ({
          events: state.events.map((event) => (event.id === id ? { ...event, ...patch } : event)),
        })),

      remove: (id) => set((state) => ({ events: state.events.filter((event) => event.id !== id) })),

      upcoming: (limit = 5) =>
        get()
          .events.map((event) => {
            const date = nextOccurrence(event.date, event.recurring);
            return { event, date, inDays: daysUntil(date) };
          })
          // Yinelenmeyen ve geçmiş kalan günler listeyi kirletmesin.
          .filter((entry) => entry.inDays >= 0)
          .sort((a, b) => a.inDays - b.inDays)
          .slice(0, limit),
    }),
    { name: 'calendar', storage: jsonStorage },
  ),
);

export const EVENT_ICON: Record<CalendarEvent['kind'], string> = {
  birthday: '🎂',
  anniversary: '💝',
  special: '📅',
  reminder: '💌',
};

export const EVENT_LABEL: Record<CalendarEvent['kind'], string> = {
  birthday: 'Doğum günü',
  anniversary: 'Yıldönümü',
  special: 'Özel gün',
  reminder: 'Hatırlatma',
};

/**
 * Yaklaşan günler — memoize edilmiş.
 *
 * Doğrudan `useCalendar((s) => s.upcoming())` demek her render'da yeni bir
 * dizi üretir; zustand bunu "durum değişti" sayıp sonsuz döngüye girer.
 * Türetme bu yüzden seçicinin dışında, useMemo içinde yapılır.
 */
export function useUpcoming(limit = 5): UpcomingEvent[] {
  const events = useCalendar((state) => state.events);
  return useMemo(
    () =>
      events
        .map((event) => {
          const date = nextOccurrence(event.date, event.recurring);
          return { event, date, inDays: daysUntil(date) };
        })
        .filter((entry) => entry.inDays >= 0)
        .sort((a, b) => a.inDays - b.inDays)
        .slice(0, limit),
    [events, limit],
  );
}
