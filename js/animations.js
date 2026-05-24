/* =================================================================
   ANİMASYONLAR — Framer Motion (Motion OSS) ile gelişmiş UI geçişleri
   https://motion.dev
   ================================================================= */

import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm";

// ─── Ortak easing değerleri ────────────────────────────────────────────────
const ease     = [0.22, 1, 0.36, 1];         // ease-out-expo: hızlı başlar, yumuşak biter
const easeBounce = [0.34, 1.56, 0.64, 1];    // hafif overshoot, spring hissi

// ─── CSS çakışmalarını devre dışı bırak ───────────────────────────────────
// Motion animasyonlarıyla çakışan CSS transition/animation'ları kapat
const motionStyle = document.createElement('style');
motionStyle.textContent = `
  /* Motion'a devredilen elemanlar — CSS animasyonları devre dışı */
  [data-motion-managed] {
    animation: none !important;
    transition: none !important;
  }
  /* Tab section'ları için başlangıç opacity */
  section[id^="tab-"]:not(.hidden) { will-change: opacity, transform; }
`;
document.head.appendChild(motionStyle);

// ─── YARDIMCI: Bir elemanı "Motion yönetiminde" işaretle ──────────────────
function motionManage(el) {
  if (el) el.setAttribute('data-motion-managed', '');
  return el;
}

// ─── 1. LOGİN KARTI GİRİŞ ANİMASYONU ─────────────────────────────────────
const loginCard = document.querySelector('#loginView .card');
if (loginCard && !document.getElementById('loginView').classList.contains('hidden')) {
  animate(loginCard,
    { opacity: [0, 1], y: [36, 0], scale: [0.96, 1] },
    { duration: 0.55, easing: ease }
  );
}

// ─── 2. SEKME GEÇİŞ ANİMASYONU ────────────────────────────────────────────
// switchTab (app.js'de tanımlı) override: yeni section fade+slide ile girer
const _origSwitchTab = window.switchTab;
if (_origSwitchTab) {
  window.switchTab = function(t) {
    _origSwitchTab(t);
    const section = document.getElementById('tab-' + t);
    if (section && !section.classList.contains('hidden')) {
      animate(section,
        { opacity: [0, 1], y: [10, 0] },
        { duration: 0.28, easing: ease }
      );
    }
  };
}

// ─── 3. GÖREV KARTLARI STAGGER ────────────────────────────────────────────
function staggerCards(containerEl, selector = '.tcard') {
  if (!containerEl) return;
  new MutationObserver(() => {
    const fresh = containerEl.querySelectorAll(selector + ':not([data-a])');
    if (!fresh.length) return;
    fresh.forEach(c => {
      c.setAttribute('data-a', '1');
      c.style.opacity = '0';
    });
    animate(fresh,
      { opacity: [0, 1], y: [18, 0] },
      { delay: stagger(0.045, { startDelay: 0.05 }), duration: 0.38, easing: ease }
    );
  }).observe(containerEl, { childList: true, subtree: true });
}

staggerCards(document.getElementById('taskList'));
staggerCards(document.getElementById('libList'));

// ─── 4. MEKANİK KARTLAR STAGGER ───────────────────────────────────────────
staggerCards(document.getElementById('mechList'), '.mech-card');

// ─── 5. MODAL GİRİŞ ANİMASYONU ────────────────────────────────────────────
// .modal-bg elemanlarında 'show' class eklenince içindeki .modal scale+fade ile girer
function watchModal(bgEl) {
  if (!bgEl) return;
  let wasShown = false;
  new MutationObserver(() => {
    const isShown = bgEl.classList.contains('show');
    if (isShown && !wasShown) {
      wasShown = true;
      const inner = bgEl.querySelector('.modal');
      if (inner) {
        motionManage(inner);
        animate(inner,
          { opacity: [0, 1], scale: [0.94, 1], y: [14, 0] },
          { duration: 0.3, easing: ease }
        );
      }
    } else if (!isShown) {
      wasShown = false;
    }
  }).observe(bgEl, { attributes: true, attributeFilter: ['class'] });
}

document.querySelectorAll('.modal-bg').forEach(watchModal);

// ─── 6. BAŞARI POPUP — SPRING BOUNCE ──────────────────────────────────────
// Görev tamamlandığında veya seviye atlandığında güçlü bir entrance
const achieveBg = document.getElementById('achievementModal');
const achievePopup = document.getElementById('achievementPopup');
if (achieveBg && achievePopup) {
  let prevInner = '';
  new MutationObserver(() => {
    const isShown = achieveBg.classList.contains('show');
    const curInner = achievePopup.innerHTML;
    if (isShown && curInner && curInner !== prevInner) {
      prevInner = curInner;
      animate(achievePopup,
        { opacity: [0, 1], scale: [0.35, 1.08, 0.96, 1] },
        { duration: 0.55, easing: easeBounce }
      );
    }
    if (!isShown) prevInner = '';
  }).observe(achieveBg,   { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => {
    if (achieveBg.classList.contains('show') && achievePopup.innerHTML) {
      animate(achievePopup,
        { opacity: [0, 1], scale: [0.35, 1.08, 0.96, 1] },
        { duration: 0.55, easing: easeBounce }
      );
    }
  }).observe(achievePopup, { childList: true });
}

// ─── 7. ONBOARDING MODAL ──────────────────────────────────────────────────
const onboardingBg = document.getElementById('onboarding');
if (onboardingBg) {
  new MutationObserver(() => {
    if (onboardingBg.classList.contains('show')) {
      const modal = onboardingBg.querySelector('.onboarding-modal');
      if (modal) {
        animate(modal,
          { opacity: [0, 1], scale: [0.93, 1], y: [24, 0] },
          { duration: 0.4, easing: ease }
        );
      }
    }
  }).observe(onboardingBg, { attributes: true, attributeFilter: ['class'] });
}

// ─── 8. TOAST — SPRING SLIDE-UP ───────────────────────────────────────────
// CSS transition'ı devre dışı bırak, Motion ile yönet
const toastEl = document.getElementById('toast');
if (toastEl) {
  motionManage(toastEl);

  const _origToast = window.toast;
  if (_origToast) {
    let closeTimer;
    window.toast = function(m, k) {
      // Metni ve class'ı ayarla (orijinal davranış)
      toastEl.textContent = m;
      toastEl.className = 'toast show ' + (k || '');

      // Önceki kapanma animasyonunu iptal et
      clearTimeout(closeTimer);

      // Giriş animasyonu — spring ile yukarı fırla
      animate(toastEl,
        { opacity: [0, 1], y: [48, 0] },
        { duration: 0.4, easing: easeBounce }
      );

      // 2.5 saniye sonra çıkış animasyonu
      closeTimer = setTimeout(() => {
        animate(toastEl,
          { opacity: [1, 0], y: [0, 16] },
          { duration: 0.25, easing: [0.4, 0, 1, 1] }
        ).then(() => {
          toastEl.className = 'toast';
        });
      }, 2500);
    };
  }
}

// ─── 9. APP GİRİŞ ANİMASYONU (login sonrası) ──────────────────────────────
// boot() override: uygulama görünümü ilk kez açılınca header+main slide-down ile girer
const _origBoot = window.boot;
if (_origBoot) {
  window.boot = function() {
    _origBoot();
    const appView = document.getElementById('appView');
    if (appView && !appView.classList.contains('hidden')) {
      const header = appView.querySelector('header');
      const main   = appView.querySelector('main');
      if (header) animate(header, { opacity: [0, 1], y: [-20, 0] }, { duration: 0.4, easing: ease });
      if (main)   animate(main,   { opacity: [0, 1], y: [20, 0]  }, { duration: 0.45, easing: ease, delay: 0.08 });
    }
  };
}

// ─── 10. MOBİL BOTTOM NAV — İKON BOUNCE ───────────────────────────────────
// touchstart kullanıyoruz: pointerdown/click'ten ~300ms önce tetiklenir
document.querySelectorAll('.bnav-item').forEach(item => {
  // Görsel geri bildirim için touchstart (en erken olay)
  const bounce = function() {
    const ico = this.querySelector('.bnav-ico');
    if (ico) {
      animate(ico,
        { scale: [1, 0.72, 1.18, 1] },
        { duration: 0.32, easing: easeBounce }
      );
    }
  };
  item.addEventListener('touchstart', bounce, { passive: true });
  // Mouse için (PC)
  item.addEventListener('mousedown', bounce);
});

// ─── 11. XP BAR — SMOOTH FILL ANİMASYONU ──────────────────────────────────
// renderXpBar() sonrası progress'i 0'dan hedef değere animate et
const _origRenderXpBar = window.renderXpBar;
if (_origRenderXpBar) {
  window.renderXpBar = function() {
    _origRenderXpBar();
    const prog = document.getElementById('xpProgress');
    if (!prog) return;
    // Mevcut hedef değeri al (renderXpBar az önce set etti)
    const targetPct = parseFloat(prog.style.getPropertyValue('--xpp')) || 0;
    prog.style.setProperty('--xpp', '0%');
    animate((p) => {
      prog.style.setProperty('--xpp', (p * targetPct) + '%');
    }, { duration: 1.1, easing: ease });
  };
}

// ─── 12. BUTON PRESS EFEKTİ ───────────────────────────────────────────────
// .btn ve .pal-btn için anında scale feedback (touchstart ile 300ms önce)
function btnDown(e) {
  const btn = e.target.closest('.btn, .pal-btn');
  if (!btn) return;
  animate(btn, { scale: [1, 0.93] }, { duration: 0.08 });
}
function btnUp(e) {
  const btn = e.target.closest('.btn, .pal-btn');
  if (!btn) return;
  animate(btn, { scale: [0.93, 1] }, { duration: 0.22, easing: easeBounce });
}
document.addEventListener('touchstart', btnDown, { passive: true });
document.addEventListener('touchend',   btnUp,   { passive: true });
document.addEventListener('mousedown',  btnDown);
document.addEventListener('mouseup',    btnUp);

// ─── 13. TEZGÂH ELEMAN CARD GİRİŞİ (sandbox/task açılınca) ──────────────
// .node elemanları sahneye eklenince fade+scale ile belirir
const stageInner = document.getElementById('stageInner');
if (stageInner) {
  new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList.contains('node')) {
          animate(node,
            { opacity: [0, 1], scale: [0.85, 1] },
            { duration: 0.25, easing: easeBounce }
          );
        }
      });
    });
  }).observe(stageInner, { childList: true });
}
