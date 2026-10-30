// Consumo del overlay con el video corriendo: cuántas veces se copia el cuadro del video por lectura, cuántos pedidos al
// feed por minuto, tareas largas del hilo principal y nada de desenfoque (backdrop-filter) sobre el video.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, RAIZ} = require('./mocks');
async function medir(b, video, url) {
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(ctx, {video});
  let feed = 0; ctx.on('request', r => { if (/feed\.lolesports\.com/.test(r.url())) feed++; });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto(url);
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => {
    window.RP_DEBUG = true; window.__copias = 0; window.__largas = [];
    const d = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (src) { if (src instanceof HTMLVideoElement) window.__copias++; return d.apply(this, arguments); };
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__largas.push(Math.round(e.duration)))).observe({entryTypes: ['longtask']}); } catch (e) {}
    document.getElementById('v').play();
  });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  await p.waitForTimeout(12000);  // que reconozca el juego
  const a = await p.evaluate(() => ({c: window.__copias, n: window.__rpAS.n})); feed = 0;
  await p.waitForTimeout(30000);
  const r = await p.evaluate(() => {
    const css = [...document.querySelectorAll('#rp-overlay-host,#rp-overlay-paneles')].map(h => [...h.shadowRoot.querySelectorAll('style')].map(s => s.textContent).join('')).join('');
    return {c: window.__copias, n: window.__rpAS.n, largas: window.__largas.slice(), blur: /backdrop-filter\s*:\s*blur/.test(css), id: window.__rpAS.id ? window.__rpAS.id.codes.join('-') : ''};
  });
  await ctx.close();
  return {copiasPorLectura: (r.c - a.c) / Math.max(1, r.n - a.n), feedPorMin: feed * 2, largas: r.largas, blur: r.blur, id: r.id};
}
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  for (const [video, url, nombre] of [['vod.webm', 'https://www.twitch.tv/videos/1', 'VOD'], ['vivo.webm', 'https://www.twitch.tv/lolesports', 'en vivo']]) {
    const m = await medir(b, video, url);
    console.log('    ' + nombre + ': ' + m.copiasPorLectura.toFixed(1) + ' copias del video por lectura · ' + m.feedPorMin + ' pedidos al feed por minuto · tareas largas: ' + (m.largas.join(', ') || 'ninguna') + ' · ' + (m.id || 'sin reconocer'));
    ok = chequear(nombre + ': reconoce el juego mientras se mide', !!m.id, m.id || 'no') && ok;
    ok = chequear(nombre + ': como mucho 2 copias del cuadro del video por lectura', m.copiasPorLectura <= 2, m.copiasPorLectura.toFixed(1)) && ok;
    ok = chequear(nombre + ': pocos pedidos al feed (como mucho 40 por minuto)', m.feedPorMin <= 40, m.feedPorMin + '/min') && ok;
    ok = chequear(nombre + ': sin desenfoque sobre el video (backdrop-filter)', !m.blur) && ok;
    ok = chequear(nombre + ': sin tareas largas del hilo principal (> 120 ms)', !m.largas.some(x => x > 120), m.largas.join(', ') || 'ninguna') && ok;
  }
  await b.close(); return ok;
};
