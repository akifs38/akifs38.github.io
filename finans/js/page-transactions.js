// page-transactions.js — İşlemler listesi: filtre, arama, düzenle, sil.
// Ayrıca Gelirler ve Giderler sayfaları.

import { el, money, moneySigned, dateShort, timeShort, monthLabel } from './utils.js';
import { store } from './store.js';
import { openModal, confirmDialog, toast, emptyState, statCard } from './ui.js';
import { transactionForm, accountTypeLabel } from './forms.js';

// Filtre durumu (sayfa yenilemeleri arası korunur)
const filterState = { type: 'all', categoryId: 'all', accountId: 'all', scope: 'month', query: '' };

export function renderTransactions(root, ctx) {
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(pageHeader('İşlemler', () => rerender(ctx)));

  if (!store.transactions.length) {
    wrap.appendChild(emptyState({
      icon: '🧾', title: 'Henüz işlem eklemedin.',
      message: 'İlk gelir veya giderini eklemek için aşağıdaki butonu kullan.',
      actionText: '+ Gider Ekle', onAction: () => { location.hash = '#/giderler'; },
    }));
    root.appendChild(wrap);
    return;
  }

  const listHost = el('div', {});
  const filters = buildFilters(ctx, () => renderList(listHost, ctx));
  wrap.append(filters, listHost);
  renderList(listHost, ctx);
  root.appendChild(wrap);
}

function pageHeader(title, onAdd) {
  return el('div', { class: 'page-head' }, [
    el('h1', { text: title }),
  ]);
}

function buildFilters(ctx, onChange) {
  const search = el('input', { class: 'input', type: 'search', placeholder: '🔍 Açıklama veya kategori ara…', value: filterState.query });
  search.addEventListener('input', () => { filterState.query = search.value; onChange(); });

  const scope = mkSelect([
    { value: 'month', label: `Bu ay (${monthLabel(ctx.year, ctx.month)})` },
    { value: 'all', label: 'Tüm zamanlar' },
  ], filterState.scope, (v) => { filterState.scope = v; onChange(); });

  const type = mkSelect([
    { value: 'all', label: 'Tümü (Gelir+Gider)' },
    { value: 'income', label: 'Gelir' },
    { value: 'expense', label: 'Gider' },
  ], filterState.type, (v) => { filterState.type = v; onChange(); });

  const cats = [{ value: 'all', label: 'Tüm kategoriler' }, ...store.categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))];
  const cat = mkSelect(cats, filterState.categoryId, (v) => { filterState.categoryId = v; onChange(); });

  const accs = [{ value: 'all', label: 'Tüm hesaplar' }, ...store.accounts.map((a) => ({ value: a.id, label: a.name }))];
  const acc = mkSelect(accs, filterState.accountId, (v) => { filterState.accountId = v; onChange(); });

  return el('div', { class: 'filters' }, [
    el('div', { class: 'filter-search' }, [search]),
    el('div', { class: 'filter-row' }, [scope, type, cat, acc]),
  ]);
}

function mkSelect(options, value, onChange) {
  const sel = el('select', { class: 'input input-sm' });
  for (const o of options) {
    const opt = el('option', { value: o.value, text: o.label });
    if (o.value === value) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function filteredTx(ctx) {
  let list = store.transactions.slice();
  if (filterState.scope === 'month') {
    list = store.transactionsForMonth(ctx.year, ctx.month);
  }
  if (filterState.type !== 'all') list = list.filter((t) => t.type === filterState.type);
  if (filterState.categoryId !== 'all') list = list.filter((t) => t.categoryId === filterState.categoryId);
  if (filterState.accountId !== 'all') list = list.filter((t) => t.accountId === filterState.accountId);
  const q = filterState.query.trim().toLowerCase();
  if (q) {
    list = list.filter((t) => {
      const cat = store.categoryById(t.categoryId);
      return (t.description || '').toLowerCase().includes(q)
        || (cat && cat.name.toLowerCase().includes(q))
        || (t.note || '').toLowerCase().includes(q);
    });
  }
  return list.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
}

function renderList(host, ctx) {
  host.innerHTML = '';
  const list = filteredTx(ctx);

  // Özet satırı
  const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  host.appendChild(el('div', { class: 'tx-summary' }, [
    el('span', { text: `${list.length} işlem` }),
    el('span', { class: 'pos', text: '+' + money(income, { compact: true }) }),
    el('span', { class: 'neg', text: '−' + money(expense, { compact: true }) }),
  ]));

  if (!list.length) {
    host.appendChild(el('p', { class: 'muted center', text: 'Bu filtreye uygun işlem bulunamadı.' }));
    return;
  }

  // Masaüstü tablo + mobil kart (CSS ile geçiş)
  const table = el('table', { class: 'tx-table' });
  table.appendChild(el('thead', {}, el('tr', {}, [
    el('th', { text: 'Tarih' }), el('th', { text: 'Açıklama' }), el('th', { text: 'Kategori' }),
    el('th', { text: 'Hesap' }), el('th', { text: 'Tür' }), el('th', { class: 'ta-r', text: 'Tutar' }), el('th', { text: '' }),
  ])));
  const tbody = el('tbody', {});
  for (const t of list) {
    const cat = store.categoryById(t.categoryId);
    const acc = store.accountById(t.accountId);
    const tr = el('tr', {}, [
      el('td', { dataset: { label: 'Tarih' }, text: dateShort(t.transactionDate) }),
      el('td', { dataset: { label: 'Açıklama' }, text: t.description || '—' }),
      el('td', { dataset: { label: 'Kategori' }, html: cat ? `<span class="cat-chip">${cat.icon} ${cat.name}</span>` : '—' }),
      el('td', { dataset: { label: 'Hesap' }, text: acc ? acc.name : '—' }),
      el('td', { dataset: { label: 'Tür' }, html: `<span class="type-badge type-${t.type}">${t.type === 'income' ? 'Gelir' : 'Gider'}</span>` }),
      el('td', { dataset: { label: 'Tutar' }, class: 'ta-r ' + (t.type === 'income' ? 'pos' : 'neg'), text: (t.type === 'income' ? '+' : '−') + money(t.amount, { compact: false }) }),
      el('td', { class: 'ta-r tx-actions' }, [
        el('button', { class: 'icon-btn', title: 'Düzenle', html: '✏️', onClick: () => editTx(t, ctx) }),
        el('button', { class: 'icon-btn', title: 'Sil', html: '🗑️', onClick: () => delTx(t, host, ctx) }),
      ]),
    ]);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  host.appendChild(el('div', { class: 'table-wrap' }, [table]));
}

function editTx(t, ctx) {
  const m = openModal({
    title: t.type === 'income' ? 'Geliri Düzenle' : 'Gideri Düzenle',
    body: transactionForm({ mode: t.type === 'income' ? 'income' : 'expense', tx: t, onDone: () => { m.close(); rerender(ctx); } }),
  });
}

function delTx(t, host, ctx) {
  confirmDialog({
    title: 'İşlemi sil',
    message: `"${t.description || (store.categoryById(t.categoryId) || {}).name || 'İşlem'}" (${money(t.amount)}) silinecek. Bu işlem geri alınamaz.`,
    onConfirm: () => { store.deleteTransaction(t.id); toast('İşlem silindi.'); rerender(ctx); },
  });
}

function rerender(ctx) { if (ctx && ctx.rerender) ctx.rerender(); }

// ================= Gelirler & Giderler =================

export function renderIncome(root, ctx) { renderTypePage(root, ctx, 'income'); }
export function renderExpenses(root, ctx) { renderTypePage(root, ctx, 'expense'); }

function renderTypePage(root, ctx, type) {
  const isIncome = type === 'income';
  const title = isIncome ? 'Gelirler' : 'Giderler';
  const wrap = el('div', { class: 'page' });

  const head = el('div', { class: 'page-head' }, [
    el('h1', { text: title }),
    el('button', {
      class: 'btn btn-primary', text: isIncome ? '+ Gelir Ekle' : '+ Gider Ekle',
      onClick: () => openAdd(type, ctx),
    }),
  ]);
  wrap.appendChild(head);

  const monthTx = store.transactionsForMonth(ctx.year, ctx.month).filter((t) => t.type === type);
  const total = monthTx.reduce((s, t) => s + t.amount, 0);

  wrap.appendChild(el('div', { class: 'stat-grid stat-grid-2' }, [
    statCard({ label: isIncome ? 'Bu Ay Toplam Gelir' : 'Bu Ay Toplam Gider', value: money(total, { compact: true }), sub: monthLabel(ctx.year, ctx.month), tone: isIncome ? 'income' : 'expense', icon: isIncome ? '📈' : '📉' }),
    statCard({ label: 'İşlem Sayısı', value: String(monthTx.length), sub: 'Bu ay', tone: 'neutral', icon: '🧾' }),
  ]));

  // Kategori özeti
  if (monthTx.length) {
    const byCat = new Map();
    for (const t of monthTx) {
      const c = store.categoryById(t.categoryId);
      const key = c ? c.id : 'none';
      const cur = byCat.get(key) || { name: c ? c.name : 'Kategorisiz', icon: c ? c.icon : '❓', amount: 0, count: 0 };
      cur.amount += t.amount; cur.count += 1; byCat.set(key, cur);
    }
    const rows = Array.from(byCat.values()).sort((a, b) => b.amount - a.amount).map((c) => el('div', { class: 'list-row' }, [
      el('span', { class: 'lr-icon', text: c.icon }),
      el('span', { class: 'lr-name', text: c.name }),
      el('span', { class: 'lr-count muted', text: `${c.count} işlem` }),
      el('strong', { class: isIncome ? 'pos' : 'neg', text: money(c.amount, { compact: true }) }),
    ]));
    wrap.appendChild(el('section', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('h3', { text: 'Kategoriye Göre' })]),
      el('div', { class: 'list' }, rows),
    ]));
  } else {
    wrap.appendChild(emptyState({
      icon: isIncome ? '💰' : '💸',
      title: isIncome ? 'Bu ay gelir eklemedin.' : 'Bu ay gider eklemedin.',
      message: isIncome ? 'İlk gelirini eklemek için butona dokun.' : 'İlk harcamanı eklemek için butona dokun.',
      actionText: isIncome ? '+ Gelir Ekle' : '+ Gider Ekle',
      onAction: () => openAdd(type, ctx),
    }));
  }

  root.appendChild(wrap);
}

function openAdd(type, ctx) {
  if (!store.accounts.length) {
    toast('Önce bir hesap ekleyin.', 'error');
    location.hash = '#/hesaplar';
    return;
  }
  const m = openModal({
    title: type === 'income' ? 'Gelir Ekle' : 'Gider Ekle',
    body: transactionForm({ mode: type, onDone: () => { m.close(); rerender(ctx); } }),
  });
}
