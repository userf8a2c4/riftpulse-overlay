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
    "permissions": ["sidePanel", "storage"],
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
    "icons": {"128": "icon128.png"}
}
open(os.path.join(ext, 'manifest.json'), 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=2))
open(os.path.join(ext, 'background.js'), 'w', encoding='utf-8').write(
    "// Al hacer clic en el ícono de la extensión se abre o cierra el panel lateral.\n"
    "chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});\n")


print('Extensión actualizada en:', ext)
