// page-reports.js — Raporlar: aylık gelir/gider bar, kategori donut, aylık trend.

import { el, money, monthName, monthLabel } from './utils.js';
import { store } from './store.js';
import { barChart, donutChart, trendChart, sectionCard, emptyState } from './ui.js';

export function renderReports(root, ctx) {
  const { year, month } = ctx;
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(el('div', { class: 'page-head' }, [el('h1', { text: 'Raporlar' })]));

  if (!store.transactions.length) {
    wrap.appendChild(emptyState({ icon: '📊', title: 'Rapor için veri yok.', message: 'Birkaç işlem ekledikçe grafikler burada oluşacak.' }));
    root.appendChild(wrap);
    return;
  }

  const s = store.monthlySummary(year, month);

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
