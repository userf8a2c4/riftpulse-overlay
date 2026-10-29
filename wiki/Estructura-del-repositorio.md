# Estructura del repositorio

| Archivo | Para qué |
|---|---|
| `overlay.html` + `obs.js` | El overlay de OBS (todas las piezas con `?view=`, ver [Paquete de gráficos](Paquete-de-gráficos)) |
| `analista.html` | [Mesa de análisis](Mesa-de-análisis) (segunda pantalla) |
| `control.html` | [Control de producción](Control-de-producción) |
| `index.html` | Página "para streamers": copiar URL, descargar escena, paquete de gráficos |
| `engine.js` | Motor: datos en vivo, modelo, director automático, historia del juego y colores de cada equipo (misma fuente que la app) |
| `rp-tokens.css`, `rp-design.css`, `rp-ui.js` | El sistema visual común (ver [Estilo y colores de equipo](Estilo-y-colores-de-equipo)) |
| `app.html` | La app para fans (la abre el panel de la extensión) |
| `ext-overlay.js`, `riftpulse-extension.zip` | La barra de la extensión sobre el video y el paquete para instalarla |
| `como-funciona.html`, `nick.html` | Cómo funciona (con simulador) y la presentación para Nick |
| `pruebas/` | Pruebas automáticas (`node pruebas/todas.js`), capturas (`capturas.js`) e imágenes de la documentación (`imagenes.js`) |
| `logo.svg`, `logo.png` | Marca |
| `riftpulse.obs-scene.json` | Colección de escenas de OBS con el director (OBS 28+) |
| `INSTRUCCIONES-NICK.md` | Carta de presentación para Nick Daboom |
| `docs/img/` | Imágenes del README y de esta wiki |
| `wiki/` | Fuente de esta wiki |

## Cómo se actualiza esta wiki
Las páginas viven en la carpeta `wiki/` del repositorio. Cada vez que cambian en `main`, la acción **Publicar wiki** (`.github/workflows/wiki.yml`) las copia aquí automáticamente. También se puede lanzar a mano desde **Actions → Publicar wiki → Run workflow**.
