// page-reports.js — Raporlar: aylık ekstre (kalem kalem), gelir/gider bar,
// kategori donut, aylık trend.

import { el, money, moneySigned, percent, dateShort, dateLong, monthName, monthLabel, nowISO } from './utils.js';
import { store } from './store.js';
import { barChart, donutChart, trendChart, sectionCard, emptyState } from './ui.js';

export function renderReports(root, ctx) {
  const { year, month } = ctx;
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(el('div', { class: 'page-head' }, [el('h1', { text: 'Raporlar' })]));

  if (!store.transactions.length) {
    wrap.appendChild(emptyState({ icon: '📊', title: 'Rapor için veri yok.', message: 'Birkaç işlem ekledikçe grafikler ve ekstre burada oluşacak.' }));
    root.appendChild(wrap);
    return;
  }

  const s = store.monthlySummary(year, month);

  // Aylık ekstre (kalem kalem, yazdırılabilir)
  wrap.appendChild(buildStatement(year, month, s));

  // Aylık gelir/gider/kalan bar
  wrap.appendChild(sectionCard(`Aylık Gelir / Gider — ${monthLabel(year, month)}`, barChart([
    { label: 'Gelir', value: s.income, color: 'var(--green)' },
    { label: 'Gider', value: s.expense, color: 'var(--red)' },
    { label: 'Kalan', value: s.remaining, color: 'var(--blue)' },
  ])));

  // Kategori donut
  const byCat = store.expenseByCategory(year, month);
  wrap.appendChild(sectionCard('Kategori Bazlı Harcama',
    byCat.length ? donutChart(byCat, { size: 200 }) : el('p', { class: 'muted', text: 'Bu ay gider yok.' })));

  // Son 6 ay trend
  const points = [];
  for (let i = 5; i >= 0; i--) {
    let y = year; let m = month - i;
    while (m < 0) { m += 12; y -= 1; }
    const sum = store.monthlySummary(y, m);
    points.push({ label: monthName(m).slice(0, 3), value: sum.expense });
  }
  wrap.appendChild(sectionCard('Aylık Harcama Trendi (Son 6 Ay)', trendChart(points, { color: 'var(--red)' })));

  // Gelir vs gider trend (son 6 ay, iki bar seti basitçe)
  const incPoints = [];
  for (let i = 5; i >= 0; i--) {
    let y = year; let m = month - i;
    while (m < 0) { m += 12; y -= 1; }
    const sum = store.monthlySummary(y, m);
    incPoints.push({ label: monthName(m).slice(0, 3), value: sum.income });
  }
  wrap.appendChild(sectionCard('Aylık Gelir Trendi (Son 6 Ay)', trendChart(incPoints, { color: 'var(--green)' })));

  root.appendChild(wrap);
}

// Aylık ekstre: tüm gelir ve giderler tek bir rapor halinde (kalem kalem)
function buildStatement(year, month, s) {
  const txs = store.transactionsForMonth(year, month).slice().sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
  const incomes = txs.filter((t) => t.type === 'income');
  const expenses = txs.filter((t) => t.type === 'expense');

  const rowsOf = (list, tone) => list.map((t) => {
    const cat = store.categoryById(t.categoryId);
    const acc = store.accountById(t.accountId);
    return el('tr', {}, [
      el('td', { text: dateShort(t.transactionDate) }),
      el('td', { text: t.description || (cat ? cat.name : '—') }),
      el('td', { text: cat ? `${cat.icon} ${cat.name}` : '—' }),
      el('td', { text: acc ? acc.name : '—' }),
      el('td', { class: 'ta-r ' + tone, text: (tone === 'pos' ? '+' : '−') + money(t.amount) }),
    ]);
  });

  const table = (title, list, tone, total) => el('div', { class: 'stmt-block' }, [
    el('div', { class: 'stmt-block-head' }, [el('h4', { text: title }), el('strong', { class: tone, text: (tone === 'pos' ? '+' : '−') + money(total) })]),
    list.length
      ? el('div', { class: 'table-wrap' }, [el('table', { class: 'stmt-table' }, [
        el('thead', {}, el('tr', {}, [el('th', { text: 'Tarih' }), el('th', { text: 'Açıklama' }), el('th', { text: 'Kategori' }), el('th', { text: 'Hesap' }), el('th', { class: 'ta-r', text: 'Tutar' })])),
        el('tbody', {}, rowsOf(list, tone)),
      ])])
      : el('p', { class: 'muted small', text: 'Bu ay kayıt yok.' }),
  ]);

  const statement = el('div', { id: 'print-root', class: 'statement' }, [
    el('div', { class: 'stmt-header' }, [
      el('div', {}, [
        el('h2', { text: 'Aylık Gelir-Gider Ekstresi' }),
        el('div', { class: 'muted', text: monthLabel(year, month) }),
      ]),
      el('div', { class: 'stmt-meta muted small' }, [
        el('div', { text: store.user ? store.user.name : '' }),
        el('div', { text: 'Oluşturma: ' + dateLong(nowISO()) }),
      ]),
    ]),
    table('Gelirler', incomes, 'pos', s.income),
    table('Giderler', expenses, 'neg', s.expense),
    el('div', { class: 'stmt-summary' }, [
      sumRow('Toplam Gelir', '+' + money(s.income), 'pos'),
      sumRow('Toplam Gider', '−' + money(s.expense), 'neg'),
      sumRow('Kalan (Net)', money(s.remaining), s.remaining >= 0 ? 'pos' : 'neg', true),
      sumRow('Tasarruf Oranı', percent(s.savingsRate), ''),
    ]),
  ]);

  const printBtn = el('button', { class: 'btn btn-primary btn-sm no-print', text: '🖨️ Yazdır / PDF olarak kaydet', onClick: () => window.print() });
  return sectionCard('Aylık Ekstre', statement, { action: printBtn });
}

function sumRow(label, value, tone, big) {
  return el('div', { class: 'stmt-sum-row' + (big ? ' big' : '') }, [
    el('span', { text: label }),
    el('strong', { class: tone || '', text: value }),
  ]);
}
