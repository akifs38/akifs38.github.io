// page-dashboard.js — Ana ekran: özet kartları, finansal denge, harcama gücü,
// yaklaşan ödemeler, finansal sağlık, otomatik özet cümleleri.

import { el, money, moneySigned, percent, dateShort, dateLong, monthName, monthLabel, clamp, nowISO } from './utils.js';
import { store, nextDateOf } from './store.js';
import { statCard, progressBar, sectionCard, donutChart, emptyState } from './ui.js';
import { openQuickAdd } from './app.js';
import { collectAlerts, strongWarnings, monthPaymentSummary, daysText } from './payments.js';

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

  // --- "Bugün" şeridi (Geçmiş + Bugün + Gelecek) ---
  wrap.appendChild(renderTodayStrip(year, month, s));

  // --- Dikkat Gerekenler (uyarılar) ---
  const attention = renderAttention();
  if (attention) wrap.appendChild(attention);

  // --- Özet kartları ---
  const paySum = monthPaymentSummary(year, month);
  const cards = el('div', { class: 'stat-grid' }, [
    statCard({ label: 'Toplam Gelir', value: money(s.income, { compact: true }), sub: 'Bu ay', tone: 'income', icon: '📈' }),
    statCard({ label: 'Toplam Gider', value: money(s.expense, { compact: true }), sub: 'Bu ay', tone: 'expense', icon: '📉' }),
    statCard({ label: 'Planlanan Ödeme', value: money(paySum.planned, { compact: true }), sub: 'Fatura + taksit', tone: 'warn', icon: '📅' }),
    statCard({ label: 'Serbest Bütçe', value: money(s.income - paySum.planned, { compact: true }), sub: 'Gelir − zorunlu', tone: s.income - paySum.planned >= 0 ? 'income' : 'expense', icon: '💰' }),
  ]);
  wrap.appendChild(cards);

  // --- Zorunlu ödeme yükü / Gelir analizi ---
  wrap.appendChild(renderObligationLoad(year, month, s, paySum));

  // --- Finansal denge (progress bar) ---
  wrap.appendChild(renderBalanceSection(year, month, s));

  const grid = el('div', { class: 'dash-grid' });

  // --- Borçlarım ---
  const debtsCard = renderDebts();
  if (debtsCard) grid.appendChild(debtsCard);

  // --- Aylık ödeme özeti ---
  grid.appendChild(renderPaymentSummary(year, month, paySum));

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

  // --- Bu ayın gelir & gider kalemleri (mini döküm) ---
  wrap.appendChild(renderMonthItems(year, month));

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

// --- Bu ayın gelir & gider kalemleri (mini döküm) ---
function renderMonthItems(year, month) {
  const txs = store.transactionsForMonth(year, month).slice().sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  const incomes = txs.filter((t) => t.type === 'income');
  const expenses = txs.filter((t) => t.type === 'expense');

  const miniList = (list, tone) => {
    if (!list.length) return el('p', { class: 'muted small', text: 'Kayıt yok.' });
    return el('div', { class: 'mini-items' }, list.map((t) => {
      const cat = store.categoryById(t.categoryId);
      return el('div', { class: 'mini-item' }, [
        el('span', { class: 'mi-date muted', text: dateShort(t.transactionDate) }),
        el('span', { class: 'mi-name', text: t.description || (cat ? cat.name : '—') }),
        el('span', { class: 'mi-cat muted', text: cat ? cat.icon : '' }),
        el('span', { class: 'mi-amt ' + tone, text: (tone === 'pos' ? '+' : '−') + money(t.amount, { compact: true }) }),
      ]);
    }));
  };

  const body = el('div', { class: 'month-items' }, [
    el('div', { class: 'mi-col' }, [
      el('div', { class: 'mi-head' }, [el('span', { text: '📥 Gelirler' }), el('strong', { class: 'pos', text: '+' + money(incomes.reduce((s, t) => s + t.amount, 0), { compact: true }) })]),
      miniList(incomes, 'pos'),
    ]),
    el('div', { class: 'mi-col' }, [
      el('div', { class: 'mi-head' }, [el('span', { text: '📤 Giderler' }), el('strong', { class: 'neg', text: '−' + money(expenses.reduce((s, t) => s + t.amount, 0), { compact: true }) })]),
      miniList(expenses, 'neg'),
    ]),
  ]);

  const action = el('button', { class: 'btn btn-ghost btn-sm', text: 'Aylık ekstre →', onClick: () => { location.hash = '#/raporlar'; } });
  return sectionCard('Bu Ayın Kalemleri', body, { action });
}

// --- "Bugün" şeridi ---
function renderTodayStrip(year, month, s) {
  const alerts = collectAlerts();
  const paySum = monthPaymentSummary(year, month);
  const nextUp = alerts.upcoming[0] || null;
  const items = [
    todayItem('Bugün', dateLong(nowISO())),
    todayItem('Yaklaşan ödeme', nextUp ? `${nextUp.name} · ${money(nextUp.amount, { compact: true })}` : 'yok', nextUp ? 'warn' : ''),
    todayItem('Geciken', String(alerts.overdue.length), alerts.overdue.length ? 'neg' : 'pos'),
    todayItem('Kalan sabit ödeme', money(paySum.remaining, { compact: true }), paySum.overdue > 0 ? 'neg' : ''),
  ];
  return el('div', { class: 'today-strip' }, items);
}
function todayItem(label, value, tone) {
  return el('div', { class: 'today-item' }, [
    el('span', { class: 'today-label', text: label }),
    el('strong', { class: 'today-value ' + (tone || ''), text: value }),
  ]);
}

// --- Dikkat Gerekenler ---
function renderAttention() {
  const alerts = collectAlerts();
  const strong = strongWarnings();
  if (!alerts.overdue.length && !alerts.upcoming.length && !strong.length) return null;

  const rows = [];
  for (const w of strong) rows.push(el('div', { class: 'attn-row strong', text: w }));
  for (const it of alerts.overdue.slice(0, 4)) {
    rows.push(el('div', { class: 'attn-row overdue' }, [
      el('span', { text: `🔴 ${it.name}` }),
      el('span', { class: 'muted small', text: `${money(it.amount, { compact: true })} · ${daysText(it.days)}` }),
    ]));
  }
  for (const it of alerts.upcoming.slice(0, 4)) {
    rows.push(el('div', { class: 'attn-row upcoming' }, [
      el('span', { text: `🟡 ${it.name}` }),
      el('span', { class: 'muted small', text: `${money(it.amount, { compact: true })} · ${daysText(it.days)}` }),
    ]));
  }
  const action = el('button', { class: 'btn btn-ghost btn-sm', text: 'Ödemelere git →', onClick: () => { location.hash = '#/odemeler'; } });
  return sectionCard('⚠️ Dikkat Gerekenler', el('div', { class: 'attn-list' }, rows), { action });
}

// --- Borçlarım ---
function renderDebts() {
  if (!store.debts.length) return null;
  const active = store.debts.filter((d) => store.debtNextInstallment(d.id));
  const rows = (active.length ? active : store.debts).map((d) => {
    const next = store.debtNextInstallment(d.id);
    const remaining = store.debtRemaining(d.id);
    const left = d.installmentCount - store.debtPaidCount(d.id);
    return el('div', { class: 'debt-mini' }, [
      el('div', { class: 'debt-mini-head' }, [
        el('span', { class: 'lr-name', text: d.name }),
        el('strong', { class: 'neg', text: money(remaining, { compact: true }) }),
      ]),
      el('div', { class: 'debt-mini-sub muted small' }, [
        el('span', { text: `Aylık ${money(d.monthlyPayment, { compact: true })}` }),
        el('span', { text: `${left} taksit kaldı` }),
        el('span', { text: next ? `Sonraki: ${dateShort(next.dueDate)}` : 'Kapandı ✓' }),
      ]),
      progressBar(store.debtPaidCount(d.id), d.installmentCount, {}),
    ]);
  });
  const total = store.debts.reduce((s, d) => s + store.debtRemaining(d.id), 0);
  const action = el('span', { class: 'muted small', text: 'Toplam kalan: ' + money(total, { compact: true }) });
  return sectionCard('Borçlarım', el('div', { class: 'debt-mini-list' }, rows), { action });
}

// --- Aylık ödeme özeti ---
function renderPaymentSummary(year, month, paySum) {
  if (!paySum.count) {
    return sectionCard(`${monthName(month)} Ödemeleri`, el('p', { class: 'muted', text: 'Bu ay için planlı fatura veya taksit yok.' }));
  }
  const body = el('div', { class: 'paysum' }, [
    paysumRow('Toplam planlanan', paySum.planned),
    paysumRow('Ödenen', paySum.paid, 'pos'),
    paysumRow('Kalan', paySum.remaining),
    paysumRow('Geciken', paySum.overdue, paySum.overdue > 0 ? 'neg' : ''),
    paysumRow('Yaklaşan', paySum.upcoming),
    progressBar(paySum.paid, paySum.planned, { showPct: true, color: 'var(--green)' }),
  ]);
  return sectionCard(`${monthName(month)} Ödemeleri`, body);
}
function paysumRow(label, value, tone) {
  return el('div', { class: 'paysum-row' }, [
    el('span', { text: label }),
    el('strong', { class: tone || '', text: money(value, { compact: true }) }),
  ]);
}

// --- Zorunlu ödeme yükü / gelir analizi ---
function renderObligationLoad(year, month, s, paySum) {
  const plan = store.planFor(year, month);
  const income = plan && plan.expectedIncome ? Number(plan.expectedIncome) : (s.income || 0);
  const load = paySum.planned;
  const usable = income - load;
  const pct = income > 0 ? clamp((load / income) * 100, 0, 100) : 0;

  const breakdown = el('div', { class: 'load-breakdown' }, [
    loadLine('Gelir / Maaş', income, 'pos'),
    loadLine('Sabit ödemeler (fatura + taksit)', -load, 'neg'),
    el('div', { class: 'power-result ' + (usable >= 0 ? 'pos' : 'neg') }, [
      el('span', { text: 'Kullanılabilir' }),
      el('strong', { text: money(usable, { compact: true }) }),
    ]),
    el('div', { class: 'load-bar-wrap' }, [
      el('div', { class: 'muted small', text: `Gelirinin %${Math.round(pct)}’i sabit ödemelere gidiyor` }),
      progressBar(load, income || load || 1, { color: pct > 70 ? 'var(--red)' : 'var(--blue)' }),
    ]),
  ]);
  return sectionCard('Aylık Sabit Ödeme Yüküm', breakdown);
}
function loadLine(label, value, tone) {
  return el('div', { class: 'power-line' }, [
    el('span', { text: label }),
    el('span', { class: tone || '', text: (value < 0 ? '− ' : '') + money(Math.abs(value), { compact: true }) }),
  ]);
}

// --- Yardımcılar ---
function totalBudget(year, month) {
  return store.budgets.filter((b) => b.year === year && b.month === month).reduce((s, b) => s + b.amount, 0);
}
function estimateFixed() {
  // Zorunlu yük: aktif faturalar + devam eden borç taksitleri
  return store.monthlyFixedLoad();
}
