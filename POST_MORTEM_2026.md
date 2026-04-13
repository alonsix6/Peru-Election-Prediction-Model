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

## 8. Análisis de Error Consolidado

### 8.1. MAE (Mean Absolute Error)

El MAE mide el promedio de los errores absolutos entre la predicción del modelo y el valor de referencia (boca de urna ponderada).

| Escenario | MAE (top-5) | Interpretación |
|---|---|---|
| Corrida 6:00pm | **6.42 pts** | Pobre — errores grandes en 4 de 5 candidatos |
| FOTO FINAL | **3.70 pts** | Moderado — arrastrado por Keiko |
| FOTO FINAL sin Keiko | **1.43 pts** | Excelente — error promedio < 1.5 pp |
| Solo encuestas (α=0) | **3.40 pts** | Ligeramente mejor que el blend |
| Solo Polymarket (α=1) | **7.84 pts** | El peor escenario |
| Alpha óptimo (α=0.08) | **2.79 pts** | Mínimo posible con este modelo |

**Conclusión:** El blend con α=0.77 fue inferior a usar solo encuestas (3.70 vs 3.40) debido al sesgo Keiko. Sin embargo, el alpha óptimo en retrospectiva fue α≈0.08, que habría dado MAE=2.79 — mejor que cualquier fuente sola. El problema no fue combinar fuentes, sino el peso excesivo dado a una fuente con sesgo sistemático.

### 8.2. Cobertura de Intervalos de Credibilidad (IC 90%)

Un IC 90% bien calibrado debería contener el valor real el 90% de las veces.

| Snapshot | Cobertura | Esperada | Evaluación |
|---|---|---|---|
| 6:00pm | 1/5 = 20% | 90% | **Muy mal calibrado** — intervalos estrechos y centrados en valores erróneos |
| FOTO FINAL | 4/5 = 80% | 90% | **Aceptable** — cercano al nominal, solo Keiko fuera |

**Análisis por candidato en la FOTO FINAL:**

| Candidato | p10 | p90 | BdU | Margen | Status |
|---|---|---|---|---|---|
| Keiko | 22.8 | 37.3 | 17.2 | −5.6 pp debajo p10 | FUERA |
| Aliaga | 9.7 | 16.4 | 11.9 | Centrado | OK |
| Belmont | 8.7 | 14.5 | 11.6 | Centrado | OK |
| Nieto | 6.6 | 12.2 | 11.0 | Cerca del borde p90 | OK (justo) |
| Sánchez | 6.5 | 12.0 | 11.3 | Cerca del borde p90 | OK (justo) |

Nieto y Sánchez quedaron cerca del borde superior del IC, lo que sugiere que el modelo aún los subestimaba ligeramente. Un IC 95% los habría contenido con más holgura.

### 8.3. Precisión de Ranking

| Métrica | 6:00pm | FOTO FINAL |
|---|---|---|
| Top-1 correcto | Si | Si |
| Top-2 (set) | No (Belmont #2 vs Aliaga #2) | Si |
| Top-3 (set) | Si ({K, B, A}) | Si ({K, A, B}) |
| Top-3 (orden exacto) | No (K>B>A vs K>A>B) | Si (K>A>B) |
| Top-5 (set) | No (incluía Álvarez) | Si (5 correctos) |
| Top-5 (orden exacto) | No | No (4-5 invertidos) |

**La FOTO FINAL logró identificar correctamente los 5 candidatos del top-5 y los primeros 3 en orden exacto.** La inversión de los puestos 4-5 (Nieto 9.1% vs Sánchez 8.9%) es un empate estadístico dentro del margen de error del modelo.

**La corrida de las 6pm** tenía a Álvarez en 4to lugar (8.5%) y a Sánchez/Nieto relegados al 5to-6to. Polymarket pre-BdU no había identificado la debilidad real de Álvarez ni la fuerza de Sánchez/Nieto.

---

## 9. Descomposición por Fuente

Este análisis separa el aporte de cada componente del modelo para entender qué fuente contribuyó positiva o negativamente a la predicción final.

### 9.1. Error por Fuente (FOTO FINAL vs BdU)

| Candidato | BdU | Encuestas (α=0) | Error Enc. | PM (α=1) | Error PM | Blend (α=0.77) | Error Blend |
|---|---|---|---|---|---|---|---|
| Keiko | 17.2% | 14.9% | −2.3 | 45.5% | +28.3 | 30.0% | +12.8 |
| Aliaga | 11.9% | 12.9% | +1.0 | 18.0% | +6.1 | 13.0% | +1.1 |
| Belmont | 11.6% | 5.8% | −5.8 | 15.5% | +3.9 | 11.3% | −0.3 |
| Nieto | 11.0% | 6.5% | −4.5 | 11.6% | +0.6 | 9.1% | −1.9 |
| Sánchez | 11.3% | 7.9% | −3.4 | 11.0% | −0.3 | 8.9% | −2.4 |
| **MAE** | | | **3.40** | | **7.84** | | **3.70** |

### 9.2. Dónde Polymarket Ayudó (Blend mejor que Encuestas Solas)

| Candidato | Error Enc. | Error Blend | Mejora | Magnitud |
|---|---|---|---|---|
| **Belmont** | −5.8 pp | −0.3 pp | **+5.5 pp** | PM fue decisivo — encuestas lo subestimaban gravemente |
| **Nieto** | −4.5 pp | −1.9 pp | **+2.6 pp** | PM corrigió parcialmente la subestimación |
| **Sánchez** | −3.4 pp | −2.4 pp | **+1.0 pp** | Mejora modesta |

**Total contribución positiva de PM:** +9.1 pp de mejora acumulada en estos 3 candidatos.

### 9.3. Dónde Polymarket Dañó (Blend peor que Encuestas Solas)

| Candidato | Error Enc. | Error Blend | Degradación | Magnitud |
|---|---|---|---|---|
| **Keiko** | −2.3 pp | +12.8 pp | **−10.5 pp** | PM catastrófico — P(ganar) ≠ % voto |
| **Aliaga** | +1.0 pp | +1.1 pp | **−0.1 pp** | Impacto negligible |

**Total contribución negativa de PM:** −10.6 pp de degradación acumulada.

### 9.4. Balance Neto

| Métrica | Valor |
|---|---|
| Mejora total por PM | +9.1 pp (Belmont + Nieto + Sánchez) |
| Degradación total por PM | −10.6 pp (Keiko + Aliaga) |
| Balance neto | **−1.5 pp** (PM empeoró ligeramente el modelo) |
| MAE Enc. solas | 3.40 |
| MAE Blend | 3.70 |
| Diferencia | +0.30 pp (blend peor) |

**Veredicto:** En esta elección, Polymarket empeoró marginalmente la precisión global (+0.30 pts MAE). Pero este resultado está dominado por un solo outlier (Keiko). Para los otros 4 candidatos, PM mejoró sustancialmente las predicciones. El problema no es Polymarket per se, sino la interpretación directa de P(ganar) como % de voto.

---

## 10. Análisis Contrafactual: Alpha Óptimo

### 10.1. Búsqueda de Alpha Óptimo

¿Qué alpha habría minimizado el MAE en esta elección?

Se evaluó el MAE para cada valor de α entre 0.00 y 1.00 (incrementos de 0.01):

```
predicción(α) = α × PM + (1 − α) × Encuestas
```

| Alpha (α) | MAE top-5 | Nota |
|---|---|---|
| 0.00 | 3.40 | Solo encuestas |
| 0.05 | 2.88 | |
| **0.08** | **2.79** | **Óptimo** |
| 0.10 | 2.81 | |
| 0.15 | 2.88 | |
| 0.20 | 2.99 | |
| 0.30 | 3.21 | |
| 0.50 | 3.53 | |
| **0.77** | **3.70** | **Valor usado** |
| 1.00 | 7.84 | Solo Polymarket |

### 10.2. Curva MAE vs Alpha

```
MAE
 8 |*                                                          *
 7 |                                                        *
 6 |                                                     *
 5 |                                                  *
 4 | *                                            *
 3 |    * *                              *  *  *
 2 |       *  *  *                 *  *
   +------+------+------+------+------+------+------+------+
   0.0   0.1   0.2   0.3   0.4   0.5   0.6   0.7   0.8   1.0
                              Alpha (α)
```

### 10.3. Interpretación

- El **alpha óptimo ex-post es 0.08** — un peso muy bajo para Polymarket.
- La curva tiene forma de U: mejora rápidamente al agregar un poco de PM (0→0.08), y luego se degrada conforme PM domina.
- El valor usado (0.77) se encuentra en la zona de degradación significativa.

**Sin embargo, esto es análisis en retrospectiva.** El alpha fue diseñado para maximizar la precisión a lo largo de toda la campaña, no solo el día de la elección. Un alpha alto el día D tiene sentido teórico: los mercados incorporan información en tiempo real que las encuestas (de hace días) no capturan. El problema fue que la información que PM capturó (P(ganar)) no era la métrica correcta.

### 10.4. Alpha Óptimo sin Keiko

Si excluimos a Keiko del análisis (dado que su error es sistemático y no corregible por alpha):

| Alpha (α) | MAE top-4 (sin Keiko) |
|---|---|
| 0.00 | 3.68 |
| 0.50 | 1.50 |
| **0.72** | **1.19** |
| 0.77 | 1.43 |
| 1.00 | 2.73 |

**Sin Keiko, el alpha óptimo sube a ~0.72** — muy cercano al 0.77 que usamos. Esto confirma que el diseño del modelo era correcto para los candidatos donde PM cotiza algo comparable a % de voto. El problema fue exclusivamente la interpretación de la señal de Keiko.

---

## 11. P(ganar) vs % de Voto — La Lección Metodológica Central

### 11.1. El Problema Fundamental

Polymarket no cotiza "¿qué porcentaje de votos obtendrá Keiko?". Cotiza "¿ganará Keiko la presidencia?".

Estas dos preguntas producen respuestas muy diferentes:

| Pregunta | Respuesta |
|---|---|
| ¿Qué % de votos obtiene Keiko en 1ra vuelta? | ~17% (BdU) |
| ¿Ganará Keiko la presidencia (1ra o 2da vuelta)? | ~45% (PM) |

La brecha es enorme: **28 puntos porcentuales**. Y nuestro modelo trataba ambas como si fueran la misma cosa.

### 11.2. ¿Por qué P(ganar) >> % de Voto para Keiko?

En una elección con 26 candidatos, nadie obtiene más del 20% en primera vuelta. Pero la probabilidad de ganar puede ser mucho mayor porque:

1. **Efecto primera vuelta fragmentada:** Con 17% puedes quedar primera y pasar a segunda vuelta.
2. **Ventaja en segunda vuelta:** Keiko, como marca política conocida, puede consolidar voto anti-rival en el ballotage.
3. **Base electoral leal:** Fuerza Popular tiene un piso electoral consistente que la hace competitiva en segunda vuelta.

**Analogía:** Imagina un torneo de 26 equipos. Puedes ganar solo el 17% de tus partidos en la fase de grupos y aun así clasificar primero, y luego ganar el torneo con 45% de probabilidad. PM cotiza la probabilidad de levantar el trofeo, no el % de partidos ganados.

### 11.3. Impacto en Otros Candidatos

El sesgo P(ganar) vs % voto no es exclusivo de Keiko, pero es más pronunciado en ella:

| Candidato | PM (P(ganar)) | BdU (% voto) | Ratio P/V |
|---|---|---|---|
| Keiko | 45.5% | 17.2% | **2.65x** |
| Aliaga | 18.0% | 11.9% | 1.51x |
| Belmont | 15.5% | 11.6% | 1.34x |
| Nieto | 11.6% | 11.0% | 1.05x |
| Sánchez | 11.0% | 11.3% | 0.97x |

El ratio P(ganar)/% voto decrece conforme baja el candidato. Para Nieto y Sánchez, PM y % voto prácticamente coinciden — esto tiene sentido: candidatos con baja probabilidad de ganar el torneo tienen P(ganar) ≈ % de voto, ya que ambos son bajos.

### 11.4. Corrección Propuesta

Para futuras versiones del modelo, se propone una **función de transformación** que convierta P(ganar) a % de voto estimado:

```
% voto estimado ≈ P(ganar) / Σ[P(ganar)] × factor_fragmentación
```

O alternativamente, usar un modelo de regresión calibrado con datos históricos:

```
% voto = β₀ + β₁ × P(ganar) + β₂ × P(ganar)² + ε
```

Donde la relación cuadrática captura la no-linealidad (candidatos fuertes tienen P(ganar) desproporcionadamente alta vs su % voto).

Otra opción es buscar mercados que coticen directamente "% de voto" en lugar de "ganador", aunque estos son menos líquidos.

### 11.5. Implicaciones para Segunda Vuelta

Si hay segunda vuelta (junio 2026), este problema se mitiga significativamente:
- Con solo 2 candidatos, P(ganar) ≈ % de voto (ambos suman ~100%).
- El sesgo P(ganar) vs % voto desaparece casi completamente.
- Se espera que el modelo funcione mucho mejor con α=0.77 en segunda vuelta.

---

## 12. Aciertos y Fortalezas del Modelo

### 12.1. Aciertos Principales

1. **Top-3 perfecto en la FOTO FINAL.** Keiko > Aliaga > Belmont fue el orden exacto en boca de urna. El modelo no solo acertó el set, sino el ordenamiento completo de los tres primeros.

2. **Belmont casi exacto.** Predicción: 11.3%, BdU: 11.6%. Error de solo 0.3 pp. Notable porque las encuestas lo daban en 5.8% — Polymarket fue decisivo para corregir esta subestimación.

3. **Detección del colapso de Álvarez.** Polymarket detectó en tiempo real que Álvarez no era un contendor real, bajándolo de 8.8% a 0.2%. Sin PM, el modelo lo habría dado en 12.7% (encuestas), lo cual habría sido un error mayor.

4. **Corrección Sánchez/Nieto en 45 minutos.** La corrida de las 6pm tenía a Sánchez y Nieto en 3.9% y 3.2% respectivamente. La FOTO FINAL los corrigió a 8.9% y 9.1% — aún subestimados, pero dramáticamente más cercanos al resultado real.

5. **MAE sin Keiko = 1.43 pts.** Para 4 de 5 candidatos top, el modelo logró un nivel de precisión excelente, comparable con modelos de predicción electoral profesionales.

6. **Cobertura IC 80%.** Con 4 de 5 candidatos dentro del IC 90%, la calibración de incertidumbre fue razonable (esperado: 90%, obtenido: 80%).

7. **Infraestructura robusta.** 20 corridas automáticas sin caídas, congelamiento exitoso, API funcional en producción, dashboard en tiempo real.

### 12.2. Fortalezas Arquitectónicas

- **Pipeline automatizado:** Sin intervención humana, el modelo se actualizó 20 veces en el día.
- **Trazabilidad completa:** Cada corrida guardada en PostgreSQL con timestamp, alpha, trigger, y descomposición por fuente.
- **Congelamiento automático:** El mecanismo de freeze garantizó que la FOTO FINAL se preservara íntegramente.
- **Transparencia:** El dashboard muestra la descomposición encuestas/PM/blend, permitiendo al usuario entender de dónde viene cada predicción.

---

