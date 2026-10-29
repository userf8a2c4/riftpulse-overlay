# Instalación en OBS

El overlay es un **Browser Source**: se instala pegando una URL. No hay que configurar nada; autodetecta el partido de Worlds en vivo.

## En 3 pasos
1. Abre la **página** (`https://userf8a2c4.github.io/riftpulse-overlay/`) y toca **📋 Copiar URL del overlay**.
2. En OBS: **＋ en Fuentes → Navegador / Browser Source** → pega la URL → pon **1920 × 1080** → Aceptar.
3. Aparece con fondo transparente. Arrástralo donde quieras.

## Alternativa: escena lista
En la página, **⬇ Descargar escena de OBS** → en OBS **Escena → Importar** → elige el archivo `RiftPulse.json`. Trae el Browser Source ya puesto (OBS 28+).

## Si algo no se ve
- **No aparece:** ¿hay un partido de Worlds en vivo ahora? Entre partidas queda a la espera.
- **Se ve una caja/fondo:** asegúrate de que sea un *Navegador/Browser Source* (no una imagen). El overlay es transparente por diseño.
- **Rendimiento:** una sola fuente basta; no dupliques el overlay en varias escenas si no hace falta.

## Ajustes por URL (opcional)
Añade parámetros al final de la URL:
- `?pos=top` — arriba en vez de abajo.
- `?scale=1.2` — más grande.
- `?modules=prob,timers` — elige qué mostrar.
- `?view=big` — otra pieza del [paquete de gráficos](Paquete-de-gráficos).
