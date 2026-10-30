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
  await p.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
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
  await r.p.evaluate(() => document.getElementById('rp-overlay-host').shadowRoot.querySelector('.prox').click());
  await r.p.waitForTimeout(800); e = await leer(r.p);
  ok = chequear('al tocarlo se abre la previa: qué está en juego, datos clave y versus histórico', /en vivo ahora/i.test(e.previa) && /T1/.test(e.previa) && /🏆/.test(e.previa) && /versus histórico/i.test(e.previa) && /Primer cruce|en series/i.test(e.previa), e.previa.slice(0, 160)) && ok;
  await r.ctx.close();
  // 2) un VOD sin nada en vivo: la cuenta regresiva al próximo (G2 vs HLE, en 2 h) avanza sola
  r = await pagina(b, 'vod.webm', 'https://www.twitch.tv/videos/1', {sinVivo: true});
  for (let i = 0; i < 20; i++) { await r.p.waitForTimeout(1000); e = await leer(r.p); if (e.seg) break; }
  const t1 = (e.seg.match(/\d\d:\d\d:\d\d/) || [''])[0]; await r.p.waitForTimeout(2200); const t2 = ((await leer(r.p)).seg.match(/\d\d:\d\d:\d\d/) || [''])[0];
  ok = chequear('sin nada en vivo, la cuenta regresiva al próximo partido avanza', /G2/.test(e.seg) && /HLE/.test(e.seg) && /^01:\d\d:\d\d$/.test(t1) && t2 && t2 < t1, t1 + ' → ' + t2 + ' · ' + e.seg) && ok;
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
