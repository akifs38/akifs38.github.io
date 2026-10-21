// store.js — Uygulama verisi: tarayıcıda (localStorage) saklanır, her değişiklikte kaydedilir. Şema sürümlüdür;
// yedekten yüklenen veri doğrulanıp eksik alanları tamamlanır. Silmelerde ilişkili kayıtlar tutarlı tutulur.

import { uid, norm } from './util.js';

const KEY = 'proje-yonetimi:v1';
export const SCHEMA_VERSION = 1;

export const COLLECTIONS = ['clients', 'members', 'projects', 'tasks', 'timeEntries', 'expenses', 'catalog', 'templates', 'quotes', 'activity'];

export const DEFAULT_SETTINGS = {
  company: { name: '', address: '', phone: '', email: '', web: '', taxOffice: '', taxNo: '', iban: '', logo: '' },
  currency: 'TRY',
  vatRate: 20,
  quotePrefix: 'TKF',
  quoteValidityDays: 15,
  defaultMargin: 30,
  defaultTerms:
    'Fiyatlara KDV dahil değildir; KDV ayrıca gösterilmiştir.\n'
    + 'Teklif, geçerlilik tarihine kadar geçerlidir.\n'
    + 'Ödeme: %50 sipariş onayında, %50 teslimde.\n'
    + 'Teslim süresi sipariş onayından itibaren hesaplanır.',
  onboarded: false,
  theme: 'auto',
  teamSeeded: false,
};

/** Yeni kurulumda ekibe gelen çalışanlar; rol ve ücretleri Ekip sayfasından girilir. */
export const DEFAULT_TEAM = [
  { name: 'Ersagun Yılmaz', color: '#6d5efc' },
  { name: 'Mehmet Alp Karamavuş', color: '#0ea5e9' },
  { name: 'Mehmet Akif Soyuslu', color: '#ec4899' },
  { name: 'Kuddusi Köksal', color: '#f59e0b' },
];

/**
 * Varsayılan ekibi bir kez ekler (yeni kurulum, sıfırlama, bu özellikten önceki veri ya da yedek). Aynı adda çalışan
 * varsa o kişi atlanır; sonradan silinen kişi geri gelmez. Değişiklik olduysa true döner.
 */
export function seedDefaultTeam(s) {
  if (s.settings.teamSeeded) return false;
  const names = new Set(s.members.map((m) => norm(m.name).trim()));
  const at = new Date().toISOString();
  for (const { name, color } of DEFAULT_TEAM) {
    if (names.has(norm(name))) continue;
    s.members.push({ id: uid(), name, role: '', phone: '', email: '', costRate: 0, billRate: 0, weeklyCapacity: 40, color, active: true, createdAt: at, updatedAt: at });
  }
  s.settings.teamSeeded = true;
  return true;
}

export function emptyState() {
  const s = { version: SCHEMA_VERSION, settings: structuredClone(DEFAULT_SETTINGS) };
  for (const c of COLLECTIONS) s[c] = [];
  return s;
}

/** Bilinmeyen ya da eksik veriyi geçerli duruma getirir (yedek yükleme ve sürüm yükseltme). */
export function normalize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Geçersiz veri dosyası.');
  const s = emptyState();
  const settings = input.settings && typeof input.settings === 'object' ? input.settings : {};
  s.settings = { ...s.settings, ...settings, company: { ...s.settings.company, ...(settings.company ?? {}) } };
  // Logo yalnızca resim veri adresi olabilir (yedek dosyasından başka bir şey gelmesin)
  if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(String(s.settings.company.logo ?? ''))) s.settings.company.logo = '';
  for (const c of COLLECTIONS) {
    const list = Array.isArray(input[c]) ? input[c] : [];
    s[c] = list.filter((x) => x && typeof x === 'object' && typeof x.id === 'string' && x.id);
  }
  for (const p of s.projects) p.memberIds = Array.isArray(p.memberIds) ? p.memberIds.filter((id) => typeof id === 'string') : [];
  for (const q of s.quotes) q.items = Array.isArray(q.items) ? q.items.filter((i) => i && typeof i === 'object') : [];
  for (const t of s.templates) t.items = Array.isArray(t.items) ? t.items.filter((i) => i && typeof i === 'object') : [];
  s.version = SCHEMA_VERSION;
  return s;
}

function readStorage() {
  try {
    const text = localStorage.getItem(KEY);
    return text ? normalize(JSON.parse(text)) : emptyState();
  } catch {
    return emptyState();
  }
}

let state = typeof localStorage === 'undefined' ? emptyState() : readStorage();
const listeners = new Set();
let errorHandler = (err) => console.error(err);
if (typeof localStorage !== 'undefined' && seedDefaultTeam(state)) persist();

function notify(change) {
  for (const fn of listeners) fn(change);
}

function persist() {
  if (typeof localStorage === 'undefined') return true;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    errorHandler(err);
    return false;
  }
}

const now = () => new Date().toISOString();

export const store = {
  get state() { return state; },

  onError(fn) { errorHandler = fn; },

  /** Değişiklik dinleyicisi; dönüş değeri aboneliği kaldırır. */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  get(collection, id) {
    return state[collection].find((x) => x.id === id) ?? null;
  },

  /** Ekler ya da günceller; kaydı döndürür. `silent`: açık ekran yeniden çizilmez (düzenleyiciler için). */
  upsert(collection, obj, { silent = false, log } = {}) {
    const list = state[collection];
    const i = obj.id ? list.findIndex((x) => x.id === obj.id) : -1;
    const record = i >= 0
      ? { ...list[i], ...obj, updatedAt: now() }
      : { ...obj, id: obj.id || uid(), createdAt: obj.createdAt || now(), updatedAt: now() };
    if (i >= 0) list[i] = record;
    else list.push(record);
    if (log) addActivity(log);
    persist();
    if (!silent) notify({ collection, id: record.id });
    return record;
  },

  /** Kaydı siler; ilişkili kayıtları tutarlı bırakır (ayrıntı: cascade). */
  remove(collection, id, { log } = {}) {
    cascade(collection, id);
    state[collection] = state[collection].filter((x) => x.id !== id);
    if (log) addActivity(log);
    persist();
    notify({ collection, id });
  },

  /** Silinmeden önce kullanıcıya gösterilecek bağlı kayıt sayıları. */
  references(collection, id) {
    if (collection === 'clients') {
      return {
        projects: state.projects.filter((p) => p.clientId === id).length,
        quotes: state.quotes.filter((q) => q.clientId === id).length,
      };
    }
    if (collection === 'projects') {
      return {
        tasks: state.tasks.filter((t) => t.projectId === id).length,
        timeEntries: state.timeEntries.filter((e) => e.projectId === id).length,
        expenses: state.expenses.filter((x) => x.projectId === id).length,
        quotes: state.quotes.filter((q) => q.projectId === id).length,
      };
    }
    if (collection === 'members') {
      return { tasks: state.tasks.filter((t) => t.assigneeId === id && t.status !== 'done').length };
    }
    return {};
  },

  updateSettings(patch, { silent = false } = {}) {
    state.settings = {
      ...state.settings,
      ...patch,
      company: { ...state.settings.company, ...(patch.company ?? {}) },
    };
    persist();
    if (!silent) notify({ collection: 'settings' });
  },

  /** Tüm veriyi değiştirir (yedekten yükleme, örnek veri). */
  replaceAll(next) {
    const previous = state;
    state = normalize(next);
    seedDefaultTeam(state);
    if (!persist()) {
      state = previous;
      throw new Error('Veri kaydedilemedi (tarayıcı depolama alanı dolu olabilir).');
    }
    notify({ collection: '*' });
  },

  reset() {
    state = emptyState();
    seedDefaultTeam(state);
    persist();
    notify({ collection: '*' });
  },

  exportJson() {
    return JSON.stringify({ ...state, exportedAt: now(), app: 'proje-yonetimi' }, null, 2);
  },

  /** Başka sekmede yapılan değişikliği yükle. */
  reload() {
    state = readStorage();
    notify({ collection: '*' });
  },

  log(text) {
    addActivity(text);
    persist();
  },

  storageBytes() {
    try { return (localStorage.getItem(KEY) ?? '').length * 2; } catch { return 0; }
  },
};

function addActivity(text) {
  state.activity.unshift({ id: uid(), at: now(), text });
  if (state.activity.length > 200) state.activity.length = 200;
}

function cascade(collection, id) {
  switch (collection) {
    case 'projects':
      // Proje silinince görevleri, çalışma kayıtları ve giderleri de silinir; teklifler kalır, bağı kopar
      state.tasks = state.tasks.filter((t) => t.projectId !== id);
      state.timeEntries = state.timeEntries.filter((e) => e.projectId !== id);
      state.expenses = state.expenses.filter((x) => x.projectId !== id);
      for (const q of state.quotes) if (q.projectId === id) q.projectId = null;
      break;
    case 'members':
      // Çalışan silinince görevleri atanmamış olur; geçmiş çalışma kayıtları (maliyet) adıyla kalır
      for (const t of state.tasks) if (t.assigneeId === id) t.assigneeId = null;
      for (const p of state.projects) {
        p.memberIds = (p.memberIds ?? []).filter((m) => m !== id);
        if (p.managerId === id) p.managerId = null;
      }
      break;
    case 'tasks':
      // Çalışma kayıtları projenin maliyetinde kalır, yalnızca görev bağı kopar
      for (const e of state.timeEntries) if (e.taskId === id) e.taskId = null;
      break;
    case 'clients':
      for (const p of state.projects) if (p.clientId === id) p.clientId = null;
      for (const q of state.quotes) if (q.clientId === id) q.clientId = null;
      break;
    default:
      break;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) store.reload();
  });
}
