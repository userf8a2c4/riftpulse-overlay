// GIF del README (docs/img/demo.gif): node pruebas/gif.js
// La extensión real sobre el video de prueba generado, con una secuencia de ejemplo: la probabilidad se mueve, llega una pelea
// en equipo y el juego da vuelta. Los números son de ejemplo; las piezas son las reales.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {execFileSync} = require('child_process');
process.env.RP_FUENTES = '1';
const {montar, RAIZ} = require('./mocks');
const TMP = path.join(__dirname, '.gen', 'gif'); fs.rmSync(TMP, {recursive: true, force: true}); fs.mkdirSync(TMP, {recursive: true});
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1480, height: 900}}); await montar(ctx, {video: 'correr.webm'});
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('error de página:', e.message));
  await p.goto('https://www.twitch.tv/videos/1');
  await p.evaluate(() => { localStorage.setItem('rp_bienv', '1'); window.RP_DEBUG = true; const v = document.getElementById('v'); v.load(); v.play(); });
  for (const f of ['engine.js', 'ext-overlay.js']) await p.addScriptTag({content: fs.readFileSync(path.join(RAIZ, f), 'utf8')});
  await p.waitForTimeout(12000);
  await p.evaluate(() => { window.__rpAS.on = false; document.getElementById('v').pause(); });  // desde acá manda la secuencia
  const J = (name, k, d, a, dsh, tipo) => ({name, champ: name, champId: name, k, d, a, part: k + d + a > 0, dsh, tipo});
  const pelea = {kb: 1, kr: 4, win: 'red', oro: {blue: 380, red: 1720}, obj: {side: 'red', txt: 'Barón Nashor'}, p0: 0.58, p1: 0.31,
    blue: [J('Top', 0, 1, 0, -1.4, 'físico'), J('Jungla', 0, 1, 1, -0.5, 'físico'), J('Mid', 1, 1, 0, 1.2, 'mágico'), J('ADC', 0, 1, 0, -2.1, 'físico'), J('Soporte', 0, 0, 1, 0.3, 'mágico')],
    red: [J('Top', 1, 0, 1, 1.9, 'físico'), J('Jungla', 0, 0, 3, 0.8, 'mixto'), J('Mid', 2, 0, 1, 4.1, 'mágico'), J('ADC', 1, 1, 1, 2.6, 'físico'), J('Soporte', 0, 0, 3, -0.7, 'mágico')]};
  const N = 72;
  for (let i = 0; i < N; i++) {
    const pb = i < 18 ? 0.55 + i * 0.002 : i < 30 ? 0.586 - (i - 18) * 0.023 : i < 60 ? 0.31 - (i - 30) * 0.001 : 0.28;
    const fight = i >= 31 && i < 64 ? Object.assign({gt: 1100, ini: 1076}, pelea) : null;
    await p.evaluate(({pb, fight}) => window.__rpRender(s => Object.assign({}, s, {game: Object.assign({}, s.game, {pBlue: pb, fight, ended: false})})), {pb, fight});
    await p.waitForTimeout(120);
    await p.screenshot({path: path.join(TMP, String(i).padStart(3, '0') + '.png'), clip: {x: 100, y: 60, width: 1280, height: 720}});
  }
  await b.close();
  // a GIF con paleta propia (más liviano y sin bandas)
  const out = path.join(RAIZ, 'docs', 'img', 'demo.gif');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '6', '-i', path.join(TMP, '%03d.png'), '-vf', 'scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=sierra2_4a', '-loop', '0', out]);
  console.log('GIF en docs/img/demo.gif', (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
})();
