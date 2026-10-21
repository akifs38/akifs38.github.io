// Teklif satırları düzenleyicisi (teklif ve şablon ortak): satır ekle/sil/taşı, hazır kalemden ekle, şablondan ekle.
// Her değişiklikte onChange çağrılır; tablo yalnızca satır eklenip silinince yeniden çizilir (yazarken odak kaybolmaz).

import { store } from '../store.js';
import { html, money, matches, byName } from '../util.js';
import { lineAmounts, UNITS, VAT_RATES, quoteTotals } from '../calc.js';
import { icon, modal, toast } from '../ui.js';

export const blankItem = () => ({ description: '', detail: '', qty: 1, unit: 'adet', unitPrice: 0, discount: 0, vatRate: store.state.settings.vatRate });

export const itemFromCatalog = (c) => ({
  catalogId: c.id, description: c.name, detail: c.description ?? '', qty: 1, unit: c.unit || 'adet', unitPrice: Number(c.unitPrice) || 0, discount: 0, vatRate: Number(c.vatRate ?? store.state.settings.vatRate),
});

function rowHtml(item, i, count, currency) {
  const units = UNITS.includes(item.unit) ? UNITS : [item.unit, ...UNITS];
  return html`<tr data-i="${i}">
    <td class="c-no">${i + 1}</td>
    <td class="c-desc" data-label="Açıklama">
      <input data-k="description" value="${item.description ?? ''}" placeholder="Ürün / hizmet" aria-label="Satır ${i + 1} açıklama">
      <textarea data-k="detail" rows="1" placeholder="Ayrıntı (isteğe bağlı)" aria-label="Satır ${i + 1} ayrıntı">${item.detail ?? ''}</textarea>
    </td>
    <td class="c-qty" data-label="Miktar"><input type="number" inputmode="decimal" step="any" min="0" data-k="qty" value="${item.qty ?? 0}" aria-label="Miktar"></td>
    <td class="c-unit" data-label="Birim"><select data-k="unit" aria-label="Birim">${units.map((u) => html`<option ${u === item.unit ? 'selected' : ''}>${u}</option>`)}</select></td>
    <td class="c-price" data-label="Birim fiyat"><input type="number" inputmode="decimal" step="0.01" min="0" data-k="unitPrice" value="${item.unitPrice ?? 0}" aria-label="Birim fiyat"></td>
    <td class="c-disc" data-label="İsk. %"><input type="number" inputmode="decimal" step="any" min="0" max="100" data-k="discount" value="${item.discount ?? 0}" aria-label="İskonto yüzdesi"></td>
    <td class="c-vat" data-label="KDV"><select data-k="vatRate" aria-label="KDV oranı">${VAT_RATES.map((r) => html`<option value="${r}" ${Number(item.vatRate) === r ? 'selected' : ''}>%${r}</option>`)}</select></td>
    <td class="c-total r" data-label="Tutar" data-line-total>${money(lineAmounts(item).net, currency)}</td>
    <td class="c-act">
      <button type="button" class="icon-btn sm" data-row="up" ${i === 0 ? 'disabled' : ''} aria-label="Yukarı taşı">${icon('up', 15)}</button>
      <button type="button" class="icon-btn sm" data-row="down" ${i === count - 1 ? 'disabled' : ''} aria-label="Aşağı taşı">${icon('down', 15)}</button>
      <button type="button" class="icon-btn sm danger" data-row="del" aria-label="Satırı sil">${icon('trash', 15)}</button>
    </td>
  </tr>`;
}

export function itemsTableHtml(items, currency) {
  return html`<div class="items-wrap"><table class="items">
    <thead><tr><th class="c-no">#</th><th>Açıklama</th><th class="c-qty">Miktar</th><th class="c-unit">Birim</th><th class="c-price">Birim fiyat</th><th class="c-disc">İsk. %</th><th class="c-vat">KDV</th><th class="c-total r">Tutar</th><th class="c-act"><span class="sr-only">İşlemler</span></th></tr></thead>
    <tbody data-items>${items.map((it, i) => rowHtml(it, i, items.length, currency))}</tbody>
  </table>${items.length ? '' : html`<p class="muted pad items-empty">Henüz satır yok. Hazır kalemden ya da şablondan ekleyin.</p>`}</div>`;
}

export function itemsHtml(items, currency) {
  return html`${itemsTableHtml(items, currency)}
  <div class="btn-row items-actions">
    <button type="button" class="btn btn-sm" data-items="add">${icon('plus', 15)} Satır ekle</button>
    <button type="button" class="btn btn-sm" data-items="catalog">${icon('package', 15)} Hazır kalemden ekle</button>
    <button type="button" class="btn btn-sm" data-items="template">${icon('copy', 15)} Şablondan ekle</button>
  </div>`;
}

/**
 * Düzenleyiciyi bağlar. doc: { items } nesnesi (yerinde değiştirilir). onChange(yapıDeğişti) her değişiklikte çağrılır.
 */
export function bindItems(root, doc, { currency, onChange, onTemplate }) {
  const redraw = () => {
    const scrollY = window.scrollY;
    root.querySelector('.items-wrap').outerHTML = String(itemsTableHtml(doc.items, currency()));
    root.querySelectorAll('textarea[data-k="detail"]').forEach(autosize);
    window.scrollTo(0, scrollY);
  };
  const changed = (structural) => { if (structural) redraw(); onChange(structural); };

  root.addEventListener('input', (e) => {
    const field = e.target.closest('[data-k]');
    const row = e.target.closest('tr[data-i]');
    if (!field || !row) return;
    const item = doc.items[+row.dataset.i];
    const k = field.dataset.k;
    item[k] = ['qty', 'unitPrice', 'discount', 'vatRate'].includes(k) ? (field.value === '' ? 0 : Number(field.value)) : field.value;
    if (k === 'detail') autosize(field);
    row.querySelector('[data-line-total]').textContent = money(lineAmounts(item).net, currency());
    onChange(false);
  });
  root.addEventListener('change', (e) => {
    if (e.target.matches('select[data-k]')) e.target.dispatchEvent(new Event('input', { bubbles: true }));
  });
  root.addEventListener('click', (e) => {
    const rowBtn = e.target.closest('[data-row]');
    if (rowBtn) {
      const i = +rowBtn.closest('tr').dataset.i;
      if (rowBtn.dataset.row === 'del') doc.items.splice(i, 1);
      else {
        const j = rowBtn.dataset.row === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= doc.items.length) return;
        [doc.items[i], doc.items[j]] = [doc.items[j], doc.items[i]];
      }
      changed(true);
      return;
    }
    const act = e.target.closest('[data-items]')?.dataset.items;
    if (act === 'add') {
      doc.items.push(blankItem());
      changed(true);
      root.querySelector(`tr[data-i="${doc.items.length - 1}"] [data-k="description"]`)?.focus();
    } else if (act === 'catalog') {
      pickCatalog((c) => { doc.items.push(itemFromCatalog(c)); changed(true); });
    } else if (act === 'template') {
      pickTemplate((t) => {
        doc.items.push(...(t.items ?? []).map((x) => ({ ...x })));
        onTemplate?.(t);
        changed(true);
      });
    }
  });
  root.querySelectorAll('textarea[data-k="detail"]').forEach(autosize);
}

function autosize(t) {
  t.style.height = 'auto';
  t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
}

export function pickCatalog(onPick) {
  const list = [...store.state.catalog].sort(byName);
  const cur = store.state.settings.currency;
  if (!list.length) {
    toast('Hazır kalem yok; Hazır kalemler sayfasından ekleyin.', 'warn');
    return;
  }
  const m = modal({
    title: 'Hazır kalemden ekle',
    wide: true,
    body: html`<label class="input-icon block">${icon('search', 16)}<input type="search" data-pick-q placeholder="Kalem ara" aria-label="Kalem ara" autofocus></label>
      <ul class="pick-list">${list.map((c) => html`<li data-name="${[c.name, c.category, c.description].join(' ')}"><button type="button" data-pick="${c.id}">
        <span class="grow"><b>${c.name}</b><small class="muted">${[c.category, c.description].filter(Boolean).join(' · ')}</small></span>
        <span class="num">${money(c.unitPrice, cur)} / ${c.unit}</span>${icon('plus', 16)}</button></li>`)}</ul>`,
    footer: html`<button type="button" class="btn btn-primary" data-done>Bitti</button>`,
  });
  m.el.querySelector('[data-done]').addEventListener('click', () => m.close());
  m.el.querySelector('[data-pick-q]').addEventListener('input', (e) => {
    m.el.querySelectorAll('.pick-list li').forEach((li) => { li.hidden = !matches(e.target.value, li.dataset.name); });
  });
  m.el.querySelector('.pick-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    const c = store.get('catalog', b.dataset.pick);
    onPick(c);
    b.classList.add('picked');
    toast(`Eklendi: ${c.name}`);
  });
}

export function pickTemplate(onPick) {
  const list = [...store.state.templates].sort(byName);
  const cur = store.state.settings.currency;
  if (!list.length) {
    toast('Şablon yok; bir teklifi "Şablon olarak kaydet" ile ya da Hazır kalemler › Şablonlar bölümünden oluşturun.', 'warn');
    return;
  }
  const m = modal({
    title: 'Şablondan ekle',
    body: html`<ul class="pick-list">${list.map((t) => html`<li><button type="button" data-pick="${t.id}">
      <span class="grow"><b>${t.name}</b><small class="muted">${t.description || `${t.items?.length ?? 0} satır`}</small></span>
      <span class="num">${money(quoteTotals({ items: t.items }).taxBase, cur)}</span>${icon('plus', 16)}</button></li>`)}</ul>`,
  });
  m.el.querySelector('.pick-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (!b) return;
    m.close();
    const t = store.get('templates', b.dataset.pick);
    onPick(t);
    toast(`Şablon eklendi: ${t.name}`);
  });
}
