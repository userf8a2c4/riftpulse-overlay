# Instalación en OBS

El overlay es un **Browser Source**: se instala pegando una URL. No hay que configurar nada: autodetecta el partido del Mundial en vivo y el [director automático](Director-automático) decide qué mostrar en cada momento.

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/pagina.png" width="640" alt="Página para streamers"></p>

## En 3 pasos
1. Abre la **página** (`https://userf8a2c4.github.io/riftpulse-overlay/`) y toca **📋 Copiar URL del overlay**.
2. En OBS: **＋ en Fuentes → Navegador / Browser Source** → pega la URL → pon **1920 × 1080** → Aceptar.
3. Aparece con fondo transparente. Arrástralo donde quieras.

## Alternativa: escena lista
En la página, **⬇ Descargar escena de OBS** → en OBS **Colección de escenas → Importar** → elige el archivo `RiftPulse.json` (OBS 28+). Trae la escena «RiftPulse» con el director ya puesto y, ocultas, las predicciones del stream y el cuadro del Mundial.

Para manejarlo en vivo, sumá el [control](Control-de-producción) como dock: en la página, **🎚 Copiar URL del control (dock)** y en OBS **Docks → Docks de navegador personalizados**.

## Si algo no se ve
- **No aparece:** ¿hay un partido de Worlds en vivo ahora? Entre partidas queda a la espera.
- **Se ve una caja/fondo:** asegúrate de que sea un *Navegador/Browser Source* (no una imagen). El overlay es transparente por diseño.
- **Rendimiento:** una sola fuente basta; no dupliques el overlay en varias escenas si no hace falta.

## Ajustes por URL (opcional)
Añade parámetros al final de la URL:
- `?pos=top` — arriba en vez de abajo.
- `?scale=1.2` — más grande.
- `?modules=prob,timers` — elige qué mostrar.
- `?director=show` — que muestre más piezas (o `minimo`, menos).
- `?tema=canal&accent=ff8800` — la barra en el color de tu canal; `?tema=minimal`, plana.
- `?view=big` — otra pieza del [paquete de gráficos](Paquete-de-gráficos).
