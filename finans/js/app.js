// app.js — Uygulama çekirdeği: önyükleme, düzen (sidebar + üst bar + alt nav),
// yönlendirme, ay durumu, hızlı harcama (FAB), tema.

import { el, qs, monthLabel, todayYM } from './utils.js';
import { store } from './store.js';
import { openModal, toast } from './ui.js';
import { renderAuth } from './auth.js';
import { transactionForm } from './forms.js';
import { cloud, initCloud, onAuth, signOutCloud, loadData, saveData, subscribe } from './cloud.js';

import { renderDashboard } from './page-dashboard.js';
import { renderTransactions, renderIncome, renderExpenses } from './page-transactions.js';
import { renderBudget } from './page-budget.js';
import { renderAccounts } from './page-accounts.js';
import { renderReports } from './page-reports.js';
import { renderSettings } from './page-settings.js';
import { renderPayments } from './page-payments.js';

const NAV = [
  { id: 'dashboard', hash: '#/', label: 'Dashboard', icon: '🏠', render: renderDashboard },
  { id: 'islemler', hash: '#/islemler', label: 'İşlemler', icon: '📋', render: renderTransactions },
  { id: 'gelirler', hash: '#/gelirler', label: 'Gelirler', icon: '📈', render: renderIncome },
  { id: 'giderler', hash: '#/giderler', label: 'Giderler', icon: '📉', render: renderExpenses },
  { id: 'odemeler', hash: '#/odemeler', label: 'Ödemeler', icon: '🔔', render: renderPayments },
  { id: 'butce', hash: '#/butce', label: 'Bütçe', icon: '🎯', render: renderBudget },
  { id: 'hesaplar', hash: '#/hesaplar', label: 'Hesaplar', icon: '🏦', render: renderAccounts },
  { id: 'raporlar', hash: '#/raporlar', label: 'Raporlar', icon: '📊', render: renderReports },
  { id: 'ayarlar', hash: '#/ayarlar', label: 'Ayarlar', icon: '⚙️', render: renderSettings },
];

// Mobil alt navigasyon (ortada + butonu)
const MOBILE_NAV = ['dashboard', 'islemler', 'odemeler', 'hesaplar'];

// Uygulama durumu
const state = { ym: todayYM() };

const app = () => qs('#app');

let cloudUnsub = null;      // Realtime DB dinleyici iptal fonksiyonu
let saveTimer = null;      // buluta yazmayı geciktirme (debounce)
let lastSyncedJson = null; // kendi yazımızın echo'sunu re-render'dan atla

function scheduleCloudSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!store.cloud || !store.userId) return;
    try {
      const json = JSON.stringify(store.data);
      lastSyncedJson = json;
      await saveData(store.userId, store.data);
    } catch (e) { console.error(e); toast('Bulut senkronu başarısız. İnternet?', 'error'); }
  }, 700);
}

export async function boot() {
  applyTheme('light');
  window.addEventListener('hashchange', () => { if (store.user) renderRoute(); });

  if (cloud.enabled) {
    let ok = false;
    try { ok = await initCloud(); } catch (e) { console.error('Bulut başlatılamadı', e); }
    if (ok && cloud.ready) { setupCloudAuth(); return; }
    // Firebase SDK yüklenemedi (ağ vb.) → yerel moda düş, ekran boş kalmasın
    cloud.enabled = false;
    toast('Bulut bağlantısı kurulamadı, yerel modda devam ediliyor.', 'error');
  }
  // Yerel mod (Firebase yapılandırılmadıysa mevcut davranış)
  if (store.restoreSession()) {
    applyTheme(store.data.settings.theme || 'light');
    renderShell();
  } else {
    renderAuth(app(), () => { applyTheme(store.data.settings.theme || 'light'); state.ym = todayYM(); location.hash = '#/'; renderShell(); });
  }
}

function setupCloudAuth() {
  // Yerel değişiklikleri buluta yaz (uzak veriyi uygularken değil)
  store.onChange(() => { if (store.cloud && store.userId && !store._applyingRemote) scheduleCloudSave(); });
  // Uzak veri geldiğinde görünümü tazele
  store.onRemote(() => { if (qs('#content')) renderRoute(); });

  onAuth(async (fbUser) => {
    if (fbUser) {
      store.activateCloud(fbUser);
      applyTheme(store.data.settings.theme || 'light');
      try {
        const json = await loadData(fbUser.uid);
        if (json) { lastSyncedJson = json; store.applyRemoteJSON(json); }
        else { const j = JSON.stringify(store.data); lastSyncedJson = j; await saveData(fbUser.uid, store.data); }
      } catch (e) { console.error('Bulut verisi okunamadı', e); toast('Bulut verisi okunamadı, yerel önbellekle devam.', 'error'); }

      if (cloudUnsub) cloudUnsub();
      cloudUnsub = subscribe(fbUser.uid, (json) => {
        if (json == null || json === lastSyncedJson) return; // kendi yazımız veya boş → atla
        lastSyncedJson = json;
        store.applyRemoteJSON(json);
      });

      state.ym = todayYM();
      if (!location.hash || location.hash === '#') location.hash = '#/';
      renderShell();
    } else {
      if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
      renderAuth(app(), () => {}); // giriş sonrası onAuth dinleyicisi ekranı çizer
    }
  });
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}

export async function logoutAndRedirect() {
  if (cloud.enabled) {
    if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
    lastSyncedJson = null;
    try { await signOutCloud(); } catch (e) { console.error(e); }
    store.cloud = false; store.userId = null; store.user = null;
    return; // onAuth dinleyicisi giriş ekranını gösterir
  }
  store.logout();
  location.hash = '';
  renderAuth(app(), () => { applyTheme(store.data.settings.theme || 'light'); location.hash = '#/'; renderShell(); });
}

function currentRoute() {
  const h = location.hash || '#/';
  return NAV.find((n) => n.hash === h) || NAV.find((n) => h.startsWith(n.hash) && n.hash !== '#/') || NAV[0];
}

function renderShell() {
  const root = app();
  root.innerHTML = '';

  const sidebar = buildSidebar();
  const main = el('div', { class: 'main' }, [
    buildTopbar(),
    el('div', { class: 'content', id: 'content' }),
  ]);
  const bottomNav = buildBottomNav();
  const fab = buildFab();

  root.append(
    el('div', { class: 'layout' }, [sidebar, main]),
    bottomNav,
    fab,
  );
  renderRoute();
}

function buildSidebar() {
  const links = NAV.map((n) => el('a', {
    class: 'nav-link', href: n.hash, dataset: { id: n.id },
  }, [el('span', { class: 'nav-icon', text: n.icon }), el('span', { class: 'nav-text', text: n.label })]));
  return el('aside', { class: 'sidebar' }, [
    el('div', { class: 'sidebar-brand' }, [
      el('div', { class: 'brand-logo', text: '₺' }),
      el('div', {}, [el('strong', { text: 'Finans' }), el('div', { class: 'muted small', text: 'Bütçe Yönetimi' })]),
    ]),
    el('nav', { class: 'nav' }, links),
    el('div', { class: 'sidebar-foot' }, [
      el('button', { class: 'btn btn-primary btn-block', text: '+ Hızlı Harcama', onClick: () => openQuickAdd() }),
      el('div', { class: 'muted small user-foot', text: store.user ? store.user.name : '' }),
    ]),
  ]);
}

function buildTopbar() {
  const prev = el('button', { class: 'icon-btn month-nav', html: '‹', 'aria-label': 'Önceki ay', onClick: () => shiftMonth(-1) });
  const next = el('button', { class: 'icon-btn month-nav', html: '›', 'aria-label': 'Sonraki ay', onClick: () => shiftMonth(1) });
  const label = el('button', { class: 'month-label', id: 'month-label', text: monthLabel(state.ym.year, state.ym.month), title: 'Bu aya dön', onClick: () => { state.ym = todayYM(); renderRoute(); } });
  const burger = el('button', { class: 'icon-btn menu-btn', 'aria-label': 'Menü', html: '☰', onClick: () => openMenu() });
  return el('header', { class: 'topbar' }, [
    el('div', { class: 'topbar-left' }, [
      burger,
      el('div', { class: 'topbar-title', id: 'topbar-title', text: 'Dashboard' }),
    ]),
    el('div', { class: 'month-picker' }, [prev, label, next]),
  ]);
}

// Mobil menü çekmecesi — tüm sayfalara erişim
function openMenu() {
  const overlay = el('div', { class: 'drawer-overlay' });
  const close = () => { overlay.classList.remove('show'); document.body.style.overflow = ''; setTimeout(() => overlay.remove(), 220); };

  const links = NAV.map((n) => el('a', {
    class: 'drawer-link' + (currentRoute().id === n.id ? ' active' : ''), href: n.hash,
    onClick: () => close(),
  }, [el('span', { class: 'nav-icon', text: n.icon }), el('span', { text: n.label })]));

  const drawer = el('aside', { class: 'drawer' }, [
    el('div', { class: 'drawer-brand' }, [
      el('div', { class: 'brand-logo', text: '₺' }),
      el('div', {}, [el('strong', { text: 'Finans' }), el('div', { class: 'muted small', text: store.user ? store.user.name : '' })]),
      el('button', { class: 'icon-btn drawer-close', html: '&times;', 'aria-label': 'Kapat', onClick: close }),
    ]),
    el('div', { class: 'drawer-actions' }, [
      el('button', { class: 'btn btn-primary btn-sm', text: '− Gider', onClick: () => { close(); openQuickAdd('expense'); } }),
      el('button', { class: 'btn btn-ghost btn-sm', text: '+ Gelir', onClick: () => { close(); openQuickAdd('income'); } }),
    ]),
    el('nav', { class: 'drawer-nav' }, links),
  ]);
  overlay.appendChild(drawer);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function shiftMonth(delta) {
  let { year, month } = state.ym;
  month += delta;
  while (month < 0) { month += 12; year -= 1; }
  while (month > 11) { month -= 12; year += 1; }
  state.ym = { year, month };
  renderRoute();
}

function buildBottomNav() {
  const items = [];
  const half = MOBILE_NAV.slice(0, 2);
  const half2 = MOBILE_NAV.slice(2);
  for (const id of half) items.push(mobileLink(id));
  items.push(el('button', { class: 'bnav-fab', 'aria-label': 'Hızlı harcama ekle', text: '+', onClick: () => openQuickAdd() }));
  for (const id of half2) items.push(mobileLink(id));
  return el('nav', { class: 'bottom-nav' }, items);
}

function mobileLink(id) {
  const n = NAV.find((x) => x.id === id);
  return el('a', { class: 'bnav-link', href: n.hash, dataset: { id: n.id } }, [
    el('span', { class: 'bnav-icon', text: n.icon }),
    el('span', { class: 'bnav-label', text: n.label }),
  ]);
}

function buildFab() {
  // Masaüstünde sağ altta sabit hızlı harcama butonu
  return el('button', { class: 'fab-desktop', 'aria-label': 'Hızlı harcama', title: 'Hızlı Harcama', text: '+', onClick: () => openQuickAdd() });
}

function renderRoute() {
  const route = currentRoute();
  const content = qs('#content');
  if (!content) { renderShell(); return; }
  content.innerHTML = '';

  // Aktif nav işaretle
  document.querySelectorAll('.nav-link, .bnav-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.id === route.id);
  });
  const title = qs('#topbar-title'); if (title) title.textContent = route.label;
  const ml = qs('#month-label'); if (ml) ml.textContent = monthLabel(state.ym.year, state.ym.month);

  const ctx = {
    year: state.ym.year,
    month: state.ym.month,
    rerender: () => renderRoute(),
  };
  route.render(content, ctx);
  content.scrollTop = 0;
}

// Hızlı işlem modalı (bottom sheet) — gider/gelir toggle'lı, her yerden çağrılabilir
export function openQuickAdd(initialType = 'expense') {
  if (!store.accounts.length) {
    toast('Önce bir hesap ekleyin.', 'error');
    location.hash = '#/hesaplar';
    return;
  }
  const m = openModal({
    title: '⚡ Hızlı Ekle',
    sheet: true,
    body: transactionForm({
      mode: 'quick',
      initialType,
      onDone: () => { m.close(); renderRoute(); },
    }),
  });
}
