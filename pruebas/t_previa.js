// La previa del próximo partido en vivo, también mirando un VOD: en la barra, cuánto falta (o «en vivo ahora»); al tocarlo,
// la previa deportiva (qué está en juego, pronóstico, datos clave, cómo llegan y versus histórico). En la previa de una
// transmisión en vivo (stream de LoL, todavía sin juego en pantalla) se ve sola, como cronómetro.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, RAIZ} = require('./mocks');
async function pagina(b, video, url, o, lol) {
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(ctx, Object.assign({video}, o || {}));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto(url);
  await p.evaluate(lol => {
    if (lol) { const a = document.createElement('a'); a.href = '/directory/category/league-of-legends'; a.textContent = 'League of Legends'; document.body.appendChild(a); }
    const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); });
  }, !!lol);
  await p.evaluate(() => { window.RP_DEBUG = true; try { localStorage.setItem('rp_ext7', '["obj","dano"]'); } catch (e) {} document.getElementById('v').play(); });  // una configuración vieja con el panel fijo de daño
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  return {ctx, p};
}
const leer = p => p.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot, sh2 = document.getElementById('rp-overlay-paneles').shadowRoot, s = sh.querySelector('.prox');
  return {seg: s ? s.textContent : '', barra: !sh.getElementById('w').classList.contains('oculto'), previa: sh2.getElementById('previa').innerText.replace(/\s+/g, ' ')}; });
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  // 1) un VOD (IG vs LYON) con T1 vs MKOI jugándose en vivo
  let r = await pagina(b, 'vod.webm', 'https://www.twitch.tv/videos/1');
  let e = null;
  for (let i = 0; i < 20; i++) { await r.p.waitForTimeout(1000); e = await leer(r.p); if (e.seg) break; }
  ok = chequear('mirando un VOD, la barra dice qué se juega en vivo ahora', /en vivo ahora/i.test(e.seg) && /T1/.test(e.seg) && /MKOI/.test(e.seg), e.seg || 'no aparece') && ok;
  const barra = await r.p.evaluate(() => { const bd = document.getElementById('rp-overlay-host').shadowRoot.getElementById('body');
    return {txt: bd.textContent, min: (bd.querySelector('.tmv') || {}).textContent || '', dot: !!bd.querySelector('.fdot.ok'), obj: !!bd.querySelector('.seg.obj')}; });
  ok = chequear('barra mínima: logo, siglas y %, minuto y punto de estado; sin «RiftPulse» escrito ni objetivo fijo', /IG/.test(barra.txt) && /%/.test(barra.txt) && /^\d{1,2}:\d\d$/.test(barra.min) && barra.dot && !barra.obj && !/RiftPulse/i.test(barra.txt), JSON.stringify(barra).slice(0, 160)) && ok;
  await r.p.screenshot({path: path.join(__dirname, '.gen', 'barra.png'), clip: {x: 300, y: 60, width: 900, height: 140}});
  const dano = await r.p.evaluate(() => ({chip: !!document.getElementById('rp-overlay-host').shadowRoot.querySelector('[data-ext="dano"]'), panel: /todo el juego/i.test(document.getElementById('rp-overlay-paneles').shadowRoot.textContent || document.getElementById('rp-overlay-paneles').shadowRoot.innerHTML)}));
  ok = chequear('el daño a campeones ya no es un panel fijo (solo tras cada pelea 5v5), aunque estuviera guardado', !dano.chip && !dano.panel, JSON.stringify(dano)) && ok;
  await r.p.evaluate(() => document.getElementById('rp-overlay-host').shadowRoot.querySelector('.prox').click());
  await r.p.waitForTimeout(800); e = await leer(r.p);
  ok = chequear('al tocarlo se abre la previa: qué está en juego, datos clave y versus histórico', /en vivo ahora/i.test(e.previa) && /T1/.test(e.previa) && /🏆/.test(e.previa) && /versus histórico/i.test(e.previa) && /Primer cruce|en series/i.test(e.previa), e.previa.slice(0, 160)) && ok;
  await r.ctx.close();
  // 2) un VOD sin nada en vivo y el próximo (G2 vs HLE) en 2 h: la barra queda limpia (la cuenta sale si falta menos de 1 h)
  r = await pagina(b, 'vod.webm', 'https://www.twitch.tv/videos/1', {sinVivo: true});
  let sinc = false; for (let i = 0; i < 15 && !sinc; i++) { await r.p.waitForTimeout(1000); sinc = await r.p.evaluate(() => !!(window.__rpAS && window.__rpAS.id)); }
  await r.p.waitForTimeout(3000); e = await leer(r.p);
  ok = chequear('sin nada en vivo y el próximo en 2 h: la barra no lleva la cuenta regresiva', sinc && !e.seg, e.seg || 'limpia') && ok;
  await r.ctx.close();
  // 3) la previa de una transmisión en vivo de LoL, sin juego en pantalla: la previa se ve sola
  r = await pagina(b, 'previa.webm', 'https://www.twitch.tv/lolesports', {sinVivo: true}, true);
  for (let i = 0; i < 15; i++) { await r.p.waitForTimeout(1000); e = await leer(r.p); if (e.previa) break; }
  ok = chequear('en la previa de la transmisión en vivo se ve la previa con el cronómetro', /previa/i.test(e.previa) && /G2/.test(e.previa) && /\d\d:\d\d:\d\d/.test(e.previa) && !e.barra, e.previa.slice(0, 120) || 'no aparece') && ok;
  await r.ctx.close();
  // 4) en un stream que no es de LoL, nada
  r = await pagina(b, 'previa.webm', 'https://www.twitch.tv/otrocanal', {sinVivo: true}, false);
  await r.p.waitForTimeout(9000); e = await leer(r.p);
  ok = chequear('en un stream que no es de LoL, no aparece nada', !e.previa && !e.barra, e.previa || 'nada') && ok;
  await r.ctx.close(); await b.close();
  return ok;
};
