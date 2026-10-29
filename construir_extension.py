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
OVERLAY = open(os.path.join(AQUI, 'lector.js'), encoding='utf-8').read() + '\n' + open(os.path.join(AQUI, 'overlay.js'), encoding='utf-8').read()
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

escribir('INSTALAR.txt', """RIFTPULSE — EXTENSION (se actualiza sola)
=========================================

INSTALAR (una sola vez)
-----------------------
1. Abra chrome://extensions (o brave://extensions / edge://extensions).
2. Active el "Modo de desarrollador" (arriba a la derecha).
3. Si ya tenia RiftPulse, toque "Quitar" en la vieja.
4. "Cargar descomprimida" -> elija ESTA carpeta (extension).
5. En RiftPulse -> "Detalles", active "Permitir scripts de usuario"
   (Allow user scripts). Asi el overlay del stream se actualiza solo.
6. Fije el icono en la barra (pieza de rompecabezas -> alfiler).

ACTUALIZAR
----------
Nada que descargar: toque el boton de recargar de RiftPulse en
chrome://extensions. El panel siempre abre la ultima version desde la web,
y el overlay del stream se descarga de nuevo al recargar (y solo cada 6 horas).

USAR
----
- Clic en el icono de RiftPulse: se abre el panel lateral con todo el sistema.
- En twitch.tv o lolesports.com aparece el overlay sobre el video. Pase el
  mouse por la barra para ver los controles (auto-sync, piezas, sincronia).

La extension no lee ni envia nada de ninguna cuenta. No esta afiliada a Riot Games.
""")

# ---------- publicar la app y el overlay en el repo web (GitHub Pages) ----------
web = os.path.join(os.path.dirname(AQUI), 'riftpulse-overlay')
if os.path.isdir(web):
    shutil.copy(os.path.join(AQUI, 'index.html'), os.path.join(web, 'app.html'))
    open(os.path.join(web, 'ext-overlay.js'), 'w', encoding='utf-8').write(OVERLAY)
    # la extensión en un ZIP, para instalarla sin git (enlace directo desde la web)
    shutil.make_archive(os.path.join(web, 'riftpulse-extension'), 'zip', AQUI, 'extension')
    print('Publicado en la carpeta web:', web)

print('Extensión lista en:', ext)
