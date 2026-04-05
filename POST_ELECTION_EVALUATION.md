# Evaluación Post-Mortem del Modelo Electoral Perú 2026

## Documento de evaluación — para ejecutar después del 12 de abril de 2026

---

## 1. Datos a recopilar el 12 de abril

### Boca de urna (5pm Lima)
Registrar inmediatamente los resultados de boca de urna (Ipsos/Datum/CPI):

```
| Candidato | Boca de urna % |
|-----------|----------------|
| ...       | ...            |
```

### Conteo rápido ONPE (8-10pm Lima)
Registrar los resultados del conteo rápido al 100% de actas.

### Resultado oficial ONPE (días siguientes)
Insertar en la DB:
```sql
INSERT INTO historical_results (election_year, round, candidate, party, pct_actual, pct_valid_actual)
VALUES
  (2026, 1, 'Candidato', 'Partido', XX.XX, XX.XX),
  ...;
```

### Dato de Polymarket final
Capturar el último snapshot de Polymarket antes del cierre de mesas (5pm Lima).
Ya se guarda automáticamente en `polymarket_snapshots`.

---

## 2. Métricas de evaluación

### 2.1 Error por candidato (MAE)
Para cada candidato, comparar la última predicción pre-cierre vs resultado real:

```
Error = predicted_pct_mean - pct_actual_ONPE
MAE = promedio de |Error| para los top 6 candidatos
```

**Benchmark**: las encuestadoras individuales tuvieron MAE de 3.5 a 5.1 pts en 2021. Si nuestro modelo tiene MAE < 3.5, superamos a todas.

### 2.2 Calibración del IC 90%
De los top 10 candidatos, ¿cuántos cayeron dentro de su intervalo de confianza [p10, p90]?

```
Calibración = candidatos_dentro_IC / total_candidatos
Esperado: ~90% (9 de 10)
Si es < 70%: IC demasiado estrecho (sobre-confianza)
Si es > 95%: IC demasiado ancho (sub-confianza)
```

### 2.3 Ranking accuracy
¿El modelo predijo correctamente el orden de los top 3?
- Acertó el 1ro: sí/no
- Acertó el top-2 (segunda vuelta): sí/no
- Acertó el top-3: sí/no

### 2.4 Brier Score (probabilidades)
Para P(ganar) y P(segunda vuelta):
```
Brier = (1/N) × Σ (predicción - resultado)²
donde resultado = 1 si pasó, 0 si no
```
Menor = mejor. Un modelo perfecto tiene Brier = 0.

### 2.5 Polymarket vs Encuestas vs Modelo
Comparar quién acertó más:

```
| Fuente     | MAE top-6 | Acertó top-2 | Acertó 1ro |
|------------|-----------|--------------|------------|
| Modelo     |           |              |            |
| Polymarket |           |              |            |
| IEP        |           |              |            |
| Ipsos      |           |              |            |
| Datum      |           |              |            |
| CPI        |           |              |            |
| CIT        |           |              |            |
| CID        |           |              |            |
```

---

## 3. Preguntas específicas a responder

### Sobre primera vuelta
- ¿El modelo capturó al candidato que ganó la primera vuelta?
- ¿El error fue mayor para candidatos rurales (Sánchez)?
- ¿El techo de voto potencial estimado para Sánchez (22%) fue realista?
- ¿Los house effects corrigieron correctamente los sesgos de cada encuestadora?
- ¿El temporal drift (0.30 pts/día) fue apropiado o excesivo?

### Sobre Polymarket
- ¿Polymarket fue más preciso que las encuestas para el top-3?
- ¿El α dinámico (28% → 87%) mejoró la predicción conforme avanzó la veda?
- ¿El scraper capturó los movimientos importantes del mercado?
- Comparar predicción pre-veda vs predicción día de elección: ¿cuánto mejoró?

### Sobre Monte Carlo
- ¿Los shocks estocásticos (35% de sims) fueron útiles o excesivos?
- ¿Las fat tails (t-Student df=4) mejoraron los IC vs distribución normal?
- ¿El shock negativo al líder (15%) capturó algún colapso real?
- ¿El "efecto Castillo" (+5-12 pts a candidatos menores) se materializó?

### Sobre segunda vuelta
- Si hubo segunda vuelta: ¿la matriz de transferencia predijo correctamente?
- ¿La compresión logística (max 62%) fue realista?
- ¿El voto blanco predicho se acercó al real?
- ¿El efecto antifujimorismo se manifestó como modelamos?

---

## 4. Datos disponibles en la DB para la evaluación

### Consultas clave

**Historial completo de predicciones:**
```sql
SELECT generated_at_lima, candidate, predicted_pct_mean,
       predicted_pct_p10, predicted_pct_p90,
       prob_first_round, prob_win_overall,
       polls_pct, polymarket_pct, posterior_pct,
       polymarket_weight, electoral_phase
FROM model_predictions
WHERE trigger = 'auto_polymarket_update'
ORDER BY generated_at_lima ASC, predicted_pct_mean DESC;
```

**Evolución de Polymarket por candidato:**
```sql
SELECT captured_at_lima, candidate, probability, volume_usd, phase
FROM polymarket_snapshots
ORDER BY captured_at_lima ASC;
```

**Todas las encuestas con peso efectivo:**
```sql
SELECT p.field_end, ps.name as pollster, p.poll_type,
       p.sample_n, p.margin_error, ps.weight_multiplier
FROM polls p
JOIN pollsters ps ON p.pollster_id = ps.id
ORDER BY p.field_end DESC;
```

**Última predicción antes de la elección:**
```sql
SELECT * FROM model_predictions
WHERE trigger = 'auto_polymarket_update'
  AND generated_at_lima = (
    SELECT MAX(generated_at_lima) FROM model_predictions
    WHERE trigger = 'auto_polymarket_update'
      AND generated_at_lima < '2026-04-12T22:00:00Z'
  )
ORDER BY predicted_pct_mean DESC;
```

---

## 5. Posibles fallas anticipadas

### El modelo podría fallar si:

1. **Un candidato emergente invisible**: alguien que ninguna encuesta midió y Polymarket no lo tenía. Similar a Castillo 2021 pero más extremo. El modelo tiene shocks del 10% para esto, pero si el candidato invisible saca >15%, fallaremos.

2. **Las encuestas tienen sesgo sistémico**: si TODAS las encuestadoras subestiman al mismo candidato (como pasó con Castillo), el modelo hereda ese sesgo. IEP tiene más peso (1.25x) pero si IEP también falla, no hay corrección.

3. **Polymarket tiene información incorrecta**: si los traders apostaron por información falsa o manipularon el mercado, el modelo lo absorbe con 28-87% de peso.

4. **Evento de último minuto**: un evento que ocurre el mismo día de la elección (arresto, escándalo, desastre natural) que ninguna fuente captura a tiempo.

5. **Voto estratégico masivo**: si un bloque grande de votantes cambia de candidato en las últimas horas para evitar que un candidato específico pase a segunda vuelta. Las encuestas y Polymarket no capturan esto.

6. **Fragmentación extrema**: si los 6 primeros candidatos están todos entre 10-14%, los IC 90% se solapan tanto que cualquier predicción de ranking es casi aleatoria. En este escenario, el modelo no puede ser preciso — solo honesto sobre la incertidumbre.

### El modelo podría acertar porque:

1. **Combinación de fuentes**: ninguna fuente sola es suficiente. Encuestas + Polymarket + redistribución de indecisos + corrección por encuestadora = más info que cualquier encuesta individual.

2. **21 encuestas de 6 casas**: la diversidad de fuentes reduce el sesgo de cualquier encuestadora individual.

3. **Peso dinámico de Polymarket durante veda**: cuando las encuestas se congelaron, Polymarket siguió captando señales. Si algo se movió durante la veda, el modelo lo captó.

4. **IC honestos**: si los resultados caen dentro de los IC 90%, el modelo estaba bien calibrado aunque los puntos medios no fueran exactos.

5. **Escenarios de riesgo**: si el 50.8% de "top-2 no esperado" se materializó, el modelo lo había anticipado.

---

## 6. Comparación con otros modelos/analistas

Recopilar predicciones de:
- Encuestadoras individuales (última encuesta de cada una)
- Analistas políticos (compilar predicciones públicas)
- Polymarket precio final
- Otros modelos si existen
- Prensa internacional (CNN, BBC, etc.)

Comparar MAE de cada uno vs nuestro modelo.

---

## 7. Lecciones para el modelo de segunda vuelta

Si hay segunda vuelta (7 junio 2026), documentar:
- ¿Qué encuestadoras acertaron mejor en primera vuelta? → ajustar pesos
- ¿Polymarket fue útil? → ajustar α inicial
- ¿Los shocks fueron excesivos o insuficientes? → ajustar porcentajes
- ¿La matriz de transferencia fue correcta? → calibrar con data real
- ¿La compresión logística fue necesaria? → verificar con resultado real
- ¿El voto blanco predicho se acercó? → ajustar rejection discount

---

## 8. Parámetros del modelo a documentar

### Configuración al cierre (última corrida pre-elección)

| Parámetro | Valor |
|-----------|-------|
| Encuestas en el modelo | 21 |
| Casas encuestadoras | 6 (IEP, Datum, Ipsos, CPI, CIT, CID) |
| Simulaciones Monte Carlo | 10,000 |
| Distribución de errores | t-Student df=4 |
| Sigma base | 3.0 |
| Temporal drift | 0.30 pts/día |
| α Polymarket pre-veda | ~28.5% |
| α Polymarket día elección | 87% |
| Shock negativo al líder | 15% de sims, -5 a -15 pts |
| Shock negativo al #2 | 10% de sims, -5 a -12 pts |
| Shock positivo ("Castillo") | 10% de sims, +5 a +12 pts |
| Rejection discount | 0.35-0.55 (variable por sim) |
| Compresión logística max | 62% |
| Compresión k | 2.5 |
| Runoff uncertainty | 8.0 pts std |
| Cron interval | 30 min |
| Watchdog interval | 20 min |

### Pesos de encuestadoras
| Encuestadora | Peso | MAE 2021 |
|---|---|---|
| IEP | 1.25x | 3.50 |
| Datum | 1.10x | 4.20 |
| Ipsos | 1.00x | 4.80 |
| CPI | 0.95x | 5.10 |
| CIT | 0.85x | N/A |
| CID | 0.80x | N/A |

### Voto potencial CIT
| Candidato | Techo | Piso | Rechazo |
|---|---|---|---|
| López Aliaga | 27.7% | 14.6% | 50.8% |
| Keiko Fujimori | 18.5% | 10.8% | 62.7% |
| Carlos Álvarez | 18.4% | 4.2% | 50.2% |
| López Chau | 17.2% | 5.4% | 51.7% |
| Wolfgang Grozo | 14.0% | 5.5% | 45.6% |
| Sánchez Palomino | 22.0% (est.) | 6.0% | 48.0% |

---

## 9. Checklist post-elección

- [ ] Registrar boca de urna (5pm 12 abril)
- [ ] Registrar conteo rápido ONPE (8-10pm)
- [ ] Registrar resultado oficial ONPE (días siguientes)
- [ ] Insertar resultados en `historical_results`
- [ ] Exportar historial completo de predicciones de la DB
- [ ] Exportar historial completo de Polymarket snapshots
- [ ] Calcular MAE del modelo vs cada encuestadora
- [ ] Calcular calibración del IC 90%
- [ ] Calcular Brier Score de P(ganar) y P(segunda vuelta)
- [ ] Comparar Polymarket vs encuestas vs modelo
- [ ] Documentar lecciones aprendidas
- [ ] Decidir si activar modelo para segunda vuelta (7 junio)
- [ ] Si sí: recalibrar pesos de encuestadoras con data 2026

---

*Documento generado: 4 de abril de 2026*
*Modelo v2.0 — Alonso Ternero + Claude*
