# Cómo funciona el modelo

RiftPulse combina **dos modelos** que se alimentan del feed oficial de LoL Esports. El resultado es una sola cifra: la **probabilidad de victoria** de cada equipo, actualizada cada 2 segundos.

## 1. Antes del juego — fuerza de los equipos (Elo)
Un sistema **Elo** entrenado con todos los partidos de 2025–26 de las ligas principales e internacionales (LCK, LPL, LEC, LCS, CBLOL, LCP, First Stand, MSI, Copa Mundial de Esports y Worlds). Cada región tiene un ajuste que solo se mueve con partidos internacionales, para no comparar ligas que no se enfrentan.

Esto da la probabilidad **previa** (quién parte como favorito y por cuánto), antes de que empiece la partida.

## 2. Durante el juego — regresión logística por minuto
Una **regresión logística** entrenada con **2 247 juegos profesionales** estima la probabilidad con el estado real de la partida. Sus variables (features):

| Variable | Qué mide |
|---|---|
| Oro | Diferencia de oro entre equipos |
| Asesinatos | Diferencia de kills |
| Torres | Torres destruidas |
| Inhibidores | Inhibidores abiertos |
| Barón | Barones tomados |
| Dragones | Dragones y **alma** / punto de alma |
| Dragón Ancestral | Ventaja del Ancestral |
| Curva del draft | Si el draft escala a tardío o pega temprano |
| Previa (Elo) | La fuerza previa, que pesa mucho al inicio y menos con los minutos |

Los **pesos** de cada variable se aprendieron por minuto (minutos 10, 15, 20 y 25) y se interpolan para el minuto exacto del juego. Por eso el modelo "sabe" que 3k de oro al minuto 12 no valen lo mismo que al minuto 30.

## 3. De las variables a la probabilidad
Cada variable aporta un empuje (positivo hacia un equipo, negativo hacia el otro); se suman, se acota el total y una función logística lo convierte en un porcentaje entre 0 y 100. Las variables que más empujan se muestran como **"qué decide el pronóstico"**.

## Qué lo hace confiable
- Cada predicción se hizo **sin conocer el resultado**: el sistema avanza partido por partido y después compara.
- Se mide su acierto y su **error Brier** de forma abierta → ver **[Precisión y pruebas](Precisión-y-pruebas)**.

> Nota: el overlay de OBS y el de espectador usan el modelo **en vivo**; la probabilidad previa (Elo) vive en la app principal.
