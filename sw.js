/* Otomasyon Akademi — Service Worker v18 */
const CACHE = 'oa-v18';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/bench.css',
  '/css/plc.css',
  '/css/pneumatik.css',
  '/css/mech.css',
  '/css/gamification.css',
  '/css/mobile.css',
  '/css/dokuman.css',
  '/css/robot.css',
  '/js/data.js',
  '/js/app.js',
  '/js/bench.js',
  '/js/gamification.js',
  '/js/animations.js',
  '/js/plc.js',
  '/js/pneumatik.js',
  '/js/mech.js',
  '/js/sensor.js',
  '/js/guvenlik.js',
  '/js/dokuman.js',
  '/js/robot.js',
  '/css/pano.css',
  '/js/pano.js',
];

/**
 * Bu service worker yalnızca kök siteye ait dosyaları yönetir: kök belge,
 * /css/ ve /js/.
 *
 * Alt dizinlerdeki projeler (mochi-robot-studio, finans, rotayahyali, …)
 * kendi sürümlenmiş dosyalarıyla ve kendi yayın döngüsüyle geliyor. Onları
 * buradan önbelleğe almak, yeni sürüm yayınlandığında ziyaretçiyi eski
 * kopyada bırakıyordu: önbellekteki eski index.html, artık sunucuda olmayan
 * eski chunk'lara işaret ediyor. O yüzden alt projelere hiç dokunmuyoruz —
 * istekleri doğrudan ağa gidiyor.
 */
function kokSiteyeAit(url) {
  const p = url.pathname;
  if (p === '/' || p === '/index.html' || p === '/manifest.json') return true;
  return p.startsWith('/css/') || p.startsWith('/js/');
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Alt projeler bizim işimiz değil: tarayıcı normal şekilde ağdan alsın.
  if (!kokSiteyeAit(url)) return;

  // HTML ağ-öncelikli olmalı, yoksa yeni yayın bir ziyaret geriden gelir.
  // Çevrimdışıyken önbellekteki kopya devreye girer.
  const belgeMi =
    e.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html';

  if (belgeMi) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Kök sitenin css/js dosyaları: önbellekten ver, arkada tazele.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
