# Control de producción

Un panel para que producción controle el overlay **en vivo**, sin recargar: maneja el [director automático](Director-automático), enciende y apaga módulos, cambia la posición y dispara alertas.

Página: `https://userf8a2c4.github.io/riftpulse-overlay/control.html`

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/control.png" width="300" alt="Panel de control"></p>

## Cómo conectarlo (dentro de OBS)
El overlay y el control se sincronizan cuando **ambos corren en OBS** (comparten el mismo navegador interno):
1. Añade el **overlay** como *Browser Source* (ver [Instalación en OBS](Instalación-en-OBS)).
2. Añade el **control** como *Dock de navegador*: **Ver → Docks → Docks de navegador personalizados** → nombre "RiftPulse", URL del `control.html` → Aplicar.
3. El dock aparece dentro de OBS; lo que toques ahí cambia el overlay al instante.

## Director automático
Con `overlay.html?view=auto` en OBS, el control muestra:
- el **nivel** del director: Mínimo, Estándar o Show;
- **qué hay en pantalla** y cuántos segundos le quedan;
- **⏭ Saltar la pieza** (`0`) y **Retener 30 s** (`R`);
- las **nueve piezas** para pedir a mano (`1` a `9`), con botones de alto fijo para no errarle al clic;
- la **línea de tiempo** de lo que mostró el director y cuándo.

`H` oculta todo y lo vuelve a mostrar. Los atajos funcionan con el panel enfocado. Más en [Director automático](Director-automático).

## Qué más controla
- **Módulos:** pronóstico, momentum, timers, marca (la probabilidad siempre va).
- **Posición:** arriba o abajo.
- **Ocultar / mostrar** el overlay.
- **⚡ Disparar alerta de prueba** — para ensayar antes del aire.
- **Piezas automáticas:** encender o apagar *Para remontar* y *Resumen al terminar*.
- **🏁 Mostrar resumen del juego** — vuelve a sacar el resumen del último juego en la vista `recap`.

## Predicciones del stream

> **También desde el panel:** en la extensión, **Mando → Predicciones del staff** agrega integrantes y picks, marca los aciertos solos y **copia la URL para OBS** con todo adentro (no hace falta el dock).

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/predicciones.png" width="760" alt="Predicciones del stream"><br><sub>Datos de ejemplo.</sub></p>

La gráfica de picks del equipo del stream, como la de las transmisiones oficiales, pero con aciertos automáticos.
1. Ponle **título** (por ejemplo, «Predicciones del stream» o el nombre de tu canal).
2. Agrega a los **integrantes**, todos los que quieras: nombre y, si quieres, una **foto** (se sube desde la computadora y se ajusta sola).
3. Elige **qué partidos**: el próximo día con partidos (automático), cualquier día del torneo o una **fase completa** (por ejemplo, todos los cuartos).
4. Toca el equipo que elige cada integrante en cada partido.
5. En OBS, añade `overlay.html?view=predicciones` como Browser Source.

Cuando un partido termina, cada pick se marca solo como ✓ acierto o ✗ fallo, y la fila **Aciertos** lleva el marcador de todo el torneo (el líder en dorado). Las columnas y filas se achican solas según cuántos integrantes y partidos haya. Los datos se guardan en el navegador de OBS; nada sale de tu computadora.

## Detalle técnico
La sincronía usa `BroadcastChannel` + `localStorage`: funciona entre pestañas/paneles del **mismo navegador y origen**, que es justo el caso dentro de OBS. No necesita servidor.
