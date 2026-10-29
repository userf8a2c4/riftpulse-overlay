// Imágenes del README, la wiki y el pitch (docs/img/): node pruebas/imagenes.js
// Usan un partido de ejemplo con datos simulados (GEN vs T1, juego 3); el texto de cada imagen lo aclara.
// Las piezas son las reales (overlay.html, analista.html, control.html, index.html): solo el estado del juego es inventado.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
process.env.RP_FUENTES = '1';
const {montar, BASE, RAIZ} = require('./mocks');
const OUT = path.join(RAIZ, 'docs', 'img'), TMP = path.join(__dirname, '.gen', 'img'); fs.mkdirSync(TMP, {recursive: true});
const AHORA = Date.now();

// ---------- el partido de ejemplo ----------
function escena(o) {
  o = o || {};
  const gt = o.gt || 1325, sm = [];
  for (let t = 0; t <= gt; t += 10) {
    let p = 0.55 - 0.13 * Math.min(1, t / 540) + (t > 830 ? 0.09 * Math.min(1, (t - 830) / 40) : 0) + (t > 1260 ? 0.22 * Math.min(1, (t - 1260) / 40) : 0) + Math.sin(t / 37) * 0.008;
    let diff = -1800 * Math.min(1, t / 720) + (t > 830 ? 2400 * Math.min(1, (t - 830) / 300) : 0) + (t > 1260 ? 1600 * Math.min(1, (t - 1260) / 60) : 0);
    if (o.p != null && t === gt) p = o.p;
    sm.push({gt: t, p, diff: Math.round(diff), kb: Math.round(t / 120), kr: Math.round(t / 190), tb: Math.floor(t / 300), tr: Math.floor(t / 420), db: t > 1035 ? 1 : 0, dr: t > 660 ? 2 : t > 360 ? 1 : 0, bb: t > 1280 ? 1 : 0, br: 0, ib: 0, ir: 0});
  }
  const p = sm[sm.length - 1].p;
  const pl = (champ, share, k, d, a, gold, lvl) => ({name: champ, champ, share, k, d, a, gold, cs: Math.round(gold / 38), lvl});
  const lanes = [['top', 'Top', pl('Rumble', .24, 2, 1, 4, 8900, 14), pl('Gnar', .19, 1, 2, 3, 8100, 13)], ['jungle', 'Jungla', pl('Vi', .14, 3, 2, 7, 7600, 12), pl('Xin Zhao', .16, 2, 3, 4, 7300, 12)],
    ['mid', 'Mid', pl('Azir', .31, 4, 1, 6, 9800, 15), pl('Orianna', .27, 2, 2, 3, 8900, 14)], ['bottom', 'ADC', pl('Kalista', .26, 2, 1, 5, 9400, 13), pl('Ezreal', .3, 2, 2, 2, 9300, 13)],
    ['support', 'Soporte', pl('Rell', .05, 0, 2, 9, 5200, 11), pl('Alistar', .08, 0, 3, 5, 5000, 10)]].map(([role, label, b, r]) => ({role, label, blue: b, red: r, gd: b.gold - r.gold, csd: b.cs - r.cs}));
  const ended = !!o.fin;
  return {
    ok: true, demo: null, follow: null, at: AHORA, delay: 42, precision: {acc15: 0.745, acc10: 0.684, acc20: 0.786}, feed: {estado: 'ok', txt: 'Datos al día'},
    match: {id: 'EJ', league: 'Worlds', gameNo: 3, strategy: {count: 5}, blue: {code: 'GEN', img: '', wins: 1}, red: {code: 'T1', img: '', wins: 1}},
    blueCode: 'GEN', redCode: 'T1',
    game: {id: 'ej3', gt, state: ended ? 'finished' : 'in_game', ended, waiting: false, pBlue: p, acc: 0.8,
      reasons: [{z: 0.62, txt: '1 Barón más'}, {z: 0.41, txt: '2,4k de oro de ventaja'}, {z: -0.22, txt: '1 dragón más'}, {z: 0.12, txt: 'Lado del mapa'}],
      events: [{gt: 1285, side: 'blue', txt: 'Barón Nashor', kind: 'baron'}],
      allEvents: [{gt: 190, side: 'red', txt: 'Primera sangre', kind: 'fb'}, {gt: 360, side: 'red', txt: 'Dragón Infernal', kind: 'dragon'}, {gt: 660, side: 'red', txt: 'Dragón de Montaña', kind: 'dragon'},
        {gt: 840, side: 'blue', txt: 'Pelea: GEN 4 – 1 T1', kind: 'fight'}, {gt: 1035, side: 'blue', txt: 'Dragón del Océano', kind: 'dragon'}, {gt: 1260, side: 'blue', txt: 'Barón Nashor', kind: 'baron'}],
      timers: {dragon: {at: 1395, elder: false}, baron: {at: 1620}, baronBuff: {side: 'blue', until: 1440, start: 1260}, elderBuff: null, inhibs: []},
      stats: {blue: {gold: 41300, kills: 11, towers: 5, inhibs: 0, barons: 1, dragons: 1, elders: 0}, red: {gold: 38900, kills: 7, towers: 3, inhibs: 0, barons: 0, dragons: 2, elders: 0}},
      samples: sm, impact: {obj: 'Dragón', at: 1395, blue: 4, red: 9},
      fight: {gt: 840, win: 'blue'}, swings: [{a: 830, b: 870, d: 0.09, side: 'blue', code: 'GEN', cause: 'Pelea: GEN 4 – 1 T1'}, {a: 1260, b: 1300, d: 0.22, side: 'blue', code: 'GEN', cause: 'Barón Nashor'}],
      comeback: ended ? null : {side: 'red', code: 'T1', p: 1 - p, reached: true, paths: [{txt: 'el próximo Barón', p: 0.47}, {txt: 'una pelea ganada (+3 kills)', p: 0.36}]},
      draft: null, lanes, keyPlayer: {name: 'Azir', champ: 'Azir', code: 'GEN', role: 'Mid', side: 'blue', gd: 900, vs: 'Orianna', share: 0.31, kp: 0.9, k: 4, d: 1, a: 6},
      jugadores: {blue: {lvl: 13, n6: 5, n11: 5, n16: 0, wp: 58, wd: 21, items: 9}, red: {lvl: 12.4, n6: 5, n11: 4, n16: 0, wp: 49, wd: 15, items: 7}, wards: true, items: true,
        picos: [{gt: 1180, side: 'blue', name: 'Azir', champ: 'Azir', item: 'Sombrero mortal de Rabadon', n: 3}]},
      recap: ended ? {win: 'blue', code: 'GEN', lose: 'T1', dur: gt, pre: 0.55, low: {p: 0.41, gt: 600}, comeback: false, swing: {a: 1260, b: 1300, d: 0.22, side: 'blue', code: 'GEN', cause: 'Barón Nashor'},
        key: {name: 'Azir', champ: 'Azir', code: 'GEN', k: 6, d: 1, a: 9, share: 0.32}, stats: {blue: {kills: 17, towers: 10, dragons: 2, barons: 2}, red: {kills: 8, towers: 3, dragons: 2, barons: 0}}, score: [2, 1]} : null},
    series: {bo: 5, score: [1, 1], pNow: 0.64, ifBlue: 0.78, ifRed: 0.41, metodo: 'Elo + el juego en vivo'}, h2h: null, maps: null, next: null};
}
// el motor de la página muestra el partido de ejemplo en lugar del feed (y deja correr el reloj para el director)
const STUB = `(function(){ var R = window.RiftEngine, fn = [], S = window.__S, real = Date.now, off = 0;
  Date.now = function(){ return real() + off; };
  R.onUpdate = function(f){ fn.push(f); f(S); return function(){}; }; R.auto = function(){}; R.start = function(){};
  try { Object.defineProperty(R, 'state', {get: function(){ return S; }}); } catch (e) {}
  window.__emit = function(s, avanza){ if (s) S = window.__S = s; off += (avanza || 0); fn.forEach(function(f){ f(S); }); };
  setInterval(function(){ window.__emit(); }, 1000); })();`;

// calendario de ejemplo para el cuadro y las predicciones del stream
const tm = (code, w, won) => ({id: 't' + code, code, name: code, image: '', result: {gameWins: w, outcome: won == null ? null : won ? 'win' : 'loss'}});
const ko = (id, b, st, d, a, c, wa, wb) => ({type: 'match', startTime: new Date(AHORA + d * 86400e3).toISOString(), blockName: b, state: st, league: {name: 'Worlds', slug: 'worlds'},
  match: {id, strategy: {count: 5}, teams: [tm(a, wa, st === 'completed' ? wa > wb : null), tm(c, wb, st === 'completed' ? wb > wa : null)], games: []}});
const KO = [ko('q1', 'Cuartos de final', 'completed', -2, 'GEN', 'FNC', 3, 0), ko('q2', 'Cuartos de final', 'completed', -2, 'HLE', 'BLG', 2, 3), ko('q3', 'Cuartos de final', 'completed', -1, 'T1', 'AL', 3, 1), ko('q4', 'Cuartos de final', 'completed', -1, 'G2', 'IG', 1, 3),
  ko('s1', 'Semifinales', 'inProgress', 0, 'GEN', 'BLG', 1, 1), ko('s2', 'Semifinales', 'unstarted', 1, 'T1', 'IG', 0, 0), ko('f1', 'Final', 'unstarted', 8, null, null, 0, 0)];
KO[6].match.teams = [{code: null}, {code: null}];

async function contexto(b, w, h, extra) {
  const ctx = await b.newContext(Object.assign({viewport: {width: w, height: h}, colorScheme: 'dark', deviceScaleFactor: 1}, extra || {})); await montar(ctx);
  await ctx.route(/getSchedule/, r => r.fulfill({contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify({data: {schedule: {pages: {}, events: KO}}})}));
  return ctx;
}
async function conEscena(ctx, url, s, fondo) {
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('  error:', e.message));
  await p.addInitScript(([s, stub]) => { window.__S = s; document.addEventListener('DOMContentLoaded', () => {}, {once: true}); window.__STUB = stub; }, [s, STUB]);
  await p.route(new RegExp(url.split('?')[0].replace('.', '\\.') + '(\\?|$)'), async r => {
    const html = fs.readFileSync(path.join(RAIZ, url.split('?')[0]), 'utf8').replace('<script src="engine.js"></script>', '<script src="engine.js"></script><script>' + STUB + '</script>')
      .replace('</head>', fondo ? '<style>html,body{background:' + fondo + ' !important}</style></head>' : '</head>');
    r.fulfill({contentType: 'text/html', body: html});
  });
  await p.goto(BASE + url); await p.waitForTimeout(2500);
  return p;
}
// la caja de la pieza grande en pantalla (se redibuja cada segundo: se recorta la pantalla, no el elemento)
const recorte = p => p.evaluate(() => { const e = document.querySelector('.rp-stage > *'); if (!e) return null; const r = e.getBoundingClientRect(); return {x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), width: r.width + 24, height: r.height + 24}; });
// fondo ilustrativo (no es imagen de ninguna transmisión): el verde y el azul de la Grieta, desenfocados
const GRIETA = 'radial-gradient(900px 600px at 28% 38%,#2c4a2a,#17261b 55%,#0d140f), #0d140f';

(async () => {
  const b = await chromium.launch();
  // 1) el overlay sobre la transmisión: la barra, la alerta de giro y el impacto del próximo objetivo (director automático)
  let ctx = await contexto(b, 1600, 900);
  let p = await conEscena(ctx, 'overlay.html?view=auto', escena({gt: 1250, p: 0.52}), GRIETA);
  await p.evaluate(() => window.__emit(null, 0)); await p.waitForTimeout(300);
  await p.evaluate(s => window.__emit(s, 40000), escena()); await p.waitForTimeout(900);
  await p.keyboard.press('1'); await p.waitForTimeout(1200);
  await p.screenshot({path: path.join(TMP, 'transmision.png')});
  // las piezas grandes, una por una
  const piezas = [];
  for (const [k, n] of [['5', 'serie'], ['8', 'remontada'], ['4', 'duelos'], ['9', 'historia']]) {
    await p.keyboard.press(k); await p.waitForTimeout(1100);
    const bx = await recorte(p); if (bx) { const f = path.join(TMP, 'pieza-' + n + '.png'); await p.screenshot({path: f, clip: bx}); piezas.push(f); }
  }
  await p.close();
  p = await conEscena(ctx, 'overlay.html?view=auto', escena({gt: 1980, fin: true}), GRIETA);
  await p.keyboard.press('6'); await p.waitForTimeout(1200);
  { const bx = await recorte(p); if (bx) { const f = path.join(TMP, 'pieza-resumen.png'); await p.screenshot({path: f, clip: bx}); piezas.push(f); } }
  await p.close();
  // cuadro y predicciones
  p = await conEscena(ctx, 'overlay.html?view=cuadro', escena(), GRIETA); await p.waitForTimeout(2500);
  { const el = await p.$('.rp-card'); if (el) await el.screenshot({path: path.join(OUT, 'cuadro.png')}); }
  await p.close();
  await ctx.close();
  ctx = await contexto(b, 1920, 1080);
  await ctx.addInitScript(() => { try { localStorage.setItem('rp_pred', JSON.stringify({title: 'Predicciones del stream', day: 'b:Semifinales', hidden: false,
    members: [{id: 1, name: 'Ana', photo: ''}, {id: 2, name: 'Leo', photo: ''}, {id: 3, name: 'Mica', photo: ''}, {id: 4, name: 'Tomi', photo: ''}],
    picks: {s1: {1: 'GEN', 2: 'BLG', 3: 'GEN', 4: 'GEN'}, s2: {1: 'T1', 2: 'T1', 3: 'IG', 4: 'T1'}, q1: {1: 'GEN', 2: 'GEN', 3: 'FNC', 4: 'GEN'}, q2: {1: 'HLE', 2: 'BLG', 3: 'BLG', 4: 'HLE'}}})); } catch (e) {} });
  p = await conEscena(ctx, 'overlay.html?view=predicciones', escena(), '#0d140f'); await p.waitForTimeout(3000);
  { const el = await p.$('.rp-card'); if (el) await el.screenshot({path: path.join(OUT, 'predicciones.png')}); }
  await p.close(); await ctx.close();
  // 2) la mesa de análisis
  ctx = await contexto(b, 1440, 1000);
  p = await conEscena(ctx, 'analista.html', escena()); await p.waitForTimeout(1500);
  await p.screenshot({path: path.join(OUT, 'mesa-de-analisis.png')});
  await p.close(); await ctx.close();
  // 3) el control con el director (con la pieza automática abierta en el mismo navegador)
  ctx = await contexto(b, 400, 1040);
  const o = await conEscena(ctx, 'overlay.html?view=auto', escena({gt: 1250, p: 0.52}), '#000');
  await o.evaluate(s => window.__emit(s, 40000), escena()); await o.waitForTimeout(1500);
  const c = await ctx.newPage(); await c.goto(BASE + 'control.html'); await c.waitForTimeout(2500);
  await c.keyboard.press('1'); await c.waitForTimeout(9000); await c.keyboard.press('4'); await c.waitForTimeout(2500);
  await c.screenshot({path: path.join(OUT, 'control.png')});
  await ctx.close();
  // 4) la página para streamers
  ctx = await contexto(b, 1280, 900);
  p = await ctx.newPage(); await p.goto(BASE + 'index.html'); await p.waitForTimeout(3500);
  await p.screenshot({path: path.join(OUT, 'pagina.png')}); await ctx.close();
  // 5) composiciones: la transmisión (jpg), las piezas para casters y el banner
  const img = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  ctx = await b.newContext({viewport: {width: 1600, height: 900}, colorScheme: 'dark'}); await montar(ctx);
  p = await ctx.newPage();
  const base = `<link rel="stylesheet" href="${BASE}rp-tokens.css"><style>*{box-sizing:border-box}html,body{margin:0;background:#0C0E12;color:#F2F4F7;font-family:'Inter Tight',sans-serif}</style>`;
  const nota = t => `<div style="position:absolute;right:18px;bottom:12px;font:500 14px 'Inter Tight';color:rgba(242,244,247,.55)">${t}</div>`;
  await p.goto(BASE + 'index.html');
  await p.setContent(`${base}<div style="position:relative;width:1600px;height:900px"><img src="${img(path.join(TMP, 'transmision.png'))}" style="display:block">${nota('Imagen ilustrativa · partido de ejemplo con datos simulados')}</div>`);
  await p.waitForTimeout(1200); await p.screenshot({path: path.join(OUT, 'overlay-en-transmision.jpg'), type: 'jpeg', quality: 88});
  await p.setViewportSize({width: 1300, height: 900});
  await p.setContent(`${base}<div id="g" style="display:grid;grid-template-columns:auto auto;gap:22px;padding:26px;width:max-content;background:${GRIETA}">${piezas.map(f => `<img src="${img(f)}" style="display:block;max-width:600px">`).join('')}<div style="grid-column:1/-1;font:500 14px 'Inter Tight';color:rgba(242,244,247,.6)">serie · para remontar · duelos · la historia del juego · resumen — partido de ejemplo con datos simulados</div></div>`);
  await p.waitForTimeout(800); await (await p.$('#g')).screenshot({path: path.join(OUT, 'piezas-casters.png')});
  await p.setViewportSize({width: 1600, height: 520});
  const logo = fs.readFileSync(path.join(RAIZ, 'logo.svg'), 'utf8');
  await p.setContent(`${base}<div style="position:relative;width:1600px;height:520px;overflow:hidden;background:radial-gradient(700px 400px at 0% 0%,rgba(34,211,238,.10),transparent 60%),#0C0E12">
    <div style="position:absolute;left:84px;top:104px;width:620px">
      <div style="display:flex;align-items:center;gap:22px"><div style="width:84px;height:84px">${logo.replace('<svg', '<svg width="84" height="84"')}</div><div style="font:800 104px 'Saira Condensed';letter-spacing:2px;line-height:.9">RIFTPULSE</div></div>
      <div style="margin-top:30px;font:500 30px/1.4 'Inter Tight';color:#C7CDD8"><b style="color:#fff">Tu segunda pantalla del Mundial.</b> Quién va ganando, en vivo y en los colores de cada equipo, sincronizado con lo que ves.</div>
      <div style="display:flex;gap:10px;margin-top:30px">${['Acierta 3 de cada 4', 'Director automático', 'Sin apuestas'].map((t, i) => `<span style="white-space:nowrap;font:700 17px 'Saira Condensed';letter-spacing:1.6px;text-transform:uppercase;padding:9px 14px;border-radius:999px;border:1px solid ${i ? 'rgba(220,226,236,.18)' : '#22D3EE'};color:${i ? '#C7CDD8' : '#22D3EE'}">${t}</span>`).join('')}</div></div>
    <div style="position:absolute;right:56px;top:46px;width:780px;height:439px;border-radius:14px;overflow:hidden;border:1px solid rgba(220,226,236,.14);box-shadow:0 30px 80px rgba(0,0,0,.6)"><img src="${img(path.join(TMP, 'transmision.png'))}" style="width:100%;height:100%;object-fit:cover;display:block">
      <div style="position:absolute;right:12px;bottom:8px;font:500 13px 'Inter Tight';color:rgba(242,244,247,.6)">Imagen ilustrativa · datos simulados</div></div></div>`);
  await p.waitForTimeout(1500); await p.screenshot({path: path.join(OUT, 'banner.jpg'), type: 'jpeg', quality: 90});
  await b.close(); console.log('Imágenes en docs/img/');
})();
