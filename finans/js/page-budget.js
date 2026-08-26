// page-budget.js — Kategori bazlı aylık bütçe planlama ve takip.

import { el, money, percent, monthLabel, clamp } from './utils.js';
import { store } from './store.js';
import { progressBar, toast, statCard, sectionCard } from './ui.js';

export function renderBudget(root, ctx) {
  const { year, month } = ctx;
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(el('div', { class: 'page-head' }, [
    el('h1', { text: 'Bütçe' }),
    el('span', { class: 'muted', text: monthLabel(year, month) }),
  ]));

  const expCats = store.categoriesByType('expense');
  let totalBudget = 0; let totalSpent = 0;
  for (const c of expCats) {
    const b = store.budgetFor(c.id, year, month);
    if (b) totalBudget += b.amount;
    totalSpent += store.spentInCategory(c.id, year, month);
  }

  wrap.appendChild(el('div', { class: 'stat-grid stat-grid-3' }, [
    statCard({ label: 'Toplam Bütçe', value: money(totalBudget, { compact: true }), tone: 'neutral', icon: '🎯' }),
    statCard({ label: 'Harcanan', value: money(totalSpent, { compact: true }), tone: 'expense', icon: '💸' }),
    statCard({ label: 'Kalan', value: money(totalBudget - totalSpent, { compact: true }), tone: totalBudget - totalSpent >= 0 ? 'income' : 'expense', icon: '💰' }),
  ]));

  const rows = el('div', { class: 'budget-list' });
  for (const c of expCats) {
    const b = store.budgetFor(c.id, year, month);
    const budget = b ? b.amount : 0;
    const spent = store.spentInCategory(c.id, year, month);
    const remaining = budget - spent;
    const over = budget > 0 && spent > budget;

    const input = el('input', {
      class: 'input input-sm budget-input', type: 'number', min: '0', step: '0.01',
      placeholder: 'Bütçe', value: budget || '',
    });
    input.addEventListener('change', () => {
      const v = parseFloat(String(input.value).replace(',', '.')) || 0;
      store.setBudget(c.id, year, month, v);
      toast(`${c.name} bütçesi güncellendi.`);
      ctx.rerender();
    });

    const info = budget > 0
      ? el('div', { class: 'budget-info' }, [
        el('span', { class: over ? 'neg' : 'muted', text: `Harcanan: ${money(spent, { compact: true })} · Kalan: ${money(remaining, { compact: true })}` }),
        over ? el('span', { class: 'over-badge', text: '⚠ Bütçe aşıldı' }) : null,
      ])
      : el('div', { class: 'budget-info muted', text: spent > 0 ? `Harcanan: ${money(spent, { compact: true })} · bütçe belirlenmedi` : 'Bütçe belirlenmedi' });

    rows.appendChild(el('div', { class: 'budget-row' + (over ? ' over' : '') }, [
      el('div', { class: 'budget-cat' }, [
        el('span', { class: 'lr-icon', text: c.icon }),
        el('span', { class: 'lr-name', text: c.name }),
      ]),
      el('div', { class: 'budget-bar' }, [progressBar(spent, budget || spent || 1, { showPct: budget > 0 }), info]),
      el('div', { class: 'budget-set' }, [input]),
    ]));
  }

  wrap.appendChild(sectionCard('Kategori Bütçeleri', rows, {
    action: el('span', { class: 'muted small', text: 'Her kategoriye aylık limit gir' }),
  }));
  root.appendChild(wrap);
}
