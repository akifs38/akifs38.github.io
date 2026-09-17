import { create } from 'zustand';
import type { AnimationName, Mood, MoodSample } from '@/types';
import { animationForMood, blendMood, type MoodInference } from '@/services/ai/moodEngine';
import { jsonStorage, persist } from './persist';

/**
 * Elçin'in kendi hali.
 *
 * Avatar da, cihaz da, arka plan ışıması da buradan beslenir. Tek kaynak
 * olması şart: web'de gülen Elçin'in OLED'de de gülmesi bununla sağlanıyor.
 */
interface ElcinState {
  mood: Mood;
  intensity: number;
  reason: string;
  since: string;
  /** Anlık oynatılan animasyon; bittiğinde ruh haline geri düşer. */
  animation: AnimationName;
  history: MoodSample[];
  /** Gizli mod açıldı mı. */
  secretUnlocked: boolean;

  setMood(next: MoodInference): void;
  play(animation: AnimationName, holdMs?: number): void;
  unlockSecret(): void;
  resetHistory(): void;
}

const HISTORY_LIMIT = 60;
let animationTimer: ReturnType<typeof setTimeout> | null = null;

export const useElcin = create<ElcinState>()(
  persist(
    (set, get) => ({
      mood: 'normal',
      intensity: 0.35,
      reason: 'Seni bekliyor',
      since: new Date().toISOString(),
      animation: 'idle',
      history: [],
      secretUnlocked: false,

      setMood: (next) => {
        const blended = blendMood(get().mood, next);
        const at = new Date().toISOString();
        set((state) => ({
          mood: blended.mood,
          intensity: blended.intensity,
          reason: blended.reason,
          since: blended.mood === state.mood ? state.since : at,
          history: [
            ...state.history,
            { at, mood: blended.mood, intensity: blended.intensity, reason: blended.reason },
          ].slice(-HISTORY_LIMIT),
        }));
      },

      play: (animation, holdMs = 2_600) => {
        if (animationTimer) clearTimeout(animationTimer);
        set({ animation });
        // Animasyon bitince yüz ruh haline geri döner; aksi halde Elçin
        // sonsuza kadar gülmeye devam eder.
        animationTimer = setTimeout(() => {
          set((state) => ({ animation: animationForMood(state.mood) }));
        }, holdMs);
      },

      unlockSecret: () => set({ secretUnlocked: true }),
      resetHistory: () => set({ history: [] }),
    }),
    {
      name: 'elcin',
      storage: jsonStorage,
      partialize: (state) => ({
        mood: state.mood,
        intensity: state.intensity,
        reason: state.reason,
        since: state.since,
        history: state.history,
        secretUnlocked: state.secretUnlocked,
      }),
    },
  ),
);
