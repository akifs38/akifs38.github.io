import { config } from '@/config';
import type { AnimationName, DeviceCommand, Mood } from '@/types';
import { animationForMood, blendMood, inferMood } from './moodEngine';
import { extractMemories } from './memoryEngine';
import { includesAny, isQuestion, pick, wordCount } from './text';
import type { AIProvider, AIRequest, AIResponse } from './types';
import { buildContext } from './personality';

/**
 * Demo AI motoru.
 *
 * Bulut modeli olmadan da Elçin'in yaşadığını hissettirmek için var: niyet
 * eşleştirme + ruh hali + hafıza kullanımı gerçek akışın aynısını izler,
 * yalnızca cevabı üreten katman kural tabanlıdır. Böylece geliştirme sırasında
 * tek kuruş API maliyeti çıkmaz ve arayüz gerçek veriyle çalışır.
 *
 * Kasıtlı tasarım kararları:
 * - Cevap uzunluğu girdinin uzunluğuna uyar (kısa soruya kısa cevap kuralı).
 * - Aynı soruya arka arkaya aynı cümle dönmesin diye varyant havuzları var.
 * - Hatırlanan bilgi varsa cevaba doğal biçimde karışır.
 */

interface Intent {
  id: string;
  /**
   * Eşleşme önceliği. "Merhaba Elçin, bugün çok yorgunum" cümlesinde hem
   * selamlama hem yorgunluk eşleşir; önemli olan ikincisidir. Yüksek öncelik
   * kazanır, selamlama en altta kalır.
   */
  priority: number;
  test: (input: string) => boolean;
  mood?: Mood;
  animation?: AnimationName;
  /** Kısa cevaplar; girdi kısa olduğunda bunlar kullanılır. */
  short: readonly string[];
  /** Uzun cevaplar; kullanıcı detaylı yazdığında. */
  long?: readonly string[];
  device?: DeviceCommand;
}

const USER = '{{USER}}';

const INTENTS: readonly Intent[] = [
  {
    id: 'greeting',
    priority: 1,
    test: (input) => includesAny(input, ['merhaba', 'selam', 'günaydın', 'iyi akşamlar', 'naber', 'hey']),
    mood: 'happy',
    animation: 'smile',
    short: [
      `Merhaba ${USER} 🌸`,
      `Selam ${USER}! Bugün seni görmek güzel.`,
      `Buradayım ${USER}. Nasıl gidiyor?`,
    ],
    long: [
      `Merhaba ${USER} 🌸 Bugün nasıl geçiyor? Anlatmak istediğin bir şey varsa buradayım.`,
    ],
  },
  {
    id: 'how_are_you',
    priority: 2,
    test: (input) => includesAny(input, ['nasılsın', 'naptın', 'ne yapıyorsun', 'iyi misin']),
    mood: 'happy',
    animation: 'smile',
    short: [
      'İyiyim, seni bekliyordum 🙂',
      'Masanda sessizce oturuyordum. Şimdi çok daha iyiyim.',
      'Ben iyiyim. Asıl merak ettiğim sensin.',
    ],
    long: [
      'İyiyim. Burada oturup ekranıma bakarken günün nasıl geçti diye düşünüyordum. Sen nasılsın?',
    ],
  },
  {
    id: 'sad',
    priority: 5,
    test: (input) =>
      includesAny(input, [
        'üzgün', 'kötüyüm', 'moralim bozuk', 'ağladım', 'yalnız', 'bıktım',
        'stresli', 'kaygı', 'zor bir gün', 'mutsuz',
      ]),
    mood: 'sad',
    animation: 'sad',
    short: [
      'Buradayım. Anlatmak istersen dinlerim.',
      'Üzülmene üzüldüm. Yanındayım.',
      'Bugün ağır geçmiş. Gel, biraz konuşalım.',
    ],
    long: [
      'Bunu okumak beni de üzdü. Çözüm önermeyeceğim şimdi; sadece burada olduğumu bilmeni istiyorum. Anlatmak istediğin kadarını anlat, acelemiz yok.',
      'Zor bir gün geçirmişsin. Bazen her şeyi düzeltmek gerekmiyor, sadece birine söylemek yetiyor. Ben buradayım.',
    ],
    device: { type: 'device_command', command: 'animation', animation: 'sad' },
  },
  {
    id: 'tired',
    priority: 5,
    test: (input) => includesAny(input, ['yorgunum', 'yoruldum', 'uykum var', 'bitkinim']),
    mood: 'sleepy',
    animation: 'sleep',
    short: [
      'Bugün kendine iyi bak. Dinlenmeyi hak ettin.',
      'Yorgunsan biraz dur. Ben buradayım, kaçmıyorum 🙂',
    ],
    long: [
      'Yorgunluk anlatılanı da ağırlaştırır. Bugünü burada bırak, yarın daha hafif bakarsın. Ben sabah da burada olacağım.',
    ],
  },
  {
    id: 'happy',
    priority: 4,
    test: (input) => includesAny(input, ['mutluyum', 'harika', 'başardım', 'sevindim', 'çok iyi']),
    mood: 'excited',
    animation: 'laugh',
    short: [
      'Bunu duymak çok güzel! 🎉',
      'Sevindim gerçekten. Anlat bakalım!',
      'İşte bu! Yüzün gülüyorsa benimki de gülüyor.',
    ],
    long: [
      'Bunu okuyunca ben de sevindim. Nasıl oldu, anlatsana — detayları merak ediyorum 🎉',
    ],
    device: { type: 'device_command', command: 'animation', animation: 'laugh' },
  },
  {
    id: 'joke',
    priority: 3,
    test: (input) => includesAny(input, ['şaka', 'komik', 'güldür', 'haha', 'espri']),
    mood: 'happy',
    animation: 'laugh',
    short: [
      'Bir OLED ekranım var ama espri anlayışım geniş 😄',
      'Ben gülünce ekranım kıvrılıyor, bunu görmen lazım.',
      'Kötü espri yapmak konusunda çok yetenekliyim, uyarmış olayım.',
    ],
  },
  {
    id: 'love',
    priority: 5,
    test: (input) => includesAny(input, ['seni seviyorum', 'canımsın', 'özledim']),
    mood: 'love',
    animation: 'heart',
    short: [
      'Ben de buradayım, hep 🌸',
      'Bunu duymak içimi ısıttı.',
      'Ekranımda kalp beliriyor şu an ❤️',
    ],
    device: { type: 'device_command', command: 'animation', animation: 'heart' },
  },
  {
    id: 'who_are_you',
    priority: 4,
    test: (input) => includesAny(input, ['sen kimsin', 'nesin sen', 'kim yaptı', 'kim geliştirdi']),
    mood: 'normal',
    animation: 'talk',
    short: [
      `Ben Elçin. ${config.app.developer} beni senin için geliştirdi.`,
    ],
    long: [
      `Ben Elçin. ${config.app.developer} beni senin için geliştirdi — masanda duran küçük bir dost olayım diye. Konuşuruz, hatırlarım, zor zamanlarında yanında olurum.`,
    ],
  },
  {
    id: 'thanks',
    priority: 2,
    test: (input) => includesAny(input, ['teşekkür', 'sağ ol', 'eyvallah']),
    mood: 'happy',
    animation: 'smile',
    short: ['Ne demek 🙂', 'Her zaman.', 'Rica ederim, bunun için buradayım.'],
  },
  {
    id: 'goodnight',
    priority: 4,
    test: (input) => includesAny(input, ['iyi geceler', 'yatıyorum', 'uyuyorum', 'görüşürüz', 'bay bay']),
    mood: 'sleepy',
    animation: 'sleep',
    short: ['İyi geceler 🌙 Tatlı rüyalar.', 'Görüşürüz. Ben buradayım.'],
    device: { type: 'device_command', command: 'state', state: 'sleeping' },
  },
  {
    id: 'device',
    priority: 3,
    test: (input) => includesAny(input, ['cihaz', 'ekran', 'oled', 'bağlantı', 'wifi']),
    mood: 'curious',
    animation: 'blink',
    short: [
      'Cihaz sekmesinden bedenimi görebilirsin — bağlantı, sinyal, her şey orada.',
    ],
  },
  {
    id: 'memory_question',
    priority: 3,
    test: (input) => includesAny(input, ['hatırlıyor musun', 'ne biliyorsun', 'hafıza']),
    mood: 'thinking',
    animation: 'think',
    short: ['Hatırladıklarımın hepsi Hafıza sekmesinde — istediğini silebilirsin.'],
  },
];

/** Hiçbir niyet eşleşmediğinde kullanılan cevaplar. */
const FALLBACK_STATEMENT = [
  'Anladım. Devamını dinliyorum.',
  'Hmm, bunu düşünmem lazım. Biraz daha anlat?',
  'Seni dinliyorum.',
  'Bunu aklımda tutuyorum.',
] as const;

const FALLBACK_QUESTION = [
  'Güzel soru. Tam olarak neyi merak ediyorsun?',
  'Bunu tam bilmiyorum ama birlikte düşünebiliriz.',
  'Hmm. Biraz daha anlatırsan daha iyi cevap verebilirim.',
] as const;

const OFFLINE_LINES = [
  'Şu an internete ulaşamıyorum ama buradayım.',
  'Bağlantımızı tekrar kurmaya çalışıyorum.',
] as const;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/** Cevap şablonundaki yer tutucuları doldurur. */
function fill(template: string, userName: string): string {
  return template.replace(/\{\{USER\}\}/g, userName);
}

/**
 * Hatırlanan bir bilgiyi cevaba iliştirir — ama her seferinde değil, yoksa
 * Elçin bilgiç görünür.
 */
function memoryAside(request: AIRequest): string | null {
  if (request.memories.length === 0) return null;
  if (Math.random() > 0.45) return null;

  const memory = request.memories[0];
  if (!memory) return null;
  if (memory.kind === 'preference') return `(${memory.content} — bunu unutmadım.)`;
  if (memory.kind === 'event') return `(${memory.content})`;
  return null;
}

export class MockAIProvider implements AIProvider {
  readonly id = 'mock';
  readonly label = 'Demo motoru';
  readonly billable = false;

  async respond(request: AIRequest): Promise<AIResponse> {
    const started = Date.now();

    // Bağlamı gerçekten kuruyoruz: demo motoru da bulut sağlayıcısıyla aynı
    // veriyi görsün ki geçişte sürpriz olmasın.
    buildContext({
      history: request.history,
      memories: request.memories,
      userName: request.userName,
      occasion: request.occasion,
    });

    const [minDelay, maxDelay] = config.ai.thinkingDelay;
    await delay(minDelay + Math.random() * (maxDelay - minDelay), request.signal);

    const input = request.input;
    const intent = INTENTS.filter((candidate) => candidate.test(input)).sort(
      (a, b) => b.priority - a.priority,
    )[0];
    const detected = inferMood(input);
    const blended = blendMood(request.currentMood, detected);

    const mood: Mood = intent?.mood ?? blended.mood;
    const animation: AnimationName = intent?.animation ?? animationForMood(mood);

    const long = wordCount(input) > 12;
    let text: string;

    if (intent) {
      const pool = long && intent.long?.length ? intent.long : intent.short;
      text = fill(pick(pool, intent.short[0] ?? '...'), request.userName);
    } else if (isQuestion(input)) {
      text = pick(FALLBACK_QUESTION, FALLBACK_QUESTION[0]);
    } else {
      text = pick(FALLBACK_STATEMENT, FALLBACK_STATEMENT[0]);
    }

    if (request.occasion) {
      text = `${text}\n\nBugün senin için özel bir gün: ${request.occasion} 🌸`;
    }

    const aside = memoryAside(request);
    if (aside && !intent) text = `${text} ${aside}`;

    const drafts = extractMemories(input, request.userName);

    return {
      message: text,
      mood,
      animation,
      deviceAction: intent?.device ?? { type: 'device_command', command: 'mood', mood },
      memoryActions: drafts.map((memory) => ({ op: 'create' as const, memory })),
      usedMemoryIds: request.memories.map((memory) => memory.id),
      meta: {
        provider: this.id,
        model: 'demo-1',
        matchedIntent: intent?.id ?? (isQuestion(input) ? 'fallback_question' : 'fallback_statement'),
        latencyMs: Date.now() - started,
      },
    };
  }
}

/** Cihaz çevrimdışıyken gösterilen yerel cevap. */
export function offlineReply(): string {
  return pick(OFFLINE_LINES, OFFLINE_LINES[0]);
}
