// La extensión real, instalada desde el ZIP publicado (como la instala un usuario), en sus dos modos:
// con «Permitir scripts de usuario» (el overlay llega de la web) y sin él (copia local).
const {chromium} = require('playwright'), fs = require('fs'), path = require('path'), os = require('os');
const {execFileSync} = require('child_process');
const {montar, chequear, RAIZ, GEN} = require('./mocks');
function descomprimir(zip) {
  const dest = path.join(GEN, zip || 'zip'); fs.rmSync(dest, {recursive: true, force: true}); fs.mkdirSync(dest, {recursive: true});
  execFileSync('python3', ['-I', '-c', 'import sys,zipfile;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', path.join(RAIZ, (zip ? 'riftpulse-extension-tienda' : 'riftpulse-extension') + '.zip'), dest]);
  return dest;  // los dos ZIP traen los archivos sueltos en la raíz
}
async function una(EXT, conScripts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-'));
  const ctx = await chromium.launchPersistentContext(dir, {headless: true, channel: 'chromium', args: ['--disable-extensions-except=' + EXT, '--load-extension=' + EXT, '--enable-experimental-extension-apis'], viewport: {width: 1500, height: 900}});
  await montar(ctx, {video: 'correr.webm'});
  let sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker'); const id = sw.url().split('/')[2];
  if (conScripts) {
    const ex = await ctx.newPage(); await ex.goto('chrome://extensions'); await ex.waitForTimeout(800);
    await ex.evaluate(async id => { await chrome.developerPrivate.updateProfileConfiguration({inDeveloperMode: true}); await chrome.developerPrivate.updateExtensionConfiguration({extensionId: id, userScriptsAccess: true}); }, id);
    await ex.close(); sw = ctx.serviceWorkers()[0] || sw; await sw.evaluate(() => instalarOverlay());
  }
  await new Promise(r => setTimeout(r, 1500));
  const origen = await sw.evaluate(() => new Promise(r => chrome.storage.local.get('rp_origen', o => r(o.rp_origen && o.rp_origen.origen))));
  const p = await ctx.newPage(); await p.goto('https://www.twitch.tv/videos/1');
  await p.evaluate(() => document.getElementById('v').play());
  let estado = '';
  for (let i = 0; i < 12; i++) { await p.waitForTimeout(1500); estado = await p.evaluate(() => { const h = document.getElementById('rp-overlay-host'); return h ? h.shadowRoot.getElementById('ast').textContent : 'sin overlay'; }); if (/sincronizado ·/.test(estado) && i > 3) break; }
  const pn = await ctx.newPage(); await pn.setViewportSize({width: 420, height: 900}); await pn.goto('chrome-extension://' + id + '/panel.html'); await pn.waitForTimeout(4000);
  const fr = pn.frames().find(f => f.url().includes('app.html')); let panel = {};
  if (fr) { await fr.evaluate(() => setVista('mando')); await pn.waitForTimeout(3500);
    panel = await fr.evaluate(() => ({aire: document.getElementById('mxAir').innerText.replace(/\s+/g, ' '), guion: document.getElementById('mxTalk').innerText.replace(/\s+/g, ' '),
      alturas: ['mxAir', 'mxOv', 'mxTalk', 'mxRead', 'mxSoc'].map(i => document.getElementById(i).getBoundingClientRect().height)}));
    // mientras se lee el guion, el refresco de Mando no lo devuelve arriba
    panel.scroll0 = await fr.evaluate(() => { const x = document.querySelector('#mxRead .mx-scroll'); if (!x || x.scrollHeight <= x.clientHeight + 20) return null; x.scrollTop = 30; return x.scrollTop; });
    await pn.waitForTimeout(6500); panel.scroll1 = await fr.evaluate(() => { const x = document.querySelector('#mxRead .mx-scroll'); return x ? x.scrollTop : null; }); }
  // el mismo porcentaje en el overlay y en el panel (los dos con la misma fuerza de los equipos)
  let pcts = null;
  if (fr) { await p.waitForTimeout(3000);
    const ov = await p.evaluate(() => { const sh = document.getElementById('rp-overlay-host').shadowRoot, a = sh.querySelector('[data-rpn="ext-a"]'); return a ? +a.textContent : null; });
    const ap = await fr.evaluate(() => { try { return G && G.wp ? Math.round(G.wp.p * 100) : null; } catch (e) { return null; } });
    if (process.env.RP_DEBUG) console.log(await fr.evaluate(() => JSON.stringify({app: {p: G.wp && G.wp.p, gt: G.gt, pre: G.pre, dr: G.draft && G.draft.blue.scale - G.draft.red.scale, id: G.id, pin: !!PIN}, eng: MX.s && MX.s.game && {p: MX.s.game.pBlue, gt: MX.s.game.gt, id: MX.s.game.id}})));
    pcts = {ov, ap}; }
  await ctx.close(); return {origen, estado, panel, fr: !!fr, pcts};
}
module.exports = async function () {
  const EXT = descomprimir(); let ok = true;
  for (const conScripts of [true, false]) {
    const r = await una(EXT, conScripts), modo = conScripts ? '[con scripts de usuario] ' : '[sin scripts de usuario] ';
    ok = chequear(modo + 'el overlay sale de ' + (conScripts ? 'la web' : 'la copia local'), r.origen === (conScripts ? 'web' : 'local'), r.origen) && ok;
    ok = chequear(modo + 'sincroniza IG vs LYON juego 2', /IG vs LYON · J2/.test(r.estado), r.estado) && ok;
    ok = chequear(modo + 'el panel carga la app desde la web', r.fr) && ok;
    ok = chequear(modo + 'el panel sigue el mismo juego del video', /SINCRONIZADO CON TU VIDEO/.test(r.panel.aire || '') && /IG/.test(r.panel.aire || '') && /juego 2/.test(r.panel.aire || ''), (r.panel.aire || '').slice(0, 90)) && ok;
    ok = chequear(modo + 'el guion habla del mismo partido', /IG|LYON/.test(r.panel.guion || '') && !/MKOI/.test(r.panel.guion || ''), (r.panel.guion || '').slice(0, 70)) && ok;
    ok = chequear(modo + 'el overlay y el panel muestran el mismo porcentaje', r.pcts && r.pcts.ov != null && r.pcts.ap != null && Math.abs(r.pcts.ov - r.pcts.ap) <= 1, JSON.stringify(r.pcts)) && ok;
    if (r.panel.scroll0 != null) ok = chequear(modo + 'Mando no devuelve arriba lo que se está leyendo', r.panel.scroll1 === r.panel.scroll0, r.panel.scroll0 + ' → ' + r.panel.scroll1) && ok;
    ok = chequear(modo + 'las casillas de Mando tienen altura fija', r.panel.alturas && r.panel.alturas.join() === '300,430,430,340,340', (r.panel.alturas || []).join(' ')) && ok;
  }
  // la versión de la Chrome Web Store: el overlay va dentro del paquete y no pide scripts de usuario
  const TI = descomprimir('zip-tienda'), man = JSON.parse(fs.readFileSync(path.join(TI, 'manifest.json'), 'utf8'));
  ok = chequear('[tienda] no pide scripts de usuario ni baja código de la web', !man.permissions.includes('userScripts') && !/fetch\(/.test(fs.readFileSync(path.join(TI, 'background.js'), 'utf8'))) && ok;
  const t = await una(TI, false);
  ok = chequear('[tienda] el overlay viene dentro del paquete', t.origen === 'tienda', t.origen) && ok;
  ok = chequear('[tienda] sincroniza IG vs LYON juego 2', /IG vs LYON · J2/.test(t.estado), t.estado) && ok;
  ok = chequear('[tienda] el panel sigue el mismo juego del video', /SINCRONIZADO CON TU VIDEO/.test(t.panel.aire || '') && /juego 2/.test(t.panel.aire || ''), (t.panel.aire || '').slice(0, 90)) && ok;
  return ok;
};
if (require.main === module) module.exports().then(ok => process.exit(ok ? 0 : 1));
