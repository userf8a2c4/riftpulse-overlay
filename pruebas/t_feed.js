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
  st.modo = 'caido'; await p.waitForTimeout(9000); v = await ver();
  ok = chequear('feed caído: mantiene la última predicción', /%/.test(v.barra)) && ok;
  ok = chequear('feed caído: insignia «Sin datos nuevos»', /SIN DATOS NUEVOS/i.test(v.ins), v.ins) && ok;
  st.modo = 'ok'; await p.waitForTimeout(6000); v = await ver();
  ok = chequear('feed de vuelta: la insignia se va sola', !v.ins && v.estado === 'ok', v.estado) && ok;
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
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
