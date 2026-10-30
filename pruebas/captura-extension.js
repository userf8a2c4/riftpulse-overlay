// Captura de la extensión para la Chrome Web Store y el pitch (docs/chrome-web-store/1-overlay.png, 1280×800):
// el overlay real sobre el video de prueba generado (no es una transmisión real), con un panel de pelea en equipo de ejemplo.
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
  await p.screenshot({path: path.join(RAIZ, 'docs', 'chrome-web-store', '1-overlay.png'), clip: {x: 100, y: 20, width: 1280, height: 800}});
  await b.close(); console.log('Captura en docs/chrome-web-store/1-overlay.png');
})();
