# Mesa de análisis

Una **segunda pantalla** para el equipo de comentaristas y analistas. No va al aire: se abre en un navegador, aparte de OBS.

Ábrela en: `https://userf8a2c4.github.io/riftpulse-overlay/analista.html`

Sin partido en vivo, pruébala con un partido real ya jugado: `analista.html?demo`.

<p align="center"><img src="https://raw.githubusercontent.com/userf8a2c4/riftpulse-overlay/main/docs/img/mesa-de-analisis.png" width="720" alt="Mesa de análisis"><br><sub>Partido de ejemplo con datos simulados.</sub></p>

## Qué muestra
- **La historia del juego** — de 3 a 5 frases que cuentan el juego: cómo arrancó, el giro más grande, cómo está ahora y qué necesita el que va abajo. Por ejemplo: *«T1 tomó el control temprano: +1,7k de oro al min 14 y 2 dragones. El giro: entre el min 21:00 y el 21:40, GEN sumó +22 puntos con el Barón Nashor.»*
- **Probabilidad en vivo** de cada equipo, grande y clara.
- **Por qué** — el desglose de los factores del modelo (oro, torres, dragones, almas, Barón, inhibidores…).
- **Qué cambió en el último minuto** — los puntos de probabilidad que se movieron y por qué: oro, kills, torres, dragones, Barones e inhibidores frente a hace un minuto de juego.
- **Qué mirar ahora** — el próximo objetivo y cuánto falta (o si ya está en el mapa), cuánto mueve la probabilidad si lo toma cada equipo y **quién llega mejor** (por nivel, ítems completos y oro).
- **Momentum y giros clave** — la probabilidad en todo el juego, con los tramos donde saltó 9 puntos o más sombreados y su causa (*"min 20:30–24:00, GEN +38: Barón Nashor"*). La **banda clara** alrededor de la línea dice cuánta confianza darle en cada minuto: es más ancha cuando el modelo acierta menos.
- **Objetivos y eventos** — timers y lo que va pasando.
- **Mapa de la Grieta** — un mapa esquemático con puntos para tocar: el pozo del dragón (dragones tomados por tipo y minuto, alma, próximo), el del Barón (quién lo tomó, buff activo, cuándo reaparece) y cada base (torres perdidas, inhibidores caídos y cuándo reaparecen). El punto se ilumina si pasó algo en el último minuto.
- **Oro y objetivos** — la diferencia de oro de todo el juego, con dragones, Barones e inhibidores marcados donde ocurrieron.
- **Kills en el tiempo** y **rendimiento por jugador** (campeón, % del daño del equipo, oro y CS por minuto).
- **Alineaciones de la serie** — los 10 campeones de cada mapa jugado o en curso, quién ganó y cuánto duró. El feed oficial no trae los bloqueos (bans).
- **Niveles, visión e ítems** — el nivel medio de cada equipo, cuántos jugadores llegaron a nivel 6, 11 y 16, las **wards** puestas y destruidas, los **ítems completos** y los **picos de poder** (quién completó qué ítem y cuándo). Solo aparece lo que el feed trae: si un dato no viene, no se muestra ni se inventa.
- **Duelos por línea** — top, jungla, mid, ADC y soporte frente a su rival directo: diferencia de oro y CS, K/D/A y campeón. Destaca al **jugador clave** del momento (oro sobre su rival, % del daño del equipo y participación en kills).
- **Serie** — cuánto vale este juego: probabilidad de llevarse la serie si lo gana cada equipo, y ahora mismo. Los juegos que faltan se estiman con la **fuerza de cada equipo (Elo)**. Incluye el **cara a cara** de 2025–26.
- **Draft y ventana de poder** — el plan de cada draft según la escala de sus campeones en ~2,200 juegos profesionales, y quién necesita ventaja antes del min ~20–24. Es contexto: no cambia la probabilidad.
- **Para remontar** — cuando un equipo cae por debajo del 45 %, el modelo prueba combinaciones pequeñas de objetivos (Barón, dragón o alma, torres, inhibidor, una pelea ganada) y dice lo mínimo que lo devuelve al 50 %.
- **Puntos para comentar** — frases listas para decir al aire, generadas del modelo. Por ejemplo:
  - *"RiftPulse da 68 % a T1 ahora mismo."*
  - *"Su mayor factor: ventaja de oro."*
  - *"Si GEN le da la vuelta a este juego, queda con 75 % de llevarse la serie."*
  - *"Para remontar, GEN necesita Barón y 2 torres: con eso vuelve al 52 %."*
  - *"Jugador clave: Chovy, +1,2k de oro sobre Faker y 31 % del daño de GEN."*
  - *"Próximo Barón en 1:30: si lo toma T1, +9 pts; si lo toma GEN, +12 pts."*
- **Resumen del juego** — al terminar, una tarjeta con quién ganó, su peor momento (si fue remontada), el giro decisivo, el jugador clave y las estadísticas. El botón **⬇ Descargar imagen** genera un PNG de 1200 × 675 listo para redes.
- **Precisión** del modelo, siempre visible.

## Ideas de uso
- En una laptop/tablet junto al caster, como apoyo para no quedarse sin qué decir.
- En un segundo monitor del analista, para leer el estado del juego de un vistazo.
- Se comparte por URL; cualquiera del equipo la abre sin instalar nada.
