// Información que cuenta la historia: la historia del juego, qué cambió, qué mirar, niveles, visión e ítems
// (solo si el feed los trae) y la banda de confianza. Se prueba con la mesa de análisis y la pieza de OBS.
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true; const errores = [];
  const ctx = await b.newContext({viewport: {width: 1440, height: 1000}}); await montar(ctx);
  const p = await ctx.newPage(); p.on('pageerror', e => errores.push(e.message));
  await p.goto(BASE + 'analista.html'); await p.waitForTimeout(2500);
  // un juego ya jugado, desde el min 16 (el motor rehace el juego desde el inicio): así hay un minuto de historia para comparar
  await p.evaluate(() => RiftEngine.replay('MLI', 1, 16, 1)); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => { const s = RiftEngine.state; return {h: RiftEngine.historia(s).map(x => x.text), c: RiftEngine.cambio(s), m: RiftEngine.mirar(s), j: s.game && s.game.jugadores}; });
  ok = chequear('la historia del juego tiene de 2 a 5 frases', r.h.length >= 2 && r.h.length <= 5, r.h.join(' / ')) && ok;
  ok = chequear('las frases nombran a los equipos del partido', r.h.some(t => /IG|LYON/.test(t))) && ok;
  ok = chequear('qué cambió: compara con hace un minuto', !!r.c && r.c.desde > 0 && Array.isArray(r.c.items), r.c && ('desde ' + Math.round(r.c.desde) + ' s · ' + r.c.items.map(x => x.code + ' ' + x.txt).join(', '))) && ok;
  ok = chequear('qué mirar: el próximo objetivo y cuánto falta', !!r.m && !!r.m.obj && r.m.en >= 0, r.m && (r.m.obj + ' en ' + Math.round(r.m.en) + ' s' + (r.m.mejor ? ' · llega mejor ' + r.m.code : ''))) && ok;
  ok = chequear('niveles, visión e ítems llegan del feed', !!r.j && r.j.wards && r.j.items && r.j.blue.wp > 0 && r.j.blue.items >= 1, r.j && ('wards ' + r.j.blue.wp + '/' + r.j.red.wp + ' · ítems ' + r.j.blue.items + '/' + r.j.red.items)) && ok;
  const mesa = await p.evaluate(() => { const t = document.getElementById('content').textContent; return {hist: document.querySelectorAll('.hist li').length, wards: /Wards puestas/.test(t), items: /Ítems completos/.test(t), banda: !!document.querySelector('.spark path[opacity=".07"]'), mirar: /Qué mirar ahora/.test(t), cambio: /Qué cambió en el último minuto/.test(t)}; });
  ok = chequear('la mesa muestra la historia, qué cambió y qué mirar', mesa.hist >= 2 && mesa.mirar && mesa.cambio) && ok;
  ok = chequear('la mesa muestra visión e ítems', mesa.wards && mesa.items) && ok;
  ok = chequear('el gráfico de momentum tiene la banda de confianza', mesa.banda) && ok;
  const o = await ctx.newPage(); o.on('pageerror', e => errores.push(e.message));
  await o.goto(BASE + 'overlay.html?view=auto'); await o.waitForTimeout(3500); await o.keyboard.press('9'); await o.waitForTimeout(1300);
  ok = chequear('OBS: la pieza «La historia del juego» (atajo 9)', await o.evaluate(() => document.querySelectorAll('.rp-stage .rp-hs li').length >= 2)) && ok;
  await ctx.close();
  // sin el feed de detalles: lo que no viene no se muestra ni se inventa
  const c2 = await b.newContext({viewport: {width: 1440, height: 1000}}); await montar(c2, {detalles: false});
  const q = await c2.newPage(); q.on('pageerror', e => errores.push(e.message));
  await q.goto(BASE + 'analista.html'); await q.waitForTimeout(5000);
  const sin = await q.evaluate(() => ({j: RiftEngine.state.game.jugadores, wards: /Wards puestas/.test(document.getElementById('content').textContent), hist: document.querySelectorAll('.hist li').length}));
  ok = chequear('sin detalles: no aparecen visión ni ítems inventados', !sin.j && !sin.wards) && ok;
  ok = chequear('sin detalles: la historia igual se cuenta', sin.hist >= 2) && ok;
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
