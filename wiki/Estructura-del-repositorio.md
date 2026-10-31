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
| `engine.js` | Motor: datos en vivo, modelo, director automático, escenarios, «para decir ahora», historia del juego y peleas en equipo |
| `ext-overlay.js` | El overlay de la extensión ya armado (la versión manual lo baja de acá) |
| `fuente/` | El código del overlay de la extensión (`overlay.js`; `lector.js` lee el reloj, el marcador y la serie del video), la plantilla de la app (`app.html`) y `construir_extension.py`, que arma la extensión, `app.html`, `ext-overlay.js` y los dos ZIP: `python3 fuente/construir_extension.py` |
| `descargas/` | La extensión (a mano y para la Chrome Web Store), la Extensión de Twitch y la escena de OBS (las arma el build) |
| `datos/precision.json` | La precisión medida en cada juego del Mundial ([página](https://userf8a2c4.github.io/riftpulse-overlay/precision.html)) |
| `votacion.js` | El chat contra el modelo en OBS (`&canal=`) |
| `precision.html` | Cuánto acierta el modelo, juego por juego |
| `rp-tokens.css`, `rp-design.css`, `rp-ui.js` | El sistema visual común (ver [Estilo y colores de equipo](Estilo-y-colores-de-equipo)) |
| `rp-i18n.js` | Idiomas: el selector ES \| EN y el diccionario español → inglés (también para el overlay de la extensión) |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | La app instalable (PWA) |
| `logo.svg` | La marca |
| `LICENSE` | Licencia AGPL-3.0 |
| `docs/img/` | Imágenes del README y de esta wiki |
| `docs/chrome-web-store/` | Ficha, capturas e imágenes promocionales de la Chrome Web Store |
| `docs/carta-para-nick.md`, `docs/img/nick/` | Carta de presentación para casters |
| `modelo/` | Recolección de juegos reales y reentrenamiento del modelo |
| `pruebas/` | Pruebas automáticas (`node pruebas/todas.js`), simulador del feed y generadores de imágenes |
| `wiki/` | Fuente de esta wiki |
| `.github/workflows/` | Pruebas y linter en cada cambio, publicar la wiki, sondear el feed real, probar con video real y reentrenar el modelo |
| `.eslintrc.json` | Las reglas del linter (cero errores y cero avisos) |

## Cómo se actualiza esta wiki
Las páginas viven en la carpeta `wiki/` del repositorio. Cada vez que cambian en `main`, la acción **Publicar wiki** (`.github/workflows/wiki.yml`) las copia aquí automáticamente. También se puede lanzar a mano desde **Actions → Publicar wiki → Run workflow**.
