# Estructura del repositorio

| Archivo | Para qué |
|---|---|
| `overlay.html` + `obs.js` | El overlay de OBS (todas las piezas con `?view=`, ver [Paquete de gráficos](Paquete-de-gráficos)) |
| `analista.html` | [Mesa de análisis](Mesa-de-análisis) (segunda pantalla) |
| `control.html` | [Control de producción](Control-de-producción) |
| `index.html` | Página "para streamers": copiar URL, descargar escena, paquete de gráficos |
| `engine.js` | Motor: datos en vivo + modelo (misma fuente que la app) |
| `logo.svg`, `logo.png` | Marca |
| `riftpulse.obs-scene.json` | Escena de OBS de respaldo (OBS 28+) |
| `INSTRUCCIONES-NICK.md` | Carta de presentación para Nick Daboom |
| `docs/img/` | Imágenes del README y de esta wiki |
| `wiki/` | Fuente de esta wiki |

## Cómo se actualiza esta wiki
Las páginas viven en la carpeta `wiki/` del repositorio. Cada vez que cambian en `main`, la acción **Publicar wiki** (`.github/workflows/wiki.yml`) las copia aquí automáticamente. También se puede lanzar a mano desde **Actions → Publicar wiki → Run workflow**.
