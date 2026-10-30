# Estilo y colores de equipo

Todo RiftPulse usa un mismo sistema visual, **«Colores de cada equipo»**: la app, la mesa, el control, la página, las piezas de OBS y la barra de la extensión.

- **Fondo grafito neutro.**
- **Los colores del lado, como el HUD de la transmisión:** el equipo de la izquierda (lado azul) va siempre en **azul** y el de la derecha (lado rojo), siempre en **rojo**, sean cuales sean sus colores de marca. Así RiftPulse nunca contradice lo que muestra el video (por ejemplo, TES es rojo de marca, pero del lado azul va en azul).
- **Un solo color propio, la señal cian eléctrico** (`#22D3EE`): marca lo que aporta el modelo (giros, momentos clave, acierto).
- **Tipografía:** Saira Condensed para titulares y números grandes, Inter Tight para leer y JetBrains Mono para relojes y timers. Ningún texto mide menos de 12 px.
- **Movimiento:** los porcentajes se animan al cambiar y un cambio grande deja un destello breve. Respeta «reducir movimiento» del sistema.
- **Modo claro** en la app, siguiendo al sistema. El overlay y OBS siempre van oscuros.

## Azul y rojo, siempre por lado
- El lado sale del juego (el equipo azul del feed oficial es el de la izquierda del HUD).
- Los logos de los equipos se muestran con sus colores de marca; las barras, los porcentajes y las fichas, con el color del lado.
- El texto sobre cada color va en blanco o en negro, el que tenga más contraste.

Las pruebas del repositorio miden el contraste **WCAG AA** con pares reales de equipos, incluidos los conflictivos.

## Archivos
- `rp-tokens.css`: los colores, las tipografías y las medidas.
- `rp-design.css`: el diseño común de las páginas.
- `rp-ui.js`: los colores del partido en la página, los números animados y el color de los logos.
