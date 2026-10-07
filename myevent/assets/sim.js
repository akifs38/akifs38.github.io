/* Yazılım sayfasındaki kabin demosu: mod seçimi, geri sayım ve örnek sonuç ekranının canlandırması */
(function () {
  'use strict';

  var sim = document.getElementById('sim');
  if (!sim) return;
  var timers = [];
  var lastFocus = null;

  function $(id) { return document.getElementById(id); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function note(text) { $('simNote').textContent = text; }
  function showPane(id) {
    Array.prototype.forEach.call(sim.querySelectorAll('.sim-pane'), function (p) { p.classList.remove('active'); });
    $(id).classList.add('active');
  }
  function restart() { clearTimers(); note(''); showPane('paneModes'); }
  function open() {
    lastFocus = document.activeElement;
    sim.hidden = false;
    document.body.style.overflow = 'hidden';
    restart();
    sim.querySelector('.sim-mode').focus();
  }
  function close() {
    if (sim.hidden) return;
    sim.hidden = true;
    document.body.style.overflow = '';
    clearTimers();
    if (location.hash === '#demo') history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Sonuç ekranındaki temsili QR deseni (gerçek bir bağlantı içermez)
  (function buildQr() {
    var qr = $('qrBox');
    var seed = 42;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    for (var i = 0; i < 441; i++) {
      var cell = document.createElement('i');
      var r = Math.floor(i / 21), c = i % 21;
      var inFinder = (r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8);
      if (!inFinder && rnd() > 0.52) cell.className = 'on';
      qr.appendChild(cell);
    }
  })();

  function capture(name, ai) {
    clearTimers();
    showPane('paneCam');
    $('camTitle').textContent = name;
    var hint = $('camHint');
    hint.textContent = ai ? 'Yapay zekâ efekti uygulanacak (demo)' : 'Geri sayım başlıyor…';
    var countEl = $('count');
    var flash = $('flash');
    var n = 3;
    function tick() {
      countEl.textContent = n;
      countEl.style.animation = 'none';
      void countEl.offsetWidth;
      countEl.style.animation = '';
      if (n === 0) {
        countEl.textContent = '';
        flash.classList.add('go');
        hint.textContent = 'Çekildi! Şablon uygulanıyor…';
        timers.push(setTimeout(function () { flash.classList.remove('go'); showPane('paneResult'); }, 750));
        return;
      }
      n--;
      timers.push(setTimeout(tick, 900));
    }
    tick();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-sim-open]')) { open(); return; }
    if (t.closest('[data-sim-close]') || t === sim) { close(); return; }
    var mode = t.closest('.sim-mode');
    if (mode) { capture(mode.getAttribute('data-mode'), mode.getAttribute('data-ai') === '1'); return; }
    if (t.closest('[data-sim-restart]')) { restart(); return; }
    var n = t.closest('[data-sim-note]');
    if (n) note(n.getAttribute('data-sim-note'));
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  if (location.hash === '#demo') open();
})();
