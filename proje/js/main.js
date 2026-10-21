// main.js — Uygulama kabuğu: kenar menü, üst çubuk, adres (#/...) yönlendirmesi, arama, hızlı ekle ve tema.

import { store } from './store.js';
import { html, matches, esc } from './util.js';
import { icon, toast, popMenu, closeAllModals } from './ui.js';
import { go, clientForm, memberForm, projectForm, taskForm, timeEntryForm, expenseForm } from './forms.js';
import dashboard from './pages/dashboard.js';
import clients from './pages/clients.js';
import team from './pages/team.js';
import projects from './pages/projects.js';
import project from './pages/project.js';
import tasks from './pages/tasks.js';
import quotes from './pages/quotes.js';
import quoteEdit from './pages/quote-edit.js';
import quotePrint from './pages/quote-print.js';
import catalog from './pages/catalog.js';
import templateEdit from './pages/template-edit.js';
import reports from './pages/reports.js';
import settings from './pages/settings.js';

const NAV = [
  { path: '', label: 'Kontrol paneli', icon: 'home' },
  { path: 'projeler', label: 'Projeler', icon: 'folder' },
  { path: 'gorevler', label: 'Görevler', icon: 'tasks' },
  { path: 'teklifler', label: 'Fiyat teklifleri', icon: 'quote' },
  { path: 'musteriler', label: 'Müşteriler', icon: 'briefcase' },
  { path: 'ekip', label: 'Ekip', icon: 'users' },
  { path: 'katalog', label: 'Hazır kalemler', icon: 'package' },
  { path: 'raporlar', label: 'Raporlar', icon: 'chart' },
  { path: 'ayarlar', label: 'Ayarlar', icon: 'settings' },
];
const BOTTOM = ['', 'projeler', 'gorevler', 'teklifler'];

const ROUTES = [
  ['', dashboard],
  ['projeler', projects],
  ['projeler/:id', project],
  ['projeler/:id/:tab', project],
  ['gorevler', tasks],
  ['teklifler', quotes],
  ['teklifler/:id', quoteEdit], // "yeni": taslak oluşturulup kaydın adresine yönlenir
  ['teklifler/:id/yazdir', quotePrint],
  ['musteriler', clients],
  ['musteriler/:id', clients],
  ['ekip', team],
  ['ekip/:id', team],
  ['katalog', catalog],
  ['katalog/sablon/:id', templateEdit],
  ['raporlar', reports],
  ['ayarlar', settings],
];

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs));
  for (const [pattern, page] of ROUTES) {
    const pp = pattern.split('/').filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params = { query };
    if (pp.every((p, i) => (p.startsWith(':') ? ((params[p.slice(1)] = parts[i]), true) : p === parts[i]))) {
      return { page, params, section: parts[0] ?? '' };
    }
  }
  return { page: dashboard, params: { query }, section: '' };
}

// ---------- Kabuk ----------
const app = document.getElementById('app');
app.innerHTML = String(html`
  <aside class="sidebar" id="sidebar" aria-label="Ana menü">
    <a class="brand" href="#/">
      <span class="brand-mark">${icon('folder', 20)}</span>
      <span><strong>Proje Yönetimi</strong><small id="brand-company"></small></span>
    </a>
    <nav class="nav">${NAV.map((n) => html`<a href="#/${n.path}" data-nav="${n.path}">${icon(n.icon)}<span>${n.label}</span></a>`)}</nav>
    <div class="sidebar-foot">
      <button type="button" class="btn btn-quick" data-quick>${icon('plus')} Hızlı ekle</button>
      <p class="storage-note">${icon('database', 14)} Veriler bu tarayıcıda saklanır</p>
    </div>
  </aside>
  <div class="nav-overlay" data-nav-close></div>
  <div class="main">
    <header class="topbar">
      <button type="button" class="icon-btn menu-btn" data-nav-toggle aria-label="Menüyü aç">${icon('menu')}</button>
      <div class="titles"><h1 id="page-title">…</h1></div>
      <div class="search" role="search">
        ${icon('search', 16)}
        <input id="global-search" type="search" placeholder="Ara… ( / )" aria-label="Müşteri, proje, görev ya da teklif ara" autocomplete="off">
        <div class="search-results" id="search-results" hidden></div>
      </div>
      <div class="top-actions" id="page-actions"></div>
      <button type="button" class="icon-btn" data-theme-toggle aria-label="Temayı değiştir"></button>
    </header>
    <main id="view" tabindex="-1"></main>
  </div>
  <nav class="bottom-nav" aria-label="Alt menü">
    ${BOTTOM.map((p) => { const n = NAV.find((x) => x.path === p); return html`<a href="#/${p}" data-nav="${p}">${icon(n.icon)}<span>${n.label.split(' ')[0]}</span></a>`; })}
    <button type="button" data-quick aria-label="Hızlı ekle">${icon('plus')}<span>Ekle</span></button>
  </nav>`);

const view = document.getElementById('view');
const titleEl = document.getElementById('page-title');
const actionsEl = document.getElementById('page-actions');
let lastKey = '';

function render() {
  const { page, params, section } = parseHash();
  const redirect = page.redirect?.(params);
  if (redirect) {
    location.replace(`#/${redirect}`);
    return;
  }
  const key = location.hash;
  const sameRoute = key === lastKey;
  const scroll = sameRoute ? window.scrollY : 0;
  lastKey = key;

  document.querySelectorAll('[data-nav]').forEach((a) => {
    const active = a.dataset.nav === section;
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.body.classList.remove('nav-open');
  document.getElementById('brand-company').textContent = store.state.settings.company.name || 'Firma bilgisi girilmedi';

  const title = typeof page.title === 'function' ? page.title(params) : page.title;
  if (title == null) return; // sayfa yönlendirdi
  titleEl.textContent = title;
  document.title = `${title} · Proje Yönetimi`;
  actionsEl.innerHTML = String(page.actions?.(params) ?? '');
  page.mountActions?.(actionsEl, params);

  const container = document.createElement('div');
  container.className = `page page-${section || 'panel'}`;
  container.innerHTML = String(page.render(params));
  view.replaceChildren(container);
  document.body.classList.toggle('print-route', !!page.printRoute);
  page.mount?.(container, params);
  if (sameRoute) window.scrollTo(0, scroll);
  else { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
}

window.addEventListener('hashchange', () => { closeAllModals(); render(); });
window.addEventListener('app:refresh', () => render());
store.subscribe(() => render());
store.onError(() => toast('Kaydedilemedi: tarayıcı depolama alanı dolu. Ayarlar › Veri bölümünden yedek alıp eski kayıtları temizleyin.', 'error'));

// ---------- Menü (mobil) ----------
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-nav-toggle]')) document.body.classList.toggle('nav-open');
  else if (e.target.closest('[data-nav-close]')) document.body.classList.remove('nav-open');
  const quick = e.target.closest('[data-quick]');
  if (quick) quickAdd(quick);
  if (e.target.closest('[data-theme-toggle]')) cycleTheme();
});

function quickAdd(anchor) {
  const projectId = parseHash().section === 'projeler' ? parseHash().params.id : undefined;
  popMenu(anchor, [
    { label: 'Görev', icon: 'tasks', run: () => taskForm(null, { projectId }) },
    { label: 'Proje', icon: 'folder', run: () => projectForm() },
    { label: 'Fiyat teklifi', icon: 'quote', run: () => go('teklifler/yeni') },
    { label: 'Müşteri', icon: 'briefcase', run: () => clientForm() },
    { label: 'Ekip üyesi', icon: 'user', run: () => memberForm() },
    { label: 'Çalışma saati', icon: 'clock', run: () => timeEntryForm({ projectId }) },
    { label: 'Gider', icon: 'wallet', run: () => expenseForm(null, { projectId }) },
  ]);
}

// ---------- Tema ----------
const media = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const pref = store.state.settings.theme ?? 'auto';
  const dark = pref === 'dark' || (pref === 'auto' && media.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const btn = document.querySelector('[data-theme-toggle]');
  btn.innerHTML = String(icon(dark ? 'sun' : 'moon'));
  btn.title = { auto: 'Tema: sistem', light: 'Tema: açık', dark: 'Tema: koyu' }[pref];
}
function cycleTheme() {
  const next = { auto: 'light', light: 'dark', dark: 'auto' }[store.state.settings.theme ?? 'auto'];
  store.updateSettings({ theme: next }, { silent: true });
  applyTheme();
  toast({ auto: 'Tema: sisteme göre', light: 'Tema: açık', dark: 'Tema: koyu' }[next]);
}
media.addEventListener('change', applyTheme);
store.subscribe(applyTheme);

// ---------- Arama ----------
const searchInput = document.getElementById('global-search');
const results = document.getElementById('search-results');

function searchItems(q) {
  const s = store.state;
  const out = [];
  for (const p of s.projects) if (matches(q, p.name, p.code)) out.push({ icon: 'folder', label: p.name, sub: `Proje · ${p.code ?? ''}`, href: `projeler/${p.id}` });
  for (const c of s.clients) if (matches(q, c.name, c.contactName, c.phone, c.email)) out.push({ icon: 'briefcase', label: c.name, sub: 'Müşteri', href: `musteriler/${c.id}` });
  for (const t of s.tasks) if (matches(q, t.title)) out.push({ icon: 'tasks', label: t.title, sub: `Görev · ${s.projects.find((p) => p.id === t.projectId)?.name ?? ''}`, href: `projeler/${t.projectId}/gorevler`, task: t.id });
  for (const qt of s.quotes) if (matches(q, qt.number, qt.title)) out.push({ icon: 'quote', label: `${qt.number} ${qt.title ?? ''}`, sub: 'Teklif', href: `teklifler/${qt.id}` });
  for (const m of s.members) if (matches(q, m.name, m.role)) out.push({ icon: 'user', label: m.name, sub: `Ekip · ${m.role ?? ''}`, href: `ekip/${m.id}` });
  return out.slice(0, 10);
}

function showResults() {
  const q = searchInput.value.trim();
  if (!q) { results.hidden = true; return; }
  const items = searchItems(q);
  results.innerHTML = items.length
    ? items.map((r, i) => `<a href="#/${esc(r.href)}" class="${i === 0 ? 'first' : ''}">${icon(r.icon, 16)}<span><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></span></a>`).join('')
    : '<p class="muted small">Sonuç yok</p>';
  results.hidden = false;
}
searchInput.addEventListener('input', showResults);
searchInput.addEventListener('focus', showResults);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const first = results.querySelector('a');
    if (first) { location.hash = first.getAttribute('href'); searchInput.value = ''; results.hidden = true; searchInput.blur(); }
  } else if (e.key === 'Escape') { searchInput.value = ''; results.hidden = true; searchInput.blur(); }
});
results.addEventListener('click', () => { searchInput.value = ''; results.hidden = true; });
document.addEventListener('mousedown', (e) => { if (!e.target.closest('.search')) results.hidden = true; });
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) {
    e.preventDefault();
    searchInput.focus();
  }
});

applyTheme();
render();
