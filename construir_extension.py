"""Arma la extensión de RiftPulse como un «cascarón» que se actualiza solo desde la web.

- El panel lateral carga la app desde GitHub Pages (app.html): al abrirlo siempre está al día.
- El overlay sobre el stream (motor + ext-overlay.js) se descarga de la web al recargar la extensión,
  al abrir el navegador y cada 6 horas, y se instala como «script de usuario». Si el navegador todavía
  no permite scripts de usuario, se usa la copia local de esta carpeta.
- La lectura del video (reloj, marcador y siglas) la hace lector.js, sin librerías externas.

También publica la app y el overlay en la carpeta del repo web (../riftpulse-overlay) si está al lado.
"""
import json
import os
import shutil

AQUI = os.path.dirname(os.path.abspath(__file__))
WEB = 'https://userf8a2c4.github.io/riftpulse-overlay/'
ext = os.path.join(AQUI, 'extension')
os.makedirs(ext, exist_ok=True)


def escribir(nombre, texto):
    open(os.path.join(ext, nombre), 'w', encoding='utf-8').write(texto)


# copia local del overlay (respaldo si no hay scripts de usuario) y recursos de marca
for f in ('engine.js', 'logo.svg', 'icon128.png'):
    shutil.copy(os.path.join(AQUI, f), os.path.join(ext, f))
# el overlay va junto con su lector en un solo archivo (así lo baja también la extensión ya instalada)
RPUI = os.path.join(os.path.dirname(AQUI), 'riftpulse-overlay', 'rp-ui.js')  # piezas comunes de interfaz (colores de equipo, números animados)
OVERLAY = (open(RPUI, encoding='utf-8').read() + '\n' if os.path.exists(RPUI) else '') + open(os.path.join(AQUI, 'lector.js'), encoding='utf-8').read() + '\n' + open(os.path.join(AQUI, 'overlay.js'), encoding='utf-8').read()
escribir('overlay.js', OVERLAY)
for viejo in ('rp-design.css', 'ocr.html', 'ocr.js'):  # de versiones anteriores, ya no se usan
    if os.path.exists(os.path.join(ext, viejo)):
        os.remove(os.path.join(ext, viejo))
shutil.rmtree(os.path.join(ext, 'ocr'), ignore_errors=True)

manifest = {
    "manifest_version": 3,
    "name": "RiftPulse",
    "version": "3.0",
    "description": "Panel lateral y overlay de RiftPulse para el Mundial. Se actualiza solo desde la web.",
    "permissions": ["sidePanel", "storage", "userScripts", "scripting", "alarms"],
    "host_permissions": [
        "https://esports-api.lolesports.com/*", "https://feed.lolesports.com/*",
        "https://ddragon.leagueoflegends.com/*", "https://static.lolesports.com/*",
        "https://userf8a2c4.github.io/*", "*://*.twitch.tv/*", "*://*.lolesports.com/*"
    ],
    "action": {"default_title": "Abrir RiftPulse"},
    "side_panel": {"default_path": "panel.html"},
    "background": {"service_worker": "background.js"},
    "icons": {"128": "icon128.png"}
}
escribir('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))

escribir('background.js', r"""// RiftPulse — proceso de fondo de la extensión.
const WEB = '__WEB__';
const SITIOS = ['*://*.twitch.tv/*', '*://*.lolesports.com/*'];

// Al hacer clic en el ícono de la extensión se abre o cierra el panel lateral.
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch(() => {});

// ---------- overlay sobre el stream: la última versión desde la web ----------
async function bajar(archivo) {
  const r = await fetch(WEB + archivo + '?v=' + Date.now(), {cache: 'no-store'});
  if (!r.ok) throw new Error(archivo + ': HTTP ' + r.status);
  return r.text();
}
function hayScriptsDeUsuario() {
  try { chrome.userScripts.getScripts(); return true; } catch (e) { return false; }  // desactivados: tira error
}
async function instalarOverlay() {
  let origen = 'local', detalle = '';
  try { await chrome.scripting.unregisterContentScripts({ids: ['riftpulse-local']}); } catch (e) {}
  if (hayScriptsDeUsuario()) {
    try {
      const [motor, overlay] = await Promise.all([bajar('engine.js'), bajar('ext-overlay.js')]);
      await chrome.userScripts.configureWorld({messaging: true});
      try { await chrome.userScripts.unregister(); } catch (e) {}
      await chrome.userScripts.register([{id: 'riftpulse', matches: SITIOS, js: [{code: motor}, {code: overlay}], runAt: 'document_idle', world: 'USER_SCRIPT'}]);
      origen = 'web';
    } catch (e) { detalle = String(e); }
  } else detalle = 'scripts de usuario desactivados';
  if (origen === 'local') {
    try { await chrome.userScripts.unregister(); } catch (e) {}
    await chrome.scripting.registerContentScripts([{id: 'riftpulse-local', matches: SITIOS, js: ['engine.js', 'overlay.js'], runAt: 'document_idle'}]).catch(() => {});
  }
  await chrome.storage.local.set({rp_origen: {origen, detalle, at: Date.now()}});
}
chrome.runtime.onInstalled.addListener(instalarOverlay);   // también al recargar la extensión
chrome.runtime.onStartup.addListener(instalarOverlay);
chrome.alarms.create('rp-actualizar', {periodInMinutes: 360});
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'rp-actualizar') instalarOverlay(); });

// ---------- mensajes del overlay (como content script o como script de usuario) ----------
function atender(msg, sender, send) {
  if (!msg) return;
  if (msg.type === 'rp-cmd-get') { chrome.storage.local.get(['rp_cmd'], o => send(o || {})); return true; }
  if (msg.type === 'rp-pantalla') { chrome.storage.local.set({rp_pantalla: msg.data || null}).then(() => send({ok: true})); return true; }
  if (msg.type === 'rp-reinstalar') { instalarOverlay().then(() => send({ok: true})); return true; }
}
chrome.runtime.onMessage.addListener(atender);
if (chrome.runtime.onUserScriptMessage) chrome.runtime.onUserScriptMessage.addListener(atender);
""".replace('__WEB__', WEB))

# ---------- panel lateral: cascarón que carga la app desde la web ----------
escribir('panel.html', """<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>RiftPulse</title>
<style>
  html,body{margin:0;height:100%;background:#050a17;color:#eef3fb;font:13px/1.5 system-ui,"Segoe UI",sans-serif}
  #app{position:absolute;inset:0;width:100%;height:100%;border:0}
  #carga{position:absolute;inset:0;display:grid;place-items:center;color:#8fa0c2;text-align:center;padding:20px}
</style></head>
<body>
<div id="carga">Cargando RiftPulse…</div>
<iframe id="app" title="RiftPulse" allow="clipboard-write"></iframe>
<script src="panel.js"></script>
</body></html>
""")
escribir('panel.js', r"""// Cascarón del panel: carga la app desde la web y le pasa el almacenamiento de la extensión.
// Todo lo visible (avisos incluidos) lo dibuja la app, así que se actualiza solo desde la web.
const WEB = '__WEB__', CASCARON = 3;
const app = document.getElementById('app'), carga = document.getElementById('carga');
app.src = WEB + 'app.html?ext=1&v=' + Date.now();
let lista = false;
const CLAVES = ['rp_origen', 'rp_pantalla', 'rp_cmd'];
function enviar(data) { try { app.contentWindow.postMessage({rp: 'store', shell: CASCARON, data}, '*'); } catch (e) {} }
window.addEventListener('message', e => {
  if (e.source !== app.contentWindow || !e.data || !e.data.rp) return;
  if (e.data.rp === 'ready') { lista = true; carga.style.display = 'none'; chrome.storage.local.get(CLAVES, enviar); }
  if (e.data.rp === 'set' && e.data.data) chrome.storage.local.set(e.data.data);
  if (e.data.rp === 'reinstalar') chrome.runtime.sendMessage({type: 'rp-reinstalar'}, () => chrome.storage.local.get(CLAVES, enviar));
});
chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== 'local') return;
  const d = {}; let hay = false;
  CLAVES.forEach(k => { if (ch[k]) { d[k] = ch[k].newValue; hay = true; } });
  if (hay) enviar(d);
});
app.addEventListener('load', () => setTimeout(() => { carga.style.display = 'none'; }, 400));
setTimeout(() => { if (!lista) carga.innerHTML = 'No pude cargar RiftPulse desde la web.<br>Revisá la conexión y volvé a abrir el panel.'; }, 15000);
""".replace('__WEB__', WEB))

# las instrucciones, para abrir con doble clic desde la carpeta descomprimida
if os.path.exists(os.path.join(ext, 'INSTALAR.txt')): os.remove(os.path.join(ext, 'INSTALAR.txt'))
escribir('INSTALAR.html', """<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instalar RiftPulse</title>
<style>body{margin:0;background:#0C0E12;color:#F2F4F7;font:16px/1.55 system-ui,Segoe UI,Roboto,sans-serif}.w{max-width:640px;margin:0 auto;padding:28px 18px}
h1{font-size:28px;margin:0 0 4px}p{color:#C9D0DB}.n{display:inline-flex;width:28px;height:28px;border-radius:50%;background:#22D3EE;color:#0C0E12;font-weight:800;align-items:center;justify-content:center;margin-right:10px;flex:none}
.p{display:flex;align-items:flex-start;background:#14171D;border:1px solid #2a2f3a;border-radius:12px;padding:14px;margin:10px 0}code{background:#1B1F27;border-radius:6px;padding:2px 6px;color:#A5F3FC}
a.b{display:inline-block;margin-top:14px;background:#22D3EE;color:#0C0E12;font-weight:800;text-decoration:none;border-radius:10px;padding:12px 18px}small{color:#9AA3B2}</style></head>
<body><div class="w"><h1>Instalar RiftPulse</h1><p>Tres pasos, una sola vez. En Chrome, Edge, Brave u Opera, en la compu.</p>
<div class="p"><span class="n">1</span><div>Escribí <code>chrome://extensions</code> en la barra de direcciones y Enter.<br><small>En Edge: <code>edge://extensions</code> · en Brave: <code>brave://extensions</code></small></div></div>
<div class="p"><span class="n">2</span><div>Activá el <b>Modo de desarrollador</b> (arriba a la derecha; en Edge, abajo a la izquierda).</div></div>
<div class="p"><span class="n">3</span><div><b>Cargar descomprimida</b> → elegí <b>esta carpeta</b> (RiftPulse). Listo: abrí un partido en twitch.tv o lolesports.com.</div></div>
<a class="b" href="__WEB__instalar.html#extension">Ver la guía con imágenes</a>
<p><small>No lee ni envía nada de ninguna cuenta. No está afiliada a Riot Games.</small></p></div></body></html>
""".replace('__WEB__', WEB))

# ---------- proceso de fondo de la versión de la tienda (sin código bajado de la web) ----------
TIENDA_BG = r"""// RiftPulse — proceso de fondo (versión de la Chrome Web Store: el overlay viene dentro del paquete).
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch(() => {});
const marcar = () => chrome.storage.local.set({rp_origen: {origen: 'tienda', detalle: '', at: Date.now()}});
chrome.runtime.onInstalled.addListener(marcar);
chrome.runtime.onStartup.addListener(marcar);
// mensajes del overlay: órdenes de Mando y lo que se ve en el video
chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (!msg) return;
  if (msg.type === 'rp-cmd-get') { chrome.storage.local.get(['rp_cmd'], o => send(o || {})); return true; }
  if (msg.type === 'rp-pantalla') { chrome.storage.local.set({rp_pantalla: msg.data || null}).then(() => send({ok: true})); return true; }
  if (msg.type === 'rp-reinstalar') { marcar().then(() => send({ok: true})); return true; }
});
"""

# ---------- publicar la app y el overlay en el repo web (GitHub Pages) ----------
web = os.path.join(os.path.dirname(AQUI), 'riftpulse-overlay')
if os.path.isdir(web):
    shutil.copy(os.path.join(AQUI, 'index.html'), os.path.join(web, 'app.html'))
    open(os.path.join(web, 'ext-overlay.js'), 'w', encoding='utf-8').write(OVERLAY)
    # la extensión en un ZIP, para instalarla sin git (enlace directo desde la web)
    # adentro, una sola carpeta «RiftPulse» (la que se elige en «Cargar descomprimida») con INSTALAR.html para abrir con doble clic
    import zipfile
    with zipfile.ZipFile(os.path.join(web, 'riftpulse-extension.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(ext)): z.write(os.path.join(ext, f), 'RiftPulse/' + f)
    # versión para la Chrome Web Store: la tienda no acepta código que se baje de la web, así que el overlay va
    # dentro del paquete (se actualiza con cada versión de la tienda). El panel sigue abriendo la app desde la web.
    import json, tempfile
    tmp = tempfile.mkdtemp(); tienda = os.path.join(tmp, 'extension')
    shutil.copytree(ext, tienda)
    man = json.load(open(os.path.join(ext, 'manifest.json'), encoding='utf-8'))
    man['version'] = '3.1.0'
    man['description'] = 'Probabilidad en vivo del Mundial de LoL sobre el video de Twitch y lolesports, sincronizada sola con el minuto que ves.'
    man['permissions'] = ['sidePanel', 'storage']
    man['host_permissions'] = [h for h in man['host_permissions'] if 'github.io' not in h]
    man['content_scripts'] = [{'matches': ['*://*.twitch.tv/*', '*://*.lolesports.com/*'], 'js': ['engine.js', 'overlay.js'], 'run_at': 'document_idle'}]
    json.dump(man, open(os.path.join(tienda, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(os.path.join(tienda, 'background.js'), 'w', encoding='utf-8').write(TIENDA_BG)
    os.remove(os.path.join(tienda, 'INSTALAR.html'))
    # la tienda exige manifest.json en la raíz del ZIP (sin carpeta)
    with zipfile.ZipFile(os.path.join(web, 'riftpulse-extension-tienda.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(tienda)): z.write(os.path.join(tienda, f), f)
    shutil.rmtree(tmp)
    print('Publicado en la carpeta web:', web)

print('Extensión lista en:', ext)
