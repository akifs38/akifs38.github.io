// utils.js — Yardımcı fonksiyonlar: para/tarih biçimlendirme, DOM, kimlik

export const TZ = 'Europe/Istanbul';

const tryFmt = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const tryFmt0 = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// ₺35.000,00
export function money(value, opts = {}) {
  const n = Number(value) || 0;
  const fmt = opts.compact ? tryFmt0 : tryFmt;
  return fmt.format(n);
}

// İşaretli: +₺35.000 / -₺850
export function moneySigned(value) {
  const n = Number(value) || 0;
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return sign + money(Math.abs(n), { compact: false });
}

// Yüzde: %38,7
export function percent(value, digits = 1) {
  const n = Number(value) || 0;
  return '%' + n.toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// --- Tarih yardımcıları (UTC saklanır, TR gösterilir) ---

export function nowISO() {
  return new Date().toISOString();
}

// ISO string -> Date
function toDate(iso) {
  return iso instanceof Date ? iso : new Date(iso);
}

// 26.08.2026
export function dateShort(iso) {
  return toDate(iso).toLocaleDateString('tr-TR', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// 26 Ağustos 2026
export function dateLong(iso) {
  return toDate(iso).toLocaleDateString('tr-TR', {
    timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric',
  });
}

// 14:35
export function timeShort(iso) {
  return toDate(iso).toLocaleTimeString('tr-TR', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit',
  });
}

// 26 Ağustos 2026 14:35
export function dateTimeLong(iso) {
  return dateLong(iso) + ' ' + timeShort(iso);
}

// Türkiye saatine göre yyyy-mm-dd (input[type=date] için)
export function toDateInput(iso) {
  const d = toDate(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// input[type=date] değerini, o günün mevcut saatiyle ISO'ya çevir
export function fromDateInput(dateStr) {
  if (!dateStr) return nowISO();
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(now);
  dt.setFullYear(y, m - 1, d);
  return dt.toISOString();
}

// Ay anahtarı: {year, month(0-11)}
export function ymOf(iso) {
  const d = toDate(iso);
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit',
  }).formatToParts(d);
  const get = (t) => Number(s.find((p) => p.type === t).value);
  return { year: get('year'), month: get('month') - 1 };
}

export function sameMonth(iso, year, month) {
  const ym = ymOf(iso);
  return ym.year === year && ym.month === month;
}

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function monthName(month) {
  return MONTHS_TR[((month % 12) + 12) % 12];
}

export function monthLabel(year, month) {
  return `${monthName(month)} ${year}`;
}

export function todayYM() {
  return ymOf(nowISO());
}

// Yerel (İstanbul) günün başlangıcı — saat farkı hatalarını önlemek için öğlen kullanır
export function dateAt(year, month, day) {
  return new Date(year, month, day, 12, 0, 0, 0);
}

// ISO tarihe n ay ekle (aynı gün, taşarsa ay sonuna sabitlenir)
export function addMonths(iso, n, dayOverride) {
  const d = toDate(iso);
  const day = dayOverride || d.getDate();
  const nd = new Date(d.getFullYear(), d.getMonth() + n, 1, 12, 0, 0);
  const last = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
  nd.setDate(Math.min(day, last));
  return nd;
}

// Belirli yıl/ay için ödeme günü tarihini üret (gün ay sonunu aşarsa sabitlenir)
export function dueDateFor(year, month, paymentDay) {
  const last = new Date(year, month + 1, 0).getDate();
  return dateAt(year, month, Math.min(paymentDay || 1, last));
}

// İki tarih arası tam gün farkı (a - b), yerel gün bazında
export function daysDiff(a, b) {
  const da = new Date(a); da.setHours(12, 0, 0, 0);
  const db = new Date(b); db.setHours(12, 0, 0, 0);
  return Math.round((da - db) / 86400000);
}

export function startOfToday() {
  const d = new Date(); d.setHours(12, 0, 0, 0); return d;
}

// --- Diğer ---

export function uid() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Güvenli HTML kaçışı
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Küçük DOM yardımcı: el('div', {class:'x'}, [...children|text])
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') {
      Object.assign(node.dataset, v);
    } else node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
