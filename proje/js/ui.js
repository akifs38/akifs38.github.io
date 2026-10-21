// ui.js — Arayüz parçaları: ikonlar, rozetler, avatar, ilerleme çubuğu, boş durum, bildirim, onay ve form pencereleri.

import { html, raw, esc, initials, today } from './util.js';
import { PROJECT_STATUS, TASK_STATUS, PRIORITY, QUOTE_STATUS } from './calc.js';

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2c2.8.3 5 2.4 5 5.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tasks: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
  quote: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/>',
  package: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  chart: '<path d="M3 20h18"/><rect x="5" y="11" width="3" height="6" rx=".5"/><rect x="10.5" y="5" width="3" height="12" rx=".5"/><rect x="16" y="8" width="3" height="9" rx=".5"/>',
  settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2"/><circle cx="16" cy="14.5" r="1.2"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 20h16"/>',
  message: '<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="8" rx="1.5"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};

export const icon = (name, size = 18) =>
  raw(`<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ''}</svg>`);

const TONES = {
  project: { teklif: 'violet', planlandi: 'blue', devam: 'green', beklemede: 'amber', tamamlandi: 'gray', iptal: 'red' },
  task: { todo: 'gray', doing: 'blue', review: 'amber', done: 'green' },
  quote: { draft: 'gray', sent: 'blue', accepted: 'green', rejected: 'red', expired: 'amber' },
  priority: { low: 'gray', normal: 'blue', high: 'amber', urgent: 'red' },
};
const LABELS = { project: PROJECT_STATUS, task: TASK_STATUS, quote: QUOTE_STATUS, priority: PRIORITY };

export const badge = (text, tone = 'gray') => html`<span class="badge badge-${tone}">${text}</span>`;
export const statusBadge = (kind, value) => badge(LABELS[kind][value] ?? value, TONES[kind][value] ?? 'gray');

export function avatar(member, size = 28) {
  if (!member) return html`<span class="avatar avatar-empty" style="--s:${size}px" title="Atanmamış">${icon('user', size * 0.55)}</span>`;
  return html`<span class="avatar" style="--s:${size}px;--c:${safeColor(member.color)}" title="${member.name}">${initials(member.name)}</span>`;
}

export const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c ?? '') ? c : '#6d5efc');

export function progress(pct, tone) {
  const v = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const t = tone ?? (v >= 100 ? 'green' : 'violet');
  return html`<div class="progress" role="progressbar" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"><span class="progress-${t}" style="width:${v}%"></span></div>`;
}

export function empty(iconName, title, text, action = '') {
  return html`<div class="empty">${icon(iconName, 36)}<h3>${title}</h3><p>${text}</p>${action}</div>`;
}

/** Teslim tarihi rozeti: geciktiyse kırmızı, 3 gün içindeyse sarı. */
export function dueBadge(dueIso, done = false) {
  if (!dueIso) return '';
  const t = today();
  const [y, m, d] = dueIso.split('-');
  const label = `${d}.${m}.${y.slice(2)}`;
  if (done) return html`<span class="due">${icon('calendar', 13)} ${label}</span>`;
  if (dueIso < t) return html`<span class="due due-late">${icon('alert', 13)} ${label}</span>`;
  const soon = new Date(+y, +m - 1, +d) - new Date() < 3 * 86400000;
  return html`<span class="due ${soon ? 'due-soon' : ''}">${icon('calendar', 13)} ${label}</span>`;
}

/** Açık sayfayı yeniden çiz (süzgeç değişince). */
export const refresh = () => window.dispatchEvent(new Event('app:refresh'));

/** Yeniden çiz, odaktaki arama kutusunu ve imleci koru. */
export function refreshKeepingFocus(selector) {
  const before = document.querySelector(selector);
  const pos = before?.selectionStart ?? null;
  refresh();
  const after = document.querySelector(selector);
  if (after) {
    after.focus();
    if (pos != null) after.setSelectionRange(pos, pos);
  }
}

// ---------- Bildirim ----------
let toastHost;
export function toast(message, tone = 'ok') {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toasts';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.append(toastHost);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${tone}`;
  el.textContent = message;
  toastHost.append(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}

// ---------- Pencere ----------
const openModals = [];

export function modal({ title, body, footer = '', wide = false, onClose }) {
  const lastFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = String(html`
    <div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${title}">
      <header class="modal-head"><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="Kapat">${icon('x')}</button></header>
      <div class="modal-body">${body}</div>
      ${footer ? html`<footer class="modal-foot">${footer}</footer>` : ''}
    </div>`);
  document.body.append(wrap);
  document.body.classList.add('no-scroll');
  const api = {
    el: wrap,
    close() {
      if (!wrap.isConnected) return;
      wrap.remove();
      openModals.splice(openModals.indexOf(api), 1);
      if (!openModals.length) document.body.classList.remove('no-scroll');
      onClose?.();
      lastFocus?.focus?.();
    },
  };
  openModals.push(api);
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) api.close(); });
  wrap.querySelector('[data-close]').addEventListener('click', () => api.close());
  requestAnimationFrame(() => (wrap.querySelector('[autofocus], input:not([type=hidden]), select, textarea, button.btn-primary') ?? wrap.querySelector('.modal'))?.focus());
  return api;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openModals.length) {
    e.preventDefault();
    openModals[openModals.length - 1].close();
  }
});

export const closeAllModals = () => [...openModals].forEach((m) => m.close());

export function confirmDialog(message, { title = 'Emin misiniz?', ok = 'Evet', danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const m = modal({
      title,
      body: html`<p class="confirm-text">${message}</p>`,
      footer: html`<button type="button" class="btn" data-no>Vazgeç</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${ok}</button>`,
      onClose: () => { if (!answered) resolve(false); },
    });
    m.el.querySelector('[data-no]').addEventListener('click', () => m.close());
    m.el.querySelector('[data-yes]').addEventListener('click', () => { answered = true; m.close(); resolve(true); });
    requestAnimationFrame(() => m.el.querySelector('[data-yes]').focus());
  });
}

// ---------- Form ----------
// Alan: { name, label, type: text|textarea|number|money|date|select|email|tel|color|checkbox|checks, required, options: [[değer, etiket]],
//         placeholder, hint, min, max, step, full (iki sütun kaplar), action: { label, icon, run(form) } }

function fieldHtml(f, value) {
  const id = `f-${f.name}`;
  const req = f.required ? raw(' required') : '';
  const common = html`id="${id}" name="${f.name}"${req}${f.placeholder ? html` placeholder="${f.placeholder}"` : ''}`;
  let control;
  switch (f.type) {
    case 'textarea':
      control = html`<textarea ${common} rows="${f.rows ?? 3}">${value ?? ''}</textarea>`;
      break;
    case 'select':
      control = html`<select ${common}>${(f.options ?? []).map(([v, l]) => html`<option value="${v}" ${String(v) === String(value ?? '') ? raw('selected') : ''}>${l}</option>`)}</select>`;
      break;
    case 'checkbox':
      return html`<label class="check ${f.full ? 'full' : ''}"><input type="checkbox" ${common} ${value ? raw('checked') : ''}> <span>${f.label}</span></label>`;
    case 'checks': {
      const set = new Set(value ?? []);
      control = (f.options ?? []).length
        ? html`<div class="checks" id="${id}">${f.options.map(([v, l]) => html`<label class="check"><input type="checkbox" name="${f.name}" value="${v}" ${set.has(v) ? raw('checked') : ''}> <span>${l}</span></label>`)}</div>`
        : html`<p class="muted small">${f.emptyText ?? 'Seçenek yok.'}</p>`;
      break;
    }
    case 'money':
    case 'number':
      control = html`<input type="number" inputmode="decimal" ${common} value="${value ?? ''}" step="${f.step ?? (f.type === 'money' ? '0.01' : 'any')}"${f.min != null ? html` min="${f.min}"` : ''}${f.max != null ? html` max="${f.max}"` : ''}>`;
      break;
    default:
      control = html`<input type="${f.type ?? 'text'}" ${common} value="${value ?? ''}"${f.maxlength ? html` maxlength="${f.maxlength}"` : ''}>`;
  }
  const action = f.action ? html`<button type="button" class="btn btn-sm btn-soft" data-field-action="${f.name}">${f.action.icon ? icon(f.action.icon, 15) : ''} ${f.action.label}</button>` : '';
  return html`<div class="field ${f.full || f.type === 'textarea' || f.type === 'checks' ? 'full' : ''}">
    <label for="${id}">${f.label}${f.required ? html` <span class="req" aria-hidden="true">*</span>` : ''}</label>
    ${f.action ? html`<div class="field-row">${control}${action}</div>` : control}
    ${f.hint ? html`<small class="hint">${f.hint}</small>` : ''}
  </div>`;
}

export function readForm(form, fields) {
  const out = {};
  for (const f of fields) {
    if (f.type === 'checks') {
      out[f.name] = [...form.querySelectorAll(`input[name="${f.name}"]:checked`)].map((i) => i.value);
      continue;
    }
    const el = form.elements[f.name];
    if (!el) continue;
    if (f.type === 'checkbox') out[f.name] = el.checked;
    else if (f.type === 'number' || f.type === 'money') out[f.name] = el.value === '' ? (f.emptyNull ? null : 0) : Number(el.value);
    else out[f.name] = el.value.trim();
  }
  return out;
}

/**
 * Form penceresi. onSubmit(değerler) bir hata metni döndürürse gösterilir ve pencere açık kalır.
 * extraButtons: [{ label, tone, run(close) }] (ör. sil).
 */
export function formDialog({ title, fields, values = {}, submit = 'Kaydet', onSubmit, wide = false, extraButtons = [], intro = '' }) {
  const formId = `form-${Math.random().toString(36).slice(2)}`;
  const m = modal({
    title,
    wide,
    body: html`${intro}<form id="${formId}" class="form-grid" novalidate>${fields.map((f) => fieldHtml(f, values[f.name]))}<p class="form-error" role="alert" hidden></p></form>`,
    footer: html`${extraButtons.map((b, i) => html`<button type="button" class="btn ${b.tone === 'danger' ? 'btn-danger-ghost' : ''} push-left" data-extra="${i}">${b.label}</button>`)}
      <button type="button" class="btn" data-close-btn>Vazgeç</button>
      <button type="submit" form="${formId}" class="btn btn-primary">${submit}</button>`,
  });
  const form = m.el.querySelector('form');
  const error = form.querySelector('.form-error');
  m.el.querySelector('[data-close-btn]').addEventListener('click', () => m.close());
  m.el.querySelectorAll('[data-extra]').forEach((b) => b.addEventListener('click', () => extraButtons[+b.dataset.extra].run(() => m.close())));
  m.el.querySelectorAll('[data-field-action]').forEach((b) => b.addEventListener('click', () => {
    fields.find((f) => f.name === b.dataset.fieldAction).action.run(form);
  }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    const missing = fields.find((f) => f.required && !String(form.elements[f.name]?.value ?? '').trim());
    if (missing) {
      error.textContent = `"${missing.label}" alanı zorunlu.`;
      error.hidden = false;
      form.elements[missing.name]?.focus();
      return;
    }
    const result = await onSubmit(readForm(form, fields), form);
    if (typeof result === 'string') {
      error.textContent = result;
      error.hidden = false;
      return;
    }
    m.close();
  });
  return m;
}

/** Açılır menü (ör. hızlı ekle): items [{ label, icon, run }] */
export function popMenu(anchor, items) {
  document.querySelectorAll('.pop-menu').forEach((p) => p.remove());
  const menu = document.createElement('div');
  menu.className = 'pop-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = items.map((it, i) => `<button type="button" role="menuitem" data-i="${i}">${it.icon ? icon(it.icon, 16) : ''}<span>${esc(it.label)}</span></button>`).join('');
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  const left = Math.min(r.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8);
  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top = `${r.bottom + 6 + window.scrollY}px`;
  const close = () => { menu.remove(); document.removeEventListener('mousedown', outside, true); };
  const outside = (e) => { if (!menu.contains(e.target)) close(); };
  setTimeout(() => document.addEventListener('mousedown', outside, true));
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    close();
    items[+b.dataset.i].run();
  });
  menu.querySelector('button')?.focus();
  menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); anchor.focus(); } });
}
