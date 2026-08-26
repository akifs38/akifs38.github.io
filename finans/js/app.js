// app.js — Uygulama çekirdeği: önyükleme, düzen (sidebar + üst bar + alt nav),
// yönlendirme, ay durumu, hızlı harcama (FAB), tema.

import { el, qs, monthLabel, todayYM } from './utils.js';
import { store } from './store.js';
import { openModal, toast } from './ui.js';
import { renderAuth } from './auth.js';
import { transactionForm } from './forms.js';

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

export function boot() {
  applyTheme('light');
  if (store.restoreSession()) {
    applyTheme(store.data.settings.theme || 'light');
    renderShell();
  } else {
    renderAuth(app(), () => { applyTheme(store.data.settings.theme || 'light'); state.ym = todayYM(); location.hash = '#/'; renderShell(); });
  }
  window.addEventListener('hashchange', () => { if (store.user) renderRoute(); });
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}

export function logoutAndRedirect() {
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
  return el('header', { class: 'topbar' }, [
    el('div', { class: 'topbar-title', id: 'topbar-title', text: 'Dashboard' }),
    el('div', { class: 'month-picker' }, [prev, label, next]),
  ]);
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

// Hızlı harcama modalı (bottom sheet) — her yerden çağrılabilir
export function openQuickAdd() {
  if (!store.accounts.length) {
    toast('Önce bir hesap ekleyin.', 'error');
    location.hash = '#/hesaplar';
    return;
  }
  const m = openModal({
    title: '⚡ Hızlı Harcama',
    sheet: true,
    body: transactionForm({
      mode: 'quick',
      onDone: () => { m.close(); renderRoute(); },
    }),
  });
}
