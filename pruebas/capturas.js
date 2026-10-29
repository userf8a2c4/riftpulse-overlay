// Capturas de todas las vistas (para revisar el diseño y para la documentación): node pruebas/capturas.js [filtro]
// Se guardan en pruebas/.gen/capturas/. Usa el mismo simulador del feed que las pruebas.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, BASE, GEN, RAIZ} = require('./mocks');
process.env.RP_FUENTES = '1';
const OUT = path.join(GEN, 'capturas'); fs.mkdirSync(OUT, {recursive: true});
const filtro = process.argv[2] || '';
const VISTAS = [
  ['app-ahora', 'app.html', 1440, 1000, p => p.evaluate(() => setVista('ahora'))],
  ['app-ahora-celular', 'app.html', 390, 1500, p => p.evaluate(() => setVista('ahora'))],
  ['app-detalles', 'app.html', 1440, 1000, p => p.evaluate(() => setVista('partido'))],
  ['app-mundial', 'app.html', 1440, 1000, p => p.evaluate(() => setVista('copa'))],
  ['app-mando-panel', 'app.html', 420, 900, p => p.evaluate(() => setVista('mando'))],
  ['mesa', 'analista.html', 1440, 1000, null],
  ['control', 'control.html', 380, 900, null],
  ['landing', 'index.html', 1280, 900, null],
  ['como-funciona', 'como-funciona.html', 1280, 900, null],
  ['obs-barra', 'overlay.html?view=bar', 1920, 1080, null, {x: 0, y: 760, width: 1920, height: 320}],
  ['obs-serie', 'overlay.html?view=serie', 1920, 1080, null, {x: 300, y: 0, width: 1320, height: 360}],
  ['obs-grande', 'overlay.html?view=big', 1920, 1080, null, {x: 0, y: 0, width: 900, height: 600}],
  ['obs-claves', 'overlay.html?view=keys', 1920, 1080, null, {x: 0, y: 0, width: 900, height: 600}],
];
(async () => {
  const b = await chromium.launch();
  for (const [n, url, w, h, prep, clip] of VISTAS) {
    if (filtro && !n.includes(filtro)) continue;
    const ctx = await b.newContext({viewport: {width: w, height: h}, colorScheme: process.env.ESQUEMA || 'dark'}); await montar(ctx);
    const p = await ctx.newPage(); p.on('pageerror', e => { if (!/reading 'sf'/.test(e.message)) console.log('  error en', n + ':', e.message); });
    await p.goto(BASE + url); await p.waitForTimeout(3500);
    if (prep) { await prep(p); await p.waitForTimeout(2000); }
    await p.screenshot({path: path.join(OUT, n + '.png'), clip: clip || undefined});
    console.log('  ✓', n); await ctx.close();
  }
  // la barra de la extensión sobre el video (IG vs LYON)
  if (!filtro || 'extension'.includes(filtro)) {
    const ctx = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(ctx, {video: 'correr.webm'});
    const p = await ctx.newPage(); await p.goto('https://www.twitch.tv/videos/1');
    await p.evaluate(() => { const v = document.getElementById('v'); return new Promise(r => { v.addEventListener('loadeddata', r, {once: true}); v.load(); }); });
    await p.evaluate(() => document.getElementById('v').play());
    await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'engine.js'), 'utf8')});
    await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'ext-overlay.js'), 'utf8')});
    await p.waitForTimeout(9000); await p.screenshot({path: path.join(OUT, 'extension.png')}); console.log('  ✓ extension'); await ctx.close();
  }
  await b.close();
})();
