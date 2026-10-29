// Cascarón del panel: carga la app desde la web y le presta el almacenamiento de la extensión.
const WEB = 'https://userf8a2c4.github.io/riftpulse-overlay/';
const app = document.getElementById('app'), carga = document.getElementById('carga');
app.src = WEB + 'app.html?ext=1&v=' + Date.now();
let lista = false;
window.addEventListener('message', e => {
  if (e.source !== app.contentWindow || !e.data || !e.data.rp) return;
  if (e.data.rp === 'ready') { lista = true; carga.style.display = 'none'; }
  if (e.data.rp === 'set' && e.data.data) chrome.storage.local.set(e.data.data);
});
app.addEventListener('load', () => setTimeout(() => { carga.style.display = 'none'; }, 400));
setTimeout(() => { if (!lista) carga.innerHTML = 'No pude cargar RiftPulse desde la web.<br>Revisá la conexión y volvé a abrir el panel.'; }, 15000);
// aviso si el overlay del stream no se está actualizando desde la web
chrome.storage.local.get('rp_origen', o => {
  const r = o && o.rp_origen;
  if (r && r.origen === 'local') {
    document.body.classList.add('aviso');
    document.getElementById('aviso').innerHTML = 'Para que el <b>overlay del stream</b> se actualice solo: en <b>chrome://extensions</b> → RiftPulse → <b>Detalles</b>, activá <b>«Permitir scripts de usuario»</b> y recargá la extensión.';
  }
});
