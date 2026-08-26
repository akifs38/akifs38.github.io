// store.js — Veri katmanı: localStorage kalıcılığı, kimlik doğrulama,
// kullanıcı bazlı veri izolasyonu, model işlemleri ve türetilmiş hesaplar.

import { uid, sha256, nowISO, ymOf, sameMonth } from './utils.js';

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
    'Eğlence', 'Abonelik', 'Teknoloji', 'Ev', 'Eğitim', 'Diğer'];
  const inc = ['Maaş', 'Ek Gelir', 'Yatırım', 'Hediye', 'Diğer'];
  const icons = {
    Market: '🛒', Yemek: '🍽️', Elektrik: '💡', Su: '🚰', Doğalgaz: '🔥',
    Telefon: '📱', İnternet: '🌐', Kira: '🏠', Ulaşım: '🚌', Akaryakıt: '⛽',
    Giyim: '👕', Sağlık: '🏥', Eğlence: '🎬', Abonelik: '🔁', Teknoloji: '💻',
    Ev: '🛋️', Eğitim: '🎓', Diğer: '📦', Maaş: '💰', 'Ek Gelir': '➕',
    Yatırım: '📈', Hediye: '🎁',
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
    this._listeners = new Set();
  }

  onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  _emit() { for (const fn of this._listeners) fn(); }

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
    // Eski kayıtlarda eksik alanları tamamla
    const d = emptyData();
    for (const k of Object.keys(d)) if (this.data[k] == null) this.data[k] = d[k];
    if (!this.data.settings) this.data.settings = d.settings;
    if (!this.data.prefs) this.data.prefs = d.prefs;
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
    const now = nowISO();
    const t = {
      id: uid(),
      type,
      amount: Math.abs(Number(amount)) || 0,
      description: description.trim(),
      categoryId: categoryId || null,
      accountId: accountId || null,
      transactionDate: transactionDate || now,
      createdAt: now,
      updatedAt: now,
      note: note.trim(),
    };
    this.data.transactions.push(t);
    // Son kullanılan kategori & hesabı hatırla
    if (categoryId) this.data.prefs.lastCategoryId = categoryId;
    if (accountId) this.data.prefs.lastAccountId = accountId;
    this._persist();
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
    this.data.transactions = this.data.transactions.filter((t) => t.id !== id);
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
