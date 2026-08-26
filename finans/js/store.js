// store.js — Veri katmanı: localStorage kalıcılığı, kimlik doğrulama,
// kullanıcı bazlı veri izolasyonu, model işlemleri ve türetilmiş hesaplar.

import { uid, sha256, nowISO, ymOf, sameMonth, addMonths, dueDateFor, daysDiff, startOfToday } from './utils.js';

const K_USERS = 'finans:users';
const K_SESSION = 'finans:session';
const dataKey = (userId) => `finans:data:${userId}`;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('Okuma hatası', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Yazma hatası', key, e);
    return false;
  }
}

// ---- Varsayılan veri ----

function defaultCategories() {
  const exp = ['Market', 'Yemek', 'Elektrik', 'Su', 'Doğalgaz', 'Telefon',
    'İnternet', 'Kira', 'Ulaşım', 'Akaryakıt', 'Giyim', 'Sağlık',
    'Eğlence', 'Abonelik', 'Teknoloji', 'Ev', 'Eğitim', 'Borç / Kredi', 'Fatura', 'Diğer'];
  const inc = ['Maaş', 'Ek Gelir', 'Yatırım', 'Hediye', 'Diğer'];
  const icons = {
    Market: '🛒', Yemek: '🍽️', Elektrik: '💡', Su: '🚰', Doğalgaz: '🔥',
    Telefon: '📱', İnternet: '🌐', Kira: '🏠', Ulaşım: '🚌', Akaryakıt: '⛽',
    Giyim: '👕', Sağlık: '🏥', Eğlence: '🎬', Abonelik: '🔁', Teknoloji: '💻',
    Ev: '🛋️', Eğitim: '🎓', Diğer: '📦', Maaş: '💰', 'Ek Gelir': '➕',
    Yatırım: '📈', Hediye: '🎁', 'Borç / Kredi': '💳', Fatura: '🧾',
  };
  const cats = [];
  for (const n of inc) cats.push({ id: uid(), name: n, type: 'income', icon: icons[n] || '💵' });
  for (const n of exp) cats.push({ id: uid(), name: n, type: 'expense', icon: icons[n] || '📦' });
  return cats;
}

function emptyData() {
  return {
    accounts: [],
    categories: defaultCategories(),
    transactions: [],
    budgets: [],
    recurring: [],
    debts: [],
    installments: [],
    bills: [],
    plans: [],
    settings: { theme: 'light', savingsGoal: 5000 },
    prefs: { lastAccountId: null, lastCategoryId: null },
  };
}

// ---- Store sınıfı ----

class Store {
  constructor() {
    this.userId = null;
    this.user = null;
    this.data = null;
    this.cloud = false;            // bulut modu aktif mi
    this._applyingRemote = false;  // uzak veriyi uygularken echo'yu engelle
    this._listeners = new Set();
    this._remoteCbs = new Set();
  }

  onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  _emit() { for (const fn of this._listeners) fn(); }

  // Uzak (bulut) veri güncellemesi geldiğinde çağrılacak dinleyiciler
  onRemote(fn) { this._remoteCbs.add(fn); return () => this._remoteCbs.delete(fn); }

  // Eksik alanları varsayılanlarla tamamla
  _topup() {
    const d = emptyData();
    for (const k of Object.keys(d)) if (this.data[k] == null) this.data[k] = d[k];
    if (!this.data.settings) this.data.settings = d.settings;
    if (!this.data.prefs) this.data.prefs = d.prefs;
  }

  _persist() {
    writeJSON(dataKey(this.userId), this.data);
    this._emit();
  }

  // ---- Kimlik doğrulama ----

  currentSession() { return readJSON(K_SESSION, null); }

  async register(name, email, password) {
    email = String(email).trim().toLowerCase();
    const users = readJSON(K_USERS, []);
    if (users.some((u) => u.email === email)) {
      throw new Error('Bu e-posta zaten kayıtlı.');
    }
    const salt = uid();
    const passHash = await sha256(salt + password);
    const user = { id: uid(), name, email, salt, passHash, createdAt: nowISO() };
    users.push(user);
    writeJSON(K_USERS, users);
    writeJSON(dataKey(user.id), emptyData());
    await this.login(email, password);
    return user;
  }

  async login(email, password) {
    email = String(email).trim().toLowerCase();
    const users = readJSON(K_USERS, []);
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error('E-posta veya şifre hatalı.');
    const hash = await sha256(user.salt + password);
    if (hash !== user.passHash) throw new Error('E-posta veya şifre hatalı.');
    this._activate(user);
    writeJSON(K_SESSION, { userId: user.id });
    return user;
  }

  _activate(user) {
    this.userId = user.id;
    this.user = user;
    this.data = readJSON(dataKey(user.id), null) || emptyData();
    this._topup();
  }

  // ---- Bulut modu ----
  activateCloud(fbUser) {
    this.cloud = true;
    this.userId = fbUser.uid;
    this.user = {
      id: fbUser.uid,
      name: fbUser.displayName || (fbUser.email || '').split('@')[0],
      email: fbUser.email,
    };
    // Anında görünüm için yerel önbelleği yükle; uzak veri gelince güncellenir
    this.data = readJSON(dataKey(fbUser.uid), null) || emptyData();
    this._topup();
  }

  // Uzak (bulut) JSON'ı uygula — echo döngüsünü engellemek için işaretle
  applyRemoteJSON(json) {
    let d;
    try { d = JSON.parse(json); } catch (e) { return; }
    this._applyingRemote = true;
    try {
      this.data = d;
      this._topup();
      writeJSON(dataKey(this.userId), this.data);
      this._emit();
      for (const cb of this._remoteCbs) cb();
    } finally { this._applyingRemote = false; }
  }

  restoreSession() {
    const s = this.currentSession();
    if (!s) return false;
    const users = readJSON(K_USERS, []);
    const user = users.find((u) => u.id === s.userId);
    if (!user) return false;
    this._activate(user);
    return true;
  }

  logout() {
    this.userId = null;
    this.user = null;
    this.data = null;
    localStorage.removeItem(K_SESSION);
  }

  async changePassword(oldPass, newPass) {
    const users = readJSON(K_USERS, []);
    const idx = users.findIndex((u) => u.id === this.userId);
    if (idx < 0) throw new Error('Kullanıcı bulunamadı.');
    const u = users[idx];
    const hash = await sha256(u.salt + oldPass);
    if (hash !== u.passHash) throw new Error('Mevcut şifre hatalı.');
    const salt = uid();
    u.salt = salt;
    u.passHash = await sha256(salt + newPass);
    users[idx] = u;
    writeJSON(K_USERS, users);
    this.user = u;
  }

  // ---- Hesaplar ----
  get accounts() { return this.data.accounts; }
  addAccount({ name, type, openingBalance = 0 }) {
    const a = { id: uid(), name: name.trim(), type, openingBalance: Number(openingBalance) || 0, createdAt: nowISO() };
    this.data.accounts.push(a);
    this._persist();
    return a;
  }
  updateAccount(id, patch) {
    const a = this.data.accounts.find((x) => x.id === id);
    if (a) { Object.assign(a, patch); if (patch.openingBalance != null) a.openingBalance = Number(patch.openingBalance) || 0; this._persist(); }
    return a;
  }
  deleteAccount(id) {
    this.data.accounts = this.data.accounts.filter((a) => a.id !== id);
    this.data.transactions = this.data.transactions.filter((t) => t.accountId !== id);
    this.data.recurring = this.data.recurring.filter((r) => r.accountId !== id);
    this._persist();
  }
  accountById(id) { return this.data.accounts.find((a) => a.id === id); }

  // Hesap bakiyesi = açılış + gelirler - giderler
  accountBalance(id) {
    const acc = this.accountById(id);
    if (!acc) return 0;
    let bal = acc.openingBalance || 0;
    for (const t of this.data.transactions) {
      if (t.accountId !== id) continue;
      bal += t.type === 'income' ? t.amount : -t.amount;
    }
    return bal;
  }

  // ---- Kategoriler ----
  get categories() { return this.data.categories; }
  categoriesByType(type) { return this.data.categories.filter((c) => c.type === type); }
  categoryById(id) { return this.data.categories.find((c) => c.id === id); }
  addCategory({ name, type, icon = '📦' }) {
    const c = { id: uid(), name: name.trim(), type, icon };
    this.data.categories.push(c);
    this._persist();
    return c;
  }
  updateCategory(id, patch) {
    const c = this.categoryById(id);
    if (c) { Object.assign(c, patch); this._persist(); }
    return c;
  }
  deleteCategory(id) {
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    this.data.budgets = this.data.budgets.filter((b) => b.categoryId !== id);
    this._persist();
  }

  // ---- İşlemler ----
  get transactions() { return this.data.transactions; }

  addTransaction({ type, amount, description = '', categoryId, accountId, transactionDate, note = '' }) {
    const t = this.addTransactionRaw({ type, amount, description, categoryId, accountId, transactionDate, note });
    // Son kullanılan kategori & hesabı hatırla (yalnızca elle eklenen işlemlerde)
    if (categoryId) this.data.prefs.lastCategoryId = categoryId;
    if (accountId) this.data.prefs.lastAccountId = accountId;
    this._persist();
    return t;
  }

  // Ham işlem oluşturma (borç/fatura entegrasyonu için source/sourceId taşır)
  addTransactionRaw({ type, amount, description = '', categoryId, accountId, transactionDate, note = '', source = null, sourceId = null }) {
    const now = nowISO();
    const t = {
      id: uid(), type, amount: Math.abs(Number(amount)) || 0,
      description: (description || '').trim(),
      categoryId: categoryId || null, accountId: accountId || null,
      transactionDate: transactionDate || now, createdAt: now, updatedAt: now,
      note: (note || '').trim(), source, sourceId,
    };
    this.data.transactions.push(t);
    return t;
  }

  updateTransaction(id, patch) {
    const t = this.data.transactions.find((x) => x.id === id);
    if (!t) return null;
    if (patch.amount != null) patch.amount = Math.abs(Number(patch.amount)) || 0;
    Object.assign(t, patch, { updatedAt: nowISO() });
    this._persist();
    return t;
  }

  deleteTransaction(id) {
    const t = this.transactionById(id);
    // Borç/fatura kaynaklı bir işlem silinirse ilgili kaydı da geri al (durum tutarlı kalsın)
    if (t && t.source === 'installment' && t.sourceId) {
      const inst = this.data.installments.find((i) => i.id === t.sourceId);
      if (inst) { inst.status = 'pending'; inst.paidDate = null; inst.transactionId = null; const d = this.debtById(inst.debtId); if (d) { d.paidInstallments = this.debtPaidCount(d.id); d.status = 'active'; } }
    } else if (t && t.source === 'bill' && t.sourceId) {
      const bill = this.billById(t.sourceId);
      if (bill) bill.paidPeriods = (bill.paidPeriods || []).filter((p) => p.transactionId !== id);
    }
    this.data.transactions = this.data.transactions.filter((x) => x.id !== id);
    this._persist();
  }

  transactionById(id) { return this.data.transactions.find((t) => t.id === id); }

  transactionsForMonth(year, month) {
    return this.data.transactions.filter((t) => sameMonth(t.transactionDate, year, month));
  }

  // ---- Bütçeler ----
  get budgets() { return this.data.budgets; }
  budgetFor(categoryId, year, month) {
    return this.data.budgets.find((b) => b.categoryId === categoryId && b.year === year && b.month === month);
  }
  setBudget(categoryId, year, month, amount) {
    amount = Math.abs(Number(amount)) || 0;
    let b = this.budgetFor(categoryId, year, month);
    if (amount === 0) {
      this.data.budgets = this.data.budgets.filter((x) => x !== b);
    } else if (b) {
      b.amount = amount;
    } else {
      this.data.budgets.push({ id: uid(), categoryId, year, month, amount });
    }
    this._persist();
  }

  spentInCategory(categoryId, year, month) {
    return this.transactionsForMonth(year, month)
      .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
      .reduce((s, t) => s + t.amount, 0);
  }

  // ---- Tekrarlayan işlemler ----
  get recurring() { return this.data.recurring; }
  addRecurring(r) {
    const rec = { id: uid(), active: true, ...r, amount: Math.abs(Number(r.amount)) || 0 };
    this.data.recurring.push(rec);
    this._persist();
    return rec;
  }
  updateRecurring(id, patch) {
    const r = this.data.recurring.find((x) => x.id === id);
    if (r) { Object.assign(r, patch); if (patch.amount != null) r.amount = Math.abs(Number(patch.amount)) || 0; this._persist(); }
    return r;
  }
  deleteRecurring(id) {
    this.data.recurring = this.data.recurring.filter((r) => r.id !== id);
    this._persist();
  }

  // ---- Kategori yardımcısı: gerekiyorsa oluştur ----
  ensureCategory(name, type, icon) {
    let c = this.data.categories.find((x) => x.name === name && x.type === type);
    if (!c) { c = { id: uid(), name, type, icon: icon || '📦' }; this.data.categories.push(c); }
    return c;
  }

  // ==================================================
  //  TAKSİTLİ ÖDEMELER / BORÇLAR
  // ==================================================
  get debts() { return this.data.debts; }
  get installments() { return this.data.installments; }

  installmentsOf(debtId) {
    return this.data.installments
      .filter((i) => i.debtId === debtId)
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  addDebt(d) {
    const now = nowISO();
    const debt = {
      id: uid(), name: (d.name || '').trim(), type: d.type || 'other',
      totalAmount: Math.abs(Number(d.totalAmount)) || 0,
      monthlyPayment: Math.abs(Number(d.monthlyPayment)) || 0,
      installmentCount: Math.max(1, parseInt(d.installmentCount, 10) || 1),
      paidInstallments: 0,
      startDate: d.startDate || now,
      paymentDay: parseInt(d.paymentDay, 10) || new Date(d.startDate || now).getDate(),
      accountId: d.accountId || null,
      description: (d.description || '').trim(),
      note: (d.note || '').trim(),
      status: 'active',
      createdAt: now, updatedAt: now,
    };
    this.data.debts.push(debt);
    // Taksitleri üret: son taksit farkı toplam - (n-1)*aylık ile dengelenir
    const n = debt.installmentCount;
    let allocated = 0;
    for (let k = 1; k <= n; k++) {
      const due = addMonths(debt.startDate, k - 1, debt.paymentDay);
      let amount = debt.monthlyPayment;
      if (k === n && debt.totalAmount > 0) amount = Math.max(0, debt.totalAmount - allocated);
      allocated += debt.monthlyPayment;
      this.data.installments.push({
        id: uid(), debtId: debt.id, installmentNumber: k,
        dueDate: due.toISOString(), amount: Math.round(amount * 100) / 100,
        status: 'pending', paidDate: null, transactionId: null, createdAt: now,
      });
    }
    this._persist();
    return debt;
  }

  updateDebt(id, patch) {
    const d = this.data.debts.find((x) => x.id === id);
    if (!d) return null;
    Object.assign(d, patch, { updatedAt: nowISO() });
    this._persist();
    return d;
  }

  deleteDebt(id) {
    // İlişkili işlemleri de temizle (mükerrer gider kalmasın)
    const insts = this.installmentsOf(id);
    const txIds = new Set(insts.map((i) => i.transactionId).filter(Boolean));
    this.data.transactions = this.data.transactions.filter((t) => !txIds.has(t.id));
    this.data.installments = this.data.installments.filter((i) => i.debtId !== id);
    this.data.debts = this.data.debts.filter((x) => x.id !== id);
    this._persist();
  }

  debtById(id) { return this.data.debts.find((d) => d.id === id); }

  // Kalan borç = toplam - ödenen taksitlerin toplamı
  debtRemaining(id) {
    const d = this.debtById(id);
    if (!d) return 0;
    const paid = this.installmentsOf(id).filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    return Math.max(0, d.totalAmount - paid);
  }
  debtPaidCount(id) { return this.installmentsOf(id).filter((i) => i.status === 'paid').length; }
  debtNextInstallment(id) {
    return this.installmentsOf(id).find((i) => i.status !== 'paid') || null;
  }

  payInstallment(installmentId, when) {
    const inst = this.data.installments.find((i) => i.id === installmentId);
    if (!inst || inst.status === 'paid') return null;
    const debt = this.debtById(inst.debtId);
    const cat = this.ensureCategory('Borç / Kredi', 'expense', '💳');
    const tx = this.addTransactionRaw({
      type: 'expense', amount: inst.amount,
      description: `${debt ? debt.name : 'Borç'} · ${inst.installmentNumber}/${debt ? debt.installmentCount : '?'}. taksit`,
      categoryId: cat.id, accountId: debt ? debt.accountId : null,
      transactionDate: when || nowISO(), note: 'Taksit ödemesi', source: 'installment', sourceId: inst.id,
    });
    inst.status = 'paid';
    inst.paidDate = when || nowISO();
    inst.transactionId = tx.id;
    if (debt) {
      debt.paidInstallments = this.debtPaidCount(debt.id);
      debt.status = debt.paidInstallments >= debt.installmentCount ? 'closed' : 'active';
      debt.updatedAt = nowISO();
    }
    this._persist();
    return tx;
  }

  unpayInstallment(installmentId) {
    const inst = this.data.installments.find((i) => i.id === installmentId);
    if (!inst || inst.status !== 'paid') return;
    if (inst.transactionId) this.data.transactions = this.data.transactions.filter((t) => t.id !== inst.transactionId);
    inst.status = 'pending'; inst.paidDate = null; inst.transactionId = null;
    const debt = this.debtById(inst.debtId);
    if (debt) { debt.paidInstallments = this.debtPaidCount(debt.id); debt.status = 'active'; debt.updatedAt = nowISO(); }
    this._persist();
  }

  // ==================================================
  //  FATURA / DÜZENLİ ÖDEME TAKİBİ (RecurringPayment)
  // ==================================================
  get bills() { return this.data.bills; }
  billById(id) { return this.data.bills.find((b) => b.id === id); }

  addBill(b) {
    const now = nowISO();
    const bill = {
      id: uid(), name: (b.name || '').trim(),
      categoryId: b.categoryId || null, accountId: b.accountId || null,
      amount: Math.abs(Number(b.amount)) || 0,
      paymentDay: parseInt(b.paymentDay, 10) || 1,
      type: 'expense', active: b.active !== false,
      reminderDaysBefore: parseInt(b.reminderDaysBefore, 10) || 3,
      gracePeriodDays: parseInt(b.gracePeriodDays, 10) || 3,
      paidPeriods: [], createdAt: now, updatedAt: now,
    };
    this.data.bills.push(bill);
    this._persist();
    return bill;
  }

  updateBill(id, patch) {
    const b = this.billById(id);
    if (!b) return null;
    Object.assign(b, patch, { updatedAt: nowISO() });
    if (patch.amount != null) b.amount = Math.abs(Number(patch.amount)) || 0;
    this._persist();
    return b;
  }

  deleteBill(id) {
    const b = this.billById(id);
    if (b) {
      const txIds = new Set((b.paidPeriods || []).map((p) => p.transactionId).filter(Boolean));
      this.data.transactions = this.data.transactions.filter((t) => !txIds.has(t.id));
    }
    this.data.bills = this.data.bills.filter((x) => x.id !== id);
    this._persist();
  }

  billPaidPeriod(bill, year, month) {
    return (bill.paidPeriods || []).find((p) => p.year === year && p.month === month) || null;
  }

  payBill(billId, year, month, when) {
    const bill = this.billById(billId);
    if (!bill || this.billPaidPeriod(bill, year, month)) return null;
    const cat = bill.categoryId ? this.categoryById(bill.categoryId) : this.ensureCategory('Fatura', 'expense', '🧾');
    const catId = cat ? cat.id : this.ensureCategory('Fatura', 'expense', '🧾').id;
    const tx = this.addTransactionRaw({
      type: 'expense', amount: bill.amount, description: bill.name,
      categoryId: catId, accountId: bill.accountId,
      transactionDate: when || nowISO(), note: 'Fatura ödemesi', source: 'bill', sourceId: bill.id,
    });
    bill.paidPeriods.push({ year, month, paidDate: when || nowISO(), transactionId: tx.id, amount: bill.amount });
    bill.updatedAt = nowISO();
    this._persist();
    return tx;
  }

  unpayBill(billId, year, month) {
    const bill = this.billById(billId);
    if (!bill) return;
    const p = this.billPaidPeriod(bill, year, month);
    if (!p) return;
    if (p.transactionId) this.data.transactions = this.data.transactions.filter((t) => t.id !== p.transactionId);
    bill.paidPeriods = bill.paidPeriods.filter((x) => x !== p);
    bill.updatedAt = nowISO();
    this._persist();
  }

  // Aylık zorunlu ödeme yükü (aktif faturalar + devam eden borç taksitleri)
  monthlyFixedLoad() {
    const bills = this.data.bills.filter((b) => b.active).reduce((s, b) => s + b.amount, 0);
    const debts = this.data.debts
      .filter((d) => this.debtNextInstallment(d.id))
      .reduce((s, d) => s + d.monthlyPayment, 0);
    return bills + debts;
  }

  // ---- Aylık planlar ----
  planFor(year, month) {
    return this.data.plans.find((p) => p.year === year && p.month === month);
  }
  setPlan(year, month, patch) {
    let p = this.planFor(year, month);
    if (p) Object.assign(p, patch);
    else { p = { id: uid(), year, month, ...patch }; this.data.plans.push(p); }
    this._persist();
    return p;
  }

  // ---- Ayarlar / tercihler ----
  updateSettings(patch) { Object.assign(this.data.settings, patch); this._persist(); }
  updatePrefs(patch) { Object.assign(this.data.prefs, patch); this._persist(); }

  // ---- Aylık özet ----
  monthlySummary(year, month) {
    const txs = this.transactionsForMonth(year, month);
    let income = 0; let expense = 0;
    for (const t of txs) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    const remaining = income - expense;
    const savingsRate = income > 0 ? (remaining / income) * 100 : 0;
    return { income, expense, remaining, savingsRate, count: txs.length };
  }

  // Kategori bazlı gider dağılımı
  expenseByCategory(year, month) {
    const map = new Map();
    for (const t of this.transactionsForMonth(year, month)) {
      if (t.type !== 'expense') continue;
      const cat = this.categoryById(t.categoryId);
      const name = cat ? cat.name : 'Kategorisiz';
      const key = cat ? cat.id : 'none';
      const cur = map.get(key) || { id: key, name, icon: cat ? cat.icon : '❓', amount: 0 };
      cur.amount += t.amount;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }

  // Yaklaşan ödemeler (aktif tekrarlayan, tarihe göre sıralı)
  upcomingPayments(limit = 5) {
    const today = new Date();
    return this.data.recurring
      .filter((r) => r.active)
      .map((r) => ({ ...r, next: nextDateOf(r, today) }))
      .sort((a, b) => a.next - b.next)
      .slice(0, limit);
  }

  // Demo veri
  async seedDemo() {
    const d = emptyData();
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const deniz = { id: uid(), name: 'DenizBank', type: 'bank', openingBalance: 24500, createdAt: nowISO() };
    const nakit = { id: uid(), name: 'Nakit', type: 'cash', openingBalance: 2500, createdAt: nowISO() };
    const kart = { id: uid(), name: 'Kredi Kartı', type: 'credit_card', openingBalance: -4500, createdAt: nowISO() };
    d.accounts = [deniz, nakit, kart];

    const cat = (name, type) => d.categories.find((c) => c.name === name && c.type === type);
    const iso = (day) => new Date(y, m, day, 9, 30).toISOString();

    const tx = (type, amount, desc, catName, catType, acc, day, note = '') => ({
      id: uid(), type, amount, description: desc,
      categoryId: (cat(catName, catType) || {}).id || null,
      accountId: acc.id, transactionDate: iso(day),
      createdAt: iso(day), updatedAt: iso(day), note,
    });

    d.transactions = [
      tx('income', 35000, 'Maaş', 'Maaş', 'income', deniz, 1),
      tx('expense', 3200, 'Market alışverişi', 'Market', 'expense', deniz, 3),
      tx('expense', 2500, 'Restoran & kafe', 'Yemek', 'expense', kart, 5),
      tx('expense', 1200, 'Elektrik faturası', 'Elektrik', 'expense', deniz, 8),
      tx('expense', 450, 'Su faturası', 'Su', 'expense', deniz, 8),
      tx('expense', 600, 'Telefon faturası', 'Telefon', 'expense', deniz, 10),
      tx('expense', 2000, 'Ulaşım & benzin', 'Ulaşım', 'expense', nakit, 12),
      tx('expense', 8500, 'Ev kirası', 'Kira', 'expense', deniz, 2),
      tx('expense', 900, 'Eğlence', 'Eğlence', 'expense', kart, 15),
    ];

    const setB = (name, amt) => {
      const c = cat(name, 'expense');
      if (c) d.budgets.push({ id: uid(), categoryId: c.id, year: y, month: m, amount: amt });
    };
    setB('Market', 6000); setB('Yemek', 4000); setB('Ulaşım', 2500);
    setB('Eğlence', 2000); setB('Elektrik', 1500); setB('Su', 500); setB('Telefon', 700);

    const rec = (desc, amount, type, catName, catType, acc, freq, day) => ({
      id: uid(), active: true, description: desc, amount, type,
      categoryId: (cat(catName, catType) || {}).id || null,
      accountId: acc.id, frequency: freq, dayOfMonth: day,
    });
    d.recurring = [
      rec('Kira', 8500, 'expense', 'Kira', 'expense', deniz, 'monthly', 2),
      rec('Elektrik', 1200, 'expense', 'Elektrik', 'expense', deniz, 'monthly', 15),
      rec('Telefon', 600, 'expense', 'Telefon', 'expense', deniz, 'monthly', 18),
      rec('İnternet', 550, 'expense', 'İnternet', 'expense', deniz, 'monthly', 20),
      rec('Netflix', 200, 'expense', 'Abonelik', 'expense', kart, 'monthly', 22),
      rec('Maaş', 35000, 'income', 'Maaş', 'income', deniz, 'monthly', 1),
    ];

    d.plans = [{ id: uid(), year: y, month: m, expectedIncome: 35000, fixedExpense: 12500, variableBudget: 8000, savingsGoal: 5000 }];
    d.settings = { ...this.data.settings, savingsGoal: 5000 };
    d.prefs = { lastAccountId: deniz.id, lastCategoryId: (cat('Yemek', 'expense') || {}).id || null };

    this.data = d;

    // Taksitli borç: 12 taksitlik ihtiyaç kredisi, ilk 3 taksit ödenmiş
    const startD = new Date(y, m - 2, 20).toISOString(); // 2 ay önce başlamış
    const kredi = this.addDebt({
      name: 'İhtiyaç Kredisi', type: 'loan', totalAmount: 396000, monthlyPayment: 33000,
      installmentCount: 12, startDate: startD, paymentDay: 20, accountId: deniz.id,
      description: 'Banka ihtiyaç kredisi',
    });
    const kInsts = this.installmentsOf(kredi.id);
    for (const inst of kInsts) {
      if (new Date(inst.dueDate) < new Date(y, m, 1)) this.payInstallment(inst.id, inst.dueDate);
    }
    // Telefon taksiti: 6 taksit, 2 ödenmiş
    const tel = this.addDebt({
      name: 'Telefon Taksiti', type: 'phone', totalAmount: 18000, monthlyPayment: 3000,
      installmentCount: 6, startDate: new Date(y, m - 1, 5).toISOString(), paymentDay: 5, accountId: kart.id,
    });
    const tInsts = this.installmentsOf(tel.id);
    if (tInsts[0]) this.payInstallment(tInsts[0].id, tInsts[0].dueDate);

    // Faturalar (RecurringPayment)
    const backdated = new Date(y, m - 3, 1).toISOString(); // 3 ay önce takibe alınmış
    const bill = (name, catName, amount, day, accId) => {
      const bl = this.addBill({
        name, categoryId: (cat(catName, 'expense') || {}).id, accountId: accId,
        amount, paymentDay: day, reminderDaysBefore: 3, gracePeriodDays: 3,
      });
      bl.createdAt = backdated; // gerçek gecikme/yaklaşan durumlarını göstermek için
      return bl;
    };
    bill('Elektrik', 'Elektrik', 1250, 20, deniz.id);
    bill('Su', 'Su', 450, 15, deniz.id);
    bill('İnternet', 'İnternet', 550, 10, deniz.id);
    bill('Telefon Faturası', 'Telefon', 600, 25, deniz.id);
    bill('Doğalgaz', 'Doğalgaz', 800, 18, deniz.id);
    const kiraBill = bill('Kira', 'Kira', 15000, 1, deniz.id);
    // Kira bu ay ödenmiş olsun
    this.payBill(kiraBill.id, y, m, new Date(y, m, 1).toISOString());

    this._persist();
  }

  clearAllData() {
    this.data = emptyData();
    this._persist();
  }
}

// Tekrarlayan ödemenin bugüne göre sonraki tarihi
export function nextDateOf(r, from = new Date()) {
  const day = r.dayOfMonth || 1;
  if (r.frequency === 'weekly') {
    const d = new Date(from);
    const target = (r.weekday ?? 1);
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (r.frequency === 'yearly') {
    const month = r.month ?? from.getMonth();
    let d = new Date(from.getFullYear(), month, day);
    if (d < from) d = new Date(from.getFullYear() + 1, month, day);
    return d;
  }
  // monthly (varsayılan)
  let d = new Date(from.getFullYear(), from.getMonth(), day);
  if (d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    d = new Date(from.getFullYear(), from.getMonth() + 1, day);
  }
  return d;
}

export const store = new Store();
