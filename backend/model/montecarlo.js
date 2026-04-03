const { handleError } = require('../errors/errorHandler');

/**
 * Correlación de error entre encuestadoras (sección 5.4).
 * Usado para generar errores correlacionados via Cholesky.
 */
const ERROR_CORRELATION = {
  'Ipsos-CPI':   0.65,
  'Ipsos-Datum': 0.55,
  'Ipsos-IEP':   0.35,
  'Ipsos-CIT':   0.40,
  'CPI-Datum':   0.60,
  'CPI-IEP':     0.30,
  'CPI-CIT':     0.45,
  'Datum-IEP':   0.35,
  'Datum-CIT':   0.50,
  'IEP-CIT':     0.30
};

const POLLSTER_ORDER = ['Ipsos', 'CPI', 'Datum', 'IEP', 'CIT'];

/**
 * Datos de rechazo para segunda vuelta (sección 5.5 + plan).
 * Keiko 62.7% = mayor generador de voto blanco.
 */
const REJECTION_RATES = {
  'Rafael López Aliaga': 50.8,
  'Keiko Fujimori':      62.7,
  'Carlos Álvarez':      50.2,
  'López Chau':          51.7,
  'Wolfgang Grozo':      45.6
};

/**
 * Construye la matriz de correlación 5x5 entre encuestadoras.
 */
function buildCorrelationMatrix() {
  const n = POLLSTER_ORDER.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0; // Diagonal = 1
    for (let j = i + 1; j < n; j++) {
      const key1 = `${POLLSTER_ORDER[i]}-${POLLSTER_ORDER[j]}`;
      const key2 = `${POLLSTER_ORDER[j]}-${POLLSTER_ORDER[i]}`;
      const corr = ERROR_CORRELATION[key1] || ERROR_CORRELATION[key2] || 0;
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }

  return matrix;
}

/**
 * Descomposición de Cholesky: M = L × L^T
 * Retorna L (triangular inferior).
 * Si la matriz no es positiva definida, retorna null.
 */
function cholesky(matrix) {
  const n = matrix.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        const diag = matrix[i][i] - sum;
        if (diag <= 0) return null; // No positiva definida
        L[i][j] = Math.sqrt(diag);
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * Genera un número aleatorio con distribución normal estándar (Box-Muller).
 */
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Genera errores correlacionados usando Cholesky.
 * @param {Array} L - Matriz L de Cholesky
 * @returns {Array} - Vector de errores correlacionados (uno por encuestadora)
 */
function correlatedErrors(L) {
  const n = L.length;
  const z = Array.from({ length: n }, () => randn());
  const errors = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      errors[i] += L[i][j] * z[j];
    }
  }

  return errors;
}

/**
 * Normaliza un array de porcentajes para que sumen targetSum.
 */
function normalize(values, targetSum = 100) {
  const total = values.reduce((s, v) => s + v, 0);
  if (total <= 0) return values;
  return values.map(v => (v / total) * targetSum);
}

/**
 * Ejecuta simulación Monte Carlo.
 *
 * Algoritmo (sección 6, Fase 4):
 *   1. Sortear errores correlacionados (Cholesky)
 *   2. Perturbar estimados con errores × sigma
 *   3. En 5% de simulaciones: shock estocástico (lección Castillo 2021)
 *   4. Normalizar, identificar top-2, simular segunda vuelta
 *
 * @param {Object} posterior - Salida de bayesianIntegration().candidates:
 *   { candidate: { posterior_pct, ... } }
 * @param {number} nSimulations - Número de simulaciones (default 10,000)
 * @returns {Object} - { candidate: { mean, p10, p90, prob_runoff, prob_win } }
 */
function runMonteCarlo(posterior, nSimulations = 10_000) {
  const candidates = Object.keys(posterior);
  const nCandidates = candidates.length;
  const basePcts = candidates.map(c => posterior[c].posterior_pct);

  // Sigma base: promedio de errores combinados o 3 pts por defecto
  const sigma = 3.0;

  // Cholesky para errores correlacionados entre encuestadoras
  const corrMatrix = buildCorrelationMatrix();
  let L = cholesky(corrMatrix);

  if (!L) {
    handleError('CHOLESKY_FAILURE', { module: 'montecarlo' });
    // Fallback: errores independientes
    L = Array.from({ length: POLLSTER_ORDER.length }, (_, i) =>
      Array.from({ length: POLLSTER_ORDER.length }, (_, j) => i === j ? 1 : 0)
    );
  }

  // Acumuladores
  const simResults = candidates.map(() => []);
  const runoffCount = candidates.map(() => 0);  // Veces en top-2
  const winCount = candidates.map(() => 0);      // Veces ganador final

  for (let sim = 0; sim < nSimulations; sim++) {
    // 1. Generar errores correlacionados
    const pollsterErrors = correlatedErrors(L);

    // Error promedio ponderado (mezcla de las 5 encuestadoras)
    const avgError = pollsterErrors.reduce((s, e) => s + e, 0) / pollsterErrors.length;

    // 2. Perturbar estimados
    const perturbed = basePcts.map((pct, i) => {
      // Cada candidato recibe el error sistémico + componente individual
      const individualNoise = randn() * sigma * 0.5;
      const systemicNoise = avgError * sigma * 0.5;
      return pct + systemicNoise + individualNoise;
    });

    // 3. Shock estocástico en 5% de simulaciones (lección Castillo 2021)
    if (Math.random() < 0.05) {
      // Un candidato aleatorio gana 3-8 pts extras
      const shockIdx = Math.floor(Math.random() * nCandidates);
      const shockSize = 3 + Math.random() * 5;
      perturbed[shockIdx] += shockSize;
    }

    // 4. Clamp negativos y normalizar
    const clamped = perturbed.map(v => Math.max(0.1, v));
    const normalized = normalize(clamped, 100);

    // Guardar resultado de esta simulación
    for (let i = 0; i < nCandidates; i++) {
      simResults[i].push(normalized[i]);
    }

    // 5. Identificar top-2 para segunda vuelta
    const indexed = normalized.map((v, i) => ({ idx: i, pct: v }));
    indexed.sort((a, b) => b.pct - a.pct);
    const first = indexed[0];
    const second = indexed[1];

    runoffCount[first.idx]++;
    runoffCount[second.idx]++;

    // 6. Simular segunda vuelta entre top-2
    const cand1 = candidates[first.idx];
    const cand2 = candidates[second.idx];
    const rej1 = (REJECTION_RATES[cand1] || 45) / 100;
    const rej2 = (REJECTION_RATES[cand2] || 45) / 100;

    // P(cand1 gana) basada en votos propios + transferencia ajustada por rechazo del rival
    // Mayor rechazo del rival = más voto blanco = menor transferencia hacia el rival
    const strength1 = first.pct * (1 + rej2 * 0.3);  // Se beneficia del rechazo al rival
    const strength2 = second.pct * (1 + rej1 * 0.3);
    const pWin1 = strength1 / (strength1 + strength2);

    if (Math.random() < pWin1) {
      winCount[first.idx]++;
    } else {
      winCount[second.idx]++;
    }
  }

  // Calcular estadísticas finales
  const results = {};

  for (let i = 0; i < nCandidates; i++) {
    const sims = simResults[i].sort((a, b) => a - b);
    const mean = sims.reduce((s, v) => s + v, 0) / nSimulations;
    const p10 = sims[Math.floor(nSimulations * 0.10)];
    const p90 = sims[Math.floor(nSimulations * 0.90)];

    results[candidates[i]] = {
      mean: parseFloat(mean.toFixed(2)),
      p10: parseFloat(p10.toFixed(2)),
      p90: parseFloat(p90.toFixed(2)),
      prob_runoff: parseFloat(((runoffCount[i] / nSimulations) * 100).toFixed(2)),
      prob_win: parseFloat(((winCount[i] / nSimulations) * 100).toFixed(2))
    };
  }

  return results;
}

module.exports = { runMonteCarlo, ERROR_CORRELATION, POLLSTER_ORDER };
