// Paylaşım: WhatsApp ve e-posta bağlantıları, çalışanın görev listesi metni.

import { store } from '../store.js';
import { fmtDate, money, today } from '../util.js';
import { TASK_STATUS, PRIORITY, PRIORITY_ORDER, isOverdue, quoteTotals } from '../calc.js';

/** Türkiye numarası → wa.me biçimi (0532… → 90532…). Numara yoksa numarasız paylaşım bağlantısı. */
export function whatsappLink(phone, text) {
  let digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = `9${digits}`;
  if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`;
  const base = digits.length >= 11 ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export const mailLink = (email, subject, body) =>
  `mailto:${encodeURIComponent(email ?? '').replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export function memberTasksText(member) {
  const s = store.state;
  const t = today();
  const open = s.tasks
    .filter((x) => x.assigneeId === member.id && x.status !== 'done')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const lines = [`Merhaba ${member.name.split(' ')[0]}, açık görevlerin (${fmtDate(t)}):`, ''];
  open.forEach((x, i) => {
    const p = s.projects.find((pp) => pp.id === x.projectId);
    const flags = [TASK_STATUS[x.status], x.priority && x.priority !== 'normal' ? PRIORITY[x.priority] : '', isOverdue(x, t) ? 'GECİKTİ' : ''].filter(Boolean).join(', ');
    lines.push(`${i + 1}. ${x.title} — ${p?.name ?? ''}${x.dueDate ? ` (teslim ${fmtDate(x.dueDate)})` : ''}${flags ? ` [${flags}]` : ''}`);
  });
  if (!open.length) lines.push('Açık görevin yok.');
  const company = s.settings.company.name;
  if (company) lines.push('', company);
  return lines.join('\n');
}

export function quoteText(quote) {
  const s = store.state;
  const client = s.clients.find((c) => c.id === quote.clientId);
  const totals = quoteTotals(quote);
  const company = s.settings.company.name;
  return [
    `Sayın ${client?.contactName || client?.name || 'yetkili'},`,
    '',
    `${quote.title ? `"${quote.title}" için ` : ''}${quote.number} numaralı fiyat teklifimizi bilgilerinize sunarız.`,
    `Genel toplam (KDV dahil): ${money(totals.total, quote.currency || s.settings.currency)}`,
    quote.validUntil ? `Geçerlilik: ${fmtDate(quote.validUntil)}` : '',
    '',
    'Teklifin PDF dosyası ektedir.',
    '',
    'Saygılarımızla,',
    company,
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
}
