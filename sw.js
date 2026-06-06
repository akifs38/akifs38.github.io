/* Otomasyon Akademi — Service Worker v10 */
const CACHE = 'oa-v11';
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
  // Sadece GET istekleri, harici CDN'leri cache etme
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

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
