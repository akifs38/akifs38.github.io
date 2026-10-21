// Teklif düzenleyici: başlık bilgileri, satırlar, iskonto ve KDV toplamları, notlar ve şartlar. Her değişiklik kendiliğinden
// kaydedilir. Kabul edilen teklif projeye dönüştürülebilir; teklif şablon olarak kaydedilebilir, kopyalanabilir, paylaşılabilir.

import { store } from '../store.js';
import { html, raw, money, today, addDays } from '../util.js';
import { QUOTE_STATUS, quoteTotals, quoteStatus, nextQuoteNumber, nextProjectCode, quoteLinesFromProject } from '../calc.js';
import { icon, statusBadge, empty, toast, confirmDialog, popMenu, formDialog } from '../ui.js';
import { clientForm, clientOptions, projectOptions, go } from '../forms.js';
import { itemsHtml, bindItems } from './items-editor.js';
import { whatsappLink, mailLink, quoteText } from './share.js';

const CURRENCIES = [['TRY', '₺ TL'], ['USD', '$ USD'], ['EUR', '€ EUR'], ['GBP', '£ GBP']];

/** Yeni teklif taslağı (adres parametreleri: client, project, template). */
export function createQuote({ clientId = null, projectId = null, templateId = null } = {}) {
  const s = store.state;
  const date = today();
  const project = projectId ? store.get('projects', projectId) : null;
  const template = templateId ? store.get('templates', templateId) : null;
  return store.upsert('quotes', {
    number: nextQuoteNumber(s, date),
    clientId: clientId || project?.clientId || null,
    projectId: project?.id ?? null,
    title: project?.name ?? template?.name ?? '',
    date,
    validUntil: addDays(date, Number(s.settings.quoteValidityDays) || 15),
    status: 'draft',
    currency: s.settings.currency,
    items: (template?.items ?? []).map((x) => ({ ...x })),
    generalDiscount: 0,
    notes: template?.notes ?? '',
    terms: template?.terms || s.settings.defaultTerms,
  }, { silent: true, log: 'Yeni teklif taslağı' });
}

export default {
  redirect(p) {
    if (p.id !== 'yeni') return null;
    const q = createQuote({ clientId: p.query.client, projectId: p.query.project, templateId: p.query.template });
    return `teklifler/${q.id}`;
  },
  title: (p) => {
    const q = store.get('quotes', p.id);
    return q ? `Teklif ${q.number}` : 'Teklif bulunamadı';
  },
  actions: (p) => (store.get('quotes', p.id)
    ? html`<a class="btn hide-sm" href="#/teklifler">${icon('back')} Teklifler</a>
      <a class="btn btn-primary" href="#/teklifler/${p.id}/yazdir">${icon('printer')} <span class="hide-sm">Önizle /&nbsp;</span>PDF</a>
      <button type="button" class="btn" data-more aria-label="Diğer işlemler">⋯</button>`
    : ''),
  mountActions(el, p) {
    el.querySelector('[data-more]')?.addEventListener('click', (e) => moreMenu(e.currentTarget, p.id));
  },
  render(p) {
    const s = store.state;
    const q = store.get('quotes', p.id);
    if (!q) return empty('quote', 'Teklif bulunamadı', 'Silinmiş olabilir.', html`<a class="btn" href="#/teklifler">Tekliflere dön</a>`);
    const status = quoteStatus(q, today());
    const cur = q.currency || s.settings.currency;
    return html`
      <form class="quote-form" data-quote autocomplete="off">
        <section class="card">
          <div class="form-grid pad">
            <div class="field"><label for="q-number">Teklif no</label><input id="q-number" data-f="number" value="${q.number}"></div>
            <div class="field"><label for="q-status">Durum ${status === 'expired' ? statusBadge('quote', 'expired') : ''}</label>
              <select id="q-status" data-f="status">${Object.entries(QUOTE_STATUS).filter(([k]) => k !== 'expired').map(([k, l]) => html`<option value="${k}" ${k === q.status ? raw('selected') : ''}>${l}</option>`)}</select></div>
            <div class="field full"><label for="q-title">Konu / başlık</label><input id="q-title" data-f="title" value="${q.title ?? ''}" placeholder="Ör. Yılbaşı galası fotoğraf kabini"></div>
            <div class="field"><label for="q-client">Müşteri</label>
              <div class="field-row"><select id="q-client" data-f="clientId">${clientOptions().map(([v, l]) => html`<option value="${v}" ${v === (q.clientId ?? '') ? raw('selected') : ''}>${l}</option>`)}</select>
              <button type="button" class="btn btn-sm btn-soft" data-act="new-client">${icon('plus', 15)} Yeni</button></div></div>
            <div class="field"><label for="q-project">Proje (isteğe bağlı)</label>
              <select id="q-project" data-f="projectId">${projectOptions('— Projesiz —').map(([v, l]) => html`<option value="${v}" ${v === (q.projectId ?? '') ? raw('selected') : ''}>${l}</option>`)}</select></div>
            <div class="field"><label for="q-date">Teklif tarihi</label><input id="q-date" type="date" data-f="date" value="${q.date ?? ''}"></div>
            <div class="field"><label for="q-valid">Geçerlilik tarihi</label><input id="q-valid" type="date" data-f="validUntil" value="${q.validUntil ?? ''}"></div>
            <div class="field"><label for="q-currency">Para birimi</label><select id="q-currency" data-f="currency">${CURRENCIES.map(([v, l]) => html`<option value="${v}" ${v === cur ? raw('selected') : ''}>${l}</option>`)}</select></div>
          </div>
        </section>

        <section class="card" data-items-root>
          <header class="card-head"><h2>Kalemler</h2>${q.projectId ? html`<button type="button" class="btn btn-sm btn-soft" data-act="from-costs">${icon('sparkle', 15)} Proje maliyetinden ekle</button>` : ''}</header>
          ${itemsHtml(q.items ?? [], cur)}
        </section>

        <div class="grid-2 align-start">
          <section class="card">
            <div class="pad">
              <div class="field full"><label for="q-notes">Notlar (teklifte görünür)</label><textarea id="q-notes" data-f="notes" rows="3" placeholder="Ör. Kurulum etkinlikten 2 saat önce yapılır.">${q.notes ?? ''}</textarea></div>
              <div class="field full"><label for="q-terms">Şartlar ve koşullar</label><textarea id="q-terms" data-f="terms" rows="6">${q.terms ?? ''}</textarea></div>
            </div>
          </section>
          <section class="card totals-card" data-totals>${totalsHtml(q)}</section>
        </div>
        <p class="muted small saved-note" data-saved>${icon('check', 14)} Değişiklikler kendiliğinden kaydedilir.</p>
      </form>`;
  },
  mount(el, p) {
    let q = store.get('quotes', p.id);
    if (!q) return;
    q = { ...q, items: (q.items ?? []).map((x) => ({ ...x })) };
    const form = el.querySelector('[data-quote]');
    form.addEventListener('submit', (e) => e.preventDefault());
    // Her değişiklik hemen kaydedilir (sessiz: sayfa yeniden çizilmez, odak kaybolmaz)
    let flashTimer;
    const save = () => {
      const saved = store.upsert('quotes', q, { silent: true });
      q.updatedAt = saved.updatedAt;
      const note = el.querySelector('[data-saved]');
      note.classList.add('flash');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => note.classList.remove('flash'), 600);
    };
    const updateTotals = () => { el.querySelector('[data-totals]').innerHTML = String(totalsHtml(q)); };

    form.addEventListener('input', (e) => {
      const f = e.target.dataset.f;
      // Genel iskonto toplamlar kartında ayrıca işlenir; durum, müşteri ve proje "change" ile
      if (!f || f === 'generalDiscount' || f === 'status' || f === 'clientId' || f === 'projectId') return;
      q[f] = e.target.value;
      if (f === 'currency') updateTotals();
      save();
    });
    form.addEventListener('change', (e) => {
      const f = e.target.dataset.f;
      if (f === 'status') onStatus(q, e.target.value);
      if (f === 'projectId') {
        q.projectId = e.target.value || null;
        const project = store.get('projects', q.projectId);
        if (project?.clientId && !q.clientId) {
          q.clientId = project.clientId;
          form.querySelector('[data-f="clientId"]').value = project.clientId;
        }
        if (project && !q.title) { q.title = project.name; form.querySelector('[data-f="title"]').value = project.name; }
        save();
      }
      if (f === 'clientId') { q.clientId = e.target.value || null; save(); }
      if (f === 'currency') {
        // Para birimi değişince satır tutarları yeni biçimde yazılsın
        form.querySelectorAll('tr[data-i] [data-k="qty"]').forEach((i) => i.dispatchEvent(new Event('input', { bubbles: true })));
      }
    });
    bindItems(el.querySelector('[data-items-root]'), q, {
      currency: () => q.currency || store.state.settings.currency,
      onChange: () => { updateTotals(); save(); },
      onTemplate: (t) => {
        if (!q.notes && t.notes) { q.notes = t.notes; form.querySelector('[data-f="notes"]').value = t.notes; }
        if (t.terms) { q.terms = t.terms; form.querySelector('[data-f="terms"]').value = t.terms; }
      },
    });
    el.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'new-client') {
        clientForm(null, {
          // Yeni müşteri seçili olarak sayfa yeniden çizilir
          onSaved: (c) => store.upsert('quotes', { ...store.get('quotes', q.id), clientId: c.id }),
        });
      } else if (act === 'from-costs') {
        const s = store.state;
        const lines = quoteLinesFromProject(s, q.projectId, s.settings.defaultMargin, s.settings.vatRate);
        if (!lines.length) { toast('Projede tahmini saatli görev ya da gider yok.', 'warn'); return; }
        store.upsert('quotes', { ...q, items: [...q.items, ...lines] });
        toast(`${lines.length} satır eklendi (kâr payı %${s.settings.defaultMargin})`);
      }
    });
    // Genel iskonto alanı toplamlar kartında
    el.querySelector('[data-totals]').addEventListener('input', (e) => {
      if (e.target.dataset.f === 'generalDiscount') {
        q.generalDiscount = Math.min(100, Math.max(0, Number(e.target.value) || 0));
        const pos = e.target.selectionStart;
        updateTotals();
        const input = el.querySelector('[data-totals] [data-f="generalDiscount"]');
        input.focus();
        try { input.setSelectionRange(pos, pos); } catch { /* sayı alanında desteklenmeyebilir */ }
        save();
      }
    });
  },
};

function totalsHtml(q) {
  const t = quoteTotals(q);
  const cur = q.currency || store.state.settings.currency;
  return html`<dl class="totals">
    <dt>Ara toplam</dt><dd>${money(t.grossTotal, cur)}</dd>
    ${t.lineDiscount ? html`<dt>Satır iskontoları</dt><dd class="neg">−${money(t.lineDiscount, cur)}</dd>` : ''}
    <dt><label for="q-gd">Genel iskonto %</label></dt><dd><input id="q-gd" type="number" inputmode="decimal" min="0" max="100" step="any" data-f="generalDiscount" value="${q.generalDiscount ?? 0}"></dd>
    ${t.generalDiscount ? html`<dt>Genel iskonto</dt><dd class="neg">−${money(t.generalDiscount, cur)}</dd>` : ''}
    <dt>KDV matrahı</dt><dd>${money(t.taxBase, cur)}</dd>
    ${t.vatGroups.map((g) => html`<dt>KDV %${g.rate}</dt><dd>${money(g.vat, cur)}</dd>`)}
    <dt class="grand">Genel toplam</dt><dd class="grand">${money(t.total, cur)}</dd>
  </dl>`;
}

async function onStatus(q, status) {
  const previous = q.status;
  const now = new Date().toISOString();
  const patch = { status };
  if (status === 'sent' && !q.sentAt) patch.sentAt = now;
  if (status === 'accepted' || status === 'rejected') patch.decidedAt = now;
  // Kayıt sayfayı yeniden çizer; sonraki işlemler hep kayıttaki güncel teklifle yapılır
  const saved = store.upsert('quotes', { ...q, ...patch }, { log: `${q.number}: ${QUOTE_STATUS[status]}` });
  if (status === 'accepted' && previous !== 'accepted') {
    if (!saved.projectId && (await confirmDialog('Teklif kabul edildi. Bu tekliften bir proje oluşturulsun mu? Teklifin satırları projenin geliri olur.', { title: 'Projeye dönüştür', ok: 'Proje oluştur' }))) {
      convertToProject(store.get('quotes', saved.id));
    } else toast('Teklif kabul edildi');
  }
}

export function convertToProject(q) {
  const s = store.state;
  const project = store.upsert('projects', {
    code: nextProjectCode(s),
    name: q.title || `${q.number} projesi`,
    clientId: q.clientId ?? null,
    status: 'planlandi',
    startDate: today(),
    dueDate: '',
    budget: quoteTotals(q).taxBase,
    description: (q.items ?? []).map((i) => `• ${i.description} (${i.qty} ${i.unit})`).join('\n'),
    memberIds: [],
    managerId: null,
  }, { silent: true, log: `Tekliften proje: ${q.title || q.number}` });
  store.upsert('quotes', { ...store.get('quotes', q.id), projectId: project.id, status: 'accepted' }, { silent: true });
  toast('Proje oluşturuldu; ekibi atayıp görevleri ekleyin.');
  go(`projeler/${project.id}/ekip`);
}

function moreMenu(anchor, id) {
  const q = store.get('quotes', id);
  const s = store.state;
  const client = s.clients.find((c) => c.id === q.clientId);
  const items = [
    { label: 'Kopyasını oluştur', icon: 'copy', run: () => duplicate(q) },
    { label: 'Şablon olarak kaydet', icon: 'package', run: () => saveAsTemplate(q) },
    { label: 'WhatsApp ile gönder', icon: 'message', run: () => window.open(whatsappLink(client?.phone, quoteText(q)), '_blank', 'noopener') },
    { label: 'E-posta taslağı', icon: 'mail', run: () => { location.href = mailLink(client?.email, `Fiyat teklifi ${q.number}${q.title ? ` – ${q.title}` : ''}`, quoteText(q)); } },
  ];
  if (q.status === 'accepted' && !q.projectId) items.push({ label: 'Projeye dönüştür', icon: 'folder', run: () => convertToProject(q) });
  if (q.projectId) items.push({ label: 'Projeye git', icon: 'folder', run: () => go(`projeler/${q.projectId}`) });
  items.push({
    label: 'Teklifi sil',
    icon: 'trash',
    run: async () => {
      if (!(await confirmDialog(`${q.number} numaralı teklif silinsin mi?`, { ok: 'Sil', danger: true }))) return;
      store.remove('quotes', q.id, { log: `Teklif silindi: ${q.number}` });
      toast('Teklif silindi');
      go('teklifler');
    },
  });
  popMenu(anchor, items);
}

export function duplicate(q) {
  const s = store.state;
  const date = today();
  const copy = store.upsert('quotes', {
    ...q,
    id: undefined,
    createdAt: undefined,
    number: nextQuoteNumber(s, date),
    date,
    validUntil: addDays(date, Number(s.settings.quoteValidityDays) || 15),
    status: 'draft',
    sentAt: null,
    decidedAt: null,
    items: (q.items ?? []).map((x) => ({ ...x })),
  }, { silent: true, log: `Teklif kopyalandı: ${q.number}` });
  toast(`Kopya oluşturuldu: ${copy.number}`);
  go(`teklifler/${copy.id}`);
}

function saveAsTemplate(q) {
  formDialog({
    title: 'Şablon olarak kaydet',
    intro: html`<p class="muted">Satırlar, notlar ve şartlar şablona kopyalanır; yeni tekliflerde tek tıkla kullanırsınız.</p>`,
    fields: [
      { name: 'name', label: 'Şablon adı', required: true },
      { name: 'description', label: 'Kısa açıklama' },
    ],
    values: { name: q.title || '', description: '' },
    onSubmit: (v) => {
      store.upsert('templates', { ...v, items: (q.items ?? []).map((x) => ({ ...x })), notes: q.notes ?? '', terms: q.terms ?? '' }, { silent: true, log: `Şablon: ${v.name}` });
      toast('Şablon kaydedildi (Hazır kalemler › Şablonlar)');
    },
  });
}

