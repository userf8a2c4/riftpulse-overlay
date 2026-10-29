# RiftPulse — Wiki

**Pronóstico de League of Legends Esports en vivo, para tu transmisión.**

RiftPulse aporta lo único que la transmisión oficial **no** sintetiza: la **probabilidad de victoria** de cada equipo en tiempo real, con la precisión del modelo a la vista (**75 % de acierto al minuto 15**, sobre 589 juegos de prueba). Se añade a OBS pegando **una sola URL**, transparente, y autodetecta el partido del Mundial.

## Empezar
- 📺 **[Instalación en OBS](Instalación-en-OBS)** — en 3 pasos, una URL.
- ❓ **[Preguntas frecuentes](Preguntas-frecuentes)**

## El modelo (por qué creerle)
- 🧠 **[Cómo funciona el modelo](Cómo-funciona-el-modelo)** — Elo + regresión logística por minuto, con 2 247 juegos de entrenamiento.
- 🎯 **[Precisión y pruebas](Precisión-y-pruebas)** — 62 % antes del juego, 75 % al min 15, 84 % al min 25, medido fuera de muestra.

## Para equipos de transmisión
- 🎛 **[Mesa de análisis](Mesa-de-análisis)** — segunda pantalla con probabilidad, el porqué y **puntos para comentar**.
- 🎬 **[Paquete de gráficos](Paquete-de-gráficos)** — varias piezas conmutables para OBS.
- 🎚 **[Control de producción](Control-de-producción)** — toggles y alertas en vivo.

## Un motor, varias caras
Todo sale del mismo modelo:
- **Overlay** (`overlay.html`) para la transmisión.
- **Mesa de análisis** (`analista.html`) para el desk.
- **Control** (`control.html`) para producción.

> Es pronóstico y análisis, **sin fines de apuestas**. No está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.

Hecho por **VectisDev**.
