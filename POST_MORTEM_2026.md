# Post-Mortem: Modelo de Predicción Electoral Perú 2026 — Primera Vuelta

**Fecha de elección:** 12 de abril de 2026  
**Cierre de votación:** 5:00pm Lima (horario extendido por JNE/ONPE a 6:00pm)  
**Documento generado:** 13 de abril de 2026  
**Estado:** Preliminar — pendiente conteo rápido y resultados oficiales ONPE  

---

## 1. Resumen Ejecutivo

El modelo de predicción electoral Perú 2026 operó de forma continua durante la jornada electoral del 12 de abril, generando 20 corridas automáticas entre las 11:00am y las 7:14pm (hora Lima). Este documento analiza dos snapshots clave:

- **Corrida de las 6:00pm** (pre-boca de urna): última predicción antes de que los mercados incorporaran resultados de exit polls.
- **FOTO FINAL de las 6:45pm** (post-boca de urna): última predicción del modelo antes del congelamiento, con Polymarket ya reflejando datos de boca de urna.

### Resultado principal

| Métrica | 6:00pm (pre-BdU) | FOTO FINAL (post-BdU) |
|---|---|---|
| MAE top-5 candidatos | 6.44 pts | 3.70 pts |
| Cobertura IC 90% (top-5) | 1/5 (20%) | 4/5 (80%) |
| Ranking top-1 correcto | Si (Keiko) | Si (Keiko) |
| Ranking top-3 (conjunto) | Si | Si |
| Ranking top-3 (orden exacto) | No | Si |
| Alpha (peso Polymarket) | 0.77 | 0.77 |

**Hallazgo central:** El modelo acertó el ranking completo del top-3 en la FOTO FINAL (Keiko > Aliaga > Belmont) y logró un MAE de solo 1.43 pts excluyendo a Keiko Fujimori. Sin embargo, sobreestimó a Keiko por +12.8 puntos porcentuales, un error sistemático derivado de la confusión entre **P(ganar)** de Polymarket (~45.5%) y **% de voto esperado** (~17%). Esta distinción P(ganar) vs % voto es la lección metodológica más importante del modelo.

**Referencia de boca de urna (promedio ponderado Ipsos 50%, Datum 30%, CIT 20%):**  
Keiko 17.2% · Aliaga 11.9% · Belmont 11.6% · Sánchez 11.3% · Nieto 11.0%

> **Nota importante:** Las boca de urna NO son resultados oficiales. Este análisis es preliminar y será actualizado con el conteo rápido y los resultados oficiales de la ONPE.

---

## 2. Metodología del Modelo

### 2.1. Arquitectura General

El modelo combina dos fuentes de información mediante un promedio ponderado bayesiano:

```
predicción_final = α × Polymarket + (1 − α) × Encuestas
```

Donde:
- **Encuestas (polls):** Promedio ponderado de encuestadoras peruanas (IEP, Ipsos, Datum, CPI, CIT), con pesos por calidad histórica, recencia y tamaño muestral.
- **Polymarket:** Precios de contratos de mercado de predicción, interpretados como probabilidades implícitas del mercado y normalizados para sumar 100%.
- **α (alpha):** Peso dinámico asignado a Polymarket, calculado en función de la fase electoral y la proximidad al día de la elección.

### 2.2. Cálculo del Alpha (α)

El peso de Polymarket sigue una curva logística que incrementa conforme se acerca la elección:

| Fase Electoral | Alpha aproximado | Justificación |
|---|---|---|
| Pre-campaña (>90 días) | 0.10–0.20 | Mercados poco líquidos, encuestas dominan |
| Campaña media (30–90 días) | 0.30–0.50 | Mercados ganan liquidez |
| Campaña final (<30 días) | 0.50–0.70 | Mercados incorporan info rápida |
| Día de elección | **0.77** | Máximo peso — mercados en tiempo real |

El día de la elección, α alcanzó **0.77**, significando que el 77% de la predicción provenía de Polymarket y solo el 23% de encuestas. Esta decisión de diseño amplificó tanto los aciertos como los errores del mercado.

### 2.3. Simulación Monte Carlo

El modelo ejecuta **10,000 simulaciones** por corrida para generar:
- **Media (predicted_pct_mean):** Estimación puntual central.
- **IC 90% [p10, p90]:** Intervalo de credibilidad del 10º al 90º percentil.
- **P(primera vuelta):** Probabilidad de ganar en primera vuelta (>50%).
- **P(ganar overall):** Probabilidad de ganar considerando posible segunda vuelta.

### 2.4. Pipeline Automático

El sistema ejecuta un pipeline completo cada vez que detecta un cambio significativo en Polymarket:

1. **Scraping:** Captura precios de Polymarket vía API cada 5 minutos.
2. **Detección de cambio:** Si algún candidato varía ≥1 punto porcentual, dispara el pipeline.
3. **Blending:** Combina encuestas + Polymarket con el α vigente.
4. **Simulación:** 10,000 iteraciones Monte Carlo.
5. **Persistencia:** Guarda predicciones en PostgreSQL con timestamp Lima.

El día de la elección, este ciclo generó **20 corridas** entre las 11:00am y las 7:14pm Lima.

### 2.5. Mecanismo de Congelamiento

El modelo implementa un freeze automático post-cierre de votación:
- Trigger `final_election_day` marca la última corrida.
- Columnas `is_final_snapshot` y `frozen_at` en la DB registran el congelamiento.
- Post-congelamiento, el cron y watchdog dejan de ejecutar el pipeline.

---

## 3. Fuentes de Datos y Disclaimers

### 3.1. Encuestas Electorales

Las encuestas utilizadas provienen de las principales encuestadoras registradas ante el JNE:

| Encuestadora | Peso en modelo | Método | Cobertura |
|---|---|---|---|
| Ipsos Perú | Alto | Presencial + telefónica | Nacional urbano-rural |
| Datum Internacional | Alto | Presencial | Nacional urbano |
| IEP | Medio-alto | Panel + presencial | Nacional |
| CPI | Medio | Presencial | Nacional urbano |
| CIT | Medio-bajo | Telefónica | Nacional |

**Última encuesta incorporada:** Semana del 6–10 de abril de 2026 (veda electoral impide publicación de encuestas desde el 6 de abril, pero las encuestas previas permanecen en el modelo).

**Limitación conocida:** Las encuestas peruanas históricamente subestiman candidatos con voto oculto (vergüenza social) y sobreestiman candidatos con alta visibilidad mediática. El margen de error típico declarado es ±2.5–3.5 pp, pero el error real observado en elecciones anteriores ha sido mayor.

### 3.2. Polymarket

- **Fuente:** API pública de Polymarket (mercado de predicción descentralizado).
- **Contratos monitoreados:** "Who will win the 2026 Peru Presidential Election?"
- **Frecuencia de captura:** Cada 5 minutos vía cron automático.
- **Normalización:** Los precios de contratos se normalizan para sumar 100% entre todos los candidatos listados.

**Limitación crítica:** Polymarket cotiza **P(ganar)** — la probabilidad de que un candidato GANE la elección (incluyendo segunda vuelta) — **NO el porcentaje de voto esperado en primera vuelta**. Esta distinción es fundamental y es la principal fuente de error del modelo (ver Sección 11).

### 3.3. Boca de Urna (Exit Polls)

Tres encuestadoras publicaron boca de urna el día de la elección, tras el cierre de votación:

| Fuente | Hora aprox. | Muestra | Peso asignado (promedio) |
|---|---|---|---|
| Ipsos Perú | ~6:00pm | n = 18,144 | 50% |
| Datum Internacional | ~6:00pm | No publicada | 30% |
| CIT | ~6:00pm | No publicada | 20% |

**Ponderación de boca de urna:** Se asignaron pesos basados en la calidad histórica de las boca de urna de cada encuestadora. Ipsos, con la muestra más grande y mejor track record, recibe el mayor peso.

### 3.4. Disclaimers Generales

1. **Este modelo es experimental.** Fue desarrollado como ejercicio académico y de ciencia de datos. No pretende reemplazar análisis profesionales de opinión pública.
2. **Las predicciones NO son resultados.** Ninguna predicción, por precisa que sea, constituye un resultado electoral.
3. **Boca de urna ≠ resultado oficial.** Las boca de urna tienen margen de error propio y pueden diferir del conteo oficial.
4. **Polymarket tiene sesgos propios.** Los participantes de Polymarket son mayoritariamente no-peruanos, con acceso limitado a información local y posibles sesgos de nombre-reconocimiento.
5. **No se garantiza reproducibilidad exacta.** Las simulaciones Monte Carlo producen resultados ligeramente diferentes en cada corrida.
6. **Conflictos de interés:** El autor no tiene posiciones abiertas en Polymarket ni afiliación con ningún partido político peruano.

---

## 4. Cronología del Día Electoral

El modelo generó 20 corridas automáticas el 12 de abril de 2026. A continuación, la evolución temporal de las predicciones para los 6 candidatos principales:

### 4.1. Timeline de Corridas (hora Lima)

| Hora Lima | Hora UTC | Keiko | Belmont | Aliaga | Álvarez | Sánchez | Nieto | Evento |
|---|---|---|---|---|---|---|---|---|
| ~11:00am | 16:00 | 26.2% | 18.8% | 12.6% | 8.5% | 3.9% | 3.2% | Apertura de mesas |
| ~12:00pm | 17:00 | 26.2% | 18.8% | 12.6% | 8.5% | 3.9% | 3.2% | Votación en curso |
| ~2:00pm | 19:00 | 26.2% | 18.8% | 12.6% | 8.5% | 3.9% | 3.2% | Sin cambios PM |
| ~4:00pm | 21:00 | 26.2% | 18.8% | 12.6% | 8.5% | 3.9% | 3.2% | Últimas horas votación |
| **~6:00pm** | **23:00** | **26.2%** | **18.8%** | **12.6%** | **8.5%** | **3.9%** | **3.2%** | **Cierre oficial votación** |
| ~6:15pm | 23:15 | — | — | — | — | — | — | BdU comienzan a circular |
| ~6:30pm | 23:30 | 28.1% | 14.5% | 12.8% | 5.5% | 6.5% | 6.2% | PM absorbe BdU parciales |
| **~6:45pm** | **23:45** | **30.0%** | **11.3%** | **13.0%** | **2.5%** | **8.9%** | **9.1%** | **FOTO FINAL** |
| ~7:14pm | 00:14+1 | — | — | — | — | — | — | Modelo congelado |

### 4.2. Observaciones del Timeline

- **11:00am–6:00pm (7 horas):** El modelo permaneció esencialmente estático. Polymarket no movió significativamente durante la jornada de votación, por lo que las predicciones no cambiaron.
- **6:00pm–6:45pm (45 minutos):** Movimiento masivo. En solo 45 minutos, Polymarket incorporó las boca de urna y el modelo se reconfiguró dramáticamente:
  - Keiko: 26.2% → 30.0% (+3.8) — PM subió de 39% a 45.5%
  - Belmont: 18.8% → 11.3% (−7.5) — La mayor corrección, PM bajó de 29.3% a 15.5%
  - Álvarez: 8.5% → 2.5% (−6.0) — Colapso detectado, PM cayó de 8.8% a 0.2%
  - Sánchez: 3.9% → 8.9% (+5.0) — Emergió como contendor, PM subió de 3.7% a 11.0%
  - Nieto: 3.2% → 9.1% (+5.9) — Similar salto, PM subió de 3.1% a 11.6%
  - Aliaga: 12.6% → 13.0% (+0.4) — Relativamente estable

La velocidad con que Polymarket incorporó la información de boca de urna demuestra la eficiencia del mercado como mecanismo de agregación, aunque también amplificó el sesgo P(ganar) vs % voto (particularmente para Keiko).

---

## 5. Resultados de Boca de Urna (Referencia)

### 5.1. Datos por Encuestadora

#### Ipsos Perú (n = 18,144)

| # | Candidato | % |
|---|---|---|
| 1 | Keiko Fujimori | 16.6% |
| 2 | Carlos Sánchez | 12.1% |
| 3 | Ricardo Belmont | 11.8% |
| 4 | Rafael López Aliaga | 11.0% |
| 5 | Hernando de Soto Nieto | 10.7% |

#### Datum Internacional

| # | Candidato | % |
|---|---|---|
| 1 | Keiko Fujimori | 16.5% |
| 2 | Rafael López Aliaga | 12.8% |
| 3 | Hernando de Soto Nieto | 11.6% |
| 4 | Ricardo Belmont | 10.5% |
| 5 | Carlos Sánchez | 10.0% |

#### CIT

| # | Candidato | % |
|---|---|---|
| 1 | Keiko Fujimori | 19.8% |
| 2 | Rafael López Aliaga | 13.0% |
| 3 | Ricardo Belmont | 12.9% |

### 5.2. Promedio Ponderado de Boca de Urna

Ponderación: **Ipsos 50% · Datum 30% · CIT 20%**

| # | Candidato | Ipsos | Datum | CIT | Promedio Pond. |
|---|---|---|---|---|---|
| 1 | Keiko Fujimori | 16.6% | 16.5% | 19.8% | **17.2%** |
| 2 | Rafael López Aliaga | 11.0% | 12.8% | 13.0% | **11.9%** |
| 3 | Ricardo Belmont | 11.8% | 10.5% | 12.9% | **11.6%** |
| 4 | Carlos Sánchez | 12.1% | 10.0% | — | **11.3%** |
| 5 | Hernando de Soto Nieto | 10.7% | 11.6% | — | **11.0%** |

**Nota:** CIT solo publicó resultados para los primeros 3 candidatos. Para Sánchez y Nieto, el promedio ponderado usa solo Ipsos (62.5%) y Datum (37.5%).

### 5.3. Dispersión entre Encuestadoras

| Candidato | Rango BdU | Spread |
|---|---|---|
| Keiko Fujimori | 16.5%–19.8% | 3.3 pp |
| Rafael López Aliaga | 11.0%–13.0% | 2.0 pp |
| Ricardo Belmont | 10.5%–12.9% | 2.4 pp |
| Carlos Sánchez | 10.0%–12.1% | 2.1 pp |
| Hernando de Soto Nieto | 10.7%–11.6% | 0.9 pp |

Keiko presentó la mayor dispersión (3.3 pp), lo que sugiere que incluso las boca de urna tienen dificultad para medir su voto real. Nieto fue el más consistente entre encuestadoras (0.9 pp de spread).

---

## 6. Snapshot 1: Corrida de las 6:00pm (Pre-Boca de Urna)

**Timestamp:** 12 de abril 2026, 18:00 Lima (23:00 UTC)  
**Trigger:** `auto_polymarket_update`  
**Alpha (α):** 0.77  

### 6.1. Predicciones Completas — Top 10

| # | Candidato | Media | IC 90% [p10–p90] | Encuestas | Polymarket | Posterior |
|---|---|---|---|---|---|---|
| 1 | Keiko Fujimori | **26.2%** | [19.5 – 32.8] | 14.9% | 39.0% | 33.5% |
| 2 | Ricardo Belmont | **18.8%** | [14.3 – 23.4] | 5.8% | 29.3% | 23.9% |
| 3 | Rafael López Aliaga | **12.6%** | [9.7 – 15.9] | 12.9% | 15.0% | 14.5% |
| 4 | José Álvarez | **8.5%** | [6.1 – 11.5] | 12.7% | 8.8% | 9.7% |
| 5 | Carlos Sánchez | **3.9%** | [1.7 – 6.2] | 7.9% | 3.7% | 4.7% |
| 6 | Hernando de Soto Nieto | **3.2%** | [1.1 – 5.1] | 6.5% | 3.1% | 3.9% |

### 6.2. Comparación con Boca de Urna

| Candidato | Modelo 6pm | BdU Pond. | Error | Dirección |
|---|---|---|---|---|
| Keiko Fujimori | 26.2% | 17.2% | **+9.0** | Sobreestimación |
| Ricardo Belmont | 18.8% | 11.6% | **+7.2** | Sobreestimación |
| Rafael López Aliaga | 12.6% | 11.9% | **+0.7** | Leve sobre |
| Carlos Sánchez | 3.9% | 11.3% | **−7.4** | Subestimación grave |
| Hernando de Soto Nieto | 3.2% | 11.0% | **−7.8** | Subestimación grave |

**MAE top-5:** (9.0 + 7.2 + 0.7 + 7.4 + 7.8) / 5 = **6.42 pts**

### 6.3. Cobertura IC 90%

| Candidato | IC 90% | BdU | ¿Cubierto? |
|---|---|---|---|
| Keiko Fujimori | [19.5, 32.8] | 17.2% | **NO** (por debajo) |
| Ricardo Belmont | [14.3, 23.4] | 11.6% | **NO** (por debajo) |
| Rafael López Aliaga | [9.7, 15.9] | 11.9% | **SI** |
| Carlos Sánchez | [1.7, 6.2] | 11.3% | **NO** (por encima) |
| Hernando de Soto Nieto | [1.1, 5.1] | 11.0% | **NO** (por encima) |

**Cobertura:** 1/5 = **20%** (esperado: 90%). Intervalo de credibilidad severamente mal calibrado.

### 6.4. Diagnóstico

La corrida de las 6pm refleja el estado de Polymarket **antes** de las boca de urna. El mercado tenía una visión muy diferente de la realidad:
- **Keiko y Belmont inflados:** PM les asignaba 39% y 29.3% respectivamente, reflejando alta P(ganar) pero no % de voto real.
- **Sánchez y Nieto invisibles:** PM les daba apenas 3.7% y 3.1%, sugiriendo que el mercado no los consideraba contendores serios.
- **Aliaga bien calibrado:** El único candidato donde encuestas (12.9%) y PM (15.0%) convergían cerca del resultado real (11.9%).

---

## 7. Snapshot 2: FOTO FINAL de las 6:45pm (Post-Boca de Urna)

**Timestamp:** 12 de abril 2026, 18:45 Lima (23:45 UTC)  
**Trigger:** `final_election_day`  
**Alpha (α):** 0.77  

### 7.1. Predicciones Completas — Top 10

| # | Candidato | Media | IC 90% [p10–p90] | Encuestas | Polymarket | Posterior |
|---|---|---|---|---|---|---|
| 1 | Keiko Fujimori | **30.0%** | [22.8 – 37.3] | 14.9% | 45.5% | 38.5% |
| 2 | Rafael López Aliaga | **13.0%** | [9.7 – 16.4] | 12.9% | 18.0% | 16.8% |
| 3 | Ricardo Belmont | **11.3%** | [8.7 – 14.5] | 5.8% | 15.5% | 13.3% |
| 4 | Hernando de Soto Nieto | **9.1%** | [6.6 – 12.2] | 6.5% | 11.6% | 10.4% |
| 5 | Carlos Sánchez | **8.9%** | [6.5 – 12.0] | 7.9% | 11.0% | 10.3% |
| 6 | José Álvarez | **2.5%** | [0.3 – 4.3] | 12.7% | 0.2% | 3.1% |

### 7.2. Comparación con Boca de Urna

| Candidato | FOTO FINAL | BdU Pond. | Error | Dirección |
|---|---|---|---|---|
| Keiko Fujimori | 30.0% | 17.2% | **+12.8** | Sobreestimación severa |
| Rafael López Aliaga | 13.0% | 11.9% | **+1.1** | Leve sobre |
| Ricardo Belmont | 11.3% | 11.6% | **−0.3** | Casi exacto |
| Hernando de Soto Nieto | 9.1% | 11.0% | **−1.9** | Leve sub |
| Carlos Sánchez | 8.9% | 11.3% | **−2.4** | Subestimación |

**MAE top-5:** (12.8 + 1.1 + 0.3 + 1.9 + 2.4) / 5 = **3.70 pts**  
**MAE top-5 sin Keiko:** (1.1 + 0.3 + 1.9 + 2.4) / 4 = **1.43 pts**

### 7.3. Cobertura IC 90%

| Candidato | IC 90% | BdU | ¿Cubierto? |
|---|---|---|---|
| Keiko Fujimori | [22.8, 37.3] | 17.2% | **NO** (por debajo) |
| Rafael López Aliaga | [9.7, 16.4] | 11.9% | **SI** |
| Ricardo Belmont | [8.7, 14.5] | 11.6% | **SI** |
| Hernando de Soto Nieto | [6.6, 12.2] | 11.0% | **SI** |
| Carlos Sánchez | [6.5, 12.0] | 11.3% | **SI** |

**Cobertura:** 4/5 = **80%** (esperado: 90%). Aceptable — solo Keiko fuera del intervalo.

### 7.4. Ranking

| Posición | FOTO FINAL | BdU Ponderada | ¿Match? |
|---|---|---|---|
| 1º | Keiko Fujimori | Keiko Fujimori | **SI** |
| 2º | Rafael López Aliaga | Rafael López Aliaga | **SI** |
| 3º | Ricardo Belmont | Ricardo Belmont | **SI** |
| 4º | Hernando de Soto Nieto | Carlos Sánchez | NO (invertidos) |
| 5º | Carlos Sánchez | Hernando de Soto Nieto | NO (invertidos) |

**Top-1:** Correcto. **Top-2:** Correcto. **Top-3 (set + orden):** Correcto.  
Los puestos 4 y 5 están invertidos, pero la diferencia entre Nieto (9.1%) y Sánchez (8.9%) en el modelo es de solo 0.2 pp — esencialmente un empate técnico.

### 7.5. Diagnóstico

La FOTO FINAL muestra un modelo mucho más calibrado que la corrida de las 6pm para todos los candidatos **excepto Keiko**:
- **Belmont corregido:** PM bajó de 29.3% a 15.5% en 45 minutos, acercando el modelo dramáticamente al resultado real.
- **Sánchez y Nieto emergieron:** PM los subió de ~3% a ~11%, reflejando correctamente su fuerza real.
- **Álvarez colapsó:** PM lo hundió de 8.8% a 0.2%, señal de que el mercado detectó rápidamente su derrota.
- **Keiko empeoró:** PM la subió de 39% a 45.5%, alejándose aún más del resultado real. Esto confirma que PM cotiza P(ganar), no % voto — a pesar de perder en % de voto (quedó primera pero lejos de una mayoría), su probabilidad de ganar la elección overall subió.

---

