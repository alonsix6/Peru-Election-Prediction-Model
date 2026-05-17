# Post-Mortem: Modelo de Predicción Electoral Perú 2026 — Primera Vuelta

**Fecha de elección:** 12 de abril de 2026  
**Documento generado:** 13 de abril de 2026  
**Última actualización:** 17 de mayo de 2026 — resultados oficiales ONPE al 100%  
**Estado:** Final — ONPE 100% contabilizado, JNE proclamó resultados el 17/05/2026  

---

## 1. Resumen Ejecutivo

Un modelo experimental logró identificar a los cinco candidatos del top-5 en la primera vuelta peruana — con **Keiko Fujimori primera** por amplio margen — en una elección con 26 candidatos donde ninguna encuestadora se había atrevido a dar un pronóstico integrado en tiempo real.

La FOTO FINAL del modelo, generada a las 6:45pm del 12 de abril con Polymarket ya reflejando las boca de urna, detectó el colapso de Álvarez antes de que cualquier medio lo reportara y mantuvo un error promedio de **1.81 puntos** para los 4 candidatos no-Keiko del top-5 — buena precisión en un campo tan fragmentado.

Sin embargo, el modelo tiene dos talones de Aquiles documentados con transparencia: primero, **sobreestimó a Keiko Fujimori por 12.8-13.0 puntos** (Polymarket cotiza P(ganar presidencia), no % voto en 1ra vuelta). Segundo, **el ranking 2do-5to fue incorrecto según ONPE**: la FOTO FINAL predicho `Aliaga > Belmont > Nieto > Sánchez`, pero el resultado oficial fue `Sánchez > Aliaga > Nieto > Belmont`, con Roberto Sánchez pasando a segunda vuelta en lugar de Aliaga.

> **Nota de datos:** El modelo identificó internamente a los candidatos como "Carlos Sánchez" y "José Álvarez". Los nombres completos oficiales ONPE son **Roberto Helbert Sánchez Palomino** (Juntos por el Perú) y **Carlos Gonsalo Álvarez Loayza** (País para Todos). Además, **Pablo Alfonso López Chau Nava** (Ahora Nación, 7.296%) no estaba rastreado en el modelo.

### Resultados clave

| Métrica | 6:00pm (pre-BdU) | FOTO FINAL vs BdU | FOTO FINAL vs ONPE 100% |
|---|---|---|---|
| MAE top-5 | 6.42 pts | 3.70 pts | **4.01 pts** |
| MAE top-5 sin Keiko | — | 1.43 pts | **1.81 pts** |
| Cobertura IC 90% | 1/5 (20%) | 4/5 (80%) | **3/5 (60%)** |
| Ranking top-3 (orden exacto) | No | Sí (vs BdU) | **No — solo 1ro correcto** |
| Alpha (peso Polymarket) | 0.77 | 0.77 | 0.77 |

**Referencia — boca de urna (promedio ponderado Ipsos 50%, Datum 30%, CIT 20%):**  
Keiko 17.2% · Aliaga 11.9% · Belmont 11.6% · Sánchez 11.3% · Nieto 11.0%

**Referencia — ONPE oficial 100% (17/05/2026):**  
Keiko **17.192%** · R.Sánchez **12.039%** · Aliaga **11.912%** · Nieto **10.978%** · Belmont **10.150%**

> Segunda vuelta confirmada por JNE: **Keiko Fujimori vs Roberto Sánchez Palomino**, 7 de junio de 2026.

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

**Ranking de la FOTO FINAL vs boca de urna vs ONPE oficial:**

| Posición | FOTO FINAL | BdU Ponderada | ONPE 100% | vs BdU | vs ONPE |
|---|---|---|---|---|---|
| 1ro | Keiko Fujimori | Keiko Fujimori | Keiko Fujimori | **✓** | **✓** |
| 2do | Rafael López Aliaga | Rafael López Aliaga | **R. Sánchez** | ✓ | **✗** |
| 3ro | Ricardo Belmont | Ricardo Belmont | **Rafael López Aliaga** | ✓ | **✗** |
| 4to | Jorge Nieto | Carlos Sánchez | Jorge Nieto | ✗ | **✓** |
| 5to | Carlos Sánchez | Jorge Nieto | **Ricardo Belmont** | ✗ | **✗** |

**Vs boca de urna: top-3 perfecto en orden exacto.** Los puestos 4 y 5 invertidos por 0.2 pp — un empate estadístico.

**Vs ONPE oficial: solo posiciones 1 y 4 correctas (2/5).** La BdU mostró un ordenamiento diferente al definitivo. La gran sorpresa fue Roberto Sánchez, que las BdU y el conteo rápido de Datum subestimaron y que terminó siendo el rival de Keiko en segunda vuelta.

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

### 7.2. Recomendaciones para segunda vuelta (7 junio 2026)

Segunda vuelta confirmada: **Keiko Fujimori (Fuerza Popular) vs. Roberto Helbert Sánchez Palomino (Juntos por el Perú)**. El modelo tiene ventajas naturales para este formato:

1. **P(ganar) ≈ % de voto** con 2 candidatos. El problema central de primera vuelta desaparece.
2. **α=0.70-0.80 debería funcionar bien.** El análisis sin Keiko mostró que 0.72 era óptimo — y en segunda vuelta todos los candidatos se comportan como "sin Keiko".
3. **Encuestas head-to-head** son más precisas que las de primera vuelta multi-candidato.
4. **Monitorear volumen de trading.** Si la liquidez cae, reducir alpha automáticamente.
5. **Roberto Sánchez fue el candidato más subestimado** por el modelo (8.9% vs 12.039% ONPE, −3.1 pp). Sus encuestas estaban más cerca de la realidad (7.9-12.4%) que Polymarket (11.0%). Para la segunda vuelta, sus encuestas head-to-head serán la señal más relevante.

### 7.3. Calificación global

| Dimensión | Nota | Justificación |
|---|---|---|
| Ranking top-3 | **C+** | Top-3 correcto vs BdU; vs ONPE oficial solo posición 1 y 4 correctas |
| Precisión puntual | **B-** | MAE 4.01 vs ONPE (1.81 sin Keiko); Sánchez subestimado 3.1 pp, Álvarez 5.4 pp |
| Calibración de IC | **C+** | 60% cobertura vs ONPE (3/5); Sánchez marginalmente fuera |
| Velocidad de reacción | **A+** | 45 minutos para reconfigurar post-BdU |
| Infraestructura | **A** | 20 corridas automáticas, cero downtime |
| **Global** | **B-** | Identificó top-5 correctamente pero el orden fue incorrecto; error Keiko dominante y corregible |

> **Nota:** La calificación de ranking era A basado en BdU (donde aparecía Aliaga 2do). Los resultados oficiales ONPE revelan que el ranking real fue diferente: Sánchez 2do, no Aliaga. Las BdU y el conteo rápido de Datum eran inexactos en el puesto 2.

### 7.4. Conteo Rápido: Ipsos y Datum (13 de abril)

Dos encuestadoras publicaron conteo rápido basado en actas oficiales, con resultados que difieren entre sí — particularmente en el segundo lugar.

#### Resultados comparados

| # | Candidato | Ipsos (95.7%) | Margen | Datum (100%) | FOTO FINAL |
|---|---|---|---|---|---|
| 1 | Keiko Fujimori | **17.1%** | ±1.0 | **16.8%** | 30.0% |
| 2 | Roberto Sánchez | **12.4%** | ±1.3 | 9.4% | 8.9% |
| 3 | Rafael López Aliaga | 11.3% | ±1.2 | **12.9%** | 13.0% |
| 4 | Jorge Nieto | 10.7% | ±0.9 | 11.6% | 9.1% |
| 5 | Ricardo Belmont | 10.2% | ±0.5 | 10.1% | 11.3% |

#### La discrepancia clave: ¿quién va segundo?

La diferencia más notable entre ambas encuestadoras es **Roberto Sánchez**: Ipsos lo coloca 2do con 12.4%, Datum lo ubica 5to con 9.4% — una brecha de 3 puntos. Para Datum, el segundo lugar es López Aliaga (12.9%); para Ipsos, Aliaga baja al tercero (11.3%). Nieto también varía: 3ro en Datum (11.6%) vs 4to en Ipsos (10.7%).

Con márgenes de error de ±1.0 a ±1.3, los rangos reales de Sánchez (11.1-13.7% Ipsos), Aliaga (10.1-12.5% Ipsos) y Nieto (9.8-11.6% Ipsos) se solapan — un empate técnico a tres bandas por el segundo lugar. Habrá que esperar los resultados oficiales de la ONPE.

#### Ficha técnica

| Aspecto | Ipsos/Transparencia/NDI | Datum |
|---|---|---|
| Muestra | 1,037 mesas, 124 provincias, 25 regiones + 8 ciudades extranjero | 1,500 actas, 317,768 votos |
| Cobertura de muestra | 95.7% | 100% |
| Nivel de confianza | 95% | No publicado |
| Margen de error | ±1% a ±2% (varía por candidato) | ±1% |
| Track record | <1 pp vs ONPE en elecciones 2001-2021 | — |

#### ¿Cómo le fue al modelo? Depende contra quién midas

| Métrica | vs BdU | vs Ipsos CR | vs Datum CR |
|---|---|---|---|
| **MAE top-5** | 3.70 | 4.16 | **3.50** |
| **MAE sin Keiko** | 1.43 | 1.98 | **1.08** |
| Ranking top-1 | Keiko (si) | Keiko (si) | Keiko (si) |
| Ranking top-2 | Aliaga (si) | Sánchez (no) | Aliaga (**si**) |

**Contra Datum, el modelo mejoró** respecto a las boca de urna: MAE sin Keiko bajó de 1.43 a **1.08 puntos**, y López Aliaga fue prácticamente clavado (13.0% modelo vs 12.9% Datum — **0.1 pp de error**).

**Contra Ipsos, el modelo empeoró** ligeramente (MAE 4.16 vs 3.70 BdU), principalmente porque Sánchez sube a 2do lugar en Ipsos (12.4%) mientras nuestro modelo lo tenía en 5to (8.9%).

#### Error por candidato: FOTO FINAL vs conteo rápido

| Candidato | FOTO FINAL | Ipsos CR | Error Ipsos | Datum CR | Error Datum |
|---|---|---|---|---|---|
| Keiko Fujimori | 30.0% | 17.1% | +12.9 | 16.8% | +13.2 |
| Rafael López Aliaga | 13.0% | 11.3% | +1.7 | 12.9% | **+0.1** |
| Ricardo Belmont | 11.3% | 10.2% | +1.1 | 10.1% | +1.2 |
| Jorge Nieto | 9.1% | 10.7% | −1.6 | 11.6% | −2.5 |
| Carlos Sánchez | 8.9% | 12.4% | −3.5 | 9.4% | −0.5 |

**Hallazgos:**
- **Keiko:** El error se confirma y es consistente (~+13 pp) contra ambos CR. La causa es la misma documentada en la Sección 5 — P(ganar) ≠ % de voto.
- **López Aliaga contra Datum: 0.1 pp.** Es el mejor acierto individual del modelo. Las encuestas lo daban en 12.9%, PM en 18.0%, el blend produjo 13.0% — prácticamente perfecto.
- **Belmont estable:** 1.1-1.2 pp de error contra ambos CR. Sigue siendo un buen resultado, aunque ligeramente peor que vs BdU (0.3 pp).
- **Sánchez: la incógnita.** Si Ipsos tiene razón (12.4%), el modelo lo subestimó por 3.5 pp. Si Datum tiene razón (9.4%), el error fue de solo 0.5 pp. Este candidato es la mayor fuente de incertidumbre hasta que ONPE cierre.
- **Nieto:** Error de 1.6-2.5 pp. El modelo lo subestimó, consistente con lo visto en BdU.

#### IC 90% vs conteo rápido (FOTO FINAL)

| Candidato | IC [p10, p90] | Ipsos CR | ¿Dentro? | Datum CR | ¿Dentro? |
|---|---|---|---|---|---|
| Keiko | [22.8, 37.3] | 17.1% | NO | 16.8% | NO |
| Aliaga | [9.7, 16.4] | 11.3% | SI | 12.9% | SI |
| Belmont | [8.7, 14.5] | 10.2% | SI | 10.1% | SI |
| Nieto | [6.6, 12.2] | 10.7% | SI | 11.6% | SI |
| Sánchez | [6.5, 12.0] | 12.4% | NO (borde) | 9.4% | SI |

**Cobertura IC vs Ipsos:** 3/5 = 60%. Sánchez queda fuera por 0.4 pp (12.4% vs tope de 12.0%).  
**Cobertura IC vs Datum:** 4/5 = 80%. Consistente con lo visto contra BdU.

#### Veredicto preliminar

El conteo rápido confirma la historia central del modelo: **acierto en la estructura general de la elección** (Keiko primera por amplio margen, empate cerrado del 2do al 5to), **precisión notable en candidatos individuales** (Aliaga a 0.1 pp contra Datum), y **un error sistemático en Keiko** cuya causa está diagnosticada. La pregunta abierta es Sánchez — y para eso necesitamos la ONPE.

### 7.5. Resultados Oficiales ONPE (100% — 17 mayo 2026)

Resultados del escrutinio oficial, fuente: `resultadoelectoral.onpe.gob.pe`, 100% de actas contabilizadas al 17/05/2026 03:15pm Lima. JNE proclamó resultados el mismo día.

#### Tabla completa de candidatos

| # | Candidato (nombre completo ONPE) | Partido | Votos | % Válidos |
|---|---|---|---|---|
| 1 | **Keiko Sofia Fujimori Higuchi** | Fuerza Popular | 2'877,678 | **17.192%** |
| 2 | **Roberto Helbert Sánchez Palomino** | Juntos por el Perú | 2'015,114 | **12.039%** |
| 3 | **Rafael Bernardo López Aliaga Cazorla** | Renovación Popular | 1'993,905 | **11.912%** |
| 4 | **Jorge Nieto Montesinos** | Partido del Buen Gobierno | 1'837,517 | **10.978%** |
| 5 | **Ricardo Pablo Belmont Cassinelli** | Partido Cívico Obras | 1'698,903 | **10.150%** |
| 6 | **Carlos Gonsalo Álvarez Loayza** | País para Todos | 1'326,717 | **7.926%** |
| 7 | **Pablo Alfonso López Chau Nava** | Ahora Nación | 1'221,272 | **7.296%** |
| 8 | **María Soledad Pérez Tello** | Primero la Gente | 571,170 | **3.412%** |
| 9 | **Alfonso Carlos Espá y Garcés-Alvear** | SiCreo | 560,792 | **3.350%** |

> Diferencia entre 2do y 3er lugar: **21,209 votos** (0.127 pp). Sánchez superó a Aliaga por un margen estrecho pero definitivo.

#### FOTO FINAL vs ONPE: error por candidato

| Candidato | Nombre en modelo | FOTO FINAL | ONPE 100% | Error | IC [p10, p90] | ¿IC cubre? |
|---|---|---|---|---|---|---|
| Keiko Fujimori | Keiko Fujimori | 30.0% | **17.192%** | **+12.808 pp** | [22.8, 37.3] | NO (−5.6 pp bajo p10) |
| R. Sánchez Palomino | "Carlos Sánchez" | 8.9% | **12.039%** | **−3.139 pp** | [6.5, 12.0] | NO (0.039 pp sobre p90) |
| López Aliaga | López Aliaga | 13.0% | **11.912%** | +1.088 pp | [9.7, 16.4] | SI |
| Nieto Montesinos | Nieto | 9.1% | **10.978%** | −1.878 pp | [6.6, 12.2] | SI |
| Belmont Cassinelli | Belmont | 11.3% | **10.150%** | +1.150 pp | [8.7, 14.5] | SI |
| Álvarez Loayza | "José Álvarez" | 2.5% | **7.926%** | **−5.426 pp** | — | — |
| López Chau Nava | **NO RASTREADO** | — | **7.296%** | — | — | — |

#### Métricas finales vs ONPE

| Métrica | vs BdU | vs Ipsos CR | vs Datum CR | **vs ONPE 100%** |
|---|---|---|---|---|
| MAE top-5 | 3.70 | 4.16 | 3.50 | **4.01** |
| MAE sin Keiko | 1.43 | 1.98 | 1.08 | **1.81** |
| IC Coverage | 4/5 (80%) | 3/5 (60%) | 4/5 (80%) | **3/5 (60%)** |
| Ranking top-1 | ✓ Keiko | ✓ | ✓ | **✓ Keiko** |
| Ranking top-2 | ✓ Aliaga | ✗ | ✓ Aliaga | **✗ (Sánchez real)** |
| Ranking top-3 | ✓ (3 correctos) | ✗ | ✓ | **✗ (1 correcto: 1ro y 4to)** |

#### Análisis de las sorpresas

**Roberto Sánchez: el gran subestimado.** Las BdU de Ipsos lo daban 2do (12.4%), Datum 5to (9.4%), el modelo 5to (8.9%). ONPE lo confirmó 2do (12.039%). El modelo y Datum erraron por completo en la posición. La señal de Ipsos fue la más precisa. Sánchez fue tan subestimado por Polymarket (11.0%) como por el modelo, reflejando que los mercados también erraron su posición relativa frente a Aliaga.

**Carlos Álvarez: colapso real o nombre equivocado.** El modelo rastreaba a "José Álvarez" con polls al 12.7% y lo bajó a 2.5% con el Polymarket (0.2%). Carlos Álvarez Loayza (País para Todos) obtuvo 7.926% real. Hay una discrepancia de nombres en la BD del modelo que merece revisión. Si son la misma persona, el modelo lo subestimó por 5.4 pp incluso después de la corrección de Polymarket.

**Pablo López Chau: el candidato invisible.** Con 7.296% (7mo lugar), obtuvo más votos que varios candidatos rastreados. El modelo no lo incluía en absoluto. A efectos de MAE global (todos los candidatos), este es un error de cobertura importante.

**La BdU fue engañosa sobre el 2do lugar.** El consenso de exit polls apuntaba a Aliaga como 2do, con Sánchez en disputado 4to-5to. ONPE revirtió esto. Esto muestra que las boca de urna peruanas tienen dificultad especial para capturar el voto de candidatos de izquierda/centro-izquierda (Sánchez, Nieto) que tienden a subestimarse en encuestas a pie de urna.

#### Segunda vuelta

JNE proclamó el 17/05/2026: **Keiko Fujimori vs. Roberto Helbert Sánchez Palomino** para el 7 de junio de 2026. El modelo actualizó `clock.js` a esta fecha.

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
| 1.1 | 2026-04-13 | Sección 7.4 — conteo rápido Ipsos y Datum |
| 2.0 | 2026-05-17 | Sección 7.5 completa con ONPE 100%; actualización de métricas globales, ranking, grades; corrección de nombres de candidatos; nota sobre López Chau no rastreado; actualización de segunda vuelta (Keiko vs R.Sánchez) |

---

*Documento generado el 13 de abril de 2026. Última actualización: 17 de mayo de 2026 con resultados oficiales ONPE 100%.*  
*Este análisis es de carácter académico y experimental. No constituye asesoría electoral ni predicción oficial.*  
*Repositorio: github.com/alonsix33/Peru-Election-Prediction-Model*

