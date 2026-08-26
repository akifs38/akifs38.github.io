// auth.js — Giriş / kayıt ekranı. Bulut modunda Firebase Auth (e-posta/şifre + Google),
// yerel modda localStorage tabanlı kimlik doğrulama kullanır.

import { el } from './utils.js';
import { store } from './store.js';
import { toast } from './ui.js';
import { cloud, signIn, signUp, cloudErrorMessage } from './cloud.js';

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
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        if (cloud.enabled) {
          if (!isLogin && pass.value.length < 6) throw new Error('Şifre en az 6 karakter olmalı.');
          if (!isLogin) await signUp(name.value.trim(), email.value, pass.value);
          else await signIn(email.value, pass.value);
          // Başarılıysa onAuth dinleyicisi ekranı çizer; burada bir şey yapma.
        } else {
          if (!isLogin) {
            if (!name.value.trim()) throw new Error('Adını gir.');
            if (pass.value.length < 6) throw new Error('Şifre en az 6 karakter olmalı.');
            await store.register(name.value.trim(), email.value, pass.value);
            toast('Hesabın oluşturuldu, hoş geldin!');
          } else {
            await store.login(email.value, pass.value);
          }
          onSuccess();
        }
      } catch (err) {
        btn.disabled = false;
        toast(cloud.enabled ? cloudErrorMessage(err) : (err.message || 'Bir hata oluştu.'), 'error');
      }
    });

    const switcher = el('p', { class: 'auth-switch muted' }, [
      isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? ',
      el('button', { type: 'button', class: 'link-btn', text: isLogin ? 'Kayıt ol' : 'Giriş yap', onClick: () => { mode = isLogin ? 'register' : 'login'; draw(); } }),
    ]);

    // Bulut modunda Google ile giriş seçeneği
    const extras = [];
    if (cloud.enabled) {
      extras.push(el('div', { class: 'auth-divider' }, [el('span', { text: 'veya' })]));
      extras.push(el('button', {
        type: 'button', class: 'btn btn-ghost btn-block google-btn',
        html: '<span class="g-logo">G</span> Google ile devam et',
        onClick: async (ev) => {
          ev.currentTarget.disabled = true;
          try {
            const { signInWithGoogle } = await import('./cloud.js');
            await signInWithGoogle();
          } catch (err) {
            ev.currentTarget.disabled = false;
            toast(cloudErrorMessage(err), 'error');
          }
        },
      }));
    }

    const note = cloud.enabled
      ? 'Verilerin Firebase bulutunda güvenli şekilde saklanır ve tüm cihazlarında otomatik senkronlanır.'
      : 'Verilerin yalnızca bu tarayıcıda, senin cihazında saklanır. Hiçbir bankaya bağlanılmaz.';

    host.appendChild(el('div', { class: 'auth-card' }, [
      el('div', { class: 'auth-brand' }, [
        el('div', { class: 'brand-logo', text: '₺' }),
        el('h1', { text: 'Finans' }),
        el('p', { class: 'muted', text: 'Kişisel Finans ve Bütçe Yönetimi' }),
      ]),
      el('h2', { class: 'auth-title', text: isLogin ? 'Tekrar hoş geldin' : 'Yeni hesap oluştur' }),
      form,
      ...extras,
      switcher,
      el('p', { class: 'auth-note muted small', text: note }),
    ]));
  }

  draw();
  mountEl.innerHTML = '';
  mountEl.appendChild(host);
}
