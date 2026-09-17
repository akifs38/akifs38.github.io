/** Tarih/saat biçimleyicileri — hepsi Türkçe ve yerel saat diliminde. */

const time = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const dayMonth = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });
const full = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

export function formatDayMonth(iso: string): string {
  return dayMonth.format(new Date(iso));
}

export function formatFull(iso: string): string {
  return full.format(new Date(iso));
}

/** "az önce", "12 dk önce", "3 sa önce", "dün", "5 Mart". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'dün';
  if (days < 7) return `${days} gün önce`;
  return formatDayMonth(iso);
}

/** Saniyeyi "3g 4sa 12dk" gibi okunur süreye çevirir. */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);

  const parts: string[] = [];
  if (d) parts.push(`${d}g`);
  if (h) parts.push(`${h}sa`);
  parts.push(`${m}dk`);
  return parts.join(' ');
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Takvim kaydının bir sonraki geleceği tarih (yinelenenlerde yıl kaydırılır). */
export function nextOccurrence(dateIso: string, recurring: boolean, from: Date = new Date()): Date {
  const [year, month, day] = dateIso.split('-').map(Number);
  const anchor = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (!recurring) return anchor;

  const candidate = new Date(from.getFullYear(), anchor.getMonth(), anchor.getDate());
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (candidate < today) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

/** Bugünden hedefe kaç gün kaldığı; bugün için 0. */
export function daysUntil(target: Date, from: Date = new Date()): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Saate göre selamlama — Elçin'in ilk cümlesini doğallaştırır. */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'İyi geceler';
  if (h < 11) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  if (h < 22) return 'İyi akşamlar';
  return 'İyi geceler';
}
