// Capturas de la extensión para la página y la carta de Nick (docs/img/nick/, 1280×800): node pruebas/captura-extension.js
// 1: el overlay sobre el video de prueba generado (no es una transmisión real), con un panel de pelea en equipo de ejemplo.
// 2: el video con el panel lateral abierto. 3: la app en «Ahora». 4: el Mundial. 5: Mando con el guion y las predicciones del staff.
// Partidos y datos del simulador de las pruebas.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
process.env.RP_FUENTES = '1';
const {montar, RAIZ} = require('./mocks');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1480, height: 900}}); await montar(ctx, {video: 'desk.webm'});
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('error de página:', e.message));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.evaluate(() => { localStorage.setItem('rp_bienv', '1'); window.RP_DEBUG = true; const v = document.getElementById('v'); v.load(); v.play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  await p.waitForTimeout(12000);
  await p.evaluate(() => {
    document.getElementById('v').pause();
    const J = (name, k, d, a, dsh, tipo) => ({name, champ: name, champId: name, k, d, a, part: k + d + a > 0, dsh, tipo});
    window.__rpRender(s => Object.assign({}, s, {game: Object.assign({}, s.game, {fight: {gt: s.game.gt - 1, ini: s.game.gt - 24, kb: 3, kr: 1, win: 'blue', oro: {blue: 1650, red: 420}, obj: {side: 'blue', txt: 'Dragón Infernal'}, p0: s.game.pBlue - 0.09, p1: s.game.pBlue,
      blue: [J('Top', 1, 0, 1, 1.8, 'físico'), J('Jungla', 0, 0, 2, -0.6, 'físico'), J('Mid', 1, 0, 2, 3.9, 'mágico'), J('ADC', 1, 1, 0, 2.7, 'físico'), J('Soporte', 0, 0, 3, -1.1, 'mágico')],
      red: [J('Top', 0, 1, 0, -1.6, 'físico'), J('Jungla', 0, 1, 1, -0.4, 'mixto'), J('Mid', 1, 1, 0, 1.1, 'mágico'), J('ADC', 0, 0, 1, 0.5, 'físico'), J('Soporte', 0, 0, 0, 0, 'mágico')]}})}));
  });
  await p.waitForTimeout(1500);
  const OUT = path.join(RAIZ, 'docs', 'img', 'nick');
  await p.screenshot({path: path.join(OUT, '1-overlay.png'), clip: {x: 100, y: 20, width: 1280, height: 800}});
  await ctx.close();

  // 2) el video con el panel lateral (como en Chrome: el video a la izquierda y RiftPulse a la derecha)
  const c2 = await b.newContext({viewport: {width: 1280, height: 800}, colorScheme: 'dark'}); await montar(c2, {video: 'desk.webm'});
  const q = await c2.newPage(); q.on('pageerror', e => console.log('error de página:', e.message));
  await q.goto('https://www.twitch.tv/videos/1');
  await q.evaluate(() => {
    localStorage.setItem('rp_bienv', '1');
    document.body.style.background = '#0e0e10';
    const v = document.getElementById('v'); v.style.cssText = 'position:absolute;left:12px;top:150px;width:840px;height:472px'; v.load(); v.play();
    const f = document.createElement('iframe'); f.src = 'https://userf8a2c4.github.io/riftpulse-overlay/app.html'; f.id = 'panel';
    f.style.cssText = 'position:absolute;right:0;top:0;width:416px;height:800px;border:0;border-left:1px solid #2a2f3a;background:#0C0E12'; document.body.appendChild(f);
    const t = document.createElement('div'); t.textContent = 'IG vs LYON · Worlds 2026 · VOD (video de prueba)'; t.style.cssText = 'position:absolute;left:14px;top:630px;color:#c9d0db;font:600 15px system-ui'; document.body.appendChild(t);
  });
  for (const f of ['engine.js', 'ext-overlay.js']) await q.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  await q.waitForTimeout(12000);
  const fr = q.frames().find(f => /app\.html/.test(f.url()));
  if (fr) await fr.evaluate(() => { const i = document.getElementById('instBtn'); if (i) i.hidden = true; });
  await q.evaluate(() => document.getElementById('v').pause());
  await q.waitForTimeout(800);
  await q.screenshot({path: path.join(OUT, '2-panel.png')});
  await c2.close();

  // 3, 4 y 5) la app: «Ahora», el Mundial y Mando
  const c3 = await b.newContext({viewport: {width: 1280, height: 800}, colorScheme: 'dark'}); await montar(c3);
  const a = await c3.newPage(); a.on('pageerror', e => console.log('error de página:', e.message));
  await a.goto('https://userf8a2c4.github.io/riftpulse-overlay/app.html'); await a.waitForTimeout(6000);
  await a.evaluate(() => { const i = document.getElementById('instBtn'); if (i) i.hidden = true; });
  await a.screenshot({path: path.join(OUT, '3-ahora.png')});
  await a.evaluate(() => { setVista('copa'); window.scrollTo(0, 0); }); await a.waitForTimeout(2500);
  await a.screenshot({path: path.join(OUT, '4-mundial.png')});
  await a.evaluate(async () => {
    setVista('mando'); await new Promise(r => setTimeout(r, 2500));
    ['Nick', 'Co-caster', 'Invitado'].forEach(n => { document.getElementById('spName').value = n; spAdd(); });
    SP.title = 'Predicciones del stream'; spLoad(); await new Promise(r => setTimeout(r, 1500));
    const picks = {1: 'T1', 2: 'MKOI', 3: 'T1'}; for (const who in picks) { const bt = document.querySelector('[data-sp-who="' + who + '"][data-sp-t="' + picks[who] + '"]'); if (bt) bt.click(); }
    document.getElementById('mxObs').style.display = 'none'; document.getElementById('mxRead').scrollIntoView({block: 'start'}); window.scrollBy(0, -12);
  });
  await a.waitForTimeout(1200);
  await a.screenshot({path: path.join(OUT, '5-mando.png')});
  await b.close(); console.log('Capturas en docs/img/nick/');
})();
