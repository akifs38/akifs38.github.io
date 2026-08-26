// payments.js — Ödeme durum motoru: fatura/taksit durumları, uyarılar,
// aylık zorunlu ödeme özeti. Dashboard ve Ödemeler sayfası paylaşır.

import { store } from './store.js';
import { dueDateFor, daysDiff, startOfToday } from './utils.js';

// Durumlar: paid | pending | upcoming | due-today | overdue | overdue-strong
export function billStatus(bill, year, month, now = startOfToday()) {
  const paid = store.billPaidPeriod(bill, year, month);
  const due = dueDateFor(year, month, bill.paymentDay);
  if (paid) return { state: 'paid', due, days: daysDiff(due, now), paidPeriod: paid };
  const du = daysDiff(due, now); // due - bugün ; >0 gelecek, 0 bugün, <0 geçmiş
  let state;
  if (du > (bill.reminderDaysBefore ?? 3)) state = 'pending';
  else if (du >= 1) state = 'upcoming';
  else if (du === 0) state = 'due-today';
  else state = (-du >= (bill.gracePeriodDays ?? 3)) ? 'overdue-strong' : 'overdue';
  // Ödeme, takip edilmeye başlanmadan önceki bir vade için gecikmiş sayılmaz
  if ((state === 'overdue' || state === 'overdue-strong' || state === 'due-today')
      && bill.createdAt && new Date(bill.createdAt) > due) {
    state = 'pending';
  }
  return { state, due, days: du };
}

export function installmentDisplayStatus(inst, now = startOfToday()) {
  if (inst.status === 'paid') return { state: 'paid', due: new Date(inst.dueDate), days: daysDiff(new Date(inst.dueDate), now) };
  const due = new Date(inst.dueDate);
  const du = daysDiff(due, now);
  let state;
  if (du < 0) state = (-du >= 3) ? 'overdue-strong' : 'overdue';
  else if (du === 0) state = 'due-today';
  else if (du <= 7) state = 'upcoming';
  else state = 'pending';
  return { state, due, days: du };
}

const OVERDUE = new Set(['overdue', 'overdue-strong', 'due-today']);

// Belirli ay için tüm zorunlu ödeme kalemleri (fatura + o ay vadeli taksit)
export function monthObligations(year, month, now = startOfToday()) {
  const items = [];
  for (const bill of store.bills) {
    if (!bill.active && !store.billPaidPeriod(bill, year, month)) continue;
    const st = billStatus(bill, year, month, now);
    const cat = bill.categoryId ? store.categoryById(bill.categoryId) : null;
    items.push({
      kind: 'bill', id: bill.id, refId: bill.id, name: bill.name, amount: bill.amount,
      due: st.due, state: st.state, days: st.days, icon: cat ? cat.icon : '🧾', year, month,
    });
  }
  for (const inst of store.installments) {
    const due = new Date(inst.dueDate);
    if (due.getFullYear() !== year || due.getMonth() !== month) continue;
    const debt = store.debtById(inst.debtId);
    const st = installmentDisplayStatus(inst, now);
    items.push({
      kind: 'installment', id: inst.id, refId: inst.debtId,
      name: `${debt ? debt.name : 'Borç'} ${inst.installmentNumber}/${debt ? debt.installmentCount : '?'}`,
      amount: inst.amount, due, state: st.state, days: st.days, icon: '💳', year, month,
    });
  }
  return items.sort((a, b) => a.due - b.due);
}

// Aylık ödeme özeti
export function monthPaymentSummary(year, month, now = startOfToday()) {
  const items = monthObligations(year, month, now);
  let planned = 0; let paid = 0; let overdue = 0; let upcoming = 0;
  for (const it of items) {
    planned += it.amount;
    if (it.state === 'paid') paid += it.amount;
    else if (OVERDUE.has(it.state)) overdue += it.amount;
    else upcoming += it.amount;
  }
  return { planned, paid, remaining: planned - paid, overdue, upcoming, items, count: items.length };
}

// Uyarılar merkezi: bu ay + geçmiş vadeli ödenmemişler
export function collectAlerts(now = startOfToday()) {
  const overdue = []; const upcoming = []; const paid = [];
  const y = now.getFullYear(); const m = now.getMonth();

  for (const bill of store.bills) {
    // Bu ay
    const st = billStatus(bill, y, m, now);
    const base = { kind: 'bill', refId: bill.id, name: bill.name, amount: bill.amount, due: st.due, days: st.days, state: st.state };
    if (st.state === 'paid') paid.push(base);
    else if (OVERDUE.has(st.state)) overdue.push(base);
    else if (st.state === 'upcoming') upcoming.push(base);
  }

  for (const inst of store.installments) {
    if (inst.status === 'paid') { continue; }
    const st = installmentDisplayStatus(inst, now);
    const debt = store.debtById(inst.debtId);
    const item = { kind: 'installment', refId: inst.debtId, instId: inst.id, name: `${debt ? debt.name : 'Borç'} · ${inst.installmentNumber}. taksit`, amount: inst.amount, due: st.due, days: st.days, state: st.state };
    if (OVERDUE.has(st.state)) overdue.push(item);
    else if (st.state === 'upcoming') upcoming.push(item);
  }

  overdue.sort((a, b) => a.due - b.due);
  upcoming.sort((a, b) => a.due - b.due);
  return { overdue, upcoming, paid, total: overdue.length + upcoming.length };
}

// Gün metni: "3 gün gecikti" / "2 gün sonra" / "bugün"
export function daysText(days) {
  if (days === 0) return 'bugün son gün';
  if (days > 0) return `${days} gün sonra`;
  return `${-days} gün gecikti`;
}

// Strong uyarı cümlesi: "Bu ay elektrik ödemenizi yapmadınız."
export function strongWarnings(now = startOfToday()) {
  const y = now.getFullYear(); const m = now.getMonth();
  const out = [];
  for (const bill of store.bills) {
    if (!bill.active) continue;
    const st = billStatus(bill, y, m, now);
    if (st.state === 'overdue-strong') {
      out.push(`⚠️ Bu ay ${bill.name.toLocaleLowerCase('tr')} ödemenizi yapmadınız.`);
    }
  }
  return out;
}
