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
  // casos que salieron con datos reales del Mundial (sondeo): la historia tiene que sonar natural
  const c3 = await b.newContext(); await montar(c3); const u = await c3.newPage(); u.on('pageerror', e => errores.push(e.message));
  await u.goto(BASE + 'analista.html'); await u.waitForTimeout(1500);
  const casos = await u.evaluate(() => {
    const base = (o) => ({match: {blue: {code: 'T1'}, red: {code: 'MKOI'}}, game: Object.assign({id: 'x', gt: 1500, pBlue: 0.6, events: [], allEvents: [], swings: [], timers: {}, stats: null, comeback: null,
      samples: [{gt: 0, p: 0.5, diff: 0}, {gt: 600, p: 0.5, diff: 20}, {gt: 840, p: 0.5, diff: 30}, {gt: 1500, p: 0.6, diff: 900}]}, o)});
    const h = s => RiftEngine.historia(s).map(x => x.text);
    return {
      igual: h(base({})),
      parejo: h(base({pBlue: 0.5})),
      largo: h(base({swings: [{a: 0, b: 1500, d: 0.44, side: 'blue', code: 'T1', cause: 'Primera sangre, Dragón Montaña'}]})),
      pelea: h(base({swings: [{a: 1300, b: 1400, d: 0.3, side: 'red', code: 'MKOI', cause: 'Pelea: T1 1 – 3 MKOI, Barón Nashor'}]})),
      fin: h(base({gt: 2400, pBlue: 0.9, ended: true, recap: {win: 'blue', code: 'T1', dur: 2400, comeback: false, low: {p: 0.4}},
        swings: [{a: 1700, b: 1800, d: -0.54, side: 'red', code: 'MKOI', cause: 'Dragón Infernal, Pelea: T1 1 – 3 MKOI'}, {a: 2200, b: 2300, d: 0.3, side: 'blue', code: 'T1', cause: 'Barón Nashor'}]})),
      talkFin: RiftEngine.talk(base({gt: 2400, pBlue: 0.9, ended: true, recap: {win: 'blue', code: 'T1', dur: 2400}})).map(x => x.text)[0]};
  });
  const todo = Object.values(casos).flat().join(' | ');
  ok = chequear('real: oro igual al min 14 se dice «estaban iguales en oro»', casos.igual.some(t => /estaban iguales en oro/.test(t)) && !/0,0k/.test(todo), casos.igual[0]) && ok;
  ok = chequear('real: el empate se dice bien', casos.parejo.some(t => /50 % para cada uno/.test(t)), casos.parejo.join(' / ')) && ok;
  ok = chequear('real: una ventaja de todo el juego no es «el giro»', casos.largo.some(t => /de a poco/.test(t)) && !casos.largo.some(t => /primera sangre/i.test(t)), casos.largo.join(' / ')) && ok;
  ok = chequear('real: la pelea se cuenta desde el equipo del giro', casos.pelea.some(t => /una pelea ganada 3–1 y el Barón/.test(t)) && !/Pelea:/.test(todo), casos.pelea.join(' / ')) && ok;
  ok = chequear('real: juego terminado, el giro del ganador y el del que no le alcanzó', casos.fin.some(t => /El giro decisivo/.test(t) && /T1/.test(t)) && casos.fin.some(t => /no le alcanzó/.test(t)), casos.fin.join(' / ')) && ok;
  ok = chequear('real: juego terminado en pasado, no «ahora mismo»', /ganó el juego/.test(casos.talkFin) && !/ahora mismo/.test(casos.talkFin), casos.talkFin) && ok;
  ok = chequear('decimales con coma en los textos del modelo', !/\d\.\dk/.test(todo)) && ok;
  await c3.close();
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
