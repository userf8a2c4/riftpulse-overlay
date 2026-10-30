// RiftPulse — proceso de fondo de la extensión.
const WEB = 'https://userf8a2c4.github.io/riftpulse-overlay/';
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
chrome.alarms.get('rp-actualizar', a => { if (!a) chrome.alarms.create('rp-actualizar', {periodInMinutes: 360}); });  // sin reiniciar el ciclo cada vez que despierta
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
