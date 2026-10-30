// Sincronía con el video (el overlay de la extensión sobre un VOD de Twitch).
// Video sintético: juego 1 de 4:20 a 5:09 con 10 s sin marcador, luego el juego 2. Señuelos en vivo en el feed.
// Además, el lector «confunde» el 0 inicial con un 2 en el 40 % de las lecturas.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, RAIZ} = require('./mocks');
async function pagina(b, video) {
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(ctx, {video});
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'engine.js'), 'utf8')});
  await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'ext-overlay.js'), 'utf8')});
  return {ctx, p};
}
const leer = p => p.evaluate(() => { const A = window.__rpAS, v = document.getElementById('v'); return {ct: v.currentTime, off: A.off, j: A.id && A.id.juego, m: A.id && A.id.matchId}; });
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  // 1) VOD con repetición, cambio de juego, salto y pausa
  const {ctx, p} = await pagina(b, 'vod.webm');
  await p.evaluate(() => { const L = RiftLector, orig = L.numeros, det = L.detalle; let u = null;
    L.numeros = function (m, l) { const r = orig(m, l); u = null; if ((!l || l === '0123456789') && /^0\d:\d\d$/.test(r) && Math.random() < 0.4) { const d = det(); d[0] = {c: '2', c2: '0'}; u = d; window.__f = (window.__f || 0) + 1; return '2' + r.slice(1); } return r; };
    L.detalle = function () { return u || det(); }; });
  const real = ct => ct < 50 ? 260 + ct : 5 + (ct - 50), jReal = ct => ct < 50 ? 1 : 2;
  let peor = 0, primero = null, senuelo = 0, fuera = [], n = 0;
  for (let i = 0; i < 110; i++) {
    await p.waitForTimeout(1000);
    if (i === 85) await p.evaluate(() => { const v = document.getElementById('v'); v.currentTime = 30; v.play(); });
    if (i === 100) await p.evaluate(() => document.getElementById('v').pause());
    const s = await leer(p);
    if (s.off == null || !s.j) continue;
    if (primero == null) primero = i;
    n++;
    if (s.m !== 'MLI') { senuelo++; continue; }
    if (s.j !== jReal(s.ct)) { const enCambio = (s.ct >= 50 && s.ct < 58) || (i >= 85 && i < 93); if (!enCambio) fuera.push(i + '@' + s.ct.toFixed(0)); continue; }
    peor = Math.max(peor, Math.abs(s.off + s.ct - real(s.ct)));
  }
  const falsas = await p.evaluate(() => window.__f || 0); await ctx.close();
  ok = chequear('reconoce el partido en menos de 8 s', primero != null && primero <= 8, 'a los ' + primero + ' s') && ok;
  ok = chequear('nunca salta a un partido señuelo', senuelo === 0, senuelo + ' muestras') && ok;
  ok = chequear('el minuto nunca se aleja más de 1 s del reloj real', peor <= 1, 'peor ' + peor.toFixed(1) + ' s, ' + falsas + ' lecturas falseadas') && ok;
  ok = chequear('el juego correcto fuera de los cambios (juego nuevo, salto)', fuera.length === 0, fuera.length ? fuera.join(' ') : n + ' muestras') && ok;
  // 2) juego 2 corriendo desde 16:58: lo distingue por el marcador
  const r2 = await pagina(b, 'correr.webm'); let j2 = null;
  for (let i = 0; i < 12 && !j2; i++) { await r2.p.waitForTimeout(1000); const s = await leer(r2.p); if (s.j) j2 = s; }
  ok = chequear('a mitad de juego distingue el juego 2 por el marcador', j2 && j2.m === 'MLI' && j2.j === 2, j2 ? j2.m + ' J' + j2.j : 'sin reconocer') && ok;
  // el juego 2 tuvo una pausa de 5 min antes (el feed siguió con el oro quieto): lo que se muestra es el minuto del HUD, no el del feed
  await r2.p.waitForTimeout(6000);
  const st = await r2.p.evaluate(() => { const s = RiftEngine.state, v = document.getElementById('v'), A = window.__rpAS; return {gt: s.game && s.game.gt, hud: A.off + v.currentTime, k: s.game && s.game.stats ? [s.game.stats.blue.kills, s.game.stats.red.kills] : null}; });
  await r2.ctx.close();
  ok = chequear('con una pausa antes: el minuto y las kills son los del HUD (2–3), no los del feed', st.gt != null && Math.abs(st.gt - st.hud) <= 2 && st.k && st.k.join('-') === '2-3', 'min ' + (st.gt || 0).toFixed(0) + ' (HUD ' + st.hud.toFixed(0) + ') · kills ' + (st.k || []).join('-')) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
