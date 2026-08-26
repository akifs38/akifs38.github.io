// auth.js — Giriş ve kayıt ekranı (istemci tarafı, kullanıcı bazlı izolasyon).

import { el } from './utils.js';
import { store } from './store.js';
import { toast } from './ui.js';

export function renderAuth(mountEl, onSuccess) {
  let mode = 'login';
  const host = el('div', { class: 'auth-screen' });

  function draw() {
    host.innerHTML = '';
    const isLogin = mode === 'login';

    const name = el('input', { class: 'input', type: 'text', placeholder: 'Adın', autocomplete: 'name' });
    const email = el('input', { class: 'input', type: 'email', placeholder: 'E-posta', autocomplete: 'email', required: 'true' });
    const pass = el('input', { class: 'input', type: 'password', placeholder: 'Şifre', autocomplete: isLogin ? 'current-password' : 'new-password', required: 'true' });

    const form = el('form', { class: 'auth-form' }, [
      isLogin ? null : el('label', { class: 'field' }, [el('span', { class: 'field-label', text: 'Ad' }), name]),
      el('label', { class: 'field' }, [el('span', { class: 'field-label', text: 'E-posta' }), email]),
      el('label', { class: 'field' }, [el('span', { class: 'field-label', text: 'Şifre' }), pass]),
      el('button', { type: 'submit', class: 'btn btn-primary btn-block', text: isLogin ? 'Giriş Yap' : 'Kayıt Ol' }),
    ]);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        if (!isLogin) {
          if (!name.value.trim()) return toast('Adını gir.', 'error');
          if (pass.value.length < 6) return toast('Şifre en az 6 karakter olmalı.', 'error');
          await store.register(name.value.trim(), email.value, pass.value);
          toast('Hesabın oluşturuldu, hoş geldin!');
        } else {
          await store.login(email.value, pass.value);
        }
        onSuccess();
      } catch (err) {
        toast(err.message || 'Bir hata oluştu.', 'error');
      }
    });

    const switcher = el('p', { class: 'auth-switch muted' }, [
      isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? ',
      el('button', { type: 'button', class: 'link-btn', text: isLogin ? 'Kayıt ol' : 'Giriş yap', onClick: () => { mode = isLogin ? 'register' : 'login'; draw(); } }),
    ]);

    host.appendChild(el('div', { class: 'auth-card' }, [
      el('div', { class: 'auth-brand' }, [
        el('div', { class: 'brand-logo', text: '₺' }),
        el('h1', { text: 'Finans' }),
        el('p', { class: 'muted', text: 'Kişisel Finans ve Bütçe Yönetimi' }),
      ]),
      el('h2', { class: 'auth-title', text: isLogin ? 'Tekrar hoş geldin' : 'Yeni hesap oluştur' }),
      form,
      switcher,
      el('p', { class: 'auth-note muted small', text: 'Verilerin yalnızca bu tarayıcıda, senin cihazında saklanır. Hiçbir bankaya bağlanılmaz.' }),
    ]));
  }

  draw();
  mountEl.innerHTML = '';
  mountEl.appendChild(host);
}
