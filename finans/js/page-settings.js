// page-settings.js — Ayarlar: profil, görünüm, kategoriler, tekrarlayan ödemeler,
// aylık plan, şifre değiştirme, demo/temizleme, çıkış.

import { el, money, monthLabel, esc } from './utils.js';
import { store, nextDateOf } from './store.js';
import { openModal, confirmDialog, toast, sectionCard, statCard } from './ui.js';
import { categoryForm, recurringForm } from './forms.js';
import { applyTheme, logoutAndRedirect } from './app.js';

export function renderSettings(root, ctx) {
  const wrap = el('div', { class: 'page' });
  wrap.appendChild(el('div', { class: 'page-head' }, [el('h1', { text: 'Ayarlar' })]));

  wrap.append(
    profileSection(),
    appearanceSection(ctx),
    categoriesSection(ctx),
    recurringSection(ctx),
    planSection(ctx),
    securitySection(),
    dataSection(ctx),
  );
  root.appendChild(wrap);
}

function profileSection() {
  const u = store.user;
  return sectionCard('Profil', el('div', { class: 'settings-block' }, [
    el('div', { class: 'profile-row' }, [
      el('div', { class: 'avatar', text: (u.name || '?').slice(0, 1).toUpperCase() }),
      el('div', {}, [
        el('strong', { text: u.name }),
        el('div', { class: 'muted small', text: u.email }),
      ]),
    ]),
  ]));
}

function appearanceSection(ctx) {
  const dark = store.data.settings.theme === 'dark';
  const toggle = el('button', {
    class: 'switch' + (dark ? ' on' : ''), role: 'switch', 'aria-checked': String(dark),
    onClick: (e) => {
      const next = store.data.settings.theme === 'dark' ? 'light' : 'dark';
      store.updateSettings({ theme: next });
      applyTheme(next);
      e.currentTarget.classList.toggle('on');
      toast(next === 'dark' ? 'Koyu tema açık.' : 'Açık tema.');
    },
  }, [el('span', { class: 'switch-knob' })]);
  return sectionCard('Görünüm', el('div', { class: 'settings-block' }, [
    el('div', { class: 'setting-row' }, [
      el('div', {}, [el('strong', { text: 'Koyu Tema' }), el('div', { class: 'muted small', text: 'Karanlık ortamlar için göz dostu görünüm.' })]),
      toggle,
    ]),
  ]));
}

function categoriesSection(ctx) {
  const list = el('div', { class: 'chip-list' });
  const render = () => {
    list.innerHTML = '';
    for (const c of store.categories) {
      list.appendChild(el('div', { class: 'cat-manage' }, [
        el('span', { class: 'cat-chip', html: `${c.icon} ${esc(c.name)} <em class="muted">${c.type === 'income' ? 'gelir' : 'gider'}</em>` }),
        el('button', { class: 'icon-btn', title: 'Düzenle', html: '✏️', onClick: () => { const m = openModal({ title: 'Kategoriyi Düzenle', body: categoryForm({ category: c, onDone: () => { m.close(); render(); } }) }); } }),
        el('button', { class: 'icon-btn', title: 'Sil', html: '🗑️', onClick: () => confirmDialog({ title: 'Kategoriyi sil', message: `"${c.name}" kategorisi silinecek. İlişkili işlemler kategorisiz kalır.`, onConfirm: () => { store.deleteCategory(c.id); toast('Kategori silindi.'); render(); } }) }),
      ]));
    }
  };
  render();
  const addBtn = el('button', { class: 'btn btn-ghost btn-sm', text: '+ Kategori Ekle', onClick: () => { const m = openModal({ title: 'Kategori Ekle', body: categoryForm({ onDone: () => { m.close(); render(); } }) }); } });
  return sectionCard('Kategoriler', el('div', { class: 'settings-block' }, [list, addBtn]));
}

function recurringSection(ctx) {
  const list = el('div', { class: 'list' });
  const render = () => {
    list.innerHTML = '';
    if (!store.recurring.length) {
      list.appendChild(el('p', { class: 'muted', text: 'Tanımlı tekrarlayan gelir/gider yok.' }));
    }
    for (const r of store.recurring) {
      const cat = store.categoryById(r.categoryId);
      const freqLabel = { monthly: 'Aylık', weekly: 'Haftalık', yearly: 'Yıllık' }[r.frequency] || 'Aylık';
      list.appendChild(el('div', { class: 'list-row' }, [
        el('span', { class: 'lr-icon', text: cat ? cat.icon : (r.type === 'income' ? '💰' : '🧾') }),
        el('div', { class: 'lr-main' }, [
          el('span', { class: 'lr-name', text: r.description }),
          el('span', { class: 'muted small', text: `${freqLabel} · ${r.type === 'income' ? 'Gelir' : 'Gider'} · Sonraki: ${nextDateOf(r).toLocaleDateString('tr-TR')}` }),
        ]),
        el('strong', { class: r.type === 'income' ? 'pos' : 'neg', text: money(r.amount, { compact: true }) }),
        el('button', { class: 'icon-btn', title: 'Düzenle', html: '✏️', onClick: () => { const m = openModal({ title: 'Tekrarlayan Ödemeyi Düzenle', body: recurringForm({ rec: r, onDone: () => { m.close(); render(); } }) }); } }),
        el('button', { class: 'icon-btn', title: 'Sil', html: '🗑️', onClick: () => confirmDialog({ title: 'Sil', message: `"${r.description}" silinecek.`, onConfirm: () => { store.deleteRecurring(r.id); toast('Silindi.'); render(); } }) }),
      ]));
    }
  };
  render();
  const addBtn = el('button', {
    class: 'btn btn-ghost btn-sm', text: '+ Tekrarlayan Ekle',
    onClick: () => {
      if (!store.accounts.length) { toast('Önce bir hesap ekleyin.', 'error'); return; }
      const m = openModal({ title: 'Tekrarlayan Ödeme Ekle', body: recurringForm({ onDone: () => { m.close(); render(); } }) });
    },
  });
  return sectionCard('Sabit / Tekrarlayan Ödemeler', el('div', { class: 'settings-block' }, [list, addBtn]));
}

function planSection(ctx) {
  const { year, month } = ctx;
  const plan = store.planFor(year, month) || {};
  const mk = (key, ph, val) => el('input', { class: 'input', type: 'number', min: '0', step: '0.01', placeholder: ph, value: val ?? '', dataset: { key } });
  const income = mk('expectedIncome', 'Beklenen gelir', plan.expectedIncome);
  const fixed = mk('fixedExpense', 'Sabit gider', plan.fixedExpense);
  const variable = mk('variableBudget', 'Değişken gider bütçesi', plan.variableBudget);
  const savings = mk('savingsGoal', 'Tasarruf hedefi', plan.savingsGoal);
  const resultEl = el('div', { class: 'power-result pos' }, [el('span', { text: 'Beklenen kalan' }), el('strong', {})]);

  const recalc = () => {
    const i = num(income); const f = num(fixed); const v = num(variable); const sv = num(savings);
    const rem = i - f - v - sv;
    resultEl.classList.toggle('neg', rem < 0);
    resultEl.classList.toggle('pos', rem >= 0);
    resultEl.querySelector('strong').textContent = money(rem, { compact: true });
  };
  [income, fixed, variable, savings].forEach((inp) => inp.addEventListener('input', recalc));
  recalc();

  const save = el('button', {
    class: 'btn btn-primary btn-sm', text: 'Planı Kaydet',
    onClick: () => {
      store.setPlan(year, month, {
        expectedIncome: num(income), fixedExpense: num(fixed),
        variableBudget: num(variable), savingsGoal: num(savings),
      });
      toast('Aylık plan kaydedildi.');
      ctx.rerender && ctx.rerender();
    },
  });

  const body = el('div', { class: 'settings-block plan-form' }, [
    el('p', { class: 'muted small', text: `${monthLabel(year, month)} için plan. Değerler dashboard’daki "harcama gücü" ve "finansal denge" alanlarını besler.` }),
    labeled('Beklenen gelir', income),
    labeled('Sabit gider', fixed),
    labeled('Değişken gider bütçesi', variable),
    labeled('Tasarruf hedefi', savings),
    resultEl,
    save,
  ]);
  return sectionCard('Aylık Finansal Plan', body);
}

function labeled(text, control) {
  return el('label', { class: 'field' }, [el('span', { class: 'field-label', text }), control]);
}
function num(inp) { return parseFloat(String(inp.value).replace(',', '.')) || 0; }

function securitySection() {
  const oldP = el('input', { class: 'input', type: 'password', placeholder: 'Mevcut şifre', autocomplete: 'current-password' });
  const newP = el('input', { class: 'input', type: 'password', placeholder: 'Yeni şifre (en az 6 karakter)', autocomplete: 'new-password' });
  const newP2 = el('input', { class: 'input', type: 'password', placeholder: 'Yeni şifre (tekrar)', autocomplete: 'new-password' });
  const form = el('form', { class: 'settings-block' }, [
    labeled('Mevcut şifre', oldP),
    labeled('Yeni şifre', newP),
    labeled('Yeni şifre (tekrar)', newP2),
    el('button', { type: 'submit', class: 'btn btn-primary btn-sm', text: 'Şifreyi Değiştir' }),
  ]);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (newP.value.length < 6) { toast('Yeni şifre en az 6 karakter olmalı.', 'error'); return; }
    if (newP.value !== newP2.value) { toast('Yeni şifreler eşleşmiyor.', 'error'); return; }
    try {
      await store.changePassword(oldP.value, newP.value);
      toast('Şifre değiştirildi.');
      form.reset();
    } catch (err) { toast(err.message, 'error'); }
  });
  return sectionCard('Güvenlik', form);
}

function dataSection(ctx) {
  const demo = el('button', {
    class: 'btn btn-ghost btn-sm', text: '📥 Demo Verileri Yükle',
    onClick: () => confirmDialog({
      title: 'Demo verileri yükle', danger: false, confirmText: 'Yükle',
      message: 'Mevcut tüm verilerin örnek verilerle DEĞİŞTİRİLECEK. Devam edilsin mi?',
      onConfirm: async () => { await store.seedDemo(); toast('Demo veriler yüklendi.'); ctx.rerender(); },
    }),
  });
  const clear = el('button', {
    class: 'btn btn-danger btn-sm', text: '🗑️ Tüm Verileri Temizle',
    onClick: () => confirmDialog({
      title: 'Tüm verileri temizle',
      message: 'Hesaplar, işlemler, bütçeler ve planlar dahil tüm verilerin silinecek. Bu işlem geri alınamaz.',
      onConfirm: () => { store.clearAllData(); toast('Tüm veriler temizlendi.'); ctx.rerender(); },
    }),
  });
  const logout = el('button', {
    class: 'btn btn-ghost btn-sm', text: '🚪 Çıkış Yap',
    onClick: () => confirmDialog({ title: 'Çıkış yap', danger: false, confirmText: 'Çıkış', message: 'Hesabından çıkış yapılsın mı?', onConfirm: () => logoutAndRedirect() }),
  });
  return sectionCard('Veri ve Oturum', el('div', { class: 'settings-block data-actions' }, [demo, clear, logout]));
}
