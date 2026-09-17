import { useMemo } from 'react';
import { create } from 'zustand';
import { config } from '@/config';
import { createId } from '@/lib/id';
import { nextOccurrence, daysUntil } from '@/lib/time';
import { createAIProvider, offlineReply, type AIProvider } from '@/services/ai';
import { retrieveMemories } from '@/services/ai/memoryEngine';
import { inferMood } from '@/services/ai/moodEngine';
import type { Conversation, Message } from '@/types';
import { useActivity } from './activityStore';
import { useCalendar } from './calendarStore';
import { useDevice } from './deviceStore';
import { useElcin } from './elcinStore';
import { useMemories } from './memoryStore';
import { useSettings } from './settingsStore';
import { jsonStorage, persist } from './persist';

/**
 * Sohbet akışı.
 *
 * Sıra 9. maddedeki boru hattının aynısı:
 *   mesaj → bağlam → hafıza getirme → kişilik → model → ayrıştırma →
 *   hafıza güncelleme → cihaz komutu
 *
 * Bu sıra burada tek bir fonksiyonda toplandı; UI yalnızca `send` çağırır.
 */

interface ChatState {
  conversations: Conversation[];
  messages: Message[];
  activeId: string;
  /** Elçin şu an cevap yazıyor mu — yazıyor animasyonu buna bakar. */
  thinking: boolean;
  error: string | null;

  send(text: string): Promise<void>;
  newConversation(): void;
  selectConversation(id: string): void;
  deleteConversation(id: string): void;
  clearAll(): void;
  activeMessages(): Message[];
}

let provider: AIProvider | null = null;
let inflight: AbortController | null = null;

function getProvider(): AIProvider {
  const preference = useSettings.getState().aiProvider;
  if (!provider || provider.id !== preference) provider = createAIProvider(preference);
  return provider;
}

function firstConversation(): Conversation {
  const now = new Date().toISOString();
  return { id: createId('conv'), title: 'İlk sohbet', createdAt: now, updatedAt: now, messageCount: 0 };
}

const initial = firstConversation();

/**
 * Bugüne denk gelen özel gün varsa başlığı — Elçin cevabında anabilir.
 *
 * Günlük hatırlatmalar ("su içmeyi unutma") bilinçli olarak dışarıda: her gün
 * tekrar eden bir not "bugün senin için özel bir gün" değildir.
 */
function occasionToday(): string | undefined {
  const events = useCalendar.getState().events;
  for (const event of events) {
    if (event.kind === 'reminder') continue;
    if (daysUntil(nextOccurrence(event.date, event.recurring)) === 0) return event.title;
  }
  return undefined;
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [initial],
      messages: [],
      activeId: initial.id,
      thinking: false,
      error: null,

      send: async (text) => {
        const input = text.trim();
        if (!input || get().thinking) return;

        const settings = useSettings.getState();
        const elcin = useElcin.getState();
        const memories = useMemories.getState();
        const device = useDevice.getState();
        const activity = useActivity.getState();
        const conversationId = get().activeId;
        const now = new Date().toISOString();

        const userMessage: Message = {
          id: createId('msg'),
          conversationId,
          author: 'user',
          text: input,
          createdAt: now,
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          thinking: true,
          error: null,
        }));

        // Kullanıcı yazarken Elçin'in yüzü hemen tepki verir — cevabı beklemez.
        elcin.setMood(inferMood(input));
        elcin.play('think', 1_400);
        device.send({ type: 'device_command', command: 'state', state: 'thinking' });

        const recalled = retrieveMemories(memories.memories, input);

        inflight?.abort();
        inflight = new AbortController();

        try {
          const response = await getProvider().respond({
            input,
            history: get().messages.filter((message) => message.conversationId === conversationId),
            memories: recalled,
            userName: settings.userName,
            currentMood: elcin.mood,
            occasion: occasionToday(),
            signal: inflight.signal,
          });

          const reply: Message = {
            id: createId('msg'),
            conversationId,
            author: 'elcin',
            text: response.message,
            createdAt: new Date().toISOString(),
            mood: response.mood,
            animation: response.animation,
            usedMemoryIds: response.usedMemoryIds,
          };

          set((state) => ({
            messages: [...state.messages, reply],
            thinking: false,
            conversations: state.conversations.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    updatedAt: reply.createdAt,
                    messageCount: conversation.messageCount + 2,
                    title:
                      conversation.messageCount === 0
                        ? input.slice(0, 40) + (input.length > 40 ? '…' : '')
                        : conversation.title,
                  }
                : conversation,
            ),
          }));

          elcin.setMood({ mood: response.mood, intensity: 0.7, reason: 'Konuşmanın tonu' });
          elcin.play(response.animation);

          // Hafıza güncelleme — ayarlardan kapatılabilir, kullanıcı kontrolü esas.
          if (settings.autoMemory) {
            for (const action of response.memoryActions) {
              if (action.op === 'create') {
                const created = memories.add(action.memory);
                if (created) activity.push('memory', 'Yeni bir şey hatırladı', created.content);
              } else {
                memories.reinforce(action.id, action.importance);
              }
            }
          }

          if (response.deviceAction) device.send(response.deviceAction);
          device.send({ type: 'device_command', command: 'state', state: 'idle' });
          activity.push('chat', 'Sohbet ettiniz', input.slice(0, 40));
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            set({ thinking: false });
            return;
          }

          // Kullanıcıya yığın izi değil, Elçin'in cümlesi gösterilir.
          const fallback: Message = {
            id: createId('msg'),
            conversationId,
            author: 'elcin',
            text: offlineReply(),
            createdAt: new Date().toISOString(),
            mood: 'sad',
            animation: 'sad',
          };
          set((state) => ({
            messages: [...state.messages, fallback],
            thinking: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          }));
          activity.pushLog('error', `Sohbet hatası: ${String(error)}`);
        } finally {
          inflight = null;
        }
      },

      newConversation: () => {
        const conversation = firstConversation();
        set((state) => ({
          conversations: [{ ...conversation, title: 'Yeni sohbet' }, ...state.conversations],
          activeId: conversation.id,
        }));
      },

      selectConversation: (id) => set({ activeId: id }),

      deleteConversation: (id) =>
        set((state) => {
          const remaining = state.conversations.filter((conversation) => conversation.id !== id);
          const next = remaining[0] ?? firstConversation();
          return {
            conversations: remaining.length > 0 ? remaining : [next],
            messages: state.messages.filter((message) => message.conversationId !== id),
            activeId: state.activeId === id ? next.id : state.activeId,
          };
        }),

      clearAll: () => {
        const conversation = firstConversation();
        set({ conversations: [conversation], messages: [], activeId: conversation.id });
      },

      activeMessages: () => {
        const { messages, activeId } = get();
        return messages.filter((message) => message.conversationId === activeId);
      },
    }),
    {
      name: 'chat',
      storage: jsonStorage,
      partialize: (state) => ({
        conversations: state.conversations,
        // Sohbet geçmişi sınırlanır: sonsuz büyüyen bir kayıt hem depolamayı
        // doldurur hem de kullanıcının kontrolünden çıkar.
        messages: state.messages.slice(-400),
        activeId: state.activeId,
      }),
    },
  ),
);

export const CHAT_SUGGESTIONS = [
  'Merhaba Elçin',
  'Bugün biraz yorgunum',
  'Sen kimsin?',
  'Bana bir şaka yap',
  'Beni neler hatırlıyorsun?',
] as const;

export const CONTEXT_WINDOW = config.ai.contextWindow;

/** Açık sohbetin mesajları — memoize edilmiş. */
export function useActiveMessages(): Message[] {
  const messages = useChat((state) => state.messages);
  const activeId = useChat((state) => state.activeId);
  return useMemo(
    () => messages.filter((message) => message.conversationId === activeId),
    [messages, activeId],
  );
}
