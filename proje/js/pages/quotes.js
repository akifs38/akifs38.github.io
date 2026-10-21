// Fiyat teklifleri: duruma göre liste, toplamlar, şablondan teklif, CSV.

import { store } from '../store.js';
import { html, money, matches, fmtDate, today, toCsv, download } from '../util.js';
import { QUOTE_STATUS, quoteTotals, quoteStatus } from '../calc.js';
import { icon, statusBadge, empty, refresh, refreshKeepingFocus } from '../ui.js';
import { go } from '../forms.js';
import { pickTemplate } from './items-editor.js';

let filter = 'all';
let query = '';

function rows() {
  const s = store.state;
  const t = today();
  return s.quotes
    .map((q) => ({ q, status: quoteStatus(q, t), totals: quoteTotals(q), client: s.clients.find((c) => c.id === q.clientId) }))
    .sort((a, b) => String(b.q.date).localeCompare(String(a.q.date)) || String(b.q.number).localeCompare(String(a.q.number)));
}

export default {
  title: 'Fiyat teklifleri',
  actions: () => html`<button type="button" class="btn btn-ghost hide-sm" data-act="csv">${icon('download')} CSV</button>
    <button type="button" class="btn" data-act="template">${icon('copy')} <span class="hide-sm">Şablondan</span></button>
    <a class="btn btn-primary" href="#/teklifler/yeni">${icon('plus')} Yeni teklif</a>`,
  mountActions(el) {
    el.querySelector('[data-act="template"]').addEventListener('click', () => pickTemplate((t) => go(`teklifler/yeni?template=${t.id}`)));
    el.querySelector('[data-act="csv"]').addEventListener('click', exportCsv);
  },
  render() {
    const s = store.state;
    if (!s.quotes.length) {
      return empty('quote', 'Henüz teklif yok', 'Hazır kalemlerden, şablondan ya da bir projenin maliyetinden dakikalar içinde fiyat teklifi hazırlayın; A4 olarak yazdırın ya da PDF kaydedin.',
        html`<a class="btn btn-primary" href="#/teklifler/yeni">${icon('plus')} İlk teklifi hazırla</a>`);
    }
    const all = rows();
    const visible = all.filter((r) => (filter === 'all' || r.status === filter) && matches(query, r.q.number, r.q.title, r.client?.name));
    const sum = (list) => list.reduce((acc, r) => acc + r.totals.total, 0);
    const cur = s.settings.currency;
    const decided = all.filter((r) => ['accepted', 'rejected', 'expired'].includes(r.status));
    const rate = decided.length ? Math.round((decided.filter((r) => r.status === 'accepted').length / decided.length) * 100) : null;
    return html`
      <section class="kpis">
        <div class="kpi"><span class="kpi-label">Yanıt bekleyen</span><strong class="kpi-value">${money(sum(all.filter((r) => r.status === 'sent')), cur)}</strong><small class="kpi-sub">${all.filter((r) => r.status === 'sent').length} teklif</small></div>
        <div class="kpi kpi-green"><span class="kpi-label">Kabul edilen</span><strong class="kpi-value">${money(sum(all.filter((r) => r.status === 'accepted')), cur)}</strong><small class="kpi-sub">${all.filter((r) => r.status === 'accepted').length} teklif</small></div>
        <div class="kpi"><span class="kpi-label">Taslak</span><strong class="kpi-value">${all.filter((r) => r.status === 'draft').length}</strong><small class="kpi-sub">gönderilmedi</small></div>
        <div class="kpi"><span class="kpi-label">Kabul oranı</span><strong class="kpi-value">${rate == null ? '—' : `%${rate}`}</strong><small class="kpi-sub">sonuçlanan ${decided.length} teklifte</small></div>
      </section>
      <div class="toolbar">
        <div class="tabs" role="tablist">
          <button type="button" role="tab" class="tab ${filter === 'all' ? 'active' : ''}" data-filter="all">Tümü <span class="count">${all.length}</span></button>
          ${Object.entries(QUOTE_STATUS).map(([k, l]) => html`<button type="button" role="tab" class="tab ${filter === k ? 'active' : ''}" data-filter="${k}">${l} <span class="count">${all.filter((r) => r.status === k).length}</span></button>`)}
        </div>
        <label class="input-icon">${icon('search', 16)}<input type="search" data-search placeholder="No, konu ya da müşteri" value="${query}" aria-label="Teklif ara"></label>
      </div>
      ${visible.length ? html`<section class="card"><div class="table-wrap"><table class="table">
        <thead><tr><th>Teklif no</th><th>Müşteri / konu</th><th>Tarih</th><th>Geçerlilik</th><th class="r">KDV hariç</th><th class="r">Genel toplam</th><th>Durum</th></tr></thead>
        <tbody>${visible.map((r) => html`<tr class="clickable" data-href="teklifler/${r.q.id}">
          <td data-label="Teklif no"><b>${r.q.number}</b></td>
          <td data-label="Müşteri / konu">${r.client?.name ?? '—'}<br><small class="muted">${r.q.title || ''}</small></td>
          <td data-label="Tarih">${fmtDate(r.q.date)}</td>
          <td data-label="Geçerlilik">${fmtDate(r.q.validUntil)}</td>
          <td data-label="KDV hariç" class="r">${money(r.totals.taxBase, r.q.currency || cur)}</td>
          <td data-label="Genel toplam" class="r"><b>${money(r.totals.total, r.q.currency || cur)}</b></td>
          <td data-label="Durum">${statusBadge('quote', r.status)}</td></tr>`)}</tbody>
      </table></div></section>` : html`<p class="muted pad">Bu süzgece uyan teklif yok.</p>`}`;
  },
  mount(el) {
    el.addEventListener('click', (e) => {
      const f = e.target.closest('[data-filter]');
      if (f) { filter = f.dataset.filter; refresh(); return; }
      const row = e.target.closest('[data-href]');
      if (row) go(row.dataset.href);
    });
    el.querySelector('[data-search]')?.addEventListener('input', (e) => {
      query = e.target.value;
      refreshKeepingFocus('[data-search]');
    });
  },
};

function exportCsv() {
  const csvRows = [['Teklif no', 'Tarih', 'Geçerlilik', 'Müşteri', 'Konu', 'Durum', 'Para birimi', 'KDV hariç', 'KDV', 'Genel toplam']];
  const n = (v) => v.toFixed(2).replace('.', ',');
  for (const r of rows()) {
    csvRows.push([r.q.number, fmtDate(r.q.date), fmtDate(r.q.validUntil), r.client?.name ?? '', r.q.title ?? '', QUOTE_STATUS[r.status], r.q.currency || store.state.settings.currency, n(r.totals.taxBase), n(r.totals.vatTotal), n(r.totals.total)]);
  }
  download(`teklifler-${today()}.csv`, toCsv(csvRows), 'text/csv;charset=utf-8');
}
