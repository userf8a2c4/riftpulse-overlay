// RiftPulse — service worker de la app instalable. Siempre pide primero a la red (así nunca muestra una versión vieja);
// la copia guardada se usa solo si no hay conexión o la red tarda más de 4 s. Los datos del Mundial no pasan por acá.
const CACHE = 'riftpulse-app-v3';
const BASE = ['app.html', 'app.css', 'app.js', 'rp-tokens.css', 'rp-design.css', 'rp-ui.js', 'engine.js', 'logo.svg', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// la red, con un límite de espera (en una conexión mala no se queda colgada)
const red = (req, ms) => new Promise((ok, mal) => { const t = setTimeout(() => mal(new Error('lenta')), ms); fetch(req).then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); mal(e); }); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const deLaApp = BASE.some(f => u.pathname.endsWith('/' + f));
  if (!deLaApp) return;  // las otras páginas (portada, OBS, control) van siempre directo a la red: nunca se cambian por la app
  e.respondWith(red(e.request, 4000).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(u.pathname, c)); }
    return r;
  }).catch(() => caches.match(u.pathname).then(r => r || fetch(e.request))));
});
