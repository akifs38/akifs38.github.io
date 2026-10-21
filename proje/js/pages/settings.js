// Ayarlar: firma bilgileri ve logo (teklif anteti), teklif ayarları, görünüm, veri (yedek indir/yükle, örnek veri, sıfırla).

import { store, DEFAULT_SETTINGS, DEFAULT_TEAM } from '../store.js';
import { html, raw, download, today, fmtDateTime } from '../util.js';
import { VAT_RATES } from '../calc.js';
import { icon, toast, confirmDialog, formDialog } from '../ui.js';
import { demoState } from '../demo.js';

const LOGO_MAX = 300 * 1024;

const companyFields = [
  ['name', 'Firma adı', 'text'], ['phone', 'Telefon', 'tel'], ['email', 'E-posta', 'email'], ['web', 'Web sitesi', 'text'],
  ['taxOffice', 'Vergi dairesi', 'text'], ['taxNo', 'Vergi no', 'text'], ['iban', 'IBAN', 'text'],
];

export default {
  title: 'Ayarlar',
  render() {
    const s = store.state.settings;
    const c = s.company;
    const counts = ['clients', 'members', 'projects', 'tasks', 'quotes'].map((k) => store.state[k].length);
    const kb = Math.round(store.storageBytes() / 1024);
    return html`
      <form class="card" data-company autocomplete="off">
        <header class="card-head"><h2>Firma bilgileri</h2><span class="muted small">Teklif antetinde ve paylaşımlarda görünür</span></header>
        <div class="form-grid pad">
          ${companyFields.map(([k, l, type]) => html`<div class="field"><label for="c-${k}">${l}</label><input id="c-${k}" type="${type}" name="${k}" value="${c[k] ?? ''}"></div>`)}
          <div class="field full"><label for="c-address">Adres</label><textarea id="c-address" name="address" rows="2">${c.address ?? ''}</textarea></div>
          <div class="field full logo-field"><label>Logo</label>
            <div class="logo-row">
              ${c.logo ? html`<img src="${c.logo}" alt="Firma logosu" class="logo-preview">` : html`<span class="logo-empty">${icon('package', 22)}</span>`}
              <label class="btn btn-sm">${icon('upload', 15)} Logo seç<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-logo hidden></label>
              ${c.logo ? html`<button type="button" class="btn btn-sm btn-danger-ghost" data-act="remove-logo">Kaldır</button>` : ''}
              <small class="hint">PNG, JPG, WebP ya da SVG; en fazla 300 KB.</small>
            </div></div>
        </div>
      </form>

      <form class="card" data-quote-settings autocomplete="off">
        <header class="card-head"><h2>Teklif ayarları</h2></header>
        <div class="form-grid pad">
          <div class="field"><label for="s-prefix">Teklif no öneki</label><input id="s-prefix" name="quotePrefix" value="${s.quotePrefix}" maxlength="10"><small class="hint">Ör. ${s.quotePrefix || 'TKF'}-${today().slice(0, 4)}-0001</small></div>
          <div class="field"><label for="s-valid">Geçerlilik süresi (gün)</label><input id="s-valid" type="number" min="1" step="1" name="quoteValidityDays" value="${s.quoteValidityDays}"></div>
          <div class="field"><label for="s-vat">Varsayılan KDV</label><select id="s-vat" name="vatRate">${VAT_RATES.map((r) => html`<option value="${r}" ${Number(s.vatRate) === r ? raw('selected') : ''}>%${r}</option>`)}</select></div>
          <div class="field"><label for="s-margin">Varsayılan kâr payı (%)</label><input id="s-margin" type="number" min="0" step="1" name="defaultMargin" value="${s.defaultMargin}"><small class="hint">"Maliyetten teklif"te kullanılır</small></div>
          <div class="field"><label for="s-currency">Para birimi</label><select id="s-currency" name="currency">${[['TRY', 'Türk lirası (₺)'], ['USD', 'ABD doları ($)'], ['EUR', 'Avro (€)'], ['GBP', 'Sterlin (£)']].map(([v, l]) => html`<option value="${v}" ${s.currency === v ? raw('selected') : ''}>${l}</option>`)}</select></div>
          <div class="field full"><label for="s-terms">Varsayılan şartlar ve koşullar</label><textarea id="s-terms" name="defaultTerms" rows="5">${s.defaultTerms}</textarea>
            <button type="button" class="link small" data-act="reset-terms">Varsayılan metne dön</button></div>
        </div>
      </form>

      <section class="card">
        <header class="card-head"><h2>Veri ve yedekleme</h2></header>
        <div class="pad">
          <p class="notice-inline">${icon('database')} <span>Tüm kayıtlar <b>yalnızca bu tarayıcıda</b> (bu cihazda) tutulur, hiçbir sunucuya gönderilmez. Tarayıcı verisi silinirse kayıtlar da silinir; düzenli yedek alın. Başka bir bilgisayarda çalışmak için yedeği orada "Yedekten yükle" ile açın.</span></p>
          <p class="muted small">${counts[0]} müşteri · ${counts[1]} çalışan · ${counts[2]} proje · ${counts[3]} görev · ${counts[4]} teklif · ${kb} KB${s.lastBackupAt ? ` · son yedek ${fmtDateTime(s.lastBackupAt)}` : ' · henüz yedek alınmadı'}</p>
          <div class="btn-row">
            <button type="button" class="btn btn-primary" data-act="backup">${icon('download')} Yedek indir (.json)</button>
            <label class="btn">${icon('upload')} Yedekten yükle<input type="file" accept="application/json,.json" data-restore hidden></label>
            <button type="button" class="btn" data-act="demo">${icon('sparkle')} Örnek verileri yükle</button>
            <button type="button" class="btn btn-danger-ghost" data-act="reset">${icon('trash')} Tüm verileri sil</button>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-head"><h2>Görünüm</h2></header>
        <div class="pad btn-row" role="radiogroup" aria-label="Tema">
          ${[['auto', 'Sisteme göre'], ['light', 'Açık'], ['dark', 'Koyu']].map(([v, l]) => html`<button type="button" role="radio" aria-checked="${s.theme === v}" class="btn ${s.theme === v ? 'btn-primary' : ''}" data-set-theme="${v}">${l}</button>`)}
        </div>
      </section>`;
  },
  mount(el) {
    const companyForm = el.querySelector('[data-company]');
    companyForm.addEventListener('submit', (e) => e.preventDefault());
    companyForm.addEventListener('change', (e) => {
      if (!e.target.name) return;
      store.updateSettings({ company: { [e.target.name]: e.target.value.trim() } }, { silent: true });
      document.getElementById('brand-company').textContent = store.state.settings.company.name || 'Firma bilgisi girilmedi';
      toast('Firma bilgileri kaydedildi');
    });
    el.querySelector('[data-logo]').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > LOGO_MAX) { toast('Logo en fazla 300 KB olabilir; küçültüp tekrar deneyin.', 'error'); return; }
      if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) { toast('Desteklenmeyen dosya türü.', 'error'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        store.updateSettings({ company: { logo: String(reader.result) } });
        toast('Logo kaydedildi');
      };
      reader.readAsDataURL(file);
    });

    const quoteForm = el.querySelector('[data-quote-settings]');
    quoteForm.addEventListener('submit', (e) => e.preventDefault());
    quoteForm.addEventListener('change', (e) => {
      const { name, value } = e.target;
      if (!name) return;
      let v = value;
      if (['quoteValidityDays', 'vatRate', 'defaultMargin'].includes(name)) v = Math.max(0, Number(value) || 0);
      if (name === 'quoteValidityDays' && v < 1) v = 15;
      if (name === 'quotePrefix') v = value.trim().replace(/[^\p{L}\p{N}._-]/gu, '').toUpperCase() || 'TKF';
      store.updateSettings({ [name]: v }, { silent: true });
      if (name === 'quotePrefix') e.target.value = v;
      toast('Teklif ayarları kaydedildi');
    });

    el.addEventListener('click', async (e) => {
      // Not: <html> öğesi de data-theme taşır; bu yüzden düğmeler data-set-theme kullanır
      const theme = e.target.closest('[data-set-theme]');
      if (theme) { store.updateSettings({ theme: theme.dataset.setTheme }); return; }
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'remove-logo') store.updateSettings({ company: { logo: '' } });
      else if (act === 'reset-terms') {
        store.updateSettings({ defaultTerms: DEFAULT_SETTINGS.defaultTerms });
        toast('Varsayılan şartlar geri yüklendi');
      } else if (act === 'backup') {
        store.updateSettings({ lastBackupAt: new Date().toISOString() }, { silent: true });
        download(`proje-yonetimi-yedek-${today()}.json`, store.exportJson(), 'application/json');
        toast('Yedek indirildi');
        window.dispatchEvent(new Event('app:refresh'));
      } else if (act === 'demo') {
        const hasData = store.state.projects.length || store.state.clients.length || store.state.quotes.length;
        if (hasData && !(await confirmDialog('Örnek veriler mevcut kayıtlarınızın YERİNE geçer. Önce yedek almanız önerilir. Devam edilsin mi?', { ok: 'Örnek verileri yükle', danger: true }))) return;
        store.replaceAll(demoState());
        toast('Örnek veriler yüklendi');
        location.hash = '#/';
      } else if (act === 'reset') {
        resetAll();
      }
    });

    el.querySelector('[data-restore]').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const n = (k) => (Array.isArray(data[k]) ? data[k].length : 0);
        if (!(await confirmDialog(`Yedekte ${n('clients')} müşteri, ${n('projects')} proje, ${n('tasks')} görev ve ${n('quotes')} teklif var. Mevcut kayıtların YERİNE yüklensin mi?`, { ok: 'Yedeği yükle', danger: true }))) return;
        store.replaceAll(data);
        toast('Yedek yüklendi');
        location.hash = '#/';
      } catch (err) {
        toast(err instanceof SyntaxError ? 'Dosya okunamadı: geçerli bir yedek (.json) değil.' : err.message, 'error');
      }
    });
  },
};

function resetAll() {
  formDialog({
    title: 'Tüm verileri sil',
    intro: html`<p>Bu tarayıcıdaki <b>tüm</b> müşteri, ekip, proje, görev, gider ve teklif kayıtları ile ayarlar silinir. Geri alınamaz; önce yedek indirin.</p>
      <p class="muted small">Ardından varsayılan ekip (${DEFAULT_TEAM.map((m) => m.name).join(', ')}) yeniden eklenir.</p>`,
    fields: [{ name: 'confirm', label: 'Onay için SİL yazın', required: true }],
    submit: 'Tümünü sil',
    onSubmit: ({ confirm }) => {
      if (confirm.toLocaleUpperCase('tr-TR') !== 'SİL') return 'Onay için büyük harflerle SİL yazın.';
      store.reset();
      toast('Tüm veriler silindi');
      location.hash = '#/';
    },
  });
}
