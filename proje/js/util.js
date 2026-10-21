// util.js — Ortak yardımcılar: güvenli HTML üretimi, kimlik, para ve tarih biçimleri.
// Kullanıcının girdiği her metin ekrana yazılmadan önce kaçışlanır (XSS'e karşı).

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

/** Kaçışlanmayacak, güvenli olduğu bilinen HTML parçası. */
export const raw = (s) => new Raw(String(s ?? ''));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function part(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  return esc(v);
}

/** Etiketli şablon: içine konan değerler kaçışlanır, html`` sonuçları olduğu gibi kalır. */
export function html(strings, ...values) {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += part(values[i]);
  }
  return new Raw(out);
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export const round2 = (n) => Math.round((Number(n) || 0) * 100 + Number.EPSILON * 100) / 100;

/** "1.234,50", "1234.5", 1234.5 → 1234.5; boş ya da geçersiz → 0. */
export function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/\s|₺|TL/gi, '');
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const moneyFormats = new Map();
export function money(n, currency = 'TRY') {
  if (!moneyFormats.has(currency)) {
    moneyFormats.set(currency, new Intl.NumberFormat('tr-TR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }
  return moneyFormats.get(currency).format(round2(n));
}

const numberFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
export const num = (n) => numberFormat.format(round2(n));

export const pct = (n) => `%${numberFormat.format(Math.round((Number(n) || 0) * 10) / 10)}`;

/** Yerel tarih "YYYY-MM-DD". */
export function today(d = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return today(new Date(y, m - 1, d + days));
}

/** İki "YYYY-MM-DD" arasındaki gün farkı (b − a). */
export function daysBetween(a, b) {
  const t = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86400000);
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return d && m && y ? `${d}.${m}.${y}` : '—';
}

export function fmtDateTime(isoTs) {
  if (!isoTs) return '—';
  const d = new Date(isoTs);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Türkçe büyük/küçük harf duyarsız arama. */
export const norm = (s) => String(s ?? '').toLocaleLowerCase('tr-TR').normalize('NFC');
export const matches = (query, ...fields) => {
  const q = norm(query).trim();
  return !q || fields.some((f) => norm(f).includes(q));
};

export const byName = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'tr');

/** Baş harfler (avatar): "Ayşe Yılmaz" → "AY". */
export function initials(name) {
  return String(name ?? '').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toLocaleUpperCase('tr-TR')).join('') || '?';
}

/** CSV (Excel Türkçe için ; ayırıcı ve UTF-8 BOM). */
export function toCsv(rows) {
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
}

export function download(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Tutarı yazıyla (teklifte "Yalnız: …") ----------
const ONES = ['', 'Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz'];
const TENS = ['', 'On', 'Yirmi', 'Otuz', 'Kırk', 'Elli', 'Altmış', 'Yetmiş', 'Seksen', 'Doksan'];
const SCALES = ['', 'Bin', 'Milyon', 'Milyar', 'Trilyon'];

function hundreds(n) {
  const w = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  if (h) { if (h > 1) w.push(ONES[h]); w.push('Yüz'); }
  if (t) w.push(TENS[t]);
  if (o) w.push(ONES[o]);
  return w;
}

function integerWords(n) {
  if (!n) return ['Sıfır'];
  const out = [];
  for (let i = 0; n > 0; i++, n = Math.floor(n / 1000)) {
    const g = n % 1000;
    if (!g) continue;
    // "Bir Bin" denmez, "Bin" denir
    out.unshift(...(i === 1 && g === 1 ? [] : hundreds(g)), ...(SCALES[i] ? [SCALES[i]] : []));
  }
  return out;
}

/** 12345.5 → "On İki Bin Üç Yüz Kırk Beş Türk Lirası Elli Kuruş" */
export function amountInWords(amount, currency = 'TRY') {
  const cents = Math.round(Math.abs(Number(amount) || 0) * 100);
  const main = Math.floor(cents / 100);
  const sub = cents % 100;
  const [big, small] = { TRY: ['Türk Lirası', 'Kuruş'], USD: ['ABD Doları', 'Sent'], EUR: ['Avro', 'Sent'], GBP: ['Sterlin', 'Peni'] }[currency] ?? [currency, ''];
  return `${integerWords(main).join(' ')} ${big}${sub ? ` ${integerWords(sub).join(' ')} ${small}` : ''}`;
}
