"""Reconstruye la extensión del panel lateral a partir de index.html.
Ejecútelo (o use actualizar-extension.bat) cada vez que cambie la página."""
import json
import os
import re
import shutil

AQUI = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(AQUI, 'index.html'), encoding='utf-8').read()
m = re.search(r'<script>(.*)</script>', src, re.S)
if not m:
    raise SystemExit('No se encontró el <script> en index.html')
html = src[:m.start()] + '<script src="panel.js"></script>' + src[m.end():]

ext = os.path.join(AQUI, 'extension')
os.makedirs(ext, exist_ok=True)
open(os.path.join(ext, 'panel.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(ext, 'panel.js'), 'w', encoding='utf-8').write(m.group(1))

# Overlay de espectador: motor + widget, inyectados sobre el stream (content script).
# logo.svg: marca y favicon del panel. icon128.png: ícono de la extensión (el logo).
for f in ('engine.js', 'overlay.js', 'logo.svg', 'icon128.png', 'rp-design.css'):
    shutil.copy(os.path.join(AQUI, f), os.path.join(ext, f))

manifest = {
    "manifest_version": 3,
    "name": "RiftPulse",
    "version": "1.0",
    "description": "Panel lateral con predicciones, copa, historial y Pick'Em de Worlds 2026.",
    "permissions": ["sidePanel", "storage", "offscreen"],
    "host_permissions": [
        "https://esports-api.lolesports.com/*", "https://feed.lolesports.com/*",
        "https://ddragon.leagueoflegends.com/*", "https://static.lolesports.com/*"
    ],
    "content_scripts": [{
        "matches": ["*://*.twitch.tv/*", "*://*.lolesports.com/*"],
        "js": ["engine.js", "overlay.js"],
        "run_at": "document_idle"
    }],
    "action": {"default_title": "Abrir RiftPulse"},
    "side_panel": {"default_path": "panel.html"},
    "background": {"service_worker": "background.js"},
    "icons": {"128": "icon128.png"},
    "content_security_policy": {"extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"}
}
open(os.path.join(ext, 'manifest.json'), 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=2))
open(os.path.join(ext, 'background.js'), 'w', encoding='utf-8').write(r"""// Al hacer clic en el ícono de la extensión se abre o cierra el panel lateral.
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
""")

# documento oculto que corre el lector
open(os.path.join(ext, 'ocr.html'), 'w', encoding='utf-8').write(
    '<!doctype html><meta charset="utf-8"><script src="ocr/tesseract.min.js"></script><script src="ocr.js"></script>\n')
open(os.path.join(ext, 'ocr.js'), 'w', encoding='utf-8').write(r"""// Lee los recortes del video que manda el overlay (reloj, equipos, oro, kills).
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
""")
# Los archivos del lector (Tesseract.js, Apache-2.0) viven directamente en extension/ocr/.


print('Extensión actualizada en:', ext)
