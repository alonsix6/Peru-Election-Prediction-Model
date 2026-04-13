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

