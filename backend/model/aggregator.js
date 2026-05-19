const { getPollWeight } = require('./weights');

/**
 * House effects — sesgos sistemáticos por encuestadora (sección 5.3).
 * Positivo = la encuestadora sobreestima a ese candidato.
 * Se RESTA del resultado crudo para corregir.
 */
const HOUSE_EFFECTS = {
  CIT: {
    'Rafael López Aliaga': +3.5,
    'Keiko Fujimori':      +1.5,
    'López Chau':          +0.5,
    'Roberto Sánchez Palomino': 0.0,  // sin datos R2 CIT disponibles
  },
  CPI: {
    'Rafael López Aliaga': +1.2,
    'Keiko Fujimori':      -0.5,
    'López Chau':          +0.8,
    'Roberto Sánchez Palomino': 0.0,  // sin datos R2 CPI disponibles
  },
  Ipsos: {
    'Rafael López Aliaga': -0.5,
    'Keiko Fujimori':      +0.5,
    'López Chau':          -0.3,
    // R2: Ipsos (38%) muestra a Sánchez ~6pp más alto que IEP (32%) → sesgo relativo +3pp
    'Roberto Sánchez Palomino': +3.0,
  },
  Datum: {
    'Rafael López Aliaga': -0.8,
    'Keiko Fujimori':      +0.8,
    'López Chau':          -0.3,
    'Roberto Sánchez Palomino': 0.0,  // sin datos R2 Datum disponibles
  },
  IEP: {
    'Rafael López Aliaga': -1.5,
    'Keiko Fujimori':      -0.5,
    'López Chau':          +0.2,
    // R2: IEP (32%) muestra a Sánchez ~6pp más bajo que Ipsos (38%) → sesgo relativo -3pp
    'Roberto Sánchez Palomino': -3.0,
  }
};

/**
 * Obtiene el house effect para una encuestadora y candidato.
 * Si no hay house effect definido, retorna 0.
 */
function getHouseEffect(pollsterName, candidate) {
  return (HOUSE_EFFECTS[pollsterName] && HOUSE_EFFECTS[pollsterName][candidate]) || 0;
}

/**
 * Agrega encuestas ponderadas con house effects.
 *
 * Fórmula (sección 6, Fase 1):
 *   W(encuesta) = decaimiento × sqrt(n/2000) × peso_encuestadora × peso_tipo
 *   Resultado_candidato = Σ(resultado_ajustado × W) / Σ(W)
 *   resultado_ajustado = resultado_crudo − house_effect
 *
 * @param {Array} polls - Encuestas con estructura:
 *   { pollster_name, field_end, sample_n, poll_type, margin_error,
 *     results: [{ candidate, pct_raw }] }
 * @param {Object} pollsterWeights - { pollster_name: weight_multiplier }
 * @returns {Object} - { candidate: { weighted_pct, n_polls } }
 */
function aggregatePolls(polls, pollsterWeights) {
  // Acumuladores por candidato
  const accum = {};  // { candidate: { weightedSum, totalWeight, errors[], n_polls } }

  for (const poll of polls) {
    const multiplier = pollsterWeights[poll.pollster_name] || 1.00;
    const W = getPollWeight(poll, multiplier);

    // Si el peso es despreciable, saltar esta encuesta
    if (W < 0.001) continue;

    for (const result of poll.results) {
      const candidate = result.candidate;
      const houseEffect = getHouseEffect(poll.pollster_name, candidate);
      const adjustedPct = result.pct_raw - houseEffect;

      if (!accum[candidate]) {
        accum[candidate] = {
          weightedSum: 0,
          totalWeight: 0,
          n_polls: 0
        };
      }

      accum[candidate].weightedSum += adjustedPct * W;
      accum[candidate].totalWeight += W;
      accum[candidate].n_polls += 1;
    }
  }

  // Calcular resultado final por candidato
  const aggregated = {};

  for (const [candidate, data] of Object.entries(accum)) {
    const weighted_pct = data.totalWeight > 0
      ? data.weightedSum / data.totalWeight
      : 0;

    aggregated[candidate] = {
      weighted_pct: Math.max(0, weighted_pct),
      n_polls: data.n_polls
    };
  }

  return aggregated;
}

module.exports = { aggregatePolls, HOUSE_EFFECTS, getHouseEffect };
