import { useMemo } from 'react';
import { create } from 'zustand';
import { createId } from '@/lib/id';
import type { DeveloperMessage, Surprise } from '@/types';
import { seedDeveloperMessages, seedSurprises } from '@/services/api/seed';
import { jsonStorage, persist } from './persist';

interface SurpriseState {
  surprises: Surprise[];
  developerMessages: DeveloperMessage[];

  open(id: string): Surprise | null;
  unlock(id: string): void;
  /** Zamanı gelen sürprizlerin kilidini açar; açılışta bir kez çağrılır. */
  refreshLocks(): void;
  addDeveloperMessage(message: Pick<DeveloperMessage, 'title' | 'body'> & { deliverAt?: string }): void;
  removeDeveloperMessage(id: string): void;
  markRead(id: string): void;
  unreadDeveloperMessages(): DeveloperMessage[];
}

export const useSurprises = create<SurpriseState>()(
  persist(
    (set, get) => ({
      surprises: seedSurprises(),
      developerMessages: seedDeveloperMessages(),

      open: (id) => {
        const surprise = get().surprises.find((entry) => entry.id === id);
        if (!surprise || surprise.locked) return null;

        if (!surprise.openedAt) {
          const openedAt = new Date().toISOString();
          set((state) => ({
            surprises: state.surprises.map((entry) =>
              entry.id === id ? { ...entry, openedAt } : entry,
            ),
          }));
        }
        return surprise;
      },

      unlock: (id) =>
        set((state) => ({
          surprises: state.surprises.map((entry) =>
            entry.id === id ? { ...entry, locked: false } : entry,
          ),
        })),

      refreshLocks: () => {
        const now = Date.now();
        set((state) => ({
          surprises: state.surprises.map((entry) =>
            entry.locked && entry.unlocksAt && new Date(entry.unlocksAt).getTime() <= now
              ? { ...entry, locked: false }
              : entry,
          ),
        }));
      },

      addDeveloperMessage: (message) =>
        set((state) => ({
          developerMessages: [
            {
              id: createId('dev'),
              sender: 'developer',
              recipient: 'gulcin',
              title: message.title,
              body: message.body,
              createdAt: new Date().toISOString(),
              deliverAt: message.deliverAt,
            },
            ...state.developerMessages,
          ],
        })),

      removeDeveloperMessage: (id) =>
        set((state) => ({
          developerMessages: state.developerMessages.filter((message) => message.id !== id),
        })),

      markRead: (id) =>
        set((state) => ({
          developerMessages: state.developerMessages.map((message) =>
            message.id === id && !message.readAt
              ? { ...message, readAt: new Date().toISOString() }
              : message,
          ),
        })),

      unreadDeveloperMessages: () => {
        const now = Date.now();
        return get().developerMessages.filter(
          (message) =>
            !message.readAt && (!message.deliverAt || new Date(message.deliverAt).getTime() <= now),
        );
      },
    }),
    { name: 'surprises', storage: jsonStorage },
  ),
);

/** Teslim zamanı gelmiş, okunmamış mesajlar — memoize edilmiş. */
export function useUnreadDeveloperMessages(): DeveloperMessage[] {
  const messages = useSurprises((state) => state.developerMessages);
  return useMemo(() => {
    const now = Date.now();
    return messages.filter(
      (message) =>
        !message.readAt && (!message.deliverAt || new Date(message.deliverAt).getTime() <= now),
    );
  }, [messages]);
}
