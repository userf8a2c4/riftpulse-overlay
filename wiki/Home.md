<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/banner.jpg" alt="RiftPulse: pronóstico en vivo de LoL Esports sobre tu transmisión"></p>

# RiftPulse — Wiki

**Pronóstico de League of Legends Esports en vivo, para tu transmisión.**

RiftPulse aporta lo que la transmisión oficial **no** sintetiza: la **probabilidad de victoria** de cada equipo en tiempo real, con la precisión del modelo a la vista (**75 % de acierto al minuto 15**, sobre 589 juegos de prueba). Se añade a OBS pegando **una sola URL**, transparente: autodetecta el partido del Mundial y **decide solo qué mostrar** en cada momento, en los **colores de cada equipo**.

## Empezar
- 📺 **[Instalación en OBS](Instalación-en-OBS)** — en 3 pasos, una URL.
- 🧩 **[Extensión para espectadores](Extensión-para-espectadores)** — RiftPulse encima del video de Twitch o lolesports, sincronizado solo con el minuto que ves, en vivo o en un VOD.
- 🎯 **[Para el espectador](Para-el-espectador)** — tu pronóstico contra RiftPulse, ayudas para entender el juego y la app en el celular.
- 🙈 **[Modo sin spoilers](Modo-sin-spoilers)** — para ponerse al día sin enterarse de los resultados.
- ❓ **[Preguntas frecuentes](Preguntas-frecuentes)**

## El modelo (por qué creerle)
- 🧠 **[Cómo funciona el modelo](Cómo-funciona-el-modelo)** — regresión logística por minuto, con 2 247 juegos de entrenamiento.
- 🎯 **[Precisión y pruebas](Precisión-y-pruebas)** — 62 % antes del juego, 75 % al min 15, 84 % al min 25, medido fuera de muestra.

## Para casters, streamers y producción
- 🤖 **[Director automático](Director-automático)** — una sola URL en OBS: la barra siempre y, en cada momento, la pieza que aporta. Con atajos y línea de tiempo.
- 🎙 **[Mesa de análisis](Mesa-de-análisis)** — segunda pantalla: **la historia del juego**, qué cambió en el último minuto, qué mirar ahora, el porqué, giros clave, duelos, serie, draft y **puntos para comentar**.
- 🎬 **[Paquete de gráficos](Paquete-de-gráficos)** — todas las piezas para OBS y sus parámetros.
- 🎚 **[Control de producción](Control-de-producción)** — encender/apagar piezas y lanzar alertas en vivo.

## Del proyecto
- ⚖️ **[Cumplimiento y datos](Cumplimiento-y-datos)** — sin apuestas, fuentes y atribución.
- 🎨 **[Estilo y colores de equipo](Estilo-y-colores-de-equipo)** — el sistema visual y de dónde sale el color de cada equipo.
- 🗂 **[Estructura del repositorio](Estructura-del-repositorio)** — qué es cada archivo y cómo publicarlo.

## Un motor, varias caras
Todo sale del mismo modelo (`engine.js`):
- **Overlay** (`overlay.html`) para la transmisión.
- **Mesa de análisis** (`analista.html`) para el desk.
- **Control** (`control.html`) para producción.

> Es pronóstico y análisis, **sin fines de apuestas**. No está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.

Hecho por **VectisDev**.
