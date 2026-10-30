# Estructura del repositorio

| Carpeta o archivo | Para qué |
|---|---|
| `index.html` | Página para streamers: copiar la URL, descargar la escena y el paquete de gráficos |
| `instalar.html` | Instalar RiftPulse: la extensión en 3 pasos, la app o OBS |
| `como-funciona.html` | Cómo funciona, con simulador y precisión |
| `app.html`, `app.css`, `app.js` | La app para fans; también es el panel lateral de la extensión |
| `overlay.html` + `obs.js` | El overlay de OBS (todas las piezas con `?view=`, ver [Paquete de gráficos](Paquete-de-gráficos)) |
| `analista.html` | [Mesa de análisis](Mesa-de-análisis) (segunda pantalla) |
| `control.html` | [Control de producción](Control-de-producción) |
| `nick.html` | Presentación para casters |
| `engine.js` | Motor: datos en vivo, modelo, director automático, historia del juego y peleas en equipo |
| `ext-overlay.js` | El overlay de la extensión (la versión manual lo baja de acá) |
| `riftpulse-extension.zip`, `riftpulse-extension-tienda.zip` | La extensión para instalar a mano y el paquete de la Chrome Web Store |
| `rp-tokens.css`, `rp-design.css`, `rp-ui.js` | El sistema visual común (ver [Estilo y colores de equipo](Estilo-y-colores-de-equipo)) |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | La app instalable (PWA) |
| `riftpulse.obs-scene.json` | Colección de escenas de OBS con el director (OBS 28+) |
| `logo.svg` | La marca |
| `LICENSE` | Licencia AGPL-3.0 |
| `docs/img/` | Imágenes del README y de esta wiki |
| `docs/chrome-web-store/` | Ficha, capturas e imágenes promocionales de la Chrome Web Store |
| `docs/carta-para-nick.md` | Carta de presentación para casters |
| `modelo/` | Recolección de juegos reales y reentrenamiento del modelo |
| `pruebas/` | Pruebas automáticas (`node pruebas/todas.js`), simulador del feed y generadores de imágenes |
| `wiki/` | Fuente de esta wiki |
| `.github/workflows/` | Pruebas y linter en cada cambio, publicar la wiki, sondear el feed real, probar con video real y reentrenar el modelo |
| `.eslintrc.json` | Las reglas del linter (cero errores y cero avisos) |

## Cómo se actualiza esta wiki
Las páginas viven en la carpeta `wiki/` del repositorio. Cada vez que cambian en `main`, la acción **Publicar wiki** (`.github/workflows/wiki.yml`) las copia aquí automáticamente. También se puede lanzar a mano desde **Actions → Publicar wiki → Run workflow**.
