// Pausas del juego: lo que está en pantalla manda.
// 1) VOD: el reloj del HUD se queda quieto en 10:00 y después vienen las cámaras con el cartel «GAME PAUSE»: en vez de la
//    barra se ve el resumen de lo que va del juego, y al reanudarse vuelve todo como antes, en el minuto justo. Además, las
//    pausas guardadas de ese juego están mal (vacías): al reanudarse, el feed dice «pausa» pero el reloj corre, así que se
//    miden de nuevo solas.
// 2) En vivo, después de una pausa de 10 min que ya terminó: nada de «Juego en pausa» pegado; los datos son los del minuto del HUD.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, RAIZ} = require('./mocks');
async function pagina(b, video, url, o) {
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(ctx, Object.assign({video}, o || {}));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto(url);
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => { window.RP_DEBUG = true; try { localStorage.setItem('rp_pausas_g2', '[]'); } catch (e) {} document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  return {ctx, p};
}
const leer = p => p.evaluate(() => {
  const s = RiftEngine.state, A = window.__rpAS || {}, v = document.getElementById('v'), sh = document.getElementById('rp-overlay-host').shadowRoot, sh2 = document.getElementById('rp-overlay-paneles').shadowRoot;
  return {ct: v.currentTime, id: A.id ? A.id.codes.join('-') + ' J' + A.id.juego : '', hud: A.off != null ? A.off + v.currentTime : null, gt: s.game ? s.game.gt : null,
    feed: s.feed ? s.feed.estado : '', barra: !sh.getElementById('w').classList.contains('oculto'), texto: sh.getElementById('body').textContent,
    panel: sh2.getElementById('pausa').textContent, k: s.game && s.game.stats ? s.game.stats.blue.kills + '-' + s.game.stats.red.kills : ''};
});
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  // 1) VOD con pausa
  const {ctx, p} = await pagina(b, 'pausa.webm', 'https://www.twitch.tv/videos/1');
  let id = '', panel = null, gtPausa = null, barraEnPausa = false, vuelve = null, peor = 0, pegado = 0;
  for (let i = 0; i < 80; i++) {
    await p.waitForTimeout(1000); const e = await leer(p);
    if (e.ct < 20 && e.id) id = e.id;
    if (e.ct >= 24 && e.ct < 47) {
      if (e.panel && panel == null) panel = {ct: e.ct, txt: e.panel};
      if (e.panel && gtPausa == null) gtPausa = e.gt;
      if (e.ct >= 33 && e.barra) barraEnPausa = true;
    }
    if (e.ct >= 48 && !e.panel && e.barra && vuelve == null) vuelve = e.ct;
    if (e.ct >= 58 && e.gt != null && e.hud != null) { peor = Math.max(peor, Math.abs(e.gt - e.hud)); if (e.feed === 'pausa' || /pausa/i.test(e.texto)) pegado++; }
    if (e.ct > 74) break;
  }
  await ctx.close();
  ok = chequear('reconoce el juego antes de la pausa', /IG-LYON J2/.test(id), id || 'sin reconocer') && ok;
  ok = chequear('el reloj se queda quieto: aparece el resumen de la pausa', panel && panel.ct <= 33 && /Pausa/.test(panel.txt) && /Kills/.test(panel.txt), panel ? 'a los ' + panel.ct.toFixed(0) + ' s (se congela a los 20)' : 'no apareció') && ok;
  ok = chequear('el resumen es el del minuto de la pausa (10:00)', gtPausa != null && Math.abs(gtPausa - 600) <= 6, gtPausa != null ? 'min ' + gtPausa.toFixed(0) : '—') && ok;
  ok = chequear('durante la pausa (cartel «GAME PAUSE», sin marcador) la barra no se ve', !barraEnPausa, barraEnPausa ? 'se vio la barra' : 'solo el resumen') && ok;
  ok = chequear('se reanuda: vuelve la barra y se va el resumen', vuelve != null && vuelve <= 54, vuelve != null ? 'a los ' + vuelve.toFixed(0) + ' s (se reanuda a los 48)' : 'no volvió') && ok;
  ok = chequear('después de reanudar: los datos son los del minuto del HUD, sin «pausa» pegada', peor <= 6 && pegado === 0, 'peor ' + peor.toFixed(1) + ' s · ' + pegado + ' muestras con «pausa»') && ok;
  // 1b) saltar directo a las cámaras con el cartel «GAME PAUSE» (sin ver el reloj quieto): el cartel solo alcanza
  const r3 = await pagina(b, 'pausa.webm', 'https://www.twitch.tv/videos/1');
  let sync = false, cartel = null;
  for (let i = 0; i < 12 && !sync; i++) { await r3.p.waitForTimeout(1000); sync = !!(await leer(r3.p)).id; }
  await r3.p.evaluate(() => { document.getElementById('v').currentTime = 30; });
  for (let i = 0; i < 12 && cartel == null; i++) { await r3.p.waitForTimeout(1000); const e = await leer(r3.p); if (e.panel && e.ct < 48) cartel = e.ct; }
  await r3.ctx.close();
  ok = chequear('salto directo al cartel «GAME PAUSE»: aparece el resumen', sync && cartel != null && cartel <= 40, cartel != null ? 'a los ' + cartel.toFixed(0) + ' s (salto a los 30)' : sync ? 'no apareció' : 'no sincronizó') && ok;
  // 2) en vivo, después de una pausa larga que ya terminó
  const r2 = await pagina(b, 'vivo.webm', 'https://www.twitch.tv/riotgames', {pausaVivo: true});
  let iv = '', fin = null;
  for (let i = 0; i < 35; i++) {
    await r2.p.waitForTimeout(1000); const e = await leer(r2.p);
    if (e.id) iv = e.id;
    if (e.id && e.gt != null && e.hud != null && e.ct >= 18) { fin = e; if (e.ct >= 26) break; }
  }
  // el botón de idioma del overlay: pasa al inglés al instante, sin recargar Twitch
  const idi = await r2.p.evaluate(async () => { const sh = document.getElementById('rp-overlay-host').shadowRoot, c = sh.getElementById('langc'), antes = c.textContent;
    c.click(); await new Promise(r => setTimeout(r, 1500));
    const ES = /[áéíóúñ¿¡]|\b(el|la|los|las|del|de|en|con|que|para|por|sin|una?|juegos?|partidos?|acierta|minuto|oro|torres|dragones|cargando|más|vivo|ventaja)\b/, resto = [];
    [sh, document.getElementById('rp-overlay-paneles').shadowRoot].forEach(r => { const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const pe = n.parentElement; if (pe && /STYLE|SCRIPT/.test(pe.nodeName)) continue; const t = n.nodeValue.trim(); if (t && ES.test(t)) resto.push(t.slice(0, 40)); } });
    return {antes, despues: c.textContent, chip: sh.getElementById('autoc').textContent, resto}; });
  await r2.ctx.close(); await b.close();
  ok = chequear('el overlay tiene su botón de idioma y cambia al inglés al instante', idi.antes === 'EN' && idi.despues === 'ES' && idi.chip === 'auto sync', idi.chip) && ok;
  ok = chequear('en inglés no queda texto en español en el overlay', !idi.resto.length, idi.resto.length ? idi.resto.slice(0, 6).join(' | ') : 'todo en inglés') && ok;
  ok = chequear('en vivo reconoce el juego en curso', /T1-MKOI/.test(iv), iv || 'sin reconocer') && ok;
  ok = chequear('en vivo, tras una pausa de 10 min: el minuto es el del HUD y no queda «Juego en pausa»', fin && Math.abs(fin.gt - fin.hud) <= 6 && fin.feed !== 'pausa' && !/pausa/i.test(fin.texto),
    fin ? 'min ' + fin.gt.toFixed(0) + ' (HUD ' + fin.hud.toFixed(0) + ') · ' + fin.feed : 'sin datos') && ok;
  return ok;
};
