// forms.js — İşlem formu (gelir/gider/hızlı/düzenle), hesap ve kategori formları.

import { el, toDateInput, fromDateInput, nowISO, money } from './utils.js';
import { store } from './store.js';
import { toast } from './ui.js';

export const DEBT_TYPES = [
  { value: 'loan', label: 'Kredi' },
  { value: 'credit_card', label: 'Kredi kartı taksiti' },
  { value: 'phone', label: 'Telefon taksiti' },
  { value: 'electronics', label: 'Elektronik eşya' },
  { value: 'vehicle', label: 'Araç' },
  { value: 'furniture', label: 'Mobilya' },
  { value: 'education', label: 'Eğitim' },
  { value: 'other', label: 'Diğer' },
];
export function debtTypeLabel(t) { return (DEBT_TYPES.find((x) => x.value === t) || {}).label || 'Diğer'; }

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
export function transactionForm({ mode = 'expense', tx = null, initialType, onDone } = {}) {
  let type = tx ? tx.type : (initialType || (mode === 'income' ? 'income' : 'expense'));
  const quick = mode === 'quick';

  const accounts = store.accounts;
  let cats = store.categoriesByType(type);
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

  // Kategori seçimini (ve çipleri) mevcut türe göre yeniden doldur
  const chips = el('div', { class: 'chips' });
  let submitBtn = null;
  function rebuildCats() {
    cats = store.categoriesByType(type);
    catSel.innerHTML = '';
    if (!cats.length) catSel.appendChild(el('option', { value: '', text: 'Önce kategori ekleyin' }));
    for (const c of cats) catSel.appendChild(el('option', { value: c.id, text: `${c.icon} ${c.name}` }));
    // Son kullanılan uygunsa seç
    if (type === (store.categoryById(prefs.lastCategoryId) || {}).type && cats.some((c) => c.id === prefs.lastCategoryId)) catSel.value = prefs.lastCategoryId;
    chips.innerHTML = '';
    for (const c of cats.slice(0, 6)) {
      chips.appendChild(el('button', {
        type: 'button', class: 'chip', text: `${c.icon} ${c.name}`,
        onClick: () => { catSel.value = c.id; },
      }, []));
    }
    if (submitBtn) submitBtn.textContent = tx ? 'Güncelle' : (quick ? 'Kaydet' : (type === 'income' ? 'Geliri Kaydet' : 'Gideri Kaydet'));
  }

  // Hızlı ve yeni-ekleme modunda gelir/gider seçimi (düzenlemede tür sabit)
  if (!tx) {
    const seg = el('div', { class: 'seg-toggle' });
    const bExp = el('button', { type: 'button', class: 'seg' + (type === 'expense' ? ' active' : ''), text: '− Gider' });
    const bInc = el('button', { type: 'button', class: 'seg' + (type === 'income' ? ' active' : ''), text: '+ Gelir' });
    bExp.addEventListener('click', () => { type = 'expense'; bExp.classList.add('active'); bInc.classList.remove('active'); rebuildCats(); });
    bInc.addEventListener('click', () => { type = 'income'; bInc.classList.add('active'); bExp.classList.remove('active'); rebuildCats(); });
    seg.append(bExp, bInc);
    form.appendChild(seg);
  }

  if (quick) form.appendChild(field('Hızlı kategori', chips));
  rebuildCats();

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

  const submitLabel = tx ? 'Güncelle' : (quick ? 'Kaydet' : (type === 'income' ? 'Geliri Kaydet' : 'Gideri Kaydet'));
  submitBtn = el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: submitLabel });
  form.appendChild(el('div', { class: 'modal-actions' }, [submitBtn]));

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

// ---- ortak alan yardımcıları (bu modülde kullanılan) ----
function field2(labelText, control, hint) {
  return el('label', { class: 'field' }, [
    el('span', { class: 'field-label', text: labelText }),
    control,
    hint ? el('span', { class: 'field-hint', text: hint }) : null,
  ]);
}
function selectFrom2(options, selected, placeholder) {
  const sel = el('select', { class: 'input' });
  if (placeholder) sel.appendChild(el('option', { value: '', text: placeholder }));
  for (const o of options) {
    const opt = el('option', { value: o.value, text: o.label });
    if (o.value === selected) opt.selected = true;
    sel.appendChild(opt);
  }
  return sel;
}

// Taksitli borç formu
export function debtForm({ debt = null, onDone } = {}) {
  const name = el('input', { class: 'input', type: 'text', placeholder: 'Örn. İhtiyaç Kredisi', required: 'true', value: debt ? debt.name : '' });
  const type = selectFrom2(DEBT_TYPES, debt ? debt.type : 'loan');
  const total = el('input', { class: 'input', type: 'number', min: '0', step: '0.01', placeholder: 'Toplam borç', value: debt ? debt.totalAmount : '' });
  const monthly = el('input', { class: 'input', type: 'number', min: '0', step: '0.01', placeholder: 'Aylık taksit', value: debt ? debt.monthlyPayment : '' });
  const count = el('input', { class: 'input', type: 'number', min: '1', step: '1', placeholder: 'Taksit sayısı', value: debt ? debt.installmentCount : '' });
  const startDate = el('input', { class: 'input', type: 'date', value: toDateInput(debt ? debt.startDate : nowISO()) });
  const payday = el('input', { class: 'input', type: 'number', min: '1', max: '31', placeholder: 'Ayın günü (1-31)', value: debt ? debt.paymentDay : 1 });
  const accSel = selectFrom2(store.accounts.map((a) => ({ value: a.id, label: a.name })), debt ? debt.accountId : (store.accounts[0] || {}).id);
  const desc = el('input', { class: 'input', type: 'text', placeholder: 'Açıklama (opsiyonel)', value: debt ? debt.description : '' });
  const note = el('textarea', { class: 'input', rows: '2', placeholder: 'Not (opsiyonel)' });
  if (debt) note.value = debt.note || '';

  const calcHint = el('div', { class: 'calc-hint muted small' });
  function recalc() {
    const t = parseFloat(String(total.value).replace(',', '.')) || 0;
    const c = parseInt(count.value, 10) || 0;
    const mp = parseFloat(String(monthly.value).replace(',', '.')) || 0;
    if (t > 0 && c > 0 && !mp) { monthly.value = Math.round((t / c) * 100) / 100; }
    const m2 = parseFloat(String(monthly.value).replace(',', '.')) || 0;
    if (c > 0 && m2 > 0) calcHint.textContent = `Hesaplanan: ${c} taksit × ${money(m2)} ≈ ${money(m2 * c)}${t && Math.abs(m2 * c - t) > 1 ? ` (son taksit farkı: ${money(t - m2 * (c - 1))})` : ''}`;
    else calcHint.textContent = '';
  }
  [total, monthly, count].forEach((i) => i.addEventListener('input', recalc));
  recalc();

  const form = el('form', { class: 'tx-form' }, [
    field2('Borç adı', name),
    field2('Borç türü', type),
    field2('Toplam borç (₺)', total),
    field2('Aylık taksit (₺)', monthly, 'Boş bırakılırsa toplam ÷ taksit sayısı ile hesaplanır.'),
    field2('Toplam taksit sayısı', count),
    calcHint,
    field2('İlk ödeme tarihi', startDate),
    field2('Her ay ödeme günü', payday),
    field2('Hesap / Banka', accSel),
    field2('Açıklama', desc),
    field2('Not', note),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: debt ? 'Güncelle' : 'Borcu Ekle' }),
    ]),
  ]);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = parseFloat(String(total.value).replace(',', '.')) || 0;
    const c = parseInt(count.value, 10) || 0;
    let mp = parseFloat(String(monthly.value).replace(',', '.')) || 0;
    if (!name.value.trim()) return toast('Borç adı girin.', 'error');
    if (!(c > 0)) return toast('Taksit sayısı 1 veya daha fazla olmalı.', 'error');
    if (!mp && t > 0) mp = Math.round((t / c) * 100) / 100;
    if (!(mp > 0)) return toast('Aylık taksit veya toplam borç girin.', 'error');
    if (!accSel.value) return toast('Bir hesap seçin.', 'error');
    const data = {
      name: name.value, type: type.value, totalAmount: t || mp * c, monthlyPayment: mp,
      installmentCount: c, startDate: fromDateInput(startDate.value),
      paymentDay: parseInt(payday.value, 10) || 1, accountId: accSel.value,
      description: desc.value, note: note.value,
    };
    if (debt) { store.updateDebt(debt.id, { name: data.name, type: data.type, accountId: data.accountId, description: data.description, note: data.note, paymentDay: data.paymentDay }); toast('Borç güncellendi.'); }
    else { store.addDebt(data); toast('Borç eklendi.'); }
    onDone && onDone();
  });
  return form;
}

// Fatura / düzenli ödeme formu (RecurringPayment)
export function billForm({ bill = null, onDone } = {}) {
  const name = el('input', { class: 'input', type: 'text', placeholder: 'Örn. Elektrik', required: 'true', value: bill ? bill.name : '' });
  const amount = el('input', { class: 'input', type: 'number', min: '0', step: '0.01', placeholder: 'Tutar', value: bill ? bill.amount : '' });
  const cats = store.categoriesByType('expense');
  const catSel = selectFrom2(cats.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })), bill ? bill.categoryId : (cats.find((c) => c.name === 'Fatura') || cats[0] || {}).id);
  const accSel = selectFrom2(store.accounts.map((a) => ({ value: a.id, label: a.name })), bill ? bill.accountId : (store.accounts[0] || {}).id);
  const payday = el('input', { class: 'input', type: 'number', min: '1', max: '31', placeholder: 'Ayın günü', value: bill ? bill.paymentDay : 1 });
  const reminder = el('input', { class: 'input', type: 'number', min: '0', max: '30', value: bill ? bill.reminderDaysBefore : 3 });
  const grace = el('input', { class: 'input', type: 'number', min: '0', max: '30', value: bill ? bill.gracePeriodDays : 3 });

  const form = el('form', { class: 'tx-form' }, [
    field2('Ödeme adı', name),
    field2('Tutar (₺)', amount),
    field2('Kategori', catSel),
    field2('Hesap / Banka', accSel),
    field2('Her ay ödeme günü', payday, 'Son ödeme günü. Örn. "Her ayın 20’si".'),
    el('div', { class: 'field-row2' }, [
      field2('Hatırlatma (gün önce)', reminder),
      field2('Gecikme toleransı (gün)', grace),
    ]),
    el('div', { class: 'modal-actions' }, [
      el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: bill ? 'Güncelle' : 'Ödeme Ekle' }),
    ]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amt = parseFloat(String(amount.value).replace(',', '.')) || 0;
    if (!name.value.trim()) return toast('Ödeme adı girin.', 'error');
    if (!(amt > 0)) return toast('Geçerli bir tutar girin.', 'error');
    if (!accSel.value) return toast('Bir hesap seçin.', 'error');
    const data = {
      name: name.value, amount: amt, categoryId: catSel.value, accountId: accSel.value,
      paymentDay: parseInt(payday.value, 10) || 1,
      reminderDaysBefore: parseInt(reminder.value, 10) || 0,
      gracePeriodDays: parseInt(grace.value, 10) || 0,
    };
    if (bill) { store.updateBill(bill.id, data); toast('Ödeme güncellendi.'); }
    else { store.addBill(data); toast('Düzenli ödeme eklendi.'); }
    onDone && onDone();
  });
  return form;
}
