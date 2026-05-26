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

// ─── 1. LOGİN SAHNE GİRİŞ ANİMASYONU ─────────────────────────────────────
const loginView = document.getElementById('loginView');
if (loginView && !loginView.classList.contains('hidden')) {
  // Logo + başlık stagger ile içeri girer
  const logoBrand = loginView.querySelector('.login-brand');
  const loginCard = loginView.querySelector('.login-card-new');
  const loginStd  = loginView.querySelector('.login-stdline');

  if (logoBrand) animate(logoBrand,
    { opacity: [0, 1], y: [20, 0], scale: [0.95, 1] },
    { duration: 0.55, easing: ease }
  );
  if (loginCard) animate(loginCard,
    { opacity: [0, 1], y: [30, 0], scale: [0.97, 1] },
    { duration: 0.6, easing: ease, delay: 0.12 }
  );
  if (loginStd) animate(loginStd,
    { opacity: [0, 1] },
    { duration: 0.5, easing: ease, delay: 0.35 }
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

// ─────────────────────────────────────────────────────────────────────────
//  BÖLÜM 2: GELİŞMİŞ ETKİLEŞİM ANİMASYONLARI
// ─────────────────────────────────────────────────────────────────────────

// prefers-reduce-motion kontrolü — erişilebilirlik
const _reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── 14. KANFETİ PATLAMASI (yardımcı fonksiyon) ───────────────────────────
function _confettiBurst(cx, cy) {
  if (_reduceMotion) return;
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '9998'
  });
  document.body.appendChild(canvas);
  const dpr  = devicePixelRatio || 1;
  canvas.width  = innerWidth  * dpr;
  canvas.height = innerHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const COLS = ['#f5b301','#27d07a','#3aa0ff','#ff4d4f','#fff','#ff7a18','#a855f7'];
  const pts  = Array.from({ length: 72 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - .5) * 22,
    vy: (Math.random() - .5) * 20 - 5,
    r: Math.random() * 4 + 2,
    rot: Math.random() * 360,
    rv: (Math.random() - .5) * 11,
    rect: Math.random() > .38,
    w: Math.random() * 9 + 3, h: Math.random() * 4 + 2,
    c: COLS[Math.floor(Math.random() * COLS.length)],
    life: 1, decay: Math.random() * .016 + .011
  }));

  let raf;
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      p.vy += .3; p.vx *= .985; p.rot += p.rv;
      p.life -= p.decay;
      if (p.life <= 0) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 2.5);
      ctx.fillStyle   = p.c;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      if (p.rect) { ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); }
      else        { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(draw);
    else canvas.remove();
  };
  raf = requestAnimationFrame(draw);
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, 3800);
}

// ─── 15. KONTROL SONUCU ANİMASYONU ────────────────────────────────────────
// checkTask() override: PASS → skor sayacı + konfeti + pulse; FAIL → titreme + stagger
const _origCheckTask = window.checkTask;
if (_origCheckTask) {
  window.checkTask = function () {
    _origCheckTask();

    if (_reduceMotion) return;
    requestAnimationFrame(() => {
      const scoreEl  = document.getElementById('scoreNum');
      const checkBtn = document.getElementById('checkBtn');
      const liveErr  = document.getElementById('liveErr');
      const scoreOf  = document.getElementById('scoreOf');
      if (!scoreEl) return;

      const target   = parseFloat(scoreEl.textContent) || 0;
      const total    = parseFloat((scoreOf?.textContent || '').replace('/', '').trim()) || 0;
      const isPass   = target > 0 && target === total && !(liveErr?.innerHTML.trim());

      // Skor sayacı: 0 → target
      if (target > 0 && !_reduceMotion) {
        scoreEl.textContent = '0';
        const startT = performance.now(), dur = 580;
        const countUp = ts => {
          const p = Math.min((ts - startT) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3); // ease-out-cubic
          scoreEl.textContent = Math.round(e * target);
          if (p < 1) requestAnimationFrame(countUp);
          else scoreEl.textContent = target;
        };
        requestAnimationFrame(countUp);
      }

      if (isPass) {
        // Renk — yeşil
        scoreEl.classList.remove('score-fail');
        scoreEl.classList.add('score-pass');

        // Buton pulse
        if (checkBtn) {
          checkBtn.classList.add('check-pass-ring');
          animate(checkBtn, { scale: [1, 0.88, 1.12, 1] }, { duration: 0.45, easing: easeBounce });
          setTimeout(() => checkBtn.classList.remove('check-pass-ring'), 700);
        }
        // Skor sayısı zıpla
        setTimeout(() => {
          if (scoreEl) animate(scoreEl, { scale: [1, 1.5, 0.95, 1] }, { duration: 0.42, easing: easeBounce });
        }, 380);
        // Konfeti — checkBtn merkezinden
        const ref = checkBtn || scoreEl;
        const r   = ref.getBoundingClientRect();
        setTimeout(() => _confettiBurst((r.left + r.right) / 2, r.top + r.height / 2), 220);

      } else if (liveErr?.innerHTML.trim()) {
        // Renk — kırmızı
        scoreEl.classList.remove('score-pass');
        scoreEl.classList.add('score-fail');

        // Buton fail ring
        if (checkBtn) {
          checkBtn.classList.add('check-fail-ring');
          setTimeout(() => checkBtn.classList.remove('check-fail-ring'), 500);
        }
        // Skor titredi
        setTimeout(() => {
          if (scoreEl) animate(scoreEl, { x: [0, -9, 9, -7, 7, -3, 3, 0] }, { duration: 0.42 });
        }, 280);
        // Hata listesi stagger
        if (liveErr?.children.length) {
          animate([...liveErr.children],
            { opacity: [0, 1], x: [-14, 0] },
            { delay: stagger(0.07), duration: 0.24, easing: ease }
          );
        }
      }
    });
  };
}

// ─── 16. ENERJİ SWEEP ─────────────────────────────────────────────────────
// energize() açıldığında sahne üzerinden ışıklı tarama çizgisi geçer
const _origEnergize = window.energize;
if (_origEnergize) {
  window.energize = function () {
    const wasOff = !window.SIM_STATE?._energized;
    _origEnergize();

    if (!_reduceMotion && wasOff) {
      const scroll = document.getElementById('scroll');
      if (!scroll) return;

      const sw = document.createElement('div');
      sw.className = 'energy-sweep';
      scroll.appendChild(sw);

      animate(sw,
        { opacity: [0, .9, .6, 0], top: ['-3px', '102%'] },
        { duration: .65, easing: [0.22, 1, 0.36, 1] }
      ).then(() => sw.remove());

      // indPower indicator spring pop
      const indP = document.getElementById('indPower');
      if (indP) animate(indP, { scale: [1, 1.22, 1] }, { duration: .32, easing: easeBounce, delay: .06 });
    }
  };
}

// ─── 17. ONBOARDING SLAYT GEÇİŞİ (yön hissi) ─────────────────────────────
// İleri → sola çıkar, sağdan girer; Geri → sağa çıkar, soldan girer
const _origNextOb = window.nextOnboarding;
if (_origNextOb) {
  window.nextOnboarding = function () {
    const cur = document.querySelector('.ob-slide.active');
    if (cur && !_reduceMotion) {
      animate(cur, { opacity: [1, 0], x: [0, -36] }, { duration: .2, easing: [.4, 0, 1, 1] });
    }
    _origNextOb();
    const next = document.querySelector('.ob-slide.active');
    if (next && next !== cur && !_reduceMotion) {
      animate(next, { opacity: [0, 1], x: [36, 0] }, { duration: .3, easing: ease });
    }
  };
}

// ─── 18. İNDİKATÖR DURUM GEÇİŞİ (sim-bar) ────────────────────────────────
// updateIndicators() sonrası değişen indikatörler scale pop ile güncellenir
const _origUpdInd = window.updateIndicators;
if (_origUpdInd) {
  window.updateIndicators = function () {
    const IDS = ['indPower', 'indCoils', 'indLamps', 'indFault'];
    const before = {};
    IDS.forEach(id => { const el = document.getElementById(id); if (el) before[id] = el.className; });

    _origUpdInd();

    if (_reduceMotion) return;
    requestAnimationFrame(() => {
      IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el || before[id] === undefined || before[id] === el.className) return;
        animate(el, { scale: [1, 1.24, 1] }, { duration: .28, easing: easeBounce });
      });
    });
  };
}

// ─── 19. XP KAZANIM — BADGE + XPNUM BOUNCE ────────────────────────────────
// awardXP() sonrası header'daki badge ve XP sayısı spring ile zıplar
const _origAwardXP = window.awardXP;
if (_origAwardXP) {
  window.awardXP = function (amount, reason) {
    _origAwardXP(amount, reason);
    if (_reduceMotion) return;

    // Badge
    const badge = document.querySelector('.badge');
    if (badge) animate(badge, { scale: [1, .78, 1.3, 1] }, { duration: .48, easing: easeBounce, delay: .05 });

    // XP sayısı
    const xpNum = document.getElementById('xpNum');
    if (xpNum) animate(xpNum, { scale: [1, 1.35, 1] }, { duration: .38, easing: easeBounce, delay: .15 });

    // XP bar fill
    const xpProg = document.getElementById('xpProgress');
    if (xpProg) animate(xpProg, { opacity: [1, .4, 1] }, { duration: .5, delay: .1 });
  };
}

// ─── 20. YENİ KABLO BAĞLANTISI — FADE-IN + TERMİNAL FLASH ────────────────
// Wires SVG'e yeni kablo grubu eklenince hafif fade-in ile belirir
const wiresSvg = document.getElementById('wires');
if (wiresSvg) {
  new MutationObserver(muts => {
    if (_reduceMotion) return;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        // Yeni kablo grubu — opacity flash
        animate(node,
          { opacity: [0, .5, 1] },
          { duration: .22, easing: ease }
        );
      }
    }
  }).observe(wiresSvg, { childList: true });
}
