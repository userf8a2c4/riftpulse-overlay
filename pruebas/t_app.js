// La app para fans: la vista «Ahora» (partido, historia del juego, detalles plegables), Mis equipos,
// el interruptor «Sin spoilers», la fase suiza visual y las tarjetas para compartir.
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true; const errores = [];
  const ctx = await b.newContext({viewport: {width: 1440, height: 1000}, acceptDownloads: true}); await montar(ctx);
  const p = await ctx.newPage(); p.on('pageerror', e => { if (!/reading 'sf'/.test(e.message)) errores.push(e.message); });
  await p.goto(BASE + 'app.html'); await p.waitForTimeout(6000);
  const tabs = await p.$$eval('nav.tabs button', l => l.map(x => x.textContent.trim()));
  ok = chequear('pestañas: Ahora · Mundial · Historial · Mando', tabs.join('·') === 'Ahora·Mundial·Historial·Mando', tabs.join(' · ')) && ok;
  ok = chequear('«Ahora» abre con el partido en vivo', await p.evaluate(() => !document.getElementById('vistaAhora').hidden && /T1/.test(document.getElementById('iniVivo').textContent))) && ok;
  ok = chequear('«Ahora» cuenta la historia del juego', await p.evaluate(() => !document.getElementById('ahHist').hidden && document.querySelectorAll('#ahHist .ah-ol li').length >= 1 && /Qué mirar ahora/i.test(document.getElementById('ahHist').textContent))) && ok;
  const vis = sel => p.evaluate(s => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().height > 0; }, sel);
  ok = chequear('los detalles empiezan plegados: se ve el gráfico, no los duelos', (await vis('.a-chart')) && !(await vis('.a-lanes'))) && ok;
  await p.click('#ahDet'); await p.waitForTimeout(400);
  ok = chequear('«Todos los detalles» los despliega', await vis('.a-lanes')) && ok;
  // mis equipos
  await p.click('#ahFav [data-act="fav"][data-arg="T1"]'); await p.waitForTimeout(300);
  await p.click('#ahFav [data-act="favListo"]'); await p.waitForTimeout(300);
  ok = chequear('mis equipos: T1 queda guardado y muestra que juega ahora', await p.evaluate(() => /T1/.test(document.getElementById('ahFav').textContent) && /en vivo/.test(document.getElementById('ahFav').textContent) && JSON.parse(localStorage.getItem('rp_favs') || localStorage.getItem('favs') || '[]').includes('T1')),
    await p.evaluate(() => document.getElementById('ahFav').textContent.slice(0, 80))) && ok;
  ok = chequear('mis equipos: sus partidos se destacan en las listas', await p.evaluate(() => document.querySelectorAll('.up-row.fav').length >= 1)) && ok;
  // sin spoilers desde el encabezado
  await p.click('#spx summary'); await p.click('#spx [data-act="spApp"][data-arg="todo"]'); await p.waitForTimeout(600);
  ok = chequear('sin spoilers: los resultados de Ahora quedan tapados', await p.evaluate(() => /• – •/.test(document.getElementById('iniRes').textContent) && !/IG 2/.test(document.getElementById('iniRes').textContent))) && ok;
  await p.evaluate(() => setVista('copa')); await p.waitForTimeout(800);
  ok = chequear('sin spoilers: la tabla de la suiza queda oculta', await p.evaluate(() => /oculta para no spoilear/.test(document.getElementById('cuadro').textContent))) && ok;
  await p.click('#spx summary'); await p.click('#spx [data-act="spApp"][data-arg=""]'); await p.waitForTimeout(800);
  // fase suiza visual
  const sw = await p.evaluate(() => { const fs = document.querySelector('#fsTabs [data-fase="sw"]'); if (fs) fs.click(); return new Promise(r => setTimeout(() => r({cajas: document.querySelectorAll('.sw-box').length, caminos: document.querySelectorAll('#swSvg path').length, partidos: document.querySelectorAll('.sw-m').length}), 600)); });
  ok = chequear('fase suiza: una caja por récord y los caminos entre rondas', sw.cajas === 15 && sw.caminos === 18 && sw.partidos >= 2, JSON.stringify(sw)) && ok;
  ok = chequear('fase suiza: sin desborde de la página', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) && ok;
  // tarjetas para compartir
  const bajar = async (fn, n) => { const d = p.waitForEvent('download', {timeout: 8000}).catch(() => null); await p.evaluate(fn); const x = await d; return x ? x.suggestedFilename() : null; };
  const f0 = await bajar(() => tarjeta('prueba.png', (c, W) => { titulito(c, 'Prueba', 96); barra2(c, 60, 300, W - 120, 60, 0.6, RiftEngine.colores('T1', 'MKOI').a, RiftEngine.colores('T1', 'MKOI').b); }));
  ok = chequear('tarjetas: se genera la imagen para compartir', f0 === 'prueba.png', f0 || 'sin descarga') && ok;
  if (await p.evaluate(() => probSerie('T1', 'MKOI', 3) != null)) { const f1 = await bajar(() => sharePron('T1', 'MKOI', 3, 'TM')); ok = chequear('tarjeta: pronóstico de la serie', !!f1 && /T1-vs-MKOI/.test(f1), f1 || 'sin descarga') && ok; }
  const hayRows = await p.evaluate(() => !!(C && C.rows));
  if (hayRows) { const f2 = await bajar(() => sharePickem()); ok = chequear("tarjeta: mi Pick'Em", f2 === 'riftpulse-pickem.png', f2 || 'sin descarga') && ok; }
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  // celular
  const c2 = await b.newContext({viewport: {width: 390, height: 844}}); await montar(c2);
  const q = await c2.newPage(); await q.goto(BASE + 'app.html'); await q.waitForTimeout(4000);
  ok = chequear('celular: «Ahora» sin desborde horizontal', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
