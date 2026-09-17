import { config } from '@/config';
import type { Memory, MemoryDraft, MemoryKind } from '@/types';
import { fold, trLower } from './text';

/**
 * Hafıza motoru.
 *
 * İki işi var:
 *   1. Çıkarım — kullanıcının söylediğinden kalıcı olmayı hak eden bilgiyi
 *      ayıklamak. Her cümle hatırlanmaz; "bugün markete gittim" unutulur,
 *      "kahveyi severim" kalır.
 *   2. Getirme — bir mesaja cevap verirken bağlama hangi kayıtların
 *      gireceğini seçmek.
 */

interface ExtractionRule {
  kind: MemoryKind;
  /** Yakalama grubu 1, hatırlanacak içeriği verir. */
  pattern: RegExp;
  importance: number;
  /**
   * Kaydı insanın okuyacağı cümleye çevirir.
   *
   * `groups` sadeleştirilmiş metinden değil, kullanıcının kendi yazdığı ham
   * metinden kesilir; aksi halde hafızaya "muzig" diye yazılırdı.
   */
  render: (groups: (string | undefined)[], userName: string) => string;
  tags?: readonly string[];
}

/**
 * Desenler sadeleştirilmiş metne (Türkçe harfler ASCII'ye indirgenmiş)
 * uygulanır, ama içerik ham metinden kesilir — böylece hafızada "kahve"
 * değil "kahveyi" gibi kullanıcının kendi yazımı korunur.
 */
const RULES: readonly ExtractionRule[] = [
  {
    kind: 'preference',
    pattern: /\b(?:ben |)([a-zçğıöşü0-9 ]{2,40}?)\s+(?:cok |gercekten |)(?:seviyorum|severim|bayiliyorum)\b/d,
    importance: 0.8,
    render: (g, user) => `${user} ${tidyPhrase(g[1])} seviyor.`,
    tags: ['sevdikleri'],
  },
  {
    kind: 'preference',
    pattern: /\b([a-zçğıöşü0-9 ]{2,40}?)\s+(?:hic |)(?:sevmiyorum|sevmem|nefret ediyorum|hoslanmiyorum)\b/d,
    importance: 0.75,
    render: (g, user) => `${user} ${tidyPhrase(g[1])} sevmiyor.`,
    tags: ['sevmedikleri'],
  },
  {
    kind: 'fact',
    pattern: /\b(?:benim |)(?:adim|ismim)\s+([a-zçğıöşü]{2,24})\b/d,
    importance: 0.95,
    render: (g) => `Adı ${capitalize(clean(g[1]))}.`,
    tags: ['kimlik'],
  },
  {
    kind: 'fact',
    pattern: /\b(?:ben |)([a-zçğıöşü ]{3,30}?)\s*(?:da|de|te|ta)\s*(?:calisiyorum|okuyorum|yasiyorum)\b/d,
    importance: 0.85,
    render: (g, user) => `${user}: ${clean(g[0])}.`,
    tags: ['hayat'],
  },
  {
    kind: 'event',
    pattern: /\b(?:yarin|bugun|haftaya|gelecek hafta|pazartesi|sali|carsamba|persembe|cuma|cumartesi|pazar)\s+([a-zçğıöşü0-9 ]{3,60}?)\s*(?:var|olacak|gidiyorum|baslıyor|basliyor)\b/d,
    importance: 0.7,
    render: (g) => `Yaklaşan: ${clean(g[0])}.`,
    tags: ['plan'],
  },
  {
    kind: 'event',
    pattern: /\b(?:dogum gunum|dogum günüm)\s+([a-zçğıöşü0-9 ]{2,30})\b/d,
    importance: 0.95,
    render: (g) => `Doğum günü: ${clean(g[1])}.`,
    tags: ['özel gün'],
  },
  {
    kind: 'relationship',
    pattern: /\b(?:annem|babam|kardesim|ablam|abim|arkadasim|esim|sevgilim)\s+([a-zçğıöşü0-9 ]{2,40})\b/d,
    importance: 0.7,
    render: (g) => `İlişki notu: ${clean(g[0])}.`,
    tags: ['yakınları'],
  },
  {
    kind: 'short_term',
    pattern: /\b(?:bugun|su an|simdi)\s+([a-zçğıöşü0-9 ]{3,60}?)\s*(?:hissediyorum|yorgunum|mutluyum|uzgunum|stresliyim)\b/d,
    importance: 0.4,
    render: (g) => `Bugünkü hali: ${clean(g[0])}.`,
    tags: ['ruh hali'],
  },
];

function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

/** Bağlaçlar: "yorgunum ama kahveyi seviyorum" cümlesinde asıl bilgi sonda. */
const CONJUNCTIONS = /\b(?:ama|fakat|ancak|lakin|ve|ile|cunku|ayrica|yine de|bir de)\b/g;

/** Bilgi taşımayan başlangıç kelimeleri. */
const FILLERS = new Set([
  'ben', 'bugun', 'dun', 'yarin', 'su', 'an', 'simdi', 'hep', 'hala', 'genelde',
  'cok', 'biraz', 'gercekten', 'baya', 'oldukca', 'aslinda', 'sanirim', 'galiba',
]);

/**
 * Yakalanan ifadeyi hatırlanmaya değer çekirdeğe indirger.
 *
 * Desenler cümlenin başından itibaren eşleştiği için "bugün biraz yorgunum ama
 * kahveyi" gibi fazlalıklar kapsama giriyordu; hafızada "Gülçin bugun biraz
 * yorgunum ama kahve seviyor." gibi anlamsız kayıtlar oluşuyordu. Burada önce
 * son bağlaçtan sonrası alınır, sonra baştaki dolgu kelimeleri atılır ve ifade
 * en fazla dört kelimeyle sınırlanır.
 */
function tidyPhrase(value: string | undefined): string {
  let phrase = clean(value);
  if (!phrase) return phrase;

  const segments = phrase.split(CONJUNCTIONS).filter((part) => part && part.trim());
  phrase = (segments[segments.length - 1] ?? phrase).trim();

  let words = phrase.split(/\s+/).filter(Boolean);
  while (words.length > 1 && FILLERS.has(fold(words[0] ?? ''))) words = words.slice(1);
  if (words.length > 4) words = words.slice(-4);

  return words.join(' ');
}

function capitalize(value: string): string {
  if (!value) return value;
  const first = value[0] ?? '';
  return (first === 'i' ? 'İ' : first.toUpperCase()) + value.slice(1);
}

/**
 * Bir mesajdan hafıza taslakları çıkarır.
 *
 * Eşik altında kalan çıkarımlar elenir; kalanlar kullanıcıya "Elçin bunu
 * hatırladı" olarak gösterilir, böylece kimse arkasından kayıt tutulduğunu
 * hissetmez.
 */
export function extractMemories(
  text: string,
  userName: string,
  sourceMessageId?: string,
): MemoryDraft[] {
  const folded = fold(text);
  const drafts: MemoryDraft[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    const match = folded.match(rule.pattern);
    if (!match?.indices) continue;
    if (rule.importance < config.ai.memoryThreshold) continue;

    // fold() her karakteri tek bir karaktere çevirdiği için konumlar birebir
    // örtüşür: sadeleştirilmiş metinde bulunan aralık, ham metinde de aynı
    // aralıktır. Böylece eşleştirme ASCII üzerinde, kayıt Türkçe olur.
    const groups = match.indices.map((span) =>
      span ? text.slice(span[0], span[1]) : undefined,
    );

    const content = rule.render(groups, userName);
    const key = fold(content);
    if (seen.has(key)) continue;
    seen.add(key);

    drafts.push({
      kind: rule.kind,
      content,
      importance: rule.importance,
      tags: [...(rule.tags ?? [])],
      sourceMessageId,
    });
  }

  return drafts;
}

/** Aynı bilgi ikinci kez söylendiğinde yeni kayıt değil, pekiştirme olmalı. */
export function findDuplicate(memories: readonly Memory[], draft: MemoryDraft): Memory | undefined {
  const target = fold(draft.content);
  return memories.find((memory) => {
    if (memory.kind !== draft.kind) return false;
    const existing = fold(memory.content);
    return existing === target || similarity(existing, target) > 0.82;
  });
}

/** Basit token örtüşmesi (Jaccard). Kısa Türkçe cümleler için yeterli. */
export function similarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared += 1;
  return shared / (setA.size + setB.size - shared);
}

/**
 * Mesajla ilgili hafızaları getirir.
 *
 * Puan = kelime örtüşmesi + önem + tazelik. Alakasızsa hiç döndürmez:
 * bağlama gereksiz kayıt doldurmak modeli de kullanıcıyı da yanıltır.
 */
export function retrieveMemories(
  memories: readonly Memory[],
  query: string,
  limit = 5,
): Memory[] {
  const tokens = fold(query).split(/\s+/).filter((token) => token.length > 2);
  const now = Date.now();

  const scored = memories.map((memory) => {
    const haystack = fold(`${memory.content} ${memory.tags.join(' ')}`);
    let overlap = 0;
    for (const token of tokens) if (haystack.includes(token)) overlap += 1;

    const ageDays = (now - new Date(memory.updatedAt).getTime()) / 86_400_000;
    const freshness = 1 / (1 + ageDays / 30);
    const score = overlap * 1.2 + memory.importance + freshness * 0.4;

    return { memory, score, overlap };
  });

  return scored
    .filter((entry) => entry.overlap > 0 || entry.memory.importance >= 0.85)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.memory);
}

/** Hafıza aramasında kullanılan eşleştirme — UI'daki arama kutusu da bunu kullanır. */
export function matchesQuery(memory: Memory, query: string): boolean {
  const q = trLower(query).trim();
  if (!q) return true;
  const haystack = fold(`${memory.content} ${memory.tags.join(' ')} ${memory.kind}`);
  return fold(q)
    .split(/\s+/)
    .every((token) => haystack.includes(token));
}

export const MEMORY_KIND_LABEL: Record<MemoryKind, string> = {
  preference: 'Tercih',
  fact: 'Bilgi',
  event: 'Olay',
  relationship: 'İlişki',
  short_term: 'Kısa süreli',
};

export const MEMORY_KIND_ICON: Record<MemoryKind, string> = {
  preference: '☕',
  fact: '📌',
  event: '📅',
  relationship: '🫂',
  short_term: '💭',
};
