const { getPolymarketWeight } = require('./weights');

/**
 * Integración Bayesiana encuestas + Polymarket.
 *
 * Fórmula (sección 6, Fase 3):
 *   α = getPolymarketWeight(volumeUSD)  ← dinámico según hora Lima
 *   posterior = α × P_polymarket + (1-α) × P_encuestas
 *
 * @param {Object} pollsEstimate - Salida de redistributeUndecided():
 *   { candidate: { estimated_pct, ... } }
 * @param {Object} polymarketData - Datos más recientes de Polymarket:
 *   { candidate: probability (0-100) }
 * @param {number} volumeUSD - Volumen total del evento en USD
 * @returns {Object} - { candidates: { candidate: { posterior_pct, polls_pct, polymarket_pct } },
 *                       polymarket_weight, polls_weight }
 */
function bayesianIntegration(pollsEstimate, polymarketData, volumeUSD, overrideAlpha = null) {
  const α = overrideAlpha !== null ? overrideAlpha : getPolymarketWeight(volumeUSD);

  // Post-elección: no hay integración
  if (α === null) {
    return {
      candidates: Object.fromEntries(
        Object.entries(pollsEstimate).map(([c, d]) => [c, {
          posterior_pct: d.estimated_pct,
          polls_pct: d.estimated_pct,
          polymarket_pct: null,
          source: 'polls_only'
        }])
      ),
      polymarket_weight: 0,
      polls_weight: 1
    };
  }

  const pollsWeight = 1 - α;
  const candidates = {};

  // Recopilar todos los candidatos de ambas fuentes
  const allCandidates = new Set([
    ...Object.keys(pollsEstimate),
    ...Object.keys(polymarketData)
  ]);

  for (const candidate of allCandidates) {
    const pollsPct = pollsEstimate[candidate]?.estimated_pct ?? 0;
    const polyPct = polymarketData[candidate] ?? 0;

    let posterior_pct;
    let source;

    if (pollsPct > 0 && polyPct > 0) {
      // Ambas fuentes disponibles: integración bayesiana
      posterior_pct = α * polyPct + pollsWeight * pollsPct;
      source = 'integrated';
    } else if (pollsPct > 0) {
      // Solo encuestas (candidato no está en Polymarket)
      posterior_pct = pollsPct;
      source = 'polls_only';
    } else {
      // Solo Polymarket (candidato no está en encuestas)
      posterior_pct = polyPct * α;
      source = 'polymarket_only';
    }

    candidates[candidate] = {
      posterior_pct,
      polls_pct: pollsPct,
      polymarket_pct: polyPct || null,
      source
    };
  }

  return {
    candidates,
    polymarket_weight: α,
    polls_weight: pollsWeight
  };
}

module.exports = { bayesianIntegration };
