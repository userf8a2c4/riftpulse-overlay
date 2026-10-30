// El overlay que «lee la sala»: aviso de sincronizado, se oculta sin el juego en pantalla y al terminar,
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
  const est = () => p.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot, sh2 = () => document.getElementById('rp-overlay-paneles').shadowRoot; return {toast: sh.getElementById('toast').classList.contains('show') ? sh.getElementById('toast').textContent : '', oculto: sh.getElementById('w').classList.contains('oculto'), cards: sh2().getElementById('cardsx').innerText.trim(), body: sh.getElementById('body').textContent, ct: document.getElementById('v').currentTime}; });
  let toast = '', ocultoEn = null, vuelveEn = null, visibleAntes = false, panelesOculto = false;
  for (let i = 0; i < 60; i++) {
    await p.waitForTimeout(1000); const e = await est();
    if (e.toast && !toast) toast = e.toast;
    if (!e.oculto && e.ct < 20) visibleAntes = true;
    if (e.oculto && e.ct > 19 && ocultoEn == null) ocultoEn = e.ct;
    if (e.oculto && e.cards) panelesOculto = true;
    if (ocultoEn != null && !e.oculto && vuelveEn == null && e.ct > 44) vuelveEn = e.ct;
    if (vuelveEn != null) break;
  }
  ok = chequear('aviso «Sincronizado» con el partido, el juego y el minuto', /Sincronizado · IG vs LYON · juego 1 · 4:2\d/.test(toast), toast) && ok;
  ok = chequear('con el juego en pantalla, el overlay se ve', visibleAntes) && ok;
  ok = chequear('sin el HUD (desk, repetición): el overlay se oculta entero en menos de 7 s', ocultoEn != null && ocultoEn <= 27 && !panelesOculto, ocultoEn != null ? 'a los ' + ocultoEn.toFixed(0) + ' s (el HUD se va a los 20)' + (panelesOculto ? ', pero quedaron paneles' : '') : 'nunca') && ok;
  ok = chequear('vuelve el juego: el overlay reaparece en menos de 4 s', vuelveEn != null && vuelveEn <= 49, vuelveEn != null ? 'a los ' + vuelveEn.toFixed(0) + ' s (el HUD vuelve a los 45)' : 'nunca') && ok;
  // línea de tiempo: −10 s salta el video
  await p.hover('#w'); await p.waitForTimeout(1800);
  const antes = (await est()).ct, hay = await p.evaluate(() => !!document.getElementById('rp-overlay-host').shadowRoot.querySelector('[data-salto="-10"]'));
  if (hay) await p.click('[data-salto="-10"]'); await p.waitForTimeout(400);
  const despues = (await est()).ct;
  ok = chequear('en el VOD, «−10 s» de la línea de tiempo salta el video', hay && antes - despues >= 8 && antes - despues <= 12, hay ? (antes - despues).toFixed(1) + ' s hacia atrás' : 'sin botón') && ok;
  await p.keyboard.press('Alt+r'); const ocu = await p.evaluate(() => document.getElementById('rp-overlay-host').style.display);
  await p.keyboard.press('Alt+r'); const vuelve = await p.evaluate(() => document.getElementById('rp-overlay-host').style.display);
  ok = chequear('Alt+R oculta RiftPulse y lo vuelve a mostrar', ocu === 'none' && vuelve === '') && ok;
  await ctx.close();
  // en otro stream de Twitch (no de LoL) RiftPulse no molesta: ningún aviso al mover el mouse; en un stream de LoL, sí
  const c0 = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(c0);
  let lol = false;
  await c0.route(/www\.twitch\.tv\/(otro|lol)$/, r => r.fulfill({contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body style="margin:0;background:#000"><video style="position:absolute;left:100px;top:60px;width:1280px;height:720px"></video>' + (lol ? '<a href="/directory/category/league-of-legends">League of Legends</a>' : '') + '</body>'}));
  const avisoVisible = async url => {
    const o = await c0.newPage(); await o.goto(url);
    for (const f of ['engine.js', 'ext-overlay.js']) await o.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
    await o.waitForTimeout(4000); await o.mouse.move(400, 300); await o.mouse.move(500, 320); await o.waitForTimeout(1000);
    const r = await o.evaluate(() => { const h = document.getElementById('rp-overlay-host').shadowRoot.querySelector('.hint'); return h.classList.contains('show') ? h.innerText : ''; });
    await o.close(); return r;
  };
  const enOtro = await avisoVisible('https://www.twitch.tv/otro'); lol = true; const enLol = await avisoVisible('https://www.twitch.tv/lol');
  ok = chequear('en un stream que no es de LoL, ningún aviso de RiftPulse', !enOtro, enOtro || 'nada') && ok;
  ok = chequear('en un stream de LoL con el Mundial en vivo, el aviso dice qué espera', /RiftPulse/.test(enLol), enLol.replace(/\s+/g, ' ')) && ok;
  await c0.close();
  // una repetición en la transmisión con el HUD a la vista (el reloj vuelve atrás sin que se mueva el video): todo se oculta y vuelve
  const cr = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(cr, {video: 'replay.webm'});
  const rp = await cr.newPage(); rp.on('pageerror', e => console.log('    error de página:', e.message));
  await rp.goto('https://www.twitch.tv/videos/1');
  await rp.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await rp.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await rp.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  const er = () => rp.evaluate(() => ({oculto: document.getElementById('rp-overlay-host').shadowRoot.getElementById('w').classList.contains('oculto'), id: window.__rpAS && window.__rpAS.id ? window.__rpAS.id.gameId : '', ct: document.getElementById('v').currentTime}));
  let antesR = false, ocultoR = null, vuelveR = null, idR = '';
  for (let i = 0; i < 48; i++) {
    await rp.waitForTimeout(1000); const e = await er();
    if (e.ct < 14 && !e.oculto) { antesR = true; idR = e.id; }
    if (e.ct >= 15 && e.ct < 27 && e.oculto && ocultoR == null) ocultoR = e.ct;
    if (e.ct >= 27 && !e.oculto && vuelveR == null) vuelveR = {ct: e.ct, id: e.id};
    if (vuelveR || e.ct > 44) break;
  }
  ok = chequear('repetición con el HUD: el overlay se oculta', antesR && ocultoR != null && ocultoR <= 20, ocultoR != null ? 'a los ' + ocultoR.toFixed(0) + ' s (la repetición empieza a los 15)' : 'no se ocultó') && ok;
  ok = chequear('termina la repetición: vuelve solo, con el mismo juego', vuelveR && vuelveR.ct <= 32 && vuelveR.id === idR, vuelveR ? 'a los ' + vuelveR.ct.toFixed(0) + ' s (termina a los 27) · ' + vuelveR.id : 'no volvió') && ok;
  await cr.close();
  // la serie en pantalla: el juego 2 con los mismos campeones que el juego 1; los rectángulos de victorias (IG 1–0) dicen cuál es
  const cs = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(cs, {video: 'serie.webm'});
  const s2 = await cs.newPage(); s2.on('pageerror', e => console.log('    error de página:', e.message));
  await s2.goto('https://www.twitch.tv/videos/1');
  await s2.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await s2.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await s2.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  let js = null;
  for (let i = 0; i < 16 && !js; i++) { await s2.waitForTimeout(1000); js = await s2.evaluate(() => window.__rpAS && window.__rpAS.id ? {j: window.__rpAS.id.juego, codes: window.__rpAS.id.codes.join('-'), serie: window.__rpAS.diag.serie} : null); }
  ok = chequear('lee la serie en pantalla (IG 1–0) y reconoce el juego 2 aunque los campeones parezcan del 1', js && js.j === 2, js ? js.codes + ' J' + js.j + ' · serie ' + js.serie : 'no reconoció') && ok;
  await cs.close();
  // un clip de un partido ya jugado en la previa del vivo: cuando vuelve el desk no queda nada de ese partido
  const c1 = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(c1, {video: 'clip.webm'});
  const q = await c1.newPage(); q.on('pageerror', e => console.log('    error de página:', e.message));
  await q.goto('https://www.twitch.tv/riotgames');
  await q.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await q.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await q.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  const eq = () => q.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot, c = document.getElementById('rp-overlay-paneles').shadowRoot.getElementById('cardsx'), AS = window.__rpAS || {};
    return {oculto: sh.getElementById('w').classList.contains('oculto'), body: sh.getElementById('body').textContent, cards: c ? c.textContent.trim() : '', id: AS.id ? AS.id.codes.join('-') : '', ct: document.getElementById('v').currentTime}; });
  let sinc = false, visto = false, limpio = null, suelta = null;
  for (let i = 0; i < 58; i++) {
    await q.waitForTimeout(1000); const e = await eq();
    if (e.id && e.ct < 15) sinc = true;
    if (!e.oculto) visto = true;
    if (e.ct > 15 && e.oculto && limpio == null) limpio = !e.cards;
    if (e.ct > 15 && !e.id && suelta == null) suelta = e.ct;
    if (suelta != null && e.ct > suelta + 3) break;
  }
  const fin = await eq();
  ok = chequear('clip en la previa: reconoce el partido del clip', sinc) && ok;
  ok = chequear('en vivo, el clip de un partido que no se está jugando no aparece en pantalla', !visto) && ok;
  ok = chequear('al volver el desk, no queda nada del clip a la vista', limpio === true && fin.oculto && !fin.cards, limpio == null ? 'no se ocultó' : limpio ? 'oculto, sin paneles' : 'quedaron paneles del clip') && ok;
  ok = chequear('sin reloj ~25 s, suelta el partido del clip', suelta != null && suelta <= 46, suelta != null ? 'a los ' + suelta.toFixed(0) + ' s' : 'sigue con ' + fin.id) && ok;
  await c1.close();
  // fin del juego con el HUD todavía en pantalla (mejores momentos): el resultado unos segundos y después nada
  const c3 = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(c3, {video: 'final.webm'});
  const f = await c3.newPage(); f.on('pageerror', e => console.log('    error de página:', e.message));
  await f.goto('https://www.twitch.tv/videos/1');
  await f.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await f.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const x of ['engine.js', 'ext-overlay.js']) await f.addScriptTag({content: fs.readFileSync(path.join(RAIZ, x), 'utf8')});
  const ef = () => f.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot; return {oculto: sh.getElementById('w').classList.contains('oculto'), body: sh.getElementById('body').textContent, ct: document.getElementById('v').currentTime}; });
  let antesF = false, pild = '', finales = [];
  for (let i = 0; i < 40; i++) {
    await f.waitForTimeout(1000); const e = await ef();
    if (!e.oculto && e.ct < 19 && /%/.test(e.body)) antesF = true;
    if (!e.oculto && /gana el juego|Terminó el juego/.test(e.body)) pild = e.body;
    if (e.ct >= 30) finales.push(e.oculto);
    if (e.ct >= 38) break;
  }
  ok = chequear('fin del juego: antes del final se ve la barra', antesF) && ok;
  ok = chequear('fin del juego: muestra unos segundos quién ganó', !!pild, pild.replace(/\s+/g, ' ').slice(0, 40)) && ok;
  ok = chequear('fin del juego: después desaparece aunque el HUD siga en pantalla', finales.length > 0 && finales.every(Boolean), finales.join(',')) && ok;
  await c3.close();
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
