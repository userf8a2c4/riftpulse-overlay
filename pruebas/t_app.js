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
  // predicciones del staff en Mando: integrantes, picks, aciertos solos y la URL para OBS con todo
  const sp = await p.evaluate(async () => {
    setVista('mando'); await new Promise(r => setTimeout(r, 1500)); spLoad(); await new Promise(r => setTimeout(r, 1500));
    const dia = RiftEngine.predDays(SP_MS).find(d => /^\d/.test(d.key) && RiftEngine.predMatches(SP_MS, d.key).some(x => x.id === 'MLI'));
    SP.day = dia ? dia.key : 'auto';
    document.getElementById('spName').value = 'Ana'; spAdd(); document.getElementById('spName').value = 'Beto'; spAdd();
    const btn = (who, t) => document.querySelector('[data-sp-m="MLI"][data-sp-who="' + who + '"][data-sp-t="' + t + '"]');
    if (btn(1, 'IG')) btn(1, 'IG').click(); if (btn(2, 'LYON')) btn(2, 'LYON').click();
    return {ok: !!document.querySelector('[data-sp-who="1"][data-sp-t="IG"].ok'), no: !!document.querySelector('[data-sp-who="2"][data-sp-t="LYON"].no'), mem: document.getElementById('spMem').innerText.replace(/\s+/g, ' '), url: spUrl()};
  });
  ok = chequear('predicciones del staff: el pick acertado y el fallado se marcan solos', sp.ok && sp.no, sp.mem) && ok;
  const ob = await p.context().newPage(); await ob.goto(sp.url.replace('https://userf8a2c4.github.io/riftpulse-overlay/', BASE)); await ob.waitForTimeout(3500);
  const obT = await ob.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  ok = chequear('predicciones del staff: la URL para OBS muestra a los integrantes y sus aciertos', /ana/i.test(obT) && /beto/i.test(obT) && /aciertos/i.test(obT), obT.slice(0, 90)) && ok;
  await ob.close();
  // marcador de la serie al terminar un juego: suma el punto al instante y no lo cuenta dos veces cuando lolesports lo suma
  const mc = await p.evaluate(() => {
    const m = () => ({id: 'X', games: [{id: 'xa', state: 'inProgress'}], teams: [{code: 'A', result: {gameWins: 0}}, {code: 'B', result: {gameWins: 0}}]});
    const a = m(); FIN.xa = 'B'; aplicarFin(a); const ya = a.teams.map(t => t.result.gameWins).join('-');
    const b2 = m(); b2.games[0].state = 'completed'; b2.teams[1].result.gameWins = 1; aplicarFin(b2);
    return {ya, luego: b2.teams.map(t => t.result.gameWins).join('-'), queda: !!FIN.xa};
  });
  ok = chequear('marcador: al terminar el juego suma el punto al instante', mc.ya === '0-1', mc.ya) && ok;
  ok = chequear('marcador: cuando lolesports lo suma, no lo cuenta dos veces', mc.luego === '0-1' && !mc.queda, JSON.stringify(mc)) && ok;
  // enfrentamiento: los últimos cruces entre los dos equipos, en cualquier liga, con torneo, fecha y resultado
  await p.evaluate(() => { setVista('ahora'); INIDET = {type: 'h2h', a: 'IG', b: 'LYON', ev: 'MLI'}; renderIniDetalle(); });
  await p.waitForTimeout(3000);
  const cru = await p.evaluate(() => document.getElementById('iniDetalle').innerText.replace(/\s+/g, ' '));
  ok = chequear('enfrentamiento: muestra los últimos cruces con torneo, fecha y resultado', /Últimos cruces/i.test(cru) && /IG 2\s*–\s*1 LYON/.test(cru) && /Worlds · Fase Suiza/.test(cru) && /2026/.test(cru), cru.slice(cru.search(/Últimos cruces/i), cru.search(/Últimos cruces/i) + 90)) && ok;
  // Mando: si deja de verse un partido, se queda con el último (el guion y la lectura no se pierden)
  const mq = await p.evaluate(async () => { setVista('mando'); await new Promise(r => setTimeout(r, 2500));
    const antes = document.getElementById('mxTalk').textContent; MX.s = Object.assign({}, MX.s, {game: null, match: null}); renderMando();
    return {antes: !/Aparece con el partido/.test(antes), air: document.getElementById('mxAir').textContent, talk: document.getElementById('mxTalk').textContent}; });
  ok = chequear('Mando: sin partido en pantalla conserva el último juego y lo avisa', mq.antes && /SIN PARTIDO EN PANTALLA/.test(mq.air) && !/Aparece con el partido/.test(mq.talk), mq.air.replace(/\s+/g, ' ').slice(0, 90)) && ok;
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  // celular
  const c2 = await b.newContext({viewport: {width: 390, height: 844}}); await montar(c2);
  const q = await c2.newPage(); await q.goto(BASE + 'app.html'); await q.waitForTimeout(4000);
  ok = chequear('celular: «Ahora» sin desborde horizontal', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) && ok;
  // idiomas: el selector ES | EN en la app y en la portada; en inglés se traduce lo que se ve (también lo que se dibuja después)
  const ci = await b.newContext({viewport: {width: 1440, height: 1000}}); await montar(ci);
  const e1 = await ci.newPage(); await e1.goto(BASE + 'app.html'); await e1.waitForTimeout(2500);
  ok = chequear('idiomas: la app tiene el selector ES | EN', await e1.evaluate(() => /ES\s*\|\s*EN/.test((document.querySelector('[data-rp-lang]') || {}).textContent || ''))) && ok;
  await e1.click('[data-rp-lang] button[data-l="en"]'); await e1.waitForTimeout(4000);
  const tabsEn = await e1.$$eval('nav.tabs button', l => l.map(x => x.textContent.trim()));
  ok = chequear('idiomas: en inglés, las pestañas dicen Now · Worlds · History · Control room', tabsEn.join('·') === 'Now·Worlds·History·Control room', tabsEn.join(' · ')) && ok;
  const e2 = await ci.newPage(); await e2.goto(BASE + 'index.html'); await e2.waitForTimeout(1500);
  ok = chequear('idiomas: la elección se recuerda en la portada', await e2.evaluate(() => document.documentElement.lang === 'en' && /I want to watch Worlds/.test(document.body.textContent))) && ok;
  // en inglés no queda nada en español: todas las vistas de la app y las páginas del sitio
  const restos = pg => pg.evaluate(() => { const ES = /[áéíóúñ¿¡]|\b(el|la|los|las|del|de|en|con|que|para|por|sin|una?|juegos?|partidos?|equipos?|hoy|ayer|victorias|acierta|serie|minuto|oro|torres|dragones|ganador|cargando|todavía|cada|más|vivo)\b/, r = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const pe = n.parentElement; if (!pe || /SCRIPT|STYLE/.test(pe.nodeName) || pe.closest('[hidden]')) continue; const t = n.nodeValue.trim(); if (t && ES.test(t) && !/^https?:/.test(t)) r.push(t.slice(0, 60)); }
    return r; });
  const enES = [];
  for (const v of ['ahora', 'copa', 'pickem', 'hist', 'mando']) { await e1.evaluate(v => setVista(v), v); await e1.waitForTimeout(1500); (await restos(e1)).forEach(x => enES.push(v + ': ' + x)); }
  for (const f of ['index.html', 'instalar.html', 'como-funciona.html', 'control.html', 'analista.html']) { const q2 = await ci.newPage(); await q2.goto(BASE + f); await q2.waitForTimeout(2500); (await restos(q2)).forEach(x => enES.push(f + ': ' + x)); await q2.close(); }
  ok = chequear('idiomas: en inglés no queda texto en español (app y sitio)', enES.length === 0, enES.length ? enES.length + ' · ' + enES.slice(0, 4).join(' | ') : 'todo en inglés') && ok;
  await ci.close();
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
