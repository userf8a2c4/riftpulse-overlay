# Estilo y colores de equipo

Todo RiftPulse usa un mismo sistema visual, **«Colores de cada equipo»**: la app, la mesa, el control, la página, las piezas de OBS y la barra de la extensión.

- **Fondo grafito neutro.** Nada de azul noche: el color lo ponen los equipos.
- **Cada partido toma los colores reales de sus dos equipos.** Un GEN vs T1 se ve dorado y rojo; un IG vs LYON, blanco y violeta.
- **Un solo color propio, la señal cian eléctrico** (`#22D3EE`): marca lo que aporta el modelo (giros, momentos clave, acierto).
- **Tipografía:** Saira Condensed para titulares y números grandes, Inter Tight para leer y JetBrains Mono para relojes y timers. Ningún texto mide menos de 12 px.
- **Movimiento:** los porcentajes se animan al cambiar y un cambio grande deja un destello breve. Respeta «reducir movimiento» del sistema.
- **Modo claro** en la app, siguiendo al sistema. El overlay y OBS siempre van oscuros.

## De dónde sale el color de cada equipo
1. Una **tabla** con los colores de marca de los equipos del Mundial 2026.
2. Si un equipo no está en la tabla y su logo se puede leer, el **color dominante del logo**.
3. En la extensión, el **color de la sigla en el marcador del video**, para que la barra coincida con la transmisión.
4. Si nada de eso está, el **color del lado del mapa** (azul o rojo).

## Control de contraste
- Si los dos colores se parecen (por ejemplo, rojo contra rojo), el segundo pasa al color de su lado.
- Si un color es muy oscuro, se aclara hasta que se lee bien sobre grafito.
- El texto sobre cada color va en blanco o en negro, el que tenga más contraste.

Las pruebas del repositorio miden el contraste **WCAG AA** con pares reales de equipos, incluidos los conflictivos.

## Archivos
- `rp-tokens.css`: los colores, las tipografías y las medidas.
- `rp-design.css`: el diseño común de las páginas.
- `rp-ui.js`: los colores del partido en la página, los números animados y el color de los logos.
