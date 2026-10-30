// Una serie en vivo que avanza con la pestaña abierta (el caso real de TES vs BLG, juego 3): primero el juego 2 y, a los
// 25 s del video, empieza el juego 3 (la serie 1–1 en pantalla). Como en la realidad, lolesports tarda: el detalle del partido
// sigue diciendo que el juego 3 no empezó, y su feed aparece 11 s después de que se ve el juego en pantalla.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, RAIZ} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); const st = await montar(ctx, {video: 'serie3.webm', serieViva: true});
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto('https://www.twitch.tv/lolesports');
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  let j2 = null, espera = null, j3 = null, otro = [], visible3 = false;
  for (let i = 0; i < 62; i++) {
    await p.waitForTimeout(1000);
    const e = await p.evaluate(() => { const A = window.__rpAS || {}, v = document.getElementById('v'), w = document.getElementById('rp-overlay-host').shadowRoot.getElementById('w');
      return {ct: v.currentTime, id: A.id ? A.id.codes.slice().sort().join('-') + ' J' + A.id.juego : '', live: !!(A.id && A.id.live), estado: (A.diag && A.diag.estado) || '', vis: !w.classList.contains('oculto')}; });
    if (e.ct >= 36 && st.serie < 3) st.serie = 3;  // lolesports publica el feed del juego 3 recién ahora
    if (e.ct < 24 && e.id === 'BLG-TES J2' && e.live && j2 == null) j2 = e.ct;
    if (e.ct >= 25 && e.ct < 36 && /todavía no publica/.test(e.estado) && espera == null) espera = {ct: e.ct, txt: e.estado};
    if (e.id && !/^BLG-TES J[23]$/.test(e.id)) otro.push(e.ct.toFixed(0) + ' ' + e.id);
    if (e.ct >= 25 && e.id === 'BLG-TES J3' && e.live && j3 == null) j3 = e.ct;
    if (j3 != null && e.ct > j3 + 2 && e.vis) visible3 = true;
    if (e.ct > 58) break;
  }
  await ctx.close();
  // en vivo, T1 vs MKOI con dos clips de otro partido en el medio (IG vs LYON con sus siglas, y otro sin siglas legibles):
  // nunca cambia de partido ni de minuto, la barra se aparta durante el clip y vuelve sola
  const c2 = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(c2, {video: 'vivoclip.webm'});
  const q = await c2.newPage(); q.on('pageerror', e => console.log('    error de página:', e.message));
  await q.goto('https://www.twitch.tv/lolesports');
  await q.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await q.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await q.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  let sinc = null, cambios = [], minuto = 0, barraClip = 0, vuelve = null;
  for (let i = 0; i < 62; i++) {
    await q.waitForTimeout(1000);
    const e = await q.evaluate(() => { const A = window.__rpAS || {}, v = document.getElementById('v'), s = RiftEngine.state, w = document.getElementById('rp-overlay-host').shadowRoot.getElementById('w');
      return {ct: v.currentTime, id: A.id ? A.id.codes.join('-') : '', hud: A.off != null ? A.off + v.currentTime : null, motor: s.match ? s.match.blue.code + '-' + s.match.red.code : '', gt: s.game ? s.game.gt : null, barra: !w.classList.contains('oculto') && !w.classList.contains('tenue')}; });
    if (e.id === 'T1-MKOI' && sinc == null) sinc = e.ct;
    if (sinc == null) continue;
    if ((e.id && e.id !== 'T1-MKOI') || (e.motor && !/^(T1-MKOI|MKOI-T1)$/.test(e.motor))) cambios.push(e.ct.toFixed(0) + ' ' + (e.id || '—') + '/' + e.motor);
    if (e.hud != null) minuto = Math.max(minuto, Math.abs(e.hud - (330 + e.ct)));  // el ancla: siempre el reloj del juego en vivo
    if (e.ct >= 25 && e.ct < 47 && e.barra) barraClip++;
    if (e.ct >= 48 && e.barra && vuelve == null) vuelve = e.ct;
    if (e.ct > 58) break;
  }
  await c2.close(); await b.close();
  ok = chequear('en vivo con clips de otro partido: reconoce el juego en vivo', sinc != null && sinc < 19, sinc != null ? 'a los ' + sinc.toFixed(0) + ' s' : 'no lo reconoció') && ok;
  ok = chequear('los clips no cambian el partido (ni en el overlay ni en los datos)', !cambios.length, cambios.length ? cambios.slice(0, 4).join(' · ') : 'siempre T1 vs MKOI') && ok;
  ok = chequear('el minuto sigue siendo el del juego en vivo, también durante los clips', minuto <= 3, 'peor ' + minuto.toFixed(1) + ' s') && ok;
  ok = chequear('durante el clip la barra se aparta, y vuelve sola', barraClip <= 4 && vuelve != null && vuelve <= 54, barraClip + ' s con la barra en el clip · vuelve ' + (vuelve != null ? 'a los ' + vuelve.toFixed(0) + ' s' : 'nunca')) && ok;
  ok = chequear('en vivo reconoce el juego 2 de TES vs BLG', j2 != null, j2 != null ? 'a los ' + j2.toFixed(0) + ' s' : 'no lo reconoció') && ok;
  ok = chequear('empieza el juego 3 sin datos todavía: lo dice y espera (no muestra otro partido)', espera != null && !otro.length, espera ? 'a los ' + espera.ct.toFixed(0) + ' s · ' + espera.txt : otro.length ? 'mostró ' + otro.slice(0, 3).join(', ') : 'no avisó') && ok;
  ok = chequear('aparecen los datos del juego 3: se sincroniza sola, sin recargar', j3 != null && j3 <= 45, j3 != null ? 'a los ' + j3.toFixed(0) + ' s (los datos aparecen a los 36)' : 'no lo reconoció') && ok;
  ok = chequear('el overlay se ve con el juego 3', visible3) && ok;
  return ok;
};
