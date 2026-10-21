// Teklifin A4 baskı görünümü: antet (logo, firma bilgileri), müşteri, satırlar, KDV dökümü, yazıyla tutar, şartlar,
// banka bilgisi ve imza alanları. "Yazdır" tarayıcının yazdırma penceresini açar; oradan "PDF olarak kaydet" seçilir.

import { store } from '../store.js';
import { html, money, fmtDate, num, amountInWords, today } from '../util.js';
import { quoteTotals, lineAmounts, quoteStatus, QUOTE_STATUS } from '../calc.js';
import { icon, empty } from '../ui.js';
import { whatsappLink, mailLink, quoteText } from './share.js';

const safeLogo = (src) => (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(src ?? '') ? src : '');

export default {
  printRoute: true,
  title: (p) => {
    const q = store.get('quotes', p.id);
    return q ? `Teklif ${q.number} · Önizleme` : 'Teklif bulunamadı';
  },
  actions: (p) => {
    const q = store.get('quotes', p.id);
    if (!q) return '';
    const client = store.get('clients', q.clientId);
    return html`<a class="btn" href="#/teklifler/${p.id}">${icon('back')} <span class="hide-sm">Düzenle</span></a>
      <a class="btn hide-sm" href="${whatsappLink(client?.phone, quoteText(q))}" target="_blank" rel="noopener">${icon('message')} WhatsApp</a>
      <a class="btn hide-sm" href="${mailLink(client?.email, `Fiyat teklifi ${q.number}`, quoteText(q))}">${icon('mail')} E-posta</a>
      <button type="button" class="btn btn-primary" data-print>${icon('printer')} <span class="hide-sm">Yazdır /&nbsp;</span>PDF</button>`;
  },
  mountActions(el, p) {
    el.querySelector('[data-print]')?.addEventListener('click', () => {
      const q = store.get('quotes', p.id);
      const old = document.title;
      // PDF dosya adı belge başlığından gelir
      document.title = `${q.number}${q.title ? ` ${q.title}` : ''}`.replace(/[\\/:*?"<>|]/g, '-');
      window.print();
      setTimeout(() => { document.title = old; }, 500);
    });
  },
  render(p) {
    const s = store.state;
    const q = store.get('quotes', p.id);
    if (!q) return empty('quote', 'Teklif bulunamadı', 'Silinmiş olabilir.', html`<a class="btn" href="#/teklifler">Tekliflere dön</a>`);
    const c = s.settings.company;
    const client = s.clients.find((x) => x.id === q.clientId);
    const cur = q.currency || s.settings.currency;
    const t = quoteTotals(q);
    const items = q.items ?? [];
    const hasDiscount = items.some((i) => Number(i.discount) > 0);
    const logo = safeLogo(c.logo);
    const status = quoteStatus(q, today());
    return html`
      <p class="doc-hint muted small">${icon('printer', 14)} "Yazdır / PDF" ile açılan pencerede hedef olarak <b>PDF olarak kaydet</b>'i seçerek dosya oluşturabilirsiniz. ${status !== 'draft' ? '' : 'Teklif şu an taslak durumunda.'}</p>
      <article class="doc" aria-label="Fiyat teklifi ${q.number}">
        <header class="doc-head">
          <div class="doc-company">
            ${logo ? html`<img src="${logo}" alt="${c.name} logosu" class="doc-logo">` : ''}
            <div><h2>${c.name || 'Firma adı (Ayarlar › Firma bilgileri)'}</h2>
              <p>${[c.address, [c.phone, c.email].filter(Boolean).join(' · '), c.web].filter(Boolean).map((l) => html`${l}<br>`)}
              ${c.taxOffice || c.taxNo ? html`V.D.: ${c.taxOffice || '—'} · V.N.: ${c.taxNo || '—'}` : ''}</p></div>
          </div>
          <div class="doc-title">
            <h1>FİYAT TEKLİFİ</h1>
            <table><tbody>
              <tr><th>Teklif no</th><td>${q.number}</td></tr>
              <tr><th>Tarih</th><td>${fmtDate(q.date)}</td></tr>
              <tr><th>Geçerlilik</th><td>${fmtDate(q.validUntil)}</td></tr>
              ${status !== 'draft' && status !== 'sent' ? html`<tr><th>Durum</th><td>${QUOTE_STATUS[status]}</td></tr>` : ''}
            </tbody></table>
          </div>
        </header>

        <section class="doc-parties">
          <div><h3>Sayın</h3>
            <p><b>${client?.name ?? '—'}</b>${client?.contactName ? html`<br>${client.contactName}` : ''}
            ${client?.address ? html`<br>${client.address}` : ''}
            ${client?.taxOffice || client?.taxNo ? html`<br>V.D.: ${client.taxOffice || '—'} · V.N./TCKN: ${client.taxNo || '—'}` : ''}
            ${client?.phone || client?.email ? html`<br>${[client.phone, client.email].filter(Boolean).join(' · ')}` : ''}</p></div>
          ${q.title ? html`<div><h3>Konu</h3><p>${q.title}</p></div>` : ''}
        </section>

        <p class="doc-intro">Talebiniz doğrultusunda hazırladığımız fiyat teklifimiz aşağıdadır.</p>

        <table class="doc-items">
          <thead><tr><th class="c-no">#</th><th>Açıklama</th><th class="r">Miktar</th><th>Birim</th><th class="r">Birim fiyat</th>${hasDiscount ? html`<th class="r">İsk.</th>` : ''}<th class="r">KDV</th><th class="r">Tutar</th></tr></thead>
          <tbody>${items.map((i, n) => html`<tr>
            <td class="c-no">${n + 1}</td>
            <td><b>${i.description || '—'}</b>${i.detail ? html`<br><small>${i.detail}</small>` : ''}</td>
            <td class="r">${num(i.qty)}</td><td>${i.unit}</td>
            <td class="r">${money(i.unitPrice, cur)}</td>
            ${hasDiscount ? html`<td class="r">${Number(i.discount) ? `%${num(i.discount)}` : ''}</td>` : ''}
            <td class="r">%${i.vatRate}</td>
            <td class="r">${money(lineAmounts(i).net, cur)}</td></tr>`)}
          ${items.length ? '' : html`<tr><td colspan="8" class="muted">Satır eklenmedi.</td></tr>`}</tbody>
        </table>

        <div class="doc-bottom">
          <div class="doc-words"><small>Yalnız</small><b>${amountInWords(t.total, cur)}</b></div>
          <table class="doc-totals"><tbody>
            <tr><th>Ara toplam</th><td>${money(t.grossTotal, cur)}</td></tr>
            ${t.lineDiscount ? html`<tr><th>Satır iskontoları</th><td>−${money(t.lineDiscount, cur)}</td></tr>` : ''}
            ${t.generalDiscount ? html`<tr><th>Genel iskonto (%${num(q.generalDiscount)})</th><td>−${money(t.generalDiscount, cur)}</td></tr>` : ''}
            <tr><th>KDV matrahı</th><td>${money(t.taxBase, cur)}</td></tr>
            ${t.vatGroups.map((g) => html`<tr><th>KDV %${g.rate}</th><td>${money(g.vat, cur)}</td></tr>`)}
            <tr class="grand"><th>Genel toplam</th><td>${money(t.total, cur)}</td></tr>
          </tbody></table>
        </div>

        ${q.notes ? html`<section class="doc-block"><h3>Notlar</h3><p class="pre">${q.notes}</p></section>` : ''}
        ${q.terms ? html`<section class="doc-block"><h3>Şartlar ve koşullar</h3><ul>${q.terms.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => html`<li>${l.replace(/^[-•*]\s*/, '')}</li>`)}</ul></section>` : ''}
        ${c.iban ? html`<section class="doc-block"><h3>Ödeme bilgileri</h3><p>${c.name ? html`${c.name}<br>` : ''}IBAN: <b>${c.iban}</b></p></section>` : ''}

        <footer class="doc-sign">
          <div><span>Teklifi veren</span><b>${c.name || ''}</b><i>Kaşe / imza</i></div>
          <div><span>Müşteri onayı</span><b>${client?.name ?? ''}</b><i>Ad soyad, imza, tarih</i></div>
        </footer>
      </article>`;
  },
};
