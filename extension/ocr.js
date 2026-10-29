// Lee los recortes del video que manda el overlay (reloj, equipos, oro, kills).
let lector = null;
function obtener() {
  if (!lector) lector = Tesseract.createWorker('eng', 1, {
    workerPath: chrome.runtime.getURL('ocr/worker.min.js'), corePath: chrome.runtime.getURL('ocr/'),
    langPath: chrome.runtime.getURL('ocr'), gzip: true, cacheMethod: 'none', workerBlobURL: false
  });
  return lector;
}
chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (!msg || msg.target !== 'ocr') return;
  (async () => {
    const w = await obtener(), out = {};
    for (const k of Object.keys(msg.images)) {
      await w.setParameters({tessedit_char_whitelist: msg.wl[k] || '', tessedit_pageseg_mode: msg.psm[k] || '7'});
      out[k] = (await w.recognize(msg.images[k])).data.text.trim();
    }
    send(out);
  })().catch(e => send({error: String(e)}));
  return true;
});
