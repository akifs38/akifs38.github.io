// Hazır kalemler (ürün/hizmet fiyat listesi) ve teklif şablonları: tekliflere tek tıkla eklenir.

import { store } from '../store.js';
import { html, money, matches, byName, pct, toCsv, download, today } from '../util.js';
import { quoteTotals } from '../calc.js';
import { icon, empty, refresh, refreshKeepingFocus, confirmDialog, toast, formDialog } from '../ui.js';
import { catalogForm, go } from '../forms.js';

let tab = 'items';
let query = '';

export default {
  title: 'Hazır kalemler ve şablonlar',
  actions: () => (tab === 'items'
    ? html`<button type="button" class="btn btn-ghost hide-sm" data-act="csv">${icon('download')} CSV</button><button type="button" class="btn btn-primary" data-act="new-item">${icon('plus')} Kalem</button>`
    : html`<button type="button" class="btn btn-primary" data-act="new-template">${icon('plus')} Şablon</button>`),
  mountActions(el) {
    el.querySelector('[data-act="new-item"]')?.addEventListener('click', () => catalogForm());
    el.querySelector('[data-act="new-template"]')?.addEventListener('click', newTemplate);
    el.querySelector('[data-act="csv"]')?.addEventListener('click', exportCsv);
  },
  render() {
    const s = store.state;
    return html`
      <nav class="tabs tabs-line" role="tablist">
        <button type="button" role="tab" class="tab ${tab === 'items' ? 'active' : ''}" data-tab="items">Hazır kalemler <span class="count">${s.catalog.length}</span></button>
        <button type="button" role="tab" class="tab ${tab === 'templates' ? 'active' : ''}" data-tab="templates">Teklif şablonları <span class="count">${s.templates.length}</span></button>
      </nav>
      ${tab === 'items' ? items() : templates()}`;
  },
  mount(el) {
    el.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; refresh(); return; }
      const act = e.target.closest('[data-act]');
      if (act) {
        const id = act.dataset.id;
        switch (act.dataset.act) {
          case 'new-item': catalogForm(); return;
          case 'new-template': newTemplate(); return;
          case 'use': go(`teklifler/yeni?template=${id}`); return;
          case 'edit-template': go(`katalog/sablon/${id}`); return;
          case 'del-template': {
            const tpl = store.get('templates', id);
            if (await confirmDialog(`"${tpl.name}" şablonu silinsin mi? Bu şablondan hazırlanan teklifler etkilenmez.`, { ok: 'Sil', danger: true })) {
              store.remove('templates', id);
              toast('Şablon silindi');
            }
            return;
          }
          default: break;
        }
      }
      const row = e.target.closest('[data-item]');
      if (row) catalogForm(store.get('catalog', row.dataset.item));
    });
    el.querySelector('[data-search]')?.addEventListener('input', (e) => {
      query = e.target.value;
      refreshKeepingFocus('[data-search]');
    });
  },
};

function items() {
  const s = store.state;
  const cur = s.settings.currency;
  if (!s.catalog.length) {
    return empty('package', 'Hazır kalem yok', 'Sık sattığınız ürün ve hizmetleri birim fiyatıyla bir kez girin; teklif hazırlarken listeden seçin.',
      html`<button type="button" class="btn btn-primary" data-act="new-item">${icon('plus')} İlk kalemi ekle</button>`);
  }
  const list = [...s.catalog].filter((c) => matches(query, c.name, c.category, c.description))
    .sort((a, b) => String(a.category ?? '').localeCompare(String(b.category ?? ''), 'tr') || byName(a, b));
  return html`
    <div class="toolbar"><label class="input-icon">${icon('search', 16)}<input type="search" data-search placeholder="Kalem ara" value="${query}" aria-label="Kalem ara"></label></div>
    <section class="card"><div class="table-wrap"><table class="table">
      <thead><tr><th>Kalem</th><th>Kategori</th><th>Birim</th><th class="r">Birim fiyat</th><th class="r">KDV</th><th class="r">Kâr payı</th></tr></thead>
      <tbody>${list.map((c) => html`<tr class="clickable" data-item="${c.id}">
        <td data-label="Kalem"><b>${c.name}</b>${c.description ? html`<br><small class="muted">${c.description}</small>` : ''}</td>
        <td data-label="Kategori">${c.category || '—'}</td><td data-label="Birim">${c.unit}</td>
        <td data-label="Birim fiyat" class="r">${money(c.unitPrice, cur)}</td><td data-label="KDV" class="r">%${c.vatRate}</td>
        <td data-label="Kâr payı" class="r">${Number(c.unitCost) > 0 && Number(c.unitPrice) > 0 ? pct(((c.unitPrice - c.unitCost) / c.unitPrice) * 100) : '—'}</td></tr>`)}</tbody>
    </table></div></section>`;
}

function templates() {
  const s = store.state;
  const cur = s.settings.currency;
  if (!s.templates.length) {
    return empty('copy', 'Şablon yok', 'Sık verdiğiniz teklifleri (ör. "Etkinlik paketi") şablon yapın. Bir teklifte ⋯ › "Şablon olarak kaydet" de kullanabilirsiniz.',
      html`<button type="button" class="btn btn-primary" data-act="new-template">${icon('plus')} Şablon oluştur</button>`);
  }
  return html`<div class="cards">${[...s.templates].sort(byName).map((t) => html`<article class="card template-card">
    <h3>${t.name}</h3>
    <p class="muted small">${t.description || `${t.items?.length ?? 0} satır`}</p>
    <ul class="mini-list">${(t.items ?? []).slice(0, 4).map((i) => html`<li><span>${i.description}</span><small>${i.qty} ${i.unit}</small></li>`)}${(t.items?.length ?? 0) > 4 ? html`<li class="muted">+${t.items.length - 4} satır</li>` : ''}</ul>
    <p class="template-total"><small class="muted">KDV hariç</small> <b>${money(quoteTotals({ items: t.items }).taxBase, cur)}</b></p>
    <footer class="btn-row">
      <button type="button" class="btn btn-sm btn-primary" data-act="use" data-id="${t.id}">${icon('quote', 15)} Teklif oluştur</button>
      <button type="button" class="btn btn-sm" data-act="edit-template" data-id="${t.id}">${icon('edit', 15)} Düzenle</button>
      <button type="button" class="icon-btn danger" data-act="del-template" data-id="${t.id}" aria-label="${t.name} şablonunu sil">${icon('trash', 16)}</button>
    </footer>
  </article>`)}</div>`;
}

function newTemplate() {
  formDialog({
    title: 'Yeni teklif şablonu',
    fields: [
      { name: 'name', label: 'Şablon adı', required: true, placeholder: 'Ör. Etkinlik paketi' },
      { name: 'description', label: 'Kısa açıklama' },
    ],
    submit: 'Oluştur ve satırları gir',
    onSubmit: (v) => {
      const t = store.upsert('templates', { ...v, items: [], notes: '', terms: store.state.settings.defaultTerms }, { silent: true });
      tab = 'templates';
      go(`katalog/sablon/${t.id}`);
    },
  });
}

function exportCsv() {
  const rows = [['Kalem', 'Açıklama', 'Kategori', 'Birim', 'Birim fiyat', 'KDV %', 'Birim maliyet']];
  for (const c of [...store.state.catalog].sort(byName)) {
    rows.push([c.name, c.description ?? '', c.category ?? '', c.unit, Number(c.unitPrice).toFixed(2).replace('.', ','), c.vatRate, c.unitCost ? Number(c.unitCost).toFixed(2).replace('.', ',') : '']);
  }
  download(`hazir-kalemler-${today()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
}
