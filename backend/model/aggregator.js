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
    'López Chau':          +0.5
  },
  CPI: {
    'Rafael López Aliaga': +1.2,
    'Keiko Fujimori':      -0.5,
    'López Chau':          +0.8
  },
  Ipsos: {
    'Rafael López Aliaga': -0.5,
    'Keiko Fujimori':      +0.5,
    'López Chau':          -0.3
  },
  Datum: {
    'Rafael López Aliaga': -0.8,
    'Keiko Fujimori':      +0.8,
    'López Chau':          -0.3
  },
  IEP: {
    'Rafael López Aliaga': -1.5,
    'Keiko Fujimori':      -0.5,
    'López Chau':          +0.2
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
 * @returns {Object} - { candidate: { weighted_pct, combined_error, n_polls } }
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
          errors: [],
          n_polls: 0
        };
      }

      accum[candidate].weightedSum += adjustedPct * W;
      accum[candidate].totalWeight += W;
      accum[candidate].n_polls += 1;

      // Acumular error para el cálculo de incertidumbre combinada
      if (poll.margin_error) {
        accum[candidate].errors.push({
          margin_error: poll.margin_error,
          weight: W
        });
      }
    }
  }

  // Calcular resultado final por candidato
  const aggregated = {};

  for (const [candidate, data] of Object.entries(accum)) {
    const weighted_pct = data.totalWeight > 0
      ? data.weightedSum / data.totalWeight
      : 0;

    // Error combinado ponderado: sqrt(Σ(w_i² × me_i²) / (Σw_i)²)
    // Esto da el error ponderado del promedio
    let combined_error = 0;
    if (data.errors.length > 0) {
      const sumWeightedErrorSq = data.errors.reduce(
        (sum, e) => sum + (e.weight * e.weight * e.margin_error * e.margin_error), 0
      );
      combined_error = Math.sqrt(sumWeightedErrorSq) / data.totalWeight;
    }

    aggregated[candidate] = {
      weighted_pct: Math.max(0, weighted_pct), // Clamp negativo a 0
      combined_error,
      n_polls: data.n_polls
    };
  }

  return aggregated;
}

module.exports = { aggregatePolls, HOUSE_EFFECTS, getHouseEffect };
