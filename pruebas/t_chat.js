// «El chat contra el modelo» en OBS (?canal=): se conecta al chat (simulado), cuenta los votos (1/2 o las siglas), muestra la
// predicción del modelo y, al resolverse, quién acertó y el ranking del chat. Una pieza sin canal no se conecta a nada.
const {chromium} = require('playwright');
const {montar, chequear, BASE} = require('./mocks');
module.exports = async function () {
  const b = await chromium.launch(); let ok = true; const errores = [];
  const ctx = await b.newContext({viewport: {width: 1920, height: 1080}}); await montar(ctx);
  await ctx.addInitScript(() => {
    window.__ws = []; window.__chatIn = null;
    window.WebSocket = function (url) { const w = this; w.url = url; w.enviados = []; window.__ws.push(w); w.send = x => w.enviados.push(x);
      setTimeout(() => { w.onopen && w.onopen(); window.__chatIn = (u, t) => w.onmessage && w.onmessage({data: ':' + u + '!' + u + '@' + u + '.tmi.twitch.tv PRIVMSG #prueba :' + t + '\r\n'}); }, 50); };
  });
  const p = await ctx.newPage(); p.on('pageerror', e => errores.push(e.message));
  await p.goto(BASE + 'overlay.html?view=auto&canal=prueba'); await p.waitForTimeout(4000);
  const con = await p.evaluate(() => ({url: window.__ws[0] && window.__ws[0].url, env: window.__ws[0] ? window.__ws[0].enviados : []}));
  ok = chequear('se conecta al chat del canal, en modo anónimo (solo lectura)', /irc-ws\.chat\.twitch\.tv/.test(con.url) && con.env.some(x => /^NICK justinfan\d+$/.test(x)) && con.env.includes('JOIN #prueba'), con.env.join(' · ')) && ok;
  const r = await p.evaluate(async () => {
    RPVOTO.reiniciar(); const gt = RiftEngine.state.game.gt;
    RPVOTO.abrir({clave: 'prueba1', tipo: 'objetivo', obj: 'Barón', a: 'T1', b: 'MKOI', seg: 30, modelo: {side: 'blue', p: 0.6}, gt0: gt});
    ['u1:1', 'u2:2', 'u3:1', 'u4:t1', 'u5:hola', 'u1:1'].forEach(x => { const [u, t] = x.split(':'); window.__chatIn(u, t); });
    await new Promise(r => setTimeout(r, 600));
    const card = document.querySelector('.rp-vt'), durante = {txt: card.innerText.replace(/\s+/g, ' '), on: card.classList.contains('on'), est: RPVOTO.estado()};
    RPVOTO.cerrar('red'); await new Promise(r => setTimeout(r, 300));
    return {durante, despues: card.innerText.replace(/\s+/g, ' '), db: RPVOTO.db()};
  });
  const v = Object.values(r.durante.est.v);
  ok = chequear('cuenta los votos: 1/2 o las siglas, uno por persona, ignora el resto', v.length === 4 && v.filter(x => x === 'blue').length === 3, JSON.stringify(r.durante.est.v)) && ok;
  ok = chequear('muestra la pregunta, los votos y la predicción del modelo', r.durante.on && /Barón/i.test(r.durante.txt) && /4 votos/.test(r.durante.txt) && /modelo dice: T1/i.test(r.durante.txt), r.durante.txt.slice(0, 140)) && ok;
  ok = chequear('al resolverse: quién se lo llevó, si acertaron el chat y el modelo, y el ranking', /MKOI se lleva el Barón/i.test(r.despues) && /✗/.test(r.despues) && /u2 1/.test(r.despues), r.despues.slice(0, 160)) && ok;
  ok = chequear('lleva la cuenta: chat contra modelo y puntos por persona', r.db.modelo.n === 1 && r.db.modelo.ok === 0 && r.db.chat.n === 1 && r.db.pts.u2 === 1 && !r.db.pts.u1, JSON.stringify({chat: r.db.chat, modelo: r.db.modelo, pts: r.db.pts})) && ok;
  // sin ?canal no se conecta a nada
  const p2 = await ctx.newPage(); await p2.goto(BASE + 'overlay.html?view=auto'); await p2.waitForTimeout(2500);
  ok = chequear('sin ?canal= no se conecta al chat', await p2.evaluate(() => !window.__ws.length && !window.RPVOTO)) && ok;
  // la Extensión de Twitch (superposición de video): sin configuración arranca en el mínimo, con la barra del partido
  const fs = require('fs'), path = require('path'), R0 = path.join(__dirname, '..');
  await ctx.route(/\/tw\//, r => { const f = r.request().url().split('/tw/')[1].split('?')[0], src = ['viewer.html', 'config.html', 'inicio.js', 'config.js'].includes(f) ? path.join(R0, 'fuente', 'twitch', f) : path.join(R0, f);
    r.fulfill({contentType: /html$/.test(f) ? 'text/html' : /css$/.test(f) ? 'text/css' : 'application/javascript', body: fs.readFileSync(src, 'utf8')}); });
  await ctx.route(/extension-files\.twitch\.tv/, r => r.fulfill({contentType: 'application/javascript', body: ''}));
  const tw = await ctx.newPage(); tw.on('pageerror', e => errores.push('twitch: ' + e.message));
  await tw.goto(BASE + 'tw/viewer.html'); await tw.waitForTimeout(5000);
  const tv = await tw.evaluate(() => ({params: window.RP_PARAMS, bar: !!document.querySelector('.rp-low .rp-bar') && /T1/.test(document.querySelector('.rp-low .rp-bar').textContent)}));
  ok = chequear('Extensión de Twitch: arranca sola en el modo mínimo con la barra del partido', tv.params === '?modo=minimo&listo=0' && tv.bar, JSON.stringify(tv)) && ok;
  ok = chequear('sin errores de JavaScript', !errores.length, errores.slice(0, 3).join(' | ')) && ok;
  await b.close(); return ok;
};
