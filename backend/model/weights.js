const { DateTime } = require('luxon');
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
