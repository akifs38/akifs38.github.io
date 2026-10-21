// Müşteriler: liste (arama) ve müşteri kartı (iletişim, projeler, teklifler, ciro).

import { store } from '../store.js';
import { html, money, matches, byName, fmtDate, today, toCsv, download } from '../util.js';
import { quoteTotals, quoteStatus, projectProgress, tasksOf } from '../calc.js';
import { icon, statusBadge, progress, empty } from '../ui.js';
import { clientForm, projectForm, go } from '../forms.js';
import { whatsappLink } from './share.js';

let query = '';

export default {
  title: (p) => (p.id ? store.get('clients', p.id)?.name ?? 'Müşteri bulunamadı' : 'Müşteriler'),
  actions: (p) => (p.id
    ? html`<a class="btn" href="#/musteriler">${icon('back')} <span class="hide-sm">Müşteriler</span></a>`
    : html`<button type="button" class="btn btn-ghost hide-sm" data-act="csv">${icon('download')} CSV</button><button type="button" class="btn btn-primary" data-act="new">${icon('plus')} Müşteri</button>`),
  mountActions(el) {
    el.querySelector('[data-act="new"]')?.addEventListener('click', () => clientForm(null, { onSaved: (c) => go(`musteriler/${c.id}`) }));
    el.querySelector('[data-act="csv"]')?.addEventListener('click', exportCsv);
  },
  render(p) {
    return p.id ? detail(p.id) : list();
  },
  mount(el, p) {
    if (!p.id) {
      const input = el.querySelector('[data-search]');
      input?.addEventListener('input', () => {
        query = input.value;
        el.querySelectorAll('[data-row]').forEach((r) => { r.hidden = !matches(query, r.dataset.row); });
      });
    }
    el.addEventListener('click', (e) => {
      const row = e.target.closest('[data-href]');
      if (row && !e.target.closest('a, button')) go(row.dataset.href);
      const act = e.target.closest('[data-act]')?.dataset.act;
      const client = p.id ? store.get('clients', p.id) : null;
      if (act === 'edit') clientForm(client);
      else if (act === 'project') projectForm(null, { clientId: p.id });
      else if (act === 'new') clientForm(null, { onSaved: (c) => go(`musteriler/${c.id}`) });
    });
  },
};

function stats(clientId) {
  const s = store.state;
  const quotes = s.quotes.filter((q) => q.clientId === clientId);
  const accepted = quotes.filter((q) => q.status === 'accepted');
  return {
    projects: s.projects.filter((p) => p.clientId === clientId),
    quotes,
    revenue: accepted.reduce((sum, q) => sum + quoteTotals(q).taxBase, 0),
  };
}

function list() {
  const s = store.state;
  const cur = s.settings.currency;
  if (!s.clients.length) {
    return empty('briefcase', 'Henüz müşteri yok', 'Müşteri adını, yetkili kişiyi ve iletişim bilgilerini ekleyin; projeler ve teklifler müşteriye bağlanır.',
      html`<button type="button" class="btn btn-primary" data-act="new">${icon('plus')} İlk müşteriyi ekle</button>`);
  }
  return html`
    <div class="toolbar"><label class="input-icon">${icon('search', 16)}<input type="search" data-search placeholder="Müşteri ara" value="${query}" aria-label="Müşteri ara"></label></div>
    <div class="card"><div class="table-wrap"><table class="table">
      <thead><tr><th>Müşteri</th><th>Yetkili</th><th>İletişim</th><th class="r">Proje</th><th class="r">Kabul edilen (KDV hariç)</th></tr></thead>
      <tbody>${[...s.clients].sort(byName).map((c) => {
        const st = stats(c.id);
        return html`<tr class="clickable" data-href="musteriler/${c.id}" data-row="${[c.name, c.contactName, c.phone, c.email].join(' ')}" ${matches(query, c.name, c.contactName, c.phone, c.email) ? '' : 'hidden'}>
          <td data-label="Müşteri"><b>${c.name}</b>${c.taxNo ? html`<br><small class="muted">VKN/TCKN ${c.taxNo}</small>` : ''}</td>
          <td data-label="Yetkili">${c.contactName || '—'}</td>
          <td data-label="İletişim">${c.phone ? html`<a href="tel:${c.phone.replace(/\s/g, '')}">${c.phone}</a>` : ''}${c.phone && c.email ? html`<br>` : ''}${c.email ? html`<a href="mailto:${c.email}">${c.email}</a>` : ''}${!c.phone && !c.email ? '—' : ''}</td>
          <td data-label="Proje" class="r">${st.projects.length}</td>
          <td data-label="Kabul edilen" class="r">${money(st.revenue, cur)}</td>
        </tr>`;
      })}</tbody></table></div></div>`;
}

function detail(id) {
  const s = store.state;
  const c = store.get('clients', id);
  if (!c) return empty('briefcase', 'Müşteri bulunamadı', 'Silinmiş olabilir.', html`<a class="btn" href="#/musteriler">Müşterilere dön</a>`);
  const cur = s.settings.currency;
  const st = stats(id);
  const t = today();
  const wa = whatsappLink(c.phone, `Merhaba ${c.contactName || c.name},`);
  return html`
    <div class="grid-side">
      <section class="card">
        <header class="card-head"><h2>Bilgiler</h2><button type="button" class="btn btn-sm" data-act="edit">${icon('edit', 15)} Düzenle</button></header>
        <dl class="info">
          <dt>Müşteri adı</dt><dd>${c.name}</dd>
          <dt>Yetkili</dt><dd>${c.contactName || '—'}</dd>
          <dt>Telefon</dt><dd>${c.phone ? html`<a href="tel:${c.phone.replace(/\s/g, '')}">${c.phone}</a>` : '—'}</dd>
          <dt>E-posta</dt><dd>${c.email ? html`<a href="mailto:${c.email}">${c.email}</a>` : '—'}</dd>
          <dt>Vergi dairesi / no</dt><dd>${[c.taxOffice, c.taxNo].filter(Boolean).join(' / ') || '—'}</dd>
          <dt>Adres</dt><dd class="pre">${c.address || '—'}</dd>
          ${c.notes ? html`<dt>Notlar</dt><dd class="pre">${c.notes}</dd>` : ''}
        </dl>
        <div class="btn-row">
          ${wa ? html`<a class="btn btn-sm" href="${wa}" target="_blank" rel="noopener">${icon('message', 15)} WhatsApp</a>` : ''}
          ${c.email ? html`<a class="btn btn-sm" href="mailto:${c.email}">${icon('mail', 15)} E-posta</a>` : ''}
        </div>
      </section>
      <div class="stack">
        <section class="kpis kpis-3">
          <div class="kpi"><span class="kpi-label">Projeler</span><strong class="kpi-value">${st.projects.length}</strong></div>
          <div class="kpi"><span class="kpi-label">Teklifler</span><strong class="kpi-value">${st.quotes.length}</strong></div>
          <div class="kpi kpi-green"><span class="kpi-label">Kabul edilen (KDV hariç)</span><strong class="kpi-value">${money(st.revenue, cur)}</strong></div>
        </section>
        <section class="card">
          <header class="card-head"><h2>Projeler</h2><button type="button" class="btn btn-sm" data-act="project">${icon('plus', 15)} Proje</button></header>
          ${st.projects.length ? html`<ul class="rows">${st.projects.map((p) => {
            const pr = projectProgress(tasksOf(s, p.id));
            return html`<li class="row clickable" data-href="projeler/${p.id}"><span class="row-icon">${icon('folder')}</span>
              <div class="grow"><b>${p.name}</b><small class="muted">${p.code} · teslim ${fmtDate(p.dueDate)}</small>${progress(pr.pct)}</div>${statusBadge('project', p.status)}</li>`;
          })}</ul>` : html`<p class="muted pad">Bu müşterinin projesi yok.</p>`}
        </section>
        <section class="card">
          <header class="card-head"><h2>Teklifler</h2><a class="btn btn-sm" href="#/teklifler/yeni?client=${id}">${icon('plus', 15)} Teklif</a></header>
          ${st.quotes.length ? html`<ul class="rows">${st.quotes.map((q) => html`<li class="row clickable" data-href="teklifler/${q.id}"><span class="row-icon">${icon('quote')}</span>
            <div class="grow"><b>${q.number}</b> ${q.title ?? ''}<small class="muted">${fmtDate(q.date)}</small></div>
            <span class="num">${money(quoteTotals(q).total, q.currency || cur)}</span>${statusBadge('quote', quoteStatus(q, t))}</li>`)}</ul>` : html`<p class="muted pad">Bu müşteriye teklif verilmedi.</p>`}
        </section>
      </div>
    </div>`;
}

function exportCsv() {
  const rows = [['Müşteri', 'Yetkili', 'Telefon', 'E-posta', 'Vergi dairesi', 'Vergi/TC no', 'Adres', 'Proje sayısı', 'Kabul edilen (KDV hariç)']];
  for (const c of [...store.state.clients].sort(byName)) {
    const st = stats(c.id);
    rows.push([c.name, c.contactName, c.phone, c.email, c.taxOffice, c.taxNo, c.address, st.projects.length, st.revenue.toFixed(2).replace('.', ',')]);
  }
  download(`musteriler-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}
