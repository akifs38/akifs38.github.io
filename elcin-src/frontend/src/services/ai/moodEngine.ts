import type { AnimationName, Mood } from '@/types';
import { fold, isQuestion } from './text';

/**
 * Mood engine.
 *
 * Elçin'in ruh hali iki yerden beslenir: kullanıcının yazdığı metin ve
 * Elçin'in kendi cevabı. Burada kural tabanlı bir çıkarım var; ileride bulut
 * modeli ruh halini doğrudan döndürdüğünde bu motor yedek/doğrulayıcı olarak
 * kalır (model saçma bir değer döndürürse `coerceMood` onu yakalar).
 */

interface MoodSignal {
  mood: Mood;
  /** Eşleşme başına eklenen ağırlık. */
  weight: number;
  keywords: readonly string[];
}

const SIGNALS: readonly MoodSignal[] = [
  {
    mood: 'love',
    weight: 1.4,
    keywords: ['seni seviyorum', 'canım', 'kalbim', 'özledim', 'sevgilim', '❤', '🥰', '😍'],
  },
  {
    mood: 'sad',
    weight: 1.2,
    keywords: [
      'üzgün', 'üzüldüm', 'kötüyüm', 'ağladım', 'yorgun', 'bıktım', 'moralim bozuk',
      'canım sıkkın', 'mutsuz', 'yalnız', 'kaygılı', 'stresli', 'zor bir gün', '😢', '😞',
    ],
  },
  {
    mood: 'excited',
    weight: 1.1,
    keywords: [
      'harika', 'muhteşem', 'inanmıyorum', 'müthiş', 'çok mutluyum', 'başardım',
      'kabul edildim', 'sonunda', 'heyecanlıyım', '🎉', '🥳',
    ],
  },
  {
    mood: 'happy',
    weight: 1,
    keywords: [
      'mutluyum', 'iyiyim', 'güzel', 'sevindim', 'teşekkür', 'sağ ol', 'süper',
      'keyifli', 'gülüyorum', 'komik', 'haha', ':)', '😊', '😄',
    ],
  },
  {
    mood: 'surprised',
    weight: 1,
    keywords: ['şaşırdım', 'gerçekten mi', 'olamaz', 'vay', 'inanılmaz', '😮', '!!'],
  },
  {
    mood: 'curious',
    weight: 0.8,
    keywords: ['merak', 'acaba', 'anlat', 'nasıl yani', 'ne demek', 'öğrenmek'],
  },
  {
    mood: 'sleepy',
    weight: 1,
    keywords: ['uykum var', 'yatıyorum', 'iyi geceler', 'uyuyorum', 'yorgunum', '😴'],
  },
  {
    mood: 'thinking',
    weight: 0.6,
    keywords: ['düşünüyorum', 'karar veremedim', 'emin değilim', 'bilmiyorum'],
  },
];

/** Her ruh haline yakışan varsayılan animasyon. */
const MOOD_ANIMATION: Record<Mood, AnimationName> = {
  normal: 'idle',
  happy: 'smile',
  sad: 'sad',
  curious: 'blink',
  thinking: 'think',
  surprised: 'surprise',
  excited: 'laugh',
  sleepy: 'sleep',
  talking: 'talk',
  love: 'heart',
};

const VALID_MOODS = new Set<string>(Object.keys(MOOD_ANIMATION));

export interface MoodInference {
  mood: Mood;
  intensity: number;
  reason: string;
}

/**
 * Metinden ruh hali çıkarır.
 *
 * Skorlar toplanır, en yüksek sinyal kazanır. Hiçbir sinyal yoksa soru
 * cümlesi "meraklı", düz cümle "normal" sayılır — böylece Elçin her mesajda
 * aynı yüzle bakmaz.
 */
export function inferMood(text: string): MoodInference {
  const folded = fold(text);
  const scores = new Map<Mood, number>();
  const hits = new Map<Mood, string>();

  for (const signal of SIGNALS) {
    for (const keyword of signal.keywords) {
      if (!folded.includes(fold(keyword))) continue;
      scores.set(signal.mood, (scores.get(signal.mood) ?? 0) + signal.weight);
      if (!hits.has(signal.mood)) hits.set(signal.mood, keyword);
    }
  }

  // Büyük harfle bağırmak ve ünlem yoğunluğu şiddeti artırır, ruh halini değil.
  const shouty = text.length > 8 && text === text.toUpperCase() && /[A-ZÇĞİÖŞÜ]/.test(text);
  const bangs = (text.match(/!/g) ?? []).length;

  let best: Mood = 'normal';
  let bestScore = 0;
  for (const [mood, score] of scores) {
    if (score > bestScore) {
      best = mood;
      bestScore = score;
    }
  }

  if (bestScore === 0) {
    return isQuestion(text)
      ? { mood: 'curious', intensity: 0.45, reason: 'Bir soru soruldu' }
      : { mood: 'normal', intensity: 0.3, reason: 'Sakin bir sohbet' };
  }

  const intensity = clamp01(0.35 + bestScore * 0.25 + bangs * 0.06 + (shouty ? 0.15 : 0));
  const keyword = hits.get(best);
  return {
    mood: best,
    intensity,
    reason: keyword ? `"${keyword}" ifadesi` : 'Konuşmanın tonu',
  };
}

/**
 * İki ruh halini harmanlar: Elçin bir anda uçtan uca sıçramaz, önceki halinden
 * yenisine doğru kayar. `weight` yeni sinyalin ağırlığıdır.
 */
export function blendMood(previous: Mood, next: MoodInference, weight = 0.7): MoodInference {
  if (previous === next.mood) {
    return { ...next, intensity: clamp01(next.intensity + 0.1) };
  }
  // Zayıf bir sinyal, güçlü bir önceki ruh halini deviremez.
  if (next.intensity * weight < 0.35) {
    return { mood: previous, intensity: 0.4, reason: 'Önceki ruh hali sürüyor' };
  }
  return next;
}

/** Ruh haline karşılık gelen animasyon. */
export function animationForMood(mood: Mood): AnimationName {
  return MOOD_ANIMATION[mood];
}

/** Dışarıdan (model/API) gelen değeri güvenli bir Mood'a indirger. */
export function coerceMood(value: unknown, fallback: Mood = 'normal'): Mood {
  if (typeof value === 'string' && VALID_MOODS.has(value)) return value as Mood;
  return fallback;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Ruh hallerinin Türkçe adı — UI her yerde bunu kullanır. */
export const MOOD_LABEL: Record<Mood, string> = {
  normal: 'Sakin',
  happy: 'Mutlu',
  sad: 'Üzgün',
  curious: 'Meraklı',
  thinking: 'Düşünceli',
  surprised: 'Şaşkın',
  excited: 'Heyecanlı',
  sleepy: 'Uykulu',
  talking: 'Konuşuyor',
  love: 'Sevgi dolu',
};

/** Ruh haline karşılık gelen vurgu rengi (CSS değişkeni değil, ham HSL). */
export const MOOD_ACCENT: Record<Mood, string> = {
  normal: '265 70% 72%',
  happy: '38 95% 64%',
  sad: '214 65% 66%',
  curious: '188 78% 60%',
  thinking: '255 60% 70%',
  surprised: '48 100% 66%',
  excited: '330 90% 68%',
  sleepy: '232 40% 62%',
  talking: '280 75% 70%',
  love: '345 90% 70%',
};
