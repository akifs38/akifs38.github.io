/**
 * Türkçe metin yardımcıları.
 *
 * Elçin Türkçe düşünür: arama ve eşleştirme yapılırken "İ/ı" gibi Türkçeye
 * özgü harflerin İngilizce `toLowerCase()` ile bozulmaması gerekir
 * ("İSTANBUL".toLowerCase() → "i̇stanbul", araya birleşik nokta girer).
 */

const FOLD: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i', i: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
  â: 'a', Â: 'a',
  î: 'i', Î: 'i',
  û: 'u', Û: 'u',
};

/** Türkçe kurallarına göre küçük harfe çevirir. */
export function trLower(value: string): string {
  return value.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

/**
 * Aksan ve Türkçe harfleri sadeleştirir: "Gülçin kahveyi sever" → "gulcin
 * kahveyi sever". Arama ve anahtar kelime eşleştirmede kullanılır, ekranda
 * gösterilen metinde asla.
 */
export function fold(value: string): string {
  let out = '';
  for (const char of value) out += FOLD[char] ?? char;
  return out.toLowerCase();
}

/** Sadeleştirilmiş metinde bir anahtar kelime geçiyor mu. */
export function includesAny(haystack: string, needles: readonly string[]): boolean {
  const folded = fold(haystack);
  return needles.some((needle) => folded.includes(fold(needle)));
}

/** Kelime sayısı — kısa/uzun cevap kararı için. */
export function wordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Listeden rastgele bir öğe; boş listede undefined yerine hata vermemesi için. */
export function pick<T>(items: readonly T[], fallback: T): T {
  if (items.length === 0) return fallback;
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

/** Cümlenin sonundaki noktalama; soru mu, ünlem mi. */
export function isQuestion(value: string): boolean {
  if (value.includes('?')) return true;
  return includesAny(value, [
    'mi ', 'mı ', 'mu ', 'mü ',
    'nasıl', 'neden', 'niye', 'ne zaman', 'nerede', 'kim ', 'kaç ', 'hangi',
  ]);
}
