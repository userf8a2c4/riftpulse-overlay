// Cascarón del panel: carga la app desde la web y le pasa el almacenamiento de la extensión.
// Todo lo visible (avisos incluidos) lo dibuja la app, así que se actualiza solo desde la web.
const WEB = 'https://userf8a2c4.github.io/riftpulse-overlay/', CASCARON = 3;
const app = document.getElementById('app'), carga = document.getElementById('carga');
app.src = WEB + 'app.html?ext=1&v=' + Date.now();
let lista = false;
const CLAVES = ['rp_origen', 'rp_pantalla', 'rp_cmd'];
function enviar(data) { try { app.contentWindow.postMessage({rp: 'store', shell: CASCARON, data}, '*'); } catch (e) {} }
window.addEventListener('message', e => {
  if (e.source !== app.contentWindow || !e.data || !e.data.rp) return;
  if (e.data.rp === 'ready') { lista = true; carga.style.display = 'none'; app.style.visibility = ''; chrome.storage.local.get(CLAVES, enviar); }
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
// sin conexión el iframe igual «carga» (la página de error del navegador): si la app no avisó que está lista, el mensaje se ve encima
setTimeout(() => { if (!lista) { carga.innerHTML = 'No pude cargar RiftPulse desde la web.<br>Revisá la conexión y volvé a abrir el panel.'; carga.style.display = ''; carga.style.background = '#050a17'; app.style.visibility = 'hidden'; } }, 15000);
