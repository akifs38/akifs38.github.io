/* MyEvent web sitesi: menü, görünürlük animasyonu, koleksiyon, katalog filtresi, teklif formu */
(function () {
  'use strict';

  var ROOT = window.MYEVENT_ROOT || '';
  var DATA = window.MYEVENT_EXPERIENCES || {};
  var STORE_KEY = 'myevent-collection';
  var ICON_X = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 49500 -> "49.500 ₺" (sunucudaki Rules.FormatPrice ile aynı)
  function price(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '\u00a0₺'; }
  function params() { return new URLSearchParams(location.search); }
  // Arama için: Türkçe küçük harfe çevirir ve aksanları kaldırır ("ÇARK", "cark" ve "çark" eşleşir)
  var FOLD = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
  function norm(s) {
    return String(s).toLocaleLowerCase('tr-TR')
      .replace(/[çğıöşü]/g, function (c) { return FOLD[c]; })
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------------------------------------------------------------- Üst menü */
  var header = $('#header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#burger');
  var navLinks = $('#navLinks');
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  }
  burger.addEventListener('click', function () { setMenu(!navLinks.classList.contains('open')); });
  $$('a', navLinks).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------------------------------------------------------------- Görünür olunca belirme */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = (Math.min(i, 5) * 60) + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------------- Bildirim */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---------------------------------------------------------------- Koleksiyon (tarayıcıda saklanır) */
  var memoryStore = [];
  function load() {
    var list;
    try { list = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { list = memoryStore; }
    if (!Array.isArray(list)) list = [];
    // Katalogdan kaldırılmış deneyimler sessizce düşer
    return list.filter(function (slug, i) { return DATA[slug] && list.indexOf(slug) === i; });
  }
  function save(list) {
    memoryStore = list;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* gizli pencere: bellekte kalır */ }
    render();
  }
  function has(slug) { return load().indexOf(slug) !== -1; }
  function add(slug) { var l = load(); if (l.indexOf(slug) === -1) { l.push(slug); save(l); } }
  function remove(slug) { save(load().filter(function (s) { return s !== slug; })); }

  function thumb(item, cls) {
    if (item.i) return '<span class="' + cls + '"><img src="' + ROOT + esc(item.i) + '" alt="" loading="lazy"></span>';
    // Renkler ve ikon derleme sırasında üretilen güvenilir veridir (experiences.js)
    return '<span class="' + cls + '" style="background:linear-gradient(140deg,' + item.g[0] + ',' + item.g[1] + ')">' +
      '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + item.v + '</svg></span>';
  }

  var drawer = $('#drawer');
  var backdrop = $('.drawer-backdrop');
  var lastFocus = null;

  function render() {
    var list = load();
    $$('[data-collection-count]').forEach(function (el) {
      el.textContent = list.length;
      el.hidden = list.length === 0;
    });
    $$('[data-collect]').forEach(function (btn) {
      var on = list.indexOf(btn.getAttribute('data-collect')) !== -1;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var ul = $('[data-drawer-list]');
    ul.innerHTML = list.map(function (slug) {
      var x = DATA[slug];
      return '<li>' + thumb(x, 'dl-thumb') +
        '<div class="dl-text"><a href="' + ROOT + esc(x.u) + '">' + esc(x.n) + '</a><span>' + esc(x.c) + (x.p ? ' · ' + price(x.p) + ' + KDV' : '') + '</span></div>' +
        '<button type="button" class="dl-remove" data-remove="' + esc(slug) + '" aria-label="' + esc(x.n) + ' koleksiyondan çıkar">' + ICON_X + '</button></li>';
    }).join('');
    $('[data-drawer-empty]').hidden = list.length > 0;
    $('[data-drawer-foot]').hidden = list.length === 0;
    $('[data-drawer-sub]').textContent = list.length ? list.length + ' deneyim seçildi' : 'Seçtiğiniz deneyimler';
    document.dispatchEvent(new CustomEvent('collection:change', { detail: list }));
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('drawer-open');
    $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var closeBtn = $('[data-drawer-close].icon-btn', drawer);
    if (closeBtn) closeBtn.focus();
  }
  function closeDrawer() {
    if (drawer.hidden) return;
    drawer.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove('drawer-open');
    $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var btn = t.closest('[data-collect]');
    if (btn) {
      var slug = btn.getAttribute('data-collect');
      if (has(slug)) { remove(slug); toast('Koleksiyondan çıkarıldı'); }
      else {
        add(slug);
        toast('Koleksiyona eklendi · ' + load().length + ' deneyim');
        $$('.coll-btn').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
      }
      return;
    }
    var rm = t.closest('[data-remove]');
    if (rm) { remove(rm.getAttribute('data-remove')); return; }
    if (t.closest('[data-drawer-open]')) { openDrawer(); return; }
    if (t.closest('[data-drawer-close]')) { closeDrawer(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      if (navLinks.classList.contains('open')) { setMenu(false); burger.focus(); }
    }
    // Çekmece açıkken odak çekmecenin içinde kalır
    if (e.key === 'Tab' && !drawer.hidden) {
      var f = $$('a[href],button:not([disabled])', drawer).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Başka sekmede yapılan değişiklikler de yansır
  window.addEventListener('storage', function (e) { if (e.key === STORE_KEY) render(); });

  /* ---------------------------------------------------------------- Katalog filtresi */
  function initCatalog() {
    var toolbar = $('#toolbar');
    if (!toolbar) return;
    var chips = $$('[data-filter]', toolbar);
    var q = $('#q');
    var eventSel = $('#eventType');
    var cards = $$('.xcard');
    var groups = $$('.xgroup');
    var countEl = $('#resultCount');
    var empty = $('#empty');
    var state = { cat: 'tumu', q: '', ev: '' };

    var p = params();
    var cat = p.get('kategori');
    if (cat && chips.some(function (c) { return c.getAttribute('data-filter') === cat; })) state.cat = cat;
    var ev = p.get('etkinlik');
    if (ev && $$('option', eventSel).some(function (o) { return o.value === ev; })) state.ev = ev;
    state.q = p.get('ara') || '';
    q.value = state.q;
    eventSel.value = state.ev;

    function syncUrl() {
      var np = new URLSearchParams();
      if (state.cat !== 'tumu') np.set('kategori', state.cat);
      if (state.ev) np.set('etkinlik', state.ev);
      if (state.q) np.set('ara', state.q);
      var qs = np.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }

    function apply() {
      var words = norm(state.q).split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (c) {
        var ok = true;
        if (state.cat === 'populer') ok = c.getAttribute('data-popular') === '1';
        else if (state.cat !== 'tumu') ok = c.getAttribute('data-cat') === state.cat;
        if (ok && state.ev) ok = c.getAttribute('data-events').split('|').indexOf(state.ev) !== -1;
        if (ok && words.length) {
          var hay = norm(c.getAttribute('data-search'));
          ok = words.every(function (w) { return hay.indexOf(w) !== -1; });
        }
        c.hidden = !ok;
        if (ok) { shown++; c.classList.add('in'); }
      });
      groups.forEach(function (g) { g.hidden = !$$('.xcard', g).some(function (c) { return !c.hidden; }); });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === state.cat ? 'true' : 'false'); });
      countEl.textContent = shown + ' deneyim';
      empty.hidden = shown > 0;
      syncUrl();
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.preventDefault();
        state.cat = c.getAttribute('data-filter');
        apply();
        c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      });
    });
    var qTimer;
    q.addEventListener('input', function () {
      clearTimeout(qTimer);
      qTimer = setTimeout(function () { state.q = q.value.trim(); apply(); }, 120);
    });
    eventSel.addEventListener('change', function () { state.ev = eventSel.value; apply(); });
    $('#clearFilters').addEventListener('click', function () {
      state = { cat: 'tumu', q: '', ev: '' };
      q.value = '';
      eventSel.value = '';
      apply();
      q.focus();
    });
    apply();
    var active = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })[0];
    if (active && state.cat !== 'tumu') active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ---------------------------------------------------------------- Teklif formu */
  function initForm() {
    var form = $('#leadForm');
    if (!form) return;
    var ok = $('#formOk');
    var err = $('#formErr');
    var btn = $('button[type=submit]', form);
    var btnHtml = btn.innerHTML;
    var pickedBox = $('#pickedBox');
    var pickedList = $('#pickedList');
    var hiddenExp = $('#f-experiences');
    var radios = $$('input[name=service]', form);
    var p = params();

    // Hizmet türü adresteki ?hizmet= değerinden seçilir
    var key = p.get('hizmet');
    radios.forEach(function (r) { if (r.getAttribute('data-key') === key) r.checked = true; });
    // Tek deneyim sayfasından gelindiyse o deneyim koleksiyona eklenir
    var single = p.get('deneyim');
    if (single && DATA[single]) add(single);

    function currentKey() {
      var r = radios.filter(function (x) { return x.checked; })[0];
      return r ? r.getAttribute('data-key') : '';
    }
    function toggleGroups() {
      var k = currentKey();
      $$('[data-for]', form).forEach(function (el) {
        var show = el.getAttribute('data-for').split(' ').indexOf(k) !== -1;
        el.hidden = !show;
        $$('input,select,textarea', el).forEach(function (i) { i.disabled = !show; });
      });
    }
    radios.forEach(function (r) { r.addEventListener('change', toggleGroups); });
    toggleGroups();

    function renderPicked() {
      var list = load();
      pickedBox.hidden = list.length === 0;
      pickedList.innerHTML = list.map(function (slug) {
        return '<li>' + esc(DATA[slug].n) + '<button type="button" data-remove="' + esc(slug) + '" aria-label="' + esc(DATA[slug].n) + ' listeden çıkar">' + ICON_X + '</button></li>';
      }).join('');
      hiddenExp.value = list.map(function (slug) { return DATA[slug].n; }).join(' | ');
    }
    document.addEventListener('collection:change', renderPicked);
    renderPicked();

    function fail(msg, field) {
      err.textContent = msg;
      err.hidden = false;
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
    }
    $$('input', form).forEach(function (i) { i.addEventListener('input', function () { i.removeAttribute('aria-invalid'); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      var f = form.elements;
      var nm = f.namedItem('name'), em = f.namedItem('email'), ph = f.namedItem('phone'), kv = f.namedItem('kvkk');
      if (!nm.value.trim()) return fail('Lütfen adınızı yazın.', nm);
      if (!EMAIL_RE.test(em.value.trim()) || !em.checkValidity()) return fail('Lütfen geçerli bir e-posta adresi yazın.', em);
      if (ph.value.trim() && !/^[0-9 +()\-]{7,30}$/.test(ph.value.trim())) return fail('Telefon numarasını yalnızca rakamlarla yazın.', ph);
      if (!kv.checked) return fail('Devam etmek için KVKK aydınlatma metnini onaylayın.', kv);
      btn.disabled = true;
      btn.textContent = 'Gönderiliyor…';
      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'fetch', 'Accept': 'application/json' }
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            toggleGroups();
            save([]);
            $$('.field,.consent,.seg,button[type=submit]', form).forEach(function (el) { el.hidden = true; });
            ok.hidden = false;
            ok.focus();
            ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
          } else {
            fail((res && res.error) || 'Gönderilemedi. Lütfen bilgi@myevent.tr adresine yazın.');
            btn.disabled = false;
            btn.innerHTML = btnHtml;
          }
        })
        .catch(function () {
          fail('Bağlantı hatası. Lütfen tekrar deneyin ya da bilgi@myevent.tr adresine yazın.');
          btn.disabled = false;
          btn.innerHTML = btnHtml;
        });
    });
  }

  /* ---------------------------------------------------------------- Koleksiyon sayfası */
  function initCollectionPage() {
    var listEl = $('#collList');
    if (!listEl) return;
    var toolbar = $('#collToolbar');
    var emptyEl = $('#collEmpty');
    var countEl = $('#collCount');
    $$('[data-print-date]').forEach(function (el) { el.textContent = new Date().toLocaleDateString('tr-TR'); });

    function draw() {
      var list = load();
      toolbar.hidden = list.length === 0;
      emptyEl.hidden = list.length > 0;
      countEl.textContent = list.length + ' deneyim seçildi';
      listEl.innerHTML = list.map(function (slug) {
        var x = DATA[slug];
        return '<li>' + thumb(x, 'cl-thumb') +
          '<div class="cl-text"><span>' + esc(x.c) + '</span><h3><a href="' + ROOT + esc(x.u) + '">' + esc(x.n) + '</a></h3><p>' + esc(x.s) + '</p>' +
          (x.p ? '<p class="cl-price"><b>' + price(x.p) + '</b> + KDV · günlük kiralama</p>' : '') + '</div>' +
          '<button type="button" class="dl-remove" data-remove="' + esc(slug) + '" aria-label="' + esc(x.n) + ' koleksiyondan çıkar">' + ICON_X + '</button></li>';
      }).join('');
    }
    document.addEventListener('collection:change', draw);
    $('#collPrint').addEventListener('click', function () { window.print(); });
    $('#collClear').addEventListener('click', function () {
      if (window.confirm('Koleksiyondaki tüm deneyimler çıkarılsın mı?')) save([]);
    });
    draw();
  }

  /* ---------------------------------------------------------------- Görüntüleyici (video ve galeri) */
  // Deneyim sayfasında "Videoyu izle" ve galeri fotoğrafları aynı tam ekran pencerede açılır.
  // YouTube oynatıcısı yalnızca ziyaretçi tıklayınca yüklenir (youtube-nocookie.com).
  var viewer = null;
  var viewerLastFocus = null;
  var gallery = [];
  var galleryIndex = 0;

  function ensureViewer() {
    if (viewer) return viewer;
    viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.hidden = true;
    viewer.innerHTML = '<div class="viewer-box"><div class="viewer-stage" data-viewer-stage></div>' +
      '<p class="viewer-caption" data-viewer-caption></p></div>' +
      '<button type="button" class="viewer-btn viewer-close" data-viewer-close aria-label="Kapat">' + ICON_X + '</button>' +
      '<button type="button" class="viewer-btn viewer-prev" data-viewer-prev aria-label="Önceki fotoğraf">‹</button>' +
      '<button type="button" class="viewer-btn viewer-next" data-viewer-next aria-label="Sonraki fotoğraf">›</button>';
    document.body.appendChild(viewer);
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer || e.target.closest('[data-viewer-close]')) closeViewer();
      else if (e.target.closest('[data-viewer-prev]')) showPhoto(galleryIndex - 1);
      else if (e.target.closest('[data-viewer-next]')) showPhoto(galleryIndex + 1);
    });
    return viewer;
  }

  function openViewer(html, caption, isGallery) {
    ensureViewer();
    viewerLastFocus = document.activeElement;
    $('[data-viewer-stage]', viewer).innerHTML = html;
    $('[data-viewer-caption]', viewer).textContent = caption || '';
    viewer.classList.toggle('is-gallery', !!isGallery);
    viewer.hidden = false;
    document.body.classList.add('drawer-open');
    $('[data-viewer-close]', viewer).focus();
  }

  function closeViewer() {
    if (!viewer || viewer.hidden) return;
    // Videoyu durdurmak için oynatıcı tamamen kaldırılır
    $('[data-viewer-stage]', viewer).innerHTML = '';
    viewer.hidden = true;
    document.body.classList.remove('drawer-open');
    if (viewerLastFocus && viewerLastFocus.focus) viewerLastFocus.focus();
  }

  function showPhoto(i) {
    if (!gallery.length) return;
    galleryIndex = (i + gallery.length) % gallery.length;
    var item = gallery[galleryIndex];
    openViewer('<img src="' + esc(item.src) + '" alt="' + esc(item.alt) + '">', (galleryIndex + 1) + ' / ' + gallery.length, gallery.length > 1);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var video = t.closest('.video-btn');
    if (video) {
      var kind = video.getAttribute('data-video-kind');
      var src = video.getAttribute('data-video-src');
      var title = video.getAttribute('data-video-title') || '';
      if (kind === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(src)) {
        openViewer('<iframe src="https://www.youtube-nocookie.com/embed/' + src + '?autoplay=1&rel=0" title="' + esc(title) +
          '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>', title);
      } else if (kind === 'dosya') {
        var poster = video.getAttribute('data-video-poster');
        openViewer('<video src="' + esc(src) + '" controls autoplay playsinline' + (poster ? ' poster="' + esc(poster) + '"' : '') + '></video>', title);
      }
      return;
    }
    var photo = t.closest('[data-gallery]');
    if (photo) {
      e.preventDefault();
      gallery = $$('[data-gallery]').map(function (a) {
        var img = $('img', a);
        return { src: a.getAttribute('href'), alt: img ? img.alt : '' };
      });
      showPhoto(parseInt(photo.getAttribute('data-gallery'), 10) || 0);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (!viewer || viewer.hidden) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowLeft' && viewer.classList.contains('is-gallery')) showPhoto(galleryIndex - 1);
    else if (e.key === 'ArrowRight' && viewer.classList.contains('is-gallery')) showPhoto(galleryIndex + 1);
  });

  initCatalog();
  initForm();
  initCollectionPage();
  render();
})();
