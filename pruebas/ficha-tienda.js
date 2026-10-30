// Ficha de la Chrome Web Store, en español y en inglés (docs/chrome-web-store/es y /en): node pruebas/ficha-tienda.js
// Cinco capturas de 1280×800 con un titular y la interfaz real de RiftPulse en primer plano, y los promocionales de 440×280
// y 1400×560. Las piezas salen del overlay y de la app funcionando con el simulador de las pruebas, sobre videos generados
// (no se usa ninguna imagen de una transmisión real).
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
process.env.RP_FUENTES = '1';
const {montar, RAIZ, BASE} = require('./mocks');
const OUT = path.join(RAIZ, 'docs', 'chrome-web-store');
const B64 = b => 'data:image/png;base64,' + b.toString('base64');

const TXT = {
  es: {
    s1: ['Quién va ganando, en vivo', 'La probabilidad de cada equipo sobre el video de Twitch, en sus colores y en el minuto que ves.'],
    s2: ['Se sincroniza solo', 'Lee el reloj y el marcador del video: en vivo, en un VOD o en cualquier co-stream. Pausás, adelantás o cambiás de partido y se acomoda.'],
    s3: ['Cada pelea, explicada', 'Quién la ganó, qué hizo cada jugador y cuánto movió el juego. Aparece sola y se va sola.'],
    s4: ['¿Pausa? Ponete al día', 'Mientras dura el «GAME PAUSE», el resumen de lo que va del juego, justo debajo del cartel.'],
    s5: ['Todo el Mundial, al costado', 'Tu pronóstico contra el modelo, la historia del juego, la fase suiza y el Pick\'Em, en el panel lateral.'],
    lee: 'lee el reloj y el marcador', marca: 'Gratis · sin cuentas · sin apuestas', chico: ['Quién va ganando,', 'en vivo'],
    grande: ['Tu segunda pantalla', 'del Mundial de LoL'], grandeSub: 'Quién va ganando, en vivo, sobre el video de Twitch. Sincronizado solo con el minuto que ves.'
  },
  en: {
    s1: ['Who\'s winning, live', 'Each team\'s win chance on top of the Twitch video, in their colors and at the minute you\'re watching.'],
    s2: ['Syncs on its own', 'It reads the clock and scoreboard from the video: live, in a VOD or any co-stream. Pause, skip or switch matches and it keeps up.'],
    s3: ['Every fight, explained', 'Who won it, what each player did and how much it moved the game. It shows up and leaves on its own.'],
    s4: ['Game paused? Catch up', 'While the «GAME PAUSE» lasts, a recap of the game so far, right below the banner.'],
    s5: ['All of Worlds, on the side', 'Your picks vs the model, the story of the game, the Swiss Stage and Pick\'Em, in the side panel.'],
    lee: 'reads the clock and scoreboard', marca: 'Free · no accounts · no betting', chico: ['Who\'s winning,', 'live'],
    grande: ['Your second screen', 'for LoL Worlds'], grandeSub: 'Who\'s winning, live, on top of the Twitch video. Synced on its own to the minute you\'re watching.'
  }
};

// el overlay sobre un video generado; devuelve la página ya sincronizada
async function overlay(b, lang, video, url) {
  const ctx = await b.newContext({viewport: {width: 1500, height: 900}, deviceScaleFactor: 2}); await montar(ctx, {video});
  await ctx.addInitScript(l => { try { localStorage.setItem('rp_lang', l); localStorage.setItem('rp_bienv', '1'); } catch (e) {} }, lang);
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('  error de página:', e.message));
  await p.goto(url || 'https://www.twitch.tv/videos/1');
  await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
  await p.evaluate(() => { window.RP_DEBUG = true; document.getElementById('v').play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(1000); if (await p.evaluate(() => !!(window.__rpAS && window.__rpAS.id && RiftEngine.state.game && RiftEngine.state.game.pBlue != null))) break; }
  await p.waitForTimeout(2500);
  return {ctx, p};
}
// solo la interfaz (sin el video): fondo transparente
async function pieza(p, sel) {
  await p.evaluate(() => { document.body.style.background = 'transparent'; document.getElementById('v').style.opacity = '0'; });
  await p.waitForTimeout(300);
  return p.locator(sel).screenshot({omitBackground: true});
}

async function piezas(b, lang) {
  const P = {};
  // 1) la barra y el gráfico de oro, a mitad de juego
  let o = await overlay(b, lang, 'correr.webm');
  await o.p.evaluate(() => document.getElementById('v').pause());
  await o.p.evaluate(() => { document.getElementById('rp-overlay-host').style.visibility = 'hidden'; document.getElementById('rp-overlay-paneles').style.visibility = 'hidden'; });
  P.hud = await o.p.screenshot({clip: {x: 100 + 1280 * 0.27, y: 60, width: 1280 * 0.46, height: 720 * 0.15}});  // el marcador del video generado (sin RiftPulse encima)
  await o.p.evaluate(() => { document.getElementById('rp-overlay-host').style.visibility = ''; document.getElementById('rp-overlay-paneles').style.visibility = ''; });
  P.barra = await pieza(o.p, '#rp-overlay-host');
  await o.p.evaluate(() => window.__rpRender(s => s));
  // el aviso «Sincronizado»
  await o.p.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot, t = sh.getElementById('toast'); t.innerHTML = '<i></i>' + (window.RPI18N && RPI18N.lang() === 'en' ? 'Synced' : 'Sincronizado') + ' · <span class="ca">IG</span> vs <span class="cb">LYON</span> · ' + (window.RPI18N && RPI18N.lang() === 'en' ? 'game' : 'juego') + ' 2 · 17:02'; t.classList.add('show'); });
  await o.p.waitForTimeout(500);
  P.barraSync = await o.p.locator('#rp-overlay-host').screenshot({omitBackground: true});
  // la pelea en equipo (con los datos de una pelea de ejemplo)
  await o.p.evaluate(() => {
    const sh = document.getElementById('rp-overlay-host').shadowRoot; sh.getElementById('toast').classList.remove('show');
    const J = (name, k, d, a, dsh, tipo) => ({name, champ: name, champId: name, k, d, a, part: k + d + a > 0, dsh, tipo});
    window.__rpRender(s => Object.assign({}, s, {game: Object.assign({}, s.game, {fight: {gt: s.game.gt - 1, ini: s.game.gt - 24, kb: 3, kr: 1, win: 'blue', oro: {blue: 1650, red: 420}, obj: {side: 'blue', txt: 'Barón'}, pAntes: 0.46, pDespues: 0.62,
      blue: [J('Top', 1, 0, 1, 1.8, 'físico'), J('Jungla', 0, 0, 2, -0.6, 'físico'), J('Mid', 1, 0, 2, 3.9, 'mágico'), J('ADC', 1, 1, 0, 2.7, 'físico'), J('Soporte', 0, 0, 3, -1.1, 'mágico')],
      red: [J('Top', 0, 1, 0, -1.6, 'físico'), J('Jungla', 0, 1, 1, -0.4, 'mixto'), J('Mid', 1, 1, 0, 1.1, 'mágico'), J('ADC', 0, 0, 1, 0.5, 'físico'), J('Soporte', 0, 0, 0, 0, 'mágico')]}})}));
  });
  await o.p.waitForTimeout(1200);
  P.pelea = await o.p.locator('#rp-overlay-paneles').screenshot({omitBackground: true});
  await o.ctx.close();
  // 2) la pausa: el reloj se queda quieto y aparece el resumen
  o = await overlay(b, lang, 'pausa.webm');
  for (let i = 0; i < 40; i++) { await o.p.waitForTimeout(1000); if (await o.p.evaluate(() => !!(window.__rpAS && window.__rpAS.pausa))) break; }
  await o.p.waitForTimeout(1500);
  await o.p.evaluate(() => document.getElementById('v').pause());
  P.pausa = await pieza(o.p, '#rp-overlay-paneles');
  await o.ctx.close();
  // 3) la app del panel lateral
  const c = await b.newContext({viewport: {width: 420, height: 900}, deviceScaleFactor: 2, colorScheme: 'dark'}); await montar(c);
  await c.addInitScript(l => { try { localStorage.setItem('rp_lang', l); } catch (e) {} }, lang);
  const a = await c.newPage(); await a.goto(BASE + 'app.html'); await a.waitForTimeout(6000);
  P.app = await a.screenshot();
  await a.evaluate(() => setVista('copa')); await a.waitForTimeout(3000);
  P.copa = await a.screenshot();
  await c.close();
  return P;
}

// las composiciones: titular a la izquierda, la interfaz a la derecha, sobre un fondo propio
const CSS = `*{box-sizing:border-box;margin:0}body{width:1280px;height:800px;overflow:hidden;font-family:'Inter Tight',system-ui,sans-serif;color:#F2F4F7;
  background:radial-gradient(900px 600px at 0% 0%,rgba(61,139,255,.22),transparent 60%),radial-gradient(900px 600px at 100% 100%,rgba(255,70,85,.20),transparent 60%),#0C0E12}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(220,226,236,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(220,226,236,.035) 1px,transparent 1px);background-size:40px 40px}
  .txt{position:absolute;left:64px;top:0;bottom:0;width:430px;display:flex;flex-direction:column;justify-content:center;gap:18px}
  .logo{display:flex;align-items:center;gap:12px;font:800 18px 'Saira Condensed';letter-spacing:4px}.logo img{width:40px;height:40px}
  h1{font:800 54px/1.02 'Saira Condensed',sans-serif;letter-spacing:.5px}h1 b{color:#22D3EE}
  p{font-size:20px;line-height:1.45;color:#C7CDD8}.tag{font:600 14px 'Inter Tight';letter-spacing:1.5px;text-transform:uppercase;color:#22D3EE}
  .vis{position:absolute;right:48px;top:0;bottom:0;width:700px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:22px}
  .vis img{max-width:100%;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
  .tel{border-radius:22px;border:1px solid rgba(220,226,236,.14);overflow:hidden;height:680px;box-shadow:0 30px 70px rgba(0,0,0,.6)}.tel img{height:680px;filter:none;display:block}
  .dos{display:flex;gap:22px;align-items:flex-start}.dos .tel{height:640px}.dos .tel img{height:640px}
  .flecha{font:600 15px 'Inter Tight';color:#9AA3B2;letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:10px}.flecha:before,.flecha:after{content:"";height:1px;width:60px;background:rgba(220,226,236,.25)}
  .hud{border-radius:10px;border:1px solid rgba(220,226,236,.12)}`;
const LOGO = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(RAIZ, 'logo.svg')).toString('base64');
const marco = (t, vis) => `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800&family=Inter+Tight:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${CSS}</style>
  <div class="grid"></div><div class="txt"><div class="logo"><img src="${LOGO}">RIFTPULSE</div><h1>${t[0]}</h1><p>${t[1]}</p></div><div class="vis">${vis}</div>`;

async function componer(b, lang, P) {
  const T = TXT[lang], dir = path.join(OUT, lang); fs.mkdirSync(dir, {recursive: true});
  const pg = await (await b.newContext({viewport: {width: 1280, height: 800}})).newPage();
  const foto = async (html, f, w, h) => { if (w) await pg.setViewportSize({width: w, height: h}); await pg.setContent(html, {waitUntil: 'networkidle'}); await pg.waitForTimeout(400); await pg.screenshot({path: path.join(dir, f)}); };
  const img = (b64, st) => `<img src="${B64(b64)}" style="${st || ''}">`;
  await foto(marco(T.s1, img(P.barra, 'width:700px')), '1-en-vivo.png');
  await foto(marco(T.s2, img(P.hud, 'width:560px') + `<div class="flecha">${T.lee}</div>` + img(P.barraSync, 'width:700px')), '2-sincronia.png');
  await foto(marco(T.s3, img(P.pelea, 'width:600px')), '3-pelea.png');
  await foto(marco(T.s4, img(P.pausa, 'width:440px')), '4-pausa.png');
  await foto(marco(T.s5, `<div class="dos"><div class="tel">${img(P.app)}</div><div class="tel">${img(P.copa)}</div></div>`), '5-panel.png');
  // promocionales
  await foto(`<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@700;800&family=Inter+Tight:wght@500;600&display=swap" rel="stylesheet"><style>${CSS}
    body{width:440px;height:280px}.c{position:absolute;inset:0;padding:26px 28px;display:flex;flex-direction:column;gap:10px}h1{font-size:40px}.c img.b{position:absolute;left:24px;right:24px;bottom:22px;width:392px}</style>
    <div class="grid"></div><div class="c"><div class="logo"><img src="${LOGO}">RIFTPULSE</div><h1>${T.chico[0]}<br><b>${T.chico[1]}</b></h1><img class="b" src="${B64(P.barra)}"></div>`, 'promo-440x280.png', 440, 280);
  await foto(`<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@700;800&family=Inter+Tight:wght@500;600&display=swap" rel="stylesheet"><style>${CSS}
    body{width:1400px;height:560px}.txt{width:560px;left:80px}h1{font-size:68px}.vis{right:70px;width:680px}</style>
    <div class="grid"></div><div class="txt"><div class="logo"><img src="${LOGO}">RIFTPULSE</div><h1>${T.grande[0]}<br><b>${T.grande[1]}</b></h1><p>${T.grandeSub}</p><div class="tag">${T.marca}</div></div>
    <div class="vis">${img(P.barra, 'width:680px')}${img(P.pelea, 'width:470px')}</div>`, 'promo-1400x560.png', 1400, 560);
  await pg.context().close();
}

(async () => {
  const b = await chromium.launch();
  for (const lang of ['es', 'en']) { console.log('Ficha ' + lang + '…'); const P = await piezas(b, lang); await componer(b, lang, P); }
  await b.close(); console.log('Listo en', OUT);
})();
