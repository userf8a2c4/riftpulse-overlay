<div align="center">

<img src="docs/img/banner.jpg" alt="RiftPulse: pronóstico en vivo de LoL Esports sobre tu transmisión">

# RiftPulse

**Tu segunda pantalla del Mundial.** Quién va ganando, en vivo y en los colores de cada equipo, sincronizado con lo que ves; y para streamers, una URL en OBS que decide sola qué mostrar.

![Acierto](https://img.shields.io/badge/acierto-75%25%20al%20min%2015-2BB673)
![Backtest](https://img.shields.io/badge/prueba-589%20juegos%20no%20vistos-4CC9F0)
![OBS](https://img.shields.io/badge/OBS-Browser%20Source-302E87)
![Enfoque](https://img.shields.io/badge/pron%C3%B3stico%20%C2%B7%20sin%20apuestas-FF5A5F)
![Riot](https://img.shields.io/badge/no%20afiliado%20a-Riot%20Games-1E2740)

**[Página](https://userf8a2c4.github.io/riftpulse-overlay/)** · **[Cómo funciona](https://userf8a2c4.github.io/riftpulse-overlay/como-funciona.html)** · **[Wiki](https://github.com/userf8a2c4/riftpulse-overlay/wiki)** · **[Instalación](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Instalación-en-OBS)** · **[Preguntas frecuentes](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Preguntas-frecuentes)**

</div>

RiftPulse estima **en tiempo real** la probabilidad de victoria de cada equipo del Mundial y la pone sobre tu transmisión. Se añade a OBS pegando **una sola URL**: fondo transparente, autodetecta el partido en vivo, **decide sola qué pieza mostrar en cada momento** y muestra su propia **precisión**.

<p align="center"><img src="docs/img/overlay-en-transmision.jpg" alt="Overlay de RiftPulse sobre una transmisión"></p>

## Lo que incluye

- 🤖 **[Director automático](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Director-automático)** — una sola URL: la barra siempre y, en cada momento, la pieza que aporta (el impacto antes del dragón o el Barón, el daño tras una pelea, la alerta en un giro, qué necesita el que va abajo, la historia del juego, el resumen y la serie). Nunca dos piezas grandes a la vez.
- 🎬 **[Paquete de gráficos](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Paquete-de-gráficos)** — cada pieza también como URL propia, con temas «Equipos», «Mi canal» y «Minimal».
- 🧩 **[Extensión para espectadores](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Extensión-para-espectadores)** — RiftPulse encima del video de Twitch o lolesports, **sincronizado solo con el minuto que ves**, en vivo o en un VOD, con línea de tiempo para saltar a cada momento y [modo sin spoilers](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Modo-sin-spoilers).
- 🎯 **[Para el espectador](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Para-el-espectador)** — **tu pronóstico contra RiftPulse** en cada serie, ayudas para entender el juego y la app instalable en el celular.
- 🎙 **[Mesa de análisis](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Mesa-de-análisis)** — segunda pantalla para casters: **la historia del juego**, qué cambió en el último minuto, qué mirar ahora, el porqué, giros clave, duelos, serie, draft y **frases listas para comentar**.
- 🎚 **[Control de producción](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Control-de-producción)** — el director con atajos de teclado y su línea de tiempo, módulos y alertas, como dock dentro de OBS.
- 🏆 **[Predicciones del stream y cuadro en vivo](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Control-de-producción)** — los picks de cada integrante con aciertos automáticos, y las eliminatorias del Mundial en tiempo real.
- 🎯 **[Precisión a la vista](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Precisión-y-pruebas)** — 62 % antes del juego, **75 % al min 15** y 84 % al min 25, sobre 589 juegos que el modelo no vio.

## Instalar en OBS

1. Abre la **[página](https://userf8a2c4.github.io/riftpulse-overlay/)** y toca **📋 Copiar URL del overlay**.
2. En OBS: **＋ en Fuentes → Navegador** → pega la URL → **1920 × 1080** → Aceptar.
3. Listo: aparece con fondo transparente.

Ajustes, piezas y solución de problemas, en la **[wiki](https://github.com/userf8a2c4/riftpulse-overlay/wiki)**.

> [!IMPORTANT]
> **Es pronóstico y análisis, no una casa de apuestas.** Las probabilidades son estimaciones de un modelo propio, no una certeza. RiftPulse no está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc. Más en **[Cumplimiento y datos](https://github.com/userf8a2c4/riftpulse-overlay/wiki/Cumplimiento-y-datos)**.

<sub>Las imágenes usan un partido de ejemplo con datos simulados. Se generan con `node pruebas/imagenes.js`; las pruebas automáticas corren con `node pruebas/todas.js`.</sub>

**VectisDev** · herramienta de pronóstico y análisis para la comunidad de League of Legends Esports.
