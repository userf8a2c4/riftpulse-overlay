// RiftPulse — service worker de la app instalable. Siempre pide primero a la red (así nunca muestra una versión vieja);
// la copia guardada solo se usa si no hay conexión. Los datos del Mundial no pasan por acá.
const CACHE = 'riftpulse-app-v1';
const BASE = ['app.html', 'rp-tokens.css', 'rp-design.css', 'rp-ui.js', 'engine.js', 'logo.svg', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && BASE.some(f => u.pathname.endsWith('/' + f))) { const c = r.clone(); caches.open(CACHE).then(k => k.put(u.pathname, c)); }
    return r;
  }).catch(() => caches.match(u.pathname).then(r => r || caches.match('app.html'))));
});
