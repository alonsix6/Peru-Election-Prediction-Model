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
 * Rechazo definitivo por candidato — "Def. No" de CIT (sección 5.5).
 * Techo duro: si 62.7% dice "definitivamente NO Keiko", ese % no le transferirá votos.
 */
const REJECTION_RATES = {
  'Rafael López Aliaga': 50.8,
  'Keiko Fujimori':      62.7,
  'Carlos Álvarez':      50.2,
  'López Chau':          51.7,
  'Wolfgang Grozo':      45.6
};

const DEFAULT_REJECTION = 50.0;

/**
 * Bloques ideológicos para transferencia de votos en segunda vuelta.
 * Votos de un eliminado se transfieren 70% al finalista de su bloque, 30% al otro.
 * Si ningún finalista es de su bloque, split 50/50.
 */
const IDEOLOGICAL_BLOCS = {
  derecha:          ['Rafael López Aliaga', 'Keiko Fujimori', 'Jorge Nieto', 'Ricardo Belmont'],
  centro_derecha:   ['López Chau', 'Carlos Álvarez', 'Carlos Espá'],
  centro_izquierda: ['Roberto Sánchez Palomino', 'Yonhy Lescano', 'Marisol Pérez Tello']
};

/**
 * Retorna el bloque ideológico de un candidato.
 */
function getBloc(candidate) {
  for (const [bloc, members] of Object.entries(IDEOLOGICAL_BLOCS)) {
    if (members.includes(candidate)) return bloc;
  }
  return null; // Sin bloque definido
}

/**
 * Simula segunda vuelta con transferencia de votos y voto blanco.
 *
 * Mecánica:
 * 1. Base: votos propios de cada finalista de primera vuelta
 * 2. Para cada candidato eliminado:
 *    a. Transferencia bruta según afinidad ideológica (70/30 o 50/50)
 *    b. Techo duro de rechazo: bruta × (1 - rejection / 100)
 *    c. Resto no transferido = voto blanco
 * 3. Voto blanco extra si rechazo[A] + rechazo[B] > 100
 * 4. Ganador = quien tenga más votos netos
 *
 * @param {string} finalistA - Nombre del candidato A (1ro en primera vuelta)
 * @param {string} finalistB - Nombre del candidato B (2do en primera vuelta)
 * @param {Object} allFirstRoundResults - { candidate: pct } de primera vuelta
 * @returns {Object} { winner, votesA, votesB, blankVotes, blankPct }
 */
function simulateRunoff(finalistA, finalistB, allFirstRoundResults) {
  const rejA = (REJECTION_RATES[finalistA] ?? DEFAULT_REJECTION) / 100;
  const rejB = (REJECTION_RATES[finalistB] ?? DEFAULT_REJECTION) / 100;

  const blocA = getBloc(finalistA);
  const blocB = getBloc(finalistB);

  // 1. Base: votos propios
  let votesA = allFirstRoundResults[finalistA] || 0;
  let votesB = allFirstRoundResults[finalistB] || 0;
  let blankVotes = 0;

  // 2. Transferir votos de cada candidato eliminado
  for (const [candidate, pct] of Object.entries(allFirstRoundResults)) {
    if (candidate === finalistA || candidate === finalistB) continue;
    if (pct <= 0) continue;

    const blocElim = getBloc(candidate);

    // 2a. Transferencia bruta según afinidad ideológica
    let bruteToA, bruteToB;
    if (blocElim !== null && blocElim === blocA && blocElim !== blocB) {
      // Eliminado afín a A
      bruteToA = pct * 0.70;
      bruteToB = pct * 0.30;
    } else if (blocElim !== null && blocElim === blocB && blocElim !== blocA) {
      // Eliminado afín a B
      bruteToA = pct * 0.30;
      bruteToB = pct * 0.70;
    } else if (blocElim !== null && blocElim === blocA && blocElim === blocB) {
      // Ambos finalistas son del mismo bloque que el eliminado
      bruteToA = pct * 0.50;
      bruteToB = pct * 0.50;
    } else {
      // Sin bloque definido o bloque distinto a ambos: split 50/50
      bruteToA = pct * 0.50;
      bruteToB = pct * 0.50;
    }

    // 2b. Aplicar techo duro de rechazo
    const netToA = bruteToA * (1 - rejA);
    const netToB = bruteToB * (1 - rejB);

    // 2c. Lo que no se transfiere = voto blanco
    const lostToBlank = (bruteToA - netToA) + (bruteToB - netToB);

    votesA += netToA;
    votesB += netToB;
    blankVotes += lostToBlank;
  }

  // 3. Voto blanco base adicional por doble rechazo alto
  const rejSum = rejA * 100 + rejB * 100; // Volver a porcentaje
  if (rejSum > 100) {
    const extraBlank = (rejSum - 100) * 0.3;
    // Restar proporcionalmente de ambos finalistas
    const totalVotes = votesA + votesB;
    if (totalVotes > 0) {
      votesA -= extraBlank * (votesA / totalVotes);
      votesB -= extraBlank * (votesB / totalVotes);
      blankVotes += extraBlank;
    }
  }

  // Clamp a 0
  votesA = Math.max(0, votesA);
  votesB = Math.max(0, votesB);

  const totalValid = votesA + votesB;
  const totalAll = votesA + votesB + blankVotes;
  const blankPct = totalAll > 0 ? (blankVotes / totalAll) * 100 : 0;

  // 4. Ganador — agregar un poco de ruido para que no sea determinista
  const noise = randn() * 1.5; // ±1.5 pts de ruido electoral
  const finalA = votesA + noise;
  const finalB = votesB - noise;

  const winner = finalA >= finalB ? finalistA : finalistB;

  return {
    winner,
    votesA: parseFloat(votesA.toFixed(2)),
    votesB: parseFloat(votesB.toFixed(2)),
    blankVotes: parseFloat(blankVotes.toFixed(2)),
    blankPct: parseFloat(blankPct.toFixed(2))
  };
}

// ─── Funciones auxiliares de álgebra lineal ──────────────────

/**
 * Construye la matriz de correlación 5x5 entre encuestadoras.
 */
function buildCorrelationMatrix() {
  const n = POLLSTER_ORDER.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
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
 * Retorna L (triangular inferior). Null si no es positiva definida.
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
        if (diag <= 0) return null;
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

// ─── Motor principal Monte Carlo ────────────────────────────

/**
 * Ejecuta simulación Monte Carlo.
 *
 * Algoritmo (sección 6, Fase 4):
 *   1. Sortear errores correlacionados (Cholesky)
 *   2. Perturbar estimados con errores × sigma
 *   3. En 5% de simulaciones: shock estocástico (lección Castillo 2021)
 *   4. Normalizar, identificar top-2, simular segunda vuelta con simulateRunoff()
 *
 * @param {Object} posterior - { candidate: { posterior_pct, ... } }
 * @param {number} nSimulations - Número de simulaciones (default 10,000)
 * @returns {Object} results + runoffStats
 */
function runMonteCarlo(posterior, nSimulations = 10_000) {
  const candidates = Object.keys(posterior);
  const nCandidates = candidates.length;
  const basePcts = candidates.map(c => posterior[c].posterior_pct);

  const sigma = 3.0;

  // Cholesky
  const corrMatrix = buildCorrelationMatrix();
  let L = cholesky(corrMatrix);

  if (!L) {
    handleError('CHOLESKY_FAILURE', { module: 'montecarlo' });
    L = Array.from({ length: POLLSTER_ORDER.length }, (_, i) =>
      Array.from({ length: POLLSTER_ORDER.length }, (_, j) => i === j ? 1 : 0)
    );
  }

  // Acumuladores
  const simResults = candidates.map(() => []);
  const runoffCount = candidates.map(() => 0);
  const winCount = candidates.map(() => 0);

  // Acumuladores de segunda vuelta por par
  const runoffPairStats = {};   // "A vs B" → { countA, countB, blankSum, count }

  for (let sim = 0; sim < nSimulations; sim++) {
    // 1. Errores correlacionados
    const pollsterErrors = correlatedErrors(L);
    const avgError = pollsterErrors.reduce((s, e) => s + e, 0) / pollsterErrors.length;

    // 2. Perturbar estimados
    const perturbed = basePcts.map((pct) => {
      const individualNoise = randn() * sigma * 0.5;
      const systemicNoise = avgError * sigma * 0.5;
      return pct + systemicNoise + individualNoise;
    });

    // 3. Shock estocástico 5%
    if (Math.random() < 0.05) {
      const shockIdx = Math.floor(Math.random() * nCandidates);
      const shockSize = 3 + Math.random() * 5;
      perturbed[shockIdx] += shockSize;
    }

    // 4. Clamp y normalizar
    const clamped = perturbed.map(v => Math.max(0.1, v));
    const normalized = normalize(clamped, 100);

    for (let i = 0; i < nCandidates; i++) {
      simResults[i].push(normalized[i]);
    }

    // 5. Identificar top-2
    const indexed = normalized.map((v, i) => ({ idx: i, pct: v }));
    indexed.sort((a, b) => b.pct - a.pct);
    const firstIdx = indexed[0].idx;
    const secondIdx = indexed[1].idx;

    runoffCount[firstIdx]++;
    runoffCount[secondIdx]++;

    // 6. Segunda vuelta con simulateRunoff()
    const finalistA = candidates[firstIdx];
    const finalistB = candidates[secondIdx];
    const firstRoundResults = {};
    for (let i = 0; i < nCandidates; i++) {
      firstRoundResults[candidates[i]] = normalized[i];
    }

    const runoff = simulateRunoff(finalistA, finalistB, firstRoundResults);

    if (runoff.winner === finalistA) {
      winCount[firstIdx]++;
    } else {
      winCount[secondIdx]++;
    }

    // Acumular stats del par
    const pairKey = [finalistA, finalistB].sort().join(' vs ');
    if (!runoffPairStats[pairKey]) {
      runoffPairStats[pairKey] = { wins: {}, blankSum: 0, count: 0 };
    }
    const pair = runoffPairStats[pairKey];
    pair.wins[runoff.winner] = (pair.wins[runoff.winner] || 0) + 1;
    pair.blankSum += runoff.blankPct;
    pair.count++;
  }

  // Estadísticas finales por candidato
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

  // Estadísticas de segunda vuelta por par más frecuente
  const runoffSummary = Object.entries(runoffPairStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([pair, stats]) => ({
      pair,
      frequency: parseFloat(((stats.count / nSimulations) * 100).toFixed(1)),
      wins: Object.fromEntries(
        Object.entries(stats.wins).map(([c, n]) => [c, parseFloat(((n / stats.count) * 100).toFixed(1))])
      ),
      avg_blank_pct: parseFloat((stats.blankSum / stats.count).toFixed(1))
    }));

  return { results, runoffSummary };
}

module.exports = { runMonteCarlo, simulateRunoff, ERROR_CORRELATION, POLLSTER_ORDER, IDEOLOGICAL_BLOCS };
