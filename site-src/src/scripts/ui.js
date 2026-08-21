/* ============================================================
   ROTA YAHYALI — Etkileşim & Animasyonlar
   ============================================================ */
(function () {
  "use strict";

  /* ---- Yıl ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Navbar: scroll durumu + progress bar ---- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  function onScroll() {
    var sc = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", sc > 40);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (sc / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobil menü ---- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
    // menü dışına dokununca kapat
    document.addEventListener("click", function (e) {
      if (links.classList.contains("open") && !links.contains(e.target) && e.target !== toggle) {
        links.classList.remove("open");
      }
    });
    // Escape ile kapat
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") links.classList.remove("open");
    });
  }

  /* ---- Scroll reveal (IntersectionObserver) ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Sayaç animasyonu ---- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var plus = el.hasAttribute("data-plus");
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(eased * target);
      el.textContent = val.toLocaleString("tr-TR") + (plus && p === 1 ? "+" : "");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("tr-TR") + (plus ? "+" : "");
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---- Görsel yükleme yardımcısı: önce yerel (data-img), olmazsa uzak
         kaynak (data-img-alt); ikisi de yoksa gradient kalır ---- */
  function loadInto(el, apply) {
    var local = el.getAttribute("data-img");
    var alt = el.getAttribute("data-img-alt");
    function tryLoad(src, next) {
      if (!src) { if (next) next(); return; }
      var t = new Image();
      t.onload = function () { apply(src); };
      t.onerror = function () { if (next) next(); };
      t.src = src;
    }
    tryLoad(local, function () { tryLoad(alt); });
  }

  /* ---- Kart arka plan fotoğrafları ---- */
  document.querySelectorAll(".place-card__bg").forEach(function (el) {
    loadInto(el, function (src) { el.style.backgroundImage = "url('" + src + "')"; });
  });

  /* ---- Galeri: gerçek foto yükleme + lightbox ---- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbClose = document.getElementById("lbClose");

  document.querySelectorAll("#gallery figure").forEach(function (fig) {
    var cap = fig.getAttribute("data-cap") || "";
    var ph = fig.querySelector(".ph");
    // gerçek foto varsa (yerel ya da uzak) arka plana koy
    if (ph) {
      loadInto(fig, function (src) {
        ph.style.backgroundImage = "url('" + src + "')";
        ph.dataset.real = "1"; ph.dataset.src = src;
      });
    }
    fig.addEventListener("click", function () {
      if (!lb) return;
      lbCap.textContent = cap;
      lbImg.style.backgroundImage = ph && ph.dataset.real ? "url('" + ph.dataset.src + "')" : getComputedStyle(ph).backgroundImage;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });
  function closeLb() { if (lb) { lb.classList.remove("open"); document.body.style.overflow = ""; } }
  if (lbClose) lbClose.addEventListener("click", closeLb);
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });

  /* ---- Hero parallax (hafif) ---- */
  var layers = document.querySelector(".hero__layers");
  if (layers && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("scroll", function () {
      var sc = window.scrollY;
      if (sc < window.innerHeight) layers.style.transform = "translateY(" + sc * 0.18 + "px)";
    }, { passive: true });
  }
})();
