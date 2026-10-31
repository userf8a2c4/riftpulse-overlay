// Director automático: en un juego acelerado decide bien qué pieza mostrar y cuándo (nunca dos a la vez, con respiro),
// la pieza view=auto obedece los atajos y al control, y los temas se aplican.
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true;
  const ctx = await b.newContext({viewport: {width: 1920, height: 1080}}); await montar(ctx);
  const p = await ctx.newPage(); const errores = []; p.on('pageerror', e => errores.push(e.message));
  await p.goto(BASE + 'overlay.html?view=bar'); await p.waitForTimeout(1500);

  // ---- 1) el motor del director, con un juego de 29 min simulado segundo a segundo ----
  const R = await p.evaluate(() => {
    const real = Date.now; let T = 1e12; Date.now = () => T;
    function correr(nivel, imp) {
      const D = RiftEngine.crearDirector(nivel), tramos = [], giros = []; let cur = null, ug = null; if (imp == null) imp = 8;
      for (let gt = 60; gt <= 1790; gt++) {
        T = 1e12 + gt * 1000;
        let pb = 0.52 + (gt - 60) * 0.00002;
        if (gt >= 900) pb = Math.max(0.2, 0.55 - (gt - 900) / 15 * 0.35);   // giro fuerte a favor de LYON en el min 15
        const drag = Math.ceil((gt + 1 - 30) / 300) * 300 + 30, baron = gt < 1200 ? 1200 : 1560;
        const g = {id: 'g1', gt, pBlue: pb, timers: {dragon: {at: drag}, baron: gt >= 1200 ? {at: baron} : null},
          fight: gt >= 700 ? {gt: 700, kb: 3, kr: 2} : null, impact: {blue: imp, red: 2}, ended: gt >= 1750, recap: gt >= 1750 ? {code: 'LYON'} : null,
          comeback: pb > 0.55 ? {side: 'red', code: 'LYON', p: 1 - pb, paths: [{txt: 'Barón', p: 0.5}]} : pb < 0.45 ? {side: 'blue', code: 'IG', p: pb, paths: [{txt: 'Barón', p: 0.4}]} : null};
        const d = D.decidir({match: {blue: {code: 'IG'}, red: {code: 'LYON'}}, game: g});
        if (D.giro && D.giro.clave !== ug) { ug = D.giro.clave; giros.push(gt); }
        if (d && (!cur || cur.clave !== d.clave)) { if (cur) cur.fin = gt; cur = {pieza: d.pieza, clave: d.clave, ini: gt}; tramos.push(cur); }
        else if (!d && cur) { cur.fin = gt; cur = null; }
      }
      if (cur) cur.fin = 1790;
      return {tramos: tramos.map(t => ({pieza: t.pieza, ini: t.ini, fin: t.fin})), giros};
    }
    const out = {minimo: correr('minimo'), estandar: correr('estandar'), show: correr('show'), poco: correr('estandar', 2)};
    // el giro sale aunque haya una pieza grande en pantalla
    T = 3e12; const D2 = RiftEngine.crearDirector('estandar'), st = p => ({match: {blue: {code: 'IG'}, red: {code: 'LYON'}}, game: {id: 'x', gt: 700, pBlue: p, timers: {}}});
    D2.decidir(st(0.5)); D2.forzar('oro', 120); T += 40e3; D2.decidir(st(0.75));
    out.giroConPieza = {pieza: D2.actual && D2.actual.pieza, giro: !!D2.giro};
    // a mano: una pieza pedida dura lo pedido, aunque no haya juego, y «saltar» la quita
    T = 2e12; const D = RiftEngine.crearDirector('estandar'); D.forzar('oro', 15);
    T += 10e3; const a = D.decidir({match: {}, game: null}); T += 1e3; D.saltar(); const b = D.decidir({match: {}, game: null});
    out.mano = {durante: a && a.pieza, despues: b && b.pieza};
    // pelea en equipo: solo cuenta si participaron 4+ jugadores de cada equipo (no un 2v2)
    const jug = (k, d, a, sh) => ({name: 'J', champ: 'X', champId: 'X', k, d, a, share: sh});
    const eq = (v) => v.map(x => jug(x[0], x[1], x[2], x[3]));
    const antes = {blue: eq([[0,0,0,.2],[0,0,0,.2],[0,0,0,.2],[0,0,0,.2],[0,0,0,.2]]), red: eq([[0,0,0,.2],[0,0,0,.2],[0,0,0,.2],[0,0,0,.2],[0,0,0,.2]])};
    const t5 = {blue: eq([[1,0,1,.22],[0,0,2,.18],[1,0,1,.25],[1,1,0,.2],[0,0,2,.15]]), red: eq([[0,1,0,.2],[0,1,0,.2],[1,1,0,.22],[0,0,1,.2],[0,0,1,.18]])};
    const t2 = {blue: eq([[2,0,0,.25],[1,0,1,.2],[0,0,0,.2],[0,0,0,.2],[0,0,0,.15]]), red: eq([[0,1,0,.2],[0,1,0,.2],[0,1,0,.2],[0,0,0,.2],[0,0,0,.2]])};
    const x = {kb: 3, kr: 1, ini: 600, ult: 620, fin: 632, oro: {blue: 1500, red: 400}, obj: null, p0: .5, p1: .6};
    const p5 = RiftEngine.armarPelea(antes, t5, x), p2 = RiftEngine.armarPelea(antes, t2, Object.assign({}, x, {kb: 3, kr: 0}));
    out.pelea = {cinco: p5 && {win: p5.win, kda: p5.blue[0].k + '/' + p5.blue[0].d + '/' + p5.blue[0].a, dsh: p5.blue[2].dsh}, dos: p2};
    Date.now = real; return out;
  });
  const E = R.estandar.tramos, piezas = t => t.map(x => x.pieza), GE = R.estandar.giros;
  const en = (pz, a, z) => E.some(x => x.pieza === pz && x.ini >= a && x.ini <= z);
  ok = chequear('estándar: el impacto del dragón aparece en el minuto previo', en('objetivo', 270, 330), E.filter(x => x.pieza === 'objetivo').map(x => x.ini).slice(0, 3).join(', ') + ' s') && ok;
  ok = chequear('estándar: el daño aparece tras la pelea (min 11:40)', en('pelea', 700, 740)) && ok;
  ok = chequear('estándar: la alerta aparece con el giro (min 15)', GE.some(t => t >= 900 && t <= 945), GE.join(', ') + ' s') && ok;
  ok = chequear('la alerta de giro sale aunque haya una pieza grande', R.giroConPieza.pieza === 'oro' && R.giroConPieza.giro) && ok;
  ok = chequear('estándar: «para remontar» aparece después del giro', en('remontada', 905, 1000)) && ok;
  ok = chequear('estándar: el resumen aparece al terminar', en('resumen', 1750, 1765)) && ok;
  let solapa = 0, sinRespiro = 0;
  for (const t of [R.minimo.tramos, E, R.show.tramos]) for (let i = 1; i < t.length; i++) { if (t[i].ini < t[i - 1].fin) solapa++; if (t[i].ini - t[i - 1].fin < 20) sinRespiro++; }
  ok = chequear('nunca dos piezas a la vez', solapa === 0, solapa + ' solapadas') && ok;
  ok = chequear('siempre un respiro de 20 s entre piezas (la transmisión respira)', sinRespiro === 0, sinRespiro + ' sin respiro') && ok;
  ok = chequear('mínimo: solo la pelea 5v5 que importa (y las alertas de giro)', R.minimo.tramos.length >= 1 && R.minimo.tramos.every(t => t.pieza === 'pelea') && R.minimo.giros.length > 0, piezas(R.minimo.tramos).join(', ')) && ok;
  ok = chequear('estándar: un objetivo que mueve poco (2 puntos) no aparece', !R.poco.tramos.some(t => t.pieza === 'objetivo'), piezas(R.poco.tramos).join(', ')) && ok;
  ok = chequear('estándar: sin la historia fija del minuto 20 (queda para «show»)', !E.some(t => t.pieza === 'historia')) && ok;
  ok = chequear('show: además el oro y los duelos', piezas(R.show.tramos).includes('oro') && piezas(R.show.tramos).includes('duelos'), R.show.tramos.length + ' piezas') && ok;
  ok = chequear('pelea en equipo 5v5: se arma con el K/D/A de la pelea y quién la ganó', R.pelea.cinco && R.pelea.cinco.win === 'blue' && R.pelea.cinco.kda === '1/0/1' && R.pelea.cinco.dsh === 5, JSON.stringify(R.pelea.cinco)) && ok;
  ok = chequear('una pelea chica (2v2) no cuenta como pelea en equipo', R.pelea.dos === null, JSON.stringify(R.pelea.dos)) && ok;
  ok = chequear('una pieza pedida a mano se queda y «saltar» la quita', R.mano.durante === 'oro' && !R.mano.despues, JSON.stringify(R.mano)) && ok;

  // ---- 2) la pieza view=auto en OBS, con el control en el mismo navegador ----
  const o = await ctx.newPage(); o.on('pageerror', e => errores.push(e.message));
  await o.goto(BASE + 'overlay.html?view=auto'); await o.waitForTimeout(4000);
  ok = chequear('view=auto: muestra la barra del partido', await o.evaluate(() => { const x = document.querySelector('.rp-low .rp-bar'); return !!x && x.offsetWidth > 300 && /T1/.test(x.textContent); })) && ok;
  const grandes = () => o.evaluate(() => document.querySelectorAll('.rp-stage > *').length);
  await o.keyboard.press('4'); await o.waitForTimeout(1300);
  ok = chequear('atajo 4: aparece «Duelos por línea»', await o.evaluate(() => { const s = document.querySelector('.rp-stage'); return s.classList.contains('on') && /Duelos por línea/.test(s.textContent); })) && ok;
  ok = chequear('una sola pieza grande en pantalla', (await grandes()) === 1) && ok;
  await o.keyboard.press('0'); await o.waitForTimeout(1300);
  ok = chequear('atajo 0: la pieza se va', !(await o.evaluate(() => document.querySelector('.rp-stage').classList.contains('on')))) && ok;
  const c = await ctx.newPage(); c.on('pageerror', e => errores.push(e.message));
  await c.goto(BASE + 'control.html'); await c.waitForTimeout(2500);
  await c.click('#dirPiezas [data-k="2"]'); await c.waitForTimeout(1800);
  ok = chequear('desde el control: «Daño de la pelea» sale en OBS', await o.evaluate(() => /Daño a campeones/.test(document.querySelector('.rp-stage').textContent))) && ok;
  const ahora = await c.textContent('#dirAhora'), filas = await c.$$eval('#dirLog li', l => l.length);
  ok = chequear('el control ve qué hay en pantalla y la línea de tiempo', /Daño de la pelea/.test(ahora) && filas >= 2, ahora + ' · ' + filas + ' en la línea de tiempo') && ok;
  await c.keyboard.press('h'); await c.waitForTimeout(1200);
  ok = chequear('H en el control oculta todo en OBS', await o.evaluate(() => document.querySelector('.rp-ovl').classList.contains('allhide'))) && ok;
  await c.keyboard.press('h'); await c.waitForTimeout(600);

  // ---- 3) temas ----
  const t = await ctx.newPage(); t.on('pageerror', e => errores.push(e.message));
  await t.goto(BASE + 'overlay.html?view=auto&tema=minimal'); await t.waitForTimeout(3000);
  ok = chequear('tema minimal: sin marca y sin sombras', await t.evaluate(() => !document.querySelector('.rp-brand') && getComputedStyle(document.querySelector('.rp-bar')).boxShadow === 'none')) && ok;
  // mínimo radical: la barra sola, translúcida, sin módulos extra ni alertas
  await t.goto(BASE + 'overlay.html?modo=minimo'); await t.waitForTimeout(3500);
  const mn = await t.evaluate(() => { const bar = document.querySelector('.rp-low .rp-bar'), bg = bar ? getComputedStyle(bar).backgroundColor : '';
    return {bar: !!bar && /T1/.test(bar.textContent), alfa: +((bg.match(/rgba?\(([^)]+)\)/) || ['', '0,0,0,1'])[1].split(',')[3] || 1), piezas: document.querySelectorAll('.rp-stage > *').length, marca: !!document.querySelector('.rp-brand')}; });
  ok = chequear('modo=minimo: solo la barra, translúcida y sin marca ni piezas', mn.bar && mn.alfa <= 0.5 && !mn.piezas && !mn.marca, JSON.stringify(mn)) && ok;
  // el generador de la URL de OBS en el control
  const gu = await c.evaluate(() => { const m = document.getElementById('gMod'); m.value = 'minimo'; m.dispatchEvent(new Event('change')); document.getElementById('gSafe').checked = true; document.getElementById('gSafe').dispatchEvent(new Event('change')); return document.getElementById('gUrl').value; });
  ok = chequear('control: el generador arma la URL de OBS (mínimo + margen seguro)', /overlay\.html\?modo=minimo&safe=1$/.test(gu), gu) && ok;
  await t.goto(BASE + 'overlay.html?view=auto&tema=canal&accent=ff8800'); await t.waitForTimeout(3000);
  const ta = await t.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--team-a').trim().toLowerCase());
  ok = chequear('tema canal: el color del canal en la barra', ta === '#ff8800', ta) && ok;
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
