// Teklif şablonu düzenleyici: ad, açıklama, satırlar, notlar ve şartlar (kendiliğinden kaydedilir).

import { store } from '../store.js';
import { html, money } from '../util.js';
import { quoteTotals } from '../calc.js';
import { icon, empty } from '../ui.js';
import { itemsHtml, bindItems } from './items-editor.js';

export default {
  title: (p) => (store.get('templates', p.id) ? `Şablon: ${store.get('templates', p.id).name}` : 'Şablon bulunamadı'),
  actions: (p) => (store.get('templates', p.id)
    ? html`<a class="btn" href="#/katalog">${icon('back')} <span class="hide-sm">Şablonlar</span></a><a class="btn btn-primary" href="#/teklifler/yeni?template=${p.id}">${icon('quote')} Bu şablonla teklif</a>`
    : ''),
  render(p) {
    const t = store.get('templates', p.id);
    if (!t) return empty('copy', 'Şablon bulunamadı', 'Silinmiş olabilir.', html`<a class="btn" href="#/katalog">Geri dön</a>`);
    const cur = store.state.settings.currency;
    return html`<form data-template autocomplete="off">
      <section class="card"><div class="form-grid pad">
        <div class="field"><label for="t-name">Şablon adı</label><input id="t-name" data-f="name" value="${t.name}" required></div>
        <div class="field"><label for="t-desc">Kısa açıklama</label><input id="t-desc" data-f="description" value="${t.description ?? ''}"></div>
      </div></section>
      <section class="card" data-items-root><header class="card-head"><h2>Satırlar</h2><span class="num" data-total>KDV hariç ${money(quoteTotals({ items: t.items }).taxBase, cur)}</span></header>${itemsHtml(t.items ?? [], cur)}</section>
      <section class="card"><div class="pad">
        <div class="field full"><label for="t-notes">Notlar</label><textarea id="t-notes" data-f="notes" rows="3">${t.notes ?? ''}</textarea></div>
        <div class="field full"><label for="t-terms">Şartlar ve koşullar</label><textarea id="t-terms" data-f="terms" rows="5">${t.terms ?? ''}</textarea></div>
      </div></section>
      <p class="muted small saved-note">${icon('check', 14)} Değişiklikler kendiliğinden kaydedilir.</p>
    </form>`;
  },
  mount(el, p) {
    const stored = store.get('templates', p.id);
    if (!stored) return;
    const t = { ...stored, items: (stored.items ?? []).map((x) => ({ ...x })) };
    const cur = store.state.settings.currency;
    const save = () => {
      if (!t.name?.trim()) return;
      store.upsert('templates', t, { silent: true });
      el.querySelector('[data-total]').textContent = `KDV hariç ${money(quoteTotals({ items: t.items }).taxBase, cur)}`;
    };
    const form = el.querySelector('[data-template]');
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', (e) => {
      const f = e.target.dataset.f;
      if (!f) return;
      t[f] = e.target.value;
      if (f === 'name') document.getElementById('page-title').textContent = `Şablon: ${t.name}`;
      save();
    });
    bindItems(el.querySelector('[data-items-root]'), t, { currency: () => cur, onChange: save });
  },
};
