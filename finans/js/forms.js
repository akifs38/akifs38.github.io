// forms.js — İşlem formu (gelir/gider/hızlı/düzenle), hesap ve kategori formları.

import { el, toDateInput, fromDateInput, nowISO } from './utils.js';
import { store } from './store.js';
import { toast } from './ui.js';

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Banka' },
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'other', label: 'Diğer' },
];
export function accountTypeLabel(t) {
  return (ACCOUNT_TYPES.find((x) => x.value === t) || {}).label || 'Diğer';
}
export { ACCOUNT_TYPES };

function field(labelText, control, { hint } = {}) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field-label', text: labelText }),
    control,
    hint ? el('span', { class: 'field-hint', text: hint }) : null,
  ]);
}

function selectFrom(options, selected, placeholder) {
  const sel = el('select', { class: 'input' });
  if (placeholder) sel.appendChild(el('option', { value: '', text: placeholder }));
  for (const o of options) {
    const opt = el('option', { value: o.value, text: o.label });
    if (o.value === selected) opt.selected = true;
    sel.appendChild(opt);
  }
  return sel;
}

// İşlem formu. mode: 'income' | 'expense' | 'quick'. tx: düzenleme için mevcut işlem.
// onDone(): kaydedince çağrılır.
export function transactionForm({ mode = 'expense', tx = null, onDone } = {}) {
  const type = tx ? tx.type : (mode === 'income' ? 'income' : 'expense');
  const quick = mode === 'quick';

  const accounts = store.accounts;
  const cats = store.categoriesByType(type);
  const prefs = store.data.prefs;

  const amount = el('input', {
    class: 'input input-amount', type: 'number', inputmode: 'decimal',
    min: '0', step: '0.01', placeholder: '0', required: 'true',
    value: tx ? tx.amount : '',
  });
  const desc = el('input', {
    class: 'input', type: 'text', placeholder: 'Açıklama (opsiyonel)',
    value: tx ? tx.description : '',
  });
  const catSel = selectFrom(
    cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
    tx ? tx.categoryId : (cats.some((c) => c.id === prefs.lastCategoryId && type === (store.categoryById(prefs.lastCategoryId) || {}).type) ? prefs.lastCategoryId : (cats[0] || {}).id),
    cats.length ? null : 'Önce kategori ekleyin',
  );
  const accSel = selectFrom(
    accounts.map((a) => ({ value: a.id, label: a.name })),
    tx ? tx.accountId : (accounts.some((a) => a.id === prefs.lastAccountId) ? prefs.lastAccountId : (accounts[0] || {}).id),
    accounts.length ? null : 'Önce hesap ekleyin',
  );
  const dateInput = el('input', {
    class: 'input', type: 'date',
    value: toDateInput(tx ? tx.transactionDate : nowISO()),
  });
  const note = el('textarea', { class: 'input', rows: '2', placeholder: 'Not (opsiyonel)' });
  if (tx) note.value = tx.note || '';

  const form = el('form', { class: 'tx-form' });

  // Hızlı modda son kullanılanları hızlı seçim çipleri olarak göster
  if (quick && cats.length) {
    const recentCats = cats.slice(0, 6);
    const chips = el('div', { class: 'chips' });
    for (const c of recentCats) {
      chips.appendChild(el('button', {
        type: 'button', class: 'chip', text: `${c.icon} ${c.name}`,
        onClick: () => { catSel.value = c.id; markActive(chips, c.id); },
      }, []));
    }
    form.appendChild(field('Hızlı kategori', chips));
  }

  form.append(
    field(type === 'income' ? 'Tutar (₺)' : 'Tutar (₺)', amount),
    field('Kategori', catSel),
    field('Hesap / Banka', accSel),
  );
  if (!quick) form.appendChild(field('Açıklama', desc));
  else form.appendChild(field('Açıklama', desc));
  if (!quick) {
    form.appendChild(field('Tarih', dateInput, { hint: 'Boş bırakılırsa bugünün tarihi ve saati kullanılır.' }));
    form.appendChild(field('Not', note));
  }

  const submitLabel = tx ? 'Güncelle' : (type === 'income' ? 'Geliri Kaydet' : 'Gideri Kaydet');
  form.appendChild(el('div', { class: 'modal-actions' }, [
    el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: quick ? 'Kaydet' : submitLabel }),
  ]));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseFloat(String(amount.value).replace(',', '.'));
    if (!(val > 0)) { toast('Geçerli bir tutar girin (0’dan büyük).', 'error'); amount.focus(); return; }
    if (!accSel.value) { toast('Bir hesap seçin veya ekleyin.', 'error'); return; }
    if (!catSel.value) { toast('Bir kategori seçin.', 'error'); return; }

    const payload = {
      type,
      amount: val,
      description: desc.value,
      categoryId: catSel.value,
      accountId: accSel.value,
      note: quick ? '' : note.value,
    };
    if (tx) {
      payload.transactionDate = fromDateInput(dateInput.value);
      store.updateTransaction(tx.id, payload);
      toast('İşlem güncellendi.');
    } else {
      payload.transactionDate = quick ? nowISO() : fromDateInput(dateInput.value);
      store.addTransaction(payload);
      toast(type === 'income' ? 'Gelir eklendi.' : 'Gider eklendi.');
    }
    onDone && onDone();
  });

  return form;
}

function markActive(chips, id) {
  for (const c of chips.children) c.classList.remove('active');
}

// Hesap formu
export function accountForm({ account = null, onDone } = {}) {
  const name = el('input', { class: 'input', type: 'text', placeholder: 'Örn. DenizBank', required: 'true', value: account ? account.name : '' });
  const type = selectFrom(ACCOUNT_TYPES, account ? account.type : 'bank');
  const bal = el('input', { class: 'input', type: 'number', step: '0.01', placeholder: '0', value: account ? account.openingBalance : '' });

  const form = el('form', { class: 'tx-form' }, [
    field('Hesap adı', name),
    field('Tür', type),
    field('Açılış bakiyesi (₺)', bal, { hint: 'Kredi kartı borcu için eksi değer girebilirsiniz. Güncel bakiye işlemlerle otomatik hesaplanır.' }),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: account ? 'Güncelle' : 'Hesap Ekle' }),
    ]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!name.value.trim()) { toast('Hesap adı girin.', 'error'); return; }
    const data = { name: name.value, type: type.value, openingBalance: parseFloat(String(bal.value).replace(',', '.')) || 0 };
    if (account) { store.updateAccount(account.id, data); toast('Hesap güncellendi.'); }
    else { store.addAccount(data); toast('Hesap eklendi.'); }
    onDone && onDone();
  });
  return form;
}

const ICON_CHOICES = ['🛒', '🍽️', '💡', '🚰', '🔥', '📱', '🌐', '🏠', '🚌', '⛽', '👕', '🏥', '🎬', '🔁', '💻', '🛋️', '🎓', '📦', '💰', '➕', '📈', '🎁', '☕', '🎮', '✈️', '🐾', '💊', '🎁'];

// Kategori formu
export function categoryForm({ category = null, defaultType = 'expense', onDone } = {}) {
  const name = el('input', { class: 'input', type: 'text', placeholder: 'Kategori adı', required: 'true', value: category ? category.name : '' });
  const type = selectFrom(
    [{ value: 'expense', label: 'Gider' }, { value: 'income', label: 'Gelir' }],
    category ? category.type : defaultType,
  );
  let selectedIcon = category ? category.icon : '📦';
  const iconGrid = el('div', { class: 'icon-grid' });
  for (const ic of ICON_CHOICES) {
    const b = el('button', { type: 'button', class: 'icon-choice' + (ic === selectedIcon ? ' active' : ''), text: ic });
    b.addEventListener('click', () => {
      selectedIcon = ic;
      for (const c of iconGrid.children) c.classList.remove('active');
      b.classList.add('active');
    });
    iconGrid.appendChild(b);
  }

  const form = el('form', { class: 'tx-form' }, [
    field('Ad', name),
    field('Tür', type),
    field('Simge', iconGrid),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: category ? 'Güncelle' : 'Kategori Ekle' }),
    ]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!name.value.trim()) { toast('Kategori adı girin.', 'error'); return; }
    if (category) { store.updateCategory(category.id, { name: name.value, type: type.value, icon: selectedIcon }); toast('Kategori güncellendi.'); }
    else { store.addCategory({ name: name.value, type: type.value, icon: selectedIcon }); toast('Kategori eklendi.'); }
    onDone && onDone();
  });
  return form;
}

// Tekrarlayan işlem formu
export function recurringForm({ rec = null, onDone } = {}) {
  const desc = el('input', { class: 'input', type: 'text', placeholder: 'Örn. Elektrik faturası', required: 'true', value: rec ? rec.description : '' });
  const amount = el('input', { class: 'input', type: 'number', min: '0', step: '0.01', placeholder: '0', required: 'true', value: rec ? rec.amount : '' });
  const type = selectFrom([{ value: 'expense', label: 'Gider' }, { value: 'income', label: 'Gelir' }], rec ? rec.type : 'expense');
  const catWrap = el('div', {});
  const accSel = selectFrom(store.accounts.map((a) => ({ value: a.id, label: a.name })), rec ? rec.accountId : (store.accounts[0] || {}).id);
  const freq = selectFrom([
    { value: 'monthly', label: 'Aylık' },
    { value: 'weekly', label: 'Haftalık' },
    { value: 'yearly', label: 'Yıllık' },
  ], rec ? rec.frequency : 'monthly');
  const day = el('input', { class: 'input', type: 'number', min: '1', max: '31', placeholder: 'Ayın günü (1-31)', value: rec ? rec.dayOfMonth : 1 });

  function renderCats() {
    catWrap.innerHTML = '';
    const cats = store.categoriesByType(type.value);
    const sel = selectFrom(cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })), rec ? rec.categoryId : (cats[0] || {}).id);
    sel.id = 'rec-cat';
    catWrap.appendChild(sel);
  }
  renderCats();
  type.addEventListener('change', renderCats);

  const form = el('form', { class: 'tx-form' }, [
    field('Ad', desc),
    field('Tutar (₺)', amount),
    field('Tür', type),
    field('Kategori', catWrap),
    field('Hesap', accSel),
    field('Tekrar periyodu', freq),
    field('Ödeme günü', day, { hint: 'Aylık için ayın günü, yıllık için gün numarası.' }),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: rec ? 'Güncelle' : 'Ekle' }),
    ]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseFloat(String(amount.value).replace(',', '.'));
    if (!desc.value.trim()) { toast('Ad girin.', 'error'); return; }
    if (!(val > 0)) { toast('Geçerli bir tutar girin.', 'error'); return; }
    const catId = (catWrap.querySelector('select') || {}).value || null;
    const data = {
      description: desc.value, amount: val, type: type.value,
      categoryId: catId, accountId: accSel.value,
      frequency: freq.value, dayOfMonth: parseInt(day.value, 10) || 1,
    };
    if (rec) { store.updateRecurring(rec.id, data); toast('Güncellendi.'); }
    else { store.addRecurring(data); toast('Tekrarlayan ödeme eklendi.'); }
    onDone && onDone();
  });
  return form;
}
