// page-payments.js — Ödemeler: Uyarılar merkezi, Faturalar, Borçlar (taksitler), Takvim.

import { el, money, dateShort, dateLong, monthName, monthLabel, monthName as mn } from './utils.js';
import { store } from './store.js';
import { openModal, confirmDialog, toast, emptyState, statCard, sectionCard, progressBar } from './ui.js';
import { debtForm, billForm, debtTypeLabel } from './forms.js';
import { billStatus, installmentDisplayStatus, monthObligations, monthPaymentSummary, collectAlerts, daysText } from './payments.js';

let activeTab = 'alerts';
const TABS = [
  { id: 'alerts', label: '🔔 Uyarılar' },
  { id: 'bills', label: '🧾 Faturalar' },
  { id: 'debts', label: '💳 Borçlar' },
  { id: 'calendar', label: '📅 Takvim' },
];

const STATE_LABEL = {
  paid: 'Ödendi', pending: 'Bekliyor', upcoming: 'Yaklaşıyor',
  'due-today': 'Bugün son gün', overdue: 'Gecikti', 'overdue-strong': 'Gecikti',
};
const STATE_CLASS = {
  paid: 'st-paid', pending: 'st-pending', upcoming: 'st-upcoming',
  'due-today': 'st-due', overdue: 'st-overdue', 'overdue-strong': 'st-overdue',
};

export function renderPayments(root, ctx) {
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(el('div', { class: 'page-head' }, [el('h1', { text: 'Ödemeler' })]));

  const tabbar = el('div', { class: 'tabbar' });
  for (const t of TABS) {
    tabbar.appendChild(el('button', {
      class: 'tab' + (t.id === activeTab ? ' active' : ''), text: t.label,
      onClick: () => { activeTab = t.id; ctx.rerender(); },
    }));
  }
  wrap.appendChild(tabbar);

  const host = el('div', { class: 'tab-content' });
  wrap.appendChild(host);

  if (activeTab === 'alerts') renderAlerts(host, ctx);
  else if (activeTab === 'bills') renderBills(host, ctx);
  else if (activeTab === 'debts') renderDebts(host, ctx);
  else renderCalendar(host, ctx);

  root.appendChild(wrap);
}

// ---------------- UYARILAR ----------------
function renderAlerts(host, ctx) {
  const a = collectAlerts();
  if (!store.bills.length && !store.debts.length) {
    host.appendChild(emptyState({
      icon: '🔔', title: 'Takip edilen ödeme yok.',
      message: 'Fatura veya taksitli borç ekleyince yaklaşan ve geciken ödemeler burada görünür.',
      actionText: '+ Fatura Ekle', onAction: () => openBill(ctx),
    }));
    return;
  }

  host.appendChild(alertGroup('🔴 Geciken', a.overdue, ctx, 'overdue'));
  host.appendChild(alertGroup('🟡 Yaklaşan', a.upcoming, ctx, 'upcoming'));
  host.appendChild(alertGroup('🟢 Bu Ay Ödenen', a.paid, ctx, 'paid'));
}

function alertGroup(title, items, ctx, kind) {
  const body = items.length
    ? el('div', { class: 'list' }, items.map((it) => alertRow(it, ctx, kind)))
    : el('p', { class: 'muted', text: kind === 'overdue' ? 'Geciken ödeme yok. 👍' : kind === 'upcoming' ? 'Yaklaşan ödeme yok.' : 'Bu ay henüz ödenen yok.' });
  return sectionCard(title, body);
}

function alertRow(it, ctx, kind) {
  const badge = kind === 'paid'
    ? el('span', { class: 'st-badge st-paid', text: 'Ödendi' })
    : el('span', { class: 'muted small', text: daysText(it.days) });
  const payBtn = kind !== 'paid'
    ? el('button', { class: 'btn btn-primary btn-sm', text: 'Ödendi işaretle', onClick: () => payItem(it, ctx) })
    : null;
  return el('div', { class: 'list-row alert-row ' + (kind === 'overdue' ? 'row-overdue' : '') }, [
    el('span', { class: 'lr-icon', text: it.kind === 'installment' ? '💳' : '🧾' }),
    el('div', { class: 'lr-main' }, [
      el('span', { class: 'lr-name', text: it.name }),
      el('span', { class: 'muted small', text: `${dateShort(it.due.toISOString())} · ${money(it.amount, { compact: true })}` }),
    ]),
    badge,
    payBtn,
  ]);
}

function payItem(it, ctx) {
  if (it.kind === 'installment') {
    store.payInstallment(it.instId || it.id);
  } else {
    const d = it.due; store.payBill(it.refId, d.getFullYear(), d.getMonth());
  }
  toast('Ödeme kaydedildi ve gider oluşturuldu.');
  ctx.rerender();
}

// ---------------- FATURALAR ----------------
function renderBills(host, ctx) {
  const head = el('div', { class: 'sub-head' }, [
    el('span', { class: 'muted', text: monthLabel(ctx.year, ctx.month) + ' durumu' }),
    el('button', { class: 'btn btn-primary btn-sm', text: '+ Fatura / Ödeme Ekle', onClick: () => openBill(ctx) }),
  ]);
  host.appendChild(head);

  if (!store.bills.length) {
    host.appendChild(emptyState({ icon: '🧾', title: 'Henüz düzenli ödeme eklemedin.', message: 'Elektrik, su, internet gibi faturaları ekleyerek durumlarını takip et.', actionText: '+ Fatura Ekle', onAction: () => openBill(ctx) }));
    return;
  }

  const list = el('div', { class: 'list' });
  for (const bill of store.bills) {
    const st = billStatus(bill, ctx.year, ctx.month);
    const cat = bill.categoryId ? store.categoryById(bill.categoryId) : null;
    const acc = store.accountById(bill.accountId);
    const isPaid = st.state === 'paid';
    list.appendChild(el('div', { class: 'bill-card ' + (STATE_CLASS[st.state] || '') }, [
      el('div', { class: 'bill-main' }, [
        el('span', { class: 'lr-icon', text: cat ? cat.icon : '🧾' }),
        el('div', { class: 'lr-main' }, [
          el('span', { class: 'lr-name', text: bill.name }),
          el('span', { class: 'muted small', text: `Her ayın ${bill.paymentDay}. günü · ${acc ? acc.name : ''}` }),
        ]),
        el('div', { class: 'bill-amt' }, [
          el('strong', { text: money(bill.amount, { compact: true }) }),
          el('span', { class: 'st-badge ' + (STATE_CLASS[st.state] || ''), text: STATE_LABEL[st.state] + (st.state !== 'paid' && st.state !== 'pending' ? ` · ${daysText(st.days)}` : '') }),
        ]),
      ]),
      el('div', { class: 'bill-actions' }, [
        isPaid
          ? el('button', { class: 'btn btn-ghost btn-sm', text: '↩ Geri al', onClick: () => { store.unpayBill(bill.id, ctx.year, ctx.month); toast('Ödeme geri alındı.'); ctx.rerender(); } })
          : el('button', { class: 'btn btn-primary btn-sm', text: 'Ödendi işaretle', onClick: () => { store.payBill(bill.id, ctx.year, ctx.month); toast('Ödeme kaydedildi.'); ctx.rerender(); } }),
        el('button', { class: 'icon-btn', title: 'Düzenle', html: '✏️', onClick: () => openBill(ctx, bill) }),
        el('button', { class: 'icon-btn', title: 'Sil', html: '🗑️', onClick: () => confirmDialog({ title: 'Ödemeyi sil', message: `"${bill.name}" ve ilişkili ödeme işlemleri silinecek.`, onConfirm: () => { store.deleteBill(bill.id); toast('Silindi.'); ctx.rerender(); } }) }),
      ]),
    ]));
  }
  host.appendChild(list);
}

function openBill(ctx, bill = null) {
  if (!store.accounts.length) { toast('Önce bir hesap ekleyin.', 'error'); location.hash = '#/hesaplar'; return; }
  const m = openModal({ title: bill ? 'Ödemeyi Düzenle' : 'Fatura / Düzenli Ödeme Ekle', body: billForm({ bill, onDone: () => { m.close(); ctx.rerender(); } }) });
}

// ---------------- BORÇLAR ----------------
function renderDebts(host, ctx) {
  const head = el('div', { class: 'sub-head' }, [
    el('span', { class: 'muted', text: 'Taksitli borçlar ve ödemeler' }),
    el('button', { class: 'btn btn-primary btn-sm', text: '+ Borç / Taksit Ekle', onClick: () => openDebt(ctx) }),
  ]);
  host.appendChild(head);

  if (!store.debts.length) {
    host.appendChild(emptyState({ icon: '💳', title: 'Henüz borç eklemedin.', message: 'Kredi, telefon veya eşya taksitlerini ekleyerek kalan borcunu ve taksitlerini takip et.', actionText: '+ Borç Ekle', onAction: () => openDebt(ctx) }));
    return;
  }

  // Özet
  const totalRemaining = store.debts.reduce((s, d) => s + store.debtRemaining(d.id), 0);
  const totalMonthly = store.debts.filter((d) => store.debtNextInstallment(d.id)).reduce((s, d) => s + d.monthlyPayment, 0);
  host.appendChild(el('div', { class: 'stat-grid stat-grid-2' }, [
    statCard({ label: 'Toplam Kalan Borç', value: money(totalRemaining, { compact: true }), tone: 'expense', icon: '💳' }),
    statCard({ label: 'Aylık Taksit Yükü', value: money(totalMonthly, { compact: true }), tone: 'neutral', icon: '📅' }),
  ]));

  for (const d of store.debts) host.appendChild(debtCard(d, ctx));
}

function debtCard(d, ctx) {
  const insts = store.installmentsOf(d.id);
  const paidCount = store.debtPaidCount(d.id);
  const remaining = store.debtRemaining(d.id);
  const next = store.debtNextInstallment(d.id);
  const closed = d.status === 'closed' || !next;

  const card = el('section', { class: 'card debt-card' });
  card.appendChild(el('div', { class: 'card-head' }, [
    el('div', {}, [
      el('h3', { text: d.name }),
      el('span', { class: 'muted small', text: debtTypeLabel(d.type) + (closed ? ' · Kapandı ✓' : '') }),
    ]),
    el('div', { class: 'acc-actions' }, [
      el('button', { class: 'icon-btn', title: 'Düzenle', html: '✏️', onClick: () => openDebt(ctx, d) }),
      el('button', { class: 'icon-btn', title: 'Sil', html: '🗑️', onClick: () => confirmDialog({ title: 'Borcu sil', message: `"${d.name}" ve tüm taksit ödemeleri silinecek.`, onConfirm: () => { store.deleteDebt(d.id); toast('Borç silindi.'); ctx.rerender(); } }) }),
    ]),
  ]));

  const grid = el('div', { class: 'debt-stats' }, [
    debtStat('Toplam Borç', money(d.totalAmount, { compact: true })),
    debtStat('Aylık Taksit', money(d.monthlyPayment, { compact: true })),
    debtStat('Ödenen', `${paidCount} / ${d.installmentCount}`),
    debtStat('Kalan Taksit', String(d.installmentCount - paidCount)),
    debtStat('Kalan Borç', money(remaining, { compact: true }), 'neg'),
    debtStat('Sonraki Ödeme', next ? dateShort(next.dueDate) : '—'),
  ]);
  card.appendChild(grid);
  card.appendChild(progressBar(paidCount, d.installmentCount, { showPct: true }));

  // Taksit takvimi (aç/kapa)
  const schedule = el('div', { class: 'installment-list', style: 'display:none' });
  for (const inst of insts) {
    const st = installmentDisplayStatus(inst);
    schedule.appendChild(el('div', { class: 'inst-row ' + (STATE_CLASS[st.state] || '') }, [
      el('span', { class: 'inst-no', text: `${inst.installmentNumber}/${d.installmentCount}` }),
      el('span', { class: 'inst-due muted', text: dateShort(inst.dueDate) }),
      el('span', { class: 'inst-amt', text: money(inst.amount, { compact: true }) }),
      el('span', { class: 'st-badge ' + (STATE_CLASS[st.state] || ''), text: inst.status === 'paid' ? 'Ödendi' : STATE_LABEL[st.state] }),
      inst.status === 'paid'
        ? el('button', { class: 'icon-btn', title: 'Geri al', html: '↩', onClick: () => { store.unpayInstallment(inst.id); toast('Geri alındı.'); ctx.rerender(); } })
        : el('button', { class: 'btn btn-primary btn-sm', text: 'Öde', onClick: () => { store.payInstallment(inst.id); toast('Taksit ödendi, gider oluşturuldu.'); ctx.rerender(); } }),
    ]));
  }
  const toggle = el('button', { class: 'btn btn-ghost btn-sm toggle-sched', text: `Taksit planını göster (${insts.length})`, onClick: () => {
    const open = schedule.style.display === 'none';
    schedule.style.display = open ? 'flex' : 'none';
    toggle.textContent = open ? 'Taksit planını gizle' : `Taksit planını göster (${insts.length})`;
  } });
  card.append(toggle, schedule);
  return card;
}

function debtStat(label, value, tone) {
  return el('div', { class: 'debt-stat' }, [
    el('span', { class: 'muted small', text: label }),
    el('strong', { class: tone || '', text: value }),
  ]);
}

function openDebt(ctx, debt = null) {
  if (!store.accounts.length) { toast('Önce bir hesap ekleyin.', 'error'); location.hash = '#/hesaplar'; return; }
  const m = openModal({ title: debt ? 'Borcu Düzenle' : 'Taksitli Borç Ekle', body: debtForm({ debt, onDone: () => { m.close(); ctx.rerender(); } }) });
}

// ---------------- TAKVİM ----------------
function renderCalendar(host, ctx) {
  const { year, month } = ctx;
  const obligations = monthObligations(year, month);
  const byDay = new Map();
  for (const it of obligations) {
    const day = it.due.getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(it);
  }

  const summary = monthPaymentSummary(year, month);
  host.appendChild(el('div', { class: 'stat-grid stat-grid-3' }, [
    statCard({ label: 'Planlanan', value: money(summary.planned, { compact: true }), tone: 'neutral', icon: '📅' }),
    statCard({ label: 'Ödenen', value: money(summary.paid, { compact: true }), tone: 'income', icon: '✅' }),
    statCard({ label: 'Kalan', value: money(summary.remaining, { compact: true }), tone: summary.overdue > 0 ? 'expense' : 'warn', icon: '⏳' }),
  ]));

  if (!obligations.length) {
    host.appendChild(el('p', { class: 'muted center', text: 'Bu ay için planlı ödeme yok.' }));
    return;
  }

  const wd = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const cal = el('div', { class: 'calendar card' });
  const grid = el('div', { class: 'cal-grid' });
  for (const w of wd) grid.appendChild(el('div', { class: 'cal-wd', text: w }));

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Pazartesi=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) grid.appendChild(el('div', { class: 'cal-cell empty' }));
  const todayY = new Date().getFullYear(); const todayM = new Date().getMonth(); const todayD = new Date().getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const items = byDay.get(day) || [];
    const isToday = year === todayY && month === todayM && day === todayD;
    const cell = el('div', { class: 'cal-cell' + (isToday ? ' today' : '') }, [
      el('span', { class: 'cal-day', text: String(day) }),
      ...items.map((it) => el('span', {
        class: 'cal-dot ' + (STATE_CLASS[it.state] || 'st-pending'),
        title: `${it.name} · ${money(it.amount)} · ${STATE_LABEL[it.state]}`,
        text: `${it.icon} ${money(it.amount, { compact: true })}`,
      })),
    ]);
    grid.appendChild(cell);
  }
  cal.append(el('div', { class: 'card-head' }, [el('h3', { text: monthLabel(year, month) + ' Ödeme Takvimi' })]), grid);
  host.appendChild(cal);

  // Renk açıklaması
  host.appendChild(el('div', { class: 'cal-legend muted small' }, [
    legendDot('st-paid', 'Ödendi'), legendDot('st-upcoming', 'Yaklaşan'),
    legendDot('st-overdue', 'Geciken'), legendDot('st-pending', 'Bekleyen'),
  ]));
}

function legendDot(cls, label) {
  return el('span', { class: 'cal-leg-item' }, [el('i', { class: 'cal-dot ' + cls }), el('span', { text: label })]);
}
