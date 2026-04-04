// NOTA DE CALIBRACIÓN — 3 abril 2026
// Recalibrado con volatilidad peruana (3 de 4 elecciones tuvieron sorpresas):
// - Fat tails: t-Student df=4 en vez de normal (eventos extremos ~3x más frecuentes)
// - Shock negativo al líder: 15% de simulaciones (-5 a -15 pts, redistribuidos)
// - Shock negativo al #2: 10% de simulaciones (-5 a -12 pts)
// - Shock positivo "efecto Castillo" al #3-#6: 10% de simulaciones (+5 a +12 pts)
// - Temporal drift: 0.30 pts/día (2.7 pts a 9 días)
// Total: 35% de simulaciones tienen algún shock (vs 5% anterior)
// Target: Aliaga P(2da vuelta) ~88-92%, P(ganar) ~55-62%

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
 * Matriz de transferencia de votos en segunda vuelta.
 * Para cada candidato eliminado, define qué fracción de sus votos
 * se transfiere a cada posible finalista. Lo que no se transfiere = blanco.
 * Basado en afinidad ideológica real de la política peruana 2026.
 *
 * Clave: 'eliminado'. Valor: { finalista: fracción }
 * Si un finalista no aparece en la lista del eliminado, recibe 0.20 por defecto.
 */
const TRANSFER_AFFINITY = {
  // Aliaga eliminado: derecha conservador — su base va a Keiko,
  // pero forzados entre centro/izquierda sí votan por "mal menor"
  'Rafael López Aliaga': {
    'Keiko Fujimori': 0.62,
    'Carlos Álvarez': 0.38,
    'Roberto Sánchez Palomino': 0.22,
    'López Chau': 0.20,
    'Jorge Nieto': 0.28,
  },
  // Keiko eliminada: fujimorismo va a derecha, pero también al centro
  'Keiko Fujimori': {
    'Rafael López Aliaga': 0.58,
    'Carlos Álvarez': 0.40,
    'Roberto Sánchez Palomino': 0.20,
    'López Chau': 0.18,
    'Jorge Nieto': 0.28,
  },
  // Álvarez eliminado: centro anti-establishment — su base es diversa,
  // parte va a derecha, parte a izquierda, pero prefiere no-establishment
  'Carlos Álvarez': {
    'Rafael López Aliaga': 0.30,
    'Keiko Fujimori': 0.25,
    'Roberto Sánchez Palomino': 0.42, // anti-establishment va a anti-establishment
    'López Chau': 0.38,
    'Jorge Nieto': 0.38,
  },
  // Sánchez eliminado: izquierda rural — antifujimorismo,
  // pero forzados entre derecha y derecha SÍ votan por el "mal menor"
  'Roberto Sánchez Palomino': {
    'Rafael López Aliaga': 0.28,      // mal menor vs Keiko
    'Keiko Fujimori': 0.20,           // antifujimorismo pero algunos sí
    'Carlos Álvarez': 0.50,           // centro aceptable
    'López Chau': 0.60,
    'Jorge Nieto': 0.48,
  },
  // Chau eliminado: izquierda — similar a Sánchez
  'López Chau': {
    'Rafael López Aliaga': 0.25,
    'Keiko Fujimori': 0.20,
    'Carlos Álvarez': 0.45,
    'Roberto Sánchez Palomino': 0.58,
    'Jorge Nieto': 0.42,
  },
  // Nieto eliminado: centro-izquierda progresista
  'Jorge Nieto': {
    'Rafael López Aliaga': 0.25,
    'Keiko Fujimori': 0.22,
    'Carlos Álvarez': 0.42,
    'Roberto Sánchez Palomino': 0.45,
    'López Chau': 0.40,
  },
  // Belmont eliminado: populista independiente
  'Ricardo Belmont': {
    'Rafael López Aliaga': 0.35,
    'Keiko Fujimori': 0.30,
    'Carlos Álvarez': 0.42,
    'Roberto Sánchez Palomino': 0.28,
    'López Chau': 0.25,
  },
  // Acuña eliminado: pragmático, maquinaria norte
  'César Acuña': {
    'Rafael López Aliaga': 0.33,
    'Keiko Fujimori': 0.35,
    'Carlos Álvarez': 0.38,
    'Roberto Sánchez Palomino': 0.25,
    'López Chau': 0.25,
  },
  // Lescano eliminado: izquierda — forzado a elegir SÍ vota
  'Yonhy Lescano': {
    'Rafael López Aliaga': 0.22,
    'Keiko Fujimori': 0.18,
    'Carlos Álvarez': 0.42,
    'Roberto Sánchez Palomino': 0.55,
    'López Chau': 0.50,
  },
  // Pérez Tello eliminada: centro-izquierda — vota con pragmatismo
  'Marisol Pérez Tello': {
    'Rafael López Aliaga': 0.28,
    'Keiko Fujimori': 0.22,
    'Carlos Álvarez': 0.48,
    'Roberto Sánchez Palomino': 0.42,
    'López Chau': 0.40,
  },
  // Grozo eliminado: voto protesta — disperso pero sí vota
  'Wolfgang Grozo': {
    'Rafael López Aliaga': 0.28,
    'Keiko Fujimori': 0.25,
    'Carlos Álvarez': 0.40,
    'Roberto Sánchez Palomino': 0.38,
    'López Chau': 0.35,
  },
};

// Default transfer cuando el eliminado o finalista no está en la matriz
const DEFAULT_TRANSFER = 0.25;

/**
 * Obtiene la fracción de transferencia de un eliminado a un finalista.
 */
function getTransfer(eliminated, finalist) {
  return TRANSFER_AFFINITY[eliminated]?.[finalist] ?? DEFAULT_TRANSFER;
}

/**
 * Simula segunda vuelta con transferencia de votos basada en
 * matriz de afinidad por pares y voto blanco calibrado.
 *
 * Mecánica:
 * 1. Base: votos propios de cada finalista
 * 2. Para cada eliminado: transferir según TRANSFER_AFFINITY
 *    Lo que no se transfiere a ninguno = voto blanco
 * 3. Voto blanco extra si ambos finalistas tienen alto rechazo
 * 4. Incertidumbre de campaña (7 semanas entre vueltas)
 */
function simulateRunoff(finalistA, finalistB, allFirstRoundResults) {
  // Factor de conversión para el blanco extra por doble rechazo
  const rejectionDiscount = 0.35 + Math.random() * 0.20;
  const rejA = ((REJECTION_RATES[finalistA] ?? DEFAULT_REJECTION) / 100) * rejectionDiscount;
  const rejB = ((REJECTION_RATES[finalistB] ?? DEFAULT_REJECTION) / 100) * rejectionDiscount;

  // 1. Base: votos propios
  let votesA = allFirstRoundResults[finalistA] || 0;
  let votesB = allFirstRoundResults[finalistB] || 0;
  let blankVotes = 0;

  // 2. Transferir votos de cada candidato eliminado
  for (const [candidate, pct] of Object.entries(allFirstRoundResults)) {
    if (candidate === finalistA || candidate === finalistB) continue;
    if (pct <= 0) continue;

    // Obtener fracción de transferencia a cada finalista
    const transferToA = getTransfer(candidate, finalistA);
    const transferToB = getTransfer(candidate, finalistB);

    // Normalizar si la suma > 1 (no debería pero por seguridad)
    const totalTransfer = transferToA + transferToB;
    let effectiveToA = transferToA;
    let effectiveToB = transferToB;
    if (totalTransfer > 1.0) {
      effectiveToA = transferToA / totalTransfer;
      effectiveToB = transferToB / totalTransfer;
    }

    votesA += pct * effectiveToA;
    votesB += pct * effectiveToB;

    // Lo que no se transfiere = voto blanco
    const toBlank = 1.0 - effectiveToA - effectiveToB;
    if (toBlank > 0) blankVotes += pct * toBlank;
  }

  // 3. Voto blanco extra por doble rechazo alto
  const rejSum = rejA * 100 + rejB * 100;
  if (rejSum > 100) {
    const extraBlank = (rejSum - 100) * 0.3;
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

  const totalAll = votesA + votesB + blankVotes;
  const blankPct = totalAll > 0 ? (blankVotes / totalAll) * 100 : 0;

  // 4. Incertidumbre propia de segunda vuelta:
  // 7 semanas de campaña entre vueltas — debates, escándalos, movilización.
  // 8 pts de std es conservador pero realista para Perú.
  const runoffUncertainty = 8.0;
  const shockA = randn() * runoffUncertainty;
  const shockB = -shockA * 0.7; // correlación negativa parcial
  votesA += shockA;
  votesB += shockB;

  const winner = votesA >= votesB ? finalistA : finalistB;

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
 * Genera un número aleatorio con distribución t de Student.
 * Fat tails: eventos extremos ocurren ~3x más que con normal.
 * @param {number} df - Grados de libertad (4 = fat tails moderados)
 */
function randt(df = 4) {
  // Ratio of normal / sqrt(chi-squared/df)
  const z = randn();
  let chi2 = 0;
  for (let i = 0; i < df; i++) {
    const n = randn();
    chi2 += n * n;
  }
  return z / Math.sqrt(chi2 / df);
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
  const runoffPairStats = {};

  // Acumuladores de escenarios de riesgo
  const riskCounters = {
    perCandidate: {},  // { candidato: { missesRunoff: 0, winsFirstRound: 0, gets20plus: 0 } }
    top2NotTop2Expected: 0,  // top-2 no es los 2 favoritos del modelo
    surpriseFirstRoundWinner: 0,  // ganador 1ra vuelta fuera del top-3
  };
  for (const c of candidates) {
    riskCounters.perCandidate[c] = { missesRunoff: 0, winsFirstRound: 0, gets20plus: 0, inTop2: 0 };
  }

  for (let sim = 0; sim < nSimulations; sim++) {
    // 1. Errores correlacionados
    const pollsterErrors = correlatedErrors(L);
    const avgError = pollsterErrors.reduce((s, e) => s + e, 0) / pollsterErrors.length;

    // 2. Perturbar estimados con fat tails (t-Student, df=4)
    const perturbed = basePcts.map((pct) => {
      const individualNoise = randt(4) * sigma * 0.5;
      const systemicNoise = avgError * sigma * 0.5;
      return pct + systemicNoise + individualNoise;
    });

    // 3. Shocks estocásticos (calibrados para volatilidad peruana)
    const roll = Math.random();

    // 3a. Shock negativo al líder: 15% de simulaciones
    //     Escándalo, exclusión legal, colapso en debate
    if (roll < 0.15) {
      // Encontrar el líder actual en esta simulación
      let maxIdx = 0;
      for (let i = 1; i < nCandidates; i++) {
        if (perturbed[i] > perturbed[maxIdx]) maxIdx = i;
      }
      const shockSize = 5 + Math.random() * 10; // -5 a -15 pts
      const lost = Math.min(perturbed[maxIdx] - 1, shockSize);
      perturbed[maxIdx] -= lost;
      // Redistribuir al #3, #4, #5
      const sorted = perturbed.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      const receivers = sorted.slice(2, 5).map(s => s.i);
      const perReceiver = lost / receivers.length;
      for (const ri of receivers) perturbed[ri] += perReceiver;
    }
    // 3b. Shock negativo al #2: 10% de simulaciones
    else if (roll < 0.25) {
      const sorted = perturbed.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      if (sorted.length > 1) {
        const secondIdx = sorted[1].i;
        const shockSize = 5 + Math.random() * 7; // -5 a -12 pts
        const lost = Math.min(perturbed[secondIdx] - 1, shockSize);
        perturbed[secondIdx] -= lost;
        const receivers = sorted.slice(2, 5).map(s => s.i);
        const perReceiver = lost / receivers.length;
        for (const ri of receivers) perturbed[ri] += perReceiver;
      }
    }
    // 3c. Shock positivo a candidato menor: 10% de simulaciones
    //     "Efecto Castillo" — candidato del #3-#6 sube fuerte
    else if (roll < 0.35) {
      const sorted = perturbed.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      const eligible = sorted.slice(2, 6);
      if (eligible.length > 0) {
        const luckyIdx = eligible[Math.floor(Math.random() * eligible.length)].i;
        const shockSize = 5 + Math.random() * 7; // +5 a +12 pts
        perturbed[luckyIdx] += shockSize;
      }
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

    // 5b. Conteo de escenarios de riesgo
    riskCounters.perCandidate[candidates[firstIdx]].winsFirstRound++;
    riskCounters.perCandidate[candidates[firstIdx]].inTop2++;
    riskCounters.perCandidate[candidates[secondIdx]].inTop2++;
    for (let i = 0; i < nCandidates; i++) {
      if (i !== firstIdx && i !== secondIdx) riskCounters.perCandidate[candidates[i]].missesRunoff++;
      if (normalized[i] >= 20) riskCounters.perCandidate[candidates[i]].gets20plus++;
    }
    // Top-2 esperado: los 2 candidatos con mayor posterior base
    const expectedTop = basePcts.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const exp1 = expectedTop[0].i, exp2 = expectedTop[1].i;
    if (!((firstIdx === exp1 && secondIdx === exp2) || (firstIdx === exp2 && secondIdx === exp1))) {
      riskCounters.top2NotTop2Expected++;
    }
    // Sorpresa: ganador no está en top-3 del posterior base
    const exp3 = expectedTop[2].i;
    if (firstIdx !== exp1 && firstIdx !== exp2 && firstIdx !== exp3) {
      riskCounters.surpriseFirstRoundWinner++;
    }

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

  // Escenarios de riesgo
  const pct = (n) => parseFloat(((n / nSimulations) * 100).toFixed(1));
  const topByMean = Object.entries(results).sort((a, b) => b[1].mean - a[1].mean);
  const riskScenarios = {
    top2_not_expected: pct(riskCounters.top2NotTop2Expected),
    surprise_winner: pct(riskCounters.surpriseFirstRoundWinner),
    candidates: topByMean.slice(0, 6).map(([name, data]) => ({
      candidate: name,
      misses_runoff: pct(riskCounters.perCandidate[name].missesRunoff),
      wins_first_round: pct(riskCounters.perCandidate[name].winsFirstRound),
      in_top2: pct(riskCounters.perCandidate[name].inTop2),
      gets_20plus: pct(riskCounters.perCandidate[name].gets20plus),
    }))
  };

  return { results, runoffSummary, riskScenarios };
}

module.exports = { runMonteCarlo, simulateRunoff, ERROR_CORRELATION, POLLSTER_ORDER, TRANSFER_AFFINITY };
