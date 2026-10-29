// El overlay que «lee la sala»: aviso de sincronizado, barra que se contrae sin juego en pantalla,
// línea de tiempo que salta el VOD y modo sin spoilers en la app.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, RAIZ, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(ctx, {video: 'desk.webm'});
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  const est = () => p.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot; return {toast: sh.getElementById('toast').classList.contains('show') ? sh.getElementById('toast').textContent : '', chico: sh.getElementById('w').classList.contains('chico'), body: sh.getElementById('body').textContent, ct: document.getElementById('v').currentTime}; });
  let toast = '', chicoEn = null, vuelveEn = null;
  for (let i = 0; i < 60; i++) {
    await p.waitForTimeout(1000); const e = await est();
    if (e.toast && !toast) toast = e.toast;
    if (e.chico && chicoEn == null) chicoEn = e.ct;
    if (chicoEn != null && !e.chico && vuelveEn == null && e.ct > 44) vuelveEn = e.ct;
    if (vuelveEn != null) break;
  }
  ok = chequear('aviso «Sincronizado» con el partido, el juego y el minuto', /Sincronizado · IG vs LYON · juego 1 · 4:2\d/.test(toast), toast) && ok;
  ok = chequear('sin marcador más de 12 s (desk): la barra se contrae', chicoEn != null && chicoEn >= 31 && chicoEn <= 37, chicoEn != null ? 'a los ' + chicoEn.toFixed(0) + ' s del video' : 'nunca') && ok;
  ok = chequear('vuelve el juego: la barra se expande en menos de 4 s', vuelveEn != null && vuelveEn <= 49, vuelveEn != null ? 'a los ' + vuelveEn.toFixed(0) + ' s (el marcador vuelve a los 45)' : 'nunca') && ok;
  // línea de tiempo: −10 s salta el video
  await p.hover('#w'); await p.waitForTimeout(1800);
  const antes = (await est()).ct, hay = await p.evaluate(() => !!document.getElementById('rp-overlay-host').shadowRoot.querySelector('[data-salto="-10"]'));
  if (hay) await p.click('[data-salto="-10"]'); await p.waitForTimeout(400);
  const despues = (await est()).ct;
  ok = chequear('en el VOD, «−10 s» de la línea de tiempo salta el video', hay && antes - despues >= 8 && antes - despues <= 12, hay ? (antes - despues).toFixed(1) + ' s hacia atrás' : 'sin botón') && ok;
  await ctx.close();
  // un clip de un partido ya jugado en la previa del vivo: cuando vuelve el desk no queda nada de ese partido
  const c1 = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(c1, {video: 'clip.webm'});
  const q = await c1.newPage(); q.on('pageerror', e => console.log('    error de página:', e.message));
  await q.goto('https://www.twitch.tv/riotgames');
  await q.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await q.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await q.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  const eq = () => q.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot, c = sh.getElementById('cards'); return {chico: sh.getElementById('w').classList.contains('chico'), body: sh.getElementById('body').textContent, cards: c ? c.textContent.trim() : '', ct: document.getElementById('v').currentTime}; });
  let sinc = false, chicoLimpio = null, suelta = null;
  for (let i = 0; i < 58; i++) {
    await q.waitForTimeout(1000); const e = await eq();
    if (/IG/.test(e.body) && e.ct < 15) sinc = true;
    if (e.chico && chicoLimpio == null) chicoLimpio = !e.cards;
    if (e.ct > 15 && !e.chico && !/IG|LYON/.test(e.body) && suelta == null) suelta = e.ct;
    if (suelta != null && e.ct > suelta + 3) break;
  }
  const fin = await eq();
  ok = chequear('clip en la previa: se sincroniza con el partido del clip', sinc) && ok;
  ok = chequear('al volver el desk, la pastilla no deja paneles del clip', chicoLimpio === true, chicoLimpio == null ? 'no se contrajo' : chicoLimpio ? 'sin paneles' : 'quedaron paneles del clip') && ok;
  ok = chequear('sin reloj ~25 s, suelta el partido del clip y vuelve al vivo', suelta != null && suelta <= 46 && !/IG|LYON/.test(fin.body + fin.cards), suelta != null ? 'a los ' + suelta.toFixed(0) + ' s · ' + fin.body.slice(0, 50) : fin.body.slice(0, 60)) && ok;
  await c1.close();
  // modo sin spoilers en la app (mirando el VOD de IG vs LYON)
  const c2 = await b.newContext({viewport: {width: 1200, height: 900}}); await montar(c2);
  const a = await c2.newPage(); a.on('pageerror', () => {}); await a.goto(BASE + 'app.html'); await a.waitForTimeout(2500);
  const r = await a.evaluate(() => { EXTST.seguir = true; EXTST.pantalla = {matchId: 'MLI', juego: 1, gameId: 'g1', gt: 100, vod: true, at: Date.now()}; setVista('copa');
    document.querySelector('#fsTabs [data-fase="sw"]').click(); const t = document.getElementById('cuadro').innerText;
    store('spoilers', 'ver'); renderCuadro(); const t2 = document.getElementById('cuadro').innerText; store('spoilers', ''); return {t, t2}; });
  ok = chequear('sin spoilers: el resultado de IG vs LYON queda tapado', /•\s*–\s*•/.test(r.t) && !/2\s*–\s*1/.test(r.t), r.t.replace(/\s+/g, ' ').slice(0, 90)) && ok;
  ok = chequear('«Mostrar resultados» lo vuelve a mostrar', /2\s*–\s*1/.test(r.t2)) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
