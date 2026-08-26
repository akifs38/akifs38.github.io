// page-dashboard.js — Ana ekran: özet kartları, finansal denge, harcama gücü,
// yaklaşan ödemeler, finansal sağlık, otomatik özet cümleleri.

import { el, money, moneySigned, percent, dateShort, monthName, monthLabel, clamp } from './utils.js';
import { store, nextDateOf } from './store.js';
import { statCard, progressBar, sectionCard, donutChart, emptyState } from './ui.js';
import { openQuickAdd } from './app.js';

export function renderDashboard(root, ctx) {
  const { year, month } = ctx;
  const s = store.monthlySummary(year, month);
  const hasAnyData = store.transactions.length > 0 || store.accounts.length > 0;

  const wrap = el('div', { class: 'page page-dashboard' });

  if (!hasAnyData) {
    wrap.appendChild(emptyState({
      icon: '👋',
      title: 'Kişisel Finans Yönetimine hoş geldin!',
      message: 'Başlamak için önce bir hesap ekle, sonra gelir ve giderlerini kaydet. Ya da ayarlardan demo verilerini yükle.',
      actionText: '+ İlk hesabımı ekle',
      onAction: () => { location.hash = '#/hesaplar'; },
    }));
    root.appendChild(wrap);
    return;
  }

  // --- Özet kartları ---
  const cards = el('div', { class: 'stat-grid' }, [
    statCard({ label: 'Toplam Gelir', value: money(s.income, { compact: true }), sub: 'Bu ay', tone: 'income', icon: '📈' }),
    statCard({ label: 'Toplam Gider', value: money(s.expense, { compact: true }), sub: 'Bu ay', tone: 'expense', icon: '📉' }),
    statCard({ label: 'Kalan', value: money(s.remaining, { compact: true }), sub: 'Gelir − Gider', tone: s.remaining >= 0 ? 'income' : 'expense', icon: '💰' }),
    statCard({ label: 'Tasarruf Oranı', value: percent(s.savingsRate), sub: 'Gelirin kalanı', tone: s.savingsRate >= 0 ? 'neutral' : 'expense', icon: '🎯' }),
  ]);
  wrap.appendChild(cards);

  // --- Finansal denge (progress bar) ---
  wrap.appendChild(renderBalanceSection(year, month, s));

  const grid = el('div', { class: 'dash-grid' });

  // --- Bu ay ne kadar harcayabilirim? ---
  grid.appendChild(renderSpendingPower(year, month, s));

  // --- Kategori dağılımı ---
  const byCat = store.expenseByCategory(year, month);
  grid.appendChild(sectionCard('En Çok Nereye Harcadın?',
    byCat.length ? donutChart(byCat.slice(0, 8), { size: 180 })
      : el('p', { class: 'muted', text: 'Bu ay henüz gider yok.' }),
  ));

  // --- Yaklaşan ödemeler ---
  grid.appendChild(renderUpcoming());

  // --- Finansal sağlık ---
  grid.appendChild(renderHealth(year, month, s, byCat));

  wrap.appendChild(grid);

  // --- Finansal özet cümleleri ---
  wrap.appendChild(renderInsights(year, month, s, byCat));

  root.appendChild(wrap);
}

function renderBalanceSection(year, month, s) {
  const plan = store.planFor(year, month);
  const planned = plan ? (Number(plan.fixedExpense || 0) + Number(plan.variableBudget || 0)) : totalBudget(year, month) || s.expense;
  const expected = Math.max(0, planned - s.expense);
  const usable = Math.max(0, s.income - planned);
  const maxRef = Math.max(s.income, planned, s.expense, 1);

  const rows = el('div', { class: 'balance-rows' }, [
    balanceRow('Gelir', s.income, maxRef, 'var(--green)'),
    balanceRow('Planlanan gider', planned, maxRef, 'var(--blue)'),
    balanceRow('Gerçekleşen gider', s.expense, maxRef, 'var(--red)'),
  ]);

  const stats = el('div', { class: 'balance-stats' }, [
    miniStat('Beklenen (kalan) gider', money(expected, { compact: true })),
    miniStat('Kalan kullanılabilir bütçe', money(usable, { compact: true }), usable >= 0 ? 'pos' : 'neg'),
  ]);

  return sectionCard('Finansal Denge — ' + monthLabel(year, month), [rows, stats]);
}

function balanceRow(label, value, max, color) {
  return el('div', { class: 'balance-row' }, [
    el('div', { class: 'balance-row-head' }, [
      el('span', { text: label }),
      el('strong', { text: money(value, { compact: true }) }),
    ]),
    progressBar(value, max, { color }),
  ]);
}

function miniStat(label, value, tone) {
  return el('div', { class: 'mini-stat' + (tone ? ' ' + tone : '') }, [
    el('span', { class: 'mini-stat-label', text: label }),
    el('strong', { class: 'mini-stat-value', text: value }),
  ]);
}

function renderSpendingPower(year, month, s) {
  const plan = store.planFor(year, month);
  const income = plan ? Number(plan.expectedIncome || s.income) : s.income;
  const fixed = plan ? Number(plan.fixedExpense || 0) : estimateFixed();
  const variable = plan ? Number(plan.variableBudget || 0) : (totalBudget(year, month) || 0);
  const savings = plan ? Number(plan.savingsGoal || 0) : (store.data.settings.savingsGoal || 0);
  const usable = income - fixed - variable - savings;

  const body = el('div', { class: 'power-box' }, [
    powerLine('Aylık gelir', income),
    powerLine('Sabit giderler', -fixed),
    powerLine('Planlanan değişken giderler', -variable),
    powerLine('Tasarruf hedefi', -savings),
    el('div', { class: 'power-result' + (usable >= 0 ? ' pos' : ' neg') }, [
      el('span', { text: 'Kullanılabilir' }),
      el('strong', { text: money(usable, { compact: true }) }),
    ]),
  ]);
  return sectionCard('Bu Ay Ne Kadar Harcayabilirim?', body);
}

function powerLine(label, value) {
  return el('div', { class: 'power-line' }, [
    el('span', { text: label }),
    el('span', { class: value < 0 ? 'neg' : '', text: (value < 0 ? '− ' : '') + money(Math.abs(value), { compact: true }) }),
  ]);
}

function renderUpcoming() {
  const items = store.upcomingPayments(5);
  const body = items.length
    ? el('ul', { class: 'upcoming-list' }, items.map((r) => {
      const cat = store.categoryById(r.categoryId);
      return el('li', { class: 'upcoming-item' }, [
        el('span', { class: 'up-icon', text: cat ? cat.icon : (r.type === 'income' ? '💰' : '🧾') }),
        el('div', { class: 'up-info' }, [
          el('span', { class: 'up-name', text: r.description }),
          el('span', { class: 'up-date muted', text: dateShort(r.next.toISOString()) }),
        ]),
        el('strong', { class: r.type === 'income' ? 'pos' : 'neg', text: money(r.amount, { compact: true }) }),
      ]);
    }))
    : el('p', { class: 'muted', text: 'Tanımlı tekrarlayan ödeme yok. Ayarlar → Tekrarlayan Ödemeler’den ekleyebilirsin.' });
  return sectionCard('Yaklaşan Ödemeler', body);
}

function renderHealth(year, month, s, byCat) {
  const incomeExpenseRatio = s.expense > 0 ? s.income / s.expense : (s.income > 0 ? Infinity : 0);
  const budget = totalBudget(year, month);
  const budgetUse = budget > 0 ? (s.expense / budget) * 100 : 0;

  let status = 'Bilinmiyor'; let tone = 'neutral';
  if (s.income > 0) {
    if (s.savingsRate >= 20 && (budget === 0 || budgetUse <= 100)) { status = 'İyi'; tone = 'income'; }
    else if (s.savingsRate >= 0) { status = 'Dengeli'; tone = 'warn'; }
    else { status = 'Dikkat'; tone = 'expense'; }
  }

  const body = el('div', { class: 'health-box' }, [
    el('div', { class: `health-badge tone-${tone}`, text: status }),
    el('div', { class: 'health-metrics' }, [
      healthMetric('Gelir / Gider oranı', incomeExpenseRatio === Infinity ? '∞' : incomeExpenseRatio.toLocaleString('tr-TR', { maximumFractionDigits: 2 })),
      healthMetric('Tasarruf oranı', percent(s.savingsRate)),
      healthMetric('Bütçe kullanımı', budget > 0 ? percent(budgetUse, 0) : '—'),
    ]),
    el('p', { class: 'disclaimer muted', text: 'Bu bir finansal danışmanlık veya yatırım tavsiyesi değildir; yalnızca kendi kayıtlarından oluşan matematiksel bir özettir.' }),
  ]);
  return sectionCard('Finansal Sağlık', body);
}

function healthMetric(label, value) {
  return el('div', { class: 'health-metric' }, [
    el('strong', { text: value }),
    el('span', { class: 'muted', text: label }),
  ]);
}

function renderInsights(year, month, s, byCat) {
  const lines = [];
  if (s.income > 0) {
    const usedPct = Math.round((s.expense / s.income) * 100);
    lines.push(`Bu ay gelirinin %${usedPct}'i harcandı.`);
  }
  // Geçen aya göre en büyük kategori değişimi
  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const prevByCat = store.expenseByCategory(prev.year, prev.month);
  if (byCat.length && prevByCat.length) {
    const top = byCat[0];
    const prevTop = prevByCat.find((c) => c.id === top.id);
    if (prevTop && prevTop.amount > 0) {
      const change = Math.round(((top.amount - prevTop.amount) / prevTop.amount) * 100);
      if (Math.abs(change) >= 5) {
        lines.push(`Geçen aya göre ${top.name.toLowerCase()} harcamaların %${Math.abs(change)} ${change > 0 ? 'arttı' : 'azaldı'}.`);
      }
    }
  }
  const budget = totalBudget(year, month);
  if (budget > 0) {
    const diff = budget - s.expense;
    if (diff >= 0) lines.push(`Bu ay bütçenin ${money(diff, { compact: true })} altında kaldın.`);
    else lines.push(`Bu ay bütçeyi ${money(-diff, { compact: true })} aştın.`);
  }
  if (s.remaining > 0) lines.push(`Bu ay ${money(s.remaining, { compact: true })} tasarruf edebilirsin.`);

  if (!lines.length) return el('div');
  const body = el('ul', { class: 'insight-list' }, lines.map((t) => el('li', { class: 'insight-item' }, [
    el('span', { class: 'insight-dot', text: '💡' }),
    el('span', { text: t }),
  ])));
  return sectionCard('Finansal Özet', body);
}

// --- Yardımcılar ---
function totalBudget(year, month) {
  return store.budgets.filter((b) => b.year === year && b.month === month).reduce((s, b) => s + b.amount, 0);
}
function estimateFixed() {
  return store.recurring.filter((r) => r.active && r.type === 'expense').reduce((s, r) => s + r.amount, 0);
}
