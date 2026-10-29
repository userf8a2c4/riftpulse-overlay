// Al hacer clic en el ícono de la extensión se abre o cierra el panel lateral.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Sincronía automática: el overlay manda recortes del video y un documento oculto los lee (OCR empaquetado).
async function documentoOCR() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({url: 'ocr.html', reasons: ['WORKERS'], justification: 'Leer el reloj y el marcador del video para sincronizar el overlay'});
}
chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (!msg || msg.type !== 'rp-ocr') return;
  documentoOCR()
    .then(() => chrome.runtime.sendMessage({target: 'ocr', images: msg.images, wl: msg.wl, psm: msg.psm}))
    .then(r => send(r || {}), e => send({error: String(e)}));
  return true;
});
