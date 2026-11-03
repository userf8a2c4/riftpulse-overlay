# Precisión y pruebas

La precisión de RiftPulse no es una promesa: es un número **medido** y verificable. Cada predicción se hizo sin conocer el resultado, y después se comparó con lo que pasó.

## Prueba principal (backtest)
Sobre **589 juegos que el modelo NO vio** (agosto–octubre 2026, ligas regionales e internacionales). Referencia: una moneda acierta el 50 % y da un error Brier de 0,250 (menor es mejor).

| Momento | Acierto | Error Brier |
|---|---|---|
| Antes del juego | 62,5 % | 0,221 |
| Minuto 10 | 68,4 % | 0,202 |
| **Minuto 15** | **74,5 %** | **0,173** |
| Minuto 20 | 78,6 % | 0,145 |
| Minuto 25 | 83,6 % | 0,114 |

Entrenado con 1 658 juegos anteriores; la versión activa usa 2 247.

## ¿Qué es el error Brier?
Mide qué tan buenas son las **probabilidades**, no solo el acierto. Si el sistema dice "70 %" y pasa, suma poco error; si dice "95 %" y falla, suma mucho. Una moneda da 0,250. RiftPulse baja de 0,175 ya al minuto 15.

## ¿Está bien calibrado?
Calibrado = cuando dice "70 %", gana ~70 % de las veces (no el 50 %, no el 90 %). La app principal muestra la **curva de calibración** por tramos de probabilidad sobre partidos internacionales.

## Acierto por fuerza de equipos (Elo, antes del partido)
Sobre todos los partidos 2025–26: el sistema acierta al ganador de la **serie** y del **juego** antes de que empiecen, y ese número se actualiza solo con cada resultado de Worlds 2026.

## Cómo se midió
1. **Separación por fecha:** el modelo se entrenó con **1 658 juegos** anteriores a agosto de 2026. Los **589 juegos** de agosto a octubre de 2026 quedaron afuera: el modelo nunca los vio.
2. **Mismo procedimiento que en vivo:** para cada juego de prueba se reconstruyó el estado del feed en los minutos 10, 15, 20 y 25 (oro, kills, torres, inhibidores, dragones, alma, Barones y Ancestral) y se calculó la probabilidad con los mismos pesos que usa el motor.
3. **Comparación con el resultado:** acierto = el equipo con más del 50 % ganó. Error Brier = promedio de (probabilidad − resultado)².
4. **Versión activa:** después de la prueba, el modelo se reentrenó con los **2 247 juegos**. Los porcentajes publicados son los de la prueba fuera de muestra, no los de entrenamiento.

Los números están en un solo lugar del código (`PRECISION` en `engine.js`): la barra, la mesa, la página «Cómo funciona» y esta wiki usan los mismos.

## Cómo leerlo honestamente
- Acertar más que una moneda (50 %) ya es señal de valor; 75 % al minuto 15 es fuerte para un modelo público.
- Ninguna predicción usó información del futuro: es "fuera de muestra".
- Lo que no está probado, no se afirma.

## Noviembre de 2026: qué se probó y qué entró

Con 4.820 juegos (712 de prueba que el modelo no vio, 71 internacionales) se probó cada idea por separado, con el Brier como regla: solo entra lo que lo baja en los minutos 15 y 20 sin empeorar en internacionales.

- **No entró nada nuevo dentro del juego:** Elo con regiones, tendencia del oro (últimos 3 min), oro de mid y ADC, oro según el draft, cómo va la serie y más peso a lo reciente quedaron iguales o peor que el modelo de hoy (Brier 0,174 al min 15).
- **Lo que sí mejoró:** OBS y la extensión sin panel usaban un Elo hecho solo con el Mundial; ahora usan la fuerza real de los equipos (`datos/fuerza.json`, el mismo Elo de la app). En este Mundial, medido sin resultados futuros: min 10 de 63 % a 71 %, min 15 de 74 % a 77 %.
- **La precisión pública ahora es honesta:** cada juego se mide con la fuerza de los equipos de antes de ese partido, con margen de error y Brier a la vista.
