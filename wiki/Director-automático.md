# Director automático

**Una sola Browser Source en OBS y RiftPulse decide qué mostrar.** La URL es `overlay.html?view=auto`.

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/overlay-en-transmision.jpg" width="720" alt="El director en una transmisión"><br><sub>Partido de ejemplo con datos simulados.</sub></p>

## Qué muestra y cuándo
- **Siempre:** la barra con la probabilidad en vivo, el reloj y el próximo objetivo.
- **El minuto previo a un dragón o al Barón:** cuánto mueve la probabilidad si lo toma cada equipo. Si el objetivo ya está en el mapa, dice «ya está».
- **Después de una pelea grande:** el daño de los diez jugadores.
- **En un giro** (12 puntos o más en ~40 s): la alerta sobre la barra, con el equipo, los puntos y la causa. Sale aunque haya otra pieza en pantalla.
- **Cuando un equipo cae al 30 % o menos** (desde el min 10): qué necesita para volver.
- **Al min 20:** la historia del juego hasta ahí, en 3 a 5 frases.
- **Al terminar el juego:** el resumen, 20 s.
- **Entre juegos y antes del primero:** la serie, con la previa del modelo.

**Nunca hay dos piezas grandes a la vez**, y entre una y otra siempre pasan al menos 6 s.

## Tres niveles
| Nivel | Qué agrega |
|---|---|
| `minimo` | Solo la barra y las alertas de giro |
| `estandar` (por defecto) | El objetivo, la pelea, la remontada, la historia, el resumen y la serie |
| `show` | Además el oro, los duelos y la historia cada ~4 minutos de juego |

Se elige con `&director=` en la URL o desde el [Control de producción](Control-de-producción). Si la URL lo fija, el control no lo cambia.

## Manejarlo en vivo
En el [control](Control-de-producción), con el panel enfocado:

| Tecla | Qué hace |
|---|---|
| `1` a `9` | Pide una pieza por 15 s: impacto del objetivo, daño de la pelea, oro, duelos, serie, resumen, claves, para remontar, la historia del juego |
| `0` | Quita la pieza que está en pantalla |
| `R` | La retiene 30 s más |
| `H` | Oculta todo (y vuelve a mostrarlo) |

El control muestra **qué hay en pantalla y cuánto le queda**, y la **línea de tiempo** de lo que mostró el director y cuándo. Los mismos atajos funcionan si la pieza está abierta en una ventana del navegador.

## Temas
- `&tema=equipos` (por defecto): los colores de los dos equipos del partido.
- `&tema=canal&accent=ff8800`: la barra en el color de tu canal. Con `&logo=https://…`, tu logo.
- `&tema=minimal`: plano, sin marca ni sombras.

La pieza grande va arriba a la izquierda; con `&stage=tr`, arriba a la derecha.

## Momentos para editores
En **Mando** (panel de la extensión), «Para redes» arma la lista de **momentos clave** del juego: giros, Barones, inhibidores, peleas grandes y el final. Si estás siguiendo un **VOD**, cada momento trae **el segundo exacto del video** y se habilitan los **capítulos de YouTube** listos para pegar en la descripción.
