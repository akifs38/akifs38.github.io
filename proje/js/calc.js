// calc.js — Saf hesaplar (DOM yok, Node'da da test edilir): teklif toplamları, proje maliyeti ve kârı,
// ekip iş yükü, görev atama önerisi, numaralandırma.

import { round2, today, daysBetween } from './util.js';

export const PROJECT_STATUS = {
  teklif: 'Teklif aşamasında',
  planlandi: 'Planlandı',
  devam: 'Devam ediyor',
  beklemede: 'Beklemede',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
};
export const ACTIVE_PROJECT = new Set(['planlandi', 'devam', 'beklemede']);

export const TASK_STATUS = { todo: 'Yapılacak', doing: 'Devam ediyor', review: 'Kontrolde', done: 'Tamamlandı' };
export const PRIORITY = { low: 'Düşük', normal: 'Normal', high: 'Yüksek', urgent: 'Acil' };
export const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export const QUOTE_STATUS = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  accepted: 'Kabul edildi',
  rejected: 'Reddedildi',
  expired: 'Süresi doldu',
};

export const EXPENSE_CATEGORIES = ['Malzeme', 'Ulaşım', 'Konaklama', 'Kiralama', 'Taşeron', 'Yazılım / lisans', 'Yemek', 'Diğer'];
export const UNITS = ['adet', 'saat', 'gün', 'ay', 'paket', 'hizmet', 'm²', 'metre', 'kg'];
export const VAT_RATES = [0, 1, 10, 20];

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Teklif satırının tutarları (genel iskonto öncesi). */
export function lineAmounts(item) {
  const gross = round2(n(item.qty) * n(item.unitPrice));
  const discount = round2(gross * Math.min(Math.max(n(item.discount), 0), 100) / 100);
  return { gross, discount, net: round2(gross - discount) };
}

/**
 * Teklif toplamları: satır iskontoları, genel iskonto, KDV oranlarına göre matrah ve KDV, genel toplam.
 * KDV genel iskontodan sonra hesaplanır.
 */
export function quoteTotals(quote) {
  const items = quote.items ?? [];
  const lines = items.map(lineAmounts);
  const grossTotal = round2(lines.reduce((s, l) => s + l.gross, 0));
  const lineDiscount = round2(lines.reduce((s, l) => s + l.discount, 0));
  const subtotal = round2(lines.reduce((s, l) => s + l.net, 0));
  const gd = Math.min(Math.max(n(quote.generalDiscount), 0), 100);
  const generalDiscount = round2(subtotal * gd / 100);
  const groups = new Map();
  items.forEach((item, i) => {
    const rate = n(item.vatRate);
    groups.set(rate, (groups.get(rate) ?? 0) + lines[i].net * (1 - gd / 100));
  });
  const vatGroups = [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({ rate, base: round2(base), vat: round2(base * rate / 100) }));
  const taxBase = round2(subtotal - generalDiscount);
  const vatTotal = round2(vatGroups.reduce((s, g) => s + g.vat, 0));
  return { lines, grossTotal, lineDiscount, subtotal, generalDiscount, taxBase, vatGroups, vatTotal, total: round2(taxBase + vatTotal) };
}

/** Gönderilmiş ama geçerlilik tarihi geçmiş teklif "süresi doldu" sayılır. */
export function quoteStatus(quote, todayIso = today()) {
  if (quote.status === 'sent' && quote.validUntil && quote.validUntil < todayIso) return 'expired';
  return quote.status ?? 'draft';
}

export const isOverdue = (task, todayIso = today()) => task.status !== 'done' && !!task.dueDate && task.dueDate < todayIso;

export const tasksOf = (state, projectId) => state.tasks.filter((t) => t.projectId === projectId);

/** Görevin şimdiye kadar girilen çalışma saati. */
export const loggedHours = (state, taskId) =>
  round2(state.timeEntries.filter((e) => e.taskId === taskId).reduce((s, e) => s + n(e.hours), 0));

/** İlerleme: tahmini saat girilmişse saat ağırlıklı, yoksa görev sayısına göre. */
export function projectProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const hours = tasks.reduce((s, t) => s + n(t.estimateHours), 0);
  const doneHours = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + n(t.estimateHours), 0);
  const pct = total === 0 ? 0 : hours > 0 ? (doneHours / hours) * 100 : (done / total) * 100;
  return { total, done, pct: Math.round(pct) };
}

function averageCostRate(members) {
  const rates = members.map((m) => n(m.costRate)).filter((r) => r > 0);
  return rates.length ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
}

/**
 * Proje finansı (tümü KDV hariç):
 * - planlanan işçilik: görevlerin tahmini saati × atanan kişinin saatlik maliyeti (atanmamışsa ekip ortalaması)
 * - gerçekleşen işçilik: girilen çalışma saati × kayıt anındaki saatlik maliyet
 * - giderler, gelir (kabul edilen teklifler; yoksa proje bütçesi), kâr ve kâr marjı
 */
export function projectFinance(state, projectId) {
  const project = state.projects.find((p) => p.id === projectId);
  const members = new Map(state.members.map((m) => [m.id, m]));
  const team = (project?.memberIds ?? []).map((id) => members.get(id)).filter(Boolean);
  const fallbackRate = averageCostRate(team.length ? team : state.members.filter((m) => m.active !== false));
  const tasks = tasksOf(state, projectId);

  const estimateHours = round2(tasks.reduce((s, t) => s + n(t.estimateHours), 0));
  const plannedLabor = round2(tasks.reduce((s, t) => {
    const rate = t.assigneeId && members.has(t.assigneeId) ? n(members.get(t.assigneeId).costRate) : fallbackRate;
    return s + n(t.estimateHours) * rate;
  }, 0));

  const entries = state.timeEntries.filter((e) => e.projectId === projectId);
  const actualHours = round2(entries.reduce((s, e) => s + n(e.hours), 0));
  const actualLabor = round2(entries.reduce((s, e) => {
    const rate = e.costRate != null ? n(e.costRate) : n(members.get(e.memberId)?.costRate);
    return s + n(e.hours) * rate;
  }, 0));

  const expenses = round2(state.expenses.filter((x) => x.projectId === projectId).reduce((s, x) => s + n(x.amount), 0));

  const accepted = state.quotes.filter((q) => q.projectId === projectId && q.status === 'accepted');
  const quotedRevenue = round2(accepted.reduce((s, q) => s + quoteTotals(q).taxBase, 0));
  const revenue = accepted.length ? quotedRevenue : round2(n(project?.budget));

  const plannedCost = round2(plannedLabor + expenses);
  const actualCost = round2(actualLabor + expenses);
  const profit = round2(revenue - actualCost);
  return {
    estimateHours,
    plannedLabor,
    actualHours,
    actualLabor,
    expenses,
    plannedCost,
    actualCost,
    revenue,
    revenueSource: accepted.length ? 'teklif' : 'bütçe',
    profit,
    plannedProfit: round2(revenue - plannedCost),
    margin: revenue > 0 ? round2((profit / revenue) * 100) : null,
    budgetUse: revenue > 0 ? round2((actualCost / revenue) * 100) : null,
  };
}

/**
 * Kişinin iş yükü: açık görevleri, kalan saat (tahmin − girilen), geciken görevler ve haftalık kapasiteye oranı.
 */
export function memberLoad(state, memberId, todayIso = today()) {
  const member = state.members.find((m) => m.id === memberId);
  const open = state.tasks.filter((t) => t.assigneeId === memberId && t.status !== 'done');
  const openHours = round2(open.reduce((s, t) => s + Math.max(0, n(t.estimateHours) - loggedHours(state, t.id)), 0));
  const capacity = n(member?.weeklyCapacity) > 0 ? n(member.weeklyCapacity) : 40;
  const weekStart = startOfWeek(todayIso);
  const weekHours = round2(state.timeEntries
    .filter((e) => e.memberId === memberId && e.date >= weekStart && e.date <= todayIso)
    .reduce((s, e) => s + n(e.hours), 0));
  return {
    openTasks: open.length,
    openHours,
    overdue: open.filter((t) => isOverdue(t, todayIso)).length,
    capacity,
    utilization: Math.round((openHours / capacity) * 100),
    weekHours,
  };
}

/** Pazartesi başlangıçlı hafta. */
export function startOfWeek(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const shift = (date.getDay() + 6) % 7;
  return today(new Date(y, m - 1, d - shift));
}

/**
 * Atama önerisi: projenin ekibinden (ekip yoksa tüm aktif çalışanlardan) kapasitesine göre en boş kişi.
 * İstenirse role göre süzülür (rol eşleşen yoksa süzülmez).
 */
export function suggestAssignee(state, { projectId, role } = {}, todayIso = today()) {
  const project = state.projects.find((p) => p.id === projectId);
  const active = state.members.filter((m) => m.active !== false);
  let pool = project?.memberIds?.length ? active.filter((m) => project.memberIds.includes(m.id)) : active;
  if (role) {
    const byRole = pool.filter((m) => String(m.role ?? '').toLocaleLowerCase('tr-TR') === String(role).toLocaleLowerCase('tr-TR'));
    if (byRole.length) pool = byRole;
  }
  if (!pool.length) return null;
  const scored = pool.map((m) => ({ m, load: memberLoad(state, m.id, todayIso) }));
  scored.sort((a, b) =>
    a.load.openHours / a.load.capacity - b.load.openHours / b.load.capacity
    || a.load.openTasks - b.load.openTasks
    || String(a.m.name).localeCompare(String(b.m.name), 'tr'));
  return scored[0].m;
}

/**
 * Maliyetten teklif satırları: görevlerin tahmini saatleri role göre gruplanır (satış ücreti varsa o, yoksa
 * maliyet × (1 + kâr payı)), giderler kategoriye göre kâr payıyla eklenir.
 */
export function quoteLinesFromProject(state, projectId, marginPct, vatRate) {
  const margin = 1 + n(marginPct) / 100;
  const members = new Map(state.members.map((m) => [m.id, m]));
  const project = state.projects.find((p) => p.id === projectId);
  const team = (project?.memberIds ?? []).map((id) => members.get(id)).filter(Boolean);
  const fallbackRate = averageCostRate(team.length ? team : state.members);
  const roles = new Map();
  for (const t of tasksOf(state, projectId)) {
    const hours = n(t.estimateHours);
    if (hours <= 0) continue;
    const m = members.get(t.assigneeId);
    const role = m?.role?.trim() || 'Genel işçilik';
    const rate = m ? (n(m.billRate) > 0 ? n(m.billRate) : n(m.costRate) * margin) : fallbackRate * margin;
    const g = roles.get(role) ?? { hours: 0, amount: 0 };
    g.hours += hours;
    g.amount += hours * rate;
    roles.set(role, g);
  }
  const lines = [...roles.entries()].map(([role, g]) => ({
    description: `${role} hizmeti`,
    qty: round2(g.hours),
    unit: 'saat',
    unitPrice: round2(g.amount / g.hours),
    discount: 0,
    vatRate,
  }));
  const categories = new Map();
  for (const x of state.expenses.filter((e) => e.projectId === projectId)) {
    categories.set(x.category || 'Diğer', (categories.get(x.category || 'Diğer') ?? 0) + n(x.amount));
  }
  for (const [category, amount] of categories) {
    lines.push({ description: `${category} giderleri`, qty: 1, unit: 'hizmet', unitPrice: round2(amount * margin), discount: 0, vatRate });
  }
  return lines;
}

/** "TKF-2026-0007": yıl içindeki en büyük numaranın bir fazlası (yedekten yüklenen veriyle de tutarlı). */
export function nextQuoteNumber(state, dateIso = today()) {
  const prefix = (state.settings.quotePrefix || 'TKF').trim();
  const year = dateIso.slice(0, 4);
  const safe = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + safe + '-' + year + '-(\\d+)$');
  const max = state.quotes.reduce((mx, q) => {
    const m = re.exec(q.number ?? '');
    return m ? Math.max(mx, Number(m[1])) : mx;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
}

export function nextProjectCode(state) {
  const max = state.projects.reduce((mx, p) => {
    const m = /^PRJ-(\d+)$/.exec(p.code ?? '');
    return m ? Math.max(mx, Number(m[1])) : mx;
  }, 0);
  return `PRJ-${String(max + 1).padStart(4, '0')}`;
}

/** Teslim tarihine kalan gün (negatif: gecikti). */
export const daysLeft = (dueIso, todayIso = today()) => (dueIso ? daysBetween(todayIso, dueIso) : null);
