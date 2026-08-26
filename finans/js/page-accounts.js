// page-accounts.js — Hesaplar/Bankalar: manuel hesap ekle, bakiye otomatik hesaplanır.

import { el, money, monthLabel } from './utils.js';
import { store } from './store.js';
import { openModal, confirmDialog, toast, emptyState, statCard } from './ui.js';
import { accountForm, accountTypeLabel } from './forms.js';

const TYPE_ICON = { bank: '🏦', cash: '💵', credit_card: '💳', other: '📁' };

export function renderAccounts(root, ctx) {
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(el('div', { class: 'page-head' }, [
    el('h1', { text: 'Hesaplar' }),
    el('button', { class: 'btn btn-primary', text: '+ Hesap Ekle', onClick: () => openAdd(ctx) }),
  ]));

  if (!store.accounts.length) {
    wrap.appendChild(emptyState({
      icon: '🏦', title: 'Henüz hesap eklemedin.',
      message: 'Banka, nakit veya kredi kartı hesabı ekleyerek başla. Bu uygulama hiçbir bankaya bağlanmaz; hesaplar yalnızca kaynağı belirtir.',
      actionText: '+ İlk hesabımı ekle', onAction: () => openAdd(ctx),
    }));
    root.appendChild(wrap);
    return;
  }

  // Toplam varlık / borç
  let assets = 0; let debts = 0;
  for (const a of store.accounts) {
    const bal = store.accountBalance(a.id);
    if (bal >= 0) assets += bal; else debts += bal;
  }
  wrap.appendChild(el('div', { class: 'stat-grid stat-grid-3' }, [
    statCard({ label: 'Toplam Varlık', value: money(assets, { compact: true }), tone: 'income', icon: '💰' }),
    statCard({ label: 'Toplam Borç', value: money(Math.abs(debts), { compact: true }), tone: 'expense', icon: '💳' }),
    statCard({ label: 'Net Durum', value: money(assets + debts, { compact: true }), tone: assets + debts >= 0 ? 'income' : 'expense', icon: '📊' }),
  ]));

  const grid = el('div', { class: 'account-grid' });
  for (const a of store.accounts) {
    const bal = store.accountBalance(a.id);
    const isCredit = a.type === 'credit_card';
    grid.appendChild(el('div', { class: 'account-card' }, [
      el('div', { class: 'acc-top' }, [
        el('span', { class: 'acc-icon', text: TYPE_ICON[a.type] || '📁' }),
        el('div', { class: 'acc-actions' }, [
          el('button', { class: 'icon-btn', title: 'Düzenle', html: '✏️', onClick: () => openEdit(a, ctx) }),
          el('button', { class: 'icon-btn', title: 'Sil', html: '🗑️', onClick: () => del(a, ctx) }),
        ]),
      ]),
      el('div', { class: 'acc-name', text: a.name }),
      el('div', { class: 'acc-type muted', text: accountTypeLabel(a.type) }),
      el('div', { class: 'acc-balance ' + (bal >= 0 ? 'pos' : 'neg') }, [
        el('span', { class: 'muted small', text: isCredit && bal < 0 ? 'Borç' : 'Bakiye' }),
        el('strong', { text: money(Math.abs(bal)) }),
      ]),
    ]));
  }
  wrap.appendChild(grid);
  root.appendChild(wrap);
}

function openAdd(ctx) {
  const m = openModal({ title: 'Hesap Ekle', body: accountForm({ onDone: () => { m.close(); ctx.rerender(); } }) });
}
function openEdit(a, ctx) {
  const m = openModal({ title: 'Hesabı Düzenle', body: accountForm({ account: a, onDone: () => { m.close(); ctx.rerender(); } }) });
}
function del(a, ctx) {
  const count = store.transactions.filter((t) => t.accountId === a.id).length;
  confirmDialog({
    title: 'Hesabı sil',
    message: `"${a.name}" hesabı${count ? ` ve bu hesaba ait ${count} işlem` : ''} silinecek. Bu işlem geri alınamaz.`,
    onConfirm: () => { store.deleteAccount(a.id); toast('Hesap silindi.'); ctx.rerender(); },
  });
}
