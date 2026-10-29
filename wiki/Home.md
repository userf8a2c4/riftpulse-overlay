<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/banner.jpg" alt="RiftPulse: pronóstico en vivo de LoL Esports sobre tu transmisión"></p>

# RiftPulse — Wiki

**Pronóstico de League of Legends Esports en vivo, para tu transmisión.**

RiftPulse aporta lo que la transmisión oficial **no** sintetiza: la **probabilidad de victoria** de cada equipo en tiempo real, con la precisión del modelo a la vista (**75 % de acierto al minuto 15**, sobre 589 juegos de prueba). Se añade a OBS pegando **una sola URL**, transparente, y autodetecta el partido del Mundial.

## Empezar
- 📺 **[Instalación en OBS](Instalación-en-OBS)** — en 3 pasos, una URL.
- ❓ **[Preguntas frecuentes](Preguntas-frecuentes)**

## El modelo (por qué creerle)
- 🧠 **[Cómo funciona el modelo](Cómo-funciona-el-modelo)** — regresión logística por minuto, con 2 247 juegos de entrenamiento.
- 🎯 **[Precisión y pruebas](Precisión-y-pruebas)** — 62 % antes del juego, 75 % al min 15, 84 % al min 25, medido fuera de muestra.

## Para casters, streamers y producción
- 🎙 **[Mesa de análisis](Mesa-de-análisis)** — segunda pantalla: probabilidad, el porqué, giros clave, duelos por línea, serie, draft, qué necesita el que va abajo y **puntos para comentar**.
- 🎬 **[Paquete de gráficos](Paquete-de-gráficos)** — todas las piezas para OBS y sus parámetros.
- 🎚 **[Control de producción](Control-de-producción)** — encender/apagar piezas y lanzar alertas en vivo.

## Del proyecto
- ⚖️ **[Cumplimiento y datos](Cumplimiento-y-datos)** — sin apuestas, fuentes y atribución.
- 🗂 **[Estructura del repositorio](Estructura-del-repositorio)** — qué es cada archivo y cómo publicarlo.

## Un motor, varias caras
Todo sale del mismo modelo (`engine.js`):
- **Overlay** (`overlay.html`) para la transmisión.
- **Mesa de análisis** (`analista.html`) para el desk.
- **Control** (`control.html`) para producción.

> Es pronóstico y análisis, **sin fines de apuestas**. No está avalado por Riot Games. League of Legends y Riot Games son marcas de Riot Games, Inc.

Hecho por **VectisDev**.
