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

## Cómo leerlo honestamente
- Acertar más que una moneda (50 %) ya es señal de valor; 75 % al minuto 15 es fuerte para un modelo público.
- Ninguna predicción usó información del futuro: es "fuera de muestra".
- Lo que no está probado, no se afirma.
