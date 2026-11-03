// Fallos del feed en una pieza de OBS: caído, de vuelta y congelado. Más ?delay, el control y la mesa.
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1920, height: 1080}}), st = await montar(ctx); let ok = true;
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('    error de página:', e.message));
  await p.goto(BASE + 'overlay.html?view=bar&delay=30');
  await p.waitForTimeout(6000);
  const ver = () => p.evaluate(() => ({barra: (document.querySelector('.rp-bar') || {}).innerText || '', ins: getComputedStyle(document.querySelector('.rp-fd')).display === 'none' ? '' : document.querySelector('.rp-fd').innerText, estado: RiftEngine.state.feed.estado, delay: RiftEngine.delay}));
  let v = await ver();
  ok = chequear('con datos normales muestra la probabilidad y ninguna insignia', /%/.test(v.barra) && !v.ins, v.barra.replace(/\s+/g, ' ').slice(0, 60)) && ok;
  ok = chequear('?delay=30 en la URL se aplica', v.delay === 30, v.delay + ' s') && ok;
  // con retraso casi todo sale del caché: un fallo se nota recién con el próximo pedido nuevo (cada tramo de 10 s), así que se espera la insignia hasta 16 s
  st.modo = 'caido'; for (let i = 0; i < 16; i++) { await p.waitForTimeout(1000); v = await ver(); if (/SIN DATOS NUEVOS/i.test(v.ins)) break; }
  ok = chequear('feed caído: mantiene la última predicción', /%/.test(v.barra)) && ok;
  ok = chequear('feed caído: insignia «Sin datos nuevos» (en menos de 16 s)', /SIN DATOS NUEVOS/i.test(v.ins), v.ins) && ok;
  st.modo = 'ok'; await p.waitForTimeout(6000); v = await ver();
  ok = chequear('feed de vuelta: la insignia se va sola', !v.ins && v.estado === 'ok', v.estado) && ok;
  // un juego en curso que lolesports todavía no publica: nunca «Datos al día» sin datos
  st.modo = 'vacio'; const p2 = await ctx.newPage(); await p2.goto(BASE + 'overlay.html?view=bar'); await p2.waitForTimeout(6000);
  const ve = await p2.evaluate(() => ({estado: RiftEngine.state.feed && RiftEngine.state.feed.estado, ins: getComputedStyle(document.querySelector('.rp-fd')).display === 'none' ? '' : document.querySelector('.rp-fd').innerText}));
  await p2.close(); st.modo = 'ok';
  ok = chequear('juego en vivo sin datos todavía: lo dice («Esperando los datos»), no «Datos al día»', ve.estado === 'esperando' && /ESPERANDO/i.test(ve.ins), JSON.stringify(ve)) && ok;
  st.modo = 'congelado'; st.cong = Date.now() - 90000; await p.waitForTimeout(34000); v = await ver();
  ok = chequear('feed congelado: insignia «Datos retrasados»', /RETRASADOS/i.test(v.ins), v.ins) && ok;
  st.modo = 'ok';
  const c = await ctx.newPage(); await c.setViewportSize({width: 380, height: 900}); await c.goto(BASE + 'control.html'); await c.waitForTimeout(10000);
  const cs = await c.evaluate(() => ({piezas: stPiezas.textContent, delay: dlyV.textContent}));
  ok = chequear('el control ve la pieza abierta', /bar/.test(cs.piezas), cs.piezas) && ok;
  await c.click('#dlyB [data-d="5"]'); await p.waitForTimeout(800);
  const d2 = await p.evaluate(() => RiftEngine.delay);
  ok = chequear('+5 s en el control mueve la pieza', d2 === 35, d2 + ' s') && ok;
  await c.click('#panic'); await p.waitForTimeout(800);
  ok = chequear('«Ocultar todo» oculta la pieza', await p.evaluate(() => document.querySelector('.rp-ovl').classList.contains('allhide'))) && ok;
  await c.click('#panic'); await p.waitForTimeout(500);
  ok = chequear('y la vuelve a mostrar', !(await p.evaluate(() => document.querySelector('.rp-ovl').classList.contains('allhide')))) && ok;
  const a = await ctx.newPage(); await a.goto(BASE + 'analista.html'); await a.waitForTimeout(5000);
  const fd = await a.evaluate(() => document.getElementById('fdst').innerText);
  ok = chequear('la mesa muestra el estado y el retraso aplicado', /Datos/.test(fd) && /35 s/.test(fd), fd.replace(/\n/g, ' · ')) && ok;
  // el control abierto fuera de OBS y sin piezas que respondan explica dónde va
  const c2 = await b.newContext(); await montar(c2); const cf = await c2.newPage(); await cf.goto(BASE + 'control.html'); await cf.waitForTimeout(9500);
  ok = chequear('el control fuera de OBS explica que va como dock', await cf.evaluate(() => !document.getElementById('fueraObs').hidden)) && ok;
  // la portada arma una sola URL con la pieza, la posición y el retraso
  const pt = await c2.newPage(); await pt.goto(BASE + 'index.html'); await pt.waitForTimeout(800);
  await pt.selectOption('#gVista', 'bar'); await pt.selectOption('#gPos', 'top'); await pt.fill('#gRet', '30');
  const u = await pt.textContent('#url'), pr = await pt.getAttribute('#probar', 'href');
  ok = chequear('la portada arma la URL con la pieza, la posición y el retraso', /overlay\.html\?view=bar&modules=prob,timers,brand&pos=top&delay=30$/.test(u) && /&demo$/.test(pr), u) && ok;
  await c2.close();
  // la fuerza de los equipos sin la app: OBS usa datos/fuerza.json (la arma la acción diaria) y, si no está, el Elo del Mundial
  const fz = await chromium.launch(), c3 = await fz.newContext(), ELO = {T1: 1820, MKOI: 1480, IG: 1600, LYON: 1590, KOI: 1500, G2: 1610, HLE: 1700, TES: 1690, BLG: 1720, GEN: 1800};
  await montar(c3, {fuerza: {series: 3000, elo: ELO}});
  const pf = await c3.newPage(); await pf.goto(BASE + 'overlay.html?view=bar'); await pf.waitForTimeout(7000);
  const vf = await pf.evaluate(() => ({f: RiftEngine.fuerza(), pre: RiftEngine.state.game && RiftEngine.state.game.pre}));
  ok = chequear('sin la app, la fuerza de los equipos sale de datos/fuerza.json', vf.f.fuente === 'datos' && vf.pre && vf.pre.fuente === 'datos' && vf.pre.elo && vf.pre.p > 0.6, JSON.stringify(vf)) && ok;
  // variables extra del modelo (MODELO.extra): se calculan como en modelo/entrenar.py, y con pesos en cero no cambian nada
  const ex = await pf.evaluate(() => {
    const M = RiftEngine.MODELO, viejo = {extra: M.extra, min: M.min}, R = ['top', 'jungle', 'mid', 'bottom', 'support'];
    const t = g => ({totalGold: g, participants: R.map((r, i) => ({totalGold: i >= 2 && i <= 3 ? g * 0.3 : g * 0.4 / 3}))});
    M.extra = ['tendencia', 'carries', 'oro_x_draft', 'serie'];
    const v = RiftEngine.extrasModelo({blueTeam: t(30000), redTeam: t(28000)}, 900, {samples: [{gt: 600, diff: 0}, {gt: 700, diff: 500}], roles: {blue: R, red: R}, dr: 0.5, serie: [1, -1]});
    const p0 = RiftEngine.state.game.pBlue; M.min = {}; for (const k in viejo.min) M.min[k] = viejo.min[k].concat([0, 0, 0, 0, 0]);
    RiftEngine.setFuerza(null); const p1 = RiftEngine.state.game.pBlue;
    M.extra = viejo.extra; M.min = viejo.min; RiftEngine.setFuerza(null);
    return {v: v.map(x => Math.round(x * 100) / 100), igual: Math.abs(p0 - p1) < 1e-9};
  });
  ok = chequear('variables extra del modelo: tendencia, oro de mid y ADC, oro por draft y la serie', JSON.stringify(ex.v) === '[1.5,0.4,1,1,-1]' && ex.igual, JSON.stringify(ex)) && ok;
  const vs = await p.evaluate(() => RiftEngine.fuerza());
  ok = chequear('sin datos/fuerza.json no la inventa: el Elo del Mundial si hay resultados, o ninguna', vs.fuente !== 'datos' && vs.fuente !== 'app', JSON.stringify(vs)) && ok;
  await fz.close();
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
