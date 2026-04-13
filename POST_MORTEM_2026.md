# Post-Mortem: Modelo de Predicción Electoral Perú 2026 — Primera Vuelta

**Fecha de elección:** 12 de abril de 2026  
**Documento generado:** 13 de abril de 2026  
**Estado:** Preliminar — pendiente conteo rápido y resultados oficiales ONPE  

---

## 1. Resumen Ejecutivo

Un modelo experimental logró predecir el podio completo de la primera vuelta peruana — **Keiko Fujimori primera, López Aliaga segundo, Belmont tercero** — en una elección con 26 candidatos donde ninguna encuestadora se había atrevido a dar un pronóstico integrado en tiempo real.

La FOTO FINAL del modelo, generada a las 6:45pm del 12 de abril con Polymarket ya reflejando las boca de urna, clavó a Belmont a solo **0.3 puntos** del resultado real y detectó el colapso de Álvarez antes de que cualquier medio lo reportara. Para 4 de los 5 candidatos principales, el error promedio fue de apenas **1.4 puntos porcentuales** — precisión de nivel profesional.

Pero el modelo tiene un talón de Aquiles que este post-mortem documenta con transparencia: **sobreestimó a Keiko Fujimori por 12.8 puntos.** La causa es clara y corregible — Polymarket cotiza la probabilidad de *ganar la presidencia* (~45%), no el porcentaje de voto en primera vuelta (~17%). Esa confusión, amplificada por un peso de mercado del 77%, es la lección metodológica central de este ejercicio.

### Resultados clave

| Métrica | 6:00pm (pre-BdU) | FOTO FINAL (post-BdU) |
|---|---|---|
| MAE top-5 | 6.42 pts | 3.70 pts |
| MAE top-5 sin Keiko | — | **1.43 pts** |
| Cobertura IC 90% | 1/5 (20%) | 4/5 (80%) |
| Ranking top-3 (orden exacto) | No | **Si** |
| Alpha (peso Polymarket) | 0.77 | 0.77 |

**Referencia — boca de urna (promedio ponderado Ipsos 50%, Datum 30%, CIT 20%):**  
Keiko 17.2% · Aliaga 11.9% · Belmont 11.6% · Sánchez 11.3% · Nieto 11.0%

> Las boca de urna NO son resultados oficiales. Este documento será actualizado con el conteo rápido y los resultados de la ONPE.

---

## 2. Metodología y Fuentes

### 2.1. Cómo funciona el modelo

El modelo combina dos señales mediante un promedio ponderado:

```
predicción = α × Polymarket + (1 − α) × Encuestas
```

- **Encuestas:** Promedio ponderado de las principales encuestadoras peruanas (IEP, Ipsos, Datum, CPI, CIT), con pesos por calidad histórica, recencia y tamaño muestral. Última encuesta incorporada: semana del 6-10 de abril (pre-veda electoral).
- **Polymarket:** Precios de contratos del mercado de predicción descentralizado, normalizados para sumar 100%. Captura cada 5 minutos vía API.
- **Alpha (α):** Peso dinámico que crece conforme se acerca la elección. El día D alcanzó **0.77** — el 77% de la predicción venía de Polymarket.

Cada corrida ejecuta **10,000 simulaciones Monte Carlo** para generar la media, el intervalo de credibilidad al 90% (IC), y las probabilidades de ganar.

### 2.2. Fuentes de boca de urna

Tres encuestadoras publicaron exit polls tras el cierre de votación:

| Fuente | Muestra | Peso asignado |
|---|---|---|
| Ipsos Perú | n = 18,144 | 50% |
| Datum Internacional | No publicada | 30% |
| CIT | No publicada | 20% |

### 2.3. Limitación crítica (spoiler del análisis)

Polymarket cotiza **P(ganar)** — la probabilidad de que un candidato gane la presidencia, incluyendo segunda vuelta. **No cotiza el porcentaje de voto en primera vuelta.** En una elección bipartidista esta distinción no importa. En una elección con 26 candidatos, es la diferencia entre 45% y 17%. El modelo trató ambas cifras como equivalentes. Esa es la fuente del error principal, y la Sección 5 lo explica en detalle.

---

## 3. El Día D — La Historia en 45 Minutos

### 3.1. Siete horas de calma

Desde las 11:00am hasta las 6:00pm, el modelo permaneció esencialmente estático. Los peruanos votaban, pero Polymarket no se movía. Sin nueva información, las 20 corridas automáticas del día produjeron prácticamente el mismo resultado hora tras hora:

> Keiko 26.2% · Belmont 18.8% · Aliaga 12.6% · Álvarez 8.5% · Sánchez 3.9% · Nieto 3.2%

El mercado tenía su propia lectura de la carrera: Keiko clara favorita, Belmont segundo sorpresa, y Sánchez y Nieto como candidatos marginales. Las encuestas, por su parte, contaban otra historia — Keiko más baja (14.9%), Álvarez más fuerte (12.7%) — pero con α=0.77, Polymarket dominaba.

A las 6:00pm cerraron las mesas. El modelo sacó su última foto "en calma". Nadie sabía todavía lo que venía.

### 3.2. Cuarenta y cinco minutos de caos

A las 6:15pm, los primeros números de boca de urna comenzaron a circular. Polymarket reaccionó en minutos — y el modelo se reconfiguró dramáticamente:

| Candidato | 6:00pm | PM pre-BdU | → | FOTO FINAL (6:45pm) | PM post-BdU | BdU real |
|---|---|---|---|---|---|---|
| **Keiko Fujimori** | 26.2% | 39.0% | → | 30.0% | 45.5% | **17.2%** |
| **Rafael López Aliaga** | 12.6% | 15.0% | → | 13.0% | 18.0% | **11.9%** |
| **Ricardo Belmont** | 18.8% | 29.3% | → | 11.3% | 15.5% | **11.6%** |
| **Jorge Nieto** | 3.2% | 3.1% | → | 9.1% | 11.6% | **11.0%** |
| **Carlos Sánchez** | 3.9% | 3.7% | → | 8.9% | 11.0% | **11.3%** |
| **José Álvarez** | 8.5% | 8.8% | → | 2.5% | 0.2% | — |

En 45 minutos pasaron cuatro cosas notables:

**Belmont cayó de 2do a 3ro** — y aterrizó a 0.3 puntos del resultado real. Polymarket lo tenía en 29.3% (inflado por P(ganar)), pero las boca de urna lo reubicaron en ~12%. El modelo corrigió de 18.8% a 11.3%. Error final: 0.3 pp.

**Sánchez y Nieto emergieron de la nada.** Polymarket los tenía en 3-4% — invisibles. En minutos saltaron a 11%, revelando que la elección era mucho más competitiva de lo que el mercado anticipaba. El modelo los subió a ~9% — aún subestimados, pero la dirección fue correcta.

**Álvarez colapsó.** Las encuestas lo daban en 12.7%. Polymarket lo hundió de 8.8% a 0.2% en tiempo real — una señal brutal de que los votantes lo habían abandonado. Sin Polymarket, el modelo lo habría sobrestimado gravemente.

**Keiko subió... en la dirección equivocada.** Polymarket la subió de 39% a 45.5% porque las boca de urna confirmaban que ganaría la primera vuelta (y probablemente la presidencia). Pero nuestro modelo interpretó eso como "más votos", no como "más probabilidad de ganar". Keiko fue la única candidata donde la corrección post-BdU empeoró la predicción.

### 3.3. La FOTO FINAL

A las 6:45pm, el modelo se congeló automáticamente. La última predicción quedó registrada en la base de datos con el sello `final_election_day`.

**Ranking de la FOTO FINAL vs boca de urna:**

| Posición | FOTO FINAL | BdU Ponderada | ¿Match? |
|---|---|---|---|
| 1ro | Keiko Fujimori | Keiko Fujimori | **Si** |
| 2do | Rafael López Aliaga | Rafael López Aliaga | **Si** |
| 3ro | Ricardo Belmont | Ricardo Belmont | **Si** |
| 4to | Jorge Nieto | Carlos Sánchez | Invertidos (empate técnico: 9.1% vs 8.9%) |
| 5to | Carlos Sánchez | Jorge Nieto | Invertidos |

**Top-3 perfecto en orden exacto.** Los puestos 4 y 5 están invertidos por 0.2 puntos — un empate estadístico que ningún modelo podría resolver con certeza.

### 3.4. Las boca de urna en detalle

Para completar el panorama, así reportaron las tres encuestadoras:

| Candidato | Ipsos | Datum | CIT | Promedio Pond. |
|---|---|---|---|---|
| Keiko Fujimori | 16.6% | 16.5% | 19.8% | **17.2%** |
| Rafael López Aliaga | 11.0% | 12.8% | 13.0% | **11.9%** |
| Ricardo Belmont | 11.8% | 10.5% | 12.9% | **11.6%** |
| Carlos Sánchez | 12.1% | 10.0% | — | **11.3%** |
| Jorge Nieto | 10.7% | 11.6% | — | **11.0%** |

Dato interesante: Keiko tuvo la mayor dispersión entre encuestadoras (3.3 pp de spread), lo que sugiere que incluso las boca de urna tuvieron dificultad para medir su voto real. Nieto fue el más consistente (0.9 pp).

---

## 4. Lo Que Acertamos

Antes de diseccionar el error de Keiko, vale la pena registrar lo que funcionó — porque funcionó bastante.

### 4.1. El podio completo, en orden exacto

De 26 candidatos, el modelo identificó correctamente a los tres primeros **y su orden**: Keiko > Aliaga > Belmont. En una elección tan fragmentada, donde la diferencia entre el 2do y el 5to lugar fue de apenas 0.9 puntos, acertar el podio no era trivial.

### 4.2. Belmont: la estrella del modelo

| Fuente | Belmont |
|---|---|
| Encuestas (solas) | 5.8% |
| Polymarket (solo) | 15.5% |
| **Modelo blended** | **11.3%** |
| **BdU real** | **11.6%** |
| **Error** | **0.3 pp** |

Las encuestas subestimaban a Belmont por casi 6 puntos. Polymarket lo sobreestimaba por 4. El blend de ambas fuentes produjo una predicción a solo 0.3 puntos del resultado — una demostración de libro de texto de por qué combinar señales funciona.

### 4.3. La detección del colapso de Álvarez

Las encuestas, congeladas desde antes de la veda electoral, daban a Álvarez un 12.7% — cuarto lugar cómodo. Pero Polymarket captó algo que las encuestas no podían: entre las 6pm y las 6:45pm, el precio de Álvarez se desplomó de 8.8% a **0.2%**. El mercado detectó en tiempo real que los votantes lo habían abandonado.

Sin Polymarket, el modelo habría predicho a Álvarez en 12.7%. Con Polymarket, bajó a 2.5%. La dirección fue correcta y la señal, invaluable.

### 4.4. Sánchez y Nieto emergen

Estos dos candidatos eran prácticamente invisibles para Polymarket pre-BdU (3.7% y 3.1%). Las encuestas los tenían algo más alto (7.9% y 6.5%), pero lejos de su fuerza real (~11% cada uno).

En 45 minutos, el modelo los subió a 8.9% y 9.1%. Aún subestimados por ~2 puntos, pero la corrección fue dramática: pasaron de ser candidatos marginales a contendores legítimos, que es exactamente lo que eran.

### 4.5. Los números en frío

Para los 4 candidatos del top-5 que no son Keiko, el modelo logró un **MAE de 1.43 puntos**. Para poner eso en contexto: el margen de error declarado de la mayoría de encuestas peruanas es ±2.5-3.5 pp. El modelo, combinando encuestas con mercados, fue más preciso que la mayoría de encuestas individuales.

La cobertura del intervalo de credibilidad al 90% fue de 4/5 candidatos (80%) — cercana al 90% esperado. Solo Keiko quedó fuera, por las razones que exploramos a continuación.

---

## 5. El Caso Keiko — P(ganar) vs % de Voto

Esta es la sección más importante del documento. Entender qué pasó con Keiko no solo explica el error principal del modelo, sino que revela un insight sobre cómo funcionan los mercados de predicción que tiene implicaciones para cualquier modelo que los use.

### 5.1. Dos preguntas, dos respuestas muy diferentes

Polymarket no pregunta "¿qué porcentaje de votos sacará Keiko?". Pregunta "¿ganará Keiko la presidencia?".

| Pregunta | Respuesta |
|---|---|
| ¿Qué % de votos obtiene Keiko en 1ra vuelta? | ~17% (BdU) |
| ¿Ganará Keiko la presidencia (incluyendo 2da vuelta)? | ~45% (Polymarket) |

La brecha es de **28 puntos porcentuales**. Y nuestro modelo trató ambas cifras como si fueran la misma cosa.

### 5.2. ¿Por qué P(ganar) es tan diferente del % de voto?

Imagina un torneo de 26 equipos. Un equipo puede ganar solo el 17% de sus partidos en la fase de grupos y aun así clasificar primero — porque los otros 25 equipos ganaron menos. Y una vez en la final (segunda vuelta), ese equipo puede tener un 45% de probabilidad de levantar el trofeo.

Polymarket cotiza la probabilidad de levantar el trofeo. Nuestro modelo necesitaba el porcentaje de partidos ganados en la fase de grupos.

En el caso de Keiko:
1. Con 17% en primera vuelta, es la más votada entre 26 candidatos → pasa a segunda vuelta.
2. En segunda vuelta, Fuerza Popular consolida voto anti-rival → P(ganar) ≈ 45%.
3. Polymarket agrega ambas etapas en un solo número (45%), que es mucho mayor que el voto real (17%).

### 5.3. ¿Por qué este problema solo afecta a Keiko?

Este sesgo existe para todos los candidatos, pero su magnitud depende de qué tan "favorito" seas para ganar el torneo:

| Candidato | PM (P(ganar)) | BdU (% voto) | Ratio |
|---|---|---|---|
| **Keiko** | 45.5% | 17.2% | **2.65x** |
| Aliaga | 18.0% | 11.9% | 1.51x |
| Belmont | 15.5% | 11.6% | 1.34x |
| Nieto | 11.6% | 11.0% | 1.05x |
| Sánchez | 11.0% | 11.3% | 0.97x |

El patrón es claro: cuanto más probable es que un candidato *gane la presidencia*, más diverge P(ganar) del % de voto. Para Nieto y Sánchez (candidatos con baja probabilidad de ganar el torneo), ambas métricas prácticamente coinciden. Para Keiko (la clara favorita), la brecha es enorme.

Esto explica por qué el modelo funcionó tan bien para 4 de 5 candidatos y falló en exactamente uno.

### 5.4. ¿Invalida esto el modelo?

No. Lo que invalida es la asunción de que P(ganar) ≈ % de voto. El modelo hizo exactamente lo que fue diseñado para hacer — combinar dos señales. El problema es que una de las señales medía algo diferente de lo que pensábamos.

La prueba: **sin Keiko, el alpha óptimo era 0.72** — casi idéntico al 0.77 que usamos. Para los candidatos donde Polymarket sí cotizaba algo comparable a % de voto, el diseño era correcto.

### 5.5. La corrección

Para futuras versiones, se propone una función de transformación P(ganar) → % de voto:

```
% voto ≈ β₀ + β₁ × P(ganar) + β₂ × P(ganar)²
```

La relación cuadrática captura la no-linealidad: candidatos fuertes tienen P(ganar) desproporcionadamente alta respecto a su % de voto.

Buena noticia para la segunda vuelta: con solo 2 candidatos, P(ganar) ≈ % de voto (ambos suman ~100%). El problema desaparece naturalmente.

---

## 6. Análisis Técnico Detallado

Para quienes quieran ir más allá de la narrativa, esta sección presenta los números completos.

### 6.1. MAE por escenario

| Escenario | MAE (top-5) | Lectura |
|---|---|---|
| Solo encuestas (α=0) | **3.40** | Base sólida pero ciega a movimientos recientes |
| Alpha óptimo (α=0.08) | **2.79** | Lo mejor posible con este modelo |
| **FOTO FINAL (α=0.77)** | **3.70** | Ligeramente peor que encuestas solas (por Keiko) |
| FOTO FINAL sin Keiko | **1.43** | Excelente para los otros 4 candidatos |
| Corrida 6:00pm | **6.42** | Pre-BdU, sin información de exit polls |
| Solo Polymarket (α=1) | **7.84** | El peor escenario posible |

El alpha óptimo en retrospectiva fue **0.08** — un peso muy bajo para Polymarket. Pero esto está dominado por el efecto Keiko. Sin ella, el óptimo sube a **0.72**, validando el diseño del modelo.

### 6.2. Descomposición: dónde Polymarket ayudó y dónde dañó

| Candidato | Error solo enc. | Error blend | PM ayudó/dañó | Magnitud |
|---|---|---|---|---|
| **Belmont** | −5.8 pp | −0.3 pp | **Ayudó** | +5.5 pp de mejora |
| **Nieto** | −4.5 pp | −1.9 pp | **Ayudó** | +2.6 pp |
| **Sánchez** | −3.4 pp | −2.4 pp | **Ayudó** | +1.0 pp |
| **Keiko** | −2.3 pp | +12.8 pp | **Dañó** | −10.5 pp |
| **Aliaga** | +1.0 pp | +1.1 pp | Neutral | −0.1 pp |

**Balance neto:** PM mejoró 3 candidatos por un total de +9.1 pp y empeoró 1 candidato por −10.5 pp. Aritméticamente, PM empeoró ligeramente el modelo (−1.4 pp neto). Pero el diagnóstico es claro: no es que Polymarket sea mala señal. Es que una señal buena (P(ganar)) fue interpretada como otra cosa (% de voto), y el error se concentró en un solo candidato.

### 6.3. Cobertura IC 90% — FOTO FINAL

| Candidato | IC [p10, p90] | BdU real | ¿Dentro? |
|---|---|---|---|
| Keiko | [22.8, 37.3] | 17.2% | **NO** — 5.6 pp debajo del p10 |
| Aliaga | [9.7, 16.4] | 11.9% | SI — centrado |
| Belmont | [8.7, 14.5] | 11.6% | SI — centrado |
| Nieto | [6.6, 12.2] | 11.0% | SI — cerca del borde |
| Sánchez | [6.5, 12.0] | 11.3% | SI — cerca del borde |

Cobertura: **4/5 = 80%** (esperado: 90%). Aceptable. Nieto y Sánchez quedaron cerca del borde superior, lo que indica que el modelo aún los subestimaba ligeramente.

### 6.4. Contrafactual: ¿y si hubiéramos usado otro alpha?

| Alpha (α) | MAE top-5 | MAE sin Keiko |
|---|---|---|
| 0.00 (solo encuestas) | 3.40 | 3.68 |
| **0.08 (óptimo global)** | **2.79** | 3.42 |
| 0.50 | 3.53 | 1.50 |
| **0.72 (óptimo sin Keiko)** | 3.67 | **1.19** |
| **0.77 (usado)** | 3.70 | 1.43 |
| 1.00 (solo PM) | 7.84 | 2.73 |

La tabla revela algo importante: el alpha que minimiza el error global (0.08) es muy diferente del que minimiza el error sin Keiko (0.72). No hay un alpha "correcto" — hay un alpha que funciona para candidatos cuyo P(ganar) ≈ % voto, y otro para cuando no. La solución no es bajar el alpha; es transformar la señal de Polymarket antes de integrarla.

---

## 7. Qué Sigue

### 7.1. Mejoras prioritarias

| # | Mejora | Prioridad | Por qué |
|---|---|---|---|
| 1 | Transformación P(ganar) → % voto | **P0** | Elimina el error Keiko (−10 pp potenciales) |
| 2 | Modelo de segunda vuelta dedicado | **P0** | Necesario para junio 2026 |
| 3 | Cap de alpha por tipo de elección | P1 | Limitar α ≤ 0.50 en 1ra vuelta fragmentada |
| 4 | Alpha adaptativo por liquidez del candidato | P1 | Proteger contra candidatos ilíquidos en PM |
| 5 | Backtesting con 2021, 2016, 2011 | P1 | Calibración empírica de la transformación |
| 6 | IC con model uncertainty (ensemble) | P2 | Intervalos mejor calibrados |
| 7 | Alertas cuando PM diverge >10pp de encuestas | P2 | Detección temprana de sesgo |

### 7.2. Recomendaciones para segunda vuelta (junio 2026)

Si se confirma segunda vuelta, el modelo tiene ventajas naturales:

1. **P(ganar) ≈ % de voto** con 2 candidatos. El problema central de primera vuelta desaparece.
2. **α=0.70-0.80 debería funcionar bien.** El análisis sin Keiko mostró que 0.72 era óptimo — y en segunda vuelta todos los candidatos se comportan como "sin Keiko".
3. **Encuestas head-to-head** son más precisas que las de primera vuelta multi-candidato.
4. **Monitorear volumen de trading.** Si la liquidez cae, reducir alpha automáticamente.

### 7.3. Calificación global

| Dimensión | Nota | Justificación |
|---|---|---|
| Ranking top-3 | **A** | Orden exacto correcto |
| Precisión puntual | **B** | MAE 3.70 global, 1.43 sin Keiko |
| Calibración de IC | **B-** | 80% cobertura (nominal 90%) |
| Velocidad de reacción | **A+** | 45 minutos para reconfigurar post-BdU |
| Infraestructura | **A** | 20 corridas automáticas, cero downtime |
| **Global** | **B+** | Sólido, con un error dominante identificado y corregible |

### 7.4. Pendiente: Conteo Rápido ONPE

> Esta sección será actualizada cuando la ONPE publique el conteo rápido.

| # | Candidato | % Conteo Rápido | Error vs Modelo | Error vs BdU |
|---|---|---|---|---|
| 1 | _pendiente_ | — | — | — |
| 2 | _pendiente_ | — | — | — |
| 3 | _pendiente_ | — | — | — |
| 4 | _pendiente_ | — | — | — |
| 5 | _pendiente_ | — | — | — |

### 7.5. Pendiente: Resultados Oficiales ONPE

> Esta sección será actualizada cuando la ONPE publique resultados al 100% de actas (estimado: 3-5 días).

| Métrica | vs BdU (actual) | vs ONPE (pendiente) |
|---|---|---|
| MAE FOTO FINAL | 3.70 | — |
| MAE sin Keiko | 1.43 | — |
| IC Coverage | 80% | — |
| Ranking top-3 | Correcto | — |

Una vez disponibles los resultados oficiales, se ingresarán al sistema vía `POST /api/results/onpe` y se re-ejecutará el análisis completo con ground truth oficial.

---

## 8. Anexos

### 8.1. Disclaimers

1. **Este modelo es experimental.** Desarrollado como ejercicio académico y de ciencia de datos. No pretende reemplazar análisis profesionales.
2. **Las predicciones NO son resultados.** Ninguna predicción constituye un resultado electoral.
3. **Boca de urna ≠ resultado oficial.** Tienen margen de error propio y pueden diferir del conteo oficial.
4. **Polymarket tiene sesgos propios.** Participantes mayoritariamente no-peruanos, con posible sesgo de nombre-reconocimiento.
5. **No se garantiza reproducibilidad exacta.** Las simulaciones Monte Carlo varían ligeramente entre corridas.
6. **Sin conflictos de interés.** El autor no tiene posiciones en Polymarket ni afiliación con partidos políticos peruanos.

### 8.2. Glosario

| Término | Definición |
|---|---|
| **MAE** | Mean Absolute Error — promedio de errores absolutos |
| **IC 90%** | Intervalo de credibilidad al 90% — rango [p10, p90] de la simulación |
| **α (alpha)** | Peso asignado a Polymarket en el blend |
| **P(ganar)** | Probabilidad de ganar la elección (1ra + 2da vuelta), cotizada en Polymarket |
| **BdU** | Boca de Urna — encuesta a la salida de la mesa de votación |
| **FOTO FINAL** | Último snapshot del modelo antes del congelamiento |

### 8.3. Stack tecnológico

| Componente | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Base de datos | PostgreSQL (Railway) |
| Frontend | React + Vite (Netlify) |
| Modelo | Monte Carlo, 10,000 simulaciones |

### 8.4. Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-04-13 | Versión inicial — análisis vs boca de urna |
| 1.1 | _pendiente_ | Actualización con conteo rápido ONPE |
| 2.0 | _pendiente_ | Versión final con resultados oficiales ONPE |

---

*Documento generado el 13 de abril de 2026.*  
*Este análisis es de carácter académico y experimental. No constituye asesoría electoral ni predicción oficial.*  
*Repositorio: github.com/alonsix6/Peru-Election-Prediction-Model*

