# Mesa de análisis

Una **segunda pantalla** para el equipo de comentaristas y analistas. No va al aire: se abre en un navegador, aparte de OBS.

Ábrela en: `https://userf8a2c4.github.io/riftpulse-overlay/analista.html`

## Qué muestra
- **Probabilidad en vivo** de cada equipo, grande y clara.
- **Por qué** — el desglose de los factores del modelo (oro, torres, dragones, almas, Barón, inhibidores…).
- **Momentum y giros clave** — la probabilidad en todo el juego, con los tramos donde saltó 9 puntos o más sombreados y su causa (*"min 20:30–24:00, GEN +38: Barón Nashor"*).
- **Objetivos y eventos** — timers y lo que va pasando.
- **Duelos por línea** — top, jungla, mid, ADC y soporte frente a su rival directo: diferencia de oro y CS, K/D/A y campeón. Destaca al **jugador clave** del momento (oro sobre su rival, % del daño del equipo y participación en kills).
- **Serie** — cuánto vale este juego: probabilidad de llevarse la serie si lo gana cada equipo, y ahora mismo. Los juegos que faltan se cuentan 50/50 (el motor no estima la fuerza previa de los equipos). Incluye el **cara a cara** de 2025–26.
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
