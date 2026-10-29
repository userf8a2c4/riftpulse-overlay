// Para el espectador: «Tu pronóstico» contra RiftPulse, «Para entender», la app instalable en el celular
// y la bienvenida de la extensión.
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const {montar, chequear, BASE, RAIZ} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true; const errores = [];
  const ctx = await b.newContext({viewport: {width: 1440, height: 1000}, acceptDownloads: true}); await montar(ctx);
  await ctx.addInitScript(() => { window.__sw = []; try { const r = navigator.serviceWorker.register.bind(navigator.serviceWorker); navigator.serviceWorker.register = (u, o) => { window.__sw.push(String(u)); return r(u, o).catch(() => null); }; } catch (e) {} });
  const p = await ctx.newPage(); p.on('pageerror', e => { if (!/reading 'sf'/.test(e.message)) errores.push(e.message); });
  await p.goto(BASE + 'app.html'); await p.waitForTimeout(5000);
  // ---- tu pronóstico ----
  const antes = await p.evaluate(() => document.getElementById('ahPron').textContent);
  ok = chequear('tu pronóstico: aparece la serie por jugar (G2 vs HLE)', /G2/.test(antes) && /HLE/.test(antes)) && ok;
  ok = chequear('tu pronóstico: el de RiftPulse no se ve antes de elegir', /Elegí tu ganador/.test(antes) && !/RiftPulse: /.test(antes)) && ok;
  await p.click('#ahPron [data-act="pron"][data-arg="PX|G2"]'); await p.waitForTimeout(500);
  const elegido = await p.evaluate(() => ({txt: document.getElementById('ahPron').textContent, g: JSON.parse(localStorage.getItem('miPron') || '{}').PX}));
  ok = chequear('tu pronóstico: queda guardado tu ganador', elegido.g && elegido.g.yo === 'G2' && /Vos: G2/.test(elegido.txt), elegido.txt.slice(0, 120)) && ok;
  // series ya jugadas: IG le ganó a LYON (acertaste, RiftPulse no) y T1 a KOI (fallaste)
  await p.evaluate(() => { const P = JSON.parse(localStorage.getItem('miPron') || '{}'); P.MLI = {yo: 'IG', rp: 'LYON', rpP: 0.55}; P.TK = {yo: 'KOI', rp: 'T1', rpP: 0.6}; localStorage.setItem('miPron', JSON.stringify(P)); renderPron(); });
  await p.waitForTimeout(400);
  const rec = await p.evaluate(() => ({r: pronRecord(), txt: document.getElementById('ahPron').textContent}));
  ok = chequear('tu pronóstico: el récord contra RiftPulse', rec.r.n === 2 && rec.r.yo === 1 && rec.r.rp === 1 && rec.r.gane === 1 && rec.r.mejor === 1 && /1\s*vez le ganaste al modelo/.test(rec.txt), JSON.stringify(rec.r)) && ok;
  ok = chequear('tu pronóstico: marca si acertaste', /acertaste/.test(rec.txt)) && ok;
  const d = p.waitForEvent('download', {timeout: 8000}).catch(() => null); await p.click('#ahPron [data-act="sharemipron"]'); const dl = await d;
  ok = chequear('tu pronóstico: tarjeta «Mi Mundial contra RiftPulse»', !!dl && dl.suggestedFilename() === 'riftpulse-mi-mundial.png', dl ? dl.suggestedFilename() : 'sin descarga') && ok;
  // con sin spoilers, el récord no delata resultados
  await p.click('#spx summary'); await p.click('#spx [data-act="spApp"][data-arg="todo"]'); await p.waitForTimeout(500);
  ok = chequear('tu pronóstico: sin spoilers tapa el récord y los resultados', await p.evaluate(() => { const t = document.getElementById('ahPron').textContent; return !/le ganaste/.test(t) && !/acertaste/.test(t); })) && ok;
  await p.click('#spx summary'); await p.click('#spx [data-act="spApp"][data-arg=""]'); await p.waitForTimeout(400);
  // ---- para entender ----
  ok = chequear('para entender: apagado no subraya nada', await p.evaluate(() => !document.querySelector('.glo'))) && ok;
  await p.click('#novBtn'); await p.waitForTimeout(800);
  const glo = await p.evaluate(() => [...document.querySelectorAll('#vistaAhora .glo')].map(e => [e.textContent, e.title]));
  ok = chequear('para entender: los términos del juego tienen su explicación', glo.length >= 2 && glo.every(([t, d]) => t && d.length > 20), glo.map(x => x[0]).join(', ')) && ok;
  await p.click('#vistaAhora .glo'); await p.waitForTimeout(300);
  ok = chequear('para entender: tocar un término muestra la explicación', /📘/.test(await p.textContent('#status'))) && ok;
  ok = chequear('para entender: «qué mirar» dice por qué importa el objetivo', await p.evaluate(() => /Por qué importa/.test(document.getElementById('ahHist').textContent))) && ok;
  // ---- app instalable ----
  const man = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.webmanifest'), 'utf8'));
  ok = chequear('app instalable: manifiesto con nombre, inicio e íconos de 192 y 512', man.name && /app\.html/.test(man.start_url) && man.display === 'standalone' && man.icons.length === 2 && man.icons.every(i => fs.existsSync(path.join(RAIZ, i.src)))) && ok;
  ok = chequear('app instalable: la app enlaza el manifiesto y registra el service worker', await p.evaluate(() => !!document.querySelector('link[rel="manifest"]') && window.__sw.includes('sw.js'))) && ok;
  ok = chequear('app instalable: el service worker pide primero a la red', /fetch\(e\.request\)\.then/.test(fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8'))) && ok;
  await ctx.close();
  // en el celular: «Ahora» compacto y sin desborde
  const c2 = await b.newContext({viewport: {width: 390, height: 844}}); await montar(c2);
  const q = await c2.newPage(); await q.goto(BASE + 'app.html'); await q.waitForTimeout(4500);
  ok = chequear('celular: «Ahora» compacto (sin las condiciones de victoria) y sin desborde', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll('#iniVivo .wincond')].every(e => !e.offsetHeight))) && ok;
  await c2.close();
  // ---- bienvenida de la extensión ----
  const c3 = await b.newContext({viewport: {width: 1500, height: 900}}); await montar(c3, {video: 'correr.webm'});
  const e = await c3.newPage(); e.on('pageerror', x => errores.push(x.message)); await e.goto('https://www.twitch.tv/videos/1');
  await e.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'engine.js'), 'utf8')}); await e.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'ext-overlay.js'), 'utf8')});
  await e.waitForTimeout(2500);
  const hay = await e.evaluate(() => { const h = document.getElementById('rp-overlay-host'); return !!(h && h.shadowRoot.querySelector('.bv')); });
  ok = chequear('extensión: la primera vez pregunta «¿Qué querés ver?»', hay) && ok;
  await e.evaluate(() => document.getElementById('rp-overlay-host').shadowRoot.querySelector('.bv [data-bv="estandar"]').click()); await e.waitForTimeout(400);
  const tras = await e.evaluate(() => ({ext: localStorage.getItem('rp_ext7'), dir: localStorage.getItem('rp_dir'), bv: !!document.getElementById('rp-overlay-host').shadowRoot.querySelector('.bv')}));
  ok = chequear('extensión: «La barra y la historia» deja el director estándar y se cierra', tras.ext === '["obj"]' && tras.dir === 'estandar' && !tras.bv, JSON.stringify(tras)) && ok;
  await e.reload(); await e.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'engine.js'), 'utf8')}); await e.addScriptTag({content: fs.readFileSync(path.join(RAIZ, 'ext-overlay.js'), 'utf8')}); await e.waitForTimeout(1500);
  ok = chequear('extensión: no vuelve a preguntar', await e.evaluate(() => !document.getElementById('rp-overlay-host').shadowRoot.querySelector('.bv'))) && ok;
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  await b.close(); return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
