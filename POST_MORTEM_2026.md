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

