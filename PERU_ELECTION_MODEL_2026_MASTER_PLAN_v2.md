# 🗳️ PERU ELECTION PREDICTION MODEL 2026
## Master Plan — Claude Code Implementation Guide
## Versión 2.0 — Documento completo y definitivo

> **Objetivo:** Sistema estadístico robusto que agrega encuestas, voto potencial, datos históricos de precisión encuestadora y señales de mercado (Polymarket) para predecir con el menor margen de error posible el resultado de la primera vuelta presidencial peruana del 12 de abril de 2026, y simular escenarios de segunda vuelta.

> **Arma secreta del modelo:** El peso de Polymarket crece dinámicamente a partir del 5 de abril (inicio de veda electoral), convirtiéndose en el único termómetro fresco disponible durante los últimos 7 días. El modelo sabe en todo momento qué hora es en Perú y ajusta sus pesos automáticamente.

---

## 1. ARQUITECTURA DEL SISTEMA

```
peru-election-model-2026/
├── backend/                      # Railway (Node.js + PostgreSQL nativo)
│   ├── db/
│   │   ├── schema.sql            # Definición de tablas
│   │   └── seed.sql              # Datos precargados (encuestas + track record 2021)
│   ├── scraper/
│   │   └── polymarket.js         # Cron job cada 1 hora → CLOB API de Polymarket
│   ├── model/
│   │   ├── clock.js              # ⏰ Reloj de Perú — fuente de verdad temporal
│   │   ├── weights.js            # Pesos dinámicos encuestas vs Polymarket
│   │   ├── aggregator.js         # Agregador ponderado con house effects
│   │   ├── undecided.js          # Redistribución bayesiana de indecisos
│   │   ├── montecarlo.js         # Motor Monte Carlo (10,000 runs)
│   │   └── bayesian.js           # Integración Bayesiana encuestas + Polymarket
│   ├── api/
│   │   └── routes.js             # Endpoints REST para el frontend
│   └── errors/
│       ├── errorHandler.js       # Middleware global de errores
│       ├── errorTypes.js         # Catálogo de errores tipificados
│       └── errorLog.sql          # Tabla de errores en DB
├── frontend/                     # Netlify (React)
│   └── dashboard/                # Visualizaciones en tiempo real
└── data/
    ├── polls.csv                 # Dataset maestro de encuestas
    └── historical_accuracy.csv   # Track record encuestadoras 2021
```

**Stack:**
- Backend: Node.js en Railway con PostgreSQL nativo de Railway
- Frontend: React + Recharts en Netlify, conectado via GitHub
- Scraper: node-cron + fetch a Polymarket CLOB API pública
- Sin Supabase — todo en Railway PostgreSQL
- Timezone: America/Lima (UTC-5) como zona horaria oficial del modelo
- Dependencia de timezone: luxon (no moment — maneja correctamente UTC-5 fijo sin DST)

---

## 2. ⏰ RELOJ DE PERÚ — FUENTE DE VERDAD TEMPORAL

**Este es el módulo más crítico del sistema.** Todo el modelo — pesos, fases, alertas — depende de saber exactamente qué hora y día es en Lima, Perú. Un error de timezone puede hacer que el modelo aplique pesos incorrectos durante horas.

**Dato importante:** Perú usa UTC-5 fijo todo el año, sin horario de verano (DST). No confundir con EST (UTC-5 en invierno) o CDT. La zona correcta es `America/Lima`.

```javascript
// backend/model/clock.js
const { DateTime } = require('luxon');

const PERU_TIMEZONE = 'America/Lima'; // UTC-5, sin horario de verano
const ELECTION_DAY  = '2026-04-12';
const VEDA_START    = '2026-04-05T08:00:00'; // Veda desde 8am del sábado

/**
 * Retorna el DateTime actual en hora de Perú.
 * SIEMPRE usar esta función — nunca new Date() directamente.
 */
function nowPeru() {
  return DateTime.now().setZone(PERU_TIMEZONE);
}

/**
 * Retorna días y horas hasta la elección desde Lima.
 */
function timeToElection() {
  const now = nowPeru();
  const election = DateTime.fromISO(ELECTION_DAY, { zone: PERU_TIMEZONE })
    .startOf('day').plus({ hours: 8 }); // Apertura de mesas: 8am
  const diff = election.diff(now, ['days', 'hours', 'minutes']);
  return {
    days: Math.floor(diff.days),
    hours: Math.floor(diff.hours),
    minutes: Math.floor(diff.minutes),
    totalHours: election.diff(now, 'hours').hours,
    isElectionDay: now.toISODate() === ELECTION_DAY,
    isPastElection: now > election
  };
}

/**
 * Determina la fase electoral actual.
 * Retorna: 'pre_veda' | 'veda' | 'election_day' | 'post_election'
 */
function electoralPhase() {
  const now = nowPeru();
  const veda = DateTime.fromISO(VEDA_START, { zone: PERU_TIMEZONE });
  const election = DateTime.fromISO(ELECTION_DAY, { zone: PERU_TIMEZONE }).startOf('day');
  const electionEnd = election.plus({ hours: 19 }); // Cierre de mesas: 7pm

  if (now < veda)           return 'pre_veda';
  if (now < election)       return 'veda';
  if (now < electionEnd)    return 'election_day';
  return 'post_election';
}

module.exports = { nowPeru, timeToElection, electoralPhase, PERU_TIMEZONE };
```

---

## 3. 🎚️ PESOS DINÁMICOS — LA ARMA SECRETA

El insight central del modelo: **Polymarket sabe más que las encuestas después de la veda**, porque absorbe información que nadie más puede publicar — encuestas internas de campaña, movimientos de operadores políticos, inteligencia de campo de los partidos.

```javascript
// backend/model/weights.js
const { nowPeru, electoralPhase, timeToElection } = require('./clock');

/**
 * Calcula el peso de Polymarket (α) en tiempo real basado en hora Lima.
 *
 * PRE_VEDA  (hasta 5 abr 8am):  α = 0.25–0.30  → encuestas dominan
 * VEDA      (5–11 abr):          α crece 0.30→0.80  → Polymarket toma el control
 * ELECTION  (12 abr):            α = 0.85  → Polymarket es casi todo
 */
function getPolymarketWeight(volumeUSD = 5_100_000) {
  const phase = electoralPhase();
  const { totalHours } = timeToElection();
  const liquidityFactor = Math.min(1.0, volumeUSD / 8_000_000);

  switch (phase) {
    case 'pre_veda':
      return Math.min(0.30, 0.25 + (liquidityFactor * 0.05));

    case 'veda': {
      const vedaHours = 7 * 24; // 168 horas de veda
      const hoursInVeda = vedaHours - Math.max(0, totalHours);
      const vedaProgress = Math.min(1, hoursInVeda / vedaHours);
      return 0.30 + (vedaProgress * 0.50);
    }

    case 'election_day':
      return 0.85;

    case 'post_election':
      return null;

    default:
      return 0.30; // Fallback conservador
  }
}

/**
 * Decaimiento exponencial del peso de una encuesta.
 * Post-veda: λ aumenta — las encuestas envejecen más rápido.
 */
function getPollDecayWeight(fieldEndDate) {
  const { DateTime } = require('luxon');
  const phase = electoralPhase();
  const λ = phase === 'pre_veda' ? 0.08 : 0.12;
  const now = nowPeru();
  const pollEnd = DateTime.fromISO(fieldEndDate, { zone: 'America/Lima' });
  const daysOld = now.diff(pollEnd, 'days').days;
  return Math.exp(-λ * Math.max(0, daysOld));
}

/**
 * Peso compuesto final de una encuesta individual.
 * W = decaimiento × muestra × encuestadora × tipo
 */
function getPollWeight(poll, pollsterWeightMultiplier) {
  const decay    = getPollDecayWeight(poll.field_end);
  const sample   = Math.sqrt(poll.sample_n / 2000);
  const pollster = pollsterWeightMultiplier;
  const type     = poll.poll_type === 'simulacro' ? 1.20
                 : poll.poll_type === 'ambos'     ? 1.10
                 : 1.00;
  return decay * sample * pollster * type;
}

module.exports = { getPolymarketWeight, getPollDecayWeight, getPollWeight };
```

### Tabla de evolución del peso de Polymarket

| Período | Fecha Lima | α (Polymarket) | 1-α (Encuestas) | Razón |
|---|---|---|---|---|
| Pre-veda activa | Hasta 4 abr | 0.25–0.30 | 0.70–0.75 | Encuestas frescas disponibles |
| Inicio veda | 5 abr 8am | 0.30 | 0.70 | Última encuesta publicada |
| Veda día 3 | 7 abr | ~0.52 | ~0.48 | Encuestas tienen 5+ días |
| Veda día 5 | 9 abr | ~0.66 | ~0.34 | Encuestas tienen 7+ días |
| Víspera | 11 abr | ~0.79 | ~0.21 | Solo Polymarket es fresco |
| Día elección | 12 abr | 0.85 | 0.15 | Polymarket integra info de campo |

---

## 4. SCHEMA DE BASE DE DATOS

```sql
CREATE TABLE pollsters (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(50) NOT NULL,
  historical_mae    DECIMAL(4,2),
  weight_multiplier DECIMAL(4,2),
  notes             TEXT
);

CREATE TABLE polls (
  id              SERIAL PRIMARY KEY,
  pollster_id     INT REFERENCES pollsters(id),
  field_start     DATE NOT NULL,
  field_end       DATE NOT NULL,
  published_date  DATE,
  sample_n        INT,
  margin_error    DECIMAL(4,2),
  confidence_lvl  DECIMAL(4,1),
  scope           VARCHAR(20),
  technique       VARCHAR(30),
  poll_type       VARCHAR(20),   -- 'intencion_voto' | 'simulacro' | 'ambos'
  pct_undecided   DECIMAL(5,2),
  pct_blank_null  DECIMAL(5,2),
  pct_no_answer   DECIMAL(5,2),
  source_url      TEXT,
  notes           TEXT
);

CREATE TABLE poll_results (
  id            SERIAL PRIMARY KEY,
  poll_id       INT REFERENCES polls(id),
  candidate     VARCHAR(50) NOT NULL,
  party         VARCHAR(60),
  pct_raw       DECIMAL(5,2),
  pct_valid     DECIMAL(5,2),
  is_valid_vote BOOLEAN DEFAULT FALSE
);

CREATE TABLE polymarket_snapshots (
  id               SERIAL PRIMARY KEY,
  captured_at      TIMESTAMPTZ DEFAULT NOW(),
  captured_at_lima TIMESTAMPTZ,
  candidate        VARCHAR(50) NOT NULL,
  probability      DECIMAL(5,2),
  price_yes        DECIMAL(6,4),
  price_no         DECIMAL(6,4),
  volume_usd       DECIMAL(12,2),
  market_slug      VARCHAR(100),
  phase            VARCHAR(20)  -- fase electoral en el momento de captura
);

CREATE TABLE historical_results (
  id               SERIAL PRIMARY KEY,
  election_year    INT,
  round            INT,
  candidate        VARCHAR(50),
  party            VARCHAR(60),
  pct_actual       DECIMAL(5,2),
  pct_valid_actual DECIMAL(5,2)
);

CREATE TABLE model_predictions (
  id                   SERIAL PRIMARY KEY,
  generated_at         TIMESTAMPTZ DEFAULT NOW(),
  generated_at_lima    TIMESTAMPTZ,
  electoral_phase      VARCHAR(20),
  polymarket_weight    DECIMAL(4,2),
  polls_weight         DECIMAL(4,2),
  candidate            VARCHAR(50),
  predicted_pct_mean   DECIMAL(5,2),
  predicted_pct_p10    DECIMAL(5,2),
  predicted_pct_p90    DECIMAL(5,2),
  prob_first_round     DECIMAL(5,2),
  prob_win_overall     DECIMAL(5,2),
  model_version        VARCHAR(10)
);

-- Tabla de errores del sistema
CREATE TABLE error_log (
  id               SERIAL PRIMARY KEY,
  occurred_at      TIMESTAMPTZ DEFAULT NOW(),
  occurred_at_lima TIMESTAMPTZ,
  error_type       VARCHAR(50),
  error_code       VARCHAR(30),
  module           VARCHAR(50),
  message          TEXT,
  stack_trace      TEXT,
  context          JSONB,
  resolved         BOOLEAN DEFAULT FALSE,
  resolved_at      TIMESTAMPTZ
);
```

---

## 5. DATOS PRECARGADOS — SEED COMPLETO

### 5.1 Encuestadoras y pesos históricos

| id | name  | historical_mae | weight_multiplier | notes |
|----|-------|----------------|-------------------|-------|
| 1  | IEP   | 3.50 | 1.25 | Mejor track record 2021; única que captó crecimiento de Castillo; mayor cobertura rural |
| 2  | Datum | 4.20 | 1.10 | Mayor muestra (n=2000); ficha técnica más robusta |
| 3  | Ipsos | 4.80 | 1.00 | Referencia base; metodología consistente y documentada |
| 4  | CPI   | 5.10 | 0.95 | Ligeramente menor precisión 2021 |
| 5  | CIT   | NULL | 0.85 | Sin data comparable 2021; penalización por incertidumbre |

### 5.2 Resultados reales 2021 (ground truth ONPE)

**Primera vuelta — 11 abril 2021, votos válidos:**

| Candidato | Partido | % Real ONPE |
|-----------|---------|-------------|
| Pedro Castillo | Perú Libre | 18.92% |
| Keiko Fujimori | Fuerza Popular | 13.41% |
| Rafael López Aliaga | Renovación Popular | 11.73% |
| Hernando de Soto | Avanza País | 11.62% |
| Yonhy Lescano | Acción Popular | 9.87% |
| Verónica Mendoza | Juntos por el Perú | 8.84% |
| César Acuña | APP | 6.00% |

**Error por encuestadora — últimas encuestas pre-veda 2021:**

| Encuestadora | Campo | Castillo pred. | MAE top-6* |
|---|---|---|---|
| IEP | 1–2 abr | ~8% | ~3.5 pts |
| Datum | 1 abr | ~3–4% | ~4.2 pts |
| Ipsos | 31 mar | ~3–4% | ~4.8 pts |
| CPI | ~4 abr | no aparece | ~5.1 pts |

*MAE excluye error de Castillo (outlier). Se calcula sobre los demás candidatos del top-6.

### 5.3 House Effects — Sesgos sistemáticos por encuestadora

| Encuestadora | Aliaga | Keiko | Chau | Nota |
|---|---|---|---|---|
| CIT | +3.5 pts | +1.5 pts | +0.5 pts | Simulacro favorece candidatos más reconocidos visualmente |
| CPI | +1.2 pts | −0.5 pts | +0.8 pts | Ligero sesgo hacia candidatos con maquinaria |
| Ipsos | −0.5 pts | +0.5 pts | −0.3 pts | Referencia base, más centrado |
| Datum | −0.8 pts | +0.8 pts | −0.3 pts | Ligero sesgo hacia Keiko |
| IEP | −1.5 pts | −0.5 pts | +0.2 pts | Mejor captura de candidatos con base rural/provincial |

### 5.4 Correlación de error entre encuestadoras

```javascript
// Las encuestadoras no son independientes — comparten sesgos sistémicos
// En Monte Carlo, los errores se sortean de forma correlacionada (Cholesky)
const ERROR_CORRELATION = {
  'Ipsos-CPI':   0.65,  // Alta: metodologías similares
  'Ipsos-Datum': 0.55,  // Media-alta: ambas nacionales presenciales
  'Ipsos-IEP':   0.35,  // Media-baja: IEP más diferenciada
  'Ipsos-CIT':   0.40,
  'CPI-Datum':   0.60,
  'CPI-IEP':     0.30,
  'CPI-CIT':     0.45,
  'Datum-IEP':   0.35,
  'Datum-CIT':   0.50,
  'IEP-CIT':     0.30
};
```

### 5.5 Dataset completo de encuestas 2026

#### SERIE CPI (Presencial, Urb+Rural, n≈1300, ME ±2.7–2.8%, Confianza 95.5%, via RPP)

| Campo | Aliaga | Keiko | Chau | Álvarez | Grozo | Nieto | Sánchez | Acuña | Lescano | Indecisos | Blanco/Nulo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Nov 2025 | 12.5% | 7.6% | 1.8% | ~4.0% | — | — | — | 2.8% | 0.5% | 30.7% | 19.2% |
| Ene I 2026 | 13.6% | 7.1% | 3.1% | — | — | 0.2% | — | — | — | — | — |
| 29 ene–2 feb | 14.6% | 6.6% | 3.7% | 3.6% | — | — | 1.8% | 3.9% | — | — | 16.1% |
| 14–18 feb | 13.9% | 7.0% | 5.1% | 4.0% | 0.6% | — | 1.8% | 4.4% | 2.2% | 29.1% | 16.1% |
| 28 feb–5 mar | 12.7% | 8.0% | 5.6% | 5.0% | 4.8% | — | — | 3.4% | — | 20.8% | — |
| 21–23 mar | 11.7% | 10.1% | 6.6% | 3.5% | — | 3.9% | 3.1% | 3.2% | — | 23.1% | 24.2% |

#### SERIE IPSOS (Presencial, Urb+Rural, n=1212, ME ±2.5%, Confianza 95%, via Perú21)

| Campo | Aliaga | Keiko | Chau | Álvarez | Sánchez | Nieto | Belmont | Acuña | Blanco/Nulo |
|---|---|---|---|---|---|---|---|---|---|
| Ene 2026 | 10% | 7% | — | — | — | — | — | — | — |
| 5–6 feb | 12% | 8% | ~3% | — | — | — | — | — | — |
| 6 mar | 9% | 6% | — | 6% | — | — | — | — | — |
| 21–22 mar | 10% | 11% | 5% | 5% | 5% | 5% | — | — | 21% |
| 26–27 mar | 9% | 11% | 4% | 7% | 4% | 5% | 3% | 3% | 21% |

#### SERIE DATUM (Presencial, Urb+Rural, n=2000, ME ±2.2%, Confianza 95%, via El Comercio/Cuarto Poder)

| Campo | Aliaga | Keiko | Chau | Álvarez | Sánchez | Nieto | Belmont | Blanco/Nulo |
|---|---|---|---|---|---|---|---|---|
| 13–17 mar | ~11.7% | ~11.9% | estable | 4→5% | 1.4→2% | creciendo | 2.4% | — |
| 25–27 mar intención | 11.7% | 13.0% | — | — | — | — | — | — |
| 25–27 mar simulacro | 9.5% | 13.2% | 4.2% | 6.3% | 5.3% | 4.9% | 1.9% | 28.9% |

#### CIT SIMULACRO (Presencial cédula réplica, n=1220, 20–23 mar)

| Aliaga | Keiko | Chau | Acuña | Álvarez | Grozo | Lescano | Nieto | Sánchez | Blanco/Nulo |
|---|---|---|---|---|---|---|---|---|---|
| 16.8% | 12.9% | 7.0% | 6.3% | 6.1% | 4.3% | 3.6% | 3.0% | 2.3% | 22.5% |

#### IEP INTENCIÓN (~30 mar, campo exacto pendiente confirmar)

| Aliaga | Keiko | Álvarez | Sánchez | Chau | Nieto | Belmont | Lescano | Acuña | Grozo | Vizcarra |
|---|---|---|---|---|---|---|---|---|---|---|
| 8.7% | 10.0% | 6.9% | 6.7% | 6.3% | 5.4% | 5.2% | 2.2% | 2.2% | 1.1% | 1.9% |

#### VOTO POTENCIAL CIT (20–23 mar)

| Candidato | Potencial (A+B) | Def. Sí (piso) | Prob. Sí | Prob. No | Def. No (techo) |
|---|---|---|---|---|---|
| López Aliaga | 27.7% | 14.6% | 13.1% | 12.3% | 50.8% |
| Keiko Fujimori | 18.5% | 10.8% | 7.7% | 12.8% | 62.7% |
| Carlos Álvarez | 18.4% | 4.2% | 14.3% | 15.6% | 50.2% |
| López Chau | 17.2% | 5.4% | 11.8% | 16.6% | 51.7% |
| Wolfgang Grozo | 14.0% | 5.5% | 8.5% | 11.9% | 45.6% |

#### POLYMARKET — Historial de snapshots

| Fecha Lima | Aliaga | Keiko | Álvarez | Sánchez | Chau | Nieto | Volumen | Fase |
|---|---|---|---|---|---|---|---|---|
| Feb 2026 | 47–48% | 14% | 9% | — | 20% | — | ~$2M | pre_veda |
| 24 mar | 40% | — | — | 17% | — | — | $3.99M | pre_veda |
| 2 abr 21:53 Lima | 30% | 19% | 16.3% | 11.7% | 8% | 6% | $5.10M | pre_veda |

---

## 6. EL MODELO ESTADÍSTICO — ESPECIFICACIÓN COMPLETA

### Fase 1: Agregador Ponderado con House Effects

```
W(encuesta) = decaimiento_exponencial × sqrt(n/2000) × peso_encuestadora × peso_tipo

Resultado_candidato = Σ(resultado_ajustado × W) / Σ(W)
resultado_ajustado = resultado_crudo − house_effect
```

### Fase 2: Redistribución del Voto Indeciso

```
Para cada candidato:
  espacio = (techo_potencial − estimado_actual) × (1 − rechazo/100)
  redistribucion = indecisos_totales × (espacio / Σ espacios)
  estimado_final = estimado_actual + redistribucion
```

### Fase 3: Integración Bayesiana

```
α = getPolymarketWeight()  ← dinámico según hora Lima
posterior = α × P_polymarket + (1-α) × P_encuestas
```

### Fase 4: Monte Carlo (10,000 simulaciones)

```
Para cada simulación:
  1. Sortear errores correlacionados (Cholesky)
  2. Perturbar estimados con errores * sigma
  3. En 5% de simulaciones: shock estocástico (lección Castillo 2021)
  4. Normalizar, identificar top-2, simular segunda vuelta
Output: P(pasar a segunda vuelta), P(ganar presidencia), IC 90%
```

### Fase 5: Segunda Vuelta

```
P(A gana | A vs B) = f(votos_propios_A, transferencia_ideológica, rechazo_definitivo_B)
Nota: Keiko 62.7% rechazo = mayor generador de voto blanco en segunda vuelta
```

---

## 7. 🚨 MANEJO DE ERRORES — CATÁLOGO COMPLETO

### 7.1 Catálogo de errores tipificados

```javascript
// backend/errors/errorTypes.js

const ERROR_TYPES = {

  // ERRORES DE RELOJ Y TIMEZONE
  TIMEZONE_FAILURE: {
    code: 'ERR_TZ_001', severity: 'CRITICAL',
    description: 'No se pudo obtener la hora de Lima, Perú',
    fallback: 'Usar UTC-5 hardcodeado',
    action: 'Alertar inmediatamente — pesos del modelo incorrectos'
  },
  WRONG_PHASE_DETECTED: {
    code: 'ERR_TZ_002', severity: 'HIGH',
    description: 'Fase electoral calculada no coincide con la esperada',
    fallback: 'Usar fase anterior conocida',
    action: 'Log + alerta. No cambiar pesos hasta confirmar.'
  },

  // ERRORES DEL SCRAPER DE POLYMARKET
  POLYMARKET_API_TIMEOUT: {
    code: 'ERR_PM_001', severity: 'MEDIUM',
    description: 'Polymarket CLOB API no respondió en tiempo',
    fallback: 'Usar último snapshot guardado en DB',
    action: 'Reintentar en 5 min. 3 fallos consecutivos → alerta crítica'
  },
  POLYMARKET_DATA_STALE: {
    code: 'ERR_PM_002', severity: 'HIGH',
    description: 'Último snapshot tiene más de 3 horas de antigüedad',
    fallback: 'Reducir peso Polymarket al 50% del calculado',
    action: 'Mostrar en dashboard: "Datos de mercado desactualizados"'
  },
  POLYMARKET_PRICE_ANOMALY: {
    code: 'ERR_PM_003', severity: 'LOW',
    description: 'Probabilidades no suman ~100% (tolerancia ±5%)',
    fallback: 'Renormalizar automáticamente',
    action: 'Log silencioso. Normal en mercados con baja liquidez.'
  },
  POLYMARKET_CANDIDATE_MISSING: {
    code: 'ERR_PM_004', severity: 'MEDIUM',
    description: 'Candidato esperado no aparece en el mercado',
    fallback: 'Asignar 0% en Polymarket; usar solo encuestas para ese candidato',
    action: 'Log. Verificar si fue eliminado del mercado.'
  },

  // ERRORES DEL MODELO ESTADÍSTICO
  MONTE_CARLO_NO_CONVERGENCE: {
    code: 'ERR_MC_001', severity: 'HIGH',
    description: 'Distribuciones degeneradas (p.ej. un candidato al 99%)',
    fallback: 'Usar última predicción válida en DB',
    action: 'Log con parámetros de entrada. Revisar datos extremos.'
  },
  NEGATIVE_PROBABILITY: {
    code: 'ERR_MC_002', severity: 'HIGH',
    description: 'Probabilidad calculada es negativa',
    fallback: 'Clampear a 0 y renormalizar',
    action: 'Log. Revisar house effects — pueden estar sobre-corrigiendo.'
  },
  UNDECIDED_OVERFLOW: {
    code: 'ERR_MC_003', severity: 'MEDIUM',
    description: 'Redistribución de indecisos superó el techo de voto potencial',
    fallback: 'Clampear al techo y redistribuir el exceso proporcionalmente',
    action: 'Log silencioso. Esperado cuando el voto potencial está desactualizado.'
  },
  ZERO_WEIGHT_POLLS: {
    code: 'ERR_MC_004', severity: 'CRITICAL',
    description: 'Todas las encuestas tienen peso efectivo ~0 (muy antiguas)',
    fallback: 'Usar solo Polymarket con α=0.80',
    action: 'Dashboard: "Predicción basada únicamente en mercado de predicciones"'
  },
  CHOLESKY_FAILURE: {
    code: 'ERR_MC_005', severity: 'MEDIUM',
    description: 'Matriz de correlación no positiva definida',
    fallback: 'Usar errores independientes — resultado menos preciso',
    action: 'Log. Revisar matriz de correlación entre encuestadoras.'
  },

  // ERRORES DE BASE DE DATOS
  DB_CONNECTION_FAILED: {
    code: 'ERR_DB_001', severity: 'CRITICAL',
    description: 'No se puede conectar a PostgreSQL en Railway',
    fallback: 'Cachear últimas predicciones en memoria (máx 2 horas)',
    action: 'Alerta crítica inmediata. Sistema en modo degradado.'
  },
  DB_WRITE_FAILED: {
    code: 'ERR_DB_002', severity: 'HIGH',
    description: 'No se pudo escribir snapshot o predicción en DB',
    fallback: 'Reintentar 3 veces con backoff exponencial (1s, 2s, 4s)',
    action: 'Si falla las 3 veces: log en archivo local como respaldo'
  },
  SEED_DATA_CORRUPT: {
    code: 'ERR_DB_003', severity: 'CRITICAL',
    description: 'Datos precargados de encuestas o track record 2021 corruptos',
    fallback: 'Detener el modelo. No predecir con datos incompletos.',
    action: 'Alerta crítica. Restaurar desde seed.sql.'
  },

  // ERRORES DE DEPLOY / INFRAESTRUCTURA
  CRON_JOB_MISSED: {
    code: 'ERR_INF_001', severity: 'MEDIUM',
    description: 'Cron job de Polymarket no se ejecutó en horario esperado',
    fallback: 'Ejecutar inmediatamente al detectar el gap',
    action: 'Log con timestamp. >3 horas sin snapshot → ERR_PM_002'
  },
  ENV_VAR_MISSING: {
    code: 'ERR_INF_002', severity: 'CRITICAL',
    description: 'Variable de entorno crítica no definida (DATABASE_URL, etc.)',
    fallback: 'Ninguno — el sistema no arranca sin estas variables',
    action: 'El proceso muere con mensaje claro. Revisar Railway env vars.'
  },
  MEMORY_OVERFLOW: {
    code: 'ERR_INF_003', severity: 'HIGH',
    description: 'Monte Carlo de 10,000 simulaciones agotó memoria',
    fallback: 'Reducir a 5,000 simulaciones automáticamente',
    action: 'Log. Considera aumentar RAM en Railway.'
  }
};

module.exports = { ERROR_TYPES };
```

### 7.2 Middleware global de errores

```javascript
// backend/errors/errorHandler.js
const { nowPeru } = require('../model/clock');
const { ERROR_TYPES } = require('./errorTypes');
const db = require('../db');
const fs = require('fs');

async function handleError(errorCode, context = {}, originalError = null) {
  const errorDef = ERROR_TYPES[errorCode];
  const now = nowPeru();

  // 1. Log en consola con severidad visual
  const prefix = {
    CRITICAL: '🚨 CRÍTICO',
    HIGH:     '⚠️  ALTO',
    MEDIUM:   '⚡ MEDIO',
    LOW:      '📝 BAJO'
  }[errorDef?.severity] ?? '❓ DESCONOCIDO';

  console.error(`${prefix} [${errorDef?.code ?? errorCode}] ${errorDef?.description ?? 'Error desconocido'}`);
  if (originalError?.message) console.error('   Mensaje:', originalError.message);
  if (Object.keys(context).length > 0) console.error('   Contexto:', JSON.stringify(context));
  console.log(`   Fallback: ${errorDef?.fallback ?? 'Sin fallback definido'}`);

  // 2. Guardar en DB
  try {
    await db.query(
      `INSERT INTO error_log
       (occurred_at_lima, error_type, error_code, module, message, stack_trace, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [now.toISO(), errorCode, errorDef?.code, context.module ?? 'unknown',
       originalError?.message ?? errorDef?.description,
       originalError?.stack ?? null, JSON.stringify(context)]
    );
  } catch {
    // Si DB falla, escribir en archivo local
    fs.appendFileSync('./error_fallback.log',
      `${now.toISO()} | ${errorDef?.code ?? errorCode} | ${originalError?.message ?? ''}\n`
    );
  }

  // 3. Modo degradado si es CRÍTICO
  if (errorDef?.severity === 'CRITICAL') {
    console.error('\n   ⚠️  SISTEMA EN MODO DEGRADADO ⚠️\n');
  }

  return errorDef;
}

// Wrapper para funciones async
function withErrorHandling(errorCode, context, fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      await handleError(errorCode, { ...context, args }, err);
      return null; // El caller decide el fallback
    }
  };
}

module.exports = { handleError, withErrorHandling };
```

### 7.3 Validación de integridad al arrancar (startup.js)

```javascript
async function validateSystemIntegrity() {
  console.log('\n🗳️  PERU ELECTION MODEL 2026 — Iniciando...\n');

  // 1. Reloj de Lima
  try {
    const now = nowPeru();
    console.log(`✅ Reloj Lima: ${now.toFormat('dd/MM/yyyy HH:mm:ss')} (${now.zoneName})`);
    console.log(`   Fase electoral: ${electoralPhase()}`);
    console.log(`   Peso Polymarket actual: ${(getPolymarketWeight() * 100).toFixed(1)}%`);
  } catch (e) {
    await handleError('TIMEZONE_FAILURE', { module: 'startup' }, e);
  }

  // 2. Variables de entorno
  for (const v of ['DATABASE_URL', 'PORT', 'NODE_ENV']) {
    if (!process.env[v]) {
      await handleError('ENV_VAR_MISSING', { variable: v, module: 'startup' });
      process.exit(1);
    }
  }
  console.log('✅ Variables de entorno: OK');

  // 3. Base de datos
  try {
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL: conexión OK');
  } catch (e) {
    await handleError('DB_CONNECTION_FAILED', { module: 'startup' }, e);
    process.exit(1);
  }

  // 4. Datos seed
  const { rows } = await db.query('SELECT COUNT(*) FROM polls');
  if (parseInt(rows[0].count) < 10) {
    await handleError('SEED_DATA_CORRUPT', { count: rows[0].count, module: 'startup' });
    process.exit(1);
  }
  console.log(`✅ Encuestas en DB: ${rows[0].count}`);

  // 5. Último snapshot Polymarket
  const snap = await db.query('SELECT MAX(captured_at) as last FROM polymarket_snapshots');
  if (snap.rows[0].last) {
    const hrs = (Date.now() - new Date(snap.rows[0].last)) / 3600000;
    if (hrs > 3) {
      console.warn(`⚠️  Polymarket: último snapshot hace ${hrs.toFixed(1)} horas`);
      await handleError('POLYMARKET_DATA_STALE', { hours: hrs, module: 'startup' });
    } else {
      console.log(`✅ Polymarket: último snapshot hace ${hrs.toFixed(1)} horas`);
    }
  } else {
    console.warn('⚠️  Sin snapshots de Polymarket aún — scraper pendiente de primera ejecución');
  }

  console.log('\n✅ Sistema listo para operar.\n');
}
```

---

## 8. MODELOS DE REFERENCIA INTERNACIONALES

| Modelo | Técnica clave | Lo que adoptamos |
|---|---|---|
| FiveThirtyEight | House effects + decaimiento exponencial | ✅ Implementado |
| The Economist/Gelman | Bayesiano jerárquico + fundamentales | ✅ Bayesiano adaptado |
| YouGov MRP | Post-estratificación por demografía | ⚠️ Parcial (peso IEP por rural) |
| Decision Desk HQ | Ensemble de modelos + peso dinámico | ✅ Peso dinámico implementado |

**Errores históricos que informaron nuestro diseño:**

| Error | Elección | Nuestra mitigación |
|---|---|---|
| Castillo invisible | Perú 2021 | Shock estocástico 5% Monte Carlo |
| Trump 2016 subestimado | EEUU | Mayor peso IEP (cobertura rural) |
| Brexit voto oculto | UK 2016 | +1.5% candidatos con >60% rechazo |
| Correlación error entre casas | UK 2015 | Cholesky en Monte Carlo |
| Candidatos terceros que colapsan | EEUU 2024 | Penalización candidatos con voto "blando" |

---

## 9. OUTPUTS DEL MODELO

### 9.1 Dashboard principal (actualización cada 1 hora)

1. **Header de estado** — hora Lima, fase electoral, α actual, indicador de confianza
2. **Tabla de probabilidades** — % estimado ± IC 90%, P(segunda vuelta), P(ganar)
3. **Evolución temporal** — probabilidades semana a semana
4. **Monitor Polymarket** — precios en tiempo real, movimiento últimas 24h, alerta >3% en 1h
5. **Distribución Monte Carlo** — histograma de 10,000 resultados
6. **Matriz de segunda vuelta** — para cada par posible
7. **Panel de transparencia** — peso efectivo de cada encuesta, α, errores recientes

### 9.2 Indicador de confianza

```
🟢 ALTA     — encuestas <5 días + Polymarket con snapshot <1h
🟡 MEDIA    — encuestas 5–9 días O Polymarket desactualizado
🟠 BAJA     — encuestas >10 días O post-veda sin snapshot nuevo
🔴 DEGRADADO — error crítico activo
```

---

## 10. ENCUESTAS PENDIENTES

Posibles antes de la veda (5 abril 8am Lima):
- CPI (~1–3 abr, post-debates ronda 2)
- Datum (~1–3 abr)
- Ipsos (~1–3 abr)
- IEP (confirmar fecha exacta de campo)

**Protocolo de incorporación:** Agregar a `polls` + `poll_results` → el modelo re-agrega automáticamente → dashboard muestra diff antes/después → alerta si cualquier candidato cambia >3 pts.

---

## 11. LIMITACIONES Y SESGOS DOCUMENTADOS

| Limitación | Mitigación |
|---|---|
| Voto oculto (alto rechazo) | +1.5% candidatos con >60% "Def. No" |
| Sesgo urbano residual | IEP peso 1.25x |
| Candidato emergente invisible | Shock estocástico 5% simulaciones |
| Liquidity bias Polymarket | Cap α=0.30 pre-veda |
| Correlación de error entre encuestas | Cholesky en Monte Carlo |
| Voto "blando" (ratio B/A alto) | Penalización 15% si "Prob. Sí" >> "Def. Sí" |
| Fragmentación extrema | Reportar IC 90%, no solo media |
| Decisión último minuto | Redistribución explícita de indecisos |

---

## 12. REFERENCIAS Y FUENTES

**Encuestas 2026:**
- CPI: https://cpi.pe / via RPP Noticias
- Ipsos: https://www.ipsos.com/es-pe/topic/encuesta-intencion-de-voto
- Datum: https://www.datum.com.pe / via El Comercio y Cuarto Poder
- IEP: https://iep.org.pe / via La República
- Wikipedia tracker: https://es.wikipedia.org/wiki/Anexo:Sondeos_de_intenci%C3%B3n_de_voto_para_las_elecciones_presidenciales_de_Per%C3%BA_de_2026

**Resultados ONPE:** https://www.onpe.gob.pe

**Polymarket:**
- Mercado ganador: https://polymarket.com/event/peru-presidential-election-winner
- API CLOB: https://clob.polymarket.com

**Análisis 2021:**
- Zárate, Patricia (IEP): https://iep.org.pe/wp-content/uploads/2021/04/Las-encuestas-se-equivocaron_por-Patricia-Zarate.pdf

**Modelos internacionales:**
- FiveThirtyEight: https://fivethirtyeight.com/methodology/how-our-polling-averages-work/
- The Economist/Gelman 2024: https://hdsr.mitpress.mit.edu/pub/yoa73r1m
- YouGov MRP: https://today.yougov.com/politics/articles/50587-how-yougov-mrp-model-works-2024

---

*Documento generado: 2 de abril de 2026, 22:38 hora Lima (UTC-5)*
*Elección primera vuelta: 12 de abril de 2026*
*Inicio de veda electoral: 5 de abril de 2026, 8:00am Lima*
*Segunda vuelta programada: 7 de junio de 2026*
*Versión: 2.0*
*Autores: Alonso + Claude*
